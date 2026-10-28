# Install Prompt Break (instructions for AI assistants)

> **To the person reading this:** you don't have to follow these steps yourself.
> Paste this into an AI assistant that can run commands on your computer
> (Claude Code, Codex, Gemini CLI, GitHub Copilot in Agent mode, Cursor, Windsurf):
>
> ```
> Install Prompt Break from https://github.com/V-Jfira/PromptBreak by following INSTALL.md
> ```

---

**To the AI assistant:** the user wants Prompt Break installed on this computer.
Prompt Break is an MCP server (no dependencies, no API key, no network calls of its
own) that turns a short request into a six-part master prompt and shows it inside
chat apps. Follow the steps below in order.

## Ground rules

- Talk to the user in **their** language (for example Indonesian or English).
- Before changing anything, tell the user in one short list what you're about to do,
  and ask for a yes. Ask again before installing system software (step 1).
- **Back up every config file before editing it** (copy it next to the original with a
  `.bak-<date>` suffix).
- Only **add** an entry named `prompt-break`. Never remove or change other entries.
  If `prompt-break` already exists, update it in place.
- Keep every JSON/TOML file valid. Re-read the file after writing it.
- Only configure apps that are actually installed. Skip the rest without asking.
- Nothing here needs a password, API key, or token. Never ask for one.

## How it runs

Prompt Break is installed **once** on the computer (step 2). Every app then starts it
with Node.js from that install, so it opens instantly and doesn't download anything
at startup.

In step 3, `SERVER` means the full path to the installed `server.js` that you find in
step 2 (on Windows, write it with `\\` in JSON, e.g.
`"C:\\Users\\you\\AppData\\Roaming\\npm\\node_modules\\prompt-break\\mcp\\server.js"`).

## Step 1: Make sure Node.js 18+ and Git are installed

Run `node --version` and `git --version`.

If either is missing, or Node.js is older than 18, install it (ask first):

- **Windows:** `winget install --id OpenJS.NodeJS.LTS -e` and
  `winget install --id Git.Git -e`. Windows may show a permission (UAC) prompt; tell
  the user to accept it.
- **macOS:** `brew install node git` (if Homebrew is missing, install Node.js LTS from
  https://nodejs.org and run `xcode-select --install` for Git).
- **Linux:** use the distro's package manager for `git`. For Node.js, make sure the
  version is 18 or newer (the distro package is often too old; use
  https://nodejs.org or nvm if needed).

After installing, open a new terminal (or refresh PATH) before continuing.

## Step 2: Install Prompt Break and check that it runs

1. Install it (takes a few seconds; on Windows PowerShell use `npm.cmd` if `npm` is blocked):
   `npm install -g github:V-Jfira/PromptBreak`
   - On macOS/Linux, if this fails with `EACCES`, don't use `sudo`. Set a user-level npm
     folder instead (`npm config set prefix ~/.npm-global`, add `~/.npm-global/bin` to
     PATH) or use nvm, then run the install again.
2. Find the server file: run `npm root -g`; the server is
   `<that folder>/prompt-break/mcp/server.js`. Check that the file exists. This is `SERVER`.
3. Send one test message:
   - macOS / Linux / Git Bash: `echo '{"jsonrpc":"2.0","id":1,"method":"ping"}' | node "SERVER"`
   - Windows PowerShell: `'{"jsonrpc":"2.0","id":1,"method":"ping"}' | node "SERVER"`

   Expected output: `{"jsonrpc":"2.0","id":1,"result":{}}`. If you get an error, stop
   and show it to the user.

## Step 3: Register Prompt Break in every installed app

### Claude Desktop (the Chat tab)
Config file `claude_desktop_config.json`, key `mcpServers`:

- Windows: newer versions keep it in
  `%LOCALAPPDATA%\Claude-Data\claude_*\claude_desktop_config.json` (this file also
  holds the app's own settings, so add `mcpServers` next to them and leave the rest
  untouched). Older versions use `%APPDATA%\Claude\claude_desktop_config.json`, and
  Microsoft Store installs may use
  `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json`.
  Update every copy that exists. If unsure, the app opens the right file from
  Settings → Developer → Edit Config.
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{ "mcpServers": { "prompt-break": { "command": "node", "args": ["SERVER"] } } }
```

Create the file with exactly this content if it doesn't exist.

### Claude Code
If the `claude` command exists:

`claude mcp add prompt-break --scope user -- node "SERVER"`

If it says the server already exists, run `claude mcp remove prompt-break --scope user` first.

### VS Code (GitHub Copilot)
User-level file `mcp.json`, key `servers`:

- Windows: `%APPDATA%\Code\User\mcp.json`
- macOS: `~/Library/Application Support/Code/User/mcp.json`
- Linux: `~/.config/Code/User/mcp.json`

```json
{ "servers": { "prompt-break": { "type": "stdio", "command": "node", "args": ["SERVER"] } } }
```

### Cursor
`~/.cursor/mcp.json` (Windows: `%USERPROFILE%\.cursor\mcp.json`), key `mcpServers`,
same shape as Claude Desktop.

### Windsurf
`~/.codeium/windsurf/mcp_config.json`, key `mcpServers`, same shape as Claude Desktop.

### Gemini CLI
`~/.gemini/settings.json`, key `mcpServers`, same shape as Claude Desktop.

### Codex CLI
`~/.codex/config.toml`:

```toml
[mcp_servers.prompt-break]
command = "node"
args = ["SERVER"]
```

### Web apps (Claude.ai in the browser, ChatGPT)
These run on the provider's servers, so you can't install anything for them from
this computer. Tell the user they need a hosted Prompt Break address added under
Settings → Connectors, and point them to the README section
"Claude.ai (web) and ChatGPT".

## Step 4: Finish

1. Tell the user which apps you configured and which you skipped, and where the
   backups are.
2. Tell them to **fully quit and reopen** each configured app (on Windows, Claude
   Desktop also has to be quit from the tray icon near the clock).
3. Tell them how to try it, in their language:
   - English: *"Build a master prompt with Prompt Break for: a 30-day promotion plan for my coffee shop"*
   - Indonesian: *"Bangun master prompt dengan Prompt Break untuk: rencana promosi 30 hari untuk kedai kopi saya"*
   - In apps with slash commands: `/promptbreak`

## Update to the latest version

Run `npm install -g github:V-Jfira/PromptBreak` again, then fully quit and reopen the
apps. The app configs don't need to change.

## Uninstall

1. Remove the `prompt-break` entry from each file above (or run
   `claude mcp remove prompt-break --scope user` for Claude Code). The backups from
   installation can also be restored.
2. Run `npm uninstall -g prompt-break`.
3. Restart the apps.
