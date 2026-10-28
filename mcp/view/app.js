// Tampilan Prompt Break di dalam chat (MCP App).
// AI di chat (Claude, ChatGPT, Copilot, ...) yang menyusun master prompt
// lewat tool build_master_prompt; halaman ini hanya menampilkannya.
// Komunikasi dengan aplikasi chat memakai JSON-RPC lewat postMessage
// sesuai spesifikasi MCP Apps (io.modelcontextprotocol/ui).
//
// Saat disajikan, file ini digabung dengan local-analyzer.js menjadi satu
// <script>, jadi KEYS, EXAMPLES, EXAMPLES_EN, analyzeLocal, norm, setLang
// sudah tersedia.

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const state = { sections: {}, levels: {}, questions: [], answers: {}, analyzed: false, busy: false, mode: 'ai' };
let hostName = 'AI';

// ---------- bahasa ----------
// Bahasa tampilan: bahasa isi prompt bila jelas terdeteksi, lalu bahasa
// aplikasi chat (hostContext.locale), lalu bahasa browser. Indonesia untuk
// "id", selain itu Inggris.

const STR = {
  id: {
    title: 'Prompt Break — bangun master prompt untuk Claude',
    h1: ['Tulis ', 'satu kalimat', '. Dapat master prompt lengkap.'],
    lead: 'Tidak perlu jago menulis prompt. Ceritakan saja maumu, nanti dipecah jadi enam bagian. Yang masih kurang ditandai [ISI] dan ditanyakan ke kamu, lalu semuanya dirangkai jadi satu prompt utuh yang tinggal kamu tempel ke Claude, Copilot, ChatGPT, atau AI favoritmu.',
    inputLabel: 'Prompt singkatmu',
    placeholder: 'Contoh: Buatkan rencana promosi 30 hari untuk kedai kopi baru saya',
    go: 'Analisis dan bangun master prompt',
    goAgain: 'Analisis ulang',
    busy: (h) => `${h} sedang menganalisis...`,
    tryExample: 'Coba contoh',
    completeness: 'KELENGKAPAN INPUTMU',
    lvFull: 'dari inputmu',
    lvHalf: 'diasumsikan',
    lvNone: 'perlu diisi',
    qTitle: 'JAWAB INI UNTUK PROMPT LEBIH TAJAM',
    qHint: 'Boleh dijawab, boleh dilewati. Isi jawabanmu, lalu klik Masukkan jawaban: master prompt langsung diperbarui di sini.',
    answerPh: 'Jawabanmu (boleh dikosongkan)',
    applyAnswers: 'Masukkan jawaban',
    polish: (h) => `atau minta ${h} rapikan seluruh prompt`,
    applied: 'Jawabanmu sudah dimasukkan ke master prompt.',
    polishFallback: 'Aplikasi chat tidak bisa dihubungi, jadi jawabanmu dimasukkan langsung tanpa dirapikan AI.',
    askAnswers: (s, lines) => `Perbarui master prompt dengan Prompt Break untuk: "${s}"\n\nJawaban saya atas pertanyaan klarifikasi:\n${lines}`,
    anatomyTitle: 'Enam bagian master prompt',
    copy: 'Salin master prompt',
    copied: 'Tersalin',
    copyFail: 'Gagal, salin manual',
    note: 'Setiap bagian bisa kamu edit langsung. Teks bertanda [ISI] adalah informasi yang tidak ada di inputmu, jadi isi sendiri sebelum dipakai.',
    modeAi: (h) => `Dianalisis oleh ${h}.`,
    modeLocal: 'Dianalisis dengan aturan lokal tanpa AI: cepat, tapi tidak sepintar Claude.',
    errNoHost: 'Tidak berjalan di dalam aplikasi chat.',
    errNoReply: 'Aplikasi chat tidak menjawab.',
    errDeclined: 'Permintaan ditolak.',
    errAiFailed: 'AI gagal menyusun master prompt.',
    errCancelled: 'Analisis dibatalkan.',
    errShort: 'Tulis prompt minimal beberapa kata.',
    sent: 'Permintaan dikirim ke chat. Hasil barunya akan muncul di bawah.',
    errFallback: 'Aplikasi chat tidak bisa dihubungi. Menampilkan hasil analisis lokal sebagai gantinya.',
    ask: (s) => `Bangun master prompt dengan Prompt Break untuk: "${s}"`,
  },
  en: {
    title: 'Prompt Break — build a master prompt for any AI',
    h1: ['Write ', 'one sentence', '. Get a complete master prompt.'],
    lead: 'No need to be good at writing prompts. Just say what you want, and it gets broken into six parts. Anything missing is marked [FILL IN] and asked back to you, then everything comes together into one complete prompt you can paste into Claude, Copilot, ChatGPT, or your favorite AI.',
    inputLabel: 'Your short prompt',
    placeholder: 'Example: Make a 30-day promotion plan for my new coffee shop',
    go: 'Analyze and build the master prompt',
    goAgain: 'Analyze again',
    busy: (h) => `${h} is analyzing...`,
    tryExample: 'Try an example',
    completeness: 'HOW COMPLETE YOUR INPUT IS',
    lvFull: 'from your input',
    lvHalf: 'assumed',
    lvNone: 'needs input',
    qTitle: 'ANSWER THESE FOR A SHARPER PROMPT',
    qHint: 'Answering is optional. Type your answers, then click Add my answers: the master prompt updates right here.',
    answerPh: 'Your answer (optional)',
    applyAnswers: 'Add my answers',
    polish: (h) => `or ask ${h} to polish the whole prompt`,
    applied: 'Your answers were added to the master prompt.',
    polishFallback: "Couldn't reach the chat app, so your answers were added directly, without AI polish.",
    askAnswers: (s, lines) => `Update the master prompt with Prompt Break for: "${s}"\n\nMy answers to the clarifying questions:\n${lines}`,
    anatomyTitle: 'The six parts of a master prompt',
    copy: 'Copy master prompt',
    copied: 'Copied',
    copyFail: "Couldn't copy, copy it manually",
    note: "You can edit every part directly. Text marked [FILL IN] is information that wasn't in your input, so fill it in yourself before using the prompt.",
    modeAi: (h) => `Analyzed by ${h}.`,
    modeLocal: 'Analyzed with built-in rules, no AI: fast, but not as smart as Claude.',
    errNoHost: 'Not running inside a chat app.',
    errNoReply: "The chat app didn't respond.",
    errDeclined: 'The request was declined.',
    errAiFailed: "The AI couldn't build the master prompt.",
    errCancelled: 'The analysis was cancelled.',
    errShort: 'Write at least a few words.',
    sent: 'Request sent to the chat. The new result will appear below.',
    errFallback: "Couldn't reach the chat app. Showing the built-in analysis instead.",
    ask: (s) => `Build a master prompt with Prompt Break for: "${s}"`,
  },
};

const langOf = (locale) => (/^id\b/i.test(String(locale || '')) ? 'id' : 'en');
let hostLang = langOf(navigator.language);
let textLang = null;
let lang = hostLang;
const t = (k) => STR[lang][k];
const sub = (k) => (lang === 'en' ? k.en.sub : k.sub);
const desc = (k) => (lang === 'en' ? k.en.desc : k.desc);

// Tebak bahasa sebuah teks dari kata-kata umum; null bila tidak yakin.
function guessLang(text) {
  const words = String(text || '').toLowerCase().match(/[a-z]+/g) || [];
  const ID = /^(yang|untuk|dan|saya|aku|buatkan|buat|dengan|di|ini|itu|ke|dari|jelaskan|tolong|bagaimana|cara|apa|dalam|agar|kita|kamu|baru|hari|bulan|minggu)$/;
  const EN = /^(the|for|and|my|with|to|of|a|an|how|what|make|write|explain|please|in|on|new|day|days|week|month|plan|create|build)$/;
  let id = 0, en = 0;
  words.forEach((w) => { if (ID.test(w)) id++; else if (EN.test(w)) en++; });
  if (id >= 2 && id > en) return 'id';
  if (en >= 2 && en > id) return 'en';
  return null;
}

// Ganti teks terakhir sebuah elemen, biarkan anak lain (mis. ikon) tetap.
function setText(node, s) {
  const last = [...node.childNodes].reverse().find((c) => c.nodeType === 3 && c.nodeValue.trim());
  if (last) last.nodeValue = s;
  else node.append(s);
}

function applyLang() {
  const next = textLang || hostLang;
  if (next === lang && document.documentElement.lang === next) return;
  lang = next;
  setLang(lang);
  document.documentElement.lang = lang;
  document.title = t('title');
  const h1 = $('h1').childNodes;
  [h1[0].nodeValue, h1[1].textContent, h1[2].nodeValue] = t('h1');
  document.querySelectorAll('[data-i18n]').forEach((n) => setText(n, t(n.dataset.i18n)));
  $('input').placeholder = t('placeholder');
  renderExamples();
  renderAnatomy();
  renderTray();
  if (state.analyzed) { renderQuestions(); renderSections(state.mode); }
  setBusy(state.busy);
}

// ---------- elemen statis ----------

function renderExamples() {
  $('examples').replaceChildren(...(lang === 'en' ? EXAMPLES_EN : EXAMPLES).map((s) => {
    const b = el('button', 'example', s);
    b.type = 'button';
    b.addEventListener('click', () => { $('input').value = s; $('input').focus(); });
    return b;
  }));
}

function renderAnatomy() {
  const box = $('anatomy');
  box.querySelectorAll('.anat').forEach((n) => n.remove());
  KEYS.forEach((k) => {
    const row = el('div', 'anat');
    const badge = el('span', 'badge', k.n);
    badge.style.background = k.c;
    const body = el('div');
    const name = el('div', 'anat-name', k.name + ' ');
    name.style.color = k.d;
    name.append(el('span', 'anat-sub', '· ' + sub(k)));
    body.append(name, el('div', 'anat-desc', desc(k)));
    row.append(badge, body);
    box.append(row);
  });
}

const levelText = (lv) => t(lv === 1 ? 'lvFull' : lv === 0.5 ? 'lvHalf' : 'lvNone');

function renderTray() {
  $('tray').replaceChildren(...KEYS.map((k) => {
    const lv = state.analyzed ? state.levels[k.key] : -1;
    const c = el('div', 'chip');
    if (lv === 1) Object.assign(c.style, { background: k.c, color: '#fff', border: `1.5px solid ${k.c}` });
    else if (lv === 0.5) Object.assign(c.style, { background: k.t, color: k.d, border: `1.5px solid ${k.c}` });
    c.append(el('span', 'num', k.n), el('span', null, k.name));
    c.title = levelText(lv);
    return c;
  }));
  const w = { role: 1, task: 1, context: 2, reasoning: 1, stop: 1, output: 1 };
  let got = 0, tot = 0;
  KEYS.forEach((k) => { got += (state.levels[k.key] || 0) * w[k.key]; tot += w[k.key]; });
  const score = state.analyzed ? Math.round((got / tot) * 100) : 0;
  $('score').textContent = score + '%';
  $('barFill').style.width = score + '%';
}

function renderQuestions() {
  const byKey = Object.fromEntries(KEYS.map((k) => [k.key, k]));
  $('questions').replaceChildren(...state.questions.map((q, i) => {
    const k = byKey[q.key];
    const wrap = el('div', 'q');
    const tag = el('span', 'q-tag', k.name);
    Object.assign(tag.style, { background: k.t, color: k.d });
    const answer = el('input', 'q-answer');
    answer.type = 'text';
    answer.placeholder = t('answerPh');
    answer.setAttribute('aria-label', q.text);
    answer.value = state.answers[i] || '';
    answer.addEventListener('input', () => { state.answers[i] = answer.value; showQError(''); updateSendButton(); });
    answer.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); applyAnswers(); } });
    wrap.append(tag, el('span', 'q-text', q.text), answer);
    return wrap;
  }));
  $('qCard').hidden = !state.questions.length;
  updateSendButton();
}

// Menjawab itu opsional: tombol kirim baru muncul setelah ada jawaban.
function updateSendButton() {
  $('qActions').hidden = !Object.values(state.answers).some((v) => norm(v));
  $('polish').textContent = t('polish')(hostName);
}

function renderSections(mode) {
  state.mode = mode;
  $('sections').replaceChildren(...KEYS.map((k) => {
    const lv = state.levels[k.key];
    const sec = el('div', 'sec');
    const head = el('div', 'sec-head');
    head.style.background = k.t;
    const badge = el('span', 'badge', k.n);
    badge.style.background = k.c;
    const name = el('span', 'sec-name', k.name + ' ');
    name.style.color = k.d;
    name.append(el('small', null, '· ' + sub(k)));
    const tag = el('span', 'sec-tag', levelText(lv));
    tag.style.color = k.d;
    head.append(badge, name, tag);
    const ta = el('textarea');
    ta.setAttribute('aria-label', k.name);
    ta.value = state.sections[k.key] || '';
    ta.rows = Math.max(3, ta.value.split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / 80)), 0));
    ta.addEventListener('input', () => { state.sections[k.key] = ta.value; });
    sec.append(head, ta);
    return sec;
  }));
  $('modeNote').textContent = mode === 'ai' ? t('modeAi')(hostName) : t('modeLocal');
  $('anatomy').hidden = true;
  $('result').hidden = false;
}

function setBusy(b) {
  state.busy = b;
  $('go').disabled = b;
  $('applyAnswers').disabled = b;
  $('polish').disabled = b;
  $('go').textContent = b ? t('busy')(hostName) : (state.analyzed ? t('goAgain') : t('go'));
  document.body.classList.toggle('loading', b);
}

function showError(msg) {
  $('err').style.color = '';
  $('err').textContent = msg || '';
  $('err').hidden = !msg;
}

function showQError(msg, muted) {
  $('qErr').style.color = muted ? 'var(--muted)' : '';
  $('qErr').textContent = msg || '';
  $('qErr').hidden = !msg;
}

function show(res, mode) {
  state.sections = { ...res.sections };
  state.levels = res.levels;
  state.questions = res.questions || [];
  state.answers = {};
  showQError('');
  state.analyzed = true;
  setBusy(false);
  renderTray();
  renderQuestions();
  renderSections(mode);
}

// Rapikan argumen/hasil tool menjadi bentuk yang dipakai halaman.
function fromToolData(d) {
  if (!d || typeof d !== 'object') return null;
  const src = d.sections && typeof d.sections === 'object' ? d.sections : d;
  const sections = {};
  for (const k of KEYS) {
    if (typeof src[k.key] !== 'string' || !src[k.key].trim()) return null;
    sections[k.key] = src[k.key].trim();
  }
  const levels = {};
  for (const k of KEYS) {
    const v = Number(d.levels?.[k.key]);
    levels[k.key] = v === 0 || v === 0.5 || v === 1 ? v : 0.5;
  }
  const questions = (Array.isArray(d.questions) ? d.questions : [])
    .filter((q) => q && KEYS.some((k) => k.key === q.key) && typeof q.text === 'string' && q.text.trim())
    .slice(0, 6)
    .map((q) => ({ key: q.key, text: q.text.trim() }));
  return { input: typeof d.input === 'string' ? d.input : '', sections, levels, questions };
}

function applyToolData(d) {
  const res = fromToolData(d);
  if (!res) {
    // Dibuka lewat open_prompt_break: belum ada hasil, cukup isi kotak input.
    if (d && typeof d.input === 'string' && d.input.trim() && !state.analyzed) {
      $('input').value = d.input.trim();
      textLang = guessLang(d.input) || textLang;
      applyLang();
    }
    return false;
  }
  if (res.input) $('input').value = res.input;
  // Samakan bahasa tampilan dengan bahasa isi prompt.
  textLang = guessLang(res.input + ' ' + res.sections.task) || textLang;
  showError('');
  show(res, 'ai');
  applyLang();
  return true;
}

// ---------- jembatan ke aplikasi chat (JSON-RPC lewat postMessage) ----------

const host = window.parent !== window ? window.parent : null;
let nextId = 1;
const pending = new Map();

function post(msg) { if (host) host.postMessage({ jsonrpc: '2.0', ...msg }, '*'); }
function notify(method, params) { post({ method, params: params || {} }); }
function request(method, params) {
  if (!host) return Promise.reject(new Error(t('errNoHost')));
  const id = nextId++;
  post({ id, method, params: params || {} });
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => { if (pending.delete(id)) reject(new Error(t('errNoReply'))); }, 15000);
  });
}

function useHostContext(ctx) {
  if (ctx && typeof ctx.locale === 'string') {
    hostLang = langOf(ctx.locale);
    applyLang();
  }
}

window.addEventListener('message', (ev) => {
  if (ev.source !== host) return;
  const m = ev.data;
  if (!m || m.jsonrpc !== '2.0') return;
  if (m.id != null && !m.method) {
    const p = pending.get(m.id);
    if (!p) return;
    pending.delete(m.id);
    if (m.error) p.reject(new Error(m.error.message || t('errDeclined')));
    else p.resolve(m.result);
    return;
  }
  switch (m.method) {
    case 'ui/notifications/tool-input':
      applyToolData(m.params?.arguments);
      break;
    case 'ui/notifications/tool-result': {
      const r = m.params || {};
      if (r.isError) {
        setBusy(false);
        showError((r.content || []).map((c) => c.text || '').join(' ') || t('errAiFailed'));
      } else {
        applyToolData(r.structuredContent);
      }
      break;
    }
    case 'ui/notifications/tool-cancelled':
      setBusy(false);
      showError(t('errCancelled'));
      break;
    case 'ui/notifications/host-context-changed':
      useHostContext(m.params);
      break;
    case 'ui/resource-teardown':
      if (m.id != null) post({ id: m.id, result: {} });
      break;
    default:
      if (m.id != null) post({ id: m.id, error: { code: -32601, message: 'Method not found' } });
  }
});

// Laporkan tinggi halaman agar aplikasi chat menyesuaikan ukuran bingkai.
function watchSize() {
  let queued = false, lastW = 0, lastH = 0;
  const send = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const doc = document.documentElement;
      const prev = doc.style.height;
      doc.style.height = 'max-content';
      const h = Math.ceil(doc.getBoundingClientRect().height);
      doc.style.height = prev;
      const w = Math.ceil(window.innerWidth);
      if (w !== lastW || h !== lastH) {
        lastW = w; lastH = h;
        notify('ui/notifications/size-changed', { width: w, height: h });
      }
    });
  };
  send();
  const ro = new ResizeObserver(send);
  ro.observe(document.documentElement);
  ro.observe(document.body);
}

async function connect() {
  if (!host) return;
  try {
    const res = await request('ui/initialize', {
      protocolVersion: '2026-01-26',
      appInfo: { name: 'prompt-break', title: 'Prompt Break', version: '1.0.0' },
      appCapabilities: { availableDisplayModes: ['inline', 'fullscreen'] },
    });
    const info = res?.hostInfo || {};
    hostName = info.title || info.name || 'AI';
    useHostContext(res?.hostContext);
    notify('ui/notifications/initialized');
    watchSize();
  } catch {
    // Tetap bisa dipakai dengan analisis lokal.
  }
}

// ---------- aksi pengguna ----------

// Bingkai di aplikasi chat biasanya tidak mengizinkan pengiriman form,
// jadi tombol ditangani lewat klik, bukan event submit.
$('form').addEventListener('submit', (ev) => ev.preventDefault());
// Minta AI di chat menyusun ulang; hasilnya datang sebagai tampilan baru.
// Bila chat tidak bisa dihubungi, pakai analisis lokal atas localInput.
async function askChat(text, fallback, report) {
  setBusy(true);
  try {
    await request('ui/message', { role: 'user', content: [{ type: 'text', text }] });
    setBusy(false);
    report(t('sent'), true);
  } catch {
    setBusy(false);
    report(fallback());
  }
}

$('go').addEventListener('click', (ev) => {
  ev.preventDefault();
  if (state.busy) return;
  const input = norm($('input').value);
  if (input.length < 4) { showError(t('errShort')); return; }
  textLang = guessLang(input) || textLang;
  applyLang();
  showError('');
  askChat(t('ask')(input), () => { show(analyzeLocal(input), 'local'); return t('errFallback'); }, (msg, muted) => {
    showError(msg);
    if (muted) $('err').style.color = 'var(--muted)';
  });
});

// Penanda informasi yang belum ada: [ISI], [ISI: ...], [FILL IN: ...].
const MARK = /\[(?:ISI|FILL IN)[^\]]*\]/i;
const words = (x) => String(x).toLowerCase().replace(/\[(?:isi|fill in):?/g, ' ').match(/[a-z0-9]{4,}/g) || [];

// Masukkan satu jawaban ke teks bagian: ganti penanda di baris yang
// paling mirip dengan pertanyaannya, atau tambahkan baris baru.
function fillAnswer(text, question, answer) {
  const lines = text.split('\n');
  const qw = new Set(words(question));
  let best = -1, bestScore = 0;
  lines.forEach((l, i) => {
    if (!MARK.test(l)) return;
    const score = words(l).filter((w) => qw.has(w)).length;
    if (score > bestScore) { best = i; bestScore = score; }
  });
  if (best >= 0) { lines[best] = lines[best].replace(MARK, answer); return lines.join('\n'); }
  return text.replace(/\s*$/, '') + `\n- ${question} ${answer}`;
}

function collectAnswers() {
  return state.questions
    .map((q, i) => ({ key: q.key, q: q.text, a: norm(state.answers[i]), i }))
    .filter((x) => x.a);
}

// Jawaban pertanyaan klarifikasi langsung dimasukkan ke master prompt di
// tampilan ini, tanpa lewat chat.
function applyAnswers(answered = collectAnswers(), quiet = false) {
  if (state.busy || !answered.length) return;
  answered.forEach((x) => {
    const sec = fillAnswer(state.sections[x.key] || '', x.q, x.a);
    state.sections[x.key] = sec;
    if (!MARK.test(sec)) state.levels[x.key] = 1;
    else if (!state.levels[x.key]) state.levels[x.key] = 0.5;
  });
  const done = new Set(answered.map((x) => x.i));
  state.questions = state.questions.filter((_, i) => !done.has(i));
  state.answers = {};
  const input = norm($('input').value);
  $('input').value = norm([input ? endDot(input) : '', ...answered.map((x) => `${x.q} ${endDot(x.a)}`)].join(' '));
  renderTray();
  renderQuestions();
  renderSections(state.mode);
  if (!quiet) {
    showError(t('applied'));
    $('err').style.color = 'var(--muted)';
  }
}

// Masukkan jawaban sekarang, lalu minta AI di chat menyusun ulang semuanya.
function polishAnswers() {
  if (state.busy) return;
  const answered = collectAnswers();
  if (!answered.length) return;
  const input = norm($('input').value);
  const lines = answered.map((x) => `- ${x.q} → ${x.a}`).join('\n');
  applyAnswers(answered, true);
  askChat(t('askAnswers')(input, lines), () => t('polishFallback'), (msg, muted) => {
    showError(msg);
    if (muted) $('err').style.color = 'var(--muted)';
  });
}

$('applyAnswers').addEventListener('click', () => applyAnswers());
$('polish').addEventListener('click', polishAnswers);

$('copy').addEventListener('click', async () => {
  const text = KEYS.map((k) => `# ${k.name}\n${state.sections[k.key] || ''}`).join('\n\n');
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    const ta = el('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta);
    ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
  }
  $('copy').textContent = ok ? t('copied') : t('copyFail');
  setTimeout(() => { $('copy').textContent = t('copy'); }, 2500);
});

lang = null; // paksa render pertama
applyLang();
connect();
