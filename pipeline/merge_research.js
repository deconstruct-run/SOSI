/* Merge research extraction files into data/case.js.
   usage: node pipeline/merge_research.js <extract-dir> [--dry]
   Each extraction file follows the schema in the extraction brief (nodes_new, nodes_update, edges, threads, ...). */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CASE_PATH = path.join(ROOT, 'data', 'case.js');
const dir = process.argv[2];
const DRY = process.argv.includes('--dry');
global.window = {};
require(CASE_PATH);
const C = window.CASE;

/* file order sets precedence for scalar fields (first wins) */
const ORDER = ['deepdive.json', 'financial.json', 'goldendome_main.json', 'strato_latam.json', 'silicon_horizon.json'];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'existing.json')
  .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));

/* id reconciliation */
const ALIAS = { 'trump-donald': 'trump', cnsa2: 'cnsa', 'thiel-peter': 'thiel', 'karp-alex': 'karp', 'brock-eric': 'brock', 'musk-elon': 'musk', 'lutnick-howard': 'lutnick', 'huang-jensen': 'huang', 'luckey-palmer': 'luckey', intc: 'intel', wolf: 'wolfspeed', volt: 'volttyphoon' };
const FILE_RENAME = { 'goldendome_main.json': { sbi: 'sbis' } };
const OVERRIDE = {
  sentinel: { s: 'autonomy' }, tether: { s: 'rails', k: 'co' }, cantor: { s: 'rails', k: 'co' }, narya: { k: 'fund' },
  boardofpeace: { k: 'buyer' }, rege: { s: 'agentic' }, lutnick: { s: 'state' }, thiel: { s: 'capital', n: 'Peter Thiel' }
};
const NEW_SYSTEMS = {
  rails: { n: '13', name: 'Money rails + custody', tint: '#D4B062' },
  agentic: { n: '14', name: 'Agentic + identity', tint: '#8FA8FF' },
  silicon: { n: '15', name: 'Silicon + fabs', tint: '#7FD1C1' },
  stratosphere: { n: '16', name: 'Stratosphere + HAPS', tint: '#9AD0F5' },
  latam: { n: '17', name: 'South America theater', tint: '#E8A06A' },
  insurance: { n: '18', name: 'War-risk insurance', tint: '#B9A27A' },
  minerals: { n: '19', name: 'Critical minerals + nuclear fuel', tint: '#C98B5E' },
  cyber: { n: '20', name: 'Cyber pre-positioning + defense', tint: '#E07A7A' }
};
const ROLE_OVERRIDE = {
  'wright-dan': 'Co-founder and CEO, Armada', pradeep: 'Founding CTO, Armada',
  lutnick: 'U.S. Secretary of Commerce; former Chairman and CEO, Cantor Fitzgerald and CF Acquisition Corp. V',
  karp: 'Co-founder and CEO, Palantir; author of an April 2026 manifesto',
  hegseth: 'Secretary of War, Department of War; issued the Jan 9, 2026 AI-first memos',
  bessent: 'U.S. Secretary of the Treasury', huang: 'Founder and CEO, NVIDIA',
  musk: 'CEO, SpaceX and Tesla; founder, xAI; behind TeraFab, the chip plant for SpaceX and Tesla compute',
  thiel: 'Co-founder, Palantir; partner, Founders Fund; Erebor backer through Founders Fund',
  vance: 'Vice President of the United States; linked on file to Narya Capital',
  xi: 'President of the People\'s Republic of China', chow: 'IBM Quantum',
  tahnoon: 'UAE national security adviser; chairman of G42, MGX and IHC'
};
const NAME_OVERRIDE = { tahnoon: 'Sheikh Tahnoon bin Zayed', larkin: 'Larkin (G42)' };
const cleanRole = r => (r || '').replace(/\s*\[([^\]]*?);\s*title not stated on this page\]/g, ' ($1)').replace(/\s*\[title not stated on this page\]/g, '').replace(/\s*\(as stated on page\)/g, '').replace(/\s+/g, ' ').trim();
const NEW_EDGE_TYPES = {
  leads: { name: 'Leads · executive', color: '#E9C46A', dash: false, lenses: ['apparatus', 'financial'] },
  board: { name: 'Board seat', color: '#C9A86A', dash: [0.8, 0.8], lenses: ['apparatus', 'financial'] },
  founded: { name: 'Founded', color: '#EAD9A6', dash: false, lenses: ['apparatus', 'technological'] },
  invests: { name: 'Personal stake', color: '#46C2EA', dash: [0.8, 0.8], lenses: ['financial', 'apparatus'] },
  advises: { name: 'Advises', color: '#A89F86', dash: [0.3, 1], lenses: ['apparatus', 'political'] },
  post: { name: 'Government post', color: '#8FBF8F', dash: false, lenses: ['political', 'apparatus'] },
  tie: { name: 'Personal tie', color: '#E58FB0', dash: [0.3, 1], lenses: ['political', 'apparatus'] }
};

const log = { files, added: 0, updated: 0, edges: 0, skippedEdges: [], threads: 0, notes: [] };
const BY = Object.fromEntries(C.nodes.map(n => [n.id, n]));
const uniq = (arr, key = x => JSON.stringify(x)) => { const seen = new Set(); return arr.filter(x => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); };
const mergeList = (a = [], b = [], key) => uniq([...(a || []), ...(b || [])], key);
const srcKey = s => (Array.isArray(s) ? s[1] || s[0] : JSON.stringify(s));
const planKey = p => (p[1] || '').toLowerCase().slice(0, 80);
const longer = (a, b) => (!a ? b : !b ? a : (b.length > a.length && !b.includes(a) && !a.includes(b) ? a + ' ' + b : (b.length > a.length ? b : a)));

/* systems + edge types */
Object.entries(NEW_SYSTEMS).forEach(([id, sy]) => { if (!C.systems.some(s => s.id === id)) C.systems.push({ id, n: sy.n, name: sy.name, box: [0, 0, 0, 0], tint: sy.tint }); });
Object.entries(NEW_EDGE_TYPES).forEach(([k, T]) => { if (!C.edgeTypes[k]) C.edgeTypes[k] = T; });
const SYS_IDS = new Set(C.systems.map(s => s.id));

function rid(id, file) {
  if (!id) return id;
  const r = (FILE_RENAME[file] || {})[id] || id;
  return ALIAS[r] || r;
}

let threadNo = Math.max(...C.threads.map(t => +t.id)) + 1;
const pendingEdges = [];

for (const file of files) {
  const D = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  /* nodes */
  for (const raw of D.nodes_new || []) {
    const id = rid(raw.id, file);
    const ov = OVERRIDE[id] || {};
    const cur = BY[id];
    const inc = { ...raw, ...ov, id };
    if (!SYS_IDS.has(inc.s)) { log.notes.push(`${id}: unknown system ${inc.s} -> capital`); inc.s = 'capital'; }
    if (!cur) {
      const n = { id, n: inc.n, s: inc.s, t: inc.t || 'N', k: inc.k || 'co', L: inc.L || [], p: [0, 0], sum: inc.sum || '', dir: inc.dir || '' };
      ['tk', 'ex', 'pv', 'role', 'strat'].forEach(k => { if (inc[k]) n[k] = inc[k]; });
      if (inc.plan && inc.plan.length) n.plan = inc.plan;
      n.obj = []; n.f = inc.f || []; n.src = inc.src || [];
      if (inc.analysis) n.analysis = true;
      if (n.k === 'person') delete n.tk;
      C.nodes.push(n); BY[id] = n; log.added++;
    } else {
      /* same entity reached from another page: fill gaps, merge lists */
      ['tk', 'ex', 'pv', 'role', 'dir', 'sum'].forEach(k => { if (!cur[k] && inc[k]) cur[k] = inc[k]; });
      if (inc.role && cur.role && !cur.role.includes(inc.role) && inc.role.length > cur.role.length) cur.role = inc.role;
      cur.strat = longer(cur.strat, inc.strat);
      if (inc.plan) cur.plan = mergeList(cur.plan, inc.plan, planKey);
      cur.f = mergeList(cur.f, inc.f);
      cur.src = mergeList(cur.src, inc.src, srcKey);
      if (inc.t && (inc.t === 'M' || (inc.t === 'K' && cur.t === 'N'))) cur.t = inc.t;
      if (inc.analysis === false && cur.analysis) delete cur.analysis;
      log.updated++;
    }
  }
  for (const up of D.nodes_update || []) {
    const id = rid(up.id, file);
    const cur = BY[id];
    if (!cur) { log.notes.push(`update for unknown node ${id} (${file})`); continue; }
    cur.strat = longer(cur.strat, up.strat);
    if (up.plan) cur.plan = mergeList(cur.plan, up.plan, planKey);
    if (up.f) cur.f = mergeList(cur.f, up.f);
    if (up.src) cur.src = mergeList(cur.src, up.src, srcKey);
    ['dir', 'role', 'pv', 'tk', 'sum'].forEach(k => { if (!cur[k] && up[k]) cur[k] = up[k]; });
    log.updated++;
  }
  for (const e of D.edges || []) if (!/\(sector-level\)/.test(e[3] || '')) pendingEdges.push([rid(e[0], file), rid(e[1], file), e[2], e[3] || '', e[4] || '', e[5] === 0 ? 0 : 1, file]);
  /* threads */
  for (const t of D.threads || []) {
    const nodes = uniq((t.nodes || []).map(x => rid(x, file)));
    C.threads.push({ id: String(threadNo++).padStart(2, '0'), name: t.name.replace(/^\d+\s+/, ''), lenses: t.lenses || ['apparatus'], lede: t.lede || '', nodes, events: t.events || [], shows: t.shows || '', gains: t.gains || [], exposed: t.exposed || [], questions: t.questions || [] });
    log.threads++;
  }
  (D.timeline || []).forEach(x => C.timeline.push(x));
  /* markets */
  Object.entries(D.markets || {}).forEach(([tk, r]) => {
    const cur = C.markets.research[tk] || {};
    const merged = { ...cur };
    Object.entries(r).forEach(([k, v]) => { if (v && (!merged[k] || (Array.isArray(v) && !merged[k].length))) merged[k] = v; });
    C.markets.research[tk] = merged;
  });
  (D.privates || []).forEach(p => { p.node = rid(p.node, file); if (!C.markets.privates.some(x => x.node === p.node)) C.markets.privates.push(p); });
  const ba = D.brief_adds || {};
  C.brief.patterns = mergeList(C.brief.patterns, ba.patterns);
  C.brief.leverage = mergeList(C.brief.leverage, ba.leverage, x => x[0]);
  C.brief.signals = mergeList(C.brief.signals, ba.signals, x => x[0]);
  (D.sources || []).forEach(([g, list]) => {
    const cur = C.sources.find(x => x[0] === g);
    if (cur) cur[1] = mergeList(cur[1], list, srcKey); else C.sources.push([g, list]);
  });
}

/* edges */
const ekey = e => `${e[0]}|${e[1]}|${e[2]}|${(e[3] || '').toLowerCase().slice(0, 40)}`;
const seen = new Set(C.edges.map(ekey));
for (const e of pendingEdges) {
  const [a, b, type] = e;
  if (!BY[a] || !BY[b]) { log.skippedEdges.push(`${a} -> ${b} (${type}) [${e[6]}]`); continue; }
  if (a === b) continue;
  if (!C.edgeTypes[type]) { log.skippedEdges.push(`unknown type ${type}: ${a} -> ${b}`); continue; }
  const row = e.slice(0, 6);
  if (seen.has(ekey(row))) continue;
  seen.add(ekey(row)); C.edges.push(row); log.edges++;
}
/* people: clean role strings */
C.nodes.forEach(n => { if (n.k === 'person') { if (ROLE_OVERRIDE[n.id]) n.role = ROLE_OVERRIDE[n.id]; if (NAME_OVERRIDE[n.id]) n.n = NAME_OVERRIDE[n.id]; n.role = cleanRole(n.role); } });
/* threads: drop unknown node ids */
C.threads.forEach(t => { const bad = t.nodes.filter(x => !BY[x]); if (bad.length) log.notes.push(`thread ${t.id} unknown nodes ${bad.join(',')}`); t.nodes = t.nodes.filter(x => BY[x]); });
C.timeline = uniq(C.timeline, x => x[0] + (x[1] || '').slice(0, 30)).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
C.meta.pages = ['EDGE: SOVEREIGN SI', 'DEEP DIVE', 'FINANCIAL LAYER', 'TETHER LAYER', 'AGENTIC LAYER', 'STRATOSPHERIC LAYER', 'EDGE: SOUTH AMERICA', 'SILICON LAYER', 'HORIZON', 'GOLDEN DOME'];

console.log(JSON.stringify({ files: log.files, added: log.added, updated: log.updated, edges: log.edges, threads: log.threads, skipped: log.skippedEdges.length, totals: { nodes: C.nodes.length, people: C.nodes.filter(n => n.k === 'person').length, edges: C.edges.length, threads: C.threads.length, systems: C.systems.length } }, null, 1));
if (log.skippedEdges.length) console.log('SKIPPED EDGES:\n  ' + log.skippedEdges.join('\n  '));
if (log.notes.length) console.log('NOTES:\n  ' + log.notes.join('\n  '));
if (!DRY) {
  const out = '/* SOVEREIGN SI // CASE MAP — case data. Generated by merging research extractions into the hand-built case.\n   Edit freely; rerun pipeline/merge_research.js only on a fresh extraction set. */\nwindow.CASE = ' + JSON.stringify(C, null, 1) + ';\n';
  fs.writeFileSync(CASE_PATH, out);
  console.log('wrote', CASE_PATH, (out.length / 1024).toFixed(0) + 'KB');
}
