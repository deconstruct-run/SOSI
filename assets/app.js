/* SOVEREIGN SI // CASE MAP — flat case board. Docked layout, nothing overlaps. */
const C = window.CASE;
const MARKET = window.MARKET || { tickers: {} };
const MK = MARKET.tickers || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NOW = C.meta.now;

/* ---------------- indexes ---------------- */
const NODES = C.nodes;
const BY = Object.fromEntries(NODES.map(n => [n.id, n]));
const SYS = Object.fromEntries(C.systems.map(s => [s.id, s]));
const EDGES = C.edges.map((e, i) => ({ i, a: e[0], b: e[1], type: e[2], label: e[3], date: e[4] || '', v: e[5] !== 0, T: C.edgeTypes[e[2]] }));
const ADJ = Object.fromEntries(NODES.map(n => [n.id, []]));
EDGES.forEach(e => { ADJ[e.a].push(e); ADJ[e.b].push(e); });
const TK2NODE = {};
Object.entries(C.markets.nodeTicker).forEach(([nid, tk]) => { TK2NODE[tk] = nid; });
NODES.forEach(n => { if (n.tk && !TK2NODE[n.tk]) TK2NODE[n.tk] = n.id; });
const NODE_TK = {};
Object.entries(TK2NODE).forEach(([tk, nid]) => { NODE_TK[nid] = tk; });
const THREADS = C.threads;
const NODE_THREADS = {};
THREADS.forEach(t => t.nodes.forEach(n => (NODE_THREADS[n] = NODE_THREADS[n] || []).push(t.id)));
const EXTRA_NAMES = { VOYG: ['Voyager Technologies', 'space'], BBAI: ['BigBear.ai', 'operating'], DUOT: ['Duos Technologies', 'compute'], DELL: ['Dell Technologies', 'compute'], HPE: ['Hewlett Packard Enterprise', 'compute'] };
const TIER = { M: 'Master node', K: 'Key node', N: 'Node' };
const KIND = { co: 'Company', buyer: 'Sovereign buyer', prog: 'Program', cap: 'Capital', press: 'Oversight', threat: 'Threat', counter: 'Counter-bloc', model: 'Model', app: 'Mission app', channel: 'Channel', site: 'Site', sys: 'System constraint' , person: 'Key player', fund: 'Fund', token: 'Token · rail', law: 'Law · policy', site: 'Site'};

/* ---------------- formatting ---------------- */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d) {
  if (!d) return '';
  if (/^\d{4}-Q\d$/.test(d)) return d.slice(5) + ' ' + d.slice(0, 4);
  const p = d.split('-');
  if (p.length === 1) return p[0];
  if (p.length === 2) return MON[+p[1] - 1] + ' ' + p[0];
  return MON[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
}
function fmtET(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}
function fmtNaiveET(s) {
  if (!s) return '—';
  const [d, t] = s.split('T');
  const [hh, mm] = (t || '0:0').split(':');
  const h = +hh, ap = h >= 12 ? 'PM' : 'AM';
  return fmtDate(d) + ', ' + ((h % 12) || 12) + ':' + mm + ' ' + ap + ' ET';
}
const fm = v => {
  if (v == null || isNaN(v)) return '—';
  const s = v < 0 ? '−' : '', a = Math.abs(v);
  if (a >= 1e12) return s + '$' + (a / 1e12).toFixed(2) + 'T';
  if (a >= 1e9) return s + '$' + (a / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(0) + 'K';
  return s + '$' + a.toFixed(0);
};
const pc = (v, d = 0) => (v == null || isNaN(v)) ? '—' : (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(d) + '%';
const pm = v => (v == null || isNaN(v)) ? '—' : (v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(1) + '%';
const px = v => (v == null || isNaN(v)) ? '—' : '$' + Number(v).toFixed(Number(v) < 10 ? 3 : 2);
const shortSum = s => { const t = (s || '').split(/(?<=\.)\s/)[0]; return t.length > 170 ? t.slice(0, 167) + '…' : t; };

/* ---------------- layers ---------------- */
const PL = { palantir: 6, anduril: 6, nvda: 1, spacex: 3, ondas: 9, armada: 2, aws: 2, google: 4, oracle: 2, rklb: 3, shieldai: 9, helsing: 8, applied: 8 };
const isThreat = n => n.k === 'threat' || n.k === 'counter';
function layerCode(n) {
  if (n.L && n.L.length) return 'L' + (PL[n.id] ?? n.L[0]);
  return isThreat(n) ? 'X' : 'S';
}
function inLayer(n, code) {
  if (n.k === 'person') return false;
  if (code === 'S') return !(n.L && n.L.length) && !isThreat(n);
  if (code === 'X') return isThreat(n);
  return (n.L || []).includes(+code.slice(1));
}
const LAYER_CODES = ['S', 'L9', 'L8', 'L7', 'L6', 'L5', 'L4', 'L3', 'L2', 'L1', 'L0', 'X'];
function layerName(code) {
  if (code === 'S') return C.bands.S.name;
  if (code === 'X') return C.bands.X.name;
  return C.layers[+code.slice(1)].name;
}

/* ---------------- board layout ---------------- */
const COLS = [
  { n: '01', name: 'Money + mandate', d: 'Who funds, buys and directs the stack, and the rails the money moves on', dp: 'Officials, funders, financiers and allied buyers', sys: ['state', 'capital', 'rails', 'insurance', 'allied'] },
  { n: '02', name: 'Control', d: 'Who owns the operating layer, the models, the agents and the integration', dp: 'Executives and boards of the operating layer, models and primes', sys: ['operating', 'models', 'agentic', 'primes'] },
  { n: '03', name: 'Field + theater', d: 'Where the stack meets the mission, the sky and the threat', dp: 'Operators in the field, the stratosphere and each theater', sys: ['autonomy', 'space', 'stratosphere', 'gulf', 'latam', 'cyber'] },
  { n: '04', name: 'Infrastructure', d: 'Silicon, compute, power and the next substrate', dp: 'Builders of silicon, compute, power and the next substrate', sys: ['compute', 'silicon', 'power', 'minerals', 'quantum'] }
];
/* any system not placed above lands in the column it fits best by default */
C.systems.forEach(sy => { if (!COLS.some(c => c.sys.includes(sy.id))) COLS[0].sys.push(sy.id); });
const TIER_ORD = { M: 0, K: 1, N: 2 };
const DEG = Object.fromEntries(NODES.map(n => [n.id, ADJ[n.id].length]));
const FIRST = Object.fromEntries(NODES.map(n => {
  const ds = ADJ[n.id].map(e => e.date).filter(Boolean).sort();
  return [n.id, ds[0] || null];
}));

/* relation of the OTHER node to the subject: [when other acts on subject, when subject acts on other] */
const REL = {
  contract: ['BUYER', 'VENDOR'], capital: ['INVESTOR', 'PORTFOLIO'], supply: ['SUPPLIER', 'CUSTOMER'], own: ['OWNER', 'HOLDING'],
  partner: ['PARTNER', 'PARTNER'], threat: ['THREAT', 'TARGET'], counter: ['COUNTER', 'COUNTERED'], pressure: ['PRESSURE', 'PRESSURED'],
  leads: ['LEADER', 'LEADS'], board: ['DIRECTOR', 'BOARD SEAT'], founded: ['FOUNDER', 'FOUNDED'], invests: ['INVESTOR', 'STAKE'],
  advises: ['ADVISER', 'ADVISES'], post: ['OFFICIAL', 'POST'], tie: ['TIE', 'TIE']
};
const GROUP_IN = { leads: 'Leadership', board: 'Board', founded: 'Founders', post: 'Officials', invests: 'Backers · people', advises: 'Advisers', contract: 'Buyers · pay it', capital: 'Investors', supply: 'Suppliers', own: 'Owner', threat: 'Threats', counter: 'Counter-stack', pressure: 'Pressure · oversight' };
const GROUP_OUT = { leads: 'Leads', board: 'Board seats', founded: 'Founded', post: 'Government posts', invests: 'Stakes', advises: 'Advises', contract: 'Vendors · it pays', capital: 'Portfolio · it funds', supply: 'Customers · it supplies', own: 'Holdings', threat: 'Targets', counter: 'Counters', pressure: 'Pressures' };
const GROUP_ORDER = ['leads', 'board', 'founded', 'post', 'invests', 'advises', 'contract', 'capital', 'supply', 'own', 'pressure', 'threat', 'counter'];

/* ---------------- people ---------------- */
const PEOPLE_T = ['leads', 'board', 'founded', 'post', 'invests', 'advises'];
const isPerson = n => n && n.k === 'person';
const ORGS = NODES.filter(n => !isPerson(n));
const PEOPLE = NODES.filter(isPerson);
const PERSON_ORGS = {}, ORG_PEOPLE = {};
EDGES.forEach(e => {
  if (!PEOPLE_T.includes(e.type)) return;
  const pa = isPerson(BY[e.a]), pb = isPerson(BY[e.b]);
  if (pa === pb) return;
  const p = pa ? e.a : e.b, o = pa ? e.b : e.a;
  (PERSON_ORGS[p] = PERSON_ORGS[p] || []).push({ org: o, e });
  (ORG_PEOPLE[o] = ORG_PEOPLE[o] || []).push({ p, e });
});
const ROLE_ORD = { leads: 0, founded: 1, board: 2, post: 3, invests: 4, advises: 5 };
function peopleOf(org) { return (ORG_PEOPLE[org] || []).filter(x => edgeOn(x.e)).sort((a, b) => ROLE_ORD[a.e.type] - ROLE_ORD[b.e.type]); }
function orgsOf(p) { return (PERSON_ORGS[p] || []).filter(x => edgeOn(x.e)).sort((a, b) => ROLE_ORD[a.e.type] - ROLE_ORD[b.e.type]); }
/* board interlocks: other orgs that share a person with this org */
function interlocks(org) {
  const out = new Map();
  peopleOf(org).forEach(({ p }) => orgsOf(p).forEach(({ org: o2, e }) => {
    if (o2 === org) return;
    const cur = out.get(o2) || { org: o2, via: [] };
    if (!cur.via.includes(p)) cur.via.push(p);
    out.set(o2, cur);
  }));
  return [...out.values()].sort((a, b) => b.via.length - a.via.length);
}
/* people who share an organization with this person */
function colleagues(p) {
  const out = new Map();
  orgsOf(p).forEach(({ org }) => peopleOf(org).forEach(({ p: q }) => {
    if (q === p) return;
    const cur = out.get(q) || { p: q, orgs: [] };
    if (!cur.orgs.includes(org)) cur.orgs.push(org);
    out.set(q, cur);
  }));
  return [...out.values()];
}
const roleLine = id => { const n = BY[id]; if (n.role) return n.role; const o = (PERSON_ORGS[id] || [])[0]; return o ? `${REL[o.e.type][1].toLowerCase()} · ${BY[o.org].n}` : ''; };
const PERSON_ICON = '<svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true"><circle cx="4.5" cy="2.6" r="2.1" fill="currentColor"/><path d="M0.6 9.6c0-2.3 1.7-3.9 3.9-3.9s3.9 1.6 3.9 3.9z" fill="currentColor"/></svg>';

/* ---------------- state ---------------- */
const S = { view: 'map', board: 'org', mv: 'board', lens: 'all', off: new Set(), layer: null, sel: null, trail: [], hover: null, edgeHover: null, thread: null, cutoff: null, q: '', open: new Set(), activeThread: '07' };
const MOBILE = () => innerWidth <= 820;

function edgeOn(e) {
  if (S.off.has(e.type)) return false;
  if (S.lens !== 'all' && !e.T.lenses.includes(S.lens)) return false;
  if (S.cutoff && e.date && e.date > S.cutoff) return false;
  return true;
}
const other = (e, id) => (e.a === id ? e.b : e.a);
const relWord = (e, id) => (REL[e.type] || [e.type.toUpperCase(), e.type.toUpperCase()])[e.a === id ? 1 : 0];

/* ---------------- board render (once) ---------------- */
const BOARD = $('#board');
function defaultRt(n) {
  if (isPerson(n)) { const k = (PERSON_ORGS[n.id] || []).length; return k > 1 ? `<span class="pc" title="${k} positions on file">${k}</span>` : ''; }
  const tk = NODE_TK[n.id] || n.tk || '';
  const pc = (ORG_PEOPLE[n.id] || []).length;
  return (pc ? `<span class="pc" title="${pc} people on file">${PERSON_ICON}${pc}</span>` : '') + (tk ? `<span class="tk">${esc(tk)}</span>` : '');
}
function nodeRow(n) {
  const sub = isPerson(n) ? `<span class="sub">${esc(roleLine(n.id))}</span>` : '';
  return `<button type="button" class="nrow t-${n.t} k-${n.k}" data-id="${n.id}" title="${esc(n.n)}">
    <span class="gl t-${n.t} k-${n.k}" aria-hidden="true"></span>
    <span class="nmw"><span class="nm">${esc(n.n)}</span>${sub}</span>
    <span class="rt" data-rt>${defaultRt(n)}</span>
  </button>`;
}
function boardNodes(sid) {
  return NODES.filter(n => n.s === sid && (S.board === 'ppl' ? isPerson(n) : !isPerson(n)))
    .sort((a, b) => (TIER_ORD[a.t] ?? 2) - (TIER_ORD[b.t] ?? 2) || DEG[b.id] - DEG[a.id] || a.n.localeCompare(b.n));
}
const ROWS = {};
function renderBoard() {
  BOARD.innerHTML = COLS.map(col => {
    const tiles = col.sys.map(sid => {
      const ns = boardNodes(sid);
      if (!ns.length) return '';
      const sy = SYS[sid];
      return `<section class="tile" data-sys="${sid}" style="--tint:${sy.tint}">
        <div class="tile-head"><span class="n">${esc(sy.n)}</span><span class="nm">${esc(sy.name)}</span><span class="c" data-c>${ns.length}</span></div>
        <div class="rows">${ns.map(nodeRow).join('')}</div>
      </section>`;
    }).join('');
    return `<div class="col"><div class="col-head"><b><span>${col.n}</span>${esc(col.name)}</b><p>${esc(S.board === 'ppl' ? col.dp : col.d)}</p></div>${tiles || '<p class="sj-empty">No players on file in this column.</p>'}</div>`;
  }).join('');
  for (const k in ROWS) delete ROWS[k];
  $$('.nrow', BOARD).forEach(r => { ROWS[r.dataset.id] = r; });
}
function indexRows() {}

/* search matching */
function searchMatches(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const items = [];
  NODES.forEach(n => {
    const tk = (NODE_TK[n.id] || n.tk || '').toLowerCase();
    const nm = n.n.toLowerCase();
    const score = tk === q ? 5 : nm.startsWith(q) ? 4 : tk.startsWith(q) ? 3.5 : nm.includes(q) ? 3 : (n.sum || '').toLowerCase().includes(q) ? 1 : 0;
    if (score) items.push({ score, kind: 'node', id: n.id, name: n.n, tk: NODE_TK[n.id] || n.tk });
  });
  Object.keys(MK).forEach(tk => {
    if (!TK2NODE[tk] && tk.toLowerCase().startsWith(q)) items.push({ score: 3.4, kind: 'ticker', tk, name: (EXTRA_NAMES[tk] || [tk])[0] });
  });
  THREADS.forEach(t => {
    if (t.name.toLowerCase().includes(q)) items.push({ score: 2.5, kind: 'thread', id: t.id, name: t.name });
  });
  return items.sort((a, b) => b.score - a.score);
}

/* ---------------- board state (no movement: only opacity, borders, badges) ---------------- */
function boardFocus() {
  // returns { on: Map(id -> badge html), subj: id|null, label }
  if (S.q.trim()) {
    const m = searchMatches(S.q).filter(x => x.kind === 'node');
    return { on: new Map(m.map(x => [x.id, ''])), subj: null };
  }
  const subj = S.hover || (S.sel ? S.sel : null);
  if (subj) {
    const on = new Map();
    let edges = ADJ[subj].filter(edgeOn);
    if (S.edgeHover != null && !S.hover) edges = edges.filter(e => e.i === S.edgeHover);
    edges.forEach(e => {
      const o = other(e, subj);
      const b = `<span class="rel c-${e.type}">${relWord(e, subj)}</span>`;
      on.set(o, on.has(o) ? on.get(o) : b);
    });
    if (S.edgeHover == null || S.hover) {
      const short = t => esc(t.length > 15 ? t.slice(0, 14) + '…' : t).toUpperCase();
      if (isPerson(BY[subj])) colleagues(subj).forEach(c => { if (!on.has(c.p)) on.set(c.p, `<span class="rel c-board">${short(BY[c.orgs[0]].n)}</span>`); });
      else interlocks(subj).forEach(x => { if (!on.has(x.org)) on.set(x.org, `<span class="rel c-board">INTERLOCK</span>`); });
    }
    return { on, subj, count: edges.length };
  }
  if (S.thread) {
    const T = THREADS.find(t => t.id === S.thread);
    return { on: new Map(T.nodes.map((id, i) => [id, `<span class="step">${i + 1}</span>`])), subj: null };
  }
  if (S.layer) {
    return { on: new Map(NODES.filter(n => inLayer(n, S.layer)).map(n => [n.id, `<span class="rel" style="color:var(--amber)">${S.layer}</span>`])), subj: null };
  }
  return null;
}
function applyBoard() {
  const f = boardFocus();
  BOARD.classList.toggle('focus', !!f);
  NODES.forEach(n => {
    const r = ROWS[n.id];
    if (!r) return;
    const isOn = f ? f.on.has(n.id) : false;
    const isSubj = f ? f.subj === n.id : false;
    r.classList.toggle('on', isOn);
    r.classList.toggle('subj', isSubj || (!f && S.sel === n.id));
    const later = !f && S.cutoff && FIRST[n.id] && FIRST[n.id] > S.cutoff;
    r.style.opacity = later ? '0.2' : '';
    const rt = r.querySelector('[data-rt]');
    const want = isOn && f.on.get(n.id) ? f.on.get(n.id) : defaultRt(n);
    if (rt.innerHTML !== want) rt.innerHTML = want;
  });
  $$('.tile', BOARD).forEach(t => {
    const ids = boardNodes(t.dataset.sys).map(n => n.id);
    const c = t.querySelector('[data-c]');
    if (f) {
      const k = ids.filter(id => f.on.has(id) || f.subj === id).length;
      t.classList.toggle('has-on', k > 0);
      const linked = ids.filter(id => f.on.has(id)).length;
      c.textContent = linked ? `${linked} LINKED` : (ids.includes(f.subj) ? 'SUBJECT' : '—');
      c.classList.toggle('hot', k > 0);
    } else {
      t.classList.remove('has-on');
      c.textContent = ids.length;
      c.classList.remove('hot');
    }
  });
}
BOARD.addEventListener('pointerover', ev => {
  if (ev.pointerType === 'touch') return;
  const r = ev.target.closest('.nrow');
  const id = r ? r.dataset.id : null;
  if (id !== S.hover) { S.hover = id; applyBoard(); renderBar(); }
});
BOARD.addEventListener('pointerleave', () => { if (S.hover) { S.hover = null; applyBoard(); renderBar(); } });
BOARD.addEventListener('focusin', ev => { const r = ev.target.closest('.nrow'); if (r) { S.hover = r.dataset.id; applyBoard(); renderBar(); } });
BOARD.addEventListener('focusout', () => { S.hover = null; applyBoard(); renderBar(); });
BOARD.addEventListener('click', ev => {
  const r = ev.target.closest('.nrow');
  if (r) { S.hover = null; select(r.dataset.id, 'reset'); }
});

/* ---------------- subject board ---------------- */
const SUBJ = $('#subject');
function subjCard(e, id) {
  const o = BY[other(e, id)];
  const tk = NODE_TK[o.id] || o.tk || '';
  return `<button type="button" class="sj-card c-${e.type}" data-go="${o.id}" data-ei="${e.i}">
    <span class="top"><span class="nm">${esc(o.n)}</span>${tk ? `<span class="tk" style="font-size:10.5px">${esc(tk)}</span>` : ''}</span>
    <span class="lb">${esc(e.label)}</span>
    <span class="dt"><span class="rw">${esc(relWord(e, id))}</span>${e.date ? ' · ' + esc(fmtDate(e.date).toUpperCase()) : ''}${e.v ? '' : ' · <span class="uv">UNVERIFIED</span>'}</span>
  </button>`;
}
function groupHtml(type, label, list, id) {
  if (!list.length) return '';
  const T = C.edgeTypes[type];
  return `<div class="sj-group"><span class="eyebrow"><span style="color:${T.color}">${esc(label)}</span><span>${list.length}</span></span>${list.map(e => subjCard(e, id)).join('')}</div>`;
}
function viaGroup(label, rows) {
  if (!rows.length) return '';
  return `<div class="sj-group"><span class="eyebrow"><span style="color:#C9A86A">${esc(label)}</span><span>${rows.length}</span></span>${rows.map(([id, lb, tag]) => {
    const o = BY[id]; const tk = NODE_TK[id] || o.tk || '';
    return `<button type="button" class="sj-card c-board" data-go="${id}"><span class="top"><span class="nm">${esc(o.n)}</span>${tk ? `<span class="tk" style="font-size:10.5px">${esc(tk)}</span>` : ''}</span><span class="lb">${esc(lb)}</span><span class="dt"><span class="rw">${tag}</span></span></button>`;
  }).join('')}</div>`;
}
function renderSubject() {
  const id = S.sel;
  if (!id) { SUBJ.innerHTML = ''; return; }
  const n = BY[id], sy = SYS[n.s];
  const tk = NODE_TK[id] || n.tk;
  const m = tk && MK[tk];
  const edges = ADJ[id].filter(edgeOn).sort((a, b) => (b.date || '0').localeCompare(a.date || '0'));
  const inc = {}, out = {}, partners = [], ties = [];
  edges.forEach(e => {
    if (e.type === 'partner') { partners.push(e); return; }
    if (e.type === 'tie') { ties.push(e); return; }
    const bucket = e.b === id ? inc : out;
    (bucket[e.type] = bucket[e.type] || []).push(e);
  });
  const left = GROUP_ORDER.map(t => groupHtml(t, GROUP_IN[t], inc[t] || [], id)).join('');
  const right = GROUP_ORDER.map(t => groupHtml(t, GROUP_OUT[t], out[t] || [], id)).join('');
  const hidden = ADJ[id].length - edges.length;
  const short = n.n.length > 16 ? (isPerson(n) ? 'them' : 'it') : n.n;
  SUBJ.innerHTML = `
    <div class="sj-grid">
      <svg class="sj-lines" aria-hidden="true"></svg>
      <div class="sj-col l"><div class="sj-side-head">Acts on ${esc(short)}</div>${left || `<div class="sj-empty">${hidden ? 'None in the current filters.' : 'None on file.'}</div>`}</div>
      <div class="sj-col c">
        <div class="sj-core" id="sj-core">
          <span class="eyebrow" style="color:${sy.tint}">${esc(sy.n)} // ${esc(sy.name)}</span>
          <h2>${esc(n.n)}</h2>
          <div class="meta">${isPerson(n) ? `<span class="chip">Key player</span>` : ''}${tk ? `<span class="tk">${esc(tk)}</span>` : ''}${m ? `<span class="grade g-${m.grade}">${m.grade}</span>` : ''}${n.pv ? `<span class="chip">${esc(n.pv)}</span>` : ''}${isPerson(n) ? '' : `<span class="chip">${esc(layerCode(n))}</span>`}</div>
          ${isPerson(n) && n.role ? `<p class="sj-role">${esc(n.role)}</p>` : ''}
          <p>${esc(shortSum(n.sum))}</p>
          <span class="eyebrow">${edges.length} threads${hidden ? ` · ${hidden} filtered out` : ''}</span>
        </div>
        ${groupHtml('partner', 'Partners', partners, id)}
        ${groupHtml('tie', 'Ties', ties, id)}
        ${isPerson(n) ? viaGroup('Shares a seat with', colleagues(id).map(c => [c.p, 'via ' + c.orgs.map(o => BY[o].n).join(', '), 'COLLEAGUE'])) : viaGroup('Board interlocks', interlocks(id).map(x => [x.org, 'via ' + x.via.map(q => BY[q].n).join(', '), 'INTERLOCK']))}
      </div>
      <div class="sj-col r"><div class="sj-side-head">${esc(n.n.length > 16 ? (isPerson(n) ? 'They' : 'It') : n.n)} act${isPerson(n) && n.n.length > 16 ? '' : 's'} on</div>${right || `<div class="sj-empty">${hidden ? 'None in the current filters.' : 'None on file.'}</div>`}</div>
    </div>`;
  drawLines();
}
/* connectors live only in the two gutters: card edge → spine → subject card */
function drawLines() {
  const grid = $('.sj-grid', SUBJ);
  if (!grid || !S.sel) return;
  const svg = $('.sj-lines', grid);
  if (getComputedStyle(svg).display === 'none') { svg.innerHTML = ''; return; }
  const g = grid.getBoundingClientRect();
  const core = $('#sj-core', grid).getBoundingClientRect();
  const coreY = core.top - g.top + 34;
  const parts = [];
  ['l', 'r'].forEach(side => {
    const col = $('.sj-col.' + side, grid);
    const cards = $$('.sj-card', col);
    if (!cards.length) return;
    const cr = col.getBoundingClientRect();
    const edgeX = side === 'l' ? cr.right - g.left : cr.left - g.left;
    const coreX = side === 'l' ? core.left - g.left : core.right - g.left;
    const spineX = (edgeX + coreX) / 2;
    const ys = cards.map(c => { const b = c.getBoundingClientRect(); return b.top - g.top + Math.min(18, b.height / 2); });
    const y0 = Math.min(coreY, ...ys), y1 = Math.max(coreY, ...ys);
    parts.push(`<path d="M${spineX} ${y0}V${y1}" stroke="rgba(165,165,165,0.28)" stroke-width="1.5" fill="none"/>`);
    parts.push(`<path d="M${spineX} ${coreY}H${coreX}" stroke="rgba(237,237,237,0.5)" stroke-width="1.5" fill="none"/>`);
    cards.forEach((c, i) => {
      const col2 = C.edgeTypes[EDGES[+c.dataset.ei].type].color;
      parts.push(`<path class="stub" data-ei="${c.dataset.ei}" d="M${edgeX} ${ys[i]}H${spineX}" stroke="${col2}" stroke-width="1.5" fill="none" opacity="0.7"/>`);
      parts.push(`<circle cx="${spineX}" cy="${ys[i]}" r="2.5" fill="${col2}"/>`);
    });
    parts.push(`<circle cx="${coreX}" cy="${coreY}" r="3.5" fill="#F0A63A"/>`);
  });
  svg.innerHTML = parts.join('');
}
function hlSubject(ei) {
  const grid = $('.sj-grid', SUBJ);
  if (!grid) return;
  grid.classList.toggle('sj-dim', ei != null);
  $$('.sj-card', grid).forEach(c => c.classList.toggle('hl', ei != null && +c.dataset.ei === ei));
  $$('.stub', grid).forEach(p => { const on = ei != null && +p.dataset.ei === ei; p.setAttribute('opacity', ei == null ? '0.7' : on ? '1' : '0.15'); p.setAttribute('stroke-width', on ? '2.5' : '1.5'); });
}
SUBJ.addEventListener('click', ev => {
  const c = ev.target.closest('.sj-card');
  if (c) select(c.dataset.go, 'push');
});
SUBJ.addEventListener('pointerover', ev => { const c = ev.target.closest('.sj-card'); hlSubject(c ? +c.dataset.ei : null); });
SUBJ.addEventListener('pointerleave', () => hlSubject(null));
new ResizeObserver(() => { if (S.mv === 'subject' && S.sel) drawLines(); }).observe($('#board-wrap'));

/* ---------------- status bar ---------------- */
const BAR = $('#bar');
function renderBar() {
  const h = [];
  if (MOBILE()) h.push(`<button type="button" class="btn" id="rail-toggle" aria-pressed="${document.body.classList.contains('rail-open')}">FILTERS</button>`);
  if (S.q.trim()) {
    const m = searchMatches(S.q).slice(0, 10);
    h.push(`<span class="crumbs"><span class="cur">${m.length ? m.length + (m.length === 10 ? '+' : '') + ' MATCH' + (m.length === 1 ? '' : 'ES') : 'NO MATCH'}</span></span>`);
    h.push(m.map((x, i) => `<button type="button" class="match ${i === 0 ? 'first' : ''}" data-m="${i}">${x.kind === 'thread' ? `<span class="eyebrow" style="margin-right:6px">THREAD ${x.id}</span>` : ''}${esc(x.name)}${x.tk ? `<span class="tk">${esc(x.tk)}</span>` : ''}</button>`).join(''));
    BAR.innerHTML = h.join('');
    return;
  }
  const boardVisible = !(S.sel && S.mv === 'subject');
  if (boardVisible) h.push(`<span class="seg2" role="group" aria-label="Board"><button type="button" data-bm="org" aria-pressed="${S.board === 'org'}">ORGANIZATIONS</button><button type="button" data-bm="ppl" aria-pressed="${S.board === 'ppl'}">PEOPLE</button></span>`);
  if (S.sel) {
    const trail = S.trail.length ? S.trail : [S.sel];
    h.push(`<span class="crumbs"><button type="button" data-crumb="-1">BOARD</button>${trail.map((id, i) => `<span>/</span>${i === trail.length - 1 ? `<span class="cur">${esc(BY[id].n.toUpperCase())}</span>` : `<button type="button" data-crumb="${i}">${esc(BY[id].n.toUpperCase())}</button>`}`).join('')}</span>`);
    h.push(`<span class="bar-actions"><button type="button" class="btn" data-mv="subject" aria-pressed="${S.mv === 'subject'}">SUBJECT</button><button type="button" class="btn" data-mv="board" aria-pressed="${S.mv === 'board'}">ON BOARD</button><button type="button" class="btn icon" data-act="close" aria-label="Close subject"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button></span>`);
    BAR.innerHTML = h.join('');
    return;
  }
  const note = (b, m) => `<span class="bar-note" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><b>${b}</b><span class="m">${m}</span></span>`;
  let ctxNote = '', actions = '';
  if (S.thread) {
    const T = THREADS.find(t => t.id === S.thread);
    h.push(`<span class="bar-tag">THREAD ${esc(T.id)}</span>`);
    ctxNote = note(esc(T.name), 'Numbers show the order of entry');
    actions = `<span class="bar-actions"><button type="button" class="btn" data-act="case">OPEN CASE</button><button type="button" class="btn" data-act="clear">CLEAR</button></span>`;
  } else if (S.layer) {
    h.push(`<span class="bar-tag" style="border-color:rgba(240,166,58,.6);color:var(--amber)">${esc(S.layer)}</span>`);
    ctxNote = note(esc(layerName(S.layer)), `${NODES.filter(n => inLayer(n, S.layer)).length} organizations on this layer`);
    actions = `<span class="bar-actions"><button type="button" class="btn" data-act="clear">CLEAR</button></span>`;
  } else {
    ctxNote = note(`${ORGS.length} organizations · ${PEOPLE.length} people · ${EDGES.length} threads`, MOBILE() ? 'Tap a name to open its subject board' : 'Hover a name to light its connections, click to open its subject board');
  }
  if (S.hover) {
    const n = BY[S.hover];
    const vis = ADJ[n.id].filter(edgeOn).length;
    h.push(note(esc(n.n), isPerson(n) ? `${esc(roleLine(n.id))} · ${vis} link${vis === 1 ? '' : 's'} · ${colleagues(n.id).length} shared seats · click to open` : `${esc(SYS[n.s].name)} · ${esc(layerCode(n))} · ${vis} thread${vis === 1 ? '' : 's'} lit · ${peopleOf(n.id).length} people · click to open`));
  } else h.push(ctxNote);
  h.push(actions);
  BAR.innerHTML = h.join('');
}
BAR.addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.id === 'rail-toggle') { document.body.classList.toggle('rail-open'); renderBar(); return; }
  if (b.dataset.m != null) { goMatch(searchMatches(S.q)[+b.dataset.m]); return; }
  if (b.dataset.bm) { S.board = b.dataset.bm; S.hover = null; renderBoard(); applyBoard(); renderBar(); writeHash(); return; }
  if (b.dataset.crumb != null) {
    const i = +b.dataset.crumb;
    if (i < 0) { select(null); return; }
    S.trail = S.trail.slice(0, i + 1);
    select(S.trail[i], 'keep');
    return;
  }
  if (b.dataset.mv) { S.mv = b.dataset.mv; showMain(); renderBar(); applyBoard(); writeHash(); return; }
  if (b.dataset.act === 'close') select(null);
  if (b.dataset.act === 'case') openThread(S.thread);
  if (b.dataset.act === 'clear') { S.thread = null; S.layer = null; renderRail(); renderBar(); applyBoard(); writeHash(); }
});

/* ---------------- selection ---------------- */
function showMain() {
  const subj = S.sel && S.mv === 'subject';
  BOARD.hidden = !!subj;
  SUBJ.hidden = !subj;
  if (subj) renderSubject();
}
function select(id, how = 'reset') {
  S.sel = id;
  S.edgeHover = null;
  S.hover = null;
  if (id) {
    if (how === 'push') { if (S.trail[S.trail.length - 1] !== id) S.trail.push(id); if (S.trail.length > 7) S.trail.shift(); }
    else if (how !== 'keep') S.trail = [id];
    S.mv = 'subject';
    renderDossier(id);
    $('#dossier').hidden = false;
    document.body.classList.add('has-sel');
  } else {
    S.trail = [];
    S.mv = 'board';
    $('#dossier').hidden = true;
    document.body.classList.remove('has-sel');
  }
  showMain();
  renderBar();
  applyBoard();
  $('#board-wrap').scrollTop = 0;
  if (MOBILE()) $('#stage').scrollTop = 0;
  writeHash();
}

/* ---------------- rail ---------------- */
const RAIL = $('#rail');
const TL_START = [2024, 10];
const TL_MAX = 50;
function cutoffFor(i) {
  const tot = TL_START[1] - 1 + i;
  const y = TL_START[0] + Math.floor(tot / 12), m = (tot % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}-31`;
}
let rpIndex = TL_MAX;
function typeSwatch(type) {
  const T = C.edgeTypes[type];
  const style = T.dash ? (T.dash[0] < 0.6 ? 'dotted' : 'dashed') : 'solid';
  return `<span class="sw" style="border-top-color:${T.color};border-top-style:${style}"></span>`;
}
function renderRail() {
  const typeCount = {};
  EDGES.forEach(e => { typeCount[e.type] = (typeCount[e.type] || 0) + 1; });
  RAIL.innerHTML = `
  <section><span class="eyebrow">Lens</span>
    ${C.lenses.map(l => `<button type="button" class="lens" data-lens="${l.id}" aria-pressed="${S.lens === l.id}"><b>${esc(l.name)}</b><span>${esc(l.d)}</span></button>`).join('')}
  </section>
  <section><span class="eyebrow">Stack layer · tap to light</span>
    ${LAYER_CODES.map(code => `<button type="button" class="row-btn" data-layer="${code}" aria-pressed="${S.layer === code}"><span class="n">${code}</span><span class="lbl">${esc(layerName(code))}</span><span class="c">${NODES.filter(n => inLayer(n, code)).length}</span></button>`).join('')}
  </section>
  <section><span class="eyebrow">Thread types · tap to hide</span>
    ${Object.entries(C.edgeTypes).map(([k, T]) => `<button type="button" class="row-btn ${S.off.has(k) ? 'type-off' : ''}" data-type="${k}" aria-pressed="false"><span>${typeSwatch(k)}</span><span class="lbl">${esc(T.name)}</span><span class="c">${typeCount[k] || 0}</span></button>`).join('')}
  </section>
  <section><span class="eyebrow">Replay the build</span>
    <div class="replay"><button type="button" class="btn icon" id="rp-play" aria-label="Replay the build"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg></button>
    <div><label class="sr" for="rp-range">Show the case as of</label><input type="range" id="rp-range" min="0" max="${TL_MAX}" value="${rpIndex}"><div id="rp-label">${rpLabel()}</div></div></div>
  </section>
  <section><span class="eyebrow">Key</span>
    <div class="legend-row"><span class="g"><span class="gl t-M"></span></span>Master node</div>
    <div class="legend-row"><span class="g"><span class="gl t-K"></span></span>Key node</div>
    <div class="legend-row"><span class="g"><span class="gl t-N"></span></span>Node</div>
    <div class="legend-row"><span class="g"><span class="gl t-N k-buyer"></span></span>Sovereign buyer · program</div>
    <div class="legend-row"><span class="g"><span class="gl t-N k-cap"></span></span>Capital</div>
    <div class="legend-row"><span class="g"><span class="gl t-N k-model"></span></span>Model</div>
    <div class="legend-row"><span class="g"><span class="gl t-N k-threat"></span></span>Threat · counter-bloc · oversight</div>
    <div class="legend-row"><span class="g"><span class="tk" style="font-size:10px">TKR</span></span>Listed ticker</div>
  </section>
  <section><button type="button" class="btn" data-act="reset">RESET ALL</button></section>`;
}
function rpLabel() { return rpIndex >= TL_MAX ? 'ALL DATES' : 'THROUGH ' + fmtDate(cutoffFor(rpIndex).slice(0, 7)).toUpperCase(); }
function setReplay(i) {
  rpIndex = +i;
  S.cutoff = rpIndex >= TL_MAX ? null : cutoffFor(rpIndex);
  const r = $('#rp-range'); if (r) r.value = rpIndex;
  const l = $('#rp-label'); if (l) l.textContent = rpLabel();
  applyBoard();
  if (S.sel && S.mv === 'subject') renderSubject();
}
let playTimer = null;
RAIL.addEventListener('input', ev => { if (ev.target.id === 'rp-range') { stopPlay(); setReplay(ev.target.value); } });
function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; } }
RAIL.addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.id === 'rp-play') {
    if (playTimer) { stopPlay(); return; }
    let i = 0; setReplay(0);
    playTimer = setInterval(() => { i++; if (i > TL_MAX) { stopPlay(); return; } setReplay(i); }, 220);
    return;
  }
  if (b.dataset.lens) { S.lens = b.dataset.lens; }
  else if (b.dataset.layer) { S.layer = S.layer === b.dataset.layer ? null : b.dataset.layer; if (S.layer) S.thread = null; }
  else if (b.dataset.type) { const k = b.dataset.type; S.off.has(k) ? S.off.delete(k) : S.off.add(k); }
  else if (b.dataset.act === 'reset') { resetAll(); return; }
  else return;
  const st = RAIL.scrollTop;
  renderRail(); RAIL.scrollTop = st;
  applyBoard(); renderBar();
  if (S.sel && S.mv === 'subject') renderSubject();
  writeHash();
});
function resetAll() {
  stopPlay();
  S.lens = 'all'; S.off.clear(); S.layer = null; S.thread = null; S.q = ''; $('#q').value = '';
  rpIndex = TL_MAX; S.cutoff = null;
  renderRail();
  select(null);
}

/* ---------------- dossier ---------------- */
function marketStrip(tk) {
  const m = MK[tk];
  if (!m) return '';
  const q = m.quote || {}, f = m.fund || {};
  const chg = q.price_change_percent;
  return `<div class="mkt-strip">
    <div><div class="v">${px(q.current_price)}</div><div class="l">PRICE <span class="${chg >= 0 ? 'up' : 'down'}">${chg == null ? '' : (chg >= 0 ? '+' : '−') + Math.abs(chg).toFixed(2) + '%'}</span></div></div>
    <div><div class="v">${fm(f.market_cap)}</div><div class="l">MARKET CAP</div></div>
    <div><div class="v"><span class="grade g-${m.grade}">${m.grade}</span></div><div class="l">HEALTH</div></div>
  </div>`;
}
const ST = { d: ['● DONE', 'st-d'], m: ['◐ IN MOTION', 'st-m'], p: ['○ PENDING', 'st-p'], b: ['✕ BLOCKED', 'st-b'] };
function ledger(rows) {
  return `<div class="ledger">${rows.map(o => { const st = ST[o[0]] || ST.p; return `<span class="st ${st[1]}">${st[0]}</span><span>${esc(o[1])}${o[2] ? `<span class="dt">${esc(fmtDate(o[2]))}</span>` : ''}</span>`; }).join('')}</div>`;
}
function personRow(id, note) {
  const o = BY[id];
  return `<button type="button" class="pp-row" data-go="${id}"><span class="gl t-${o.t} k-${o.k}" aria-hidden="true"></span><span><b>${esc(o.n)}</b><span>${esc(note)}</span></span></button>`;
}
function renderDossier(id) {
  const n = BY[id];
  const sy = SYS[n.s];
  const tk = NODE_TK[n.id] || n.tk;
  const fx = !MK[tk] && (C.markets.foreign || []).find(f => f.node === n.id);
  const edges = [...ADJ[id]].sort((a, b) => (b.date || '0').localeCompare(a.date || '0'));
  const th = NODE_THREADS[id] || [];
  const h = [];
  h.push(`<div class="d-head"><span class="eyebrow" style="color:${sy.tint}">${esc(sy.n)} // ${esc(sy.name)} · ${esc(isPerson(n) ? 'Key player' : TIER[n.t])}</span>
    <button type="button" class="btn icon" id="d-close" aria-label="Close dossier"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button></div>`);
  h.push(`<h2 class="d-name">${esc(n.n)}</h2>`);
  const chips = [];
  if (tk) chips.push(`<span class="chip"><span class="tk">${esc(tk)}</span>${n.ex ? esc(n.ex) : ''}<button type="button" class="copy" data-copy="${esc(tk)}">COPY</button></span>`);
  if (n.pv) chips.push(`<span class="chip">${esc(n.pv)}</span>`);
  chips.push(`<span class="chip">${esc(KIND[n.k] || n.k)}</span>`);
  (n.L || []).forEach(l => chips.push(`<span class="chip">L${l} ${esc(C.layers[l].name)}</span>`));
  if (n.analysis) chips.push(`<span class="chip" style="color:var(--bone);border-color:rgba(198,180,112,.45)">ANALYSIS</span>`);
  h.push(`<div class="chips">${chips.join('')}</div>`);
  if (tk && MK[tk]) {
    h.push(marketStrip(tk));
    h.push(`<div class="links"><button type="button" class="btn" data-open-tk="${esc(tk)}">OPEN IN MARKETS</button><a class="btn" href="https://www.barchart.com/stocks/quotes/${esc(tk)}/overview" target="_blank" rel="noopener">BARCHART</a></div>`);
  } else if (fx) {
    h.push(`<div class="card" style="padding:12px;font-size:12.5px;line-height:1.5;color:var(--soft)"><span class="eyebrow">${esc(fx.ex)} listing</span><br>${esc(fx.print)}${fx.book ? '<br>' + esc(fx.book) : ''}</div>`);
  }
  if (isPerson(n) && n.role) h.push(`<p class="d-role">${esc(n.role)}</p>`);
  h.push(`<p class="d-sum">${esc(n.sum)}</p>`);
  if (n.dir) h.push(`<div class="d-sec"><span class="eyebrow">Directive · mission</span><div class="d-dir">${esc(n.dir)}</div></div>`);
  if (n.strat) h.push(`<div class="d-sec"><span class="eyebrow">Strategy</span><p class="d-strat">${esc(n.strat)}</p></div>`);
  if (n.plan && n.plan.length) h.push(`<div class="d-sec"><span class="eyebrow">Plan of action</span>${ledger(n.plan)}</div>`);
  if (n.obj && n.obj.length) h.push(`<div class="d-sec"><span class="eyebrow">Objectives ledger</span>${ledger(n.obj)}</div>`);
  if (isPerson(n)) {
    const pos = orgsOf(id);
    if (pos.length) h.push(`<div class="d-sec"><span class="eyebrow">Positions · ${pos.length}</span><div class="ppl-list">${pos.map(({ org, e }) => personRow(org, `${REL[e.type][1].toLowerCase()} · ${e.label}`)).join('')}</div></div>`);
    const col = colleagues(id);
    if (col.length) h.push(`<div class="d-sec"><span class="eyebrow">Shares a seat with · ${col.length}</span><div class="ppl-list">${col.map(c => personRow(c.p, 'via ' + c.orgs.map(o => BY[o].n).join(', '))).join('')}</div></div>`);
  } else {
    const ppl = peopleOf(id);
    if (ppl.length) h.push(`<div class="d-sec"><span class="eyebrow">Key people · ${ppl.length}</span><div class="ppl-list">${ppl.map(({ p, e }) => personRow(p, `${REL[e.type][0].toLowerCase()} · ${e.label}`)).join('')}</div></div>`);
    const il = interlocks(id);
    if (il.length) h.push(`<div class="d-sec"><span class="eyebrow">Board interlocks · ${il.length}</span><div class="ppl-list">${il.map(x => personRow(x.org, 'via ' + x.via.map(q => BY[q].n).join(', '))).join('')}</div></div>`);
  }
  if (n.f && n.f.length) h.push(`<div class="d-sec"><span class="eyebrow">Facts on file</span><ul class="facts">${n.f.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`);
  if (edges.length) {
    h.push(`<div class="d-sec"><span class="eyebrow">Threads · ${edges.length}</span><div class="edge-list">${edges.map(e => {
      const other = BY[e.a === id ? e.b : e.a];
      const dir = e.a === id ? '→' : '←';
      return `<button type="button" class="edge-row" data-go="${other.id}" data-ei="${e.i}">${typeSwatch(e.type)}<div><b>${dir} ${esc(other.n)}</b><span>${esc(e.label)}${e.date ? ' · ' + esc(fmtDate(e.date)) : ''} · ${esc(e.T.name)}${e.v ? '' : ' · UNVERIFIED'}</span></div></button>`;
    }).join('')}</div></div>`);
  }
  if (th.length) h.push(`<div class="d-sec"><span class="eyebrow">Investigations</span><div class="chips">${th.map(t => { const T = THREADS.find(x => x.id === t); return `<button type="button" class="chip" data-thread="${t}">${t} ${esc(T.name)}</button>`; }).join('')}</div></div>`);
  if (n.src && n.src.length) h.push(`<div class="d-sec"><span class="eyebrow">Evidence</span><div class="src-list">${n.src.map(s => `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>`).join('')}</div></div>`);
  const d = $('#dossier');
  d.innerHTML = h.join('');
  d.scrollTop = 0;
}
$('#dossier').addEventListener('click', ev => {
  const t = ev.target.closest('button, a');
  if (!t) return;
  if (t.id === 'd-close') { select(null); return; }
  if (t.dataset.go) { select(t.dataset.go, 'push'); return; }
  if (t.dataset.thread) { openThread(t.dataset.thread); return; }
  if (t.dataset.openTk) { openTicker(t.dataset.openTk); return; }
  if (t.dataset.copy) { copyText(t.dataset.copy, t); }
});
function copyText(text, btn) {
  const done = () => { const o = btn.textContent; btn.textContent = 'COPIED'; setTimeout(() => { btn.textContent = o; }, 1100); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
}

/* ---------------- views ---------------- */
const SHEETS = ['threads', 'players', 'playbook', 'markets', 'brief', 'sources'];
function setView(v) {
  S.view = v;
  document.body.classList.toggle('v-map', v === 'map');
  $$('#nav button').forEach(b => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  SHEETS.forEach(id => $('#sheet-' + id).classList.toggle('on', v === id));
  if (v === 'players') renderPlayers();
  if (v === 'playbook') renderPlaybook();
  if (v === 'threads') renderThreads();
  if (v === 'markets') renderMarkets();
  if (v === 'brief') renderBrief();
  if (v === 'sources') renderSources();
  if (v === 'map') { renderBar(); if (S.sel && S.mv === 'subject') requestAnimationFrame(drawLines); }
  writeHash();
}
$('#nav').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) setView(b.dataset.view); });

function openThread(id) { S.activeThread = id; setView('threads'); const s = $('#sheet-threads'); s.scrollTop = 0; }
function renderThreads() {
  const T = THREADS.find(t => t.id === S.activeThread) || THREADS[0];
  const VS = { confirmed: '● CONFIRMED', reported: '◐ REPORTED', stage: '◇ ON STAGE', scheduled: '○ SCHEDULED', unverified: '✕ UNVERIFIED' };
  const evs = T.events.map((e, i) => {
    const side = i % 2 === 0 ? 1 : 3;
    const card = `<div class="ev k-${e[3]}" style="grid-column:${side}"><div class="ev-top"><span style="color:${e[3] === 'threat' ? '#FF7A70' : e[3] === 'response' ? '#F0A63A' : '#C6C6C6'}">${esc(fmtDate(e[0]).toUpperCase())}</span><span class="vs-${e[4]}">${VS[e[4]] || ''}</span></div><div class="ev-t">${esc(e[1])}</div>${e[2] ? `<div class="ev-x">${esc(e[2])}</div>` : ''}${e[5] ? `<div class="ev-s">${e[6] ? `<a href="${esc(e[6])}" target="_blank" rel="noopener">${esc(e[5])}</a>` : esc(e[5])}</div>` : ''}</div>`;
    const pin = `<div class="pin k-${e[3]}" style="grid-column:2"><span></span></div>`;
    const spacer = `<div class="spacer" style="grid-column:${side === 1 ? 3 : 1}"></div>`;
    return side === 1 ? card + pin + spacer : spacer + pin + card;
  }).join('');
  const span = `${fmtDate(T.events[0][0])} → ${fmtDate(T.events[T.events.length - 1][0])}`;
  $('#sheet-threads').innerHTML = `<div class="sheet-inner">
    <div><span class="eyebrow">Investigations · ${THREADS.length} threads</span></div>
    <div class="th-wrap">
      <nav class="th-list" aria-label="Threads">${THREADS.map(t => `<button type="button" class="th-item" data-th="${t.id}" aria-current="${t.id === T.id}"><span class="n">${t.id}</span>${esc(t.name)}</button>`).join('')}</nav>
      <article class="th-main">
        <div style="display:flex;flex-direction:column;gap:12px">
          <span class="eyebrow" style="color:#FF9A92">Thread ${esc(T.id)}</span>
          <h1>${esc(T.name)}</h1>
          <p class="lede">${esc(T.lede)}</p>
          <div class="chips"><span class="chip">${esc(span)}</span><span class="chip">${T.events.length} EVENTS</span><span class="chip">${T.nodes.length} NODES</span>${T.lenses.map(l => `<span class="chip">${esc(l.toUpperCase())}</span>`).join('')}</div>
          <div class="links"><button type="button" class="btn solid" data-show="${T.id}">SHOW THREAD ON MAP</button></div>
        </div>
        <div class="string">${evs}</div>
        <div class="grid-auto">
          <section class="card"><span class="eyebrow">What the thread shows</span><p style="margin:10px 0 0;font-size:14px;line-height:1.6">${esc(T.shows)}</p></section>
          <section class="card"><span class="eyebrow">Gains · exposed</span><div class="chips" style="margin-top:10px">${T.gains.map(g => `<span class="chip" style="color:#F0A63A;border-color:rgba(240,166,58,.5)">${esc(g)}</span>`).join('')}</div><div class="chips" style="margin-top:8px">${T.exposed.map(g => `<span class="chip" style="color:#FF9A92;border-color:rgba(255,154,146,.5)">${esc(g)}</span>`).join('')}</div></section>
          <section class="card" style="border-style:dashed"><span class="eyebrow">Open questions</span><ul class="facts" style="margin-top:10px">${T.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul></section>
        </div>
        <section><span class="eyebrow">Nodes in this thread</span><div class="chips" style="margin-top:10px">${T.nodes.map(id => `<button type="button" class="chip" data-node="${id}">${esc(BY[id].n)}</button>`).join('')}</div></section>
      </article>
    </div></div>`;
}
$('#sheet-threads').addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.dataset.th) { S.activeThread = b.dataset.th; renderThreads(); writeHash(); }
  if (b.dataset.show) { S.thread = b.dataset.show; S.layer = null; setView('map'); renderRail(); select(null); }
  if (b.dataset.node) { setView('map'); select(b.dataset.node, 'reset'); }
});

/* markets */
const MS = { q: '', sys: '', grade: '', sort: 'cap' };
function tickerRows() {
  const set = new Set([...Object.keys(MK), ...Object.keys(C.markets.research)]);
  return [...set].map(tk => {
    const nid = TK2NODE[tk], n = nid && BY[nid];
    const extra = EXTRA_NAMES[tk];
    const m = MK[tk] || {}, f = m.fund || {}, q = m.quote || {};
    const r = C.markets.research[tk] || {};
    return { tk, n, name: n ? n.n : extra ? extra[0] : tk, sys: n ? n.s : extra ? extra[1] : '', m, f, q, r, grade: m.grade || '—' };
  });
}
function nextCatalyst(r) { return r.cat && r.cat[0] ? r.cat : null; }
function renderMarkets() {
  let rows = tickerRows();
  const ql = MS.q.trim().toLowerCase();
  if (ql) rows = rows.filter(r => r.tk.toLowerCase().includes(ql) || r.name.toLowerCase().includes(ql) || (r.r.role || '').toLowerCase().includes(ql));
  if (MS.sys) rows = rows.filter(r => r.sys === MS.sys);
  if (MS.grade) rows = rows.filter(r => r.grade === MS.grade);
  const GR = { STRONG: 0, STABLE: 1, STRETCHED: 2, SPECULATIVE: 3 };
  const sorters = {
    cap: (a, b) => (b.f.market_cap || 0) - (a.f.market_cap || 0),
    growth: (a, b) => (b.f.rev_yoy ?? -9) - (a.f.rev_yoy ?? -9),
    grade: (a, b) => (GR[a.grade] ?? 9) - (GR[b.grade] ?? 9) || (b.f.market_cap || 0) - (a.f.market_cap || 0),
    ticker: (a, b) => a.tk.localeCompare(b.tk),
    catalyst: (a, b) => ((nextCatalyst(a.r) || ['9999'])[0]).localeCompare((nextCatalyst(b.r) || ['9999'])[0]),
    move: (a, b) => (b.q.price_change_percent ?? -99) - (a.q.price_change_percent ?? -99)
  };
  rows.sort(sorters[MS.sort]);
  const all = tickerRows();
  const counts = { STRONG: 0, STABLE: 0, STRETCHED: 0, SPECULATIVE: 0 };
  all.forEach(r => { if (counts[r.grade] != null) counts[r.grade]++; });
  const upcoming = C.markets.catalysts.filter(c => c[0] >= NOW).slice(0, 1)[0];
  const sysOpts = C.systems.map(s => `<option value="${s.id}" ${MS.sys === s.id ? 'selected' : ''}>${esc(s.n)} ${esc(s.name)}</option>`).join('');
  const html = `<div class="sheet-inner">
    <div style="display:flex;flex-direction:column;gap:12px">
      <span class="eyebrow">Markets // investable exposure</span>
      <h1>Investable exposure</h1>
      <p class="lede">Every listed company in the case with its role in the stack, SEC-derived financial health, a Cboe price and options snapshot, the latest print, and what to check next. Private nodes are mapped to their listed exposure routes below.</p>
      <div class="disclaimer">Research only; no investment advice. Health data from SEC XBRL company facts and a Cboe delayed price and options snapshot, both taken ${esc(fmtET(MARKET.generated))}. ${esc(C.markets.note)}</div>
    </div>
    <div class="mk-summary">
      <div class="card"><div class="v">${all.length}</div><span class="eyebrow">Listed tickers</span></div>
      <div class="card"><div class="v" style="color:var(--cyan)">${counts.STRONG}</div><span class="eyebrow">Strong</span></div>
      <div class="card"><div class="v">${counts.STABLE}</div><span class="eyebrow">Stable</span></div>
      <div class="card"><div class="v" style="color:var(--amber)">${counts.STRETCHED}</div><span class="eyebrow">Stretched</span></div>
      <div class="card"><div class="v" style="color:var(--red-soft)">${counts.SPECULATIVE}</div><span class="eyebrow">Speculative</span></div>
      <div class="card"><div class="v" style="font-size:18px;line-height:1.2">${upcoming ? esc(fmtDate(upcoming[0])) : '—'}</div><span class="eyebrow">${upcoming ? esc(upcoming[1]) : 'Next catalyst'}</span></div>
    </div>
    <div class="mk-controls">
      <label class="sr" for="mk-q">Filter tickers</label><input id="mk-q" type="search" placeholder="Filter ticker, name, role" value="${esc(MS.q)}">
      <label class="sr" for="mk-sys">System</label><select id="mk-sys"><option value="">All systems</option>${sysOpts}</select>
      <label class="sr" for="mk-grade">Health</label><select id="mk-grade"><option value="">All health grades</option>${['STRONG', 'STABLE', 'STRETCHED', 'SPECULATIVE'].map(g => `<option ${MS.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
      <label class="sr" for="mk-sort">Sort</label><select id="mk-sort">${[['cap', 'Sort: market cap'], ['growth', 'Sort: revenue growth'], ['grade', 'Sort: health'], ['catalyst', 'Sort: next catalyst'], ['move', 'Sort: day move'], ['ticker', 'Sort: ticker']].map(o => `<option value="${o[0]}" ${MS.sort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
      <span class="eyebrow" style="margin-left:auto">${rows.length} shown</span>
    </div>
    <div id="mk-list">${rows.map(tickerCard).join('') || '<p class="lede">No tickers match.</p>'}</div>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Private nodes · listed exposure routes</h2>
      <div class="table-box"><table class="table"><thead><tr><th>Company</th><th>Last mark</th><th>Investors</th><th>Signal</th><th>Listed route</th></tr></thead><tbody>
      ${C.markets.privates.map(p => `<tr><td><button type="button" class="chip" data-node="${p.node}">${esc(p.n)}</button></td><td><b>${esc(p.val)}</b><br><span style="color:var(--muted);font-family:var(--mono);font-size:10.5px">${esc(p.date)}</span></td><td style="color:var(--soft)">${esc(p.who)}</td><td style="color:var(--soft)">${esc(p.sig)}</td><td>${linkTickers(p.route)}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Non-US listings</h2>
      <div class="table-box"><table class="table"><thead><tr><th>Ticker</th><th>Company</th><th>Latest print</th><th>Backlog</th><th>Guide · risk</th></tr></thead><tbody>
      ${C.markets.foreign.map(f => `<tr><td><span class="tk">${esc(f.tk)}</span> <span style="color:var(--muted);font-family:var(--mono);font-size:10px">${esc(f.ex)}</span></td><td><button type="button" class="chip" data-node="${f.node}">${esc(f.n)}</button></td><td style="color:var(--soft)">${esc(f.print)}</td><td style="color:var(--soft)">${esc(f.book)}</td><td style="color:var(--soft)">${esc([f.guide, f.risk].filter(Boolean).join(' · '))}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Catalyst calendar</h2>
      <div class="table-box"><table class="table"><thead><tr><th>Date</th><th>Event</th><th>Type</th></tr></thead><tbody>
      ${C.markets.catalysts.map(c => `<tr style="${c[0] < NOW ? 'opacity:.45' : ''}"><td class="mono" style="white-space:nowrap">${esc(fmtDate(c[0]))}</td><td>${esc(c[1])}</td><td class="mono" style="color:var(--muted);font-size:11px">${esc(c[2].toUpperCase())}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Risk register</h2>
      <div class="grid-auto">${C.markets.risks.map(r => `<div class="card"><span class="eyebrow">${esc(r[0])}</span><p style="margin:8px 0 0;font-size:13px;line-height:1.55;color:var(--soft)">${esc(r[1])}</p></div>`).join('')}</div>
    </section>
  </div>`;
  const sheet = $('#sheet-markets');
  const scroll = sheet.scrollTop;
  sheet.innerHTML = html;
  sheet.scrollTop = scroll;
}
function linkTickers(text) {
  return esc(text).replace(/\(([A-Z0-9]{2,6})\)/g, (m, tk) => (MK[tk] || C.markets.research[tk]) ? `(<button type="button" class="copy" data-open-tk="${tk}" style="color:var(--tick);font-weight:700">${tk}</button>)` : m);
}
function metric(v, l) { return `<div class="metric"><div class="v">${v}</div><div class="l">${esc(l)}</div></div>`; }
function tickerCard(r) {
  const { tk, f, q, m } = r;
  const R = r.r;
  const open = S.open.has(tk);
  const chg = q.price_change_percent;
  const cat = nextCatalyst(R);
  const netCash = f.cash != null ? f.cash - (f.debt || 0) : null;
  const opts = (q.options || []).map(o => `<tr><td>${esc(fmtDate(o.expiry))}${o.monthly ? '' : ' <span style="color:var(--muted)">wk</span>'}</td><td>${o.atm ?? '—'}</td><td>${o.call && o.call.mid != null ? '$' + o.call.mid.toFixed(2) : '—'}</td><td>${o.put && o.put.mid != null ? '$' + o.put.mid.toFixed(2) : '—'}</td><td>${(o.call_oi || 0).toLocaleString()}</td><td>${(o.put_oi || 0).toLocaleString()}</td><td>${o.pc_oi ?? '—'}</td></tr>`).join('');
  const body = open ? `<div class="tkr-body">
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px"><span class="grade g-${m.grade}">${m.grade || '—'}</span>${(m.flags || []).map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>
      <div class="metrics">
        ${metric(fm(f.market_cap), 'MARKET CAP')}
        ${metric(fm(f.rev_ttm), 'REVENUE TTM')}
        ${metric(fm(f.rev_q) + ' <span style="font-weight:400;color:var(--muted)">' + pc(f.rev_yoy) + '</span>', 'LATEST QTR · YOY' + (f.rev_q_end ? ' · ' + fmtDate(f.rev_q_end).toUpperCase() : ''))}
        ${metric(pm(f.gross_margin), 'GROSS MARGIN TTM')}
        ${metric(pm(f.op_margin), 'OPERATING MARGIN TTM')}
        ${metric(pm(f.net_margin), 'NET MARGIN TTM')}
        ${metric(fm(f.fcf_ttm), 'FREE CASH FLOW TTM')}
        ${metric(fm(f.cash), 'CASH + ST INVESTMENTS')}
        ${metric(fm(f.debt), 'DEBT (REPORTED)')}
        ${metric(fm(netCash), 'NET CASH')}
        ${metric(f.ev_sales != null ? f.ev_sales.toFixed(1) + 'x' : '—', 'EV / SALES TTM')}
        ${metric(pc(f.share_change_yoy, 1), 'SHARES YOY')}
        ${metric(q.iv30 != null ? q.iv30.toFixed(1) + '%' : '—', 'IV30')}
        ${metric(q.volume != null ? Number(q.volume).toLocaleString() : '—', 'VOLUME')}
      </div>
      <div class="research">
        ${R.print ? `<div><b>LATEST PRINT</b>${esc(R.print)}</div>` : ''}
        ${R.book ? `<div><b>BACKLOG · BOOKINGS</b>${esc(R.book)}</div>` : ''}
        ${R.guide ? `<div><b>GUIDANCE</b>${esc(R.guide)}</div>` : ''}
        ${R.risk ? `<div><b>KEY RISK</b>${esc(R.risk)}</div>` : ''}
        ${cat ? `<div><b>NEXT CATALYST</b>${esc(fmtDate(cat[0]))} · ${esc(cat[1])}</div>` : ''}
        ${R.act ? `<div class="act"><b>DILIGENCE NEXT</b>${esc(R.act)}</div>` : ''}
      </div>
      ${opts ? `<div><span class="eyebrow">Options snapshot · next expiry + four monthlies · ATM strike</span><div class="table-box" style="margin-top:8px"><table class="opt-table"><thead><tr><th>EXPIRY</th><th>ATM</th><th>CALL MID</th><th>PUT MID</th><th>CALL OI</th><th>PUT OI</th><th>P/C OI</th></tr></thead><tbody>${opts}</tbody></table></div></div>` : ''}
      <div class="links">
        ${r.n ? `<button type="button" class="btn" data-node="${r.n.id}">SHOW ON MAP</button>` : ''}
        <a class="btn" href="https://www.barchart.com/stocks/quotes/${esc(tk)}/overview" target="_blank" rel="noopener">BARCHART</a>
        <a class="btn" href="https://www.barchart.com/stocks/quotes/${esc(tk)}/options" target="_blank" rel="noopener">OPTIONS CHAIN</a>
        <a class="btn" href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&amp;ticker=${esc(tk)}&amp;type=10-&amp;dateb=&amp;owner=include&amp;count=40" target="_blank" rel="noopener">SEC FILINGS</a>
      </div>
      <div class="eyebrow" style="text-transform:none;letter-spacing:.06em">XBRL period ${esc(f.ttm_end ? fmtDate(f.ttm_end) : f.rev_q_end ? fmtDate(f.rev_q_end) : '—')} · balance sheet ${esc(f.bs_date ? fmtDate(f.bs_date) : '—')} · last trade ${esc(fmtNaiveET(q.last_trade_time))}</div>
    </div>` : '';
  return `<div class="tkr ${open ? 'open' : ''}" id="tkr-${tk}">
    <button type="button" class="tkr-head" data-tkr="${tk}" aria-expanded="${open}">
      <span><span class="tk" style="font-size:15px">${esc(tk)}</span> <span class="copy" role="button" tabindex="0" data-copy="${esc(tk)}">COPY</span><span class="lab">${esc(r.sys ? SYS[r.sys].name : '')}</span></span>
      <span class="c-name"><span class="nm">${esc(r.name)}</span><span class="rl">${esc(R.role || '')}</span></span>
      <span class="c-chg"><span class="num">${px(q.current_price)}</span><span class="lab ${chg >= 0 ? 'up' : 'down'}">${chg == null ? '—' : (chg >= 0 ? '+' : '−') + Math.abs(chg).toFixed(2) + '%'}</span></span>
      <span class="c-cap"><span class="num">${fm(f.market_cap)}</span><span class="lab">MKT CAP</span></span>
      <span class="c-rev"><span class="num">${pc(f.rev_yoy)}</span><span class="lab">REV YOY</span></span>
      <span class="c-gr2"><span class="grade g-${m.grade}">${m.grade || '—'}</span></span>
      <span class="c-cat"><span class="num" style="font-size:11px">${cat ? esc(fmtDate(cat[0])) : '—'}</span><span class="lab">${cat ? esc(cat[1]).slice(0, 22).toUpperCase() : 'NEXT CATALYST'}</span></span>
      <svg class="chev" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
    </button>${body}</div>`;
}
$('#sheet-markets').addEventListener('click', ev => {
  const c = ev.target.closest('[data-copy]');
  if (c) { ev.stopPropagation(); copyText(c.dataset.copy, c); return; }
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.dataset.tkr) { const tk = b.dataset.tkr; S.open.has(tk) ? S.open.delete(tk) : S.open.add(tk); renderMarkets(); writeHash(); return; }
  if (b.dataset.node) { setView('map'); select(b.dataset.node, 'reset'); return; }
  if (b.dataset.openTk) openTicker(b.dataset.openTk);
});
$('#sheet-markets').addEventListener('keydown', ev => {
  const c = ev.target.closest('[data-copy]');
  if (c && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ev.stopPropagation(); copyText(c.dataset.copy, c); }
});
$('#sheet-markets').addEventListener('input', ev => {
  if (ev.target.id === 'mk-q') { MS.q = ev.target.value; const pos = ev.target.selectionStart; renderMarkets(); const i = $('#mk-q'); i.focus(); i.setSelectionRange(pos, pos); }
});
$('#sheet-markets').addEventListener('change', ev => {
  if (ev.target.id === 'mk-sys') { MS.sys = ev.target.value; renderMarkets(); }
  if (ev.target.id === 'mk-grade') { MS.grade = ev.target.value; renderMarkets(); }
  if (ev.target.id === 'mk-sort') { MS.sort = ev.target.value; renderMarkets(); }
});
function openTicker(tk) {
  S.open.add(tk);
  MS.q = ''; MS.sys = ''; MS.grade = '';
  setView('markets');
  requestAnimationFrame(() => { const el = $('#tkr-' + CSS.escape(tk)); if (el) el.scrollIntoView({ block: 'start', behavior: REDUCE ? 'auto' : 'smooth' }); });
}

/* brief */
function renderBrief() {
  const B = C.brief;
  const layerRows = [...C.layers].reverse().map(l => {
    const ns = NODES.filter(n => (n.L || []).includes(l.id));
    return `<tr><td class="mono" style="color:var(--amber);white-space:nowrap">${esc(l.code)}</td><td><b>${esc(l.name)}</b><br><span style="color:var(--muted);font-size:12px">${esc(l.d)}</span></td><td><div class="chips">${ns.map(n => `<button type="button" class="chip" data-node="${n.id}">${esc(n.n)}</button>`).join('')}</div></td></tr>`;
  }).join('');
  const DIR = { up: ['▲ GAINS', 'dir-up'], down: ['▼ LOSES', 'dir-down'], mixed: ['◆ MIXED', 'dir-mixed'], counter: ['✕ COUNTER', 'dir-counter'] };
  $('#sheet-brief').innerHTML = `<div class="sheet-inner">
    <div style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow">Brief // core read</span><h1>The sovereign SI system</h1>
      <p class="lede">How the stack is built, who controls each layer, where leverage moves, and what to watch. Built from the EDGE: SOVEREIGN SI research pages and deep dive.</p></div>
    <div class="core">${B.core.map((c, i) => `<div class="card"><span class="n">0${i + 1}</span><b>${esc(c[0])}</b><p>${esc(c[1])}</p></div>`).join('')}</div>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Strategies at a glance</h2>
      <div class="table-box"><table class="table"><thead><tr><th>Actor</th><th>Strategy</th><th>Next move</th></tr></thead><tbody>${NODES.filter(n => (n.t === 'M' || isPerson(n)) && (n.strat || n.dir)).sort((a, b) => (isPerson(a) - isPerson(b)) || DEG[b.id] - DEG[a.id]).slice(0, 40).map(n => { const nx = nextStep(n); return `<tr><td><button type="button" class="chip" data-node="${n.id}">${esc(n.n)}</button>${isPerson(n) && n.role ? `<br><span class="bt-role">${esc(n.role)}</span>` : ''}</td><td class="bt-strat">${esc(n.dir || shortSum(n.strat))}</td><td>${nx ? `<span class="st ${(ST[nx[0]] || ST.p)[1]}">${(ST[nx[0]] || ST.p)[0]}</span><br>${esc(nx[1])}` : '—'}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="links"><button type="button" class="btn" data-view-go="playbook">OPEN THE FULL PLAYBOOK</button><button type="button" class="btn" data-view-go="players">OPEN KEY PLAYERS</button></div></section>
    ${B.patterns && B.patterns.length ? `<section style="display:flex;flex-direction:column;gap:12px"><h2>Patterns across the layers</h2><ul class="weigh">${B.patterns.map(w => `<li>${esc(w)}</li>`).join('')}</ul></section>` : ''}
    <section style="display:flex;flex-direction:column;gap:12px"><h2>The stack, layer by layer</h2>
      <div class="table-box"><table class="table"><thead><tr><th>Layer</th><th>Function</th><th>Nodes on file</th></tr></thead><tbody>${layerRows}</tbody></table></div></section>
    <div class="grid-auto">
      <section class="card"><h2 style="font-size:17px">Who holds each layer in a "sovereign" deployment</h2><div class="table-box" style="margin-top:12px"><table class="table"><tbody>${B.hold.map(h => `<tr><td style="color:var(--muted)">${esc(h[0])}</td><td>${esc(h[1])}</td></tr>`).join('')}</tbody></table></div>
        <p style="margin:12px 0 0;font-size:13px;line-height:1.55;color:var(--soft)">Sovereignty is layered. A buyer can own every layer it can touch and still depend on the layers it cannot.</p></section>
      <section class="card"><h2 style="font-size:17px">The five loops</h2><div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">${B.loops.map((l, i) => `<div><span class="eyebrow" style="color:var(--amber)">0${i + 1} ${esc(l[0])}</span><p style="margin:4px 0 0;font-size:13px;line-height:1.55;color:var(--soft)">${esc(l[1])}</p></div>`).join('')}</div></section>
    </div>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Leverage rebalance</h2>
      <div class="table-box"><table class="table"><thead><tr><th>Actor</th><th>Direction</th><th>Mechanism</th></tr></thead><tbody>${B.leverage.map(l => `<tr><td><b>${esc(l[0])}</b></td><td class="mono ${DIR[l[1]][1]}" style="white-space:nowrap;font-size:11px">${DIR[l[1]][0]}</td><td style="color:var(--soft)">${esc(l[2])}</td></tr>`).join('')}</tbody></table></div>
      <p class="lede" style="font-size:14px">Leverage moves away from the cloud landlords: down the stack to whoever controls power, equipment and silicon, and up the stack to whoever owns the operating layer.</p></section>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>The global pivot</h2>
      <div class="table-box"><table class="table"><thead><tr><th>System</th><th>From</th><th>To</th></tr></thead><tbody>${B.pivot.map(p => `<tr><td><b>${esc(p[0])}</b></td><td style="color:var(--muted)">${esc(p[1])}</td><td>${esc(p[2])}</td></tr>`).join('')}</tbody></table></div></section>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Elements to weigh</h2><ul class="weigh">${B.weigh.map(w => `<li>${esc(w)}</li>`).join('')}</ul></section>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Signal board</h2>
      <div class="table-box"><table class="table"><thead><tr><th>Indicator</th><th>What it tells you</th><th>Cadence</th></tr></thead><tbody>${B.signals.map(s => `<tr><td><b>${esc(s[0])}</b></td><td style="color:var(--soft)">${esc(s[1])}</td><td class="mono" style="font-size:11px;color:var(--muted)">${esc(s[2])}</td></tr>`).join('')}</tbody></table></div></section>
    <div class="disclaimer">${esc(C.meta.disclaimer)}</div>
  </div>`;
}
$('#sheet-brief').addEventListener('click', ev => { const g = ev.target.closest('button[data-view-go]'); if (g) { setView(g.dataset.viewGo); return; } const b = ev.target.closest('button[data-node]'); if (b) { setView('map'); select(b.dataset.node, 'reset'); } });

/* sources */
function renderSources() {
  $('#sheet-sources').innerHTML = `<div class="sheet-inner">
    <div style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow">Sources // evidence</span><h1>Sources</h1>
    <p class="lede">Every claim on the map traces to one of these. Items flagged UNVERIFIED in the map rest on a single secondary source.</p></div>
    <div class="grid-auto">${C.sources.map(g => `<section class="card"><span class="eyebrow">${esc(g[0])}</span><div class="src-list" style="margin-top:12px">${g[1].map(s => `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>`).join('')}</div></section>`).join('')}</div>
    <section class="card"><span class="eyebrow">Data pipeline</span><p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:var(--soft)">Market health and quotes come from <span class="mono">pipeline/build_market.py</span>, which reads SEC XBRL company facts and the Cboe delayed-quotes feed and writes <span class="mono">data/market.js</span>. The included GitHub workflow reruns it on weekdays at 7:00 AM and 7:00 PM ET. Current snapshot: ${esc(fmtET(MARKET.generated))}.</p></section>
    <div class="disclaimer">${esc(C.meta.disclaimer)}</div>
  </div>`;
}

/* ---------------- players ---------------- */
const PS = { q: '', col: '', sort: 'links' };
function colOf(sid) { return COLS.findIndex(c => c.sys.includes(sid)); }
function playerCard(n) {
  const sy = SYS[n.s];
  const pos = PERSON_ORGS[n.id] || [];
  const ties = ADJ[n.id].filter(e => e.type === 'tie');
  const col = colleagues(n.id);
  return `<article class="pl-card">
    <div class="pl-top"><span class="gl t-${n.t} k-person" aria-hidden="true"></span><div><h3>${esc(n.n)}</h3><span class="eyebrow" style="color:${sy.tint}">${esc(sy.name)}</span></div></div>
    ${n.role ? `<p class="pl-role">${esc(n.role)}</p>` : ''}
    ${pos.length ? `<div class="pl-sec"><span class="eyebrow">Positions</span><div class="chips">${pos.map(({ org, e }) => `<button type="button" class="chip pl-org" data-node="${org}"><b>${esc(BY[org].n)}</b>${esc(REL[e.type][1].toLowerCase())}</button>`).join('')}</div></div>` : ''}
    ${ties.length ? `<div class="pl-sec"><span class="eyebrow">Ties</span><div class="chips">${ties.map(e => { const o = other(e, n.id); return `<button type="button" class="chip" data-node="${o}"><b>${esc(BY[o].n)}</b>${esc(e.label)}</button>`; }).join('')}</div></div>` : ''}
    ${col.length ? `<div class="pl-sec"><span class="eyebrow">Shares a seat with</span><div class="chips">${col.slice(0, 8).map(c => `<button type="button" class="chip" data-node="${c.p}">${esc(BY[c.p].n)}</button>`).join('')}${col.length > 8 ? `<span class="chip">+${col.length - 8}</span>` : ''}</div></div>` : ''}
    ${n.strat || n.dir ? `<p class="pl-strat">${esc(n.strat || n.dir)}</p>` : ''}
    <div class="links"><button type="button" class="btn" data-node="${n.id}">OPEN SUBJECT BOARD</button></div>
  </article>`;
}
function renderPlayers() {
  let ppl = PEOPLE.slice();
  const ql = PS.q.trim().toLowerCase();
  if (ql) ppl = ppl.filter(n => (n.n + ' ' + (n.role || '') + ' ' + (PERSON_ORGS[n.id] || []).map(x => BY[x.org].n).join(' ')).toLowerCase().includes(ql));
  if (PS.col !== '') ppl = ppl.filter(n => colOf(n.s) === +PS.col);
  const links = n => ADJ[n.id].length + colleagues(n.id).length;
  ppl.sort(PS.sort === 'name' ? (a, b) => a.n.localeCompare(b.n) : (a, b) => links(b) - links(a) || a.n.localeCompare(b.n));
  const allIl = [];
  ORGS.forEach(o => interlocks(o.id).forEach(x => { if (o.id < x.org) allIl.push([o.id, x.org, x.via]); }));
  allIl.sort((a, b) => b[2].length - a[2].length);
  const ties = EDGES.filter(e => e.type === 'tie');
  const seats = PEOPLE.reduce((k, n) => k + (PERSON_ORGS[n.id] || []).length, 0);
  const groups = COLS.map((c, i) => [c, ppl.filter(n => colOf(n.s) === i)]).filter(g => g[1].length);
  const sheet = $('#sheet-players');
  const scroll = sheet.scrollTop;
  sheet.innerHTML = `<div class="sheet-inner">
    <div style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow">Players // people behind the stack</span><h1>Key players</h1>
      <p class="lede">The people running, funding, governing and contesting the sovereign SI buildout. Every position links back to its organization on the map, and shared seats show where boards and executive teams interlock.</p></div>
    <div class="mk-summary">
      <div class="card"><div class="v">${PEOPLE.length}</div><span class="eyebrow">People on file</span></div>
      <div class="card"><div class="v">${seats}</div><span class="eyebrow">Positions</span></div>
      <div class="card"><div class="v" style="color:#C9A86A">${allIl.length}</div><span class="eyebrow">Board interlocks</span></div>
      <div class="card"><div class="v" style="color:#E58FB0">${ties.length}</div><span class="eyebrow">Personal ties</span></div>
    </div>
    <div class="mk-controls">
      <label class="sr" for="pl-q">Filter players</label><input id="pl-q" type="search" placeholder="Filter name, role, organization" value="${esc(PS.q)}">
      <label class="sr" for="pl-col">Column</label><select id="pl-col"><option value="">All columns</option>${COLS.map((c, i) => `<option value="${i}" ${PS.col === String(i) ? 'selected' : ''}>${c.n} ${esc(c.name)}</option>`).join('')}</select>
      <label class="sr" for="pl-sort">Sort</label><select id="pl-sort"><option value="links" ${PS.sort === 'links' ? 'selected' : ''}>Sort: most connected</option><option value="name" ${PS.sort === 'name' ? 'selected' : ''}>Sort: name</option></select>
      <span class="eyebrow" style="margin-left:auto">${ppl.length} shown</span>
    </div>
    ${groups.map(([c, list]) => `<section style="display:flex;flex-direction:column;gap:12px"><h2><span class="mono" style="color:var(--amber);font-size:12px;margin-right:10px">${c.n}</span>${esc(c.name)}</h2><div class="pl-grid">${list.map(playerCard).join('')}</div></section>`).join('') || '<p class="lede">No players match.</p>'}
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Board interlocks</h2>
      <p class="lede" style="font-size:15px">Organizations that share a person: an executive, director, founder, backer or official on both sides.</p>
      <div class="table-box"><table class="table"><thead><tr><th>Organization</th><th>Organization</th><th>Through</th></tr></thead><tbody>
      ${allIl.map(([a, b, via]) => `<tr><td><button type="button" class="chip" data-node="${a}">${esc(BY[a].n)}</button></td><td><button type="button" class="chip" data-node="${b}">${esc(BY[b].n)}</button></td><td>${via.map(q => `<button type="button" class="chip" data-node="${q}">${esc(BY[q].n)}</button>`).join(' ')}</td></tr>`).join('') || '<tr><td colspan="3">None on file.</td></tr>'}
      </tbody></table></div></section>
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Ties between people</h2>
      <div class="table-box"><table class="table"><thead><tr><th>Person</th><th>Person</th><th>Tie</th><th>Date</th></tr></thead><tbody>
      ${ties.map(e => `<tr><td><button type="button" class="chip" data-node="${e.a}">${esc(BY[e.a].n)}</button></td><td><button type="button" class="chip" data-node="${e.b}">${esc(BY[e.b].n)}</button></td><td>${esc(e.label)}${e.v ? '' : ' <span class="uv">· UNVERIFIED</span>'}</td><td class="mono" style="white-space:nowrap">${esc(fmtDate(e.date))}</td></tr>`).join('') || '<tr><td colspan="4">None on file.</td></tr>'}
      </tbody></table></div></section>
    <div class="disclaimer">${esc(C.meta.disclaimer)}</div>
  </div>`;
  sheet.scrollTop = scroll;
}
$('#sheet-players').addEventListener('click', ev => { const b = ev.target.closest('button[data-node]'); if (b) { setView('map'); select(b.dataset.node, 'reset'); } });
$('#sheet-players').addEventListener('input', ev => { if (ev.target.id === 'pl-q') { PS.q = ev.target.value; const pos = ev.target.selectionStart; renderPlayers(); const i = $('#pl-q'); i.focus(); i.setSelectionRange(pos, pos); } });
$('#sheet-players').addEventListener('change', ev => { if (ev.target.id === 'pl-col') { PS.col = ev.target.value; renderPlayers(); } if (ev.target.id === 'pl-sort') { PS.sort = ev.target.value; renderPlayers(); } });

/* ---------------- playbook ---------------- */
const BS = { q: '', type: '', sys: '', status: '', sort: 'rank', open: new Set() };
const steps = n => [...(n.plan || []), ...(n.obj || [])];
const nextStep = n => steps(n).find(o => o[0] === 'm') || steps(n).find(o => o[0] === 'p') || null;
function progress(n) {
  const all = steps(n), k = { d: 0, m: 0, p: 0, b: 0 };
  all.forEach(o => { k[o[0]] = (k[o[0]] || 0) + 1; });
  const t = all.length || 1;
  return `<span class="pb-bar" title="${k.d} done · ${k.m} in motion · ${k.p} pending · ${k.b} blocked">${['d', 'm', 'p', 'b'].map(x => k[x] ? `<i class="pb-${x}" style="flex:${k[x] / t}"></i>` : '').join('')}</span><span class="pb-k">${k.d}/${all.length}</span>`;
}
function renderPlaybook() {
  const TR = { M: 0, K: 1, N: 2 };
  let rows = NODES.filter(n => n.strat || (n.plan && n.plan.length) || (n.obj && n.obj.length));
  const ql = BS.q.trim().toLowerCase();
  if (ql) rows = rows.filter(n => (n.n + ' ' + (n.strat || '') + ' ' + (n.dir || '') + ' ' + steps(n).map(o => o[1]).join(' ')).toLowerCase().includes(ql));
  if (BS.type) rows = rows.filter(n => BS.type === 'person' ? isPerson(n) : !isPerson(n));
  if (BS.sys) rows = rows.filter(n => n.s === BS.sys);
  if (BS.status) rows = rows.filter(n => steps(n).some(o => o[0] === BS.status));
  const cnt = st => rows.reduce((k, n) => k + steps(n).filter(o => o[0] === st).length, 0);
  const sorters = {
    rank: (a, b) => (TR[a.t] ?? 2) - (TR[b.t] ?? 2) || steps(b).length - steps(a).length,
    motion: (a, b) => steps(b).filter(o => o[0] === 'm').length - steps(a).filter(o => o[0] === 'm').length,
    name: (a, b) => a.n.localeCompare(b.n)
  };
  rows.sort(sorters[BS.sort]);
  const sheet = $('#sheet-playbook');
  const scroll = sheet.scrollTop;
  sheet.innerHTML = `<div class="sheet-inner">
    <div style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow">Playbook // strategies and plans of action</span><h1>Playbook</h1>
      <p class="lede">What each actor is trying to achieve, how, and where each move stands. Steps in motion are live; pending steps are the ones to watch.</p></div>
    <div class="mk-summary">
      <div class="card"><div class="v">${rows.length}</div><span class="eyebrow">Actors</span></div>
      <div class="card"><div class="v" style="color:var(--cyan)">${cnt('d')}</div><span class="eyebrow">Done</span></div>
      <div class="card"><div class="v" style="color:var(--amber)">${cnt('m')}</div><span class="eyebrow">In motion</span></div>
      <div class="card"><div class="v">${cnt('p')}</div><span class="eyebrow">Pending</span></div>
      <div class="card"><div class="v" style="color:var(--red-soft)">${cnt('b')}</div><span class="eyebrow">Blocked</span></div>
    </div>
    <div class="mk-controls">
      <label class="sr" for="pb-q">Filter</label><input id="pb-q" type="search" placeholder="Filter actor, strategy, step" value="${esc(BS.q)}">
      <label class="sr" for="pb-type">Type</label><select id="pb-type"><option value="">Organizations + people</option><option value="org" ${BS.type === 'org' ? 'selected' : ''}>Organizations</option><option value="person" ${BS.type === 'person' ? 'selected' : ''}>People</option></select>
      <label class="sr" for="pb-sys">System</label><select id="pb-sys"><option value="">All systems</option>${C.systems.map(sy => `<option value="${sy.id}" ${BS.sys === sy.id ? 'selected' : ''}>${esc(sy.n)} ${esc(sy.name)}</option>`).join('')}</select>
      <label class="sr" for="pb-status">Status</label><select id="pb-status"><option value="">Any status</option>${[['m', 'Has steps in motion'], ['p', 'Has pending steps'], ['b', 'Has blocked steps'], ['d', 'Has completed steps']].map(o => `<option value="${o[0]}" ${BS.status === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
      <label class="sr" for="pb-sort">Sort</label><select id="pb-sort">${[['rank', 'Sort: importance'], ['motion', 'Sort: most in motion'], ['name', 'Sort: name']].map(o => `<option value="${o[0]}" ${BS.sort === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
      <span class="eyebrow" style="margin-left:auto">${rows.length} shown</span>
    </div>
    <div>${rows.map(n => {
      const open = BS.open.has(n.id), nx = nextStep(n), sy = SYS[n.s];
      return `<div class="tkr pb ${open ? 'open' : ''}" id="pb-${n.id}">
        <button type="button" class="tkr-head pb-head" data-pb="${n.id}" aria-expanded="${open}">
          <span class="c-name"><span class="nm">${esc(n.n)}</span><span class="lab" style="color:${sy.tint}">${esc(isPerson(n) ? 'KEY PLAYER' : (KIND[n.k] || '').toUpperCase())} · ${esc(sy.name.toUpperCase())}</span></span>
          <span class="pb-dir">${esc(n.dir || shortSum(n.strat || n.sum))}</span>
          <span class="pb-prog">${progress(n)}</span>
          <span class="pb-next">${nx ? `<span class="st ${(ST[nx[0]] || ST.p)[1]}">${(ST[nx[0]] || ST.p)[0]}</span><span>${esc(nx[1])}</span>` : '<span class="lab">NO OPEN STEPS</span>'}</span>
          <svg class="chev" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        ${open ? `<div class="tkr-body">
          ${n.strat ? `<div class="d-sec"><span class="eyebrow">Strategy</span><p class="d-strat">${esc(n.strat)}</p></div>` : ''}
          ${n.dir ? `<div class="d-sec"><span class="eyebrow">Directive · mission</span><div class="d-dir">${esc(n.dir)}</div></div>` : ''}
          ${n.plan && n.plan.length ? `<div class="d-sec"><span class="eyebrow">Plan of action</span>${ledger(n.plan)}</div>` : ''}
          ${n.obj && n.obj.length ? `<div class="d-sec"><span class="eyebrow">Objectives ledger</span>${ledger(n.obj)}</div>` : ''}
          ${isPerson(n) ? (orgsOf(n.id).length ? `<div class="d-sec"><span class="eyebrow">Positions</span><div class="chips">${orgsOf(n.id).map(x => `<button type="button" class="chip" data-node="${x.org}">${esc(BY[x.org].n)}</button>`).join('')}</div></div>` : '') : (peopleOf(n.id).length ? `<div class="d-sec"><span class="eyebrow">Key people</span><div class="chips">${peopleOf(n.id).map(x => `<button type="button" class="chip" data-node="${x.p}">${esc(BY[x.p].n)} · ${esc(REL[x.e.type][0].toLowerCase())}</button>`).join('')}</div></div>` : '')}
          <div class="links"><button type="button" class="btn" data-node="${n.id}">OPEN SUBJECT BOARD</button>${(NODE_TK[n.id] || n.tk) && MK[NODE_TK[n.id] || n.tk] ? `<button type="button" class="btn" data-open-tk="${esc(NODE_TK[n.id] || n.tk)}">OPEN IN MARKETS</button>` : ''}</div>
        </div>` : ''}
      </div>`;
    }).join('') || '<p class="lede">No actors match.</p>'}</div>
  </div>`;
  sheet.scrollTop = scroll;
}
$('#sheet-playbook').addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.dataset.pb) { const id = b.dataset.pb; BS.open.has(id) ? BS.open.delete(id) : BS.open.add(id); renderPlaybook(); return; }
  if (b.dataset.node) { setView('map'); select(b.dataset.node, 'reset'); return; }
  if (b.dataset.openTk) openTicker(b.dataset.openTk);
});
$('#sheet-playbook').addEventListener('input', ev => { if (ev.target.id === 'pb-q') { BS.q = ev.target.value; const pos = ev.target.selectionStart; renderPlaybook(); const i = $('#pb-q'); i.focus(); i.setSelectionRange(pos, pos); } });
$('#sheet-playbook').addEventListener('change', ev => { const k = { 'pb-type': 'type', 'pb-sys': 'sys', 'pb-status': 'status', 'pb-sort': 'sort' }[ev.target.id]; if (k) { BS[k] = ev.target.value; renderPlaybook(); } });

/* ---------------- search: filters the board in place ---------------- */
const qIn = $('#q');
function goMatch(x) {
  if (!x) return;
  S.q = ''; qIn.value = ''; qIn.blur();
  if (x.kind === 'node') { setView('map'); select(x.id, 'reset'); }
  else if (x.kind === 'ticker') { renderBar(); applyBoard(); openTicker(x.tk); }
  else if (x.kind === 'thread') { renderBar(); applyBoard(); openThread(x.id); }
}
qIn.addEventListener('input', () => {
  S.q = qIn.value;
  if (S.view !== 'map') setView('map');
  if (S.q.trim() && S.sel && S.mv === 'subject') { S.mv = 'board'; showMain(); }
  renderBar(); applyBoard();
  const first = searchMatches(S.q).find(x => x.kind === 'node');
  if (first && ROWS[first.id]) ROWS[first.id].scrollIntoView({ block: 'nearest', behavior: REDUCE ? 'auto' : 'smooth' });
});
qIn.addEventListener('keydown', ev => {
  if (ev.key === 'Enter') { ev.preventDefault(); goMatch(searchMatches(S.q)[0]); }
  else if (ev.key === 'Escape') { S.q = ''; qIn.value = ''; qIn.blur(); renderBar(); applyBoard(); }
});
document.addEventListener('keydown', ev => {
  if (ev.key === '/' && document.activeElement.tagName !== 'INPUT') { ev.preventDefault(); qIn.focus(); }
  if (ev.key === 'Escape' && document.activeElement.tagName !== 'INPUT') {
    if (S.view !== 'map') setView('map');
    else if (S.sel) select(null);
    else if (S.thread || S.layer) { S.thread = null; S.layer = null; renderRail(); renderBar(); applyBoard(); writeHash(); }
  }
});

/* ---------------- hash state ---------------- */
let hashLock = false;
function writeHash() {
  if (hashLock) return;
  const p = new URLSearchParams();
  if (S.view !== 'map') p.set('view', S.view);
  if (S.view === 'threads') p.set('thread', S.activeThread);
  if (S.view === 'markets' && S.open.size) p.set('tk', [...S.open].slice(-1)[0]);
  if (S.view === 'map') {
    if (S.board === 'ppl') p.set('board', 'ppl');
    if (S.sel) p.set('node', S.sel);
    if (S.sel && S.mv === 'board') p.set('on', 'board');
    if (S.thread) p.set('show', S.thread);
    if (S.layer) p.set('layer', S.layer);
    if (S.lens !== 'all') p.set('lens', S.lens);
  }
  const h = p.toString();
  history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
}
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  hashLock = true;
  if (p.get('lens') && C.lenses.some(l => l.id === p.get('lens'))) S.lens = p.get('lens');
  if (p.get('layer') && LAYER_CODES.includes(p.get('layer'))) S.layer = p.get('layer');
  if (p.get('show') && THREADS.some(t => t.id === p.get('show'))) S.thread = p.get('show');
  if (p.get('thread') && THREADS.some(t => t.id === p.get('thread'))) S.activeThread = p.get('thread');
  renderRail();
  if (p.get('node') && BY[p.get('node')]) { select(p.get('node'), 'reset'); if (p.get('on') === 'board') { S.mv = 'board'; showMain(); } }
  const v = p.get('view');
  if (v === 'markets' && p.get('tk')) { hashLock = false; openTicker(p.get('tk')); return; }
  if (p.get('board') === 'ppl' && S.board !== 'ppl') { S.board = 'ppl'; renderBoard(); }
  if (v && SHEETS.includes(v)) setView(v);
  hashLock = false;
  renderBar(); applyBoard();
}

/* ---------------- boot ---------------- */
renderBoard();
indexRows();
renderRail();
renderBar();
applyBoard();
readHash();
let wasMobile = MOBILE();
addEventListener('resize', () => { if (MOBILE() !== wasMobile) { wasMobile = MOBILE(); renderBar(); } });
addEventListener('hashchange', readHash);
window.__casemap = { S, select, setView, openTicker, openThread };

/* dossier thread rows: hovering one isolates it on the subject board or the board */
function dossierHover(ei) {
  if (ei === S.edgeHover) return;
  S.edgeHover = ei;
  if (S.mv === 'subject') hlSubject(ei); else applyBoard();
}
$('#dossier').addEventListener('mouseover', ev => { const r = ev.target.closest('.edge-row'); dossierHover(r ? +r.dataset.ei : null); });
$('#dossier').addEventListener('mouseleave', () => dossierHover(null));
$('#dossier').addEventListener('focusin', ev => { const r = ev.target.closest('.edge-row'); dossierHover(r ? +r.dataset.ei : null); });
