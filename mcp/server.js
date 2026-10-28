#!/usr/bin/env node
// Server MCP Prompt Break.
//   node mcp/server.js               -> mode stdio (Claude Desktop, VS Code, Cursor)
//   node mcp/server.js --http 3333   -> mode HTTP di http://localhost:3333/mcp
// Tidak butuh paket npm apa pun: cukup modul bawaan Node.
import http from 'node:http';
import readline from 'node:readline';
import { safeHandle, httpHandler } from './http.js';

function runStdio() {
  // Satu pesan JSON-RPC per baris. Hanya balasan protokol yang boleh ke
  // stdout; log apa pun ditulis ke stderr.
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let msg;
    // Buang BOM yang kadang ikut dari PowerShell.
    try { msg = JSON.parse(line.replace(/^﻿/, '')); } catch {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
      return;
    }
    const reply = safeHandle(msg);
    if (reply) process.stdout.write(JSON.stringify(reply) + '\n');
  });
  console.error('[prompt-break] server MCP siap (stdio)');
}

function runHttp(port) {
  http.createServer(async (req, res) => {
    if (new URL(req.url, 'http://x').pathname !== '/mcp') { res.writeHead(404).end(); return; }
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 1_000_000) { res.writeHead(413).end(); return; }
    }
    let body;
    try { body = raw ? JSON.parse(raw) : undefined; } catch { body = undefined; }
    httpHandler(req, res, body);
  }).listen(port, '127.0.0.1', () => console.error(`[prompt-break] server MCP siap di http://localhost:${port}/mcp`));
}

const i = process.argv.indexOf('--http');
if (i !== -1) runHttp(Number(process.argv[i + 1]) || 3333);
else runStdio();
