#!/bin/bash
# Claude Code 인증 정보를 키체인에서 추출하여 파일로 저장
# devcontainer에서 사용하기 위함

CREDENTIALS_FILE="$HOME/.claude/.credentials.json"

echo "Claude Code 키체인에서 인증 정보를 추출합니다."
echo "macOS 암호 입력 프롬프트가 나타날 수 있습니다."
echo ""

# 키체인에서 Claude Code-credentials 가져오기
CREDENTIALS=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null)

if [ -z "$CREDENTIALS" ]; then
    echo "❌ 키체인에서 Claude Code-credentials를 찾을 수 없습니다."
    echo "   Claude Code에 먼저 로그인해주세요."
    exit 1
fi

# jq가 있는지 확인
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq가 설치되어 있지 않습니다. brew install jq로 설치해주세요."
    echo "   누락된 필드 없이 원본 그대로 저장합니다."

    mkdir -p "$(dirname "$CREDENTIALS_FILE")"
    echo "$CREDENTIALS" > "$CREDENTIALS_FILE"
    chmod 600 "$CREDENTIALS_FILE"

    echo "✅ 인증 정보가 저장되었습니다: $CREDENTIALS_FILE"
    exit 0
fi

# 키체인에서 가져온 데이터에 누락된 필드 추가
# scopes에 필수 항목이 없으면 추가
CREDENTIALS=$(echo "$CREDENTIALS" | jq '
  .claudeAiOauth.scopes = ((.claudeAiOauth.scopes // []) | unique |
    (if contains(["user:inference"]) then . else . + ["user:inference"] end) |
    (if contains(["user:profile"]) then . else . + ["user:profile"] end) |
    (if contains(["user:sessions:claude_code"]) then . else . + ["user:sessions:claude_code"] end)
  ) |
  .claudeAiOauth.subscriptionType = (.claudeAiOauth.subscriptionType // "team") |
  .claudeAiOauth.rateLimitTier = (.claudeAiOauth.rateLimitTier // "default_claude_max_5x")
')

# 디렉토리 생성
mkdir -p "$(dirname "$CREDENTIALS_FILE")"

# 파일로 저장
echo "$CREDENTIALS" > "$CREDENTIALS_FILE"
chmod 600 "$CREDENTIALS_FILE"

echo "✅ 인증 정보가 저장되었습니다: $CREDENTIALS_FILE"
echo ""
echo "내용 미리보기:"
echo "$CREDENTIALS" | jq -c '.claudeAiOauth | {accessToken: .accessToken[0:20], scopes, subscriptionType, rateLimitTier}'
