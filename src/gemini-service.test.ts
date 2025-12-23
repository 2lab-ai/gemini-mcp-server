import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  listSessions,
  findSessionIndex,
  getLatestSessionId,
  parseGeminiJsonResponse,
  executeGemini,
  executeGeminiReply,
  setExecFunction,
  resetExecFunction,
  type SessionInfo,
} from './gemini-service.js';

// Mock exec function
function createMockExec(responses: Record<string, string>) {
  return async (command: string): Promise<{ stdout: string; stderr: string }> => {
    for (const [pattern, response] of Object.entries(responses)) {
      if (command.includes(pattern)) {
        return { stdout: response, stderr: '' };
      }
    }
    throw new Error(`Unexpected command: ${command}`);
  };
}

describe('gemini-service', () => {
  afterEach(() => {
    resetExecFunction();
  });

  describe('listSessions', () => {
    it('should parse session list correctly', async () => {
      const mockOutput = `Loaded cached credentials.

Available sessions for this project (3):

  1. hello (11 days ago) [251d71bb-55c5-4923-9b99-4d953eaa0584]
  2. code review (5 days ago) [65303a90-1234-5678-9abc-def012345678]
  3. testing session (1 day ago) [abc12345-aaaa-bbbb-cccc-ddddeeeefffff]
`;
      setExecFunction(createMockExec({ '--list-sessions': mockOutput }));

      const sessions = await listSessions();

      expect(sessions).toHaveLength(3);
      expect(sessions[0]).toEqual({ index: 1, uuid: '251d71bb-55c5-4923-9b99-4d953eaa0584' });
      expect(sessions[1]).toEqual({ index: 2, uuid: '65303a90-1234-5678-9abc-def012345678' });
      expect(sessions[2]).toEqual({ index: 3, uuid: 'abc12345-aaaa-bbbb-cccc-ddddeeeefffff' });
    });

    it('should return empty array when no sessions', async () => {
      const mockOutput = `Loaded cached credentials.

No sessions found for this project.
`;
      setExecFunction(createMockExec({ '--list-sessions': mockOutput }));

      const sessions = await listSessions();

      expect(sessions).toHaveLength(0);
    });

    it('should return empty array on error', async () => {
      setExecFunction(async () => {
        throw new Error('Command failed');
      });

      const sessions = await listSessions();

      expect(sessions).toHaveLength(0);
    });
  });

  describe('findSessionIndex', () => {
    beforeEach(() => {
      const mockOutput = `
  1. session one [aaaa1111-0000-0000-0000-000000000001]
  2. session two [bbbb2222-0000-0000-0000-000000000002]
  3. session three [cccc3333-0000-0000-0000-000000000003]
`;
      setExecFunction(createMockExec({ '--list-sessions': mockOutput }));
    });

    it('should find session by exact UUID', async () => {
      const index = await findSessionIndex('bbbb2222-0000-0000-0000-000000000002');
      expect(index).toBe(2);
    });

    it('should find session by UUID prefix', async () => {
      const index = await findSessionIndex('cccc3333');
      expect(index).toBe(3);
    });

    it('should return null for non-existent session', async () => {
      const index = await findSessionIndex('nonexistent-uuid');
      expect(index).toBeNull();
    });
  });

  describe('getLatestSessionId', () => {
    it('should return the first session UUID', async () => {
      const mockOutput = `
  1. latest session [11111111-0000-0000-0000-000000001234]
  2. older session [22222222-0000-0000-0000-000000005678]
`;
      setExecFunction(createMockExec({ '--list-sessions': mockOutput }));

      const sessionId = await getLatestSessionId();

      expect(sessionId).toBe('11111111-0000-0000-0000-000000001234');
    });

    it('should return null when no sessions', async () => {
      setExecFunction(createMockExec({ '--list-sessions': 'No sessions found.' }));

      const sessionId = await getLatestSessionId();

      expect(sessionId).toBeNull();
    });
  });

  describe('parseGeminiJsonResponse', () => {
    it('should parse valid JSON response', () => {
      const stdout = JSON.stringify({
        session_id: 'test-session-id',
        response: 'Hello, how can I help you?',
        stats: { tokens: 100 }
      });

      const result = parseGeminiJsonResponse(stdout);

      expect(result.response).toBe('Hello, how can I help you?');
      expect(result.sessionId).toBe('test-session-id');
    });

    it('should handle JSON without session_id', () => {
      const stdout = JSON.stringify({
        response: 'Response without session'
      });

      const result = parseGeminiJsonResponse(stdout);

      expect(result.response).toBe('Response without session');
      expect(result.sessionId).toBeNull();
    });

    it('should handle JSON without response field', () => {
      const stdout = JSON.stringify({
        session_id: 'test-id',
        content: 'Some content'
      });

      const result = parseGeminiJsonResponse(stdout);

      // Should stringify the entire JSON
      expect(result.response).toContain('content');
      expect(result.sessionId).toBe('test-id');
    });

    it('should return raw stdout for invalid JSON', () => {
      const stdout = 'This is not JSON, just plain text output';

      const result = parseGeminiJsonResponse(stdout);

      expect(result.response).toBe(stdout);
      expect(result.sessionId).toBeNull();
    });
  });

  describe('executeGemini', () => {
    it('should execute gemini command and return response with session ID', async () => {
      const mockResponse = JSON.stringify({
        session_id: 'new-session-123',
        response: 'Hello! I am Gemini.'
      });

      setExecFunction(createMockExec({
        'gemini "Hello"': mockResponse
      }));

      const result = await executeGemini('Hello');

      expect(result.response).toBe('Hello! I am Gemini.');
      expect(result.sessionId).toBe('new-session-123');
    });

    it('should include model parameter when provided', async () => {
      let capturedCommand = '';
      setExecFunction(async (command: string) => {
        capturedCommand = command;
        return {
          stdout: JSON.stringify({ response: 'OK', session_id: 'test' }),
          stderr: ''
        };
      });

      await executeGemini('Test prompt', 'gemini-1.5-pro');

      expect(capturedCommand).toContain('-m gemini-1.5-pro');
    });

    it('should fallback to getLatestSessionId when no session_id in response', async () => {
      const listSessionsOutput = `
  1. test session [aabbccdd-0000-0000-0000-000000000001]
`;
      const geminiOutput = JSON.stringify({ response: 'Hello' });

      setExecFunction(async (command: string) => {
        if (command.includes('--list-sessions')) {
          return { stdout: listSessionsOutput, stderr: '' };
        }
        return { stdout: geminiOutput, stderr: '' };
      });

      const result = await executeGemini('Hello');

      expect(result.response).toBe('Hello');
      expect(result.sessionId).toBe('aabbccdd-0000-0000-0000-000000000001');
    });

    it('should properly escape special characters in prompt', async () => {
      let capturedCommand = '';
      setExecFunction(async (command: string) => {
        capturedCommand = command;
        return {
          stdout: JSON.stringify({ response: 'OK', session_id: 'test' }),
          stderr: ''
        };
      });

      await executeGemini('Hello "world" with \'quotes\'');

      // JSON.stringify should handle escaping
      expect(capturedCommand).toContain('\\"world\\"');
    });
  });

  describe('executeGeminiReply', () => {
    it('should use "latest" when no sessionId provided', async () => {
      let capturedCommand = '';
      setExecFunction(async (command: string) => {
        capturedCommand = command;
        return {
          stdout: JSON.stringify({ response: 'Continued', session_id: 'cont-id' }),
          stderr: ''
        };
      });

      const result = await executeGeminiReply('Continue please');

      expect(capturedCommand).toContain('-r latest');
      expect(result.response).toBe('Continued');
    });

    it('should use sessionId directly as UUID', async () => {
      let capturedCommand = '';

      setExecFunction(async (command: string) => {
        capturedCommand = command;
        return {
          stdout: JSON.stringify({ response: 'Replied', session_id: '22222222-0000-0000-0000-000000000002' }),
          stderr: ''
        };
      });

      const result = await executeGeminiReply('Reply to this', '22222222-0000-0000-0000-000000000002');

      expect(capturedCommand).toContain('-r 22222222-0000-0000-0000-000000000002');
      expect(result.response).toBe('Replied');
      expect(result.sessionId).toBe('22222222-0000-0000-0000-000000000002');
    });

    it('should include model parameter when provided', async () => {
      let capturedCommand = '';
      setExecFunction(async (command: string) => {
        capturedCommand = command;
        return {
          stdout: JSON.stringify({ response: 'OK', session_id: 'test' }),
          stderr: ''
        };
      });

      await executeGeminiReply('Test', undefined, 'gemini-2.0-flash-exp');

      expect(capturedCommand).toContain('-m gemini-2.0-flash-exp');
    });

    it('should pass partial UUID directly to gemini', async () => {
      let capturedCommand = '';

      setExecFunction(async (command: string) => {
        capturedCommand = command;
        return {
          stdout: JSON.stringify({ response: 'Found', session_id: 'abcd1234-0000-0000-0000-000000000001' }),
          stderr: ''
        };
      });

      const result = await executeGeminiReply('Hello', 'abcd1234');

      expect(capturedCommand).toContain('-r abcd1234');
      expect(result.response).toBe('Found');
    });
  });
});
