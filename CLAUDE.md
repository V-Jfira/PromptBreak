# Prompt Break — catatan untuk Claude Code

## Apa ini
MCP App yang mengubah prompt singkat (satu kalimat) menjadi master prompt 6 bagian:
ROLE, TASK, CONTEXT, REASONING, STOP CONDITIONS, OUTPUT, lalu menampilkannya di dalam
chat Claude, ChatGPT, dan Copilot. Tidak butuh API key: yang menulis isi prompt adalah
AI di chat itu sendiri.

Jelaskan perubahan dengan bahasa sederhana dalam Bahasa Indonesia, dan sebutkan
perintah yang perlu dijalankan.

## Tampilan
- Tata letak dan teks tampilan (`mcp/view/`) sengaja dipertahankan seperti versi asli;
  jangan diubah kecuali diminta.
- Palet: latar slate `#EEF2F7`, teks `#0F172A`, aksen indigo `#4338CA`. Warna bagian:
  Role biru langit, Task indigo, Context hijau, Reasoning mustard, Stop slate, Output rose.
- Dua bahasa (Indonesia/Inggris): teks ada di `STR` (app.js) dan cabang `en` di
  local-analyzer.js. Urutan pilihan bahasa: bahasa isi prompt bila jelas, lalu
  `hostContext.locale` dari aplikasi chat, lalu bahasa browser; "id" = Indonesia,
  selain itu Inggris. Penanda kosong: `[ISI]` / `[FILL IN]`.
- Teks untuk AI di `core.js` (RULES, deskripsi tool) berbahasa Inggris; AI diminta
  menulis dalam bahasa input pengguna.

## Arsitektur (folder mcp/)
- MCP Apps (`io.modelcontextprotocol/ui`), tanpa dependensi: protokol MCP (JSON-RPC)
  dan jembatan postMessage ditulis sendiri.
- `core.js` = tool `build_master_prompt` (+ `open_prompt_break` untuk membuka tampilan kosong), resource `ui://prompt-break/view.html`,
  prompt `promptbreak`; `http.js` = Streamable HTTP tanpa sesi; `server.js` = stdio / `--http`;
  `api/mcp.js` = versi Vercel (root situs dialihkan ke repo GitHub).
- `mcp/view/` = index.html, style.css, local-analyzer.js (analisis cadangan tanpa AI)
  + `app.js` (render + jembatan host). Digabung jadi satu HTML di `core.js`.
- Kotak jawaban (opsional) di bawah tiap pertanyaan. "Masukkan jawaban" mengganti penanda
  [ISI] yang paling cocok langsung di tampilan (tanpa chat); tautan kecil "atau minta <AI> rapikan seluruh prompt" juga
  mengirim jawaban ke chat
  (`ui/message`) agar AI menyusun ulang semua bagian.
- Tombol "Analisis ulang" memakai event click (bukan submit) karena iframe host biasanya
  tanpa `allow-forms`; ia mengirim `ui/message` ke chat.

## Kontrak hasil
`{ sections: {role,task,context,reasoning,stop,output}, levels: {…: 0|0.5|1}, questions: [{key,text}] }`.
levels: 1 = dari input pengguna, 0.5 = diasumsikan, 0 = perlu diisi.

## Aturan penting
- Semua teks dari AI dirender dengan `textContent`, jangan `innerHTML`.
- Jangan mengarang fakta di bagian Context: info yang tidak ada di input → `[ISI: ...]`.
- Jangan menambah dependensi npm.

## Status
- Diuji: protokol via stdio & HTTP, tampilan di host tiruan (iframe sandbox), pemasangan
  via `npm install -g github:V-Jfira/PromptBreak` (aplikasi menjalankan `node <npm root -g>/prompt-break/mcp/server.js`).
- Sudah berjalan di Claude Desktop (Windows, tab Chat). BELUM diuji di ChatGPT/VS Code sungguhan, belum di-deploy ke Vercel,
  dan paket belum diterbitkan ke npm.
