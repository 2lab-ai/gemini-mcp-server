FROM mcr.microsoft.com/devcontainers/typescript-node:22

# nvm에 Node 22, 25 설치
RUN bash -c "source /usr/local/share/nvm/nvm.sh && nvm install 22 && nvm install 25"

# Global npm packages 설치 (시스템 npm 사용)
RUN npm install -g \
    @openai/codex \
    @google/gemini-cli \
    @anthropic-ai/claude-code \
    && npm cache clean --force

# nvm 버전별 global packages도 설치
RUN bash -c "source /usr/local/share/nvm/nvm.sh && nvm use 22 && npm install -g \
    @openai/codex \
    @google/gemini-cli \
    @anthropic-ai/claude-code"

RUN bash -c "source /usr/local/share/nvm/nvm.sh && nvm use 25 && npm install -g \
    @openai/codex \
    @google/gemini-cli \
    @anthropic-ai/claude-code"

# 인증 파일 마운트 포인트 생성
RUN mkdir -p /home/node/.claude && chown node:node /home/node/.claude

# Claude 설정 파일 (온보딩 스킵)
RUN echo '{"hasCompletedOnboarding":true}' > /home/node/.claude.json && chown node:node /home/node/.claude.json

# Aliases 설정 (컨테이너 내 권한 전부 허용)
RUN echo 'alias claude="claude --dangerously-skip-permissions"' >> /home/node/.bashrc \
    && echo 'alias codex="codex --full-auto"' >> /home/node/.bashrc
