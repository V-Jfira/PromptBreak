# Prompt Break for Claude, ChatGPT, and Copilot (MCP App)

The Prompt Break interface (six colored cards, completeness score, clarifying
questions, copy button) appears **right inside the chat**. The master prompt is
written by the AI in that chat, using the user's own account: no API key and no
cost for the app owner.

Once installed, just type in the chat:

> Build a master prompt with Prompt Break for: a 30-day promotion plan for a coffee shop

or use the `/promptbreak` slash command if the chat app supports it.

No npm dependencies. Requires Node.js 18+ and Git for local mode.

## Install

Install it once with `npm install -g github:V-Jfira/PromptBreak`, then find the
server at `$(npm root -g)/prompt-break/mcp/server.js` (called `SERVER_PATH` below).
Apps start it straight from there, so nothing is downloaded at startup. Run the same
install command again to update.

### Claude Desktop
Open **Settings → Developer → Edit Config**, then add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prompt-break": {
      "command": "node",
      "args": ["SERVER_PATH"]
    }
  }
}
```
Quit and reopen Claude Desktop.

### VS Code (GitHub Copilot Chat)
Create `.vscode/mcp.json` in your project (or add it to your user MCP settings):

```json
{
  "servers": {
    "prompt-break": {
      "type": "stdio",
      "command": "node",
      "args": ["SERVER_PATH"]
    }
  }
}
```

### Claude Code
```bash
claude mcp add prompt-break --scope user -- node "SERVER_PATH"
```
Start a new session and check with `/mcp`. In the terminal the result is shown as
text (`# ROLE … # OUTPUT`) rather than the visual cards.

### Claude.ai (web) and ChatGPT: via an online address (coming soon, untested)
After deploying the project to Vercel, the server lives at:

```
https://<your-site>.vercel.app/api/mcp
```

- **Claude:** Settings → Connectors → Add custom connector → paste the address.
- **ChatGPT:** Settings → Apps & Connectors → developer mode → Create → paste the address.

Exact menu names may change between app versions; pick the closest match.

### From a local clone
If you cloned the repo, you can use
`"command": "node", "args": ["<repo-folder>/mcp/server.js"]` instead.

## How it works

- Tool `open_prompt_break`: opens an empty view so the user can type there.
- Tool `build_master_prompt`: the AI in the chat fills in
  the six parts, `levels`, and `questions`; the server validates them and returns a
  structured result.
- Resource `ui://prompt-break/view.html`: the original interface (the `view/`
  folder), bundled into a single HTML file when read.
- The **Analyze again** button sends a message to the chat, so the AI
  rebuilds the prompt and a new view appears. If the chat app doesn't allow that,
  the view falls back to the local rule-based analysis.
- Chat apps that don't support MCP Apps yet still get the result as plain text with
  `# ROLE … # OUTPUT` headings.

## Run the server yourself

```bash
node mcp/server.js --http 3333
```
The MCP server runs at `http://localhost:3333/mcp`.

## Credits

Created by **Valdy** ([@V-Jfira](https://github.com/V-Jfira)) · [valdytapahing@gmail.com](mailto:valdytapahing@gmail.com)
