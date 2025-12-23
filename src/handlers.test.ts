import { describe, it, expect, afterEach } from 'vitest';
import { TOOLS, handleGemini, handleGeminiReply, handleToolCall } from './handlers.js';
import { setExecFunction, resetExecFunction } from './gemini-service.js';

// Mock exec function for testing
function createMockExec(responses: Record<string, string | (() => string)>) {
  return async (command: string): Promise<{ stdout: string; stderr: string }> => {
    for (const [pattern, response] of Object.entries(responses)) {
      if (command.includes(pattern)) {
        const stdout = typeof response === 'function' ? response() : response;
        return { stdout, stderr: '' };
      }
    }
    throw new Error(`Unexpected command: ${command}`);
  };
}

describe('Handlers', () => {
  afterEach(() => {
    resetExecFunction();
  });

  describe('TOOLS definition', () => {
    it('should have gemini and gemini-reply tools', () => {
      expect(TOOLS).toHaveLength(2);
      expect(TOOLS[0].name).toBe('gemini');
      expect(TOOLS[1].name).toBe('gemini-reply');
    });

    it('gemini tool should have correct schema', () => {
      const geminiTool = TOOLS.find(t => t.name === 'gemini');
      expect(geminiTool).toBeDefined();
      expect(geminiTool!.inputSchema.properties).toHaveProperty('prompt');
      expect(geminiTool!.inputSchema.properties).toHaveProperty('model');
      expect(geminiTool!.inputSchema.required).toContain('prompt');
    });

    it('gemini-reply tool should have correct schema', () => {
      const replyTool = TOOLS.find(t => t.name === 'gemini-reply');
      expect(replyTool).toBeDefined();
      expect(replyTool!.inputSchema.properties).toHaveProperty('prompt');
      expect(replyTool!.inputSchema.properties).toHaveProperty('sessionId');
      expect(replyTool!.inputSchema.properties).toHaveProperty('model');
      expect(replyTool!.inputSchema.required).toContain('prompt');
    });
  });

  describe('handleGemini', () => {
    it('should execute gemini and return response with session ID', async () => {
      const mockResponse = JSON.stringify({
        session_id: 'new-session-12345678-0000-0000-0000-000000000000',
        response: 'Hello! I am Gemini, ready to help.'
      });

      setExecFunction(createMockExec({
        'gemini': mockResponse
      }));

      const result = await handleGemini({ prompt: 'Hello' });

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Hello! I am Gemini, ready to help.');
      expect(result.sessionId).toBe('new-session-12345678-0000-0000-0000-000000000000');
    });

    it('should pass model parameter', async () => {
      let capturedCommand = '';
      setExecFunction(async (command: string) => {
        capturedCommand = command;
        return {
          stdout: JSON.stringify({ response: 'OK', session_id: 'test-id-0000-0000-0000-000000000000' }),
          stderr: ''
        };
      });

      await handleGemini({ prompt: 'Test', model: 'gemini-3-flash' });

      expect(capturedCommand).toContain('-m gemini-3-flash');
    });
  });

  describe('handleGeminiReply', () => {
    it('should use latest when no sessionId provided', async () => {
      let capturedCommand = '';
      setExecFunction(async (command: string) => {
        capturedCommand = command;
        return {
          stdout: JSON.stringify({ response: 'Continued conversation', session_id: 'cont-id' }),
          stderr: ''
        };
      });

      const result = await handleGeminiReply({ prompt: 'Continue please' });

      expect(capturedCommand).toContain('-r latest');
      expect(result.content[0].text).toContain('Continued conversation');
    });

    it('should pass sessionId directly as UUID', async () => {
      let capturedReplyCommand = '';

      setExecFunction(async (command: string) => {
        capturedReplyCommand = command;
        return {
          stdout: JSON.stringify({ response: 'Replied to session', session_id: '22222222-0000-0000-0000-000000000002' }),
          stderr: ''
        };
      });

      const result = await handleGeminiReply({
        prompt: 'Reply to this',
        sessionId: '22222222-0000-0000-0000-000000000002'
      });

      expect(capturedReplyCommand).toContain('-r 22222222-0000-0000-0000-000000000002');
      expect(result.content[0].text).toContain('Replied to session');
      expect(result.sessionId).toBe('22222222-0000-0000-0000-000000000002');
    });
  });

  describe('handleToolCall', () => {
    it('should route gemini tool call correctly', async () => {
      setExecFunction(createMockExec({
        'gemini': JSON.stringify({ response: 'Hello', session_id: 'test-session' })
      }));

      const result = await handleToolCall('gemini', { prompt: 'Hello' });

      expect(result.content[0].text).toContain('Hello');
    });

    it('should route gemini-reply tool call correctly', async () => {
      setExecFunction(createMockExec({
        'gemini': JSON.stringify({ response: 'Continued', session_id: 'test-session' })
      }));

      const result = await handleToolCall('gemini-reply', { prompt: 'Continue' });

      expect(result.content[0].text).toContain('Continued');
    });

    it('should handle errors gracefully', async () => {
      setExecFunction(async () => {
        throw new Error('Gemini CLI not found');
      });

      const result = await handleToolCall('gemini', { prompt: 'Hello' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error executing gemini');
    });

    it('should throw error for unknown tool', async () => {
      await expect(handleToolCall('unknown-tool', {}))
        .rejects.toThrow('Unknown tool: unknown-tool');
    });
  });

  describe('End-to-End Flow', () => {
    it('should support multi-turn conversation', async () => {
      const sessionId = 'e2e00001-0000-0000-0000-000000000001';
      let geminiCallCount = 0;

      setExecFunction(async (command: string) => {
        // Handle list-sessions calls
        if (command.includes('--list-sessions')) {
          return {
            stdout: `  1. e2e test [${sessionId}]`,
            stderr: ''
          };
        }

        // Handle gemini calls (new session or reply)
        geminiCallCount++;

        if (command.includes('-r ')) {
          // This is a reply call - should use UUID directly
          expect(command).toContain(`-r ${sessionId}`);
          return {
            stdout: JSON.stringify({
              response: 'Sure, I remember our conversation.',
              session_id: sessionId
            }),
            stderr: ''
          };
        } else {
          // This is a new session call
          return {
            stdout: JSON.stringify({
              response: 'Hello! How can I help you today?',
              session_id: sessionId
            }),
            stderr: ''
          };
        }
      });

      // First turn - new session
      const firstResult = await handleToolCall('gemini', { prompt: 'Hello' });
      expect(firstResult.content[0].text).toContain('Hello! How can I help you today?');
      expect(firstResult.sessionId).toBe(sessionId);

      // Second turn - reply using session ID
      const secondResult = await handleToolCall('gemini-reply', {
        prompt: 'Do you remember?',
        sessionId: sessionId
      });
      expect(secondResult.content[0].text).toContain('Sure, I remember our conversation.');
      expect(secondResult.sessionId).toBe(sessionId);

      // Verify we made 2 gemini calls
      expect(geminiCallCount).toBe(2);
    });
  });
});
