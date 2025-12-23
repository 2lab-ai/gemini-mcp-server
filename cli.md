# Claude CLI vs Gemini CLI 비교 분석

## 개요

| 항목 | Claude CLI | Gemini CLI |
|------|-----------|------------|
| **버전 확인** | `-v, --version` | `-v, --version` |
| **도움말** | `-h, --help` | `-h, --help` |
| **기본 모드** | 대화형 세션 (interactive) | 대화형 세션 (interactive) |
| **비대화형 모드** | `-p, --print` | 위치 인자 또는 `-p, --prompt` |

---

## 1. 실행 모드

### Claude CLI
```bash
claude [prompt]              # 대화형 세션 시작
claude -p "질문"             # 비대화형 (응답 후 종료)
claude --print "질문"        # 파이프에 유용
```

### Gemini CLI
```bash
gemini                       # 대화형 세션 시작
gemini "질문"                # 원샷 모드 (one-shot)
gemini -i "질문"             # 프롬프트 실행 후 대화형 모드 유지
gemini -p "질문"             # (deprecated) 비대화형 모드
```

| 기능 | Claude | Gemini |
|------|--------|--------|
| 대화형 시작 | 기본 | 기본 |
| 원샷 쿼리 | `-p, --print` | 위치 인자 (positional) |
| 프롬프트 후 대화 유지 | ❌ | `-i, --prompt-interactive` |

---

## 2. 디버그 및 상세 출력

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `-d, --debug [filter]` | 디버그 모드 (카테고리 필터링 가능, 예: `"api,hooks"` 또는 `"!statsig,!file"`) |
| `--verbose` | 상세 출력 모드 |
| `--mcp-debug` | MCP 디버그 모드 (deprecated, `--debug` 사용 권장) |

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `-d, --debug` | 디버그 모드 (boolean, 기본값: false) |

**차이점**: Claude는 디버그 필터링 기능과 verbose 모드를 별도로 제공

---

## 3. 출력 형식

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--output-format <format>` | `text` (기본), `json`, `stream-json` |
| `--json-schema <schema>` | 구조화된 출력 검증용 JSON Schema |
| `--include-partial-messages` | 부분 메시지 청크 포함 (stream-json과 함께 사용) |

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `-o, --output-format` | `text`, `json`, `stream-json` |

**차이점**: Claude는 JSON Schema 검증과 부분 메시지 스트리밍 옵션 제공

---

## 4. 입력 형식

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--input-format <format>` | `text` (기본), `stream-json` |
| `--replay-user-messages` | stdin에서 받은 사용자 메시지를 stdout으로 재출력 |

### Gemini CLI
입력 형식 관련 옵션 없음

---

## 5. 권한 및 보안

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--dangerously-skip-permissions` | 모든 권한 검사 우회 (인터넷 없는 샌드박스 권장) |
| `--allow-dangerously-skip-permissions` | 권한 우회 옵션 활성화 (기본값은 비활성) |
| `--permission-mode <mode>` | `acceptEdits`, `bypassPermissions`, `default`, `delegate`, `dontAsk`, `plan` |

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `-s, --sandbox` | 샌드박스 모드 실행 |
| `-y, --yolo` | 모든 액션 자동 승인 (YOLO 모드) |
| `--approval-mode` | `default`, `auto_edit`, `yolo` |

**비교**:
| 개념 | Claude | Gemini |
|------|--------|--------|
| 완전 자동 승인 | `--dangerously-skip-permissions` | `-y, --yolo` |
| 편집만 자동 승인 | `--permission-mode acceptEdits` | `--approval-mode auto_edit` |
| 샌드박스 | 옵션 조합으로 구현 | `-s, --sandbox` |

---

## 6. 세션 관리

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `-c, --continue` | 가장 최근 대화 이어하기 |
| `-r, --resume [value]` | 세션 ID로 대화 재개 또는 대화형 선택기 열기 |
| `--fork-session` | 재개 시 새 세션 ID 생성 |
| `--no-session-persistence` | 세션 저장 비활성화 |
| `--session-id <uuid>` | 특정 세션 ID 사용 |

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `-r, --resume` | 이전 세션 재개 (`latest` 또는 인덱스 번호) |
| `--list-sessions` | 사용 가능한 세션 목록 표시 |
| `--delete-session` | 인덱스 번호로 세션 삭제 |

**차이점**:
- Claude: 세션 ID 기반, fork 기능, 세션 저장 비활성화 옵션
- Gemini: 인덱스 기반 세션 관리, 세션 목록/삭제 기능 내장

---

## 7. 모델 선택

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--model <model>` | 별칭(`sonnet`, `opus`) 또는 전체 이름(`claude-sonnet-4-5-20250929`) |
| `--fallback-model <model>` | 기본 모델 과부하 시 자동 폴백 |
| `--betas <betas...>` | API 요청에 베타 헤더 포함 (API 키 사용자만) |

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `-m, --model` | 모델 지정 |

**차이점**: Claude는 폴백 모델과 베타 헤더 기능 제공

---

## 8. 예산 관리

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--max-budget-usd <amount>` | API 호출 최대 비용 제한 (`--print`와 함께 사용) |

### Gemini CLI
예산 관련 옵션 없음

---

## 9. 도구(Tools) 관리

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--allowedTools, --allowed-tools <tools...>` | 허용할 도구 목록 (예: `"Bash(git:*) Edit"`) |
| `--disallowedTools, --disallowed-tools <tools...>` | 거부할 도구 목록 |
| `--tools <tools...>` | 사용 가능한 도구 지정 (`""`, `"default"`, 또는 도구 이름) |

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `--allowed-tools` | 확인 없이 실행 허용할 도구 |

**차이점**: Claude는 도구 허용/거부/지정 세분화, Gemini는 허용 도구만 지정 가능

---

## 10. MCP (Model Context Protocol) 관리

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--mcp-config <configs...>` | JSON 파일 또는 문자열에서 MCP 서버 로드 |
| `--strict-mcp-config` | `--mcp-config`의 MCP 서버만 사용 |

**명령어**: `claude mcp` - MCP 서버 구성 및 관리

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `--allowed-mcp-server-names` | 허용할 MCP 서버 이름 목록 |
| `--experimental-acp` | ACP 모드로 에이전트 시작 |

**명령어**: `gemini mcp` - MCP 서버 관리

---

## 11. 시스템 프롬프트

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--system-prompt <prompt>` | 세션에 사용할 시스템 프롬프트 |
| `--append-system-prompt <prompt>` | 기본 시스템 프롬프트에 추가 |

### Gemini CLI
시스템 프롬프트 관련 옵션 없음

---

## 12. 작업 디렉토리 설정

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--add-dir <directories...>` | 도구 접근 허용 추가 디렉토리 |

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `--include-directories` | 워크스페이스에 포함할 추가 디렉토리 |

---

## 13. 에이전트 및 확장

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--agent <agent>` | 현재 세션의 에이전트 |
| `--agents <json>` | 커스텀 에이전트 정의 JSON |
| `--plugin-dir <paths...>` | 플러그인 디렉토리 로드 |
| `--disable-slash-commands` | 슬래시 명령어 비활성화 |

**명령어**: `claude plugin` - 플러그인 관리

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `-e, --extensions` | 사용할 확장 목록 |
| `-l, --list-extensions` | 사용 가능한 확장 목록 표시 |

**명령어**: `gemini extensions <command>` - 확장 관리

---

## 14. 설정 관리

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--settings <file-or-json>` | 설정 JSON 파일 또는 문자열 로드 |
| `--setting-sources <sources>` | 설정 소스 지정 (`user`, `project`, `local`) |

### Gemini CLI
설정 파일 관련 옵션 없음

---

## 15. IDE/접근성

### Claude CLI
| 옵션 | 설명 |
|------|------|
| `--ide` | 시작 시 IDE 자동 연결 |
| `--chrome` | Chrome 통합 활성화 |
| `--no-chrome` | Chrome 통합 비활성화 |

### Gemini CLI
| 옵션 | 설명 |
|------|------|
| `--screen-reader` | 스크린 리더 모드 (접근성) |

---

## 16. 하위 명령어 비교

| 기능 | Claude CLI | Gemini CLI |
|------|-----------|------------|
| MCP 관리 | `claude mcp` | `gemini mcp` |
| 확장/플러그인 | `claude plugin` | `gemini extensions` |
| 인증 설정 | `claude setup-token` | ❌ |
| 상태 점검 | `claude doctor` | ❌ |
| 업데이트 | `claude update` | ❌ |
| 설치 | `claude install [target]` | ❌ |

---

## 기능 요약 비교표

| 기능 | Claude CLI | Gemini CLI |
|------|:----------:|:----------:|
| 대화형 모드 | ✅ | ✅ |
| 비대화형 모드 | ✅ | ✅ |
| 디버그 필터링 | ✅ | ❌ |
| JSON Schema 검증 | ✅ | ❌ |
| 스트림 입력 | ✅ | ❌ |
| 권한 세분화 | ✅ (6가지) | ✅ (3가지) |
| 세션 fork | ✅ | ❌ |
| 세션 목록/삭제 | ❌ | ✅ |
| 폴백 모델 | ✅ | ❌ |
| 예산 제한 | ✅ | ❌ |
| 도구 거부 목록 | ✅ | ❌ |
| 시스템 프롬프트 | ✅ | ❌ |
| 커스텀 에이전트 | ✅ | ❌ |
| 확장 목록 조회 | ❌ | ✅ |
| IDE 연동 | ✅ | ❌ |
| 스크린 리더 | ❌ | ✅ |
| 자동 업데이트 | ✅ | ❌ |
| 상태 점검 (doctor) | ✅ | ❌ |

---

## 결론

### Claude CLI 강점
- 세분화된 권한 관리 (`--permission-mode` 6가지 모드)
- 시스템 프롬프트 커스터마이징
- 예산 관리 기능
- 도구 허용/거부 세분화
- 폴백 모델 지원
- JSON Schema 출력 검증
- 스트림 입/출력 형식
- 자체 업데이트 및 진단 명령어

### Gemini CLI 강점
- 간결한 인터페이스
- 프롬프트 실행 후 대화 모드 유지 (`-i`)
- 세션 목록 조회 및 삭제 내장
- 확장 목록 조회 기능
- 스크린 리더 접근성 지원
- 샌드박스 모드 간편 활성화 (`-s`)

---

# MCP 서버 개발을 위한 심층 분석

## A. 시스템 프롬프트 변경

### Claude CLI - 완전 지원

Claude CLI는 시스템 프롬프트를 CLI에서 직접 제어할 수 있습니다.

#### 옵션

| 옵션 | 설명 |
|------|------|
| `--system-prompt <prompt>` | 기본 시스템 프롬프트를 **완전히 교체** |
| `--append-system-prompt <prompt>` | 기본 시스템 프롬프트에 **추가** |

#### 사용 예시

```bash
# 시스템 프롬프트 완전 교체
claude --system-prompt "당신은 Python 전문가입니다. 모든 답변을 한국어로 해주세요."

# 기본 프롬프트에 추가
claude --append-system-prompt "항상 코드에 주석을 달아주세요."

# 비대화형 모드에서 사용
claude -p "파이썬으로 피보나치 구현" --system-prompt "간결한 코드만 출력하세요"
```

#### MCP 서버 개발 시 활용

MCP 서버에서 Claude CLI를 호출할 때 시스템 프롬프트를 동적으로 변경 가능:

```typescript
// MCP Tool 구현 예시
const result = await exec(`claude -p "${query}" --system-prompt "${customPrompt}" --output-format json`);
```

### Gemini CLI - 미지원

Gemini CLI는 시스템 프롬프트 관련 CLI 옵션이 **없습니다**.

#### 대안 방법

1. **프롬프트 앞에 지시사항 추가**
```bash
gemini "당신은 Python 전문가입니다. 다음 질문에 답하세요: 피보나치 구현"
```

2. **설정 파일 수정** (간접적)
   - `~/.gemini/settings.json`에서 일부 동작 제어 가능
   - 시스템 프롬프트 직접 설정은 불가

### 비교 결론

| 기능 | Claude CLI | Gemini CLI |
|------|:----------:|:----------:|
| 시스템 프롬프트 교체 | ✅ `--system-prompt` | ❌ |
| 시스템 프롬프트 추가 | ✅ `--append-system-prompt` | ❌ |
| 프로그래밍 방식 제어 | ✅ 완전 지원 | ❌ |

**MCP 서버 개발 시**: Claude CLI가 시스템 프롬프트 제어에 **압도적 우위**

---

## B. MCP 설정 및 관리

### Claude CLI MCP 명령어

```bash
claude mcp [command]
```

#### 하위 명령어

| 명령어 | 설명 |
|--------|------|
| `serve` | Claude Code MCP 서버 시작 |
| `add <name> <cmd/url> [args...]` | MCP 서버 추가 |
| `add-json <name> <json>` | JSON 문자열로 MCP 서버 추가 |
| `remove <name>` | MCP 서버 제거 |
| `list` | 설정된 MCP 서버 목록 |
| `get <name>` | 특정 MCP 서버 상세 정보 |
| `add-from-claude-desktop` | Claude Desktop에서 MCP 서버 가져오기 |
| `reset-project-choices` | 프로젝트 MCP 승인/거부 초기화 |

#### Transport 타입

| Transport | 설명 | 예시 |
|-----------|------|------|
| `stdio` | 표준 입출력 (기본값) | `npx -y some-mcp-server` |
| `sse` | Server-Sent Events | `https://mcp.example.com/sse` |
| `http` | HTTP | `https://mcp.example.com/mcp` |

#### 설정 범위 (Scope)

| Scope | 위치 | 설명 |
|-------|------|------|
| `local` | `.claude/settings.local.json` | 현재 프로젝트 (기본값) |
| `project` | `.mcp.json` | 프로젝트 공유용 |
| `user` | `~/.claude/settings.json` | 사용자 전역 |

#### 사용 예시

```bash
# stdio 서버 추가 (환경변수 포함)
claude mcp add --transport stdio airtable \
  --env AIRTABLE_API_KEY=xxx \
  -- npx -y airtable-mcp-server

# HTTP 서버 추가
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# SSE 서버 추가 (헤더 포함)
claude mcp add --transport sse myapi https://api.example.com/sse \
  -H "Authorization: Bearer xxx"

# JSON으로 추가 (복잡한 설정)
claude mcp add-json myserver '{"command":"npx","args":["-y","@example/mcp"],"env":{"KEY":"value"}}'

# 목록 확인
claude mcp list

# 프로젝트별 설정 추가
claude mcp add --scope project shared-server -- npx shared-mcp
```

#### 런타임 MCP 옵션

```bash
# 특정 MCP 설정 파일 사용
claude --mcp-config ./custom-mcp.json

# MCP 설정 파일만 사용 (기존 설정 무시)
claude --mcp-config ./only-this.json --strict-mcp-config
```

### Gemini CLI MCP 명령어

```bash
gemini mcp [command]
```

#### 하위 명령어

| 명령어 | 설명 |
|--------|------|
| `add <name> <cmd/url> [args...]` | MCP 서버 추가 |
| `remove <name>` | MCP 서버 제거 |
| `list` | 설정된 MCP 서버 목록 |

#### Transport 타입

Claude와 동일: `stdio` (기본), `sse`, `http`

#### 설정 범위 (Scope)

| Scope | 위치 | 설명 |
|-------|------|------|
| `project` | 프로젝트 디렉토리 | 기본값 |
| `user` | `~/.gemini/` | 사용자 전역 |

#### Gemini MCP add 고유 옵션

| 옵션 | 설명 |
|------|------|
| `--timeout <ms>` | 연결 타임아웃 (밀리초) |
| `--trust` | 서버 신뢰 (도구 확인 프롬프트 무시) |
| `--description <text>` | 서버 설명 추가 |
| `--include-tools <list>` | 포함할 도구 목록 |
| `--exclude-tools <list>` | 제외할 도구 목록 |

#### 사용 예시

```bash
# 기본 추가
gemini mcp add myserver -- npx -y my-mcp-server

# 신뢰 설정과 도구 필터링
gemini mcp add trusted-server \
  --trust \
  --include-tools "read,write" \
  -- npx my-server

# 사용자 전역 설정
gemini mcp add --scope user global-server -- npx global-mcp

# 목록 확인
gemini mcp list
```

#### 런타임 MCP 옵션

```bash
# 허용할 MCP 서버 지정
gemini --allowed-mcp-server-names server1 server2
```

### MCP 설정 파일 비교

#### Claude 설정 파일 구조

**`.claude/settings.local.json`** (프로젝트 로컬):
```json
{
  "permissions": {
    "allow": ["Bash(npm:*)"]
  },
  "mcpServers": {
    "myserver": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"],
      "env": {
        "API_KEY": "xxx"
      }
    }
  }
}
```

**`~/.claude/settings.json`** (사용자 전역):
```json
{
  "mcpServers": {
    "global-server": {
      "type": "http",
      "url": "https://mcp.example.com"
    }
  }
}
```

#### Gemini 설정 파일 구조

**`~/.gemini/antigravity/mcp_config.json`**:
```json
{
  "servers": {
    "myserver": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"],
      "transport": "stdio",
      "trust": true,
      "includeTools": ["read", "write"]
    }
  }
}
```

### MCP 비교 결론

| 기능 | Claude CLI | Gemini CLI |
|------|:----------:|:----------:|
| MCP 서버 추가 | ✅ | ✅ |
| MCP 서버 제거 | ✅ | ✅ |
| MCP 서버 목록 | ✅ | ✅ |
| MCP 서버 상세 조회 | ✅ `get` | ❌ |
| 자체 MCP 서버 모드 | ✅ `serve` | ❌ |
| Desktop 설정 가져오기 | ✅ | ❌ |
| 런타임 설정 파일 지정 | ✅ `--mcp-config` | ❌ |
| Strict 모드 | ✅ `--strict-mcp-config` | ❌ |
| 도구 필터링 (add 시) | ❌ | ✅ `--include/exclude-tools` |
| 타임아웃 설정 | ❌ | ✅ `--timeout` |
| 서버 신뢰 플래그 | ❌ | ✅ `--trust` |
| 설정 범위 | 3단계 (local/project/user) | 2단계 (project/user) |

**Claude 강점**:
- `claude mcp serve`로 자체 MCP 서버로 동작 가능
- 런타임에 MCP 설정 동적 지정 가능
- Desktop 연동

**Gemini 강점**:
- 도구 필터링 (`--include-tools`, `--exclude-tools`)
- 서버 신뢰 설정 (`--trust`)
- 타임아웃 설정

---

## C. 세션 기반 대화 이어하기

### Claude CLI 세션 관리

#### 세션 저장 위치

```
~/.claude/projects/{project-path-hash}/
├── {session-uuid}.jsonl        # 메인 세션
└── agent-{hash}.jsonl          # 에이전트 세션
```

#### 세션 파일 형식 (JSONL)

```jsonl
{"type":"user","message":{"role":"user","content":"질문"},"uuid":"...","timestamp":"...","sessionId":"..."}
{"type":"assistant","message":{"role":"assistant","content":[...]},"uuid":"...","parentUuid":"..."}
```

#### 세션 관련 옵션

| 옵션 | 설명 |
|------|------|
| `-c, --continue` | **가장 최근** 세션 이어하기 |
| `-r, --resume [id]` | 특정 세션 ID로 재개, 또는 선택기 열기 |
| `--fork-session` | 재개 시 **새 세션 ID로 분기** |
| `--session-id <uuid>` | 특정 UUID로 세션 시작/재개 |
| `--no-session-persistence` | 세션 저장 비활성화 |

#### 사용 예시

```bash
# 가장 최근 세션 이어하기
claude -c
claude --continue

# 세션 선택기 열기
claude -r

# 특정 세션 ID로 재개
claude -r abc12345-1234-5678-9abc-def012345678

# 새 세션 ID로 분기 (원본 유지)
claude -r abc12345... --fork-session

# 특정 UUID로 세션 시작
claude --session-id my-custom-uuid-1234

# 비대화형에서 세션 이어하기
claude -p "이전 질문에 대해 더 설명해줘" --continue
```

#### 프로그래밍 방식 세션 재개

```bash
# 1. 특정 세션으로 질문 이어가기
SESSION_ID="5c91c2bd-0e47-4471-bc0b-15dc612d2b18"
claude -p "이전 답변을 요약해줘" --resume $SESSION_ID --output-format json

# 2. 세션 분기하여 실험
claude --resume $SESSION_ID --fork-session -p "다른 접근방식 제안"
```

### Gemini CLI 세션 관리

#### 세션 저장 위치

```
~/.gemini/tmp/{project-hash}/chats/
└── session-{date}T{time}-{uuid-prefix}.json
```

#### 세션 파일 형식 (JSON)

```json
{
  "sessionId": "251d71bb-55c5-4923-9b99-4d953eaa0584",
  "projectHash": "a5e895e10c48c34381f2377aad9c89384c02e41e69ae3833f30ab9ba5e87b508",
  "startTime": "2025-12-10T06:13:08.433Z",
  "lastUpdated": "2025-12-10T06:13:09.560Z",
  "messages": [
    {
      "id": "8deca5d8-...",
      "timestamp": "2025-12-10T06:13:08.433Z",
      "type": "user",
      "content": "hello"
    },
    {
      "id": "07224410-...",
      "type": "gemini",
      "content": "Hello! ...",
      "tokens": { "input": 5557, "output": 18 },
      "model": "gemini-2.5-flash"
    }
  ]
}
```

#### 세션 관련 옵션

| 옵션 | 설명 |
|------|------|
| `-r, --resume <value>` | `latest` 또는 인덱스 번호로 재개 |
| `--list-sessions` | 프로젝트 세션 목록 표시 |
| `--delete-session <index>` | 인덱스로 세션 삭제 |

#### 사용 예시

```bash
# 세션 목록 확인
gemini --list-sessions
# 출력:
# Available sessions for this project (2):
#   1. hello (11 days ago) [251d71bb-...]
#   2. code review (5 days ago) [65303a90-...]

# 가장 최근 세션 이어하기
gemini -r latest

# 특정 인덱스의 세션 재개
gemini -r 1

# 세션 삭제
gemini --delete-session 2

# 프롬프트와 함께 세션 재개
gemini -r latest "이전 코드를 개선해줘"

# 프롬프트 후 대화형으로 이어가기
gemini -i "이전 논의를 이어가자" -r latest
```

### 세션 관리 비교

| 기능 | Claude CLI | Gemini CLI |
|------|:----------:|:----------:|
| 최근 세션 이어하기 | ✅ `-c` | ✅ `-r latest` |
| 세션 ID로 재개 | ✅ `-r <uuid>` | ❌ (인덱스만) |
| 인덱스로 재개 | ❌ | ✅ `-r <index>` |
| 세션 선택기 | ✅ `-r` (인자 없이) | ❌ |
| 세션 목록 조회 | ❌ (외부 도구 필요) | ✅ `--list-sessions` |
| 세션 삭제 | ❌ (수동 삭제) | ✅ `--delete-session` |
| 세션 분기 (fork) | ✅ `--fork-session` | ❌ |
| 커스텀 세션 ID | ✅ `--session-id` | ❌ |
| 세션 저장 비활성화 | ✅ `--no-session-persistence` | ❌ |
| 비대화형에서 재개 | ✅ | ✅ |
| 파일 형식 | JSONL (스트리밍) | JSON (단일 파일) |

### MCP 서버에서 세션 활용

#### Claude CLI 방식

```typescript
// MCP Tool에서 세션 유지하며 다중 턴 대화
class ClaudeSessionManager {
  private sessionId: string;

  async startSession(): Promise<string> {
    this.sessionId = uuidv4();
    const result = await exec(
      `claude -p "초기 컨텍스트 설정" --session-id ${this.sessionId} --output-format json`
    );
    return this.sessionId;
  }

  async continueSession(query: string): Promise<string> {
    const result = await exec(
      `claude -p "${query}" --resume ${this.sessionId} --output-format json`
    );
    return JSON.parse(result).content;
  }

  async forkSession(query: string): Promise<string> {
    const result = await exec(
      `claude -p "${query}" --resume ${this.sessionId} --fork-session --output-format json`
    );
    // 새 세션 ID 추출 가능
    return result;
  }
}
```

#### Gemini CLI 방식

```typescript
// Gemini는 세션 ID 직접 지정이 불가하므로 다른 접근 필요
class GeminiSessionManager {
  async listSessions(): Promise<Session[]> {
    const result = await exec('gemini --list-sessions');
    // 파싱하여 세션 목록 반환
    return this.parseSessions(result);
  }

  async continueLatest(query: string): Promise<string> {
    const result = await exec(
      `gemini -r latest "${query}" -o json`
    );
    return result;
  }

  async continueByIndex(index: number, query: string): Promise<string> {
    const result = await exec(
      `gemini -r ${index} "${query}" -o json`
    );
    return result;
  }
}
```

### 핵심 차이점 요약

| 관점 | Claude CLI | Gemini CLI |
|------|-----------|------------|
| **세션 식별** | UUID 기반 (정밀 제어) | 인덱스 기반 (간편) |
| **프로그래밍 접근** | 세션 ID 직접 지정 가능 | 인덱스/latest만 가능 |
| **세션 분기** | fork 지원 | 미지원 |
| **세션 관리 UI** | 선택기 (대화형) | 목록/삭제 (CLI) |
| **파일 형식** | JSONL (점진적) | JSON (완전한 문서) |

---

## 종합 권장사항

### MCP 서버 개발 시 CLI 선택 가이드

| 요구사항 | 권장 CLI |
|---------|----------|
| 시스템 프롬프트 동적 변경 | **Claude** (유일하게 지원) |
| 세션 ID 기반 정밀 제어 | **Claude** |
| 세션 분기/실험 | **Claude** (`--fork-session`) |
| 런타임 MCP 설정 변경 | **Claude** (`--mcp-config`) |
| 간단한 세션 이어하기 | 둘 다 가능 |
| 도구 필터링이 필요한 MCP | **Gemini** (`--include/exclude-tools`) |
| 서버 신뢰 설정 필요 | **Gemini** (`--trust`) |
| 세션 목록/삭제 내장 필요 | **Gemini** |

### 하이브리드 접근

두 CLI의 장점을 조합한 MCP 서버 아키텍처:

```
┌─────────────────────────────────────────────────────┐
│                    MCP Server                        │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐         │
│  │  Claude Tools   │    │  Gemini Tools   │         │
│  ├─────────────────┤    ├─────────────────┤         │
│  │ • 시스템 프롬프트   │    │ • 빠른 세션 조회    │         │
│  │ • 세션 fork       │    │ • 도구 필터링      │         │
│  │ • MCP 설정 변경   │    │ • 간편한 재개      │         │
│  └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────┘
```
