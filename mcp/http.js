// Penangan HTTP untuk server MCP (Streamable HTTP tanpa sesi): setiap POST
// dijawab langsung dengan JSON. Dipakai server.js --http dan api/mcp.js (Vercel).
import { handleMessage, handleBody } from './core.js';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id, authorization',
};

export function safeHandle(msg) {
  try {
    return Array.isArray(msg) ? handleBody(msg) : handleMessage(msg);
  } catch (e) {
    console.error('[prompt-break]', e);
    return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32603, message: 'Kesalahan di server' } };
  }
}

const json = (res, status, obj) => res.writeHead(status, { ...CORS, 'content-type': 'application/json' }).end(JSON.stringify(obj));

// body: isi permintaan yang sudah di-parse dari JSON (undefined bila gagal).
export function httpHandler(req, res, body) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS).end(); return; }
  if (req.method !== 'POST') { res.writeHead(405, { ...CORS, allow: 'POST' }).end(); return; }
  if (!body || typeof body !== 'object') {
    json(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  const reply = safeHandle(body);
  if (!reply) { res.writeHead(202, CORS).end(); return; }
  json(res, 200, reply);
}
