// Bộ máy trạng thái pet, không phụ thuộc DOM — chạy được cả trong Node để test.
// Luật lấy từ docs/design/pets.md: một trạng thái tại một thời điểm, ưu tiên
// one-shot (attention/error), notification giữ tới khi xử lý, idle lâu thì ngủ.

export const ONE_SHOT_MS = { attention: 5200, error: 4800, waking: 1600 };
export const PRIORITY = {
  error: 8, notification: 7, attention: 5, working: 3, thinking: 2,
  idle: 1, waking: 1, sleeping: 0, roam: 1,
};
export const STATES = ['idle', 'thinking', 'working', 'attention', 'error',
  'notification', 'sleeping', 'waking', 'roam'];

export function animationFor(pack, name) {
  return (name && pack.animations && pack.animations[name]) || null;
}

export function pickStateAnim(pack, state) {
  const list = (pack.states && pack.states[state]) || null;
  if (list && list.length) return animationFor(pack, list[0]);
  const idle = (pack.states && pack.states.idle) || [];
  return animationFor(pack, idle[0]) || animationFor(pack, Object.keys(pack.animations || {})[0]);
}

export class PetModel {
  constructor(pack, opts = {}) {
    this.pack = pack;
    this.now = opts.now ?? 0;
    this.quiet = !!opts.quiet;
    this.state = 'idle';
    this.returnState = 'idle';
    this.oneShotUntil = 0;
    this.notification = false;
    this.reactionName = null;
    this.reactionUntil = 0;
    this.lastActivity = this.now;
    this.anim = pickStateAnim(pack, 'idle');
    this.animName = this.anim ? this.anim.name : null;
    this.animStart = this.now;
    this.frameIndex = 0;
    this.sleepAfter = (pack.sleep && pack.sleep.afterMs) || 60000;
    this.listeners = new Set();
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(type, detail = {}) { for (const fn of this.listeners) fn({ type, ...detail }); }

  get continuousState() {
    if (this.notification) return 'notification';
    return this.state;
  }

  setState(next, opts = {}) {
    if (!next) return;
    const now = this.now;
    const oneShot = ONE_SHOT_MS[next];
    if (oneShot) {
      if (this.state === next && now < this.oneShotUntil) return;
      this.returnState = (this.state && !ONE_SHOT_MS[this.state] && this.state !== 'notification')
        ? this.state : 'idle';
      this.state = next;
      this.oneShotUntil = now + oneShot;
      this.animName = null;
      this.emit('state', { state: next });
      return;
    }
    if (next === 'notification') {
      this.notification = true;
      this.state = 'notification';
      this.animName = null;
      this.emit('state', { state: 'notification' });
      return;
    }
    if (next === 'idle') this.notification = false;
    this.state = next;
    this.oneShotUntil = 0;
    this.animName = null;
    this.emit('state', { state: next });
  }

  clearNotification() {
    this.notification = false;
    this.lastActivity = this.now;
    if (this.state === 'notification') this.setState('idle');
  }

  touch() {
    this.lastActivity = this.now;
    if (this.state === 'sleeping') {
      this.setState('waking');
      return true;
    }
    return false;
  }

  react(name, ms = 1200) {
    if (!animationFor(this.pack, name)) return;
    this.touch();
    this.reactionName = name;
    this.reactionUntil = this.now + ms;
    this.animName = null;
  }

  poke(side) {
    const r = this.pack.reactions || {};
    const name = side < 0 ? r.tapLeft : r.tapRight;
    if (name) this.react(name, 1100);
    else this.touch();
  }

  tickle() {
    const r = this.pack.reactions || {};
    if (r.tickle) this.react(r.tickle, 1400);
    else this.touch();
  }

  drag() {
    const r = this.pack.reactions || {};
    if (r.drag) this.react(r.drag, 900);
  }

  tick(now = this.now) {
    this.now = now;
    if (this.state === 'sleeping' && this.notification) this.setState('notification');
    if (this.oneShotUntil && now >= this.oneShotUntil) {
      this.oneShotUntil = 0;
      this.lastActivity = now;
      this.state = this.notification ? 'notification' : (this.returnState || 'idle');
      this.animName = null;
      this.emit('state', { state: this.state });
    }
    if (!this.oneShotUntil && this.state === 'idle' && !this.notification &&
        now - this.lastActivity > this.sleepAfter) {
      this.setState('sleeping');
    }
    if (this.reactionUntil && now >= this.reactionUntil) {
      this.reactionName = null;
      this.animName = null;
    }

    let name = this.reactionName;
    if (!name) {
      const state = this.oneShotUntil ? this.state : (this.notification ? 'notification' : this.state);
      const anim = pickStateAnim(this.pack, state);
      name = anim ? anim.name : null;
    }
    if (!name) return null;
    if (name !== this.animName) {
      this.animName = name;
      this.animStart = now;
      this.frameIndex = 0;
    }
    const anim = animationFor(this.pack, this.animName);
    if (!anim) return null;
    this.frameIndex = frameAt(anim, now - this.animStart);
    return { name: this.animName, anim, frame: this.frameIndex };
  }
}

export function frameAt(anim, elapsedMs) {
  const frames = anim.frames || [];
  if (!frames.length) return 0;
  const total = frames.reduce((s, f) => s + f.ms, 0) || 1;
  let t = anim.loop === false ? Math.min(elapsedMs, total - 1) : elapsedMs % total;
  for (let i = 0; i < frames.length; i++) {
    if (t < frames[i].ms) return i;
    t -= frames[i].ms;
  }
  return frames.length - 1;
}

export function normalizePack(json) {
  if (!json || json.schema !== 1) throw new Error('pack.json thiếu schema: 1');
  if (!json.animations || !Object.keys(json.animations).length) throw new Error('pack không có animation');
  json.canvas = json.canvas || { w: 144, h: 144 };
  json.contentBox = json.contentBox || { x: 0, y: 0, w: json.canvas.w, h: json.canvas.h };
  for (const [key, anim] of Object.entries(json.animations)) {
    if (anim && !anim.name) anim.name = key;
  }
  json.states = json.states || {};
  if (!json.states.idle) {
    const first = Object.keys(json.animations)[0];
    json.states.idle = [first];
  }
  return json;
}
