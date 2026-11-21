import { PetModel, normalizePack } from './pet-engine.js';

const PACKS = {
  'may': '../app/assets/pets/may/pack.json',
  'dsh-bot': '../app/assets/pets/dsh-bot/pack.json',
};

const BUBBLES = {
  attention: 'Xong rồi! Nghỉ chút nhé.',
  error: 'Có gì đó hỏng rồi…',
  notification: 'Có việc đang chờ bạn.',
};

const el = {
  canvas: document.getElementById('canvas'),
  stage: document.getElementById('stage'),
  bubble: document.getElementById('bubble'),
  status: document.getElementById('status'),
  pack: document.getElementById('pack'),
  size: document.getElementById('size'),
  quiet: document.getElementById('quiet'),
  demo: document.getElementById('demo'),
  states: document.getElementById('states'),
};
const ctx = el.canvas.getContext('2d');

let pack = null;
let model = null;
let images = {};
let scale = 1;
let bubbleTimer = 0;

function packUrl(id) { return PACKS[id] || PACKS.may; }

async function loadPack(id) {
  const url = packUrl(id);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Không tải được ' + url);
  pack = normalizePack(await res.json());
  const base = new URL(url, location.href);
  images = {};
  const sheets = [...new Set(Object.values(pack.animations).map(a => a.sheet))];
  await Promise.all(sheets.map(name => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images[name] = img; resolve(); };
    img.onerror = () => reject(new Error('Thiếu ảnh ' + name));
    img.src = new URL(name, base).href;
  })));
  model = new PetModel(pack, { quiet: el.quiet.checked });
  model.on(onState);
  layout();
  setStatus('sẵn sàng · ' + (pack.name || pack.id));
}

function layout() {
  const dp = Number(el.size.value) || 30;
  scale = dp / Math.max(1, pack.contentBox.h);
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(pack.canvas.w * scale));
  const h = Math.max(1, Math.round(pack.canvas.h * scale));
  el.canvas.style.width = w + 'px';
  el.canvas.style.height = h + 'px';
  el.canvas.width = Math.round(w * dpr);
  el.canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = !pack.pixelArt;
  if (pack.pixelArt) ctx.imageSmoothingQuality = 'low';
  else ctx.imageSmoothingQuality = 'high';
}

function draw(now) {
  const out = model.tick(now);
  ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
  if (out) {
    const { anim, frame } = out;
    const f = anim.frames[frame];
    const img = images[anim.sheet];
    if (img && f) {
      const sx = (f.i % anim.cols) * anim.frameW;
      const sy = Math.floor(f.i / anim.cols) * anim.frameH;
      ctx.drawImage(img, sx, sy, anim.frameW, anim.frameH,
        anim.box.x * scale, anim.box.y * scale, anim.box.w * scale, anim.box.h * scale);
    }
    if (Math.random() < 0.08) {
      setStatus(model.state + ' · ' + out.name + ' · frame ' + frame);
    }
  }
  requestAnimationFrame(draw);
}

function setStatus(text) { el.status.textContent = text; }

function onState() {
  document.querySelectorAll('.states button').forEach(b => {
    b.classList.toggle('active', b.dataset.state === model.state);
  });
  if (el.quiet.checked) return;
  const text = BUBBLES[model.state];
  if (!text) { hideBubble(); return; }
  el.bubble.textContent = text;
  el.bubble.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(hideBubble, 4000);
}

function hideBubble() { el.bubble.hidden = true; }

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
    if (clicks.length >= 3) { clicks = []; model.tickle(); return; }
    model.poke(p.x - p.w / 2);
  });
  el.stage.addEventListener('pointercancel', () => { down = null; });
}

function bindControls() {
  el.states.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-state]');
    if (!b) return;
    model.setState(b.dataset.state);
    if (b.dataset.state !== 'notification') model.clearNotification();
  });
  el.size.addEventListener('change', layout);
  el.quiet.addEventListener('change', () => {
    model.quiet = el.quiet.checked;
    if (model.quiet) hideBubble();
  });
  el.pack.addEventListener('change', () => {
    const url = new URL(location.href);
    url.searchParams.set('pack', el.pack.value);
    location.href = url.toString();
  });
  el.demo.addEventListener('change', () => el.demo.checked ? startDemo() : stopDemo());
}

let demoTimer = 0;
function startDemo() {
  const seq = ['thinking', 'working', 'working', 'attention', 'idle', 'error',
    'notification', 'idle', 'roam', 'sleeping', 'waking', 'idle'];
  let i = 0;
  demoTimer = setInterval(() => {
    model.setState(seq[i % seq.length]);
    i++;
  }, 3200);
}
function stopDemo() { clearInterval(demoTimer); }

async function main() {
  const ids = Object.keys(PACKS);
  el.pack.innerHTML = ids.map(id => '<option value="' + id + '">' + id + '</option>').join('');
  const param = new URLSearchParams(location.search).get('pack');
  const id = PACKS[param] ? param : ids[0];
  el.pack.value = id;
  bindStage();
  bindControls();
  try {
    await loadPack(id);
    requestAnimationFrame(draw);
  } catch (err) {
    setStatus('lỗi: ' + err.message + ' — hãy chạy trang qua http://, không mở file://');
    console.error(err);
  }
}

main();
