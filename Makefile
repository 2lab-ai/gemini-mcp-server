.PHONY: dev-up dev-rebuild dev-bash dev-down dev-claude dev-codex dev-gemini

# devcontainer 시작
dev-up:
	devcontainer up --workspace-folder .

# devcontainer 강제 리빌드
dev-rebuild:
	devcontainer up --workspace-folder . --remove-existing-container --build-no-cache

# devcontainer bash 진입
dev-bash:
	devcontainer exec --workspace-folder . bash

# devcontainer 중지
dev-down:
	docker stop $$(docker ps -q --filter "label=devcontainer.local_folder=$(PWD)")

# devcontainer에서 claude 실행
dev-claude:
	devcontainer exec --workspace-folder . claude --dangerously-skip-permissions

# devcontainer에서 codex 실행
dev-codex:
	devcontainer exec --workspace-folder . codex --full-auto

# devcontainer에서 gemini 실행
dev-gemini:
	devcontainer exec --workspace-folder . gemini
