#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

async function getLatestSessionId(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('gemini --list-sessions');
    // Output format: "  1. Prompt... (Time) [UUID]"
    // Regex matches the first line that looks like an item and captures the UUID in brackets
    const match = stdout.match(/^\s*1\..*?\[([a-f0-9\-]+)\]/m);
    return match ? match[1] : null;
  } catch (error) {
    // console.error("Error fetching sessions:", error);
    return null;
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "gemini",
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
                          description: "Optional: The model to use (e.g., 'gemini-2.0-flash-exp', 'gemini-1.5-pro')."
                        }
                      },
                      required: ["prompt"],
                    },
                  },
                  {
                    name: "gemini-reply",
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
    if (name === "gemini") {
        const { prompt, model } = args as { prompt: string; model?: string };
        
        // Escape logic: naive JSON stringify usually works for wrapping in double quotes
        // We wrap the whole thing in single quotes for bash to treat it as a literal string (mostly)
        // But single quotes in the JSON string need to be escaped? 
        // Let's rely on JSON.stringify to handle content escaping, and pass it directly if we can.
        // safePrompt will be like "Hello" or "He said \"Hello\""
        const safePrompt = JSON.stringify(prompt);
        
        // Command: gemini "prompt" --output-format json
        // We use the string returned by JSON.stringify which includes the surrounding quotes.
        // e.g. gemini "foo" ...
        let command = `gemini ${safePrompt} --output-format json`;
        if (model) {
            command += ` -m ${model}`;
        }
        
        const { stdout } = await execAsync(command);
        
        let responseText = "";
        try {
            const json = JSON.parse(stdout);
            responseText = json.response || JSON.stringify(json);
        } catch (e) {
            responseText = stdout;
        }

        const sessionId = await getLatestSessionId();
        
        return {
            content: [
                {
                    type: "text",
                    text: responseText + (sessionId ? `\n\nSession ID: ${sessionId}` : "")
                }
            ]
        };
    }

    if (name === "gemini-reply") {
        const { prompt, sessionId, model } = args as { prompt: string; sessionId?: string; model?: string };
        const targetSession = sessionId || await getLatestSessionId();
        
        if (!targetSession) {
             return {
                content: [{ type: "text", text: "Error: No session ID provided and no active sessions found." }],
                isError: true,
            };
        }

        const safePrompt = JSON.stringify(prompt);
        let command = `gemini -r ${targetSession} ${safePrompt} --output-format json`;
        if (model) {
            command += ` -m ${model}`;
        }
        
        const { stdout } = await execAsync(command);
        let responseText = "";
        try {
            const json = JSON.parse(stdout);
            responseText = json.response || JSON.stringify(json);
        } catch (e) {
            responseText = stdout;
        }

        return {
            content: [
                {
                    type: "text",
                    text: responseText
                }
            ]
        };
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
