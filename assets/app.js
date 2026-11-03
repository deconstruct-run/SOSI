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
const TIER = { M: 'Primary entity', K: 'Key entity', N: 'Entity' };
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
  { n: '01', name: 'Capital + state', sys: ['state', 'capital', 'rails', 'insurance', 'allied'] },
  { n: '02', name: 'Control', sys: ['operating', 'models', 'agentic', 'primes'] },
  { n: '03', name: 'Operations + theaters', sys: ['autonomy', 'space', 'stratosphere', 'gulf', 'latam', 'cyber'] },
  { n: '04', name: 'Infrastructure', sys: ['compute', 'silicon', 'power', 'minerals', 'quantum'] },
  { n: '05', name: 'Health + biotech', sys: ['healthdata', 'biodefense', 'bodynet', 'pharma'] }
];
/* any system not placed above lands in the column it fits best by default */
C.systems.forEach(sy => { if (!COLS.some(c => c.sys.includes(sy.id))) COLS[0].sys.push(sy.id); });
const SYS_COL = {}; COLS.forEach((c, i) => c.sys.forEach(sid => { SYS_COL[sid] = i; }));
const colOfNode = id => SYS_COL[BY[id].s] ?? 0;
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
const S = { view: 'map', board: 'org', mv: 'board', lens: 'all', off: new Set(), layer: null, sel: null, trail: [], hover: null, edgeHover: null, thread: null, scope: null, tq: '', kind: '', linkedOnly: false, sort: { k: 'rank', dir: 1 }, cutoff: null, q: '', open: new Set(), activeThread: '07' };
const MOBILE = () => innerWidth <= 820;

function edgeOn(e) {
  if (S.off.has(e.type)) return false;
  if (S.lens !== 'all' && !e.T.lenses.includes(S.lens)) return false;
  if (S.cutoff && e.date && e.date > S.cutoff) return false;
  return true;
}
const other = (e, id) => (e.a === id ? e.b : e.a);
const relWord = (e, id) => (REL[e.type] || [e.type.toUpperCase(), e.type.toUpperCase()])[e.a === id ? 1 : 0];

/* ---------------- map: overview grid + entity table ---------------- */
const BOARD = $('#board');      /* overview grid */
const TABLE = $('#etable');     /* entity table pane */
const isLater = n => S.cutoff && FIRST[n.id] && FIRST[n.id] > S.cutoff;
const linksOn = id => ADJ[id].filter(edgeOn);
const crossLinks = id => { const c = colOfNode(id); return linksOn(id).filter(e => colOfNode(other(e, id)) !== c).length; };
const kindLabel = n => isPerson(n) ? 'Person' : (KIND[n.k] || n.k);
const sysNodes = (sid, mode = S.board) => NODES.filter(n => n.s === sid && (mode === 'ppl' ? isPerson(n) : mode === 'org' ? !isPerson(n) : true));
const rankSort = (a, b) => (TIER_ORD[a.t] ?? 2) - (TIER_ORD[b.t] ?? 2) || DEG[b.id] - DEG[a.id] || a.n.localeCompare(b.n);
function boardNodes(sid) { return sysNodes(sid).sort(rankSort); }

/* search matching */
function searchMatches(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const items = [];
  NODES.forEach(n => {
    const tk = (NODE_TK[n.id] || n.tk || '').toLowerCase();
    const nm = n.n.toLowerCase();
    const score = tk === q ? 5 : nm.startsWith(q) ? 4 : tk.startsWith(q) ? 3.5 : nm.includes(q) ? 3 : (n.role || '').toLowerCase().includes(q) ? 1.5 : (n.sum || '').toLowerCase().includes(q) ? 1 : 0;
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

/* the focus entity: hover in the table, else the selection */
const focusId = () => S.hover || S.sel || null;
function relMap(id) {
  const m = new Map();
  if (!id) return m;
  linksOn(id).forEach(e => { const o = other(e, id); if (!m.has(o)) m.set(o, e); });
  return m;
}

/* scope: what the table lists. Search, a thread and a layer take precedence over a chosen system or column. */
function scopeKey() {
  if (S.q.trim()) return 'q:' + S.q.trim().toLowerCase();
  if (S.thread) return 'thread:' + S.thread;
  if (S.layer) return 'layer:' + S.layer;
  return S.scope || '';
}
function scopeInfo() {
  const k = scopeKey();
  if (!k) return null;
  const [kind, val] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)];
  const mode = S.board;
  const keep = n => mode === 'ppl' ? isPerson(n) : !isPerson(n);
  if (kind === 'q') { const ids = searchMatches(S.q).filter(x => x.kind === 'node').map(x => x.id); return { kind, label: `Search: “${S.q.trim()}”`, rows: ids.map(id => BY[id]), mixed: true }; }
  if (kind === 'thread') { const T = THREADS.find(t => t.id === val); return { kind, label: `Thread ${T.id} · ${T.name}`, rows: T.nodes.map(id => BY[id]), steps: true, mixed: true, T }; }
  if (kind === 'layer') return { kind, label: `${val} · ${layerName(val)}`, rows: NODES.filter(n => inLayer(n, val)), mixed: true };
  if (kind === 'col') { const c = COLS[+val]; return { kind, label: `${c.n} · ${c.name}`, col: +val, rows: NODES.filter(n => colOfNode(n.id) === +val && keep(n)) }; }
  if (kind === 'sys') { const sy = SYS[val]; return { kind, label: `${sy.n} · ${sy.name}`, sys: val, col: SYS_COL[val], rows: NODES.filter(n => n.s === val && keep(n)) }; }
  if (kind === 'all') return { kind, label: 'All entities', rows: NODES.filter(keep) };
  return null;
}

/* ---- overview ---- */
function renderOverview() {
  const f = focusId(), rm = relMap(f);
  BOARD.innerHTML = COLS.map((col, ci) => {
    const colIds = NODES.filter(n => colOfNode(n.id) === ci && (S.board === 'ppl' ? isPerson(n) : !isPerson(n)));
    const cards = col.sys.map(sid => {
      const sy = SYS[sid], ns = boardNodes(sid);
      if (!ns.length) return '';
      const ppl = sysNodes(sid, 'ppl').length, orgs = sysNodes(sid, 'org').length;
      const links = ns.reduce((k, n) => k + linksOn(n.id).length, 0);
      const out = ns.reduce((k, n) => k + crossLinks(n.id), 0);
      const lit = f ? ns.filter(n => rm.has(n.id) || n.id === f).length : 0;
      const top = ns.slice(0, 4).map(n => esc(n.n)).join('<i>·</i>');
      const st = f ? (lit ? 'lit' : 'dim') : '';
      return `<button type="button" class="ov-card ${st} ${S.scope === 'sys:' + sid ? 'cur' : ''}" data-scope="sys:${sid}" style="--tint:${sy.tint}">
        <span class="ov-h"><span class="n">${esc(sy.n)}</span><span class="nm">${esc(sy.name)}</span><span class="c">${f ? `<b>${lit}</b>/${ns.length}` : ns.length}</span></span>
        <span class="ov-top">${top}</span>
        <span class="ov-m">${f ? `<span class="lk">${lit ? lit + ' linked' : 'no links'}</span>` : `<span>${links} links</span><span>${out} cross-column</span>`}</span>
      </button>`;
    }).join('');
    const litCol = f ? colIds.filter(n => rm.has(n.id)).length : 0;
    return `<section class="ov-col" data-col="${ci}">
      <button type="button" class="ov-colhead ${S.scope === 'col:' + ci ? 'cur' : ''}" data-scope="col:${ci}"><span class="n">${col.n}</span><span class="nm">${esc(col.name)}</span><span class="c">${f ? `<b>${litCol}</b>/${colIds.length}` : colIds.length}</span></button>
      ${cards}
    </section>`;
  }).join('');
}

/* ---- table ---- */
const SORTS = {
  name: (a, b) => a.n.localeCompare(b.n),
  kind: (a, b) => kindLabel(a).localeCompare(kindLabel(b)) || a.n.localeCompare(b.n),
  sys: (a, b) => SYS[a.s].n.localeCompare(SYS[b.s].n) || rankSort(a, b),
  tk: (a, b) => (NODE_TK[b.id] || b.tk ? 1 : 0) - (NODE_TK[a.id] || a.tk ? 1 : 0) || (NODE_TK[a.id] || a.tk || '').localeCompare(NODE_TK[b.id] || b.tk || ''),
  ppl: (a, b) => (isPerson(b) ? (PERSON_ORGS[b.id] || []).length : (ORG_PEOPLE[b.id] || []).length) - (isPerson(a) ? (PERSON_ORGS[a.id] || []).length : (ORG_PEOPLE[a.id] || []).length),
  links: (a, b) => linksOn(b.id).length - linksOn(a.id).length || rankSort(a, b),
  cross: (a, b) => crossLinks(b.id) - crossLinks(a.id) || rankSort(a, b),
  th: (a, b) => (NODE_THREADS[b.id] || []).length - (NODE_THREADS[a.id] || []).length,
  first: (a, b) => (FIRST[a.id] || '9999').localeCompare(FIRST[b.id] || '9999'),
  rank: rankSort
};
const TSTATE = { key: null, scroll: 0 };
function tableRows(info) {
  let rows = info.rows.filter(Boolean);
  const q = (S.tq || '').trim().toLowerCase();
  if (q) rows = rows.filter(n => (n.n + ' ' + (n.role || '') + ' ' + (NODE_TK[n.id] || n.tk || '')).toLowerCase().includes(q));
  if (S.kind) rows = rows.filter(n => (isPerson(n) ? 'person' : n.k) === S.kind);
  if (S.linkedOnly && S.sel) { const rm = relMap(S.sel); rows = rows.filter(n => rm.has(n.id)); }
  if (!info.steps || S.sort.k !== 'step') { const fn = SORTS[S.sort.k] || SORTS.rank; rows = [...rows].sort((a, b) => fn(a, b) * S.sort.dir); }
  return rows;
}
const TCOLS = [['step', '#', 'num'], ['name', 'Name', ''], ['kind', 'Type', ''], ['sys', 'System', ''], ['tk', 'Ticker', 'mono'], ['ppl', 'People', 'num'], ['links', 'Links', 'num'], ['cross', 'Cross-col', 'num'], ['th', 'Threads', 'num'], ['first', 'First', 'mono']];
function renderTable() {
  const info = scopeInfo();
  if (!info) { TABLE.innerHTML = ''; return; }
  const key = scopeKey() + '|' + S.board;
  const wrapOld = $('.et-body', TABLE);
  const keepScroll = TSTATE.key === key && wrapOld ? wrapOld.scrollTop : 0;
  TSTATE.key = key;
  const rows = tableRows(info);
  const f = focusId(), rm = relMap(S.sel);
  const kinds = [...new Set(info.rows.filter(Boolean).map(n => isPerson(n) ? 'person' : n.k))];
  const cols = TCOLS.filter(c => c[0] !== 'step' || info.steps);
  const th = cols.map(([k, l, cls]) => `<th class="c-${k} ${cls}" data-sort="${k}" aria-sort="${S.sort.k === k ? (S.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}">${l}${S.sort.k === k ? `<span class="ar">${S.sort.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('');
  const body = rows.map(n => {
    const tk = NODE_TK[n.id] || n.tk || '', m = tk && MK[tk];
    const e = S.sel && S.sel !== n.id ? rm.get(n.id) : null;
    const pc = isPerson(n) ? (PERSON_ORGS[n.id] || []).length : (ORG_PEOPLE[n.id] || []).length;
    const cells = {
      step: `<td class="num">${info.steps ? info.T.nodes.indexOf(n.id) + 1 : ''}</td>`,
      name: `<td class="nmc"><div class="nmx"><span class="gl t-${n.t} k-${n.k}" aria-hidden="true"></span><span class="nmw"><span class="nm">${esc(n.n)}</span>${isPerson(n) && n.role ? `<span class="sub">${esc(n.role)}</span>` : ''}</span>${e ? `<span class="rel c-${e.type}">${esc(relWord(e, S.sel))}</span>` : ''}</div></td>`,
      kind: `<td class="dim">${esc(kindLabel(n))}</td>`,
      sys: `<td class="dim"><span class="sw2" style="background:${SYS[n.s].tint}"></span>${esc(SYS[n.s].name)}</td>`,
      tk: `<td class="mono">${tk ? `<span class="tk">${esc(tk)}</span>${m ? ` <span class="grade g-${m.grade}">${m.grade}</span>` : ''}` : '<span class="na">—</span>'}</td>`,
      ppl: `<td class="num">${pc || '<span class="na">—</span>'}</td>`,
      links: `<td class="num">${linksOn(n.id).length}</td>`,
      cross: `<td class="num">${crossLinks(n.id) || '<span class="na">—</span>'}</td>`,
      th: `<td class="num">${(NODE_THREADS[n.id] || []).length || '<span class="na">—</span>'}</td>`,
      first: `<td class="mono dim">${FIRST[n.id] ? esc(fmtDate(FIRST[n.id].slice(0, 7))) : '<span class="na">—</span>'}</td>`
    };
    return `<tr data-id="${n.id}" tabindex="0" class="${S.sel === n.id ? 'sel' : ''} ${f && f !== n.id && S.hover && !relMap(S.hover).has(n.id) ? '' : ''} ${isLater(n) ? 'later' : ''}">${cols.map(c => cells[c[0]].replace('<td class="', `<td class="c-${c[0]} `)).join('')}</tr>`;
  }).join('');
  TABLE.innerHTML = `<div class="et-tools">
      <span class="et-title">${esc(info.label)}</span>
      <span class="et-count">${rows.length}${rows.length !== info.rows.length ? ' of ' + info.rows.length : ''}</span>
      <label class="sr" for="et-q">Filter this table</label><input id="et-q" type="search" placeholder="Filter table" value="${esc(S.tq || '')}" autocomplete="off">
      <label class="sr" for="et-kind">Type</label><select id="et-kind"><option value="">All types</option>${kinds.sort().map(k => `<option value="${k}" ${S.kind === k ? 'selected' : ''}>${esc(k === 'person' ? 'Person' : KIND[k] || k)}</option>`).join('')}</select>
      ${S.sel ? `<label class="et-chk"><input type="checkbox" id="et-linked" ${S.linkedOnly ? 'checked' : ''}> Linked to ${esc(BY[S.sel].n)}</label>` : ''}
    </div>
    <div class="et-body"><table class="et"><thead><tr>${th}</tr></thead><tbody>${body || `<tr><td colspan="${cols.length}" class="et-empty">No entities match.</td></tr>`}</tbody></table></div>`;
  $('.et-body', TABLE).scrollTop = keepScroll;
}
function setScope(sc) {
  S.scope = sc; S.tq = ''; S.kind = ''; S.linkedOnly = false;
  if (sc) { S.thread = null; S.layer = null; }
  if (S.sel && S.mv === 'subject') S.mv = 'board';
  renderRail(); showMain(); renderBar(); writeHash();
  if (MOBILE()) $('#stage').scrollTop = sc ? Math.max(0, TABLE.offsetTop - 8) : 0;
}
BOARD.addEventListener('click', ev => {
  const b = ev.target.closest('[data-scope]');
  if (b) setScope(b.dataset.scope);
});
TABLE.addEventListener('click', ev => {
  const h = ev.target.closest('th[data-sort]');
  if (h) { const k = h.dataset.sort; S.sort = S.sort.k === k ? { k, dir: -S.sort.dir } : { k, dir: ['name', 'kind', 'sys', 'tk', 'first', 'step'].includes(k) ? 1 : -1 }; renderTable(); return; }
  const r = ev.target.closest('tr[data-id]');
  if (r) select(r.dataset.id, 'reset');
});
TABLE.addEventListener('dblclick', ev => { const r = ev.target.closest('tr[data-id]'); if (r) { select(r.dataset.id, 'reset'); S.mv = 'subject'; showMain(); renderBar(); writeHash(); } });
TABLE.addEventListener('keydown', ev => {
  const r = ev.target.closest('tr[data-id]');
  if (!r) return;
  if (ev.key === 'Enter') { ev.preventDefault(); select(r.dataset.id, 'reset'); }
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); const n = ev.key === 'ArrowDown' ? r.nextElementSibling : r.previousElementSibling; if (n) n.focus(); }
});
TABLE.addEventListener('input', ev => {
  if (ev.target.id === 'et-q') { S.tq = ev.target.value; const pos = ev.target.selectionStart; renderTable(); const i = $('#et-q'); i.focus(); i.setSelectionRange(pos, pos); }
});
TABLE.addEventListener('change', ev => {
  if (ev.target.id === 'et-kind') { S.kind = ev.target.value; renderTable(); }
  if (ev.target.id === 'et-linked') { S.linkedOnly = ev.target.checked; renderTable(); }
});
/* hover in the table lights the overview cards that hold its links */
let hovT = null;
TABLE.addEventListener('pointerover', ev => {
  if (ev.pointerType === 'touch') return;
  const r = ev.target.closest('tr[data-id]');
  const id = r ? r.dataset.id : null;
  if (id === S.hover) return;
  clearTimeout(hovT);
  hovT = setTimeout(() => { S.hover = id; renderOverview(); renderBar(); }, 60);
});
TABLE.addEventListener('pointerleave', () => { clearTimeout(hovT); if (S.hover) { S.hover = null; renderOverview(); renderBar(); } });
function applyBoard() { renderOverview(); if (scopeInfo()) renderTable(); }
function renderBoard() { applyBoard(); }
function indexRows() {}

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
          <span class="eyebrow">${edges.length} relationships${hidden ? ` · ${hidden} filtered out` : ''}</span>
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
const SEP = '<span class="sep">/</span>';
function renderBar() {
  const h = [];
  if (MOBILE()) h.push(`<button type="button" class="btn" id="rail-toggle" aria-pressed="${document.body.classList.contains('rail-open')}">FILTERS</button>`);
  const subj = !!(S.sel && S.mv === 'subject');
  const info = scopeInfo();
  if (!subj) h.push(`<span class="seg2" role="group" aria-label="Entity type"><button type="button" data-bm="org" aria-pressed="${S.board === 'org'}">ORGANIZATIONS</button><button type="button" data-bm="ppl" aria-pressed="${S.board === 'ppl'}">PEOPLE</button></span>`);
  const cr = [`<button type="button" data-crumb="ov" ${!info && !subj ? 'aria-current="true"' : ''}>OVERVIEW</button>`];
  if (info && info.kind === 'sys') cr.push(SEP + `<button type="button" data-crumb="col:${info.col}">${COLS[info.col].n} ${esc(COLS[info.col].name.toUpperCase())}</button>`);
  if (info) cr.push(SEP + `<button type="button" data-crumb="table" ${!subj ? 'aria-current="true"' : ''}>${esc(info.label.toUpperCase())}</button>`);
  if (subj) { const tr = S.trail.length ? S.trail : [S.sel]; tr.forEach((id, i) => cr.push(SEP + (i === tr.length - 1 ? `<span class="cur">${esc(BY[id].n.toUpperCase())}</span>` : `<button type="button" data-trail="${i}">${esc(BY[id].n.toUpperCase())}</button>`))); }
  h.push(`<nav class="crumbs" aria-label="Location">${cr.join('')}</nav>`);
  const note = (b, m) => `<span class="bar-note"><b>${b}</b><span class="m">${m}</span></span>`;
  if (S.hover && !subj) {
    const n = BY[S.hover];
    h.push(note(esc(n.n), `${esc(SYS[n.s].name)} · ${linksOn(n.id).length} links · ${crossLinks(n.id)} cross-column`));
  } else if (S.q.trim()) {
    const all = searchMatches(S.q);
    const extra = all.filter(x => x.kind !== 'node').slice(0, 3);
    if (extra.length) h.push(`<span class="bar-extra">${extra.map(x => `<button type="button" class="match" data-m="${all.indexOf(x)}">${x.kind === 'thread' ? 'THREAD ' + x.id + ' · ' + esc(x.name) : 'TICKER ' + esc(x.tk)}</button>`).join('')}</span>`);
  } else if (!info && !subj) {
    h.push(note(`${ORGS.length} organizations · ${PEOPLE.length} people · ${EDGES.length} relationships`, MOBILE() ? 'Tap a system to list its entities' : 'Select a system or column to list its entities'));
  }
  const act = [];
  if (!info && !subj) act.push(`<button type="button" class="btn" data-crumb="all">ALL ENTITIES</button>`);
  if (S.thread) act.push(`<button type="button" class="btn" data-act="case">THREAD DETAIL</button>`);
  if (S.thread || S.layer || S.q.trim()) act.push(`<button type="button" class="btn" data-act="clear">CLEAR</button>`);
  if (S.sel) act.push(`<span class="seg2" role="group" aria-label="View"><button type="button" data-mv="board" aria-pressed="${!subj}">${info ? 'TABLE' : 'OVERVIEW'}</button><button type="button" data-mv="subject" aria-pressed="${subj}">CONNECTIONS</button></span>`);
  if (act.length) h.push(`<span class="bar-actions">${act.join('')}</span>`);
  BAR.innerHTML = h.join('');
}
BAR.addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.id === 'rail-toggle') { document.body.classList.toggle('rail-open'); renderBar(); return; }
  if (b.dataset.m != null) { goMatch(searchMatches(S.q)[+b.dataset.m]); return; }
  if (b.dataset.bm) { S.board = b.dataset.bm; S.hover = null; S.kind = ''; showMain(); renderBar(); writeHash(); return; }
  if (b.dataset.crumb) {
    const c = b.dataset.crumb;
    if (c === 'ov') { S.q = ''; qIn.value = ''; S.thread = null; S.layer = null; S.mv = 'board'; setScope(null); return; }
    if (c === 'table') { S.mv = 'board'; showMain(); renderBar(); writeHash(); return; }
    if (c === 'all') { setScope('all'); return; }
    setScope(c); return;
  }
  if (b.dataset.trail != null) { const i = +b.dataset.trail; S.trail = S.trail.slice(0, i + 1); select(S.trail[i], 'keep'); return; }
  if (b.dataset.mv) { S.mv = b.dataset.mv; showMain(); renderBar(); writeHash(); return; }
  if (b.dataset.act === 'case') openThread(S.thread);
  if (b.dataset.act === 'clear') { S.thread = null; S.layer = null; S.q = ''; qIn.value = ''; renderRail(); showMain(); renderBar(); writeHash(); }
});

/* ---------------- selection ---------------- */
function showMain() {
  const subj = !!(S.sel && S.mv === 'subject');
  const info = !subj && scopeInfo();
  SUBJ.hidden = !subj;
  BOARD.hidden = subj;
  TABLE.hidden = !info;
  BOARD.classList.toggle('compact', !!info);
  renderOverview();
  if (info) renderTable();
  if (subj) renderSubject();
}
/* opening an entity never moves the page: the detail panel docks on the right of whatever view is open */
function select(id, how = 'reset') {
  S.sel = id;
  S.edgeHover = null;
  S.hover = null;
  const d = $('#dossier');
  if (id) {
    if (how === 'push') { if (S.trail[S.trail.length - 1] !== id) S.trail.push(id); if (S.trail.length > 7) S.trail.shift(); }
    else if (how !== 'keep') S.trail = [id];
    renderDossier(id);
    d.hidden = false;
    document.body.classList.add('has-sel');
  } else {
    S.trail = [];
    S.mv = 'board';
    S.linkedOnly = false;
    d.hidden = true;
    document.body.classList.remove('has-sel');
  }
  if (S.view === 'map') showMain();
  renderBar();
  writeHash();
}
function openEntity(id) { select(id, 'reset'); }
function openOnMap(id, mode = 'board') {
  const n = BY[id];
  S.q = ''; qIn.value = ''; S.thread = null; S.layer = null;
  S.board = isPerson(n) ? 'ppl' : 'org';
  S.scope = 'sys:' + n.s; S.tq = ''; S.kind = ''; S.linkedOnly = false;
  S.mv = mode;
  if (S.view !== 'map') setView('map');
  select(id, 'reset');
  renderRail();
  requestAnimationFrame(() => { const r = $(`tr[data-id="${CSS.escape(id)}"]`, TABLE); const w = $('.et-body', TABLE); if (r && w) w.scrollTop = Math.max(0, r.offsetTop - w.clientHeight / 3); });
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
  <section><span class="eyebrow">Stack layer</span>
    ${LAYER_CODES.map(code => `<button type="button" class="row-btn" data-layer="${code}" aria-pressed="${S.layer === code}"><span class="n">${code}</span><span class="lbl">${esc(layerName(code))}</span><span class="c">${NODES.filter(n => inLayer(n, code)).length}</span></button>`).join('')}
  </section>
  <section><span class="eyebrow">Relationship types</span>
    ${Object.entries(C.edgeTypes).map(([k, T]) => `<button type="button" class="row-btn ${S.off.has(k) ? 'type-off' : ''}" data-type="${k}" aria-pressed="false"><span>${typeSwatch(k)}</span><span class="lbl">${esc(T.name)}</span><span class="c">${typeCount[k] || 0}</span></button>`).join('')}
  </section>
  <section><span class="eyebrow">Timeline</span>
    <div class="replay"><button type="button" class="btn icon" id="rp-play" aria-label="Replay the build"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg></button>
    <div><label class="sr" for="rp-range">Show the case as of</label><input type="range" id="rp-range" min="0" max="${TL_MAX}" value="${rpIndex}"><div id="rp-label">${rpLabel()}</div></div></div>
  </section>
  <section><span class="eyebrow">Key</span>
    <div class="legend-row"><span class="g"><span class="gl t-M"></span></span>Primary entity</div>
    <div class="legend-row"><span class="g"><span class="gl t-K"></span></span>Key entity</div>
    <div class="legend-row"><span class="g"><span class="gl t-N"></span></span>Entity</div>
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
  showMain();
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
  else if (b.dataset.layer) { S.layer = S.layer === b.dataset.layer ? null : b.dataset.layer; if (S.layer) { S.thread = null; S.q = ''; qIn.value = ''; S.mv = 'board'; } }
  else if (b.dataset.type) { const k = b.dataset.type; S.off.has(k) ? S.off.delete(k) : S.off.add(k); }
  else if (b.dataset.act === 'reset') { resetAll(); return; }
  else return;
  const st = RAIL.scrollTop;
  renderRail(); RAIL.scrollTop = st;
  showMain(); renderBar();
  writeHash();
});
function resetAll() {
  stopPlay();
  S.lens = 'all'; S.off.clear(); S.layer = null; S.thread = null; S.scope = null; S.q = ''; $('#q').value = '';
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
  h.push(`<div class="links d-acts"><button type="button" class="btn" data-onmap="${id}">${S.view === 'map' ? 'SHOW IN TABLE' : 'OPEN ON MAP'}</button><button type="button" class="btn" data-conn="${id}">CONNECTIONS</button></div>`);
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
  if (n.dir) h.push(`<div class="d-sec"><span class="eyebrow">Mission</span><div class="d-dir">${esc(n.dir)}</div></div>`);
  if (n.strat) h.push(`<div class="d-sec"><span class="eyebrow">Strategy</span><p class="d-strat">${esc(n.strat)}</p></div>`);
  if (n.plan && n.plan.length) h.push(`<div class="d-sec"><span class="eyebrow">Plan of action</span>${ledger(n.plan)}</div>`);
  if (n.obj && n.obj.length) h.push(`<div class="d-sec"><span class="eyebrow">Objectives</span>${ledger(n.obj)}</div>`);
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
  if (n.f && n.f.length) h.push(`<div class="d-sec"><span class="eyebrow">Facts</span><ul class="facts">${n.f.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`);
  if (edges.length) {
    h.push(`<div class="d-sec"><span class="eyebrow">Relationships · ${edges.length}</span><div class="edge-list">${edges.map(e => {
      const other = BY[e.a === id ? e.b : e.a];
      const dir = e.a === id ? '→' : '←';
      return `<button type="button" class="edge-row" data-go="${other.id}" data-ei="${e.i}">${typeSwatch(e.type)}<div><b>${dir} ${esc(other.n)}</b><span>${esc(e.label)}${e.date ? ' · ' + esc(fmtDate(e.date)) : ''} · ${esc(e.T.name)}${e.v ? '' : ' · UNVERIFIED'}</span></div></button>`;
    }).join('')}</div></div>`);
  }
  const cl = (C.claims || []).filter(c => (c.nodes || []).includes(id));
  if (cl.length) h.push(`<div class="d-sec"><span class="eyebrow">Claims ledger · ${cl.length}</span><div class="cl-mini">${cl.map(c => `<button type="button" class="cl-row" data-claim="${esc(c.id)}"><span class="cl-st ${claimCls(c.status)}">${esc(c.status)}</span><span>${esc(c.claim)}</span></button>`).join('')}</div></div>`);
  if (th.length) h.push(`<div class="d-sec"><span class="eyebrow">Threads</span><div class="chips">${th.map(t => { const T = THREADS.find(x => x.id === t); return `<button type="button" class="chip" data-thread="${t}">${t} ${esc(T.name)}</button>`; }).join('')}</div></div>`);
  if (n.src && n.src.length) h.push(`<div class="d-sec"><span class="eyebrow">Sources</span><div class="src-list">${n.src.map(s => `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>`).join('')}</div></div>`);
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
  if (t.dataset.claim) { openClaim(t.dataset.claim); return; }
  if (t.dataset.onmap) { openOnMap(t.dataset.onmap, 'board'); return; }
  if (t.dataset.conn) { if (S.view !== 'map') setView('map'); S.mv = 'subject'; showMain(); renderBar(); writeHash(); return; }
  if (t.dataset.copy) { copyText(t.dataset.copy, t); }
});
function copyText(text, btn) {
  const done = () => { const o = btn.textContent; btn.textContent = 'COPIED'; setTimeout(() => { btn.textContent = o; }, 1100); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
}

/* ---------------- views ---------------- */
const SHEETS = ['threads', 'players', 'playbook', 'markets', 'brief', 'sources'];
const SHEET_SCROLL = {};
function setView(v) {
  if (S.view !== 'map' && S.view !== v) SHEET_SCROLL[S.view] = $('#sheet-' + S.view).scrollTop;
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
  if (v === 'map') { showMain(); renderBar(); if (S.sel && S.mv === 'subject') requestAnimationFrame(drawLines); }
  else if (SHEET_SCROLL[v] != null) $('#sheet-' + v).scrollTop = SHEET_SCROLL[v];
  if (S.sel) renderDossier(S.sel);
  writeHash();
}
$('#nav').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) setView(b.dataset.view); });

function openThread(id) { S.activeThread = id; SHEET_SCROLL.threads = 0; setView('threads'); $('#sheet-threads').scrollTop = 0; requestAnimationFrame(() => { const it = $(`.th-item[data-th="${id}"]`); const l = $('.th-list'); if (it && l) l.scrollTop = it.offsetTop - l.clientHeight / 3; }); }
/* threads grouped like the board: the spine first, then one group per column (by where most of a thread's nodes sit) */
function threadCol(t) {
  const k = COLS.map(() => 0);
  t.nodes.forEach(id => { if (BY[id]) k[colOfNode(id)]++; });
  return k.indexOf(Math.max(...k));
}
function threadGroups() {
  const spine = THREADS.filter(t => t.spine);
  const gs = [{ n: '00', name: 'Cross-system', items: spine }];
  COLS.forEach((c, i) => gs.push({ n: c.n, name: c.name, items: THREADS.filter(t => !t.spine && threadCol(t) === i) }));
  return gs.filter(g => g.items.length);
}
function renderThreads() {
  const listOld = $('.th-list');
  const listScroll = listOld ? listOld.scrollTop : 0;
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
    <div><span class="eyebrow">Threads · ${THREADS.length}</span></div>
    <div class="th-wrap">
      <nav class="th-list" aria-label="Threads">${threadGroups().map(g => `<div class="th-group"><span class="n">${esc(g.n)}</span>${esc(g.name)}</div>` + g.items.map(t => `<button type="button" class="th-item${t.spine ? ' spine' : ''}" data-th="${t.id}" aria-current="${t.id === T.id}"><span class="n">${t.id}</span>${esc(t.name)}</button>`).join('')).join('')}</nav>
      <article class="th-main">
        <div style="display:flex;flex-direction:column;gap:12px">
          <span class="eyebrow" style="color:#FF9A92">Thread ${esc(T.id)}</span>
          <h1>${esc(T.name)}</h1>
          <p class="lede">${esc(T.lede)}</p>
          <div class="chips"><span class="chip">${esc(span)}</span><span class="chip">${T.events.length} EVENTS</span><span class="chip">${T.nodes.length} ENTITIES</span>${T.lenses.map(l => `<span class="chip">${esc(l.toUpperCase())}</span>`).join('')}</div>
          <div class="links"><button type="button" class="btn solid" data-show="${T.id}">SHOW ON MAP</button></div>
        </div>
        <div class="string">${evs}</div>
        <div class="grid-auto">
          <section class="card"><span class="eyebrow">Summary</span><p style="margin:10px 0 0;font-size:14px;line-height:1.6">${esc(T.shows)}</p></section>
          <section class="card"><span class="eyebrow">Beneficiaries · exposed</span><div class="chips" style="margin-top:10px">${T.gains.map(g => `<span class="chip" style="color:#F0A63A;border-color:rgba(240,166,58,.5)">${esc(g)}</span>`).join('')}</div><div class="chips" style="margin-top:8px">${T.exposed.map(g => `<span class="chip" style="color:#FF9A92;border-color:rgba(255,154,146,.5)">${esc(g)}</span>`).join('')}</div></section>
          <section class="card" style="border-style:dashed"><span class="eyebrow">Open questions</span><ul class="facts" style="margin-top:10px">${T.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul></section>
        </div>
        <section><span class="eyebrow">Entities · ${T.nodes.length}</span><div class="chips" style="margin-top:10px">${T.nodes.map(id => `<button type="button" class="chip" data-node="${id}">${esc(BY[id].n)}</button>`).join('')}</div></section>
      </article>
    </div></div>`;
  const l = $('.th-list'); if (l) l.scrollTop = listScroll;
}
$('#sheet-threads').addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.dataset.th) { S.activeThread = b.dataset.th; renderThreads(); $('#sheet-threads').scrollTop = 0; writeHash(); }
  if (b.dataset.show) { S.thread = b.dataset.show; S.layer = null; S.q = ''; qIn.value = ''; S.mv = 'board'; S.sort = { k: 'step', dir: 1 }; setView('map'); renderRail(); }
  if (b.dataset.node) openEntity(b.dataset.node);
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
      <span class="eyebrow">Markets</span>
      <h1>Listed exposure</h1>
      <p class="lede">Listed companies on the map with role, SEC-derived financial health, a Cboe price and options snapshot, latest results and the next diligence step. Private companies are listed with their public exposure.</p>
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
    <section style="display:flex;flex-direction:column;gap:12px"><h2>Private companies · listed exposure</h2>
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
  if (b.dataset.node) { openEntity(b.dataset.node); return; }
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

/* sources */
function renderSources() {
  $('#sheet-sources').innerHTML = `<div class="sheet-inner">
    <div style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow">Sources</span><h1>Sources</h1>
    <p class="lede">Items flagged UNVERIFIED rest on a single secondary source.</p></div>
    <div class="grid-auto">${C.sources.map(g => `<section class="card"><span class="eyebrow">${esc(g[0])}</span><div class="src-list" style="margin-top:12px">${g[1].map(s => `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>`).join('')}</div></section>`).join('')}</div>
    <section class="card"><span class="eyebrow">Data pipeline</span><p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:var(--soft)">Market health and quotes come from <span class="mono">pipeline/build_market.py</span>, which reads SEC XBRL company facts and the Cboe delayed-quotes feed and writes <span class="mono">data/market.js</span>. The included GitHub workflow reruns it on weekdays at 7:00 AM and 7:00 PM ET. Current snapshot: ${esc(fmtET(MARKET.generated))}.</p></section>
    <div class="disclaimer">${esc(C.meta.disclaimer)}</div>
  </div>`;
}

/* ---------------- workspace sheets: header, tabs, panes that scroll on their own ---------------- */
const TS = {};
/* sortable data table shared by Players, Playbook and Brief */
function gridTable(key, cols, rows, opts = {}) {
  const st = TS[key] || (TS[key] = { k: opts.sort || cols[0][0], dir: opts.dir || 1 });
  const c = cols.find(x => x[0] === st.k);
  if (c && c[4]) rows = [...rows].sort((a, b) => c[4](a, b) * st.dir);
  const th = cols.map(([k, l, cls, , sf]) => `<th class="${cls || ''}" ${sf ? `data-tsort="${key}:${k}"` : ''} aria-sort="${st.k === k ? (st.dir > 0 ? 'ascending' : 'descending') : 'none'}">${l}${st.k === k && sf ? `<span class="ar">${st.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('');
  const body = rows.map(r => `<tr ${opts.attr ? opts.attr(r) : ''}>${cols.map(([k, , cls, fn]) => `<td class="${cls || ''}">${fn(r)}</td>`).join('')}</tr>`).join('');
  return `<table class="et">${opts.noHead ? '' : `<thead><tr>${th}</tr></thead>`}<tbody>${body || `<tr><td colspan="${cols.length}" class="et-empty">${opts.empty || 'None on file.'}</td></tr>`}</tbody></table>`;
}
const numSort = f => (a, b) => f(a) - f(b);
const strSort = f => (a, b) => String(f(a)).localeCompare(String(f(b)));
const lk = id => BY[id] ? `<button type="button" class="lk" data-node="${id}">${esc(BY[id].n)}</button>` : '';
const sysCell = n => `<span class="sw2" style="background:${SYS[n.s].tint}"></span>${esc(SYS[n.s].name)}`;
const nameCell = (n, sub) => `<div class="nmx"><span class="gl t-${n.t} k-${n.k}" aria-hidden="true"></span><span class="nmw"><span class="nm">${esc(n.n)}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</span></div>`;
const stCell = nx => nx ? `<span class="st ${(ST[nx[0]] || ST.p)[1]}">${(ST[nx[0]] || ST.p)[0]}</span> <span class="stx">${esc(nx[1])}</span>` : '<span class="na">No open steps</span>';
function wsHead(eyebrow, title, desc, stats) {
  return `<header class="ws-head"><div class="ws-t"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1></div><p class="ws-d">${esc(desc)}</p>${stats ? `<div class="ws-stats">${stats.map(s => `<span><b${s[2] ? ` style="color:${s[2]}"` : ''}>${s[0]}</b>${esc(s[1])}</span>`).join('')}</div>` : ''}</header>`;
}
function wsTabs(cur, tabs, attr) {
  return `<nav class="ws-tabs" role="tablist">${tabs.map(t => `<button type="button" role="tab" ${attr}="${t[0]}" aria-selected="${cur === t[0]}">${esc(t[1])}${t[2] != null ? `<span class="c">${t[2]}</span>` : ''}</button>`).join('')}</nav>`;
}
/* re-render a sheet without losing any pane's scroll position */
function keepPanes(sheet, fn) {
  const pos = {};
  $$('[data-pane]', sheet).forEach(p => { pos[p.dataset.pane] = p.scrollTop; });
  const s = sheet.scrollTop;
  fn();
  $$('[data-pane]', sheet).forEach(p => { if (pos[p.dataset.pane] != null) p.scrollTop = pos[p.dataset.pane]; });
  sheet.scrollTop = s;
}
function sheetClick(ev, rerender) {
  const h = ev.target.closest('th[data-tsort]');
  if (h) { const [key, k] = h.dataset.tsort.split(':'); const st = TS[key]; TS[key] = st.k === k ? { k, dir: -st.dir } : { k, dir: 1 }; rerender(); return true; }
  const sc = ev.target.closest('[data-goscope]');
  if (sc) { S.q = ''; qIn.value = ''; S.thread = null; S.layer = null; setView('map'); setScope(sc.dataset.goscope); return true; }
  const ly = ev.target.closest('[data-golayer]');
  if (ly) { S.q = ''; qIn.value = ''; S.thread = null; S.scope = null; S.layer = ly.dataset.golayer; S.mv = 'board'; setView('map'); renderRail(); return true; }
  const g = ev.target.closest('[data-view-go]');
  if (g) { setView(g.dataset.viewGo); return true; }
  const th = ev.target.closest('[data-thread]');
  if (th) { openThread(th.dataset.thread); return true; }
  const tk = ev.target.closest('[data-open-tk]');
  if (tk) { openTicker(tk.dataset.openTk); return true; }
  const nb = ev.target.closest('[data-node]');
  if (nb) { openEntity(nb.dataset.node); rerender(); return true; }
  return false;
}

/* ---------------- players ---------------- */
const PS = { q: '', col: '', tab: 'people' };
function colOf(sid) { return COLS.findIndex(c => c.sys.includes(sid)); }
function renderPlayers() {
  const sheet = $('#sheet-players');
  let ppl = PEOPLE.slice();
  const ql = PS.q.trim().toLowerCase();
  if (ql) ppl = ppl.filter(n => (n.n + ' ' + (n.role || '') + ' ' + (PERSON_ORGS[n.id] || []).map(x => BY[x.org].n).join(' ')).toLowerCase().includes(ql));
  if (PS.col !== '') ppl = ppl.filter(n => colOf(n.s) === +PS.col);
  const allIl = [];
  ORGS.forEach(o => interlocks(o.id).forEach(x => { if (o.id < x.org) allIl.push([o.id, x.org, x.via]); }));
  const ties = EDGES.filter(e => e.type === 'tie');
  const seats = PEOPLE.reduce((k, n) => k + (PERSON_ORGS[n.id] || []).length, 0);
  const pos = n => PERSON_ORGS[n.id] || [];
  const tiesOf = n => ADJ[n.id].filter(e => e.type === 'tie');
  let body = '';
  if (PS.tab === 'people') {
    body = `<div class="ws-tools">
        <label class="sr" for="pl-q">Filter people</label><input id="pl-q" type="search" placeholder="Filter name, role, organization" value="${esc(PS.q)}">
        <label class="sr" for="pl-col">Column</label><select id="pl-col"><option value="">All columns</option>${COLS.map((c, i) => `<option value="${i}" ${PS.col === String(i) ? 'selected' : ''}>${c.n} ${esc(c.name)}</option>`).join('')}</select>
        <span class="et-count">${ppl.length} of ${PEOPLE.length}</span>
      </div>
      <div class="ws-pane" data-pane="pl">${gridTable('pl', [
        ['name', 'Name', 'nmc', n => nameCell(n, n.role), strSort(n => n.n)],
        ['sys', 'System', 'dim', sysCell, strSort(n => SYS[n.s].n)],
        ['pos', 'Positions', 'posc', n => pos(n).length ? `<span title="${esc(pos(n).map(x => BY[x.org].n).join(' · '))}">${lk(pos(n)[0].org)}${pos(n).length > 1 ? `<span class="na"> +${pos(n).length - 1}</span>` : ''}</span>` : '<span class="na">—</span>', numSort(n => pos(n).length)],
        ['seat', 'Shared seats', 'num', n => colleagues(n.id).length || '<span class="na">—</span>', numSort(n => colleagues(n.id).length)],
        ['tie', 'Ties', 'num', n => tiesOf(n).length || '<span class="na">—</span>', numSort(n => tiesOf(n).length)],
        ['links', 'Links', 'num', n => ADJ[n.id].length, numSort(n => ADJ[n.id].length)],
        ['th', 'Threads', 'num', n => (NODE_THREADS[n.id] || []).length || '<span class="na">—</span>', numSort(n => (NODE_THREADS[n.id] || []).length)]
      ], ppl, { sort: 'links', dir: -1, empty: 'No people match.', attr: n => `data-row="${n.id}" tabindex="0" class="${S.sel === n.id ? 'sel' : ''}"` })}</div>`;
  } else if (PS.tab === 'interlocks') {
    body = `<div class="ws-tools"><span class="ws-note">Organizations that share an executive, director, founder, backer or official.</span><span class="et-count">${allIl.length}</span></div>
      <div class="ws-pane" data-pane="il">${gridTable('il', [
        ['a', 'Organization', '', r => lk(r[0]), strSort(r => BY[r[0]].n)],
        ['b', 'Organization', '', r => lk(r[1]), strSort(r => BY[r[1]].n)],
        ['via', 'Through', 'wrap', r => r[2].map(lk).join('<span class="dot">·</span>'), numSort(r => r[2].length)],
        ['k', 'People', 'num', r => r[2].length, numSort(r => r[2].length)]
      ], allIl, { sort: 'k', dir: -1 })}</div>`;
  } else {
    body = `<div class="ws-tools"><span class="ws-note">Family, business and political ties between people on the map.</span><span class="et-count">${ties.length}</span></div>
      <div class="ws-pane" data-pane="ti">${gridTable('ti', [
        ['a', 'Person', '', e => lk(e.a), strSort(e => BY[e.a].n)],
        ['b', 'Person', '', e => lk(e.b), strSort(e => BY[e.b].n)],
        ['l', 'Tie', 'wrap', e => esc(e.label) + (e.v ? '' : ' <span class="uv">UNVERIFIED</span>'), strSort(e => e.label)],
        ['d', 'Date', 'mono dim', e => esc(fmtDate(e.date)) || '<span class="na">—</span>', strSort(e => e.date || '0')]
      ], ties, { sort: 'd', dir: -1 })}</div>`;
  }
  keepPanes(sheet, () => {
    sheet.innerHTML = `<div class="ws">
      ${wsHead('Players', 'Key players', 'People who run, fund, govern and contest the entities on the map. Select a row for the full record.', [[PEOPLE.length, 'people'], [seats, 'positions'], [allIl.length, 'board interlocks', '#C9A86A'], [ties.length, 'personal ties', '#E58FB0']])}
      ${wsTabs(PS.tab, [['people', 'People', PEOPLE.length], ['interlocks', 'Board interlocks', allIl.length], ['ties', 'Personal ties', ties.length]], 'data-pltab')}
      <div class="ws-body ws-col">${body}</div>
    </div>`;
  });
}
$('#sheet-players').addEventListener('click', ev => {
  const t = ev.target.closest('[data-pltab]');
  if (t) { PS.tab = t.dataset.pltab; renderPlayers(); return; }
  if (sheetClick(ev, renderPlayers)) return;
  const r = ev.target.closest('tr[data-row]');
  if (r) { openEntity(r.dataset.row); renderPlayers(); }
});
$('#sheet-players').addEventListener('keydown', ev => { const r = ev.target.closest('tr[data-row]'); if (r && ev.key === 'Enter') { openEntity(r.dataset.row); renderPlayers(); $(`tr[data-row="${r.dataset.row}"]`).focus(); } });
$('#sheet-players').addEventListener('input', ev => { if (ev.target.id === 'pl-q') { PS.q = ev.target.value; const p = ev.target.selectionStart; renderPlayers(); const i = $('#pl-q'); i.focus(); i.setSelectionRange(p, p); } });
$('#sheet-players').addEventListener('change', ev => { if (ev.target.id === 'pl-col') { PS.col = ev.target.value; renderPlayers(); } });

/* ---------------- playbook: list on the left, the selected actor's full plan on the right ---------------- */
const BS = { q: '', type: '', sys: '', status: '', sel: null };
const steps = n => [...(n.plan || []), ...(n.obj || [])];
const nextStep = n => steps(n).find(o => o[0] === 'm') || steps(n).find(o => o[0] === 'p') || null;
const stepCount = (n, s) => steps(n).filter(o => o[0] === s).length;
function progress(n) {
  const all = steps(n), k = { d: 0, m: 0, p: 0, b: 0 };
  all.forEach(o => { k[o[0]] = (k[o[0]] || 0) + 1; });
  const t = all.length || 1;
  return `<span class="pb-bar" title="${k.d} done · ${k.m} in motion · ${k.p} pending · ${k.b} blocked">${['d', 'm', 'p', 'b'].map(x => k[x] ? `<i class="pb-${x}" style="flex:${k[x] / t}"></i>` : '').join('')}</span><span class="pb-k">${k.d}/${all.length}</span>`;
}
function playbookRows() {
  let rows = NODES.filter(n => n.strat || (n.plan && n.plan.length) || (n.obj && n.obj.length));
  const ql = BS.q.trim().toLowerCase();
  if (ql) rows = rows.filter(n => (n.n + ' ' + (n.strat || '') + ' ' + (n.dir || '') + ' ' + steps(n).map(o => o[1]).join(' ')).toLowerCase().includes(ql));
  if (BS.type) rows = rows.filter(n => BS.type === 'person' ? isPerson(n) : !isPerson(n));
  if (BS.sys) rows = rows.filter(n => n.s === BS.sys);
  if (BS.status) rows = rows.filter(n => steps(n).some(o => o[0] === BS.status));
  return rows;
}
function playbookDetail(n) {
  if (!n) return '<p class="ws-note" style="padding:20px">Select an actor.</p>';
  const sy = SYS[n.s], tk = NODE_TK[n.id] || n.tk;
  const rel = isPerson(n) ? orgsOf(n.id).map(x => [x.org, REL[x.e.type][1].toLowerCase()]) : peopleOf(n.id).map(x => [x.p, REL[x.e.type][0].toLowerCase()]);
  return `<div class="pbx">
    <span class="eyebrow" style="color:${sy.tint}">${esc(sy.n)} · ${esc(sy.name)} · ${esc(isPerson(n) ? 'Person' : KIND[n.k] || n.k)}</span>
    <h2>${esc(n.n)}</h2>
    ${isPerson(n) && n.role ? `<p class="d-role">${esc(n.role)}</p>` : ''}
    <div class="links"><button type="button" class="btn" data-node="${n.id}">FULL RECORD</button><button type="button" class="btn" data-goscope="sys:${n.s}">OPEN ON MAP</button>${tk && MK[tk] ? `<button type="button" class="btn" data-open-tk="${esc(tk)}">MARKETS · ${esc(tk)}</button>` : ''}</div>
    <div class="pb-prog2">${progress(n)}<span class="pb-leg"><span class="st-d">${stepCount(n, 'd')} done</span><span class="st-m">${stepCount(n, 'm')} in motion</span><span class="st-p">${stepCount(n, 'p')} pending</span><span class="st-b">${stepCount(n, 'b')} blocked</span></span></div>
    ${n.dir ? `<div class="d-sec"><span class="eyebrow">Mission</span><div class="d-dir">${esc(n.dir)}</div></div>` : ''}
    ${n.strat ? `<div class="d-sec"><span class="eyebrow">Strategy</span><p class="d-strat">${esc(n.strat)}</p></div>` : ''}
    ${n.plan && n.plan.length ? `<div class="d-sec"><span class="eyebrow">Plan of action</span>${ledger(n.plan)}</div>` : ''}
    ${n.obj && n.obj.length ? `<div class="d-sec"><span class="eyebrow">Objectives</span>${ledger(n.obj)}</div>` : ''}
    ${rel.length ? `<div class="d-sec"><span class="eyebrow">${isPerson(n) ? 'Positions' : 'Key people'}</span><div class="pb-rel">${rel.map(([id, r]) => `${lk(id)}<span class="na">${esc(r)}</span>`).join('')}</div></div>` : ''}
    ${(NODE_THREADS[n.id] || []).length ? `<div class="d-sec"><span class="eyebrow">Threads</span><div class="pb-rel">${NODE_THREADS[n.id].map(t => { const T = THREADS.find(x => x.id === t); return `<button type="button" class="lk" data-thread="${t}">${t} · ${esc(T.name)}</button><span></span>`; }).join('')}</div></div>` : ''}
  </div>`;
}
function renderPlaybook() {
  const sheet = $('#sheet-playbook');
  const rows = playbookRows();
  const all = NODES.filter(n => steps(n).length || n.strat);
  const cnt = st => all.reduce((k, n) => k + stepCount(n, st), 0);
  if (!BS.sel || !rows.some(n => n.id === BS.sel)) {
    const TR = { M: 0, K: 1, N: 2 };
    const first = [...rows].sort((a, b) => (TR[a.t] ?? 2) - (TR[b.t] ?? 2) || steps(b).length - steps(a).length)[0];
    BS.sel = first ? first.id : null;
  }
  const TR = { M: 0, K: 1, N: 2 };
  keepPanes(sheet, () => {
    sheet.innerHTML = `<div class="ws">
      ${wsHead('Playbook', 'Playbook', 'Strategy, mission and plan of action for each actor, with the status of every step. Select an actor to read its plan.', [[all.length, 'actors'], [cnt('d'), 'done', 'var(--cyan)'], [cnt('m'), 'in motion', 'var(--amber)'], [cnt('p'), 'pending'], [cnt('b'), 'blocked', 'var(--red-soft)']])}
      <div class="ws-tools">
        <label class="sr" for="pb-q">Filter</label><input id="pb-q" type="search" placeholder="Filter actor, strategy, step" value="${esc(BS.q)}">
        <label class="sr" for="pb-type">Type</label><select id="pb-type"><option value="">Organizations + people</option><option value="org" ${BS.type === 'org' ? 'selected' : ''}>Organizations</option><option value="person" ${BS.type === 'person' ? 'selected' : ''}>People</option></select>
        <label class="sr" for="pb-sys">System</label><select id="pb-sys"><option value="">All systems</option>${C.systems.map(sy => `<option value="${sy.id}" ${BS.sys === sy.id ? 'selected' : ''}>${esc(sy.n)} ${esc(sy.name)}</option>`).join('')}</select>
        <label class="sr" for="pb-status">Status</label><select id="pb-status"><option value="">Any status</option>${[['m', 'Has steps in motion'], ['p', 'Has pending steps'], ['b', 'Has blocked steps'], ['d', 'Has completed steps']].map(o => `<option value="${o[0]}" ${BS.status === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>
        <span class="et-count">${rows.length} of ${all.length}</span>
      </div>
      <div class="ws-body ws-split">
        <div class="ws-pane" data-pane="pbl">${gridTable('pb', [
          ['name', 'Actor', 'nmc', n => nameCell(n, `${isPerson(n) ? 'Person' : KIND[n.k] || n.k} · ${SYS[n.s].name}`), strSort(n => n.n)],
          ['prog', 'Progress', 'prog', progress, numSort(n => stepCount(n, 'd') / (steps(n).length || 1))],
          ['next', 'Next step', 'wrap nx', n => stCell(nextStep(n)), numSort(n => (nextStep(n) ? { m: 0, p: 1 }[nextStep(n)[0]] : 2))]
        ], [...rows].sort((a, b) => (TR[a.t] ?? 2) - (TR[b.t] ?? 2) || steps(b).length - steps(a).length), { sort: 'none', dir: 1, empty: 'No actors match.', attr: n => `data-pb="${n.id}" tabindex="0" class="${BS.sel === n.id ? 'sel' : ''}"` })}</div>
        <div class="ws-pane ws-detail" data-pane="pbd">${playbookDetail(BY[BS.sel])}</div>
      </div>
    </div>`;
  });
}
$('#sheet-playbook').addEventListener('click', ev => {
  if (sheetClick(ev, renderPlaybook)) return;
  const r = ev.target.closest('tr[data-pb]');
  if (r) { BS.sel = r.dataset.pb; renderPlaybook(); const d = $('[data-pane="pbd"]'); if (d) { d.scrollTop = 0; if (MOBILE()) $('#sheet-playbook').scrollTop = d.offsetTop - 8; } }
});
$('#sheet-playbook').addEventListener('keydown', ev => {
  const r = ev.target.closest('tr[data-pb]');
  if (!r) return;
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); const n = ev.key === 'ArrowDown' ? r.nextElementSibling : r.previousElementSibling; if (n && n.dataset.pb) { BS.sel = n.dataset.pb; renderPlaybook(); const f = $(`tr[data-pb="${n.dataset.pb}"]`); f.focus(); f.scrollIntoView({ block: 'nearest' }); } }
});
$('#sheet-playbook').addEventListener('input', ev => { if (ev.target.id === 'pb-q') { BS.q = ev.target.value; const p = ev.target.selectionStart; renderPlaybook(); const i = $('#pb-q'); i.focus(); i.setSelectionRange(p, p); } });
$('#sheet-playbook').addEventListener('change', ev => { const k = { 'pb-type': 'type', 'pb-sys': 'sys', 'pb-status': 'status' }[ev.target.id]; if (k) { BS[k] = ev.target.value; renderPlaybook(); } });

/* ---------------- brief: tabs, each one screen ---------------- */
const BRS = { tab: 'summary', claim: null, sq: '' };
function claimCls(s) { return /CONTRA/i.test(s) ? 'cl-x' : /PARTLY/i.test(s) ? 'cl-p' : 'cl-u'; }
function claimDetail(c) {
  if (!c) return '';
  return `<div class="pbx">
    <span class="cl-st ${claimCls(c.status)}">${esc(c.status)}</span>
    <h2 style="font-size:24px">${esc(c.claim)}</h2>
    ${c.origin ? `<div class="d-sec"><span class="eyebrow">Origin</span><p class="d-strat">${esc(c.origin)}</p></div>` : ''}
    ${c.kernel ? `<div class="d-sec"><span class="eyebrow">Documented basis</span><p class="d-strat">${esc(c.kernel)}</p></div>` : ''}
    <div class="d-sec"><span class="eyebrow">What the record shows</span><p class="d-strat">${esc(c.evidence || '')}</p></div>
    <div class="cl-two"><div class="d-sec"><span class="eyebrow">Would confirm</span><p class="d-strat">${esc(c.confirm || '')}</p></div><div class="d-sec"><span class="eyebrow">Would refute</span><p class="d-strat">${esc(c.refute || '')}</p></div></div>
    ${(c.nodes || []).filter(x => BY[x]).length ? `<div class="d-sec"><span class="eyebrow">Entities named</span><div class="pb-rel">${c.nodes.filter(x => BY[x]).map(x => lk(x) + '<span></span>').join('')}</div></div>` : ''}
    ${(c.src || []).length ? `<div class="d-sec"><span class="eyebrow">Sources</span><div class="src-list">${c.src.map(s => `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>`).join('')}</div></div>` : ''}
  </div>`;
}
function openClaim(cid) { BRS.tab = 'claims'; BRS.claim = cid; setView('brief'); }
function renderBrief() {
  const B = C.brief, sheet = $('#sheet-brief');
  const DIR = { up: ['▲ GAINS', 'dir-up'], down: ['▼ LOSES', 'dir-down'], mixed: ['◆ MIXED', 'dir-mixed'], counter: ['✕ COUNTER', 'dir-counter'] };
  const L = C.claims || [];
  const tabs = [['summary', 'Summary'], ['strategies', 'Strategies'], ['stack', 'Stack + control'], ['shifts', 'Leverage + shifts'], ['patterns', 'Patterns', (B.patterns || []).length], ['indicators', 'Indicators', B.signals.length], ['claims', 'Claims ledger', L.length]];
  let body = '';
  if (BRS.tab === 'summary') {
    body = `<div class="ws-body ws-split even">
      <div class="ws-pane" data-pane="bf"><h3 class="ws-h3">Findings</h3><ol class="fnd">${B.core.map(c => `<li><b>${esc(c[0])}</b><span>${esc(c[1])}</span></li>`).join('')}</ol><p class="disclaimer" style="margin-top:18px">${esc(C.meta.disclaimer)}</p></div>
      <div class="ws-pane" data-pane="bm"><h3 class="ws-h3">How the map is organized</h3>
        <p class="ws-note" style="margin:0 0 12px">Five columns, 24 systems. Each system opens as a table on the map; each entity opens a full record.</p>
        ${COLS.map((c, ci) => `<div class="mapcol"><button type="button" class="mapcol-h" data-goscope="col:${ci}"><span class="n">${c.n}</span>${esc(c.name)}<span class="c">${NODES.filter(n => colOfNode(n.id) === ci).length}</span></button>
          <div class="mapcol-s">${c.sys.map(sid => `<button type="button" class="lk" data-goscope="sys:${sid}"><span class="sw2" style="background:${SYS[sid].tint}"></span>${esc(SYS[sid].name)}<span class="na"> ${NODES.filter(n => n.s === sid).length}</span></button>`).join('')}</div></div>`).join('')}
        <div class="links" style="margin-top:14px"><button type="button" class="btn" data-view-go="threads">THREADS</button><button type="button" class="btn" data-view-go="players">PLAYERS</button><button type="button" class="btn" data-view-go="playbook">PLAYBOOK</button><button type="button" class="btn" data-view-go="markets">MARKETS</button></div>
      </div></div>`;
  } else if (BRS.tab === 'strategies') {
    const ql = BRS.sq.trim().toLowerCase();
    let rows = NODES.filter(n => (n.t === 'M' || n.t === 'K' || isPerson(n)) && (n.strat || n.dir));
    if (ql) rows = rows.filter(n => (n.n + ' ' + (n.dir || '') + ' ' + (n.strat || '')).toLowerCase().includes(ql));
    body = `<div class="ws-tools"><label class="sr" for="br-q">Filter</label><input id="br-q" type="search" placeholder="Filter actor or strategy" value="${esc(BRS.sq)}"><span class="et-count">${rows.length}</span><button type="button" class="btn" data-view-go="playbook" style="margin-left:auto">FULL PLAYBOOK</button></div>
      <div class="ws-body ws-col"><div class="ws-pane" data-pane="bs">${gridTable('bs', [
        ['name', 'Actor', 'nmc', n => nameCell(n, isPerson(n) ? n.role : SYS[n.s].name), strSort(n => n.n)],
        ['dir', 'Strategy', 'wrap', n => esc(n.dir || shortSum(n.strat)), strSort(n => n.dir || n.strat)],
        ['next', 'Next step', 'wrap nx', n => stCell(nextStep(n)), numSort(n => (nextStep(n) ? { m: 0, p: 1 }[nextStep(n)[0]] : 2))],
        ['deg', 'Links', 'num', n => DEG[n.id], numSort(n => DEG[n.id])]
      ], rows, { sort: 'deg', dir: -1, attr: n => `data-row="${n.id}" tabindex="0" class="${S.sel === n.id ? 'sel' : ''}"` })}</div></div>`;
  } else if (BRS.tab === 'stack') {
    const layers = [...C.layers].reverse();
    body = `<div class="ws-body ws-split wide-left">
      <div class="ws-pane" data-pane="bl"><h3 class="ws-h3">Stack layers</h3>${gridTable('bl', [
        ['code', 'Layer', 'mono', l => `<span style="color:var(--amber)">${esc(l.code)}</span>`],
        ['name', 'Function', 'wrap', l => `<b class="t1">${esc(l.name)}</b><br><span class="na">${esc(l.d)}</span>`],
        ['ents', 'Leading entities', 'wrap', l => { const ns = NODES.filter(n => (n.L || []).includes(l.id)).sort(rankSort); return ns.slice(0, 5).map(n => lk(n.id)).join('<span class="dot">·</span>') + (ns.length > 5 ? ` <button type="button" class="lk more" data-golayer="${l.code}">+${ns.length - 5} on map</button>` : ''); }],
        ['k', 'Count', 'num', l => NODES.filter(n => (n.L || []).includes(l.id)).length]
      ], layers, { sort: 'code' })}</div>
      <div class="ws-pane" data-pane="bh"><h3 class="ws-h3">Control by layer</h3>${gridTable('bh', [['a', 'Layer', 'dim wrap', h => esc(h[0])], ['b', 'Held by', 'wrap', h => esc(h[1])]], B.hold, { noHead: true })}
        <p class="ws-note" style="margin:10px 0 22px">A buyer can own the layers it operates and still depend on the layers it does not.</p>
        <h3 class="ws-h3">Operating loops</h3><ol class="fnd small">${B.loops.map(l => `<li><b>${esc(l[0])}</b><span>${esc(l[1])}</span></li>`).join('')}</ol></div>
    </div>`;
  } else if (BRS.tab === 'shifts') {
    body = `<div class="ws-body ws-split even">
      <div class="ws-pane" data-pane="blv"><h3 class="ws-h3">Leverage shifts</h3><p class="ws-note" style="margin:0 0 10px">Leverage is moving from cloud providers toward power, equipment and silicon below, and the operating layer above.</p>${gridTable('blv', [
        ['a', 'Actor', 'wrap t1', l => esc(l[0]), strSort(l => l[0])],
        ['d', 'Direction', 'mono', l => `<span class="${DIR[l[1]][1]}" style="font-size:11px;white-space:nowrap">${DIR[l[1]][0]}</span>`, strSort(l => l[1])],
        ['m', 'Mechanism', 'wrap dim', l => esc(l[2])]
      ], B.leverage, { sort: 'd' })}</div>
      <div class="ws-pane" data-pane="bpv"><h3 class="ws-h3">Structural shifts</h3>${gridTable('bpv', [['s', 'System', 'wrap t1', p => esc(p[0])], ['f', 'From', 'wrap dim', p => esc(p[1])], ['t', 'To', 'wrap', p => esc(p[2])]], B.pivot)}
        <h3 class="ws-h3" style="margin-top:22px">Considerations</h3><ul class="plain">${B.weigh.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>
    </div>`;
  } else if (BRS.tab === 'patterns') {
    const P = B.patterns || [];
    body = `<div class="ws-body ws-col"><div class="ws-pane" data-pane="bpt"><ol class="fnd cols">${P.map(p => `<li><span>${esc(p)}</span></li>`).join('')}</ol></div></div>`;
  } else if (BRS.tab === 'indicators') {
    body = `<div class="ws-body ws-col"><div class="ws-pane" data-pane="bi">${gridTable('bi', [['i', 'Indicator', 'wrap t1', s => esc(s[0]), strSort(s => s[0])], ['w', 'What it shows', 'wrap dim', s => esc(s[1])], ['c', 'Cadence', 'mono dim', s => esc(s[2]), strSort(s => s[2])]], B.signals)}</div></div>`;
  } else {
    if (!BRS.claim || !L.some(c => c.id === BRS.claim)) BRS.claim = L[0] ? L[0].id : null;
    body = `<div class="ws-tools"><span class="ws-note">Widely shared claims about IoB, IoBNT, implants and tracking, tested against primary records. Claims are not entered on the map.</span><span class="et-count"><span class="cl-x">${L.filter(c => claimCls(c.status) === 'cl-x').length} contradicted</span> · <span class="cl-p">${L.filter(c => claimCls(c.status) === 'cl-p').length} partly grounded</span> · <span class="cl-u">${L.filter(c => claimCls(c.status) === 'cl-u').length} unverified</span></span></div>
      <div class="ws-body ws-split">
        <div class="ws-pane" data-pane="bcl">${gridTable('bcl', [['st', 'Status', '', c => `<span class="cl-st ${claimCls(c.status)}">${esc(c.status)}</span>`, strSort(c => c.status)], ['c', 'Claim', 'wrap t1', c => esc(c.claim), strSort(c => c.claim)]], L, { attr: c => `data-claim="${c.id}" tabindex="0" class="${BRS.claim === c.id ? 'sel' : ''}"` })}</div>
        <div class="ws-pane ws-detail" data-pane="bcd">${claimDetail(L.find(c => c.id === BRS.claim))}</div>
      </div>`;
  }
  keepPanes(sheet, () => {
    sheet.innerHTML = `<div class="ws">
      ${wsHead('Brief', 'Sovereign SI', 'Findings, structure, control points, leverage, indicators and the claims ledger, from the EDGE: SOVEREIGN SI research pages.', [[NODES.length, 'entities'], [EDGES.length, 'relationships'], [THREADS.length, 'threads'], [Object.keys(MK).length, 'tickers']])}
      ${wsTabs(BRS.tab, tabs, 'data-brtab')}
      ${body}
    </div>`;
  });
}
$('#sheet-brief').addEventListener('click', ev => {
  const t = ev.target.closest('[data-brtab]');
  if (t) { BRS.tab = t.dataset.brtab; renderBrief(); return; }
  const cl = ev.target.closest('tr[data-claim]');
  if (cl && !ev.target.closest('[data-node]')) { BRS.claim = cl.dataset.claim; renderBrief(); const d = $('[data-pane="bcd"]'); if (d) { d.scrollTop = 0; if (MOBILE()) $('#sheet-brief').scrollTop = d.offsetTop - 8; } return; }
  if (sheetClick(ev, renderBrief)) return;
  const r = ev.target.closest('tr[data-row]');
  if (r) { openEntity(r.dataset.row); renderBrief(); }
});
$('#sheet-brief').addEventListener('input', ev => { if (ev.target.id === 'br-q') { BRS.sq = ev.target.value; const p = ev.target.selectionStart; renderBrief(); const i = $('#br-q'); i.focus(); i.setSelectionRange(p, p); } });

/* ---------------- search: lists matches in the table ---------------- */
const qIn = $('#q');
function goMatch(x) {
  if (!x) return;
  if (x.kind === 'node') { qIn.blur(); openOnMap(x.id, 'board'); }
  else if (x.kind === 'ticker') { S.q = ''; qIn.value = ''; qIn.blur(); openTicker(x.tk); }
  else if (x.kind === 'thread') { S.q = ''; qIn.value = ''; qIn.blur(); openThread(x.id); }
}
let qT = null;
qIn.addEventListener('input', () => {
  clearTimeout(qT);
  qT = setTimeout(() => {
    S.q = qIn.value;
    if (S.view !== 'map') setView('map');
    if (S.q.trim()) S.mv = 'board';
    showMain(); renderBar();
  }, 120);
});
qIn.addEventListener('keydown', ev => {
  if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(qT); S.q = qIn.value; goMatch(searchMatches(S.q)[0]); }
  else if (ev.key === 'Escape') { S.q = ''; qIn.value = ''; qIn.blur(); showMain(); renderBar(); }
});
document.addEventListener('keydown', ev => {
  const tag = document.activeElement.tagName;
  if (ev.key === '/' && tag !== 'INPUT' && tag !== 'SELECT') { ev.preventDefault(); qIn.focus(); }
  if (ev.key === 'Escape' && tag !== 'INPUT' && tag !== 'SELECT') {
    if (S.view !== 'map') { if (S.sel) select(null); else setView('map'); }
    else if (S.sel && S.mv === 'subject') { S.mv = 'board'; showMain(); renderBar(); writeHash(); }
    else if (S.sel) select(null);
    else if (S.thread || S.layer || S.q) { S.thread = null; S.layer = null; S.q = ''; qIn.value = ''; renderRail(); showMain(); renderBar(); writeHash(); }
    else if (S.scope) setScope(null);
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
    if (S.thread) p.set('show', S.thread);
    if (S.layer) p.set('layer', S.layer);
    if (S.scope) p.set('scope', S.scope);
    if (S.sel && S.mv === 'subject') p.set('mv', 'conn');
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
  { const sc = p.get('scope') || ''; S.scope = /^(sys:|col:|all)/.test(sc) ? sc : null; }
  renderRail();
  if (p.get('node') && BY[p.get('node')]) { select(p.get('node'), 'reset'); if (p.get('mv') === 'conn') { S.mv = 'subject'; } }
  const v = p.get('view');
  if (v === 'markets' && p.get('tk')) { hashLock = false; openTicker(p.get('tk')); return; }
  if (p.get('board') === 'ppl') S.board = 'ppl';
  if (v && SHEETS.includes(v)) setView(v);
  hashLock = false;
  if (S.view === 'map') showMain();
  renderBar();
}

/* ---------------- boot ---------------- */
renderRail();
showMain();
renderBar();
applyBoard();
readHash();
let wasMobile = MOBILE();
addEventListener('resize', () => { if (MOBILE() !== wasMobile) { wasMobile = MOBILE(); renderBar(); } });
addEventListener('hashchange', readHash);
function goHome() {
  S.q = ''; qIn.value = ''; S.thread = null; S.layer = null; S.scope = null; S.tq = ''; S.kind = ''; S.mv = 'board';
  if (S.sel) select(null);
  setView('map'); renderRail(); showMain(); renderBar();
  history.replaceState(null, '', location.pathname + location.search);
}
$('#home').addEventListener('click', ev => { ev.preventDefault(); goHome(); });
window.__casemap = { S, select, setView, openTicker, openThread };

/* dossier thread rows: hovering one isolates it on the subject board or the board */
function dossierHover(ei) {
  if (ei === S.edgeHover) return;
  S.edgeHover = ei;
  if (S.mv === 'subject') hlSubject(ei);
}
$('#dossier').addEventListener('mouseover', ev => { const r = ev.target.closest('.edge-row'); dossierHover(r ? +r.dataset.ei : null); });
$('#dossier').addEventListener('mouseleave', () => dossierHover(null));
$('#dossier').addEventListener('focusin', ev => { const r = ev.target.closest('.edge-row'); dossierHover(r ? +r.dataset.ei : null); });
