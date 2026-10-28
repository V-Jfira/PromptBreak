// Analisis cadangan berbasis aturan (tanpa AI). Dipakai bila aplikasi chat
// tidak bisa dihubungi. Mendukung bahasa Indonesia (id) dan Inggris (en).

let LANG = 'id';
export function setLang(l) { LANG = l === 'en' ? 'en' : 'id'; }

export const KEYS = [
  { key: 'role', n: '01', name: 'ROLE', sub: 'peran', c: '#0369A1', d: '#075985', t: '#DCEEF8', desc: 'Siapa Claude seharusnya, dan apa yang diprioritaskan.',
    en: { sub: 'role', desc: 'Who the AI should be, and what it should prioritize.' } },
  { key: 'task', n: '02', name: 'TASK', sub: 'tugas', c: '#4338CA', d: '#3730A3', t: '#E5E4FA', desc: 'Pekerjaan spesifik yang harus selesai, dan bagaimana ia diakhiri.',
    en: { sub: 'task', desc: 'The specific job to finish, and how it should wrap up.' } },
  { key: 'context', n: '03', name: 'CONTEXT', sub: 'konteks', c: '#15803D', d: '#166534', t: '#DCF3E3', desc: 'Yang perlu AI tahu: lokasi, target, budget, tim. Makin lengkap, makin sedikit AI menebak.',
    en: { sub: 'context', desc: 'What the AI needs to know: location, audience, budget, team. The more complete, the less it guesses.' } },
  { key: 'reasoning', n: '04', name: 'REASONING', sub: 'alasan', c: '#A16207', d: '#713F12', t: '#F6EDD3', desc: 'Tujuan akhir dan perintah untuk menjelaskan alasan tiap langkah.',
    en: { sub: 'reasoning', desc: 'The end goal, plus a request to explain the reasoning behind each step.' } },
  { key: 'stop', n: '05', name: 'STOP CONDITIONS', sub: 'kapan selesai', c: '#475569', d: '#334155', t: '#E5E9EF', desc: 'Kriteria yang harus terpenuhi sebelum AI boleh berhenti, supaya jawaban tidak menggantung.',
    en: { sub: 'when to stop', desc: 'What must be true before the AI may stop, so answers never trail off.' } },
  { key: 'output', n: '06', name: 'OUTPUT', sub: 'format hasil', c: '#BE185D', d: '#9D174D', t: '#FBE1EC', desc: 'Bentuk hasil akhir: tabel, daftar, kolom apa saja, deliverable apa.',
    en: { sub: 'output format', desc: 'The shape of the final result: table, list, which columns, which deliverables.' } }
];

export const EXAMPLES = [
  'Buatkan rencana promosi 30 hari untuk kedai kopi baru saya',
  'Buatkan rencana peluncuran 90 hari untuk aplikasi pengatur tugas founder',
  'Jelaskan cara kerja VLOOKUP untuk pemula'
];

export const EXAMPLES_EN = [
  'Make a 30-day promotion plan for my new coffee shop',
  'Build a 90-day launch plan for a task manager app for founders',
  'Explain how VLOOKUP works for beginners'
];

const DOMAINS = [
  { re: /launch|peluncuran|startup|saas|go-to-market|go to market|produk baru|new product|validasi|validation/, role: 'strategist go-to-market senior yang berpengalaman meluncurkan produk tahap awal', prio: 'kecepatan mendapat traksi dibanding kesempurnaan merek', ctx: [
    ['Produk', 'subject', 'Produk apa persisnya, dan masalah apa yang ia selesaikan?'],
    ['Target pengguna', 'audience', 'Siapa target penggunanya (profesi, rentang usia)?'],
    ['Tim', 'people', 'Berapa orang di tim dan apa peran masing-masing?'],
    ['Sumber daya', 'budget', 'Berapa budget dan berapa pengguna beta yang sudah ada?'],
    ['Risiko utama', null, 'Apa risiko terbesar yang kamu khawatirkan (adopsi, retensi, positioning)?']
  ], en: { role: 'senior go-to-market strategist experienced in launching early-stage products', prio: 'speed to traction over brand polish', ctx: [
    ['Product', 'subject', 'What exactly is the product, and what problem does it solve?'],
    ['Target users', 'audience', 'Who are the target users (profession, age range)?'],
    ['Team', 'people', 'How many people are on the team, and what does each one do?'],
    ['Resources', 'budget', 'What is the budget, and how many beta users do you already have?'],
    ['Main risk', null, 'What is the biggest risk you worry about (adoption, retention, positioning)?']
  ] } },
  { re: /promosi|pemasaran|marketing|iklan|konten|instagram|tiktok|sosmed|media sosial|brand|jualan|penjualan|kampanye|caption|promotion|promote|advertis|\bads\b|content|social media|campaign|sales|selling/, role: 'pemasar digital senior untuk bisnis kecil dan menengah', prio: 'hasil yang bisa langsung dijalankan dengan biaya rendah, bukan teori', ctx: [
    ['Bisnis / produk', 'subject', 'Bisnis atau produk apa yang dipromosikan?'],
    ['Target pelanggan', 'audience', 'Siapa target pelanggannya?'],
    ['Lokasi', 'location', 'Di mana lokasi bisnisnya?'],
    ['Budget', 'budget', 'Berapa budget promosi (per bulan atau total)?'],
    ['Tim', 'people', 'Siapa saja yang mengerjakan, berapa orang?']
  ], en: { role: 'senior digital marketer for small and medium businesses', prio: 'results you can run right away at low cost, not theory', ctx: [
    ['Business / product', 'subject', 'What business or product is being promoted?'],
    ['Target customers', 'audience', 'Who are the target customers?'],
    ['Location', 'location', 'Where is the business located?'],
    ['Budget', 'budget', 'What is the promotion budget (per month or in total)?'],
    ['Team', 'people', 'Who is doing the work, and how many people?']
  ] } },
  { re: /excel|rumus|spreadsheet|vlookup|xlookup|pivot|vba|lambda|sheet|formula/, role: 'ahli Excel dan analis data', prio: 'rumus yang akurat dan mudah dipelihara', ctx: [
    ['Versi Excel', 'platform', 'Pakai Excel versi berapa (365, 2019, lainnya)?'],
    ['Struktur data', null, 'Kolom apa saja yang ada di datamu, dan di sheet mana?'],
    ['Contoh input dan hasil', null, 'Seperti apa contoh data masuk dan hasil yang kamu harapkan?'],
    ['Ukuran data', null, 'Kira-kira berapa baris datanya?']
  ], en: { role: 'Excel expert and data analyst', prio: 'accurate formulas that are easy to maintain', ctx: [
    ['Excel version', 'platform', 'Which Excel version do you use (365, 2019, other)?'],
    ['Data structure', null, 'Which columns does your data have, and on which sheet?'],
    ['Sample input and result', null, 'What do a sample of the input data and the expected result look like?'],
    ['Data size', null, 'Roughly how many rows of data are there?']
  ] } },
  { re: /kode|coding|program|aplikasi|\bapp\b|bug|website|\bweb\b|javascript|python|\bapi\b|script|fungsi|software|database|sql|\bcode\b|function/, role: 'software engineer senior', prio: 'kode yang jelas, benar, dan mudah dirawat', ctx: [
    ['Bahasa / framework', 'platform', 'Pakai bahasa atau framework apa?'],
    ['Lingkungan', null, 'Kode akan dijalankan di mana (browser, server, HP)?'],
    ['Level pengalaman', null, 'Seberapa familiar kamu dengan topik ini?'],
    ['Batasan teknis', null, 'Ada batasan teknis yang harus dipatuhi?']
  ], en: { role: 'senior software engineer', prio: 'code that is clear, correct, and easy to maintain', ctx: [
    ['Language / framework', 'platform', 'Which language or framework are you using?'],
    ['Environment', null, 'Where will the code run (browser, server, phone)?'],
    ['Experience level', null, 'How familiar are you with this topic?'],
    ['Technical constraints', null, 'Are there technical constraints to follow?']
  ] } },
  { re: /saham|forex|trading|investasi|kripto|crypto|portofolio|stocks?|invest|portfolio/, role: 'analis pasar keuangan', prio: 'analisis berbasis data dan manajemen risiko, bukan janji keuntungan', ctx: [
    ['Instrumen', 'subject', 'Instrumen apa yang dianalisis?'],
    ['Horizon waktu', 'dur', 'Horizon waktunya berapa lama?'],
    ['Toleransi risiko', null, 'Berapa batas kerugian yang masih bisa kamu terima?'],
    ['Modal', 'budget', 'Berapa modal yang dipakai?']
  ], en: { role: 'financial markets analyst', prio: 'data-driven analysis and risk management, not promises of profit', ctx: [
    ['Instrument', 'subject', 'Which instrument is being analyzed?'],
    ['Time horizon', 'dur', 'What is the time horizon?'],
    ['Risk tolerance', null, 'How much loss can you still accept?'],
    ['Capital', 'budget', 'How much capital is involved?']
  ] } },
  { re: /pajak|anggaran|budget|keuangan|laporan|administrasi|logistik|faktur|invoice|akuntansi|\btax|finance|report|accounting|logistics/, role: 'analis administrasi dan keuangan', prio: 'akurasi angka dan jejak yang bisa diaudit', ctx: [
    ['Periode', 'dur', 'Untuk periode apa?'],
    ['Sumber data', null, 'Data berasal dari mana dan dalam format apa?'],
    ['Format laporan', null, 'Laporan harus mengikuti format tertentu?'],
    ['Aturan yang berlaku', null, 'Ada aturan atau regulasi yang harus dipatuhi?']
  ], en: { role: 'administration and finance analyst', prio: 'accurate numbers and an auditable trail', ctx: [
    ['Period', 'dur', 'For what period?'],
    ['Data source', null, 'Where does the data come from, and in what format?'],
    ['Report format', null, 'Does the report have to follow a specific format?'],
    ['Applicable rules', null, 'Are there rules or regulations to follow?']
  ] } },
  { re: /belajar|kurikulum|materi|mengajar|kelas|pelajaran|kursus|latihan|ujian|learn|study|curriculum|course|lesson|teach|exam|practice/, role: 'perancang kurikulum dan pengajar berpengalaman', prio: 'pemahaman bertahap dengan latihan praktik', ctx: [
    ['Level awal', 'audience', 'Level awal peserta atau kamu sendiri sampai mana?'],
    ['Waktu tersedia', 'dur', 'Berapa waktu yang tersedia?'],
    ['Tujuan akhir', null, 'Setelah selesai, kamu ingin bisa apa?'],
    ['Bahan yang ada', null, 'Sudah ada bahan atau tools yang dipakai?']
  ], en: { role: 'experienced curriculum designer and teacher', prio: 'step-by-step understanding with hands-on practice', ctx: [
    ['Starting level', 'audience', 'What level are the learners (or you) starting from?'],
    ['Time available', 'dur', 'How much time is available?'],
    ['End goal', null, 'What do you want to be able to do when you finish?'],
    ['Existing materials', null, 'Are there materials or tools already in use?']
  ] } },
  { re: /artikel|blog|tulis|tulisan|esai|email|surat|naskah|copywriting|pidato|cerita|article|write|writing|essay|letter|speech|story/, role: 'penulis dan editor profesional', prio: 'kejelasan dan suara yang konsisten', ctx: [
    ['Pembaca sasaran', 'audience', 'Siapa pembacanya?'],
    ['Nada', 'tone', 'Nada tulisannya seperti apa (formal, santai, persuasif)?'],
    ['Topik / subjek', 'subject', 'Tentang apa persisnya?'],
    ['Panjang', null, 'Berapa panjang yang diinginkan?']
  ], en: { role: 'professional writer and editor', prio: 'clarity and a consistent voice', ctx: [
    ['Target readers', 'audience', 'Who are the readers?'],
    ['Tone', 'tone', 'What tone should it have (formal, casual, persuasive)?'],
    ['Topic / subject', 'subject', 'What exactly is it about?'],
    ['Length', null, 'How long should it be?']
  ] } },
  { re: /riset|penelitian|jurnal|studi|bandingkan|perbandingan|tren|research|journal|compare|comparison/, role: 'analis riset', prio: 'temuan yang didukung sumber, bukan opini', ctx: [
    ['Pertanyaan riset', 'subject', 'Pertanyaan apa yang ingin dijawab?'],
    ['Cakupan dan periode', 'dur', 'Cakupan dan periodenya?'],
    ['Sumber', null, 'Sumber apa yang boleh dipakai?'],
    ['Pengguna hasil', 'audience', 'Untuk siapa hasil ini?']
  ], en: { role: 'research analyst', prio: 'findings backed by sources, not opinion', ctx: [
    ['Research question', 'subject', 'What question should be answered?'],
    ['Scope and period', 'dur', 'What are the scope and period?'],
    ['Sources', null, 'Which sources may be used?'],
    ['Audience for the result', 'audience', 'Who is the result for?']
  ] } }
];
const DEFAULT_DOMAIN = { role: 'konsultan senior di bidang yang paling relevan dengan permintaan ini', prio: 'jawaban yang spesifik dan bisa langsung dipakai, bukan jawaban umum', matched: false, ctx: [
  ['Subjek', 'subject', 'Tentang apa atau untuk siapa hasil ini?'],
  ['Pengguna hasil', 'audience', 'Siapa yang akan memakai hasilnya?'],
  ['Batas waktu', 'dur', 'Ada batas waktu atau periode tertentu?'],
  ['Batasan lain', null, 'Ada batasan biaya, alat, atau aturan yang perlu dipatuhi?']
], en: { role: 'senior consultant in the field most relevant to this request', prio: 'a specific answer that can be used right away, not a generic one', ctx: [
  ['Subject', 'subject', 'What is this about, or who is it for?'],
  ['Audience for the result', 'audience', 'Who will use the result?'],
  ['Deadline', 'dur', 'Is there a deadline or a specific period?'],
  ['Other constraints', null, 'Are there cost, tool, or rule constraints to follow?']
] } };

const TYPES = {
  plan: { goal: 'rencana yang siap dijalankan', stops: ['Jadwal mencakup seluruh periode yang diminta', 'Setiap aksi punya target yang bisa diukur', 'Setiap aksi disertai alasan dan hasil yang jelas'], closing: 'keputusan yang jelas untuk langkah berikutnya' },
  analyze: { goal: 'analisis dengan kesimpulan yang jelas', stops: ['Setiap temuan didukung data atau alasan yang jelas', 'Asumsi dan keterbatasan disebutkan', 'Kesimpulan menjawab pertanyaan awal'], closing: 'rekomendasi yang bisa dieksekusi' },
  write: { goal: 'tulisan yang siap dipakai tanpa banyak revisi', stops: ['Sesuai pembaca sasaran dan nada yang diminta', 'Tidak ada bagian yang menggantung', 'Pesan utama bisa dipahami dalam sekali baca'], closing: 'satu versi final siap pakai' },
  code: { goal: 'solusi yang berfungsi dan bisa diuji', stops: ['Solusi lengkap dan bisa dijalankan', 'Kasus tepi utama ditangani', 'Ada cara menguji hasilnya'], closing: 'langkah menjalankan dan menguji' },
  explain: { goal: 'penjelasan yang mudah dipahami dan bisa dipraktikkan', stops: ['Konsep dijelaskan bertahap dari dasar', 'Ada minimal satu contoh nyata', 'Istilah teknis dijelaskan saat pertama muncul'], closing: 'ringkasan inti dan satu latihan kecil' },
  summarize: { goal: 'ringkasan yang padat dan akurat', stops: ['Poin utama tidak ada yang terlewat', 'Tidak menambah informasi yang tidak ada di sumber'], closing: 'ringkasan satu paragraf' },
  general: { goal: 'jawaban yang spesifik dan bisa langsung dipakai', stops: ['Permintaan terjawab penuh', 'Tidak ada bagian yang menggantung', 'Asumsi yang dibuat disebutkan'], closing: 'langkah berikutnya yang disarankan' }
};

const TYPES_EN = {
  plan: { goal: 'a plan that is ready to run', stops: ['The schedule covers the whole requested period', 'Every action has a measurable target', 'Every action comes with a reason and a clear result'], closing: 'a clear decision for the next step' },
  analyze: { goal: 'an analysis with a clear conclusion', stops: ['Every finding is backed by data or a clear reason', 'Assumptions and limitations are stated', 'The conclusion answers the original question'], closing: 'recommendations that can be acted on' },
  write: { goal: 'writing that is ready to use without much revision', stops: ['It fits the target readers and the requested tone', 'No part is left hanging', 'The main message is clear on the first read'], closing: 'one final, ready-to-use version' },
  code: { goal: 'a working solution that can be tested', stops: ['The solution is complete and runnable', 'The main edge cases are handled', 'There is a way to test the result'], closing: 'steps to run and test it' },
  explain: { goal: 'an explanation that is easy to understand and put into practice', stops: ['Concepts are explained step by step from the basics', 'There is at least one real example', 'Technical terms are explained when they first appear'], closing: 'a summary of the essentials and one small exercise' },
  summarize: { goal: 'a tight, accurate summary', stops: ['No main point is left out', 'Nothing is added that is not in the source'], closing: 'a one-paragraph summary' },
  general: { goal: 'a specific answer that can be used right away', stops: ['The request is fully answered', 'No part is left hanging', 'Any assumptions made are stated'], closing: 'a suggested next step' }
};

export function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function endDot(s) { return /[.!?]$/.test(s) ? s : s + '.'; }

function detectType(low) {
  if (/^(jelaskan|ajarkan|apa itu|bagaimana|kenapa|explain|teach|what is|how|why)|jelaskan|cara kerja|explain/.test(low)) return 'explain';
  if (/rencana|\bplan\b|strategi|jadwal|roadmap|susun|rancang|program kerja|strategy|schedule/.test(low)) return 'plan';
  if (/kode|coding|\bbug\b|script|fungsi|aplikasi|\bapp\b|rumus|vba|sql|website|\bcode\b|function|formula/.test(low)) return 'code';
  if (/analisis|analisa|evaluasi|review|periksa|audit|bandingkan|riset|analy[sz]e|evaluate|compare|research/.test(low)) return 'analyze';
  if (/ringkas|rangkum|summary|summarize/.test(low)) return 'summarize';
  if (/tulis|artikel|caption|email|surat|naskah|konten|postingan|copy|write|article|letter|\bpost\b/.test(low)) return 'write';
  return 'general';
}

export function analyzeLocal(input) {
  const en = LANG === 'en';
  const raw = norm(input);
  const low = raw.toLowerCase();

  let dom = null, bestN = 0;
  DOMAINS.forEach(function (d) {
    const m = low.match(new RegExp(d.re.source, 'g'));
    const n = m ? m.length : 0;
    if (n > bestN) { dom = d; bestN = n; }
  });
  const matched = !!dom;
  if (!dom) dom = DEFAULT_DOMAIN;
  const D = en ? dom.en : dom;
  const type = detectType(low);
  const T = (en ? TYPES_EN : TYPES)[type];

  const f = {};
  let m;
  m = raw.match(/(\d+)\s*-?\s*(hari|minggu|bulan|tahun|jam|menit|days?|weeks?|months?|years?|hours?)\b/i);
  if (m) f.dur = /^[a-z]+$/.test(m[2]) && /^(day|week|month|year|hour)s?$/i.test(m[2])
    ? m[1] + ' ' + m[2].toLowerCase().replace(/s$/, '') + (m[1] === '1' ? '' : 's')
    : m[0];
  m = raw.match(/(rp\.?\s?[\d.,]+\s?(?:rb|ribu|jt|juta|k|m|miliar)?(?:\s?\/\s?\w+)?|\$\s?[\d.,]+\s?(?:k|m)?)/i); if (m) f.budget = m[1];
  m = raw.match(/(\d+)\s*(orang|pengguna|user|anggota|karyawan|klien|pelanggan|peserta|siswa|murid|people|users|members|employees|clients|customers|participants|students)/i); if (m) f.people = m[0];
  m = raw.match(/\b(?:untuk|for)\s+(.{3,60}?)(?=[,.;]|\s+(?:di|dekat|dengan|yang|agar|supaya|selama|dalam|berbudget|budget|in|near|with|that|so|during|within)\b|$)/i); if (m) f.subject = m[1];
  m = raw.match(/\b(?:di|dekat|sekitar|area|kawasan|near|around|based in|located in)\s+([a-z0-9' -]{3,30}?)(?=[,.;]|\s+(?:untuk|dengan|yang|dan|buat|agar|supaya|selama|dalam|for|with|that|and|so|during|within)\b|$)/i); if (m && !/^(sini|sana|mana)$/i.test(m[1])) f.location = m[1];
  m = raw.match(/\b(mahasiswa|pelajar|pemula|profesional|founder|pengusaha|umkm|ibu rumah tangga|anak-anak|remaja|karyawan|manajer|pelanggan|investor|developer|pembaca|students|beginners|professionals|founders|entrepreneurs|small businesses|kids|teenagers|employees|managers|customers|investors|developers|readers)\b/i); if (m) f.audience = m[1];
  m = raw.match(/\b(instagram|tiktok|linkedin|whatsapp|youtube|facebook|twitter|excel|python|javascript|react|android|ios|wordpress|shopee|tokopedia|google sheets|vba)\b/i); if (m) f.platform = m[1];
  m = raw.match(/\b(formal|santai|profesional|ramah|persuasif|humoris|casual|professional|friendly|persuasive|humorous)\b/i); if (m) f.tone = m[1];

  let fmt = null;
  if (/\b(tabel|table)\b/.test(low)) fmt = 'table';
  else if (/\b(daftar|poin|bullet|list)\b/.test(low)) fmt = 'list';
  const fmtName = fmt === 'table' ? (en ? 'table' : 'tabel') : fmt === 'list' ? (en ? 'bulleted list' : 'daftar berpoin') : null;

  const labels = en
    ? [['subject', 'Subject'], ['audience', 'Audience'], ['location', 'Location'], ['platform', 'Platform / tool'], ['budget', 'Budget'], ['people', 'Scale / team'], ['dur', 'Timeframe'], ['tone', 'Tone']]
    : [['subject', 'Subjek'], ['audience', 'Target'], ['location', 'Lokasi'], ['platform', 'Platform / alat'], ['budget', 'Budget'], ['people', 'Skala / tim'], ['dur', 'Jangka waktu'], ['tone', 'Nada']];
  const mark = en ? '[FILL IN]' : '[ISI]';
  const found = labels.filter(function (l) { return f[l[0]]; });
  const missing = D.ctx.filter(function (e) { return !(e[1] && f[e[1]]); });
  const satisfied = D.ctx.length - missing.length;

  const role = en
    ? 'Act as ' + (/^[aeiou]/i.test(D.role) ? 'an ' : 'a ') + D.role + '. Prioritize ' + D.prio + '.'
    : 'Bertindaklah sebagai ' + D.role + '. Prioritaskan ' + D.prio + '.';
  const task = endDot(cap(raw)) + (en ? ' The final result must be ' : ' Hasil akhirnya harus berupa ') + T.goal + '.';

  let ctxLines = [found.length
    ? (en ? 'What I know:' : 'Yang saya ketahui:')
    : (en ? 'There is no context in the input yet. Fill in the parts marked [FILL IN]:' : 'Belum ada konteks di input. Lengkapi bagian bertanda [ISI]:')];
  found.forEach(function (l) { ctxLines.push('- ' + l[1] + ': ' + f[l[0]]); });
  missing.forEach(function (e) { ctxLines.push('- ' + e[0] + ': ' + mark); });
  const context = ctxLines.join('\n');

  let reasoning;
  if (en) {
    const lead = missing.length
      ? 'Pin down the ' + missing[0][0].replace(/^(?!Excel)\w/, function (c) { return c.toLowerCase(); }) + ' first: if anything in the Context section is still marked [FILL IN], ask short questions before you start instead of guessing. '
      : 'The context is complete, so get straight to work. ';
    reasoning = 'The goal is ' + T.goal + ', not a generic answer. ' + lead + 'Explain the reasoning behind each step and flag any assumptions you make, so the result is truly actionable.';
  } else {
    const lead = missing.length
      ? 'Kunci kejelasan tentang ' + missing[0][0].toLowerCase() + ' di awal: jika informasi di bagian Context masih bertanda [ISI], ajukan pertanyaan singkat dulu, jangan menebak. '
      : 'Konteks sudah lengkap, jadi langsung kerjakan. ';
    reasoning = 'Tujuannya adalah ' + T.goal + ', bukan jawaban umum. ' + lead + 'Jelaskan alasan di balik setiap langkah dan tandai asumsi yang kamu buat, supaya hasilnya benar-benar bisa ditindaklanjuti.';
  }

  let stops = T.stops.slice();
  if (type === 'plan' && f.dur) stops[0] = (en ? 'The schedule covers the full ' : 'Jadwal mencakup seluruh ') + f.dur;
  const stop = (en ? 'Consider it done only when:\n' : 'Anggap selesai hanya jika:\n')
    + stops.map(function (s) { return '- ' + s; }).join('\n')
    + (en ? '\n- It closes with ' : '\n- Ditutup dengan ') + T.closing + '.';

  let output;
  const weekly = f.dur && /minggu|hari|bulan|week|day|month/i.test(f.dur);
  if (en) {
    const unit = weekly ? 'by week' : 'by stage';
    if (type === 'plan') output = 'Present it as a ' + (fmt === 'list' ? 'bulleted list' : 'table') + ', grouped ' + unit + '. For each action, include: Action (specific task), Owner, Measurable target, Reason, and Result / deliverable.';
    else if (type === 'analyze') output = 'Start with a one-paragraph summary, continue with bulleted findings (each with its reasoning), and close with recommendations.' + (fmt === 'table' ? ' Present the findings in a table.' : '');
    else if (type === 'write') output = 'Write the text directly, ready to copy, with no intro or extra explanation. ' + (f.tone ? 'Use a ' + f.tone + ' tone.' : 'Use a tone that fits the target readers.');
    else if (type === 'code') output = 'Give the complete code in a code block, then a short explanation of each part and how to run it.';
    else if (type === 'explain') output = 'Explain step by step with a real example at each step, in plain language.' + (fmt === 'table' ? ' Summarize comparisons in a table.' : '');
    else if (type === 'summarize') output = 'Give a one-paragraph summary, then the key points.';
    else output = 'Structure the answer with clear section headings: start with the conclusion, then the details.' + (fmtName ? ' Use a ' + fmtName + ' format.' : '');
  } else {
    const unit = weekly ? 'per minggu' : 'per tahap';
    if (type === 'plan') output = 'Sajikan sebagai ' + (fmt === 'list' ? 'daftar berpoin' : 'tabel') + ', dikelompokkan ' + unit + '. Untuk setiap aksi tulis: Aksi (tugas spesifik), Penanggung jawab, Target terukur, Alasan, dan Hasil / deliverable.';
    else if (type === 'analyze') output = 'Mulai dengan ringkasan satu paragraf, lanjutkan dengan temuan berpoin (masing-masing disertai alasan), tutup dengan rekomendasi.' + (fmt === 'table' ? ' Sajikan temuan dalam tabel.' : '');
    else if (type === 'write') output = 'Tulis langsung teksnya, siap salin, tanpa pembuka atau penjelasan tambahan. Gunakan nada ' + (f.tone || 'yang sesuai dengan pembaca sasaran') + '.';
    else if (type === 'code') output = 'Berikan kode lengkap dalam blok kode, lalu penjelasan singkat per bagian dan cara menjalankannya.';
    else if (type === 'explain') output = 'Jelaskan bertahap dengan contoh nyata di setiap tahap, memakai bahasa sederhana.' + (fmt === 'table' ? ' Rangkum perbandingan dalam tabel.' : '');
    else if (type === 'summarize') output = 'Berikan ringkasan satu paragraf, lalu poin-poin kunci.';
    else output = 'Susun jawaban dengan judul bagian yang jelas: mulai dari kesimpulan, lalu rincian.' + (fmtName ? ' Gunakan format ' + fmtName + '.' : '');
  }

  const levels = {
    role: matched ? 1 : 0.5,
    task: 1,
    context: satisfied === 0 ? 0 : (satisfied >= D.ctx.length - 1 ? 1 : 0.5),
    reasoning: /(agar|supaya|tujuan|biar|sehingga|so that|in order to|\bgoal\b|\baim\b)/.test(low) ? 1 : 0.5,
    stop: (f.dur && (fmt || f.people)) ? 1 : 0.5,
    output: fmt ? 1 : 0.5
  };

  const questions = [];
  missing.forEach(function (e) { questions.push({ key: 'context', text: e[2] }); });
  if (levels.reasoning < 1) questions.push({ key: 'reasoning', text: en ? 'What end goal are you after with this result?' : 'Apa tujuan akhir yang kamu kejar dari hasil ini?' });
  if (levels.stop < 1) questions.push({ key: 'stop', text: en ? 'When do you consider the result done (amount, duration, criteria)?' : 'Kapan hasilnya kamu anggap selesai (jumlah, durasi, kriteria)?' });
  if (levels.output < 1) questions.push({ key: 'output', text: en ? 'What format do you want the result in (table, list, ready-to-use text)?' : 'Format hasil seperti apa yang kamu mau (tabel, daftar, teks siap pakai)?' });

  return { sections: { role: role, task: task, context: context, reasoning: reasoning, stop: stop, output: output }, levels: levels, questions: questions.slice(0, 7) };
}
