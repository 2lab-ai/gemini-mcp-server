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

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/path/to/gemini-mcp-server/dist/gemini-mcp-server.js"]
    }
  }
}
```

*Note: Replace `/path/to/gemini-mcp-server` with the actual absolute path to your cloned directory.*

## Tools

This server exposes the following tools:

### `gemini`

Starts a new Gemini session with a prompt.

-   **Arguments:**
    -   `prompt` (string, required): The text prompt to send to Gemini.
    -   `model` (string, optional): The model to use (e.g., `gemini-2.0-flash-exp`).

-   **Returns:**
    -   The text response from the model.
    -   The new Session ID (useful for continuing the conversation).

### `gemini-reply`

Continues an existing Gemini session.

-   **Arguments:**
    -   `prompt` (string, required): The reply text to send.
    -   `sessionId` (string, optional): The UUID of the session to continue. If omitted, the server attempts to find the most recent session.
    -   `model` (string, optional): The model to use for this turn.

-   **Returns:**
    -   The text response from the model.

## Development

-   **Build:** `npm run build` - Compiles TypeScript to JavaScript in the `dist` folder.
-   **Start:** `npm start` - Runs the server (mostly for testing pipes/stdio, though MCP servers are usually run by a client).

## License

ISC
