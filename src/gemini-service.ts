import { exec } from "child_process";
import { promisify } from "util";

const execAsyncRaw = promisify(exec);
const execAsync = (cmd: string) => execAsyncRaw(cmd, { shell: '/bin/bash', cwd: process.cwd() });

export interface SessionInfo {
  index: number;
  uuid: string;
}

export interface GeminiResponse {
  response: string;
  sessionId: string | null;
}

export interface ExecFunction {
  (command: string): Promise<{ stdout: string; stderr: string }>;
}

// Default exec function, can be overridden for testing
let execFn: ExecFunction = execAsync;

export function setExecFunction(fn: ExecFunction): void {
  execFn = fn;
}

export function resetExecFunction(): void {
  execFn = execAsync;
}

export async function listSessions(): Promise<SessionInfo[]> {
  try {
    const { stdout } = await execFn('gemini --list-sessions 2>/dev/null');
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

export async function findSessionIndex(sessionId: string): Promise<number | null> {
  const sessions = await listSessions();
  const found = sessions.find(s => s.uuid === sessionId || s.uuid.startsWith(sessionId));
  return found ? found.index : null;
}

export async function getLatestSessionId(): Promise<string | null> {
  const sessions = await listSessions();
  return sessions.length > 0 ? sessions[0].uuid : null;
}

export function parseGeminiJsonResponse(stdout: string): { response: string; sessionId: string | null } {
  try {
    const json = JSON.parse(stdout);
    return {
      response: json.response || JSON.stringify(json),
      sessionId: json.session_id || null
    };
  } catch (e) {
    return {
      response: stdout,
      sessionId: null
    };
  }
}

export async function executeGemini(prompt: string, model?: string): Promise<GeminiResponse> {
  const safePrompt = JSON.stringify(prompt);
  let command = `gemini ${safePrompt} --output-format json`;
  if (model) {
    command += ` -m ${model}`;
  }
  command += ' 2>/dev/null';

  const { stdout } = await execFn(command);
  let { response, sessionId } = parseGeminiJsonResponse(stdout);

  // Fallback: get session ID from list if not in response
  if (!sessionId) {
    sessionId = await getLatestSessionId();
  }

  return { response, sessionId };
}

export async function executeGeminiReply(
  prompt: string,
  sessionId?: string,
  model?: string
): Promise<GeminiResponse> {
  // Use sessionId directly (UUID) or "latest"
  const resumeTarget = sessionId || "latest";

  const safePrompt = JSON.stringify(prompt);
  let command = `gemini -r ${resumeTarget} ${safePrompt} --output-format json`;
  if (model) {
    command += ` -m ${model}`;
  }
  command += ' 2>/dev/null';

  const { stdout } = await execFn(command);
  const { response, sessionId: newSessionId } = parseGeminiJsonResponse(stdout);

  return { response, sessionId: newSessionId };
}
