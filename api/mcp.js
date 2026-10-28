// Server MCP Prompt Break versi online (Vercel): https://<situsmu>/api/mcp
// Tempel alamat ini sebagai "custom connector" di Claude atau ChatGPT.
import { httpHandler } from '../mcp/http.js';

export default function handler(req, res) {
  httpHandler(req, res, req.body);
}
