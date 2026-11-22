import { PetModel, normalizePack, STATES } from './pet-engine.js';

const FALLBACK_PACKS = [
  { id: 'may', name: 'Mây', url: '../app/assets/pets/may/pack.json' },
  { id: 'dsh-bot', name: 'DSH Bot', url: '../app/assets/pets/dsh-bot/pack.json' },
];

const STATE_LABEL = {
  idle: 'đứng chờ', thinking: 'đang nghĩ', working: 'đang làm',
  attention: 'vừa xong', error: 'gặp lỗi', notification: 'chờ bạn',
  sleeping: 'đang ngủ', waking: 'vừa thức', roam: 'đi dạo',
};

const BUBBLES = {
  attention: { text: 'Xong rồi! Nghỉ chút nhé.' },
  error: { text: 'Có gì đó hỏng rồi…' },
  notification: { text: 'Có việc đang chờ bạn.', action: 'Đã xử lý' },
};

const STORE_KEY = 'pet-studio/v1';

const PALETTES = {
  goc: { label: 'Gốc', filter: 'none' },
  bang: { label: 'Băng', filter: 'sepia(.35) saturate(1.5) hue-rotate(150deg)' },
  sanho: { label: 'San hô', filter: 'sepia(.45) saturate(1.9) hue-rotate(-25deg)' },
  chanh: { label: 'Chanh', filter: 'sepia(.45) saturate(1.7) hue-rotate(35deg)' },
  tim: { label: 'Tím', filter: 'sepia(.5) saturate(1.5) hue-rotate(230deg)' },
};

const PROFILES = {
  work: { label: 'Làm việc', size: '40', quiet: true, palette: 'bang' },
  chill: { label: 'Thư giãn', size: '64', quiet: false, palette: 'goc' },
  night: { label: 'Ban đêm', size: '40', quiet: true, palette: 'tim' },
};

const DEFAULT_STORE = {
  pack: null, size: '64', quiet: false, palette: 'goc', name: '',
  stats: { poke: 0, tickle: 0, drag: 0, seconds: 0, states: {} },
  journal: [],
};

const el = {
  canvas: document.getElementById('canvas'),
  stage: document.getElementById('stage'),
  bubble: document.getElementById('bubble'),
  bubbleText: document.getElementById('bubbleText'),
  bubbleAction: document.getElementById('bubbleAction'),
  status: document.getElementById('status'),
  packInfo: document.getElementById('packInfo'),
  pack: document.getElementById('pack'),
  size: document.getElementById('size'),
  quiet: document.getElementById('quiet'),
  demo: document.getElementById('demo'),
  states: document.getElementById('states'),
  version: document.getElementById('version'),
  petName: document.getElementById('petName'),
  openSettings: document.getElementById('openSettings'),
  sheet: document.getElementById('sheet'),
  backdrop: document.getElementById('backdrop'),
  closeSheet: document.getElementById('closeSheet'),
  petNameInput: document.getElementById('petNameInput'),
  paletteChips: document.getElementById('paletteChips'),
  profiles: document.getElementById('profiles'),
  stats: document.getElementById('stats'),
  journal: document.getElementById('journal'),
  copyBackup: document.getElementById('copyBackup'),
  importBackup: document.getElementById('importBackup'),
  backupBox: document.getElementById('backupBox'),
  resetAll: document.getElementById('resetAll'),
};
const ctx = el.canvas.getContext('2d');

let packs = FALLBACK_PACKS;
let pack = null;
let model = null;
let images = {};
let scale = 1;
let bubbleTimer = 0;
let rafId = 0;
let running = true;
let demoSeq = 0;
let demoTimer = 0;

function readStore() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { raw = {}; }
  return {
    ...DEFAULT_STORE,
    ...raw,
    stats: { ...DEFAULT_STORE.stats, ...(raw.stats || {}), states: { ...((raw.stats || {}).states || {}) } },
    journal: Array.isArray(raw.journal) ? raw.journal.slice(0, 50) : [],
  };
}
function writeStore(patch) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...readStore(), ...patch })); renderSheet(); } catch {}
}

function bumpStat(key, n = 1) {
  const s = readStore();
  s.stats[key] = (s.stats[key] || 0) + n;
  writeStore({ stats: s.stats });
}
function logEvent(text) {
  const s = readStore();
  const journal = [{ t: Date.now(), text }, ...s.journal].slice(0, 50);
  writeStore({ journal });
}
function formatTime(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function renderSheet() {
  if (!el.stats) return;
  const s = readStore();
  const minutes = Math.round((s.stats.seconds || 0) / 60);
  const seen = Object.keys(s.stats.states || {}).length;
  el.stats.innerHTML =
    '<span><b>' + (s.stats.poke || 0) + '</b> lần chọc</span>'
    + '<span><b>' + (s.stats.tickle || 0) + '</b> lần cù</span>'
    + '<span><b>' + minutes + '</b> phút bên pet</span>'
    + '<span><b>' + seen + '</b> trạng thái đã thấy</span>';
  el.journal.innerHTML = s.journal.map(e =>
    '<li><time>' + formatTime(e.t) + '</time><span>' + e.text + '</span></li>').join('');
  if (document.activeElement !== el.petNameInput) el.petNameInput.value = s.name || '';
  el.paletteChips.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b.dataset.palette === (s.palette || 'goc')));
  el.profiles.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b.dataset.profile === (s.profile || '')));
}

function applyName(name) {
  el.petName.textContent = name;
  el.petName.hidden = !name;
}
function applyPalette(key) {
  const conf = PALETTES[key] || PALETTES.goc;
  el.canvas.style.filter = conf.filter;
  el.paletteChips.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b.dataset.palette === key));
}
function applyProfile(key) {
  const conf = PROFILES[key];
  if (!conf) return;
  el.size.value = conf.size;
  el.quiet.checked = conf.quiet;
  if (model) model.quiet = conf.quiet;
  applyPalette(conf.palette);
  layout();
  writeStore({ size: conf.size, quiet: conf.quiet, palette: conf.palette, profile: key });
  logEvent('đổi hồ sơ: ' + conf.label);
}

function openSheet(open) {
  el.sheet.hidden = !open;
  el.backdrop.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) renderSheet();
}

function setStatus(text) { el.status.textContent = text; }

function showBubble(state) {
  const conf = BUBBLES[state];
  if (!conf || el.quiet.checked) { hideBubble(); return; }
  el.bubbleText.textContent = conf.text;
  el.bubbleAction.hidden = !conf.action;
  el.bubbleAction.textContent = conf.action || '';
  el.bubble.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(hideBubble, 5000);
}
function hideBubble() { el.bubble.hidden = true; }

function haptic(ms = 8) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

async function loadPacks() {
  try {
    const res = await fetch('./packs.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.packs) && data.packs.length) packs = data.packs;
    }
  } catch { /* dùng danh sách mặc định */ }
}

async function loadPack(id) {
  const entry = packs.find(p => p.id === id) || packs[0];
  const res = await fetch(entry.url);
  if (!res.ok) throw new Error('không tải được ' + entry.url);
  pack = normalizePack(await res.json());
  const base = new URL(entry.url, location.href);
  images = {};
  const sheets = [...new Set(Object.values(pack.animations).map(a => a.sheet))];
  await Promise.all(sheets.map(name => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images[name] = img; resolve(); };
    img.onerror = () => reject(new Error('thiếu ảnh ' + name));
    img.src = new URL(name, base).href;
  })));
  const saved = readStore();
  model = new PetModel(pack, { quiet: saved.quiet ?? false });
  model.on(onState);
  el.packInfo.textContent = (pack.name || pack.id) + ' · ' + pack.canvas.w + '×' + pack.canvas.h
    + ' · ' + Object.keys(pack.animations).length + ' animation';
  layout();
}

function layout() {
  const dp = Number(el.size.value) || 64;
  scale = dp / Math.max(1, pack.contentBox.h);
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = Math.max(1, Math.round(pack.canvas.w * scale));
  const h = Math.max(1, Math.round(pack.canvas.h * scale));
  el.stage.style.setProperty('--pet-w', w + 'px');
  el.canvas.style.width = w + 'px';
  el.canvas.style.height = h + 'px';
  el.canvas.width = Math.round(w * dpr);
  el.canvas.height = Math.round(h * dpr);
  lastFrameKey = '';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = !pack.pixelArt;
  ctx.imageSmoothingQuality = pack.pixelArt ? 'low' : 'high';
}

let lastFrameKey = '';
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function draw(now) {
  if (!running) return;
  const out = model.tick(now);
  const key = out ? out.name + ':' + (reduceMotion ? 0 : out.frame) : '';
  if (key === lastFrameKey) {
    rafId = requestAnimationFrame(draw);
    return;
  }
  lastFrameKey = key;
  ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
  if (out) {
    const { anim } = out;
    const frame = reduceMotion ? 0 : out.frame;
    const f = anim.frames[frame];
    const img = images[anim.sheet];
    if (img && f) {
      const sx = (f.i % anim.cols) * anim.frameW;
      const sy = Math.floor(f.i / anim.cols) * anim.frameH;
      ctx.drawImage(img, sx, sy, anim.frameW, anim.frameH,
        anim.box.x * scale, anim.box.y * scale, anim.box.w * scale, anim.box.h * scale);
    }
    if (Math.random() < 0.06) setStatus((STATE_LABEL[model.state] || model.state) + ' · ' + out.name + ' · frame ' + frame);
  }
  rafId = requestAnimationFrame(draw);
}

function onState() {
  document.querySelectorAll('.states button').forEach(b => {
    b.classList.toggle('active', b.dataset.state === model.state);
  });
  showBubble(model.state);
  const st = model.state;
  const stats = readStore().stats;
  if (!stats.states[st]) {
    stats.states[st] = 1;
    writeStore({ stats });
  }
  if (st === 'attention') logEvent('pet vừa xong việc');
  else if (st === 'error') logEvent('pet gặp lỗi');
  else if (st === 'notification') logEvent('có việc đang chờ bạn');
  else if (st === 'sleeping') logEvent('pet đi ngủ');
}

function buildSettingsUI() {
  el.paletteChips.innerHTML = Object.entries(PALETTES).map(([key, conf]) =>
    '<button data-palette="' + key + '">' + conf.label + '</button>').join('');
  el.profiles.innerHTML = Object.entries(PROFILES).map(([key, conf]) =>
    '<button data-profile="' + key + '">' + conf.label + '</button>').join('');
}

async function copyBackup() {
  const text = JSON.stringify(readStore(), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    setStatus('đã sao chép bản sao lưu');
  } catch {
    el.backupBox.value = text;
    el.backupBox.select();
    setStatus('trình duyệt chặn clipboard — JSON đã đưa vào ô bên dưới');
  }
}

function importBackup() {
  try {
    const data = JSON.parse(el.backupBox.value);
    if (!data || typeof data !== 'object') throw new Error('không phải JSON');
    const allowed = {};
    for (const key of ['pack', 'size', 'quiet', 'palette', 'name', 'profile', 'stats', 'journal']) {
      if (key in data) allowed[key] = data[key];
    }
    writeStore(allowed);
    logEvent('khôi phục từ bản sao lưu');
    location.reload();
  } catch (err) {
    setStatus('JSON không hợp lệ: ' + err.message);
  }
}

function resetAll() {
  if (!confirm('Xoá toàn bộ cài đặt và nhật ký của Pet Studio?')) return;
  try { localStorage.removeItem(STORE_KEY); } catch {}
  location.reload();
}

function bindSheet() {
  el.openSettings.addEventListener('click', () => openSheet(true));
  el.closeSheet.addEventListener('click', () => openSheet(false));
  el.backdrop.addEventListener('click', () => openSheet(false));
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') openSheet(false); });

  el.petNameInput.addEventListener('input', () => {
    const name = el.petNameInput.value.trim().slice(0, 16);
    applyName(name);
    writeStore({ name });
  });
  el.paletteChips.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-palette]');
    if (!b) return;
    applyPalette(b.dataset.palette);
    writeStore({ palette: b.dataset.palette, profile: '' });
    logEvent('đổi màu: ' + PALETTES[b.dataset.palette].label);
  });
  el.profiles.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-profile]');
    if (b) applyProfile(b.dataset.profile);
  });
  el.copyBackup.addEventListener('click', copyBackup);
  el.importBackup.addEventListener('click', importBackup);
  el.resetAll.addEventListener('click', resetAll);
}

function bindStage() {
  let down = null;
  let clicks = [];
  const pos = ev => {
    const r = el.canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width };
  };
  el.stage.addEventListener('pointerdown', ev => {
    el.stage.setPointerCapture(ev.pointerId);
    const p = pos(ev);
    down = { x: p.x, y: p.y, dragging: false };
  });
  el.stage.addEventListener('pointermove', ev => {
    if (!down) return;
    const p = pos(ev);
    if (!down.dragging && Math.hypot(p.x - down.x, p.y - down.y) > 8) {
      down.dragging = true;
      model.drag();
      haptic(6);
      bumpStat('drag');
      logEvent('nhấc pet lên');
    }
  });
  el.stage.addEventListener('pointerup', ev => {
    if (!down) return;
    const dragging = down.dragging;
    down = null;
    if (dragging) return;
    const p = pos(ev);
    const now = performance.now();
    clicks = clicks.filter(t => now - t < 1100);
    clicks.push(now);
    haptic(8);
    if (clicks.length >= 3) {
      clicks = [];
      model.tickle();
      bumpStat('tickle');
      logEvent('cù pet');
      return;
    }
    model.poke(p.x - p.w / 2);
    bumpStat('poke');
    logEvent('chọc pet');
  });
  el.stage.addEventListener('pointercancel', () => { down = null; });
  el.stage.addEventListener('contextmenu', ev => ev.preventDefault());
}

function bindControls() {
  const saved = readStore();
  if (saved.size) el.size.value = saved.size;
  el.quiet.checked = !!saved.quiet;
  el.demo.checked = false;

  el.states.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-state]');
    if (!b) return;
    stopDemo();
    el.demo.checked = false;
    if (b.dataset.state !== 'notification') model.clearNotification();
    model.setState(b.dataset.state);
    haptic(8);
  });
  el.size.addEventListener('change', () => {
    layout();
    writeStore({ size: el.size.value, profile: '' });
  });
  el.quiet.addEventListener('change', () => {
    model.quiet = el.quiet.checked;
    writeStore({ quiet: el.quiet.checked });
    if (model.quiet) hideBubble();
  });
  el.pack.addEventListener('change', () => {
    writeStore({ pack: el.pack.value });
    const url = new URL(location.href);
    url.searchParams.set('pack', el.pack.value);
    location.href = url.toString();
  });
  el.demo.addEventListener('change', () => el.demo.checked ? startDemo() : stopDemo());
  el.bubbleAction.addEventListener('click', () => {
    model.clearNotification();
    model.setState('idle');
    hideBubble();
  });
}

function startDemo() {
  const seq = ['thinking', 'working', 'working', 'attention', 'idle', 'error',
    'notification', 'idle', 'roam', 'sleeping', 'waking', 'idle'];
  demoSeq = 0;
  demoTimer = setInterval(() => {
    model.setState(seq[demoSeq % seq.length]);
    demoSeq++;
  }, 3200);
}
function stopDemo() { clearInterval(demoTimer); }

function bindLifecycle() {
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) {
      model.lastActivity = performance.now();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(rafId);
    }
  });
  window.addEventListener('resize', layout);
}

async function main() {
  await loadPacks();
  el.pack.innerHTML = packs.map(p =>
    '<option value="' + p.id + '">' + p.name + '</option>').join('');

  const saved = readStore();
  const param = new URLSearchParams(location.search).get('pack');
  const id = packs.some(p => p.id === param) ? param : (saved.pack || packs[0].id);
  el.pack.value = id;

  buildSettingsUI();
  bindStage();
  bindControls();
  bindSheet();
  bindLifecycle();
  setInterval(() => {
    if (!document.hidden) {
      const s = readStore();
      s.stats.seconds = (s.stats.seconds || 0) + 30;
      writeStore({ stats: s.stats });
    }
  }, 30000);

  try {
    await loadPack(id);
    const v = new URLSearchParams(location.search).get('v') || '1.0.0';
    el.version.textContent = 'v' + v;
    const savedSettings = readStore();
    applyName(savedSettings.name || '');
    const palParam = new URLSearchParams(location.search).get('palette');
    applyPalette(PALETTES[palParam] ? palParam : (savedSettings.palette || 'goc'));
    if (new URLSearchParams(location.search).get('sheet') === '1') openSheet(true);
    const initial = new URLSearchParams(location.search).get('state');
    if (initial && STATES.includes(initial)) model.setState(initial);
    requestAnimationFrame(draw);
    setStatus('sẵn sàng');
  } catch (err) {
    setStatus('lỗi: ' + err.message);
    el.bubbleText.textContent = 'Không tải được pet pack: ' + err.message;
    el.bubbleAction.hidden = true;
    el.bubble.hidden = false;
    console.error(err);
  }
}

main();
