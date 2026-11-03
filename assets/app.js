/* SOVEREIGN SI // CASE MAP — application */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

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
const KIND = { co: 'Company', buyer: 'Sovereign buyer', prog: 'Program', cap: 'Capital', press: 'Oversight', threat: 'Threat', counter: 'Counter-bloc', model: 'Model', app: 'Mission app', channel: 'Channel', site: 'Site', sys: 'System constraint' };

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
const LH = 7.2;
const yOf = lv => (lv - 4.5) * LH;
function level(n) {
  if (PL[n.id] != null) return PL[n.id];
  if (n.L && n.L.length) return n.L[0];
  if (n.k === 'threat' || n.k === 'counter') return -1.9;
  return 10.9;
}
const LAYER_TINT = ['#F0A63A', '#46C2EA', '#46C2EA', '#A996FF', '#A996FF', '#C9D2DE', '#E7EBF1', '#A996FF', '#46C2EA', '#F0A63A'];
const SHAFT = { palantir: '#E7EBF1', anduril: '#C9D2DE', nvda: '#46C2EA', spacex: '#A996FF', ondas: '#6FD6B5', armada: '#F0A63A', aws: '#C9D2DE', google: '#C9D2DE', oracle: '#C9D2DE', rklb: '#A996FF', shieldai: '#6FD6B5', helsing: '#C9D2DE', applied: '#6FD6B5' };

/* ---------------- state ---------------- */
const S = { view: 'map', mode: 'world', t: 0, lens: 'all', sys: null, off: new Set(), sel: null, hover: null, thread: null, cutoff: null, labelsAll: false, open: new Set(), activeThread: '07', edgeHover: null };
let threadSet = null;
let positionsDirty = true;

/* ---------------- renderer ---------------- */
const stage = $('#stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  $('#gl').innerHTML = '<p style="padding:120px 24px;text-align:center;color:#95A0B2;font-family:var(--mono)">WebGL is unavailable in this browser. The Threads, Markets, Brief and Sources views still work.</p>';
}
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070B, 0.0028);
const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 3000);
const css = new CSS2DRenderer();
css.domElement.style.position = 'absolute';
css.domElement.style.inset = '0';
css.domElement.style.pointerEvents = 'none';
$('#labels').appendChild(css.domElement);
const MOBILE = () => innerWidth <= 820;
const HOME = {
  world: { pos: new THREE.Vector3(0, 122, 104), tgt: new THREE.Vector3(0, 0, 3) },
  depth: { pos: new THREE.Vector3(-192, 96, 175), tgt: new THREE.Vector3(-16, -2, -15) }
};
const HOME_M = {
  world: { pos: new THREE.Vector3(70, 290, 4), tgt: new THREE.Vector3(0, 0, 0) },
  depth: { pos: new THREE.Vector3(-250, 140, 230), tgt: new THREE.Vector3(-16, -2, -15) }
};
function homeFor(mode) {
  const h = MOBILE() ? HOME_M[mode] : HOME[mode];
  return { pos: h.pos.clone(), tgt: h.tgt.clone() };
}
let controls = null;
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x05070B, 1);
  $('#gl').appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 16;
  controls.maxDistance = 360;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.screenSpacePanning = true;
  controls.zoomSpeed = 0.9;
  const h = homeFor('world');
  camera.position.copy(h.pos);
  controls.target.copy(h.tgt);
}

/* floor grid */
const grid = new THREE.GridHelper(180, 36, 0x1b2432, 0x0f151e);
grid.material.transparent = true;
grid.material.opacity = 0.6;
grid.material.depthWrite = false;
grid.position.y = -0.3;
scene.add(grid);

/* zones */
function rrect(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}
const zones = C.systems.map(sy => {
  const [x, y, w, h] = sy.box;
  const g = new THREE.Group();
  const shape = rrect(w - 1.2, h - 1.2, 2.2);
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: sy.tint, transparent: true, opacity: 0.035, depthWrite: false, side: THREE.DoubleSide }));
  fill.rotation.x = -Math.PI / 2;
  const pts = shape.getPoints(10).map(p => new THREE.Vector3(p.x, 0, -p.y));
  const border = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: sy.tint, transparent: true, opacity: 0.24, depthWrite: false }));
  g.add(fill, border);
  g.position.set(x + w / 2 - 70, 0, y + h / 2 - 45);
  const el = document.createElement('div');
  el.className = 'zlabel';
  el.innerHTML = `<b>${esc(sy.n)}</b> // ${esc(sy.name)}`;
  const obj = new CSS2DObject(el);
  obj.center.set(0, 0);
  obj.position.set(-(w - 1.2) / 2, 0.05, -(h - 1.2) / 2);
  g.add(obj);
  scene.add(g);
  return { sy, g, fill, border, el };
});

/* layer planes */
const layerDefs = [
  ...C.layers.map(l => ({ lv: l.id, code: l.code, name: l.name, d: l.d, tint: LAYER_TINT[l.id] })),
  { lv: 10.9, code: 'S', name: C.bands.S.name, d: C.bands.S.d, tint: '#F0A63A' },
  { lv: -1.9, code: 'X', name: C.bands.X.name, d: C.bands.X.d, tint: '#FF5B4F' }
];
const planes = layerDefs.map(L => {
  const geo = new THREE.PlaneGeometry(146, 96);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: L.tint, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = yOf(L.lv);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: L.tint, transparent: true, opacity: 0, depthWrite: false }));
  edges.rotation.x = -Math.PI / 2;
  edges.position.y = yOf(L.lv);
  m.visible = edges.visible = false;
  scene.add(m, edges);
  const el = document.createElement('div');
  el.className = 'llabel';
  el.innerHTML = `<b>${esc(L.code)}</b>${esc(L.name)}<span>${esc(L.d)}</span>`;
  el.style.opacity = 0;
  const obj = new CSS2DObject(el);
  obj.center.set(1, 0.5);
  obj.position.set(-73, yOf(L.lv), -48);
  obj.visible = false;
  scene.add(obj);
  const base = L.lv === 6 ? 0.085 : (L.code === 'S' || L.code === 'X') ? 0.03 : 0.045;
  const ebase = L.lv === 6 ? 0.6 : 0.3;
  return { L, m, edges, el, obj, base, ebase };
});

/* nodes */
const tooltip = $('#tip');
NODES.forEach(n => {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `node t-${n.t} k-${n.k}`;
  el.dataset.id = n.id;
  const tk = NODE_TK[n.id] || n.tk;
  const layers = n.L && n.L.length ? n.L.map(l => 'L' + l).join(' ') : '';
  const sub = n.t === 'M' ? [tk, layers].filter(Boolean).join(' · ') : (tk || '');
  el.innerHTML = `<span class="glyph" aria-hidden="true"></span><span class="lbl">${esc(n.n)}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}`;
  el.setAttribute('aria-label', `${n.n}, ${TIER[n.t]}, ${SYS[n.s].name}`);
  el.addEventListener('click', ev => { ev.stopPropagation(); select(n.id, true); });
  el.addEventListener('mouseenter', ev => { S.hover = n.id; applyState(); showTip(n, ev); });
  el.addEventListener('mousemove', ev => moveTip(ev));
  el.addEventListener('mouseleave', () => { S.hover = null; applyState(); hideTip(); });
  el.addEventListener('focus', () => { S.hover = n.id; applyState(); });
  el.addEventListener('blur', () => { S.hover = null; applyState(); });
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 0);
  scene.add(obj);
  n._el = el; n._obj = obj;
  n._w = new THREE.Vector3(n.p[0] - 70, 0.6, n.p[1] - 45);
  n._d = new THREE.Vector3(n.p[0] - 70, yOf(level(n)), n.p[1] - 45);
  n._pos = n._w.clone();
  n._lbl = true; n._sub = true;
  obj.position.copy(n._pos);
});
if (!renderer) NODES.forEach(n => { n._el.style.display = 'none'; });

/* edges */
const SEG = 28;
const tmpV = new THREE.Vector3();
EDGES.forEach(e => {
  const geo = new LineGeometry();
  e.pts = new Float32Array((SEG + 1) * 3);
  geo.setPositions(e.pts);
  const dash = e.T.dash;
  e.mat = new LineMaterial({ color: new THREE.Color(e.T.color).getHex(), linewidth: 1.4, transparent: true, opacity: 0.4, depthWrite: false, dashed: !!dash, dashSize: dash ? dash[0] : 1, gapSize: dash ? dash[1] : 1, worldUnits: false });
  e.line = new Line2(geo, e.mat);
  e.line.renderOrder = 2;
  e.geo = geo;
  e.curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
  scene.add(e.line);
});
function updateEdge(e) {
  const A = BY[e.a]._pos, B = BY[e.b]._pos, c = e.curve;
  const d = A.distanceTo(B);
  c.v0.copy(A); c.v2.copy(B);
  c.v1.copy(A).add(B).multiplyScalar(0.5);
  c.v1.y += (1 - S.t) * (d * 0.2 + 1.2) + S.t * (d * 0.08 + 1.5);
  for (let i = 0; i <= SEG; i++) {
    c.getPoint(i / SEG, tmpV);
    e.pts[i * 3] = tmpV.x; e.pts[i * 3 + 1] = tmpV.y; e.pts[i * 3 + 2] = tmpV.z;
  }
  e.geo.setPositions(e.pts);
  if (e.mat.dashed) e.line.computeLineDistances();
  if (e.lblObj) e.lblObj.position.copy(c.getPoint(e.lblT ?? 0.5, tmpV));
}
function edgeLabel(e) {
  if (!e.lblObj) {
    const el = document.createElement('div');
    el.className = 'elabel';
    el.style.borderColor = e.T.color;
    el.style.color = e.T.color;
    el.textContent = e.label + (e.date ? ' · ' + fmtDate(e.date) : '') + (e.v ? '' : ' · UNVERIFIED');
    e.lblObj = new CSS2DObject(el);
    e.lblObj.position.copy(e.curve.getPoint(e.lblT ?? 0.5, tmpV));
    scene.add(e.lblObj);
  }
  return e.lblObj;
}

/* shafts + ghosts (depth) */
const shafts = [];
NODES.filter(n => n.L && n.L.length > 1).forEach(n => {
  const lo = Math.min(...n.L), hi = Math.max(...n.L);
  const geo = new LineGeometry();
  geo.setPositions([n._d.x, yOf(lo), n._d.z, n._d.x, yOf(hi), n._d.z]);
  const col = new THREE.Color(SHAFT[n.id] || '#C9D2DE').getHex();
  const mat = new LineMaterial({ color: col, linewidth: 3, transparent: true, opacity: 0, depthWrite: false });
  const line = new Line2(geo, mat);
  line.visible = false;
  scene.add(line);
  const ghosts = n.L.filter(l => l !== level(n)).map(l => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 12), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false }));
    m.position.set(n._d.x, yOf(l), n._d.z);
    m.visible = false;
    scene.add(m);
    return m;
  });
  shafts.push({ n, line, mat, ghosts });
});

/* pulses */
const PULSE_MAX = 48;
const pulseGeo = new THREE.BufferGeometry();
pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PULSE_MAX * 3), 3));
pulseGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(PULSE_MAX * 3), 3));
pulseGeo.setDrawRange(0, 0);
const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({ size: 1.15, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, sizeAttenuation: true }));
pulses.renderOrder = 3;
scene.add(pulses);
let strongEdges = [];

/* ---------------- positions / transition ---------------- */
const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
function updatePositions() {
  const t = S.t;
  NODES.forEach(n => { n._pos.lerpVectors(n._w, n._d, t); n._obj.position.copy(n._pos); });
  EDGES.forEach(e => { updateEdge(e); e.mat.opacity = e._strong ? e._op : e._op * (1 - 0.45 * t); });
  zones.forEach(z => {
    const sel = S.sys === z.sy.id;
    z.fill.material.opacity = (sel ? 0.09 : S.sys ? 0.015 : 0.035) * (1 - t);
    z.border.material.opacity = (sel ? 0.6 : S.sys ? 0.1 : 0.24) * (1 - t);
    z.el.style.opacity = (1 - t) * (S.sys && !sel ? 0.4 : 1);
    z.g.visible = t < 0.99;
  });
  planes.forEach(p => {
    p.m.material.opacity = p.base * t;
    p.edges.material.opacity = p.ebase * t;
    p.el.style.opacity = t;
    const vis = t > 0.01;
    p.m.visible = p.edges.visible = p.obj.visible = vis;
  });
  shafts.forEach(s => {
    s.mat.opacity = 0.75 * t;
    s.line.visible = t > 0.01;
    s.ghosts.forEach(g => { g.material.opacity = 0.85 * t; g.visible = t > 0.01; });
  });
  grid.position.y = -0.3 + (yOf(-2.8) + 0.3) * t;
  grid.material.opacity = 0.6 - 0.25 * t;
}
let modeTween = null;
function setMode(m, fly = true) {
  if (S.mode === m && !modeTween) { if (fly) flyHome(); return; }
  S.mode = m;
  document.body.classList.toggle('depth', m === 'depth');
  modeTween = { s: performance.now(), from: S.t, to: m === 'depth' ? 1 : 0, ms: REDUCE ? 1 : 1500 };
  if (controls) controls.maxPolarAngle = m === 'depth' ? Math.PI * 0.9 : Math.PI * 0.495;
  if (fly) flyHome();
  renderRail();
  writeHash();
}

/* ---------------- camera ---------------- */
let fly = null;
function flyTo(pos, tgt, ms = 1000) {
  if (!controls) return;
  if (REDUCE) { camera.position.copy(pos); controls.target.copy(tgt); return; }
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), s: performance.now(), ms };
}
function flyHome() { const h = homeFor(S.mode); flyTo(h.pos, h.tgt, 1300); }
function flyToNode(id) {
  if (!controls) return;
  const n = BY[id];
  const dir = camera.position.clone().sub(controls.target).normalize();
  const dist = Math.min(Math.max(camera.position.distanceTo(controls.target), S.mode === 'depth' ? 78 : 50), MOBILE() ? 130 : (S.mode === 'depth' ? 120 : 86));
  const tgt = n._pos.clone();
  flyTo(tgt.clone().add(dir.multiplyScalar(dist)), tgt, 900);
}
if (controls) controls.addEventListener('start', () => { fly = null; });

/* view offset so the scene centers between the panels */
let viewOff = 0;
function targetOffset() {
  if (MOBILE()) return 0;
  const railW = $('#rail').offsetWidth + 14;
  const dosW = document.body.classList.contains('no-dossier') ? 0 : $('#dossier').offsetWidth + 14;
  return (dosW - railW) / 2;
}

/* ---------------- state application ---------------- */
function edgeVisible(e) {
  if (S.off.has(e.type)) return false;
  if (S.lens !== 'all' && !e.T.lenses.includes(S.lens)) return false;
  if (S.cutoff && e.date && e.date > S.cutoff) return false;
  if (S.sys && BY[e.a].s !== S.sys && BY[e.b].s !== S.sys) return false;
  if (threadSet && !(threadSet.has(e.a) && threadSet.has(e.b))) return false;
  return true;
}
const BASE_OP = { contract: 0.5, capital: 0.42, partner: 0.42, supply: 0.3, own: 0.32, threat: 0.65, counter: 0.5, pressure: 0.45 };
let nbSet = new Set();
function applyState() {
  threadSet = S.thread ? new Set(THREADS.find(t => t.id === S.thread).nodes) : null;
  const focus = S.sel || S.hover;
  const filtered = S.lens !== 'all' || !!S.sys || !!S.thread || !!S.cutoff || S.off.size > 0;
  const vis = new Map();
  const active = new Set();
  EDGES.forEach(e => { const v = edgeVisible(e); vis.set(e, v); if (v) { active.add(e.a); active.add(e.b); } });
  nbSet = new Set();
  if (focus) { nbSet.add(focus); ADJ[focus].forEach(e => { if (vis.get(e)) { nbSet.add(e.a); nbSet.add(e.b); } }); }
  strongEdges = [];
  const labelled = new Set();
  if (focus) {
    const inc = ADJ[focus].filter(e => vis.get(e));
    const pr = { threat: 0, contract: 1, capital: 2, partner: 3, pressure: 4, counter: 5, supply: 6, own: 7 };
    inc.sort((a, b) => (b.date || '0').localeCompare(a.date || '0') || pr[a.type] - pr[b.type]);
    (S.edgeHover != null ? inc.filter(e => e.i === S.edgeHover) : inc.slice(0, MOBILE() ? 5 : 9)).forEach(e => labelled.add(e));
  } else if (threadSet) {
    EDGES.filter(e => vis.get(e)).sort((a, b) => (b.date || '0').localeCompare(a.date || '0')).slice(0, 14).forEach(e => labelled.add(e));
  }
  EDGES.forEach(e => {
    const v = vis.get(e);
    let op = 0, w = 1.4, strong = false;
    if (v) {
      if (focus) {
        if (e.a === focus || e.b === focus) {
          strong = true;
          op = S.edgeHover == null || S.edgeHover === e.i ? 0.95 : 0.35;
          w = S.edgeHover === e.i ? 4 : 2.6;
          strongEdges.push(e);
        } else { op = 0.035; w = 1; }
      } else if (threadSet) { op = 0.85; w = 2.2; strong = true; strongEdges.push(e); }
      else { op = BASE_OP[e.type] * (filtered ? 1.45 : 1) * (MOBILE() ? 0.7 : 1); w = filtered ? 1.9 : (MOBILE() ? 1.1 : 1.4); }
    }
    e._op = Math.min(op, 1);
    e._strong = strong;
    e.line.visible = v && op > 0;
    e.mat.linewidth = w;
    if (labelled.has(e) && renderer) {
      e.lblT = focus ? (e.a === focus ? 0.62 : 0.38) : 0.5;
      const o = edgeLabel(e);
      o.position.copy(e.curve.getPoint(e.lblT, tmpV));
      o.visible = true;
    } else if (e.lblObj) { e.lblObj.visible = false; }
  });
  NODES.forEach(n => {
    const el = n._el;
    let st = '';
    if (focus) st = nbSet.has(n.id) ? 'nb' : 'dim';
    else if (threadSet) st = threadSet.has(n.id) ? '' : 'dim';
    else if (filtered) st = (active.has(n.id) || (S.sys && n.s === S.sys)) ? '' : 'faint';
    el.classList.toggle('s-dim', st === 'dim');
    n._sop = st === 'dim' ? 0.13 : st === 'faint' ? 0.3 : 1;
    el.classList.toggle('s-faint', st === 'faint');
    el.classList.toggle('s-nb', st === 'nb' && n.id !== S.sel);
    el.classList.toggle('s-sel', n.id === S.sel);
    n._st = st;
  });
  planes.forEach(p => {
    const f = focus && BY[focus];
    p.el.classList.toggle('hot', !!(f && (f.L || []).includes(p.L.lv)));
  });
  positionsDirty = true;
  lod(true);
}
let lastCam = new THREE.Vector3(1e9, 0, 0);
function lod(force) {
  if (!renderer) return;
  if (!force && lastCam.distanceToSquared(camera.position) < 0.25) return;
  lastCam.copy(camera.position);
  const focus = S.sel || S.hover;
  NODES.forEach(n => {
    const d = camera.position.distanceTo(n._pos);
    let show;
    if (n._st === 'dim') show = n.id === focus;
    else show = S.labelsAll || n.t === 'M' || (n.t === 'K' && d < 270) || d < 125 || nbSet.has(n.id) || (threadSet && threadSet.has(n.id)) || (S.sys === n.s && d < 230);
    const sub = n.t === 'M' ? d < 330 : (d < 80 || n.id === focus);
    const fade = n._st === 'dim' ? 1 : Math.min(1, Math.max(0.5, 1.2 - (d - 110) / 380));
    const op = ((n._sop ?? 1) * fade).toFixed(2);
    if (op !== n._op) { n._el.style.opacity = op; n._op = op; }
    if (show !== n._lbl) { n._el.classList.toggle('hide-lbl', !show); n._lbl = show; }
    if (sub !== n._sub) { n._el.classList.toggle('hide-sub', !sub); n._sub = sub; }
  });
}

/* ---------------- tooltip ---------------- */
function showTip(n, ev) {
  const tk = NODE_TK[n.id] || n.tk;
  const m = tk && MK[tk];
  const priceLine = m && m.quote && m.quote.current_price ? ` · ${px(m.quote.current_price)}` : '';
  tooltip.innerHTML = `<b>${esc(n.n)}</b>${esc(shortSum(n.sum))}<span class="m">${esc(TIER[n.t])} · ${esc(SYS[n.s].name)} · ${ADJ[n.id].length} threads${tk ? ' · ' + esc(tk) : ''}${esc(priceLine)}${n.pv ? ' · ' + esc(n.pv) : ''}</span>`;
  tooltip.classList.add('on');
  moveTip(ev);
}
function moveTip(ev) {
  if (!ev || ev.clientX == null) { tooltip.style.left = '-999px'; return; }
  const w = tooltip.offsetWidth, h = tooltip.offsetHeight;
  let x = ev.clientX + 16, y = ev.clientY + 16;
  if (x + w > innerWidth - 8) x = ev.clientX - w - 16;
  if (y + h > innerHeight - 8) y = ev.clientY - h - 16;
  tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
}
function hideTip() { tooltip.classList.remove('on'); }

/* ---------------- selection + dossier ---------------- */
function select(id, fly = false) {
  S.sel = id;
  S.edgeHover = null;
  hideTip();
  if (id) {
    renderDossier(id);
    document.body.classList.remove('no-dossier');
    if (fly) flyToNode(id);
  } else {
    document.body.classList.add('no-dossier');
  }
  applyState();
  writeHash();
}
function typeSwatch(type) {
  const T = C.edgeTypes[type];
  const style = T.dash ? (T.dash[0] < 0.6 ? 'dotted' : 'dashed') : 'solid';
  return `<span class="sw" style="border-top-color:${T.color};border-top-style:${style}"></span>`;
}
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
function renderDossier(id) {
  const n = BY[id];
  const sy = SYS[n.s];
  const tk = NODE_TK[n.id] || n.tk;
  const fx = !MK[tk] && (C.markets.foreign || []).find(f => f.node === n.id);
  const edges = [...ADJ[id]].sort((a, b) => (b.date || '0').localeCompare(a.date || '0'));
  const th = NODE_THREADS[id] || [];
  const ST = { d: ['● DONE', 'st-d'], m: ['◐ IN MOTION', 'st-m'], p: ['○ PENDING', 'st-p'], b: ['✕ BLOCKED', 'st-b'] };
  const h = [];
  h.push(`<div class="d-head"><span class="eyebrow" style="color:${sy.tint}">${esc(sy.n)} // ${esc(sy.name)} · ${esc(TIER[n.t])}</span>
    <button type="button" class="btn icon" id="d-close" aria-label="Close dossier"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button></div>`);
  h.push(`<h2 class="d-name">${esc(n.n)}</h2>`);
  const chips = [];
  if (tk) chips.push(`<span class="chip"><span class="tk">${esc(tk)}</span>${n.ex ? esc(n.ex) : ''}<button type="button" class="copy" data-copy="${esc(tk)}">COPY</button></span>`);
  if (n.pv) chips.push(`<span class="chip">${esc(n.pv)}</span>`);
  chips.push(`<span class="chip">${esc(KIND[n.k] || n.k)}</span>`);
  (n.L || []).forEach(l => chips.push(`<span class="chip">L${l} ${esc(C.layers[l].name)}</span>`));
  h.push(`<div class="chips">${chips.join('')}</div>`);
  if (tk && MK[tk]) {
    h.push(marketStrip(tk));
    h.push(`<div class="links"><button type="button" class="btn" data-open-tk="${esc(tk)}">OPEN IN MARKETS</button><a class="btn" href="https://www.barchart.com/stocks/quotes/${esc(tk)}/overview" target="_blank" rel="noopener">BARCHART</a></div>`);
  } else if (fx) {
    h.push(`<div class="card" style="padding:12px;font-size:12.5px;line-height:1.5;color:var(--soft)"><span class="eyebrow">${esc(fx.ex)} listing</span><br>${esc(fx.print)}${fx.book ? '<br>' + esc(fx.book) : ''}</div>`);
  }
  h.push(`<p class="d-sum">${esc(n.sum)}</p>`);
  if (n.dir) h.push(`<div class="d-sec"><span class="eyebrow">Directive · mission</span><div class="d-dir">${esc(n.dir)}</div></div>`);
  if (n.obj && n.obj.length) {
    h.push(`<div class="d-sec"><span class="eyebrow">Objectives ledger</span><div class="ledger">${n.obj.map(o => `<span class="st ${ST[o[0]][1]}">${ST[o[0]][0]}</span><span>${esc(o[1])}${o[2] ? `<span class="dt">${esc(fmtDate(o[2]))}</span>` : ''}</span>`).join('')}</div></div>`);
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
  if (t.dataset.go) { select(t.dataset.go, true); return; }
  if (t.dataset.thread) { openThread(t.dataset.thread); return; }
  if (t.dataset.openTk) { openTicker(t.dataset.openTk); return; }
  if (t.dataset.copy) { copyText(t.dataset.copy, t); }
});
function copyText(text, btn) {
  const done = () => { const o = btn.textContent; btn.textContent = 'COPIED'; setTimeout(() => { btn.textContent = o; }, 1100); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
}

/* ---------------- rail ---------------- */
const RAIL = $('#rail');
function renderRail() {
  const sysCount = {};
  NODES.forEach(n => { sysCount[n.s] = (sysCount[n.s] || 0) + 1; });
  const typeCount = {};
  EDGES.forEach(e => { typeCount[e.type] = (typeCount[e.type] || 0) + 1; });
  RAIL.innerHTML = `
  <section><span class="eyebrow">View</span>
    <div class="seg" role="group" aria-label="View mode">
      <button type="button" data-mode="world" aria-pressed="${S.mode === 'world'}">WORLD</button>
      <button type="button" data-mode="depth" aria-pressed="${S.mode === 'depth'}">DEPTH</button>
    </div>
  </section>
  <section><span class="eyebrow">Lens</span>
    ${C.lenses.map(l => `<button type="button" class="lens" data-lens="${l.id}" aria-pressed="${S.lens === l.id}"><b>${esc(l.name)}</b><span>${esc(l.d)}</span></button>`).join('')}
  </section>
  <section><span class="eyebrow">Master systems · tap to isolate</span>
    ${[...C.systems].sort((a, b) => a.n.localeCompare(b.n)).map(s => `<button type="button" class="row-btn" data-sys="${s.id}" aria-pressed="${S.sys === s.id}"><span class="n">${esc(s.n)}</span><span>${esc(s.name)}</span><span class="c">${sysCount[s.id] || 0}</span></button>`).join('')}
  </section>
  <section><span class="eyebrow">Thread types · tap to hide</span>
    ${Object.entries(C.edgeTypes).map(([k, T]) => `<button type="button" class="row-btn ${S.off.has(k) ? 'type-off' : ''}" data-type="${k}" aria-pressed="${!S.off.has(k)}" style="border-color:transparent;background:none"><span>${typeSwatch(k)}</span><span>${esc(T.name)}</span><span class="c">${typeCount[k] || 0}</span></button>`).join('')}
  </section>
  <section><span class="eyebrow">Node tiers</span>
    <div class="legend-row"><span class="g"><span style="width:20px;height:20px;border-radius:50%;border:1.5px solid #E7EBF1;box-shadow:0 0 0 4px rgba(231,235,241,.08);display:inline-flex;align-items:center;justify-content:center"><span style="width:6px;height:6px;border-radius:50%;background:#E7EBF1"></span></span></span>Master node</div>
    <div class="legend-row"><span class="g"><span style="width:14px;height:14px;border-radius:50%;border:1.5px solid #E7EBF1"></span></span>Key node</div>
    <div class="legend-row"><span class="g"><span style="width:9px;height:9px;border-radius:50%;background:#B9C2CF"></span></span>Node</div>
    <div class="legend-row"><span class="g"><span style="width:11px;height:11px;border:1.5px solid #F0A63A;background:rgba(240,166,58,.18);transform:rotate(45deg)"></span></span>Sovereign buyer · program</div>
    <div class="legend-row"><span class="g"><span style="width:10px;height:10px;border-radius:50%;background:#46C2EA"></span></span>Capital</div>
    <div class="legend-row"><span class="g"><span style="width:10px;height:10px;border-radius:50%;background:#A996FF"></span></span>Model</div>
    <div class="legend-row"><span class="g"><span style="width:13px;height:13px;border-radius:50%;border:1.5px dashed #FF5B4F"></span></span>Threat · counter-bloc · oversight</div>
  </section>
  <section class="rail-foot">
    <button type="button" class="btn" data-act="labels" aria-pressed="${S.labelsAll}">${S.labelsAll ? 'AUTO LABELS' : 'ALL LABELS'}</button>
    <button type="button" class="btn" data-act="reset">RESET</button>
  </section>`;
}
RAIL.addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.dataset.mode) setMode(b.dataset.mode);
  else if (b.dataset.lens) { S.lens = b.dataset.lens; renderRail(); applyState(); writeHash(); }
  else if (b.dataset.sys) { S.sys = S.sys === b.dataset.sys ? null : b.dataset.sys; renderRail(); applyState(); if (S.sys) flyToSystem(S.sys); writeHash(); }
  else if (b.dataset.type) { const k = b.dataset.type; S.off.has(k) ? S.off.delete(k) : S.off.add(k); renderRail(); applyState(); }
  else if (b.dataset.act === 'labels') { S.labelsAll = !S.labelsAll; renderRail(); lod(true); }
  else if (b.dataset.act === 'reset') resetAll();
});
function flyToSystem(id) {
  if (!controls) return;
  const [x, y, w, h] = SYS[id].box;
  const c = new THREE.Vector3(x + w / 2 - 70, S.mode === 'depth' ? 0 : 0, y + h / 2 - 45);
  const dir = camera.position.clone().sub(controls.target).normalize();
  flyTo(c.clone().add(dir.multiplyScalar(MOBILE() ? 120 : 85)), c, 1000);
}
function resetAll() {
  S.lens = 'all'; S.sys = null; S.off.clear(); S.thread = null; S.cutoff = null; S.labelsAll = false;
  setRange(TL_MAX);
  renderBanner();
  select(null);
  renderRail();
  applyState();
  flyHome();
  writeHash();
}
$('#rail-toggle').addEventListener('click', () => document.body.classList.toggle('rail-open'));

/* ---------------- hud ---------------- */
function dolly(f) {
  if (!controls) return;
  const off = camera.position.clone().sub(controls.target);
  const len = THREE.MathUtils.clamp(off.length() * f, controls.minDistance, controls.maxDistance);
  flyTo(controls.target.clone().add(off.setLength(len)), controls.target.clone(), 450);
}
$('#zin').addEventListener('click', () => dolly(0.72));
$('#zout').addEventListener('click', () => dolly(1.38));
$('#fit').addEventListener('click', flyHome);

/* background click clears selection */
let downAt = null;
if (renderer) {
  renderer.domElement.addEventListener('pointerdown', ev => { downAt = [ev.clientX, ev.clientY]; });
  renderer.domElement.addEventListener('pointerup', ev => {
    if (downAt && Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) < 4 && S.sel) select(null);
    downAt = null;
  });
}

/* ---------------- thread banner ---------------- */
function renderBanner() {
  const b = $('#thread-banner');
  if (!S.thread) { b.classList.remove('on'); b.innerHTML = ''; return; }
  const T = THREADS.find(t => t.id === S.thread);
  b.innerHTML = `<span style="color:#FF9A92">THREAD ${esc(T.id)}</span><span>${esc(T.name.toUpperCase())}</span><button type="button" class="btn" data-b="case">OPEN CASE</button><button type="button" class="btn" data-b="clear">CLEAR</button>`;
  b.classList.add('on');
}
$('#thread-banner').addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.dataset.b === 'case') openThread(S.thread);
  else { S.thread = null; renderBanner(); applyState(); writeHash(); }
});

/* ---------------- timeline ---------------- */
const TL_START = [2024, 10];
const TL_MAX = 50;
function monthIndex(d) {
  const p = d.split('-');
  const y = +p[0];
  let m = p[1] ? (p[1].startsWith('Q') ? (+p[1].slice(1)) * 3 : +p[1]) : 6;
  const day = p[2] ? +p[2] : 15;
  return (y - TL_START[0]) * 12 + (m - TL_START[1]) + (day - 1) / 31;
}
function cutoffFor(i) {
  const tot = TL_START[1] - 1 + i;
  const y = TL_START[0] + Math.floor(tot / 12), m = (tot % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}-31`;
}
const TL_EVENTS = (() => {
  const out = [], seen = new Set();
  const map = { threat: 'threat', response: 'contract', context: 'policy' };
  THREADS.forEach(t => t.events.forEach(e => {
    const key = e[0] + e[1].slice(0, 24);
    if (seen.has(key)) return; seen.add(key);
    out.push({ d: e[0], t: e[1], k: map[e[3]] || 'policy', th: t.id });
  }));
  C.timeline.forEach(e => { const key = e[0] + e[1].slice(0, 24); if (!seen.has(key)) { seen.add(key); out.push({ d: e[0], t: e[1], k: e[2] }); } });
  return out.filter(e => monthIndex(e.d) >= 0 && monthIndex(e.d) <= TL_MAX + 0.99).sort((a, b) => a.d.localeCompare(b.d));
})();
function buildTimeline() {
  const track = $('#tl-track');
  const years = $('#tl-years');
  const pct = d => (monthIndex(d) / (TL_MAX + 1)) * 100;
  years.innerHTML = ['2024-10-01', '2025-01-01', '2025-07-01', '2026-01-01', '2026-07-01', '2027-01-01', '2027-07-01', '2028-01-01', '2028-07-01'].map(d => `<span style="left:${pct(d)}%">${d.slice(5, 7) === '01' ? d.slice(0, 4) : fmtDate(d.slice(0, 7)).toUpperCase()}</span>`).join('');
  const now = document.createElement('div');
  now.className = 'now';
  now.style.left = pct(NOW) + '%';
  now.innerHTML = '<span>NOW · NOV 3, 2026</span>';
  track.appendChild(now);
  TL_EVENTS.forEach((e, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `tick k-${e.k}${e.d > NOW ? ' future' : ''}`;
    b.style.left = pct(e.d) + '%';
    b.style.top = (19 + ((i % 3) - 1) * 0) + 'px';
    b.setAttribute('aria-label', `${fmtDate(e.d)}: ${e.t}`);
    b.addEventListener('mouseenter', ev => { tooltip.innerHTML = `<b>${esc(fmtDate(e.d))}</b>${esc(e.t)}${e.th ? `<span class="m">THREAD ${e.th}</span>` : ''}`; tooltip.classList.add('on'); moveTip(ev); });
    b.addEventListener('mousemove', moveTip);
    b.addEventListener('mouseleave', hideTip);
    b.addEventListener('click', () => { setRange(Math.min(TL_MAX - 1, Math.max(0, Math.floor(monthIndex(e.d))))); });
    track.appendChild(b);
  });
}
const range = $('#tl-range');
range.max = TL_MAX;
function setRange(i) {
  range.value = i;
  if (+i >= TL_MAX) { S.cutoff = null; $('#tl-label').textContent = 'ALL DATES'; $('#tl-fill').style.width = '100%'; }
  else {
    S.cutoff = cutoffFor(+i);
    $('#tl-label').textContent = 'THROUGH ' + fmtDate(S.cutoff.slice(0, 7)).toUpperCase();
    $('#tl-fill').style.width = ((+i + 1) / (TL_MAX + 1)) * 100 + '%';
  }
  applyState();
}
range.addEventListener('input', () => setRange(+range.value));
let playTimer = null;
$('#tl-play').addEventListener('click', () => {
  if (playTimer) { clearInterval(playTimer); playTimer = null; return; }
  let i = 0;
  setRange(0);
  playTimer = setInterval(() => {
    i++;
    if (i > TL_MAX) { clearInterval(playTimer); playTimer = null; return; }
    setRange(i);
  }, 260);
});
$('#tl-all').addEventListener('click', () => { if (playTimer) { clearInterval(playTimer); playTimer = null; } setRange(TL_MAX); });

/* ---------------- views ---------------- */
function setView(v) {
  S.view = v;
  $$('#nav button').forEach(b => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  ['threads', 'markets', 'brief', 'sources'].forEach(id => $('#sheet-' + id).classList.toggle('on', v === id));
  if (v === 'threads') renderThreads();
  if (v === 'markets') renderMarkets();
  if (v === 'brief') renderBrief();
  if (v === 'sources') renderSources();
  writeHash();
}
$('#nav').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) setView(b.dataset.view); });

/* threads */
function openThread(id) { S.activeThread = id; setView('threads'); const s = $('#sheet-threads'); s.scrollTop = 0; }
function renderThreads() {
  const T = THREADS.find(t => t.id === S.activeThread) || THREADS[0];
  const VS = { confirmed: '● CONFIRMED', reported: '◐ REPORTED', stage: '◇ ON STAGE', scheduled: '○ SCHEDULED', unverified: '✕ UNVERIFIED' };
  const evs = T.events.map((e, i) => {
    const side = i % 2 === 0 ? 1 : 3;
    const card = `<div class="ev k-${e[3]}" style="grid-column:${side}"><div class="ev-top"><span style="color:${e[3] === 'threat' ? '#FF7A70' : e[3] === 'response' ? '#F0A63A' : '#C9D2DE'}">${esc(fmtDate(e[0]).toUpperCase())}</span><span class="vs-${e[4]}">${VS[e[4]] || ''}</span></div><div class="ev-t">${esc(e[1])}</div>${e[2] ? `<div class="ev-x">${esc(e[2])}</div>` : ''}${e[5] ? `<div class="ev-s">${e[6] ? `<a href="${esc(e[6])}" target="_blank" rel="noopener">${esc(e[5])}</a>` : esc(e[5])}</div>` : ''}</div>`;
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
  if (b.dataset.show) { S.thread = b.dataset.show; select(null); renderBanner(); applyState(); setView('map'); flyHome(); writeHash(); }
  if (b.dataset.node) { setView('map'); select(b.dataset.node, true); }
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
  if (b.dataset.node) { setView('map'); select(b.dataset.node, true); return; }
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
$('#sheet-brief').addEventListener('click', ev => { const b = ev.target.closest('button[data-node]'); if (b) { setView('map'); select(b.dataset.node, true); } });

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

/* ---------------- search ---------------- */
const qIn = $('#q'), qOut = $('#search-results');
let qSel = 0, qItems = [];
function runSearch() {
  const q = qIn.value.trim().toLowerCase();
  if (!q) { qOut.classList.remove('open'); return; }
  const items = [];
  NODES.forEach(n => {
    const tk = (NODE_TK[n.id] || n.tk || '').toLowerCase();
    const score = n.n.toLowerCase().startsWith(q) ? 3 : tk === q ? 4 : n.n.toLowerCase().includes(q) ? 2 : tk.includes(q) ? 2 : (n.sum || '').toLowerCase().includes(q) ? 1 : 0;
    if (score) items.push({ score, kind: 'NODE', name: n.n, tk: NODE_TK[n.id] || n.tk, go: () => { setView('map'); select(n.id, true); } });
  });
  Object.keys(MK).forEach(tk => {
    if (tk.toLowerCase().startsWith(q)) items.push({ score: 3.5, kind: 'TICKER', name: (BY[TK2NODE[tk]] || {}).n || (EXTRA_NAMES[tk] || [tk])[0], tk, go: () => openTicker(tk) });
  });
  THREADS.forEach(t => { if (t.name.toLowerCase().includes(q) || t.lede.toLowerCase().includes(q)) items.push({ score: t.name.toLowerCase().includes(q) ? 2.5 : 0.5, kind: 'THREAD ' + t.id, name: t.name, go: () => openThread(t.id) }); });
  qItems = items.sort((a, b) => b.score - a.score).slice(0, 12);
  qSel = 0;
  qOut.innerHTML = qItems.length ? qItems.map((it, i) => `<button type="button" role="option" class="${i === qSel ? 'active' : ''}" data-i="${i}"><span class="r-kind">${esc(it.kind)}</span><span class="r-name">${esc(it.name)}</span>${it.tk ? `<span class="r-tk">${esc(it.tk)}</span>` : ''}</button>`).join('') : '<p style="margin:8px 10px;font-size:12px;color:var(--muted)">No match.</p>';
  qOut.classList.add('open');
}
qIn.addEventListener('input', runSearch);
qIn.addEventListener('keydown', ev => {
  if (!qOut.classList.contains('open')) return;
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    ev.preventDefault();
    qSel = (qSel + (ev.key === 'ArrowDown' ? 1 : -1) + qItems.length) % Math.max(qItems.length, 1);
    $$('#search-results button').forEach((b, i) => b.classList.toggle('active', i === qSel));
  } else if (ev.key === 'Enter') { ev.preventDefault(); pick(qSel); }
  else if (ev.key === 'Escape') { qOut.classList.remove('open'); }
});
qOut.addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) pick(+b.dataset.i); });
function pick(i) { const it = qItems[i]; if (!it) return; qOut.classList.remove('open'); qIn.value = ''; qIn.blur(); it.go(); }
document.addEventListener('click', ev => { if (!ev.target.closest('.search')) qOut.classList.remove('open'); });
document.addEventListener('keydown', ev => {
  if (ev.key === '/' && document.activeElement.tagName !== 'INPUT') { ev.preventDefault(); qIn.focus(); }
  if (ev.key === 'Escape' && document.activeElement.tagName !== 'INPUT') {
    if (S.view !== 'map') setView('map'); else if (S.sel) select(null); else if (S.thread) { S.thread = null; renderBanner(); applyState(); }
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
    if (S.mode !== 'world') p.set('mode', S.mode);
    if (S.sel) p.set('node', S.sel);
    if (S.thread) p.set('show', S.thread);
    if (S.lens !== 'all') p.set('lens', S.lens);
    if (S.sys) p.set('sys', S.sys);
  }
  const h = p.toString();
  history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
}
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  hashLock = true;
  if (p.get('lens') && C.lenses.some(l => l.id === p.get('lens'))) S.lens = p.get('lens');
  if (p.get('sys') && SYS[p.get('sys')]) S.sys = p.get('sys');
  if (p.get('show') && THREADS.some(t => t.id === p.get('show'))) { S.thread = p.get('show'); renderBanner(); }
  if (p.get('mode') === 'depth') setMode('depth', true);
  if (p.get('node') && BY[p.get('node')]) select(p.get('node'), true);
  if (p.get('thread') && THREADS.some(t => t.id === p.get('thread'))) S.activeThread = p.get('thread');
  const v = p.get('view');
  if (v === 'markets' && p.get('tk')) { hashLock = false; openTicker(p.get('tk')); return; }
  if (v && ['threads', 'markets', 'brief', 'sources'].includes(v)) setView(v);
  hashLock = false;
  renderRail();
  applyState();
}

/* ---------------- loop ---------------- */
function resize() {
  const r = stage.getBoundingClientRect();
  if (renderer) renderer.setSize(r.width, r.height);
  css.setSize(r.width, r.height);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
  EDGES.forEach(e => e.mat.resolution.set(r.width, r.height));
  shafts.forEach(s => s.mat.resolution.set(r.width, r.height));
  viewOff = 1e9;
}
addEventListener('resize', resize);
let frame = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (!renderer) return;
  if (modeTween) {
    const k = Math.min(1, (now - modeTween.s) / modeTween.ms);
    S.t = modeTween.from + (modeTween.to - modeTween.from) * ease(k);
    positionsDirty = true;
    if (k >= 1) modeTween = null;
  }
  if (positionsDirty) { updatePositions(); positionsDirty = false; }
  if (fly) {
    const k = Math.min(1, (now - fly.s) / fly.ms), e = ease(k);
    camera.position.lerpVectors(fly.p0, fly.p1, e);
    controls.target.lerpVectors(fly.t0, fly.t1, e);
    if (k >= 1) fly = null;
  }
  const tOff = targetOffset();
  if (Math.abs(tOff - viewOff) > 0.5) {
    viewOff = viewOff > 1e8 ? tOff : viewOff + (tOff - viewOff) * 0.14;
    const r = renderer.domElement;
    const w = r.clientWidth, h = r.clientHeight;
    if (Math.abs(viewOff) > 0.5) camera.setViewOffset(w, h, viewOff, 0, w, h); else camera.clearViewOffset();
  }
  controls.update();
  // pulses
  const pos = pulseGeo.attributes.position.array, col = pulseGeo.attributes.color.array;
  let c = 0;
  if (!REDUCE && S.view === 'map') {
    for (let i = 0; i < strongEdges.length && c < PULSE_MAX; i++) {
      const e = strongEdges[i];
      if (!e.line.visible) continue;
      const t = ((now * 0.00022) + i * 0.137) % 1;
      e.curve.getPoint(t, tmpV);
      pos[c * 3] = tmpV.x; pos[c * 3 + 1] = tmpV.y; pos[c * 3 + 2] = tmpV.z;
      const cc = new THREE.Color(e.T.color);
      col[c * 3] = cc.r; col[c * 3 + 1] = cc.g; col[c * 3 + 2] = cc.b;
      c++;
    }
  }
  pulseGeo.setDrawRange(0, c);
  pulseGeo.attributes.position.needsUpdate = true;
  pulseGeo.attributes.color.needsUpdate = true;
  if (++frame % 3 === 0) lod(false);
  if (S.view === 'map' || frame % 6 === 0) {
    renderer.render(scene, camera);
    css.render(scene, camera);
  }
}

/* ---------------- boot ---------------- */
$('#brand-sub').textContent = `${C.meta.file} · AS OF ${fmtDate(C.meta.asof).toUpperCase()}`;
renderRail();
buildTimeline();
setRange(TL_MAX);
resize();
applyState();
readHash();
requestAnimationFrame(loop);
window.__casemap = { S, select, setMode, setView, openTicker, openThread };

/* dossier edge-row hover isolates one thread on the map */
$('#dossier').addEventListener('mouseover', ev => {
  const r = ev.target.closest('.edge-row');
  const v = r ? +r.dataset.ei : null;
  if (v !== S.edgeHover) { S.edgeHover = v; applyState(); }
});
$('#dossier').addEventListener('mouseleave', () => { if (S.edgeHover != null) { S.edgeHover = null; applyState(); } });
$('#dossier').addEventListener('focusin', ev => {
  const r = ev.target.closest('.edge-row');
  S.edgeHover = r ? +r.dataset.ei : null; applyState();
});
