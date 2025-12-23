# Gemini MCP Server

A Model Context Protocol (MCP) server that provides a bridge to Google's Gemini CLI. This allows MCP-compliant clients (like Claude Desktop) to interact with the Gemini CLI to start new chat sessions or continue existing ones directly from the client interface.

## Features

- **Start New Sessions**: Initiate a new conversation with a specific Gemini model.
- **Continue Sessions**: Reply to existing sessions using their Session ID.
- **Session Management**: Automatically detects the latest session ID if one is not provided for replies.
- **Model Selection**: Supports specifying different Gemini models (e.g., `gemini-2.0-flash-exp`, `gemini-1.5-pro`).

## Prerequisites

Before using this server, ensure you have the following installed:

1.  **Node.js**: v18 or higher.
2.  **Gemini CLI**: You must have the `gemini` CLI tool installed and configured on your system.
    - Ensure `gemini` is in your system's PATH.
    - Ensure you have authenticated or set up necessary API keys for the `gemini` CLI to work.

## Installation

You can run this server directly using `npx` or by building it locally.

### Local Setup

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd gemini-mcp-server
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```

## Configuration

To use this with an MCP client (e.g., Claude Desktop), add the server configuration to your client's settings file.

### Claude Desktop Configuration

Add the following to your `claude_desktop_config.json` (usually located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

**Using source (for development):**
MCP (Model Context Protocol) server for interacting with Google's Gemini CLI.

This server allows AI assistants like Claude to use Google's Gemini through the MCP protocol.

## Prerequisites

- Node.js 18+
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed and authenticated

```bash
# Install Gemini CLI
npm install -g @anthropic-ai/gemini-cli
# or
brew install gemini-cli

# Authenticate
gemini auth
```

## Installation

### Global Installation

```bash
npm install -g @2lab.ai/gemini-mcp-server
```

### Run directly with npx

```bash
npx @2lab.ai/gemini-mcp-server
```

## Usage

### Running the server

After global installation:

```bash
gemini-mcp-server
```

Or with npx:

```bash
npx @2lab.ai/gemini-mcp-server
```

### Testing with MCP Inspector

You can test and debug the server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector npx @2lab.ai/gemini-mcp-server
```

Or if globally installed:

```bash
npx @modelcontextprotocol/inspector gemini-mcp-server
```

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "@2lab.ai/gemini-mcp-server"]
    }
  }
}
```

Or if globally installed:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "gemini-mcp-server"
    }
  }
}
```

### Claude Code Configuration

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "@2lab.ai/gemini-mcp-server"]
    }
  }
}
```

## Available Tools

### `gemini`

Start a new Gemini session with a prompt.

**Parameters:**
- `prompt` (required): The prompt to start the session with
- `model` (optional): The model to use (e.g., 'gemini-2.0-flash-exp', 'gemini-1.5-pro')

**Returns:** Response text and new Session ID

### `gemini-reply`

Continue an existing Gemini session.

**Parameters:**
- `prompt` (required): The prompt to continue the conversation
- `sessionId` (optional): The session ID to continue. If not provided, uses the latest session
- `model` (optional): The model to use for this turn

**Returns:** Response text

## Development

```bash
# Clone the repository
git clone https://github.com/2lab-ai/gemini-mcp-server.git
cd gemini-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start
```

## CI/CD

This project uses GitHub Actions to automatically publish to npm when changes are pushed to the `main` branch.

To enable automatic publishing:

1. Generate an npm access token from [npmjs.com](https://www.npmjs.com/settings/~/tokens)
2. Add the token as a secret named `NPM_TOKEN` in your GitHub repository settings
3. Bump the version in `package.json` before pushing to trigger a publish

## License

ISC
