import { executeGemini, executeGeminiReply } from "./gemini-service.js";

export interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
  sessionId?: string;
  [key: string]: unknown;
}

export const TOOLS = [
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
          description: "Optional: The model to use (e.g., 'gemini-3-pro', 'gemini-3-flash')."
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
];

export async function handleGemini(args: { prompt: string; model?: string }): Promise<ToolResult> {
  const { prompt, model } = args;
  const { response, sessionId } = await executeGemini(prompt, model);

  return {
    content: [
      {
        type: "text",
        text: response
      }
    ],
    ...(sessionId && { sessionId })
  };
}

export async function handleGeminiReply(args: { prompt: string; sessionId?: string; model?: string }): Promise<ToolResult> {
  const { prompt, sessionId, model } = args;
  const { response, sessionId: newSessionId } = await executeGeminiReply(prompt, sessionId, model);

  return {
    content: [
      {
        type: "text",
        text: response
      }
    ],
    ...(newSessionId && { sessionId: newSessionId })
  };
}

export async function handleToolCall(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    if (name === "gemini") {
      return await handleGemini(args as { prompt: string; model?: string });
    }

    if (name === "gemini-reply") {
      return await handleGeminiReply(args as { prompt: string; sessionId?: string; model?: string });
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error executing gemini: ${error.message}` }],
      isError: true,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}
