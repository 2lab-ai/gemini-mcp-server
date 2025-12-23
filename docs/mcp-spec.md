# Gemini MCP Server - Tool Specification

## Overview

gemini-mcp-server는 Gemini CLI를 MCP(Model Context Protocol) 도구로 래핑하여 제공합니다.

- **Server Name**: `gemini-mcp-server`
- **Version**: `1.0.0`

---

## Tools

### 1. `chat`

새로운 Gemini 세션을 시작합니다.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "세션을 시작할 프롬프트"
    },
    "model": {
      "type": "string",
      "description": "Optional: The model to use (e.g., 'gemini-3-pro', 'gemini-3-flash')."
    },
    "systemPrompt": {
      "type": "string",
      "description": "어시스턴트의 동작을 설정하는 시스템 프롬프트"
    },
    "cwd": {
      "type": "string",
      "description": "gemini CLI 실행 시 작업 디렉토리"
    }
  },
  "required": ["prompt"]
}
```

#### Request Example

```json
{
  "method": "tools/call",
  "params": {
    "name": "chat",
    "arguments": {
      "prompt": "Hello, who are you?",
      "model": "gemini-3-flash",
      "systemPrompt": "You are a helpful coding assistant.",
      "cwd": "/Users/user/my-project"
    }
  }
}
```

#### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "I'm Gemini, a large language model created by Google..."
    }
  ],
  "_meta": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

### 2. `chat-reply`

기존 Gemini 세션을 이어서 진행합니다.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "대화를 이어갈 프롬프트"
    },
    "sessionId": {
      "type": "string",
      "description": "이어갈 세션 ID. 미제공 시 최신 세션 사용"
    },
    "model": {
      "type": "string",
      "description": "이번 턴에 사용할 모델"
    },
    "systemPrompt": {
      "type": "string",
      "description": "어시스턴트의 동작을 설정하는 시스템 프롬프트"
    },
    "cwd": {
      "type": "string",
      "description": "gemini CLI 실행 시 작업 디렉토리"
    }
  },
  "required": ["prompt"]
}
```

#### Request Example

```json
{
  "method": "tools/call",
  "params": {
    "name": "chat-reply",
    "arguments": {
      "prompt": "Can you explain more about that?",
      "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  }
}
```

#### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Sure! Let me explain in more detail..."
    }
  ],
  "_meta": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

---

## Response Format

### Success Response

| Field | Type | Description |
|-------|------|-------------|
| `content` | array | 응답 컨텐츠 배열 |
| `content[].type` | string | 항상 `"text"` |
| `content[].text` | string | Gemini 응답 텍스트 |
| `_meta` | object | 메타데이터 (optional) |
| `_meta.sessionId` | string | 세션 ID (후속 `chat-reply` 호출에 사용) |

### Error Response

| Field | Type | Description |
|-------|------|-------------|
| `content` | array | 에러 메시지 배열 |
| `content[].type` | string | 항상 `"text"` |
| `content[].text` | string | 에러 메시지 (`Error executing gemini: ...`) |
| `isError` | boolean | 항상 `true` |

#### Error Response Example

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error executing gemini: Command failed...\nStderr: ..."
    }
  ],
  "isError": true
}
```

---

## Internal CLI Commands

MCP 서버가 내부적으로 실행하는 Gemini CLI 명령:

### chat

```bash
gemini "<prompt>" --output-format json [-m <model>]
```

### chat-reply

```bash
gemini -r <sessionId|latest> "<prompt>" --output-format json [-m <model>]
```

### System Prompt 처리

`systemPrompt` 파라메터가 제공되면:
1. `/tmp/gemini-mcp-XXXXXX/SYSTEM.md` 임시 파일 생성
2. `GEMINI_SYSTEM_MD` 환경변수로 파일 경로 전달
3. CLI 실행 후 임시 파일 삭제

---

## Session Management

- `chat` 호출 시 새 세션 생성, 응답에 `sessionId` 포함
- `chat-reply`에서 `sessionId` 미제공 시 `"latest"` 사용 (최신 세션 자동 선택)
- 세션 ID는 Gemini CLI JSON 응답의 `session_id` 필드에서 추출
- fallback: `gemini --list-sessions`로 최신 세션 ID 조회
