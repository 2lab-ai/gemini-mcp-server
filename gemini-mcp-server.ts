#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, mkdtempSync, rmdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

function createSystemPromptFile(systemPrompt: string): string {
  const tempDir = mkdtempSync(join(tmpdir(), 'gemini-mcp-'));
  const filePath = join(tempDir, 'SYSTEM.md');
  writeFileSync(filePath, systemPrompt, 'utf-8');
  return filePath;
}

function cleanupSystemPromptFile(filePath: string): void {
  try {
    unlinkSync(filePath);
    // Remove the temp directory too
    const tempDir = filePath.substring(0, filePath.lastIndexOf('/'));
    rmdirSync(tempDir);
  } catch {
    // Ignore cleanup errors
  }
}

const server = new Server(
  {
    name: "gemini-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

interface SessionInfo {
  index: number;
  uuid: string;
}

async function listSessions(): Promise<SessionInfo[]> {
  try {
    const { stdout } = await execAsync('gemini --list-sessions');
    // Output format: "  1. Prompt... (Time) [UUID]"
    const sessions: SessionInfo[] = [];
    const regex = /^\s*(\d+)\.\s+.*?\[([a-f0-9\-]+)\]/gm;
    let match;
    while ((match = regex.exec(stdout)) !== null) {
      sessions.push({
        index: parseInt(match[1], 10),
        uuid: match[2]
      });
    }
    return sessions;
  } catch (error) {
    return [];
  }
}

async function getLatestSessionId(): Promise<string | null> {
  const sessions = await listSessions();
  // sessions are ordered by index (1 = oldest), so last one is the most recent
  return sessions.length > 0 ? sessions[sessions.length - 1].uuid : null;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "chat",
        description: "Start a new Gemini session with a prompt. Returns the response and the new Session ID.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt to start the session with."
            },
            model: {
              type: "string",
              description: "Optional: The model to use (e.g., 'gemini-3-pro', 'gemini-3-flash')."
            },
            systemPrompt: {
              type: "string",
              description: "Optional: System prompt to set the assistant's behavior."
            },
            cwd: {
              type: "string",
              description: "Optional: Working directory for the gemini CLI execution."
            }
          },
          required: ["prompt"],
        },
      },
      {
        name: "chat-reply",
        description: "Continue an existing Gemini session.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt to continue the conversation."
            },
            sessionId: {
              type: "string",
              description: "The session ID to continue. If not provided, attempts to use the latest session."
            },
            model: {
              type: "string",
              description: "Optional: The model to use for this turn."
            },
            systemPrompt: {
              type: "string",
              description: "Optional: System prompt to set the assistant's behavior."
            },
            cwd: {
              type: "string",
              description: "Optional: Working directory for the gemini CLI execution."
            }
          },
          required: ["prompt"],
        },
      },
    ],
  };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "chat") {
        const { prompt, model, systemPrompt, cwd } = args as { prompt: string; model?: string; systemPrompt?: string; cwd?: string };

        const safePrompt = JSON.stringify(prompt);

        let command = `gemini ${safePrompt} --output-format json`;
        if (model) {
            command += ` -m ${model}`;
        }

        // Handle system prompt via temp file and GEMINI_SYSTEM_MD env var
        let systemPromptFile: string | null = null;
        const env = { ...process.env };
        if (systemPrompt) {
            systemPromptFile = createSystemPromptFile(systemPrompt);
            env.GEMINI_SYSTEM_MD = systemPromptFile;
        }

        try {
            const { stdout } = await execAsync(command, {
                encoding: 'utf-8',
                env,
                ...(cwd ? { cwd } : {})
            });

            let responseText = "";
            let sessionId: string | null = null;

            try {
                const json = JSON.parse(stdout);
                responseText = json.response || JSON.stringify(json);
                // Extract session_id from JSON response (Gemini CLI includes this)
                sessionId = json.session_id || null;
            } catch (e) {
                responseText = stdout as string;
            }

            // Fallback: get session ID from list if not in response
            if (!sessionId) {
                sessionId = await getLatestSessionId();
            }

            return {
                content: [
                    {
                        type: "text",
                        text: responseText
                    }
                ],
                _meta: sessionId ? { sessionId } : undefined
            };
        } finally {
            if (systemPromptFile) {
                cleanupSystemPromptFile(systemPromptFile);
            }
        }
    }

    if (name === "chat-reply") {
        const { prompt, sessionId, model, systemPrompt, cwd } = args as { prompt: string; sessionId?: string; model?: string; systemPrompt?: string; cwd?: string };

        // Determine resume target: UUID or "latest"
        const resumeTarget = sessionId || "latest";

        const safePrompt = JSON.stringify(prompt);
        let command = `gemini -r ${resumeTarget} ${safePrompt} --output-format json`;
        if (model) {
            command += ` -m ${model}`;
        }

        // Handle system prompt via temp file and GEMINI_SYSTEM_MD env var
        let systemPromptFile: string | null = null;
        const env = { ...process.env };
        if (systemPrompt) {
            systemPromptFile = createSystemPromptFile(systemPrompt);
            env.GEMINI_SYSTEM_MD = systemPromptFile;
        }

        try {
            const { stdout } = await execAsync(command, {
                encoding: 'utf-8',
                env,
                ...(cwd ? { cwd } : {})
            });

            let responseText = "";
            let newSessionId: string | null = null;

            try {
                const json = JSON.parse(stdout);
                responseText = json.response || JSON.stringify(json);
                newSessionId = json.session_id || null;
            } catch (e) {
                responseText = stdout as string;
            }

            return {
                content: [
                    {
                        type: "text",
                        text: responseText
                    }
                ],
                _meta: newSessionId ? { sessionId: newSessionId } : undefined
            };
        } finally {
            if (systemPromptFile) {
                cleanupSystemPromptFile(systemPromptFile);
            }
        }
    }
  } catch (error: any) {
      return {
          content: [{ type: "text", text: `Error executing gemini: ${error.message}\nStderr: ${error.stderr || ""}` }],
          isError: true,
      };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
