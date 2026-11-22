import { PetModel, normalizePack, STATES } from './pet-engine.js';
import { buildPackFromFile, buildPackFromZip } from './pack-import.js';
import { ThrowPhysics, createStrokeDetector, spawnParticles, stepParticles } from './pet-fx.js';
import { shouldRemind, breakText } from './reminders.js';
import { replyTo, storyFor, summaryFrom, moodFor, memoryFrom, greetingFor } from './pet-chat.js';
import { todayKey, bumpStreak, questDone, clock, hostColor, batteryText } from './care.js';
import { shareUrl, pickConfig, decodeConfig, backupOf, importableBackup } from './share.js';
import { encodeGif, quantize } from './gif.js';
import { buildZip } from './zip-write.js';
import { verifyChecksums } from './pack-integrity.js';
import { applyLanguage, pick, stateText, getLang } from './i18n.js';
import { upsertHost, removeHost } from './agent-hosts.js';
import { askAI, PRESETS, friendlyAIError, buildSystemPrompt, PERSONAS, shouldGreet, aiSig, testCacheValid, estimateTokens } from './ai.js';
import { assignVariant, newSeed } from './ab.js';
import { seasonFor, SEASON_PACK } from './season.js';
import qrcode from './vendor/qrcode.mjs';
import { listPacks as listLocalPacks, getPack as getLocalPack, savePack as saveLocalPack, deletePack as deleteLocalPack } from './pack-store.js';

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
  attention: { vi: 'Xong rồi! Nghỉ chút nhé.', en: 'All done! Take a break.' },
  error: { vi: 'Có gì đó hỏng rồi…', en: 'Something went wrong…', actionVi: 'Xem log', actionEn: 'View log', viewLog: true },
  notification: { vi: 'Có việc đang chờ bạn.', en: "There's something waiting for you.", actionVi: 'Đã xử lý', actionEn: 'Mark handled' },
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
  journal: [], simple: false, autoTheme: false,
  speech: false, speechRate: 1, voiceName: '', voiceByPack: {}, breakReminder: false, breakMinutes: 45, lastBreak: 0,
  chat: [], memories: [],
  onboarded: false, streak: { count: 0, last: '' }, quest: { date: '', roam: 0 }, autoSeason: true,
  focusMinutes: 25, restMinutes: 5,
  ambientMode: 'off', ambientVolume: 0.35, showFps: false, errorLog: false, errors: [], lang: 'vi', agentHosts: [], overlayFloat: true,
  aiEndpoint: '', aiModel: '', aiKey: '', aiOn: false, aiProvider: 'openai', aiPersona: 'gentle', aiGreet: false, lastOpen: 0, userName: '', aiCalls: 0, aiTokens: 0, installId: '',
};

const el = {
  canvas: document.getElementById('canvas'),
  stage: document.getElementById('stage'),
  bubble: document.getElementById('bubble'),
  bubbleText: document.getElementById('bubbleText'),
  bubbleAction: document.getElementById('bubbleAction'),
  status: document.getElementById('status'),
  packInfo: document.getElementById('packInfo'),
  brandPet: document.getElementById('brandPet'),
  aiChip: document.getElementById('aiChip'),
  quickInput: document.getElementById('quickInput'),
  quickSend: document.getElementById('quickSend'),
  lastReply: document.getElementById('lastReply'),
  pack: document.getElementById('pack'),
  size: document.getElementById('size'),
  quiet: document.getElementById('quiet'),
  demo: document.getElementById('demo'),
  states: document.getElementById('states'),
  version: document.getElementById('version'),
  petName: document.getElementById('petName'),
  openSettings: document.getElementById('openSettings'),
  pipBtn: document.getElementById('pipBtn'),
  sheet: document.getElementById('sheet'),
  backdrop: document.getElementById('backdrop'),
  closeSheet: document.getElementById('closeSheet'),
  petNameInput: document.getElementById('petNameInput'),
  userName: document.getElementById('userName'),
  paletteChips: document.getElementById('paletteChips'),
  profiles: document.getElementById('profiles'),
  stats: document.getElementById('stats'),
  journal: document.getElementById('journal'),
  copyBackup: document.getElementById('copyBackup'),
  importBackup: document.getElementById('importBackup'),
  backupBox: document.getElementById('backupBox'),
  resetAll: document.getElementById('resetAll'),
  simpleMode: document.getElementById('simpleMode'),
  autoTheme: document.getElementById('autoTheme'),
  autoSeason: document.getElementById('autoSeason'),
  importImage: document.getElementById('importImage'),
  importFile: document.getElementById('importFile'),
  newPackName: document.getElementById('newPackName'),
  newPackStates: document.getElementById('newPackStates'),
  importedList: document.getElementById('importedList'),
  fx: document.getElementById('fx'),
  pet: document.getElementById('pet'),
  speechOn: document.getElementById('speechOn'),
  voiceSelect: document.getElementById('voiceSelect'),
  speechRate: document.getElementById('speechRate'),
  testSpeech: document.getElementById('testSpeech'),
  breakOn: document.getElementById('breakOn'),
  breakMinutes: document.getElementById('breakMinutes'),
  chatLog: document.getElementById('chatLog'),
  chatInput: document.getElementById('chatInput'),
  chatSend: document.getElementById('chatSend'),
  storyBtn: document.getElementById('storyBtn'),
  clearChat: document.getElementById('clearChat'),
  summaryBtn: document.getElementById('summaryBtn'),
  memoryList: document.getElementById('memoryList'),
  memoryInput: document.getElementById('memoryInput'),
  memoryAdd: document.getElementById('memoryAdd'),
  intro: document.getElementById('intro'),
  introStart: document.getElementById('introStart'),
  streakLine: document.getElementById('streakLine'),
  questLine: document.getElementById('questLine'),
  focusStart: document.getElementById('focusStart'),
  breakStart: document.getElementById('breakStart'),
  focusStop: document.getElementById('focusStop'),
  timerLine: document.getElementById('timerLine'),
  shareConfig: document.getElementById('shareConfig'),
  ambientMode: document.getElementById('ambientMode'),
  ambientVolume: document.getElementById('ambientVolume'),
  openRoadmap: document.getElementById('openRoadmap'),
  agentUrl: document.getElementById('agentUrl'),
  agentStart: document.getElementById('agentStart'),
  agentStop: document.getElementById('agentStop'),
  agentLine: document.getElementById('agentLine'),
  agentChip: document.getElementById('agentChip'),
  aiPersona: document.getElementById('aiPersona'),
  aiProvider: document.getElementById('aiProvider'),
  aiEndpoint: document.getElementById('aiEndpoint'),
  aiModel: document.getElementById('aiModel'),
  aiKey: document.getElementById('aiKey'),
  aiOn: document.getElementById('aiOn'),
  aiGreet: document.getElementById('aiGreet'),
  aiTest: document.getElementById('aiTest'),
  aiRetest: document.getElementById('aiRetest'),
  aiClearKey: document.getElementById('aiClearKey'),
  aiStatus: document.getElementById('aiStatus'),
  aiUsage: document.getElementById('aiUsage'),
  agentHosts: document.getElementById('agentHosts'),
  saveHost: document.getElementById('saveHost'),
  batteryChip: document.getElementById('batteryChip'),
  fpsChip: document.getElementById('fpsChip'),
  moodMenu: document.getElementById('moodMenu'),
  showFps: document.getElementById('showFps'),
  errorLog: document.getElementById('errorLog'),
  errorList: document.getElementById('errorList'),
  experimentLine: document.getElementById('experimentLine'),
  stateCollection: document.getElementById('stateCollection'),
  exportPng: document.getElementById('exportPng'),
  exportGif: document.getElementById('exportGif'),
  shareQr: document.getElementById('shareQr'),
  qrModal: document.getElementById('qrModal'),
  qrCanvas: document.getElementById('qrCanvas'),
  qrUrl: document.getElementById('qrUrl'),
  qrSave: document.getElementById('qrSave'),
  giftPack: document.getElementById('giftPack'),
  zipUrl: document.getElementById('zipUrl'),
  zipLoad: document.getElementById('zipLoad'),
  langSel: document.getElementById('lang'),
  overlayStart: document.getElementById('overlayStart'),
  overlaySize: document.getElementById('overlaySize'),
  overlayFloat: document.getElementById('overlayFloat'),
  overlayStop: document.getElementById('overlayStop'),
  openAod: document.getElementById('openAod'),
  openWallpaper: document.getElementById('openWallpaper'),
  openWheel: document.getElementById('openWheel'),
  wheel: document.getElementById('wheel'),
  openMarket: document.getElementById('openMarket'),
  marketModal: document.getElementById('marketModal'),
  marketGrid: document.getElementById('marketGrid'),
  marketClose: document.getElementById('marketClose'),
  templatePack: document.getElementById('templatePack'),
  openGallery: document.getElementById('openGallery'),
  galleryModal: document.getElementById('galleryModal'),
  galleryGrid: document.getElementById('galleryGrid'),
  galleryClose: document.getElementById('galleryClose'),
  qrClose: document.getElementById('qrClose'),
};
const ctx = el.canvas.getContext('2d');

let builtinPacks = FALLBACK_PACKS;
let localPacks = [];
let packs = FALLBACK_PACKS;
let objectUrls = [];
let pack = null;
let model = null;
let images = {};
let scale = 1;
let bubbleTimer = 0;
let rafId = 0;
let running = true;
let demoSeq = 0;
let demoTimer = 0;

const fxCtx = el.fx.getContext('2d');
let fxW = 1, fxH = 1, fxDpr = 1;
let particles = [];
let thrower = null;
let look = { x: 0, y: 0, tx: 0, ty: 0 };
let squash = 1;
let prevDraw = null;
let lastDraw = null;
let lastDrawKey = '';
let fadeStart = 0;
let lastFrameTime = 0;
let pokeTimes = [];
const strokeDetector = createStrokeDetector({ reversals: 3, windowMs: 1400 });

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
function writeStore(patch, opts = {}) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...readStore(), ...patch }));
    if (opts.render !== false) renderSheet();
  } catch {}
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
  renderChat();
  renderMemories();
  renderErrors();
  renderCare();
  el.stats.innerHTML =
    '<span><b>' + (s.stats.poke || 0) + '</b> ' + pick('lần chọc', 'pokes') + '</span>'
    + '<span><b>' + (s.stats.tickle || 0) + '</b> ' + pick('lần cù', 'tickles') + '</span>'
    + '<span><b>' + minutes + '</b> ' + pick('phút bên pet', 'min with pet') + '</span>'
    + '<span><b>' + seen + '</b> ' + pick('trạng thái đã thấy', 'states seen') + '</span>';
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

function applySimple(on) {
  document.body.classList.toggle('simple', !!on);
  el.simpleMode.checked = !!on;
}
function paletteForNow() {
  const hour = new Date().getHours();
  return (hour >= 20 || hour < 6) ? 'tim' : 'goc';
}
function applyAutoTheme(on, savedPalette) {
  el.autoTheme.checked = !!on;
  applyPalette(on ? paletteForNow() : (savedPalette || 'goc'));
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
  el.bubbleText.textContent = pick(conf.vi, conf.en);
  const action = pick(conf.actionVi, conf.actionEn);
  el.bubbleAction.hidden = !action;
  el.bubbleAction.textContent = action || '';
  el.bubbleAction.dataset.viewLog = conf.viewLog ? '1' : '';
  el.bubble.hidden = false;
  speak(conf.text);
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(hideBubble, 5000);
}
function hideBubble() { el.bubble.hidden = true; }

function voices() {
  try { return window.speechSynthesis ? window.speechSynthesis.getVoices() : []; }
  catch { return []; }
}

function fillVoices() {
  if (!el.voiceSelect) return;
  const saved = readStore().voiceName || '';
  el.voiceSelect.innerHTML = '<option value="">' + pick('Giọng mặc định', 'Default voice') + '</option>'
    + voices().map(v => '<option value="' + v.name + '">' + v.name + ' (' + v.lang + ')</option>').join('');
  el.voiceSelect.value = saved;
}

function speak(text, force = false) {
  if (!text || !window.speechSynthesis || (!force && !readStore().speech)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const s = readStore();
    u.rate = Math.max(0.5, Math.min(2, Number(s.speechRate) || 1));
    const voice = voices().find(v => v.name === s.voiceName);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    window.speechSynthesis.speak(u);
  } catch (err) { console.warn('speak lỗi', err); }
}

function applySpeechSettings() {
  const s = readStore();
  el.speechOn.checked = !!s.speech;
  el.speechRate.value = s.speechRate || 1;
  el.breakOn.checked = !!s.breakReminder;
  el.breakMinutes.value = s.breakMinutes || 45;
  if (el.voiceSelect.options.length > 1) el.voiceSelect.value = s.voiceName || '';
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function renderChat() {
  if (!el.chatLog) return;
  const s = readStore();
  el.chatLog.innerHTML = s.chat.slice(-8).map(m =>
    '<p class="' + m.role + '">' + escapeHtml(m.text) + '</p>').join('');
  el.chatLog.scrollTop = el.chatLog.scrollHeight;
}

function renderMemories() {
  if (!el.memoryList) return;
  const s = readStore();
  el.memoryList.innerHTML = s.memories.map((text, i) =>
    '<li><span>' + escapeHtml(text) + '</span><button data-memory="' + i + '">Bỏ</button></li>').join('');
}

function pushChat(role, text) {
  const s = readStore();
  s.chat = [...s.chat, { role, text, t: Date.now() }].slice(-20);
  writeStore({ chat: s.chat });
  renderChat();
}

function petSay(text, opts = {}) {
  if (opts.chat !== false) pushChat('pet', text);
  if (!el.quiet.checked) {
    el.bubbleText.textContent = text;
    el.bubbleAction.hidden = true;
    el.bubble.hidden = false;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, 6000);
  }
  speak(text);
}

function maybeDailyGreet() {
  const s = readStore();
  if (s.aiOn && s.aiGreet) return;
  const day = todayKey();
  if (s.lastGreetDay === day) return;
  writeStore({ lastGreetDay: day });
  setTimeout(() => petSay(greetingFor(new Date().getHours(), getLang()), { chat: false }), 1200);
}

function maybeAIGreet() {
  const s = readStore();
  const now = Date.now();
  const greet = s.aiOn && s.aiGreet && s.aiEndpoint && s.aiModel && shouldGreet(s.lastOpen, now);
  writeStore({ lastOpen: now });
  if (!greet) return;
  setTimeout(async () => {
    try {
      const reply = await askAI(aiConfig(s), [
        { role: 'system', content: aiSystemPrompt(s) },
        { role: 'user', content: 'Chào người dùng một câu thật ngắn, dựa trên thời gian trong ngày và trạng thái của bạn.' },
      ]);
      petSay(reply);
    } catch (err) {
      console.warn('greet failed', err);
    }
  }, 1600);
}

let aiBusy = false;
let aiIgnore = false;
let aiSlowTimer = 0;

function renderAiUsage() {
  if (!el.aiUsage) return;
  const s = readStore();
  el.aiUsage.textContent = (s.aiCalls || 0) + pick(' lần gọi · ~', ' calls · ~') + (s.aiTokens || 0) + pick(' token (ước lượng)', ' tokens (approx)');
}

function bumpAiUsage(promptText, replyText) {
  const s = readStore();
  writeStore({
    aiCalls: (s.aiCalls || 0) + 1,
    aiTokens: (s.aiTokens || 0) + estimateTokens(promptText) + estimateTokens(replyText),
  }, { render: false });
  renderAiUsage();
}

function aiConfig(s) {
  return { provider: s.aiProvider || 'openai', endpoint: s.aiEndpoint || '', model: s.aiModel || '', key: s.aiKey || '' };
}

function aiSystemPrompt(s) {
  return buildSystemPrompt({
    name: s.name || (pack && pack.name) || 'pet',
    persona: s.aiPersona || 'gentle',
    memories: s.memories || [],
    userName: s.userName || '',
    state: model ? stateText(model.state) : '',
    hour: new Date().getHours(),
  });
}

async function sendChat(text) {
  const t = (text || '').trim();
  if (!t) return;
  pushChat('user', t);
  const s = readStore();
  const memory = memoryFrom(t);
  if (memory && !s.memories.includes(memory)) {
    writeStore({ memories: [...s.memories, memory].slice(-10) });
    s.memories = [...s.memories, memory].slice(-10);
    renderMemories();
    logEvent('pet nhớ: ' + memory);
  }
  if (s.aiOn && s.aiEndpoint && s.aiModel) {
    if (aiBusy) {
      aiIgnore = true;
      aiBusy = false;
      clearTimeout(aiSlowTimer);
      if (el.quickSend) el.quickSend.disabled = false;
      setStatus(pick('đã bỏ qua trả lời AI', 'skipped the AI reply'));
      return;
    }
    aiBusy = true;
    aiIgnore = false;
    aiSlowTimer = setTimeout(() => setStatus(pick('AI vẫn đang xử lý…', 'AI is still working…')), 12000);
    if (el.quickSend) el.quickSend.disabled = true;
    if (el.aiStatus) el.aiStatus.textContent = 'đang gọi AI…';
    setStatus('AI đang trả lời…');
    model.setState('thinking');
    try {
      const history = [
        { role: 'system', content: aiSystemPrompt(s) },
        ...s.chat.slice(-4).map(m => ({ role: m.role === 'pet' ? 'assistant' : 'user', content: m.text })),
      ];
      const reply = await askAI(aiConfig(s), history);
      petSay(reply);
      if (el.aiStatus) el.aiStatus.textContent = 'AI trả lời OK';
      bumpAiUsage(JSON.stringify(history), reply);
      setStatus(pick('sẵn sàng', 'ready'));
      const mood = moodFor(reply) || moodFor(t);
      if (mood) setTimeout(() => model.setState(mood), 400);
      else setTimeout(() => model.setState('attention'), 300);
      logEvent('chat AI: ' + s.aiModel);
      clearTimeout(aiSlowTimer);
      aiBusy = false;
      if (aiIgnore) { aiIgnore = false; return; }
      if (el.quickSend) el.quickSend.disabled = false;
      return;
    } catch (err) {
      console.error(err);
      clearTimeout(aiSlowTimer);
      aiBusy = false;
      if (aiIgnore) { aiIgnore = false; return; }
      if (el.quickSend) el.quickSend.disabled = false;
      const friendly = friendlyAIError(err);
      if (el.aiStatus) el.aiStatus.textContent = 'lỗi: ' + friendly;
      setStatus('AI lỗi (' + friendly + '), dùng trả lời offline');
    }
  }
  const reply = replyTo(t, { lang: getLang(),
    petName: s.name || (pack && pack.name) || 'pet',
    memories: s.memories,
    you: s.userName || 'bạn',
  });
  petSay(reply);
  if (el.lastReply) { el.lastReply.textContent = reply; el.lastReply.hidden = false; }
  const mood = moodFor(t);
  if (mood) {
    setTimeout(() => model.setState(mood), 700);
    logEvent('cảm xúc theo tin nhắn: ' + mood);
  }
  logEvent('trò chuyện với pet');
}

function addMemory() {
  const text = (el.memoryInput.value || '').trim().slice(0, 60);
  if (!text) return;
  const s = readStore();
  if (s.memories.includes(text)) return;
  writeStore({ memories: [...s.memories, text].slice(-10) });
  el.memoryInput.value = '';
  renderMemories();
  petSay('Mình nhớ rồi: ' + text, { chat: false });
}

let focusMode = 'idle';
let focusEnds = 0;
let focusTimer = 0;

function renderCare() {
  if (!el.streakLine) return;
  const s = readStore();
  el.streakLine.innerHTML = pick('Chuỗi: ', 'Streak: ') + '<b>' + (s.streak.count || 0) + pick(' ngày</b>', ' days</b>');
  const roam = s.quest.date === todayKey() ? s.quest.roam || 0 : 0;
  el.questLine.innerHTML = pick('Đi dạo hôm nay: ', 'Walks today: ') + '<b>' + Math.min(roam, 3) + '/3</b>'
    + (questDone(roam, 3) ? ' ✓' : '');
  el.timerLine.textContent = focusMode === 'idle'
    ? pick('chưa chạy', 'not running')
    : (focusMode === 'focus' ? pick('Tập trung ', 'Focus ') : pick('Nghỉ ', 'Break ')) + clock(focusEnds - Date.now());
}

function stopFocus() {
  clearInterval(focusTimer);
  focusTimer = 0;
  focusMode = 'idle';
  focusEnds = 0;
  renderCare();
}

function tickFocus() {
  if (focusMode === 'idle') return;
  const left = focusEnds - Date.now();
  el.timerLine.textContent = (focusMode === 'focus' ? 'Tập trung ' : 'Nghỉ ') + clock(left);
  if (left > 0) return;
  if (focusMode === 'focus') {
    petSay('Hết ' + readStore().focusMinutes + ' phút tập trung. Nghỉ ' + readStore().restMinutes + ' phút nhé.', { chat: false });
    startMinuteTimer('break', readStore().restMinutes);
  } else {
    petSay('Nghỉ xong rồi. Mình tiếp tục nhé!', { chat: false });
    stopFocus();
  }
}

function startMinuteTimer(mode, minutes) {
  clearInterval(focusTimer);
  focusMode = mode;
  focusEnds = Date.now() + Math.max(1, minutes) * 60000;
  model.setState(mode === 'focus' ? 'working' : 'attention');
  renderCare();
  focusTimer = setInterval(tickFocus, 1000);
  tickFocus();
}

function applyStreak() {
  const s = readStore();
  const today = todayKey();
  const streak = bumpStreak(s.streak, today);
  const quest = s.quest.date === today ? s.quest : { date: today, roam: 0 };
  writeStore({ streak, quest });
}

function maybeIntro() {
  const params = new URLSearchParams(location.search);
  const demo = params.has('agent') || params.has('fx') || params.get('chat') === 'demo'
    || params.get('export') === '1' || params.get('gif') === '1' || params.get('pip') === '1'
    || params.has('pack') || params.has('overlay') || params.get('intro') === '0';
  const force = params.get('intro') === '1';
  const s = readStore();
  if (demo) return;
  if (!force && s.onboarded) return;
  el.intro.hidden = false;
}

async function initBattery() {
  if (!navigator.getBattery) return;
  try {
    const battery = await navigator.getBattery();
    const render = () => {
      el.batteryChip.textContent = batteryText(battery.level, battery.charging, getLang());
      el.batteryChip.hidden = false;
    };
    render();
    battery.addEventListener('levelchange', render);
    battery.addEventListener('chargingchange', render);
  } catch (err) {
    console.warn('battery lỗi', err);
  }
}

function checkBreak() {
  const s = readStore();
  if (!s.breakReminder || !s.lastBreak) return;
  if (!shouldRemind(s.lastBreak, Date.now(), s.breakMinutes)) return;
  writeStore({ lastBreak: Date.now() });
  model.setState('attention');
  el.bubbleText.textContent = breakText(s.breakMinutes, getLang());
  el.bubbleAction.hidden = true;
  el.bubble.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(hideBubble, 9000);
  spawnFx('sparkles');
  squash = 0.85;
  speak(el.bubbleText.textContent);
  logEvent('nhắc đứng dậy');
}

function haptic(ms = 8) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

async function loadPacks() {
  try {
    const res = await fetch('./packs.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.packs) && data.packs.length) builtinPacks = data.packs;
    }
  } catch { /* dùng danh sách mặc định */ }
  try {
    const records = await listLocalPacks();
    localPacks = records.map(rec => ({
      id: rec.id,
      name: (rec.pack && rec.pack.name) || rec.id,
      local: true,
      frames: rec.frames || 0,
    }));
  } catch (err) {
    console.warn('không đọc được pack đã nhập', err);
    localPacks = [];
  }
  packs = [...builtinPacks, ...localPacks];
}

function renderPackOptions() {
  el.pack.innerHTML = packs.map(p =>
    '<option value="' + p.id + '">' + (p.local ? '★ ' : '') + p.name + '</option>').join('');
  if (model) el.pack.value = pack ? pack.id : el.pack.value;
}

function renderImported() {
  if (!el.importedList) return;
  el.importedList.innerHTML = localPacks.map(p =>
    '<li><span>' + p.name + '</span>'
    + '<button data-remove="' + p.id + '">Xoá</button></li>').join('');
}

async function loadPack(id) {
  const loadStarted = performance.now();
  const entry = packs.find(p => p.id === id) || packs[0];
  document.body.classList.add('loading');
  setTimeout(() => document.body.classList.remove('loading'), 8000);
  setStatus(pick('đang tải ' + entry.id + '…', 'loading ' + entry.id + '…'));
  const voiceMap = readStore().voiceByPack || {};
  const nextVoice = voiceMap[entry.id] || '';
  writeStore({ voiceName: nextVoice });
  if (el.voiceSelect) el.voiceSelect.value = nextVoice;
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls = [];
  let json;
  const sheetSrc = {};
  if (entry.local) {
    const rec = await getLocalPack(entry.id);
    if (!rec || !rec.pack) throw new Error('pack đã nhập bị thiếu');
    json = rec.pack;
    for (const name of sheetNames(json)) {
      const blob = rec.files && rec.files[name];
      if (!blob) throw new Error('thiếu ảnh ' + name);
      const url = URL.createObjectURL(blob);
      objectUrls.push(url);
      sheetSrc[name] = url;
    }
  } else {
    const res = await fetch(entry.url);
    if (!res.ok) throw new Error('không tải được ' + entry.url);
    json = await res.json();
    const base = new URL(entry.url, location.href);
    for (const name of sheetNames(json)) sheetSrc[name] = new URL(name, base).href;
  }
  pack = normalizePack(json);
  images = {};
  sheetSources = sheetSrc;
  const saved = readStore();
  model = new PetModel(pack, { quiet: saved.quiet ?? false });
  model.on(onState);
  const firstAnim = pack.animations[pack.states[model.state] && pack.states[model.state][0]]
    || Object.values(pack.animations)[0];
  if (firstAnim) {
    const img = ensureSheet(firstAnim.sheet);
    if (img && !img.complete) {
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 1500);
      });
    }
  }
  el.packInfo.textContent = (pack.name || pack.id) + ' · ' + pack.canvas.w + '×' + pack.canvas.h
    + ' · ' + Object.keys(pack.animations).length + ' animation';
  el.pack.value = pack.id;
  if (el.brandPet) el.brandPet.textContent = (saved.name || pack.name || pack.id);
  renderImported();
  layout();
  document.body.classList.remove('loading');
  const cost = Math.round(performance.now() - loadStarted);
  if (cost > 600) logEvent('tải ' + entry.id + ' mất ' + cost + 'ms');
  setTimeout(() => {
    try {
      const names = new Set();
      Object.values(pack.states || {}).forEach(list => (list || []).forEach(name => {
        const anim = pack.animations[name];
        if (anim && anim.sheet) names.add(anim.sheet);
      }));
      names.forEach(name => ensureSheet(name));
    } catch (err) { console.warn('preload lỗi', err); }
  }, 1500);
}

function sheetNames(json) {
  return [...new Set(Object.values(json.animations || {}).map(a => a.sheet))];
}

async function saveImported(built) {
  const check = await verifyChecksums(built.pack, built.files);
  if (!check.ok) throw new Error('checksum lỗi: ' + check.bad);
  if (builtinPacks.some(p => p.id === built.pack.id)) {
    built.pack.id = 'user-' + built.pack.id;
  }
  await saveLocalPack({
    id: built.pack.id, created: Date.now(),
    pack: built.pack, files: built.files, frames: built.frames,
  });
  logEvent('nhập pet ' + built.pack.name);
  await loadPacks();
  renderPackOptions();
  writeStore({ pack: built.pack.id });
  await loadPack(built.pack.id);
  setStatus('đã nhập ' + built.pack.name + ' · ' + built.frames + ' khung');
  haptic(14);
}

const EDITOR_STATES = ['idle', 'thinking', 'working', 'attention', 'error', 'notification', 'sleeping', 'waking', 'roam'];

function renderStatePicks() {
  if (!el.newPackStates) return;
  el.newPackStates.innerHTML = EDITOR_STATES.map(st =>
    '<label><input type="checkbox" value="' + st + '"' + (st === 'idle' ? ' checked' : '') + '>'
    + escapeHtml(stateText(st)) + '</label>').join('');
}

async function importImageFile(file) {
  if (!file) return;
  setStatus('đang xử lý ' + file.name + '…');
  haptic(10);
  try {
    const name = (el.newPackName && el.newPackName.value || '').trim();
    const states = el.newPackStates
      ? [...el.newPackStates.querySelectorAll('input:checked')].map(i => i.value)
      : ['idle'];
    await saveImported(await buildPackFromFile(file, { name, states }));
    if (el.newPackName) el.newPackName.value = '';
  } catch (err) {
    console.error(err);
    setStatus('nhập ảnh lỗi: ' + err.message);
  }
}

async function importZipUrl(url) {
  const target = (url || '').trim();
  if (!target || !/^(https?:\/\/|\.{0,2}\/)/.test(target)) {
    setStatus('link phải là https:// hoặc đường dẫn trong app');
    return;
  }
  setStatus('đang tải pack…');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(target, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const length = Number(res.headers.get('content-length') || 0);
    if (length > 8 * 1024 * 1024) throw new Error('tệp quá lớn');
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 8 * 1024 * 1024) throw new Error('tệp quá lớn');
    await saveImported(await buildPackFromZip(buffer));
  } catch (err) {
    console.error(err);
    setStatus('tải pack lỗi: ' + err.message);
  }
}

async function importZipFile(file) {
  if (!file) return;
  setStatus('đang mở ' + file.name + '…');
  haptic(10);
  try {
    await saveImported(await buildPackFromZip(await file.arrayBuffer()));
  } catch (err) {
    console.error(err);
    setStatus('nhập zip lỗi: ' + err.message);
  }
}

async function removeImported(id) {
  if (!confirm('Xoá pet đã nhập này?')) return;
  await deleteLocalPack(id);
  logEvent('xoá pet đã nhập');
  const wasCurrent = pack && pack.id === id;
  await loadPacks();
  renderPackOptions();
  renderImported();
  if (wasCurrent) {
    const first = builtinPacks[0];
    el.pack.value = first.id;
    writeStore({ pack: first.id });
    await loadPack(first.id);
  }
}

async function demoZipImport() {
  try {
    setStatus('đang mở zip mẫu…');
    const res = await fetch('./test-fixtures/mini-pack.zip');
    if (!res.ok) throw new Error('không tải được zip mẫu');
    await saveImported(await buildPackFromZip(await res.arrayBuffer()));
  } catch (err) {
    console.error(err);
    setStatus('zip mẫu lỗi: ' + err.message);
  }
}

async function demoImport() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(48, 52, 8, 48, 52, 44);
  grad.addColorStop(0, '#7fd0ff');
  grad.addColorStop(1, '#1a6fd4');
  g.fillStyle = grad;
  g.beginPath(); g.arc(48, 52, 38, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0b1a2e';
  g.beginPath(); g.arc(37, 46, 5, 0, Math.PI * 2); g.arc(59, 46, 5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(35, 44, 1.8, 0, Math.PI * 2); g.arc(57, 44, 1.8, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#0b1a2e'; g.lineWidth = 2.5;
  g.beginPath(); g.arc(48, 58, 8, 0.2, Math.PI - 0.2); g.stroke();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  await importImageFile(new File([blob], 'demo-pet.png', { type: 'image/png' }));
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
  resizeFx();
}

let fpsFrames = 0;
let fpsSince = 0;

function renderErrors() {
  if (!el.errorList) return;
  const errors = readStore().errors || [];
  el.errorList.innerHTML = errors.map(e => '<p>' + escapeHtml(e.text) + '</p>').join('');
}

function recordError(text) {
  if (!readStore().errorLog) return;
  const s = readStore();
  s.errors = [{ t: Date.now(), text: String(text).slice(0, 200) }, ...(s.errors || [])].slice(0, 10);
  writeStore({ errors: s.errors });
  renderErrors();
}

function installErrorHooks() {
  window.addEventListener('error', ev => recordError('JS: ' + (ev.message || ev.error)));
  window.addEventListener('unhandledrejection', ev => recordError('Promise: ' + (ev.reason && ev.reason.message || ev.reason)));
}

let lastFrameKey = '';
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resizeFx() {
  const rect = el.stage.getBoundingClientRect();
  fxW = Math.max(1, rect.width);
  fxH = Math.max(1, rect.height);
  fxDpr = Math.min(window.devicePixelRatio || 1, 2.5);
  el.fx.width = Math.round(fxW * fxDpr);
  el.fx.height = Math.round(fxH * fxDpr);
  fxCtx.setTransform(fxDpr, 0, 0, fxDpr, 0, 0);
}

function petCenter() {
  const pet = el.canvas.getBoundingClientRect();
  const stage = el.stage.getBoundingClientRect();
  return {
    x: pet.left - stage.left + pet.width / 2,
    y: pet.top - stage.top + pet.height * 0.45,
  };
}
function spawnFx(kind) {
  const c = petCenter();
  particles.push(...spawnParticles(kind, c.x, c.y).map(p => ({ ...p, kind })));
}
let sheetSources = {};

function ensureSheet(name) {
  if (!name || !sheetSources[name]) return null;
  if (!images[name]) {
    const img = new Image();
    img.decoding = 'async';
    img.src = sheetSources[name];
    images[name] = img;
  }
  return images[name];
}

let pathMode = false;
let walkTarget = null;
let walkPos = { x: 0, y: 0 };

function applyPetTransform() {
  const tx = look.x + (thrower ? thrower.x : 0) + walkPos.x;
  const ty = look.y + (thrower ? thrower.y : 0) + walkPos.y;
  el.pet.style.transform = 'translateY(-26px) translate(' + tx.toFixed(2) + 'px, ' + ty.toFixed(2)
    + 'px) scale(' + (1 + (1 - squash) * 0.55).toFixed(3) + ', ' + squash.toFixed(3) + ')';
}
function drawFrame(anim, frame, alpha) {
  const f = anim && anim.frames ? anim.frames[frame] : null;
  const img = anim ? (images[anim.sheet] || ensureSheet(anim.sheet)) : null;
  if (!f || !img || !img.width) {
    lastDrawKey = '';
    return;
  }
  const sx = (f.i % anim.cols) * anim.frameW;
  const sy = Math.floor(f.i / anim.cols) * anim.frameH;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, anim.frameW, anim.frameH,
    anim.box.x * scale, anim.box.y * scale, anim.box.w * scale, anim.box.h * scale);
  ctx.globalAlpha = 1;
}
function drawFx() {
  fxCtx.clearRect(0, 0, fxW, fxH);
  for (const p of particles) {
    const a = Math.max(0, Math.min(1, p.life / p.max));
    fxCtx.globalAlpha = a;
    if (p.kind === 'zzz') {
      fxCtx.fillStyle = '#9fc6ff';
      fxCtx.font = '600 ' + (8 + p.size) + 'px system-ui, sans-serif';
      fxCtx.fillText('z', p.x, p.y);
    } else if (p.kind === 'hearts') {
      fxCtx.fillStyle = '#ff7d9c';
      fxCtx.save();
      fxCtx.translate(p.x, p.y);
      fxCtx.scale(p.size / 8, p.size / 8);
      fxCtx.beginPath();
      fxCtx.moveTo(0, 3);
      fxCtx.bezierCurveTo(-6, -4, -4, -8, 0, -3);
      fxCtx.bezierCurveTo(4, -8, 6, -4, 0, 3);
      fxCtx.fill();
      fxCtx.restore();
    } else {
      fxCtx.fillStyle = '#ffd479';
      fxCtx.save();
      fxCtx.translate(p.x, p.y);
      const s = p.size / 2;
      fxCtx.beginPath();
      fxCtx.moveTo(0, -s); fxCtx.lineTo(s * 0.35, -s * 0.35);
      fxCtx.lineTo(s, 0); fxCtx.lineTo(s * 0.35, s * 0.35);
      fxCtx.lineTo(0, s); fxCtx.lineTo(-s * 0.35, s * 0.35);
      fxCtx.lineTo(-s, 0); fxCtx.lineTo(-s * 0.35, -s * 0.35);
      fxCtx.closePath(); fxCtx.fill();
      fxCtx.restore();
    }
  }
  fxCtx.globalAlpha = 1;
}

function draw(now) {
  if (!running) return;
  fpsFrames += 1;
  if (now - fpsSince >= 1000) {
    if (readStore().showFps) {
      el.fpsChip.textContent = Math.round(fpsFrames * 1000 / (now - fpsSince)) + ' fps';
      el.fpsChip.hidden = false;
    }
    fpsFrames = 0;
    fpsSince = now;
  }
  const dt = Math.min(60, lastFrameTime ? now - lastFrameTime : 16);
  lastFrameTime = now;
  const out = model.tick(now);

  if (thrower) {
    thrower.step(dt / 1000);
    if (thrower.settled) thrower = null;
  }
  look.x += (look.tx - look.x) * 0.12;
  look.y += (look.ty - look.y) * 0.12;
  squash += (1 - squash) * 0.16;
  if (walkTarget) {
    const dx = walkTarget.x - walkPos.x;
    const dy = walkTarget.y - walkPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) {
      walkTarget = null;
    } else {
      walkPos.x += (dx / dist) * 2.2;
      walkPos.y += (dy / dist) * 2.2;
    }
  }
  applyPetTransform();
  stepParticles(particles, dt);
  drawFx();
  if (walkTarget) {
    fxCtx.save();
    fxCtx.strokeStyle = 'rgba(150,200,255,.6)';
    fxCtx.setLineDash([4, 4]);
    fxCtx.beginPath();
    fxCtx.moveTo(el.canvas.width / 2, el.canvas.height * 0.7);
    fxCtx.lineTo(el.canvas.width / 2 + walkTarget.x, el.canvas.height * 0.7 + walkTarget.y);
    fxCtx.stroke();
    fxCtx.restore();
  }

  const frameIndex = out ? (reduceMotion ? 0 : out.frame) : 0;
  const key = out ? out.name + ':' + frameIndex : '';
  if (key !== lastFrameKey) {
    if (lastDraw) prevDraw = lastDraw;
    fadeStart = now;
    lastFrameKey = key;
  }
  const fade = prevDraw ? Math.min(1, (now - fadeStart) / 160) : 1;
  if (prevDraw && fade >= 1) prevDraw = null;

  if (key !== lastDrawKey || fade < 1) {
    ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
    if (prevDraw && fade < 1) drawFrame(prevDraw.anim, prevDraw.frame, 1 - fade);
    if (out) drawFrame(out.anim, frameIndex, fade);
    lastDraw = out ? { anim: out.anim, frame: frameIndex } : null;
    lastDrawKey = key;
  }
  rafId = requestAnimationFrame(draw);
}

function onState() {
  document.querySelectorAll('.states button').forEach(b => {
    b.classList.toggle('active', b.dataset.state === model.state);
  });
  showBubble(model.state);
  const st = model.state;
  if (window.AndroidPet && typeof window.AndroidPet.updateWidget === 'function') {
    try { window.AndroidPet.updateWidget(stateText(st)); } catch (err) { console.warn(err); }
  }
  const stats = readStore().stats;
  if (!stats.states[st]) {
    stats.states[st] = 1;
    writeStore({ stats });
  }
  if (st === 'roam') {
    const s = readStore();
    const today = todayKey();
    const quest = s.quest.date === today ? s.quest : { date: today, roam: 0 };
    quest.roam = (quest.roam || 0) + 1;
    writeStore({ quest });
    renderCare();
  }
  if (document.hidden && window.AndroidPet && window.AndroidPet.notify
      && (st === 'attention' || st === 'error' || st === 'notification')) {
    const text = st === 'attention' ? 'Xong việc rồi!' : st === 'error' ? 'Có lỗi xảy ra' : 'Có việc đang chờ bạn';
    try { window.AndroidPet.notify('Pet Studio', text); } catch (err) { console.warn(err); }
  }
  if (st === 'attention') { spawnFx('sparkles'); squash = 0.86; logEvent('pet vừa xong việc'); }
  else if (st === 'sleeping') { spawnFx('zzz'); logEvent('pet đi ngủ'); }
  else if (st === 'error') { squash = 0.9; logEvent('pet gặp lỗi'); }
  else if (st === 'notification') logEvent('có việc đang chờ bạn');
}

const EN_PALETTE = { goc: 'Original', bang: 'Ice', sanho: 'Coral', chanh: 'Lime', tim: 'Purple' };
const EN_PROFILE = { work: 'Work', chill: 'Relax', night: 'Night' };

function buildSettingsUI() {
  renderStatePicks();
  el.paletteChips.innerHTML = Object.entries(PALETTES).map(([key, conf]) =>
    '<button data-palette="' + key + '">' + pick(conf.label, EN_PALETTE[key]) + '</button>').join('');
  el.profiles.innerHTML = Object.entries(PROFILES).map(([key, conf]) =>
    '<button data-profile="' + key + '">' + pick(conf.label, EN_PROFILE[key]) + '</button>').join('');
}

async function copyBackup() {
  const text = JSON.stringify(backupOf(readStore()), null, 2);
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
    writeStore(importableBackup(data));
    logEvent('khôi phục từ bản sao lưu');
    location.reload();
  } catch (err) {
    setStatus('JSON không hợp lệ: ' + err.message);
  }
}

function resetAll() {
  if (!confirm(pick('Xoá toàn bộ dữ liệu và cài đặt? Không hoàn tác được.', 'Erase all data and settings? This cannot be undone.'))) return;
  if (!confirm('Xoá toàn bộ cài đặt và nhật ký của Pet Studio?')) return;
  try { localStorage.removeItem(STORE_KEY); } catch {}
  location.reload();
}

window.__setPip = on => document.body.classList.toggle('pip', !!on);
window.__setQuiet = on => {
  el.quiet.checked = !!on;
  if (model) model.quiet = !!on;
  writeStore({ quiet: !!on });
  if (on) hideBubble();
};

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(bin);
}

function exportGif() {
  try {
    const anim = (lastDraw && lastDraw.anim) || pickStateAnim(pack, model.state);
    if (!anim) throw new Error('chưa có animation');
    const scale = Math.min(2, 256 / Math.max(pack.canvas.w, pack.canvas.h));
    const w = Math.max(1, Math.round(pack.canvas.w * scale));
    const h = Math.max(1, Math.round(pack.canvas.h * scale));
    const frames = [];
    for (const f of anim.frames.slice(0, 24)) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = !pack.pixelArt;
      const img = images[anim.sheet];
      const sx = (f.i % anim.cols) * anim.frameW;
      const sy = Math.floor(f.i / anim.cols) * anim.frameH;
      g.drawImage(img, sx, sy, anim.frameW, anim.frameH,
        anim.box.x * scale, anim.box.y * scale, anim.box.w * scale, anim.box.h * scale);
      const data = g.getImageData(0, 0, w, h).data;
      frames.push({ width: w, height: h, indices: quantize(data, w, h), delay: f.ms });
    }
    const bytes = encodeGif(frames, { width: w, height: h });
    const b64 = bytesToBase64(bytes);
    if (window.AndroidPet && typeof window.AndroidPet.saveGif === 'function') {
      window.AndroidPet.saveGif(b64, 'pet-studio-' + Date.now() + '.gif');
      setStatus('đã lưu GIF vào Download/DSH-Go');
    } else {
      const link = document.createElement('a');
      link.href = 'data:image/gif;base64,' + b64;
      link.download = 'pet-studio.gif';
      link.click();
      setStatus('đã xuất GIF');
    }
    logEvent('xuất GIF');
  } catch (err) {
    console.error(err);
    setStatus('xuất GIF lỗi: ' + err.message);
  }
}

let ambientCtx = null;
let ambientNodes = null;

function stopAmbient() {
  if (ambientNodes) {
    try {
      ambientNodes.source.stop();
      ambientNodes.lfo.stop();
    } catch {}
    ambientNodes = null;
  }
}

function startAmbient(mode, volume) {
  stopAmbient();
  if (!mode || mode === 'off') return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ambientCtx = ambientCtx || new Ctx();
    if (ambientCtx.state === 'suspended') ambientCtx.resume();
    const seconds = 2;
    const buffer = ambientCtx.createBuffer(1, ambientCtx.sampleRate * seconds, ambientCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ambientCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ambientCtx.createBiquadFilter();
    filter.type = mode === 'rain' ? 'highpass' : 'lowpass';
    filter.frequency.value = mode === 'rain' ? 1400 : 420;
    filter.Q.value = 0.7;

    const gain = ambientCtx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume)) * 0.5;

    const lfo = ambientCtx.createOscillator();
    const lfoGain = ambientCtx.createGain();
    lfo.frequency.value = mode === 'rain' ? 0.25 : 0.08;
    lfoGain.gain.value = mode === 'rain' ? 0.04 : 0.12;
    lfo.connect(lfoGain).connect(gain.gain);

    source.connect(filter).connect(gain).connect(ambientCtx.destination);
    source.start();
    lfo.start();
    ambientNodes = { source, lfo, gain };
  } catch (err) {
    console.warn('ambient lỗi', err);
  }
}

function applyAmbient() {
  const s = readStore();
  startAmbient(s.ambientMode || 'off', s.ambientVolume ?? 0.35);
}

let agentTimer = 0;
let lastAgentTool = '';

async function pollAgent() {
  const s = readStore();
  const url = s.agentUrl;
  if (!url) return;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    const rawState = data && (data.state || data.status);
    const tool = data && typeof data.tool === 'string' ? data.tool.slice(0, 32) : '';
    const subs = data && Number.isFinite(Number(data.subagents)) ? Number(data.subagents) : 0;
    const host = data && typeof data.host === 'string' ? data.host.slice(0, 24) : '';
    const state = subs > 0 ? 'juggling' : rawState;
    if (STATES.includes(state) || state === 'juggling') {
      model.setState(state);
      const bits = ['agent: ' + state];
      if (tool) bits.push(tool);
      if (subs > 0) bits.push(subs + ' subagent');
      if (host) bits.push('@' + host);
      const line = bits.join(' · ');
      if (host) document.documentElement.style.setProperty('--accent', hostColor(host));
      el.agentLine.textContent = line;
      el.agentChip.textContent = line;
      el.agentChip.hidden = false;
      if (tool && tool !== lastAgentTool) {
        lastAgentTool = tool;
        petSay('Đang chạy: ' + tool, { chat: false });
      }
    } else {
      el.agentLine.textContent = pick('agent: không rõ trạng thái', 'agent: unknown state');
    }
  } catch (err) {
    el.agentLine.textContent = 'agent lỗi: ' + err.message;
  }
}

function renderExperiment() {
  const s = readStore();
  if (!s.installId) {
    s.installId = newSeed();
    writeStore({ installId: s.installId });
  }
  const forced = (new URLSearchParams(location.search).get('ab') || '').toLowerCase();
  const variant = forced === 'a' || forced === 'b' ? forced.toUpperCase() : assignVariant(s.installId);
  document.body.classList.remove('ab-a', 'ab-b');
  document.body.classList.add('ab-' + variant.toLowerCase());
  if (el.experimentLine) el.experimentLine.textContent = 'Thử nghiệm giao diện: nhóm ' + variant;
}

function renderCollection() {
  if (!el.stateCollection) return;
  const seen = readStore().stats.states || {};
  el.stateCollection.innerHTML = STATES.map(st =>
    '<span class="' + (seen[st] ? 'got' : '') + '">'
    + (seen[st] ? '✓ ' : '• ') + escapeHtml(stateText(st)) + '</span>').join('');
}

function renderHosts() {
  if (!el.agentHosts) return;
  const hosts = readStore().agentHosts || [];
  el.agentHosts.innerHTML = hosts.map(url =>
    '<div class="host-row"><span>' + escapeHtml(url) + '</span>'
    + '<div class="row"><button data-use="' + escapeHtml(url) + '">' + pick('Dùng', 'Use') + '</button>'
    + '<button data-del="' + escapeHtml(url) + '">' + pick('Xoá', 'Delete') + '</button></div></div>').join('');
}

function startAgent(url) {
  stopAgent();
  if (!url) return;
  writeStore({ agentUrl: url });
  el.agentUrl.value = url;
  pollAgent();
  agentTimer = setInterval(pollAgent, 10000);
  logEvent('kết nối agent');
}

function stopAgent() {
  clearInterval(agentTimer);
  agentTimer = 0;
  lastAgentTool = '';
  writeStore({ agentUrl: '' });
  el.agentLine.textContent = pick('chưa kết nối', 'not connected');
  el.agentChip.hidden = true;
  document.documentElement.style.removeProperty('--accent');
}

function exportPng() {
  try {
    const out = document.createElement('canvas');
    out.width = Math.max(1, el.canvas.width * 2);
    out.height = Math.max(1, el.canvas.height * 2);
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(el.canvas, 0, 0, out.width, out.height);
    const b64 = out.toDataURL('image/png').split(',')[1];
    if (window.AndroidPet && typeof window.AndroidPet.savePng === 'function') {
      window.AndroidPet.savePng(b64, 'pet-studio-' + Date.now() + '.png');
      setStatus('đã lưu ảnh vào Download/DSH-Go');
    } else {
      const link = document.createElement('a');
      link.href = 'data:image/png;base64,' + b64;
      link.download = 'pet-studio.png';
      link.click();
      setStatus('đã xuất ảnh');
    }
    haptic(10);
    logEvent('xuất ảnh pet');
  } catch (err) {
    console.error(err);
    setStatus('xuất ảnh lỗi: ' + err.message);
  }
}

async function exportGift() {
  try {
    const entry = packs.find(p => p.id === (pack && pack.id)) || packs[0];
    const encoder = new TextEncoder();
    const files = [];
    if (entry.local) {
      const rec = await getLocalPack(entry.id);
      if (!rec) throw new Error('không đọc được pack đã nhập');
      files.push({ name: 'pack.json', data: encoder.encode(JSON.stringify(rec.pack, null, 2)) });
      for (const name of sheetNames(rec.pack)) {
        const blob = rec.files[name];
        files.push({ name, data: new Uint8Array(await blob.arrayBuffer()) });
      }
    } else {
      const res = await fetch(entry.url);
      if (!res.ok) throw new Error('không tải được pack');
      const json = await res.json();
      files.push({ name: 'pack.json', data: encoder.encode(JSON.stringify(json, null, 2)) });
      const base = new URL(entry.url, location.href);
      for (const name of sheetNames(json)) {
        const img = await fetch(new URL(name, base));
        files.push({ name, data: new Uint8Array(await img.arrayBuffer()) });
      }
    }
    const zip = buildZip(files);
    const b64 = bytesToBase64(zip);
    const filename = 'pet-' + (pack ? pack.id : 'pack') + '.zip';
    if (window.AndroidPet && window.AndroidPet.saveZip) {
      window.AndroidPet.saveZip(b64, filename);
      setStatus('đã lưu gói pet vào Download/DSH-Go');
    } else {
      const link = document.createElement('a');
      link.href = 'data:application/zip;base64,' + b64;
      link.download = filename;
      link.click();
    }
    logEvent('tặng pet ' + filename);
  } catch (err) {
    console.error(err);
    setStatus('tặng pet lỗi: ' + err.message);
  }
}

let marketCache = null;

async function loadMarket() {
  if (marketCache) return marketCache;
  const res = await fetch('./market.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('không tải được chợ pack');
  marketCache = await res.json();
  return marketCache;
}

async function installMarket(entry) {
  try {
    setStatus('đang cài ' + entry.name + '…');
    const res = await fetch(entry.url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const base = new URL(entry.url, location.href);
    const files = {};
    for (const name of sheetNames(json)) {
      const sheet = await fetch(new URL(name, base));
      if (!sheet.ok) throw new Error('thiếu ảnh ' + name);
      files[name] = await sheet.blob();
    }
    const packJson = { ...json, id: builtinPacks.some(p => p.id === json.id) ? 'user-' + json.id : json.id };
    const check = await verifyChecksums(packJson, files);
    if (!check.ok) throw new Error('checksum lỗi: ' + check.bad);
    await saveLocalPack({
      id: packJson.id, created: Date.now(), pack: packJson, files,
      frames: sheetNames(packJson).length,
    });
    logEvent('cài từ chợ: ' + entry.name);
    await loadPacks();
    renderPackOptions();
    el.pack.value = packJson.id;
    writeStore({ pack: packJson.id });
    await loadPack(packJson.id);
    setStatus('đã cài ' + entry.name);
    haptic(14);
    await showMarket();
  } catch (err) {
    console.error(err);
    setStatus('cài lỗi: ' + err.message);
  }
}

const WHEEL_ACTIONS = [
  { key: 'settings', vi: 'Cài đặt', en: 'Settings', run: () => openSheet(true) },
  { key: 'quiet', vi: 'Im lặng', en: 'Quiet', run: () => { el.quiet.checked = !el.quiet.checked; writeStore({ quiet: el.quiet.checked }); if (model) model.quiet = el.quiet.checked; } },
  { key: 'market', vi: 'Chợ pack', en: 'Market', run: () => showMarket() },
  { key: 'aod', vi: 'Màn đêm', en: 'Night', run: () => window.AndroidPet && window.AndroidPet.openAod && window.AndroidPet.openAod() },
  { key: 'walk', vi: 'Dạy đi', en: 'Walk', run: () => { pathMode = true; setStatus(pick('chạm vào chỗ muốn pet đi tới', 'tap where the pet should walk')); } },
  { key: 'stretch', vi: 'Vươn vai', en: 'Stretch', run: () => { el.stage.classList.add('stretching'); setTimeout(() => el.stage.classList.remove('stretching'), 700); } },
];

function openWheel() {
  const radius = 86;
  el.wheel.innerHTML = WHEEL_ACTIONS.map((a, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / WHEEL_ACTIONS.length;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return '<button data-wheel="' + a.key + '" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px">'
      + escapeHtml(pick(a.vi, a.en)) + '</button>';
  }).join('');
  el.wheel.hidden = false;
  logEvent('mở menu vòng');
}

function closeWheel() { el.wheel.hidden = true; }

async function showMarket() {
  try {
    const data = await loadMarket();
    const locals = new Set(localPacks.map(p => p.id));
    const builtins = new Set(builtinPacks.map(p => p.id));
    el.marketGrid.innerHTML = (data.packs || []).map(entry => {
      const installed = locals.has(entry.id) || builtins.has(entry.id);
      return '<div class="market-item"><div><b>' + escapeHtml(entry.name) + '</b>'
        + '<span>' + escapeHtml(entry.author || '') + ' · ' + escapeHtml(entry.license || '')
        + (entry.tags ? ' · ' + entry.tags.map(t => escapeHtml(t)).join(', ') : '') + '</span></div>'
        + '<button data-pack="' + escapeHtml(entry.id) + '"' + (installed ? ' disabled' : '') + '>'
        + (installed ? 'Đã có' : 'Cài') + '</button></div>';
    }).join('');
    el.marketModal.hidden = false;
    el.marketGrid.querySelectorAll('button[data-pack]:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', async () => {
        const entry = (marketCache.packs || []).find(p => p.id === btn.dataset.pack);
        if (entry) await installMarket(entry);
      });
    });
    logEvent('mở chợ pack');
  } catch (err) {
    console.error(err);
    setStatus('chợ lỗi: ' + err.message);
  }
}

function showGallery() {
  try {
    const raw = window.AndroidPet && window.AndroidPet.listExports
      ? window.AndroidPet.listExports()
      : '[]';
    const items = JSON.parse(raw || '[]');
    el.galleryGrid.innerHTML = items.length
      ? items.map(item => '<figure><img alt="" src="data:' + item.mime + ';base64,' + item.data + '">'
        + '<figcaption>' + escapeHtml(item.name) + '</figcaption></figure>').join('')
      : '<p class="empty">Chưa có ảnh/GIF nào. Dùng “Xuất ảnh pet” hoặc “Xuất GIF” trước.</p>';
    el.galleryModal.hidden = false;
    logEvent('mở thư viện');
  } catch (err) {
    console.error(err);
    setStatus('thư viện lỗi: ' + err.message);
  }
}

function showQr() {
  try {
    const url = shareUrl(location.origin + location.pathname, pickConfig(readStore()));
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const count = qr.getModuleCount();
    const scale = 8;
    const quiet = 4;
    const size = (count + quiet * 2) * scale;
    const canvas = el.qrCanvas;
    canvas.width = size;
    canvas.height = size;
    const g = canvas.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, size, size);
    g.fillStyle = '#10141c';
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        if (qr.isDark(y, x)) g.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
      }
    }
    el.qrUrl.textContent = url;
    el.qrModal.hidden = false;
    logEvent('mở mã QR cấu hình');
  } catch (err) {
    console.error(err);
    setStatus('QR lỗi: ' + err.message);
  }
}

async function shareConfig() {
  const url = shareUrl(location.origin + location.pathname, pickConfig(readStore()));
  try {
    await navigator.clipboard.writeText(url);
    setStatus('đã chép liên kết cấu hình');
  } catch {
    el.backupBox.value = url;
    el.backupBox.select();
    setStatus('trình duyệt chặn clipboard — liên kết đã vào ô bên dưới');
  }
  logEvent('chia sẻ cấu hình');
}

function applySharedConfig() {
  const hash = location.hash || '';
  if (!hash.startsWith('#cfg=')) return false;
  const config = decodeConfig(hash.slice(5));
  if (!config) return false;
  writeStore(config);
  history.replaceState(null, '', location.pathname + location.search);
  location.reload();
  return true;
}

function bindPip() {
  if (new URLSearchParams(location.search).get('pip') === '1') {
    document.body.classList.add('pip');
    console.log('pip layout on');
  }
  const bridge = window.AndroidPet;
  if (!bridge || typeof bridge.isPipSupported !== 'function' || !bridge.isPipSupported()) return;
  // Cửa sổ PiP còn thử nghiệm: WebView có thể hiện khung đen trên một số máy.
  // Chỉ hiện nút khi mở bằng ?pipbtn=1 để thử.
  if (new URLSearchParams(location.search).get('pipbtn') !== '1') return;
  el.pipBtn.hidden = false;
  el.pipBtn.addEventListener('click', () => bridge.enterPip());
}

function bindSheet() {
  el.openSettings.addEventListener('click', () => openSheet(true));
  el.closeSheet.addEventListener('click', () => openSheet(false));
  el.backdrop.addEventListener('click', () => openSheet(false));
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') openSheet(false); });

  el.userName.addEventListener('input', () => {
    writeStore({ userName: el.userName.value.trim().slice(0, 16) }, { render: false });
  });
  el.petNameInput.addEventListener('input', () => {
    const name = el.petNameInput.value.trim().slice(0, 16);
    applyName(name);
    writeStore({ name }, { render: false });
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
  el.simpleMode.addEventListener('change', () => {
    applySimple(el.simpleMode.checked);
    writeStore({ simple: el.simpleMode.checked });
  });
  el.showFps.addEventListener('change', () => {
    writeStore({ showFps: el.showFps.checked });
    if (!el.showFps.checked) el.fpsChip.hidden = true;
  });
  el.errorLog.addEventListener('change', () => writeStore({ errorLog: el.errorLog.checked }));
  el.autoSeason.addEventListener('change', () => {
    writeStore({ autoSeason: el.autoSeason.checked });
    logEvent(el.autoSeason.checked ? 'bật đổi pet theo mùa' : 'tắt đổi pet theo mùa');
    if (el.autoSeason.checked) location.reload();
  });
  el.autoTheme.addEventListener('change', () => {
    const on = el.autoTheme.checked;
    writeStore({ autoTheme: on });
    applyAutoTheme(on, readStore().palette);
    logEvent(on ? 'bật đổi màu theo giờ' : 'tắt đổi màu theo giờ');
  });
  el.speechOn.addEventListener('change', () => writeStore({ speech: el.speechOn.checked }));
  el.speechRate.addEventListener('input', () => writeStore({ speechRate: Number(el.speechRate.value) || 1 }));
  el.voiceSelect.addEventListener('change', () => {
    const s = readStore();
    const map = { ...(s.voiceByPack || {}) };
    map[pack ? pack.id : 'default'] = el.voiceSelect.value;
    writeStore({ voiceName: el.voiceSelect.value, voiceByPack: map });
  });
  el.testSpeech.addEventListener('click', () => speak('Xin chào, mình là pet của bạn.', true));
  el.breakOn.addEventListener('change', () => {
    const on = el.breakOn.checked;
    writeStore({ breakReminder: on, lastBreak: on ? Date.now() : 0 });
    logEvent(on ? 'bật nhắc đứng dậy' : 'tắt nhắc đứng dậy');
  });
  el.breakMinutes.addEventListener('change', () => {
    const minutes = Math.max(5, Math.min(180, Number(el.breakMinutes.value) || 45));
    el.breakMinutes.value = minutes;
    writeStore({ breakMinutes: minutes });
  });
  el.quickSend.addEventListener('click', () => {
    const text = (el.quickInput.value || '').trim();
    if (!text) return;
    el.quickInput.value = '';
    sendChat(text);
  });
  el.quickInput.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter') return;
    const text = (el.quickInput.value || '').trim();
    if (!text) return;
    el.quickInput.value = '';
    sendChat(text);
  });
  el.chatSend.addEventListener('click', () => { sendChat(el.chatInput.value); el.chatInput.value = ''; });
  el.chatInput.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') { sendChat(el.chatInput.value); el.chatInput.value = ''; }
  });
  let clearArmed = 0;
  el.clearChat.addEventListener('click', () => {
    if (Date.now() - clearArmed > 3000) {
      clearArmed = Date.now();
      el.clearChat.textContent = pick('Chắc chắn?', 'Sure?');
      setTimeout(() => { el.clearChat.textContent = pick('Xoá chat', 'Clear chat'); }, 3000);
      return;
    }
    clearArmed = 0;
    el.clearChat.textContent = pick('Xoá chat', 'Clear chat');
    writeStore({ chat: [] });
    if (el.lastReply) { el.lastReply.hidden = true; el.lastReply.textContent = ''; }
    renderChat();
    petSay(pick('Mình quên hết rồi, bắt đầu lại nhé.', 'I forgot everything, let us start again.'), { chat: false });
  });
  el.storyBtn.addEventListener('click', async () => {
    const s = readStore();
    if (s.aiOn && s.aiEndpoint && s.aiModel) {
      setStatus('AI đang kể chuyện…');
      try {
        const reply = await askAI(aiConfig(s), [
          { role: 'system', content: aiSystemPrompt(s) },
          { role: 'user', content: 'Kể cho mình một câu chuyện ngắn 2-3 câu, ấm áp và có bài học nhỏ.' },
        ]);
        petSay(reply);
        return;
      } catch (err) {
        setStatus('AI lỗi (' + friendlyAIError(err) + '), kể chuyện offline');
      }
    }
    petSay(storyFor(new Date().getHours(), s.name || (pack && pack.name) || 'pet', getLang()));
  });
  el.summaryBtn.addEventListener('click', () => {
    const s = readStore();
    petSay(summaryFrom(s.stats, s.memories, getLang()));
  });
  el.langSel.addEventListener('change', () => {
    writeStore({ lang: el.langSel.value });
    applyLanguage(el.langSel.value);
    buildSettingsUI();
    renderSheet();
    onState();
  });
  el.ambientMode.addEventListener('change', () => {
    writeStore({ ambientMode: el.ambientMode.value });
    applyAmbient();
    logEvent('âm thanh môi trường: ' + el.ambientMode.value);
  });
  el.ambientVolume.addEventListener('input', () => {
    writeStore({ ambientVolume: Number(el.ambientVolume.value) });
    applyAmbient();
  });
  el.openRoadmap.addEventListener('click', () => {
    const url = 'https://github.com/vukiengiang2025-sys/dsh-go-pets/blob/main/ROADMAP.md';
    if (window.AndroidPet && window.AndroidPet.openUrl) window.AndroidPet.openUrl(url);
    else window.open(url, '_blank');
  });
  el.saveHost.addEventListener('click', () => {
    const url = (el.agentUrl.value || '').trim();
    writeStore({ agentHosts: upsertHost(readStore().agentHosts || [], url) });
    renderHosts();
    setStatus(pick('đã lưu host', 'host saved'));
  });
  el.agentHosts.addEventListener('click', ev => {
    const use = ev.target.closest('[data-use]');
    const del = ev.target.closest('[data-del]');
    if (use) {
      const url = use.dataset.use;
      el.agentUrl.value = url;
      writeStore({ agentUrl: url });
      startAgent(url);
    } else if (del) {
      writeStore({ agentHosts: removeHost(readStore().agentHosts || [], del.dataset.del) });
      renderHosts();
    }
  });
  el.aiClearKey.addEventListener('click', () => {
    if (!confirm(pick('Xoá API key đã lưu?', 'Delete the saved API key?'))) return;
    el.aiKey.value = '';
    writeStore({ aiKey: '', aiTestAt: 0 });
    if (el.aiStatus) el.aiStatus.textContent = 'đã xoá key';
  });
  el.aiChip.addEventListener('click', () => {
    el.aiOn.checked = !el.aiOn.checked;
    el.aiOn.dispatchEvent(new Event('change'));
  });
  el.aiModel.addEventListener('input', () => {
    if (el.aiChip && el.aiOn.checked) el.aiChip.textContent = 'AI · ' + (el.aiModel.value || 'bật');
  });
  ['aiEndpoint', 'aiModel', 'aiKey'].forEach(key => {
    const node = el[key];
    if (!node) return;
    node.addEventListener('input', () => writeStore({ [key]: node.value.trim() }, { render: false }));
  });
  el.aiPersona.addEventListener('change', () => {
    writeStore({ aiPersona: el.aiPersona.value });
    if (el.aiStatus) el.aiStatus.textContent = 'tính cách: ' + el.aiPersona.value;
  });
  el.aiProvider.addEventListener('change', () => {
    const provider = el.aiProvider.value;
    const preset = PRESETS[provider];
    if (preset) {
      el.aiEndpoint.value = preset.endpoint;
      el.aiModel.value = preset.model;
      writeStore({ aiProvider: provider, aiEndpoint: preset.endpoint, aiModel: preset.model });
    } else {
      writeStore({ aiProvider: provider });
    }
    if (el.aiStatus) el.aiStatus.textContent = 'đã chọn ' + provider;
  });
  el.aiGreet.addEventListener('change', () => {
    writeStore({ aiGreet: el.aiGreet.checked });
  });
  el.aiOn.addEventListener('change', () => {
    writeStore({ aiOn: el.aiOn.checked });
    if (el.aiChip) {
      el.aiChip.hidden = !el.aiOn.checked;
      el.aiChip.textContent = 'AI · ' + (el.aiModel.value || 'bật');
    }
    if (el.aiStatus) el.aiStatus.textContent = el.aiOn.checked ? 'đã bật' : 'đã tắt';
  });
  el.aiRetest.addEventListener('click', () => {
    writeStore({ aiTestAt: 0 });
    el.aiTest.click();
  });
  [el.chatInput, el.memoryInput, el.petNameInput].filter(Boolean).forEach(node => {
    node.addEventListener('focus', () => {
      setTimeout(() => node.scrollIntoView({ block: 'center', behavior: 'smooth' }), 280);
    });
  });
  el.quickInput.addEventListener('focus', () => {
    setTimeout(() => el.quickInput.scrollIntoView({ block: 'center', behavior: 'smooth' }), 280);
  });
  el.aiTest.addEventListener('click', async () => {
    const s = readStore();
    const sig = aiSig(aiConfig(s));
    if (s.aiTestSig === sig && testCacheValid(sig, s.aiTestAt, Date.now())) {
      el.aiStatus.textContent = 'OK (đã kiểm tra ' + Math.max(1, Math.round((Date.now() - s.aiTestAt) / 60000)) + ' phút trước)';
      return;
    }
    if (!s.aiEndpoint || !s.aiModel) {
      el.aiStatus.textContent = 'cần endpoint và model';
      return;
    }
    el.aiStatus.textContent = 'đang kiểm tra…';
    const started = performance.now();
    try {
      const reply = await askAI(aiConfig(s), [{ role: 'user', content: 'Chào bạn, trả lời một câu ngắn.' }]);
      el.aiStatus.textContent = 'OK (' + Math.round(performance.now() - started) + 'ms): ' + reply.slice(0, 60);
      writeStore({ aiTestSig: sig, aiTestAt: Date.now() });
    } catch (err) {
      el.aiStatus.textContent = 'lỗi: ' + friendlyAIError(err);
      writeStore({ aiTestSig: sig, aiTestAt: Date.now() });
    }
  });
  el.agentStart.addEventListener('click', () => startAgent((el.agentUrl.value || '').trim()));
  el.agentStop.addEventListener('click', stopAgent);
  el.shareConfig.addEventListener('click', shareConfig);
  el.shareQr.addEventListener('click', showQr);
  el.giftPack.addEventListener('click', exportGift);
  el.overlayStart.addEventListener('click', () => {
    if (window.AndroidPet && window.AndroidPet.startOverlay) {
      const ok = window.AndroidPet.startOverlay();
      setStatus(ok ? 'đã bật cửa sổ nổi' : 'cần cấp quyền hiển thị trên ứng dụng khác');
    } else {
      setStatus('chỉ chạy trong app Android');
    }
  });
  el.openWallpaper.addEventListener('click', () => {
    if (window.AndroidPet && window.AndroidPet.openWallpaper) window.AndroidPet.openWallpaper();
    else setStatus(pick('chỉ chạy trong app Android', 'Android app only'));
  });
  el.openAod.addEventListener('click', () => {
    if (window.AndroidPet && window.AndroidPet.openAod) window.AndroidPet.openAod();
    else setStatus(pick('chỉ chạy trong app Android', 'Android app only'));
  });
  el.overlayFloat.addEventListener('change', () => {
    writeStore({ overlayFloat: el.overlayFloat.checked });
    if (window.AndroidPet && window.AndroidPet.setOverlayFloat) {
      window.AndroidPet.setOverlayFloat(el.overlayFloat.checked);
    }
    setStatus(el.overlayFloat.checked ? pick('pet sẽ tự bay nhảy', 'pet will float around') : pick('đã tắt bay nhảy', 'floating off'));
  });
  el.overlaySize.addEventListener('change', () => {
    if (window.AndroidPet && window.AndroidPet.setOverlaySize) {
      window.AndroidPet.setOverlaySize(Number(el.overlaySize.value));
      setStatus(pick('đã đổi cỡ cửa sổ nổi', 'floating window size updated'));
    }
  });
  el.overlayStop.addEventListener('click', () => {
    if (window.AndroidPet && window.AndroidPet.stopOverlay) window.AndroidPet.stopOverlay();
    setStatus('đã tắt cửa sổ nổi');
  });
  el.openWheel.addEventListener('click', ev => { ev.stopPropagation(); openWheel(); });
  el.wheel.addEventListener('click', ev => {
    const b = ev.target.closest('[data-wheel]');
    if (!b) return;
    const action = WHEEL_ACTIONS.find(a => a.key === b.dataset.wheel);
    closeWheel();
    if (action) action.run();
  });
  document.addEventListener('pointerdown', ev => {
    if (!el.wheel.hidden && !el.wheel.contains(ev.target) && ev.target !== el.openWheel) closeWheel();
  });
  document.querySelectorAll('.sheet-nav [data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.goto);
      if (target) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  });
  el.openMarket.addEventListener('click', showMarket);
  el.marketClose.addEventListener('click', () => { el.marketModal.hidden = true; });
  el.templatePack.addEventListener('click', async () => {
    try {
      const res = await fetch('./template-pack.zip');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const b64 = bytesToBase64(bytes);
      if (window.AndroidPet && window.AndroidPet.saveZip) {
        window.AndroidPet.saveZip(b64, 'pack-mau.zip');
        setStatus(pick('đã lưu pack mẫu vào Download/DSH-Go', 'template saved to Download/DSH-Go'));
      } else {
        const a = document.createElement('a');
        a.href = 'data:application/zip;base64,' + b64;
        a.download = 'pack-mau.zip';
        a.click();
      }
      logEvent('tải pack mẫu');
    } catch (err) {
      console.error(err);
      setStatus('tải pack mẫu lỗi: ' + err.message);
    }
  });
  el.openGallery.addEventListener('click', showGallery);
  el.galleryClose.addEventListener('click', () => { el.galleryModal.hidden = true; });
  el.qrClose.addEventListener('click', () => { el.qrModal.hidden = true; });
  el.qrSave.addEventListener('click', () => {
    try {
      const b64 = el.qrCanvas.toDataURL('image/png').split(',')[1];
      if (window.AndroidPet && window.AndroidPet.savePng) {
        window.AndroidPet.savePng(b64, 'pet-qr.png');
        setStatus('đã lưu mã QR vào Download/DSH-Go');
      } else {
        const a = document.createElement('a');
        a.href = 'data:image/png;base64,' + b64;
        a.download = 'pet-qr.png';
        a.click();
      }
    } catch (err) { setStatus('lưu QR lỗi: ' + err.message); }
  });
  el.exportPng.addEventListener('click', exportPng);
  el.exportGif.addEventListener('click', exportGif);
  el.focusStart.addEventListener('click', () => startMinuteTimer('focus', readStore().focusMinutes));
  el.breakStart.addEventListener('click', () => startMinuteTimer('break', readStore().restMinutes));
  el.focusStop.addEventListener('click', stopFocus);
  el.introStart.addEventListener('click', () => {
    el.intro.hidden = true;
    writeStore({ onboarded: true });
    logEvent('bắt đầu dùng app');
  });
  el.memoryAdd.addEventListener('click', addMemory);
  el.memoryInput.addEventListener('keydown', ev => { if (ev.key === 'Enter') addMemory(); });
  el.memoryList.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-memory]');
    if (!b) return;
    const s = readStore();
    s.memories.splice(Number(b.dataset.memory), 1);
    writeStore({ memories: s.memories });
    renderMemories();
  });
  el.zipLoad.addEventListener('click', () => importZipUrl(el.zipUrl.value));
  el.zipUrl.addEventListener('keydown', ev => { if (ev.key === 'Enter') importZipUrl(el.zipUrl.value); });
  el.importImage.addEventListener('click', () => el.importFile.click());
  el.importFile.addEventListener('change', async () => {
    const file = el.importFile.files && el.importFile.files[0];
    el.importFile.value = '';
    if (!file) return;
    if (/\.zip$/i.test(file.name) || (file.type || '').includes('zip')) {
      await importZipFile(file);
    } else {
      await importImageFile(file);
    }
  });
  el.importedList.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-remove]');
    if (b && !confirm(pick('Xoá pack này?', 'Delete this pack?'))) return;
    if (b) removeImported(b.dataset.remove);
  });
  el.copyBackup.addEventListener('click', copyBackup);
  el.importBackup.addEventListener('click', importBackup);
  el.resetAll.addEventListener('click', resetAll);
}

function hidePet() {
  el.pet.classList.add('hidden-pet');
  model.setState('sleeping');
  logEvent('pet trốn vì bị chọc nhiều');
  setTimeout(() => el.pet.classList.remove('hidden-pet'), 6000);
  pokeTimes = [];
}

function bindStage() {
  let down = null;
  let clicks = [];
  let holdTimer = 0;

  el.stage.addEventListener('touchstart', ev => {
    if (!ev.touches || ev.touches.length !== 3) return;
    ev.preventDefault();
    el.quiet.checked = !el.quiet.checked;
    writeStore({ quiet: el.quiet.checked });
    if (model) model.quiet = el.quiet.checked;
    haptic(18);
    setStatus(pick(el.quiet.checked ? 'ba ngón: im lặng' : 'ba ngón: bật tiếng',
      el.quiet.checked ? 'three fingers: quiet' : 'three fingers: sound on'));
  }, { passive: false });

  function hideMood() { el.moodMenu.hidden = true; }
  el.moodMenu.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-mood]');
    if (!b) return;
    if (b.dataset.mood === 'path') {
      pathMode = true;
      hideMood();
      setStatus(pick('chạm vào chỗ muốn pet đi tới', 'tap where the pet should walk'));
      return;
    }
    if (b.dataset.mood === 'stretch') {
      el.stage.classList.add('stretching');
      setTimeout(() => el.stage.classList.remove('stretching'), 700);
      petSay(pick('Vươn vai một cái nào!', 'Time to stretch!'), { chat: false });
      hideMood();
      return;
    }
    model.setState(b.dataset.mood);
    petSay(b.dataset.mood === 'attention' ? 'Mình vui lắm!' : b.dataset.mood === 'sleeping' ? 'Mình buồn ngủ…' : 'Hừm, mình đang hờn.', { chat: false });
    hideMood();
  });
  const pos = ev => {
    const r = el.canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width };
  };
  el.stage.addEventListener('pointerdown', ev => {
    if (!pathMode) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    pathMode = false;
    const rect = el.canvas.getBoundingClientRect();
    walkTarget = {
      x: Math.max(-90, Math.min(90, ev.clientX - rect.left - rect.width / 2)),
      y: Math.max(-80, Math.min(80, ev.clientY - rect.top - rect.height * 0.7)),
    };
    haptic(8);
    logEvent('dạy pet đi');
  }, true);
  el.stage.addEventListener('pointerdown', ev => {
    el.stage.setPointerCapture(ev.pointerId);
    const p = pos(ev);
    down = {
      x: p.x, y: p.y, dragging: false, petting: false, held: false,
      lastX: p.x, lastY: p.y, lastT: ev.timeStamp, vx: 0, vy: 0,
    };
    strokeDetector.reset();
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      if (!down || down.dragging || down.petting) return;
      down.held = true;
      el.moodMenu.hidden = false;
      haptic(12);
    }, 600);
  });
  el.stage.addEventListener('pointermove', ev => {
    const r = el.canvas.getBoundingClientRect();
    const dx = (ev.clientX - (r.left + r.width / 2)) / Math.max(40, r.width);
    const dy = (ev.clientY - (r.top + r.height * 0.5)) / Math.max(40, r.height);
    look.tx = Math.max(-1, Math.min(1, dx)) * 3.5;
    look.ty = Math.max(-1, Math.min(1, dy)) * 2.5;
    if (!down) return;
    const p = pos(ev);
    if (!down.held && Math.hypot(p.x - down.x, p.y - down.y) > 8) clearTimeout(holdTimer);
    if (!down.petting && strokeDetector.push(p.x, ev.timeStamp)) {
      down.petting = true;
      model.tickle();
      spawnFx('hearts');
      bumpStat('tickle');
      logEvent('vuốt ve pet');
      haptic(10);
      return;
    }
    if (!down.dragging && !down.petting && Math.hypot(p.x - down.x, p.y - down.y) > 8) {
      down.dragging = true;
      model.drag();
      haptic(6);
      bumpStat('drag');
      logEvent('nhấc pet lên');
    }
    const dt = ev.timeStamp - down.lastT;
    if (dt > 0) {
      down.vx = (p.x - down.lastX) / dt;
      down.vy = (p.y - down.lastY) / dt;
    }
    down.lastX = p.x;
    down.lastY = p.y;
    down.lastT = ev.timeStamp;
  });
  el.stage.addEventListener('pointerup', ev => {
    if (!down) return;
    const d = down;
    down = null;
    clearTimeout(holdTimer);
    if (d.held) { el.moodMenu.hidden = true; return; }
    if (d.dragging) {
      const clamp = (v, m) => Math.max(-m, Math.min(m, v));
      thrower = new ThrowPhysics({ vx: clamp(d.vx * 1000, 900), vy: clamp(d.vy * 1000, 900) });
      squash = 0.9;
      return;
    }
    if (d.petting) return;
    const p = pos(ev);
    const now = performance.now();
    clicks = clicks.filter(t => now - t < 1100);
    clicks.push(now);
    haptic(8);
    if (clicks.length >= 3) {
      clicks = [];
      model.tickle();
      spawnFx('hearts');
      bumpStat('tickle');
      logEvent('cù pet');
      return;
    }
    if (clicks.length === 2) {
      clicks = [];
      openSheet(true);
      return;
    }
    pokeTimes = pokeTimes.filter(t => now - t < 8000);
    pokeTimes.push(now);
    if (pokeTimes.length >= 6) {
      hidePet();
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
    if (el.bubbleAction.dataset.viewLog === '1') {
      openSheet();
      setTimeout(() => el.errorList && el.errorList.scrollIntoView({ block: 'center' }), 250);
      hideBubble();
      return;
    }
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
      lastFrameTime = 0;
      checkBreak();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(draw);
      if (ambientNodes) startAmbient(readStore().ambientMode, readStore().ambientVolume ?? 0.35);
    } else {
      cancelAnimationFrame(rafId);
      stopAmbient();
    }
  });
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(() => resizeFx()).observe(el.stage);
}

async function main() {
  if (applySharedConfig()) return;
  await loadPacks();
  renderPackOptions();

  const saved = readStore();
  const param = new URLSearchParams(location.search).get('pack');
  let id = packs.some(p => p.id === param) ? param : (saved.pack || packs[0].id);
  if (!param && !saved.pack && saved.autoSeason !== false) {
    const seasonId = SEASON_PACK[seasonFor(new Date())];
    if (seasonId && packs.some(p => p.id === seasonId)) id = seasonId;
  }
  el.pack.value = id;

  buildSettingsUI();
  bindStage();
  bindControls();
  bindSheet();
  bindPip();
  initBattery();
  bindLifecycle();
  setInterval(checkBreak, 60000);
  setInterval(() => {
    if (!document.hidden) {
      const s = readStore();
      s.stats.seconds = (s.stats.seconds || 0) + 30;
      writeStore({ stats: s.stats });
    }
  }, 30000);

  try {
    await loadPack(id);
    const v = new URLSearchParams(location.search).get('v') || 'web';
    el.version.textContent = v === 'web' ? 'bản web' : 'v' + v;
    const savedSettings = readStore();
    applyName(savedSettings.name || '');
    const palParam = new URLSearchParams(location.search).get('palette');
    applyPalette(PALETTES[palParam] ? palParam : (savedSettings.palette || 'goc'));
    el.autoSeason.checked = savedSettings.autoSeason !== false;
    const urlLang = new URLSearchParams(location.search).get('lang');
    const lang = urlLang ? urlLang : (savedSettings.lang || 'vi');
    el.langSel.value = lang === 'en' ? 'en' : 'vi';
    applyLanguage(el.langSel.value);
    buildSettingsUI();
    renderHosts();
    renderCollection();
    renderExperiment();
    maybeAIGreet();
    maybeDailyGreet();
    if (el.userName) el.userName.value = savedSettings.userName || '';
    el.aiPersona.value = savedSettings.aiPersona || 'gentle';
    el.aiProvider.value = savedSettings.aiProvider || 'openai';
    el.aiEndpoint.value = savedSettings.aiEndpoint || '';
    el.aiModel.value = savedSettings.aiModel || '';
    el.aiKey.value = savedSettings.aiKey || '';
    renderAiUsage();
    el.aiOn.checked = !!savedSettings.aiOn;
    if (el.aiChip) {
      el.aiChip.hidden = !el.aiOn.checked;
      el.aiChip.textContent = 'AI · ' + (savedSettings.aiModel || 'bật');
    }
    el.aiGreet.checked = !!savedSettings.aiGreet;
    el.overlayFloat.checked = savedSettings.overlayFloat !== false;
    if (window.AndroidPet && window.AndroidPet.setOverlayFloat) {
      window.AndroidPet.setOverlayFloat(el.overlayFloat.checked);
    }
    if (el.aiStatus) el.aiStatus.textContent = savedSettings.aiEndpoint ? 'đã lưu cấu hình' : 'chưa cấu hình';
    el.ambientMode.value = savedSettings.ambientMode || 'off';
    el.showFps.checked = !!savedSettings.showFps;
    el.errorLog.checked = !!savedSettings.errorLog;
    if (new URLSearchParams(location.search).get('fps') === '1') {
      el.showFps.checked = true;
      writeStore({ showFps: true });
    }
    installErrorHooks();
    renderErrors();
    el.ambientVolume.value = savedSettings.ambientVolume ?? 0.35;
    applyAmbient();
    applySimple(savedSettings.simple);
    applyAutoTheme(savedSettings.autoTheme, savedSettings.palette);
    if ('speechSynthesis' in window) {
      fillVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', fillVoices);
    } else {
      el.speechOn.disabled = true;
      el.testSpeech.disabled = true;
    }
    applySpeechSettings();
    if (savedSettings.breakReminder && !savedSettings.lastBreak) {
      writeStore({ lastBreak: Date.now() });
    }
    setInterval(() => {
      if (readStore().autoTheme) applyPalette(paletteForNow());
    }, 600000);
    if (new URLSearchParams(location.search).get('sheet') === '1') openSheet(true);
    applyStreak();
    maybeIntro();
    const importDemo = new URLSearchParams(location.search).get('import');
    if (importDemo === 'demo') demoImport();
    else if (importDemo === 'zip') demoZipImport();
    if (new URLSearchParams(location.search).get('export') === '1') {
      setTimeout(exportPng, 700);
    }
    const agentParam = new URLSearchParams(location.search).get('agent');
    if (agentParam === 'demo') startAgent('./agent.json');
    else if (agentParam && /^https?:/.test(agentParam)) startAgent(agentParam);
    if (new URLSearchParams(location.search).get('overlay') === '1') {
      document.body.classList.add('overlay');
      document.addEventListener('click', () => {
        if (window.AndroidOverlay && window.AndroidOverlay.openApp) window.AndroidOverlay.openApp();
      });
      if (window.AndroidPet && window.AndroidPet.startOverlay) {
        setTimeout(() => window.AndroidPet.startOverlay(), 400);
      }
    }
    if (new URLSearchParams(location.search).get('market') === '1') {
      setTimeout(showMarket, 900);
    }
    if (new URLSearchParams(location.search).get('wheel') === '1') {
      setTimeout(openWheel, 900);
    }
    if (new URLSearchParams(location.search).get('walk') === '1') {
      setTimeout(() => { walkTarget = { x: 70, y: -10 }; }, 900);
    }
    if (new URLSearchParams(location.search).get('mood') === '1') {
      setTimeout(() => { el.moodMenu.hidden = false; }, 900);
    }
    if (new URLSearchParams(location.search).get('notify') === '1') {
      setTimeout(() => {
        if (window.AndroidPet && window.AndroidPet.notify) {
          window.AndroidPet.notify('Pet Studio', 'Thông báo thử nghiệm');
        }
      }, 800);
    }
    if (new URLSearchParams(location.search).get('boom') === '1') {
      writeStore({ errorLog: true });
      setTimeout(() => { throw new Error('lỗi thử nghiệm từ ?boom=1'); }, 1200);
    }
    if (new URLSearchParams(location.search).get('zipurl') === 'demo') {
      setTimeout(() => importZipUrl('./test-fixtures/mini-pack.zip'), 700);
    }
    if (new URLSearchParams(location.search).get('gallery') === '1') {
      setTimeout(showGallery, 900);
    }
    if (new URLSearchParams(location.search).get('gift') === '1') {
      setTimeout(exportGift, 900);
    }
    if (new URLSearchParams(location.search).get('qr') === '1') {
      setTimeout(showQr, 800);
    }
    if (new URLSearchParams(location.search).get('gif') === '1') {
      setTimeout(exportGif, 900);
    }
    if (new URLSearchParams(location.search).get('chat') === 'demo') {
      setTimeout(() => sendChat('xin chào'), 800);
    }
    const initial = new URLSearchParams(location.search).get('state');
    if (initial && STATES.includes(initial)) model.setState(initial);
    const fxParam = new URLSearchParams(location.search).get('fx');
    if (fxParam === 'hearts') {
      model.setState('attention');
      setInterval(() => spawnFx('hearts'), 700);
    } else if (fxParam === 'zzz') {
      model.setState('sleeping');
      setInterval(() => spawnFx('zzz'), 900);
    } else if (fxParam === 'throw') {
      thrower = new ThrowPhysics({ vx: 480, vy: -320 });
    }
    requestAnimationFrame(draw);
    setStatus(pick('sẵn sàng', 'ready'));
  } catch (err) {
    setStatus('lỗi: ' + err.message);
    el.bubbleText.textContent = 'Không tải được pet pack: ' + err.message;
    el.bubbleAction.hidden = true;
    el.bubble.hidden = false;
    console.error(err);
  }
}

main();
