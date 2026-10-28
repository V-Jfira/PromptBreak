// Inti server MCP Prompt Break, tanpa dependensi.
// Menangani pesan JSON-RPC MCP; dipakai oleh server.js (stdio dan HTTP)
// dan oleh api/mcp.js (Vercel).
//
// Cara kerjanya: AI di aplikasi chat pengguna (Claude, ChatGPT, Copilot di
// VS Code, dll.) yang menyusun master prompt dan mengirimnya sebagai argumen
// tool build_master_prompt. Server hanya memeriksa hasilnya dan
// menautkan tool itu ke tampilan (ui://prompt-break/view.html) yang
// digambar aplikasi chat di dalam percakapan.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VERSION = '1.0.0';
const SECTION_KEYS = ['role', 'task', 'context', 'reasoning', 'stop', 'output'];
const SECTION_NAMES = { role: 'ROLE', task: 'TASK', context: 'CONTEXT', reasoning: 'REASONING', stop: 'STOP CONDITIONS', output: 'OUTPUT' };
const VIEW_URI = 'ui://prompt-break/view.html';
const VIEW_MIME = 'text/html;profile=mcp-app';
const TOOL_NAME = 'build_master_prompt';
const OLD_TOOL_NAMES = ['bangun_master_prompt']; // nama lama, tetap diterima
const OPEN_TOOL_NAME = 'open_prompt_break';

// ---------- tampilan ----------

let viewHtml;
function view() {
  if (viewHtml) return viewHtml;
  const read = (f) => fs.readFileSync(path.join(HERE, 'view', f), 'utf8');
  // Gabungkan jadi satu file: aplikasi chat menampilkan HTML ini di
  // bingkai terisolasi yang tidak bisa memuat file lain dari server.
  const script = read('local-analyzer.js').replace(/^export /gm, '') + '\n' + read('app.js');
  viewHtml = read('index.html')
    .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${read('style.css')}</style>`)
    .replace('<script type="module" src="app.js"></script>', () => `<script type="module">\n${script}</script>`);
  return viewHtml;
}

const VIEW_META = {
  ui: {
    csp: { resourceDomains: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'] },
    permissions: { clipboardWrite: {} },
    prefersBorder: false,
  },
};

// ---------- tool ----------

const RULES = `Turn the user's short prompt into a MASTER PROMPT with six parts, then call this tool to display it. You write the content yourself.

1. role — "Act as ..." The most fitting expert role, plus one priority sentence ("Prioritize X over Y").
2. task — The specific job to finish, and how the final result should wrap up (e.g. "end with a ready-to-run summary").
3. context — Start with "What I know:" followed by "- Label: value" lines with facts from the user's input. For important facts that are NOT in the input, write "- Label: [FILL IN: what is needed]". NEVER make up facts (numbers, names, locations, budgets).
4. reasoning — The end goal and why this structure is used; ask the AI to explain the reasoning behind each step and to ask first if any [FILL IN] is still open.
5. stop — Start with "Consider it done only when:" followed by "- ..." lines with measurable completion criteria (amount, coverage, connections, closing).
6. output — The specific result format: its shape (table/list/text/code) and the columns or sections every item must have.

Rules:
- Write every part, the questions included, in the same language as the user's input, and translate the fixed phrases above. For Indonesian use "Bertindaklah sebagai ...", "Yang saya ketahui:", "Anggap selesai hanya jika:", and the marker [ISI: ...].
- Be specific to this request; avoid generic sentences that would fit any prompt.
- levels: 1 = the information for that part clearly comes from the user's input, 0.5 = you reasonably assumed it, 0 = there is no information at all.
- questions: at most 6 short clarifying questions that would most improve the result, each tagged with the part it completes.
- After calling the tool, reply with one short sentence only; the view already shows every part.`;

const levelSchema = { type: 'number', enum: [0, 0.5, 1] };
const TOOL = {
  name: TOOL_NAME,
  title: 'Prompt Break',
  description: RULES,
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string', description: "The user's original sentence, as is." },
      ...Object.fromEntries(SECTION_KEYS.map((k) => [k, { type: 'string', description: `Content of the ${SECTION_NAMES[k]} part.` }])),
      levels: {
        type: 'object',
        properties: Object.fromEntries(SECTION_KEYS.map((k) => [k, levelSchema])),
        required: SECTION_KEYS,
      },
      questions: {
        type: 'array',
        maxItems: 6,
        items: {
          type: 'object',
          properties: { key: { type: 'string', enum: SECTION_KEYS }, text: { type: 'string' } },
          required: ['key', 'text'],
        },
      },
    },
    required: ['input', ...SECTION_KEYS, 'levels', 'questions'],
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  // Dua bentuk kunci agar dikenali aplikasi chat versi lama maupun baru.
  _meta: { ui: { resourceUri: VIEW_URI }, 'ui/resourceUri': VIEW_URI },
};

// Tool kedua: buka tampilan kosong agar pengguna bisa langsung mengetik di sana.
const OPEN_TOOL = {
  name: OPEN_TOOL_NAME,
  title: 'Open Prompt Break',
  description: `Open the Prompt Break view so the user can type a short prompt there and analyze it. Use this when the user asks to open, launch, or show Prompt Break without giving a request yet. If they already gave a request, build the master prompt and call ${TOOL_NAME} instead. After calling, reply with one short sentence only.`,
  inputSchema: {
    type: 'object',
    properties: { input: { type: 'string', description: 'Optional text to prefill in the prompt box.' } },
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  _meta: { ui: { resourceUri: VIEW_URI }, 'ui/resourceUri': VIEW_URI },
};

function openTool(args) {
  const input = typeof args?.input === 'string' ? args.input.trim().slice(0, 2000) : '';
  return {
    content: [{ type: 'text', text: 'Prompt Break is open. Type a short prompt in the view and click Analyze.' }],
    structuredContent: { input },
  };
}

function callTool(args) {
  const a = args && typeof args === 'object' ? args : {};
  const missing = SECTION_KEYS.filter((k) => typeof a[k] !== 'string' || !a[k].trim());
  if (missing.length) {
    return {
      isError: true,
      content: [{ type: 'text', text: `These parts are empty: ${missing.join(', ')}. Fill in every part, then call ${TOOL_NAME} again.` }],
    };
  }
  const sections = Object.fromEntries(SECTION_KEYS.map((k) => [k, a[k].trim()]));
  const levels = Object.fromEntries(SECTION_KEYS.map((k) => {
    const v = Number(a.levels?.[k]);
    return [k, v === 0 || v === 0.5 || v === 1 ? v : 0.5];
  }));
  const questions = (Array.isArray(a.questions) ? a.questions : [])
    .filter((q) => q && SECTION_KEYS.includes(q.key) && typeof q.text === 'string' && q.text.trim())
    .slice(0, 6)
    .map((q) => ({ key: q.key, text: q.text.trim() }));
  const input = typeof a.input === 'string' ? a.input.trim().slice(0, 2000) : '';

  // Teks biasa untuk aplikasi chat yang belum bisa menampilkan MCP App.
  const text = SECTION_KEYS.map((k) => `# ${SECTION_NAMES[k]}\n${sections[k]}`).join('\n\n')
    + (questions.length ? `\n\n# QUESTIONS\n${questions.map((q, i) => `${i + 1}. (${SECTION_NAMES[q.key]}) ${q.text}`).join('\n')}` : '');
  return {
    content: [{ type: 'text', text }],
    structuredContent: { input, sections, levels, questions },
  };
}

// ---------- prompt (perintah garis miring, mis. /promptbreak) ----------

const PROMPT = {
  name: 'promptbreak',
  title: 'Prompt Break',
  description: 'Turn one sentence into a six-part master prompt and show it with Prompt Break.',
  arguments: [{ name: 'request', description: 'Your short prompt, e.g. "a 30-day promotion plan for my coffee shop"', required: true }],
};

// ---------- JSON-RPC ----------

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

// Mengembalikan objek balasan, atau null untuk notifikasi (tanpa balasan).
export function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return msg && msg.id != null ? fail(msg.id, -32600, 'Invalid Request') : null;
  }
  const { id, method, params = {} } = msg;
  if (id == null) return null; // notifikasi, mis. notifications/initialized

  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: typeof params.protocolVersion === 'string' ? params.protocolVersion : '2025-06-18',
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, prompts: { listChanged: false } },
        serverInfo: { name: 'prompt-break', title: 'Prompt Break', version: VERSION },
        instructions: `When the user wants to improve, structure, or "break down" a prompt, build a six-part master prompt and call ${TOOL_NAME} so the view appears. When the user only asks to open Prompt Break, call ${OPEN_TOOL_NAME}.`,
      });
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: [TOOL, OPEN_TOOL] });
    case 'tools/call':
      if (params.name === OPEN_TOOL_NAME) return ok(id, openTool(params.arguments));
      if (params.name !== TOOL_NAME && !OLD_TOOL_NAMES.includes(params.name)) return fail(id, -32602, `Unknown tool: ${params.name}`);
      return ok(id, callTool(params.arguments));
    case 'resources/list':
      return ok(id, { resources: [{ uri: VIEW_URI, name: 'Prompt Break', mimeType: VIEW_MIME, _meta: VIEW_META }] });
    case 'resources/templates/list':
      return ok(id, { resourceTemplates: [] });
    case 'resources/read':
      if (params.uri !== VIEW_URI) return fail(id, -32002, `Resource not found: ${params.uri}`);
      return ok(id, { contents: [{ uri: VIEW_URI, mimeType: VIEW_MIME, text: view(), _meta: VIEW_META }] });
    case 'prompts/list':
      return ok(id, { prompts: [PROMPT] });
    case 'prompts/get': {
      if (params.name !== PROMPT.name) return fail(id, -32602, `Unknown prompt: ${params.name}`);
      const req = String(params.arguments?.request || params.arguments?.permintaan || '').trim();
      return ok(id, {
        description: PROMPT.description,
        messages: [{ role: 'user', content: { type: 'text', text: `Build a master prompt with Prompt Break (call the ${TOOL_NAME} tool) for: "${req}"` } }],
      });
    }
    default:
      return fail(id, -32601, `Method not supported: ${method}`);
  }
}

// Menangani isi permintaan HTTP (satu pesan atau batch). Mengembalikan
// balasan untuk dikirim, atau null bila semuanya notifikasi.
export function handleBody(body) {
  if (Array.isArray(body)) {
    const out = body.map(handleMessage).filter(Boolean);
    return out.length ? out : null;
  }
  return handleMessage(body);
}
