// GET /admin — server-rendered HTML view of all sign-offs (for the dev team)
import { getStore } from '@netlify/blobs';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default async (req, context) => {
  let list = [];
  try {
    const store = getStore({ name: 'kavinda-uat', consistency: 'strong' });
    const raw = await store.get('signoffs', { type: 'text' });
    list = raw ? JSON.parse(raw) : [];
  } catch (e) { list = []; }

  const rows = list.map(r => {
    const sigBlock = r.signatureType === 'draw' && r.signature && r.signature.startsWith('data:image')
      ? `<div class="admin-sig-box"><div class="text-[10px] font-mono text-slate-500 mb-2">SIGNATURE</div><img src="${esc(r.signature)}" alt="signature" class="admin-sig-img"></div>`
      : `<div class="admin-sig-box"><div class="text-[10px] font-mono text-slate-500 mb-1">SIGNATURE (TYPED)</div><div class="font-display text-2xl text-slate-800" style="font-family:'Caveat',cursive;font-style:italic;">${esc(r.signature)}</div></div>`;

    const notesBlock = r.notes ? `<div class="mt-4 text-sm text-slate-400"><div class="text-[10px] font-mono text-slate-500 mb-1">NOTES</div><p>${esc(r.notes)}</p></div>` : '';
    const statsBlock = r.stats ? `<div class="mt-4 grid grid-cols-3 gap-3 text-center">
      <div class="admin-stat"><div class="admin-stat-val">${r.stats.passed}/${r.stats.total}</div><div class="admin-stat-lbl">SCENARIOS</div></div>
      <div class="admin-stat"><div class="admin-stat-val">${r.stats.criteriaChecked}/${r.stats.criteriaTotal}</div><div class="admin-stat-lbl">CRITERIA</div></div>
      <div class="admin-stat"><div class="admin-stat-val">${r.stats.percent}%</div><div class="admin-stat-lbl">OVERALL</div></div>
    </div>` : '';

    return `<div class="admin-card">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div>
          <div class="text-xs font-mono text-violet-300 mb-1">${esc(r.ref)}</div>
          <div class="text-lg font-semibold text-slate-100">${esc(r.signedBy)}</div>
          <div class="text-sm text-slate-400">${esc(r.title)}</div>
        </div>
        <div class="text-right">
          <div class="status-pill status-ready">APPROVED</div>
          <div class="text-[10px] font-mono text-slate-500 mt-2">${esc(new Date(r.timestamp).toLocaleString())}</div>
        </div>
      </div>
      ${sigBlock}
      ${notesBlock}
      ${statsBlock}
    </div>`;
  }).join('');

  const empty = `<div class="admin-empty">
    <i class="fa-solid fa-inbox text-4xl text-slate-700 mb-4"></i>
    <p class="text-slate-500">No sign-offs recorded yet.</p>
  </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kavinda UAT · Admin · Sign-Off Log</title>
  <link rel="icon" type="image/svg+xml" href="/static/logo.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="/static/style.css" rel="stylesheet">
</head>
<body class="bg-[#0a0a0f] text-slate-100 antialiased">
  <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div class="absolute inset-0 bg-[#0a0a0f]"></div>
    <div class="mesh-blob mesh-blob-1"></div>
    <div class="mesh-blob mesh-blob-2"></div>
    <div class="absolute inset-0 grid-overlay"></div>
  </div>
  <div class="min-h-screen px-6 py-12 max-w-5xl mx-auto">
    <a href="/" class="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-violet-300 mb-8">
      <i class="fa-solid fa-arrow-left text-xs"></i>
      Back to dashboard
    </a>
    <div class="flex items-end justify-between mb-2 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-100">Developer · Sign-Off Log</h1>
        <p class="text-slate-400 mt-2">Records of every client approval submitted through the UAT dashboard.</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-bold gradient-text-violet">${list.length}</div>
        <div class="text-[10px] font-mono tracking-[0.2em] text-slate-500">TOTAL APPROVALS</div>
      </div>
    </div>
    <div class="mt-8">${list.length === 0 ? empty : `<div class="space-y-4">${rows}</div>`}</div>
  </div>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
};

export const config = { path: '/admin' };
