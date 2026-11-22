// Vật lý nhỏ và bộ phát hiện cử chỉ cho pet — thuần JS, test được bằng Node.

export class ThrowPhysics {
  constructor(opts = {}) {
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.stiffness = opts.stiffness ?? 120;
    this.damping = opts.damping ?? 14;
  }

  get settled() {
    return Math.abs(this.x) < 0.4 && Math.abs(this.y) < 0.4
      && Math.abs(this.vx) < 4 && Math.abs(this.vy) < 4;
  }

  step(dt) {
    const ax = -this.stiffness * this.x - this.damping * this.vx;
    const ay = -this.stiffness * this.y - this.damping * this.vy;
    this.vx += ax * dt;
    this.vy += ay * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return this;
  }
}

export function createStrokeDetector(opts = {}) {
  const reversalsNeeded = opts.reversals ?? 3;
  const windowMs = opts.windowMs ?? 1400;
  const minMove = opts.minMove ?? 6;
  let lastX = null;
  let direction = 0;
  let reversals = [];
  return {
    push(x, now) {
      if (lastX === null) {
        lastX = x;
        return false;
      }
      const dx = x - lastX;
      if (Math.abs(dx) < minMove) {
        lastX = x;
        return false;
      }
      const dir = Math.sign(dx);
      lastX = x;
      if (direction !== 0 && dir !== direction) {
        reversals.push(now);
        reversals = reversals.filter(t => now - t <= windowMs);
        if (reversals.length >= reversalsNeeded) {
          reversals = [];
          direction = dir;
          return true;
        }
      }
      direction = dir;
      return false;
    },
    reset() {
      lastX = null;
      direction = 0;
      reversals = [];
    },
  };
}

export function spawnParticles(kind, x, y, rand = Math.random) {
  const count = kind === 'hearts' ? 6 : kind === 'zzz' ? 4 : 7;
  const out = [];
  for (let i = 0; i < count; i++) {
    const spread = (rand() - 0.5) * 44;
    out.push({
      kind,
      x: x + spread,
      y: y + (rand() - 0.5) * 12,
      vx: spread * 0.6,
      vy: kind === 'zzz' ? -22 - rand() * 12 : -34 - rand() * 26,
      g: kind === 'zzz' ? -4 : 26,
      life: kind === 'zzz' ? 1500 : 900,
      max: kind === 'zzz' ? 1500 : 900,
      size: 5 + rand() * 4,
      drift: (rand() - 0.5) * 16,
    });
  }
  return out;
}

export function stepParticles(list, dtMs) {
  const dt = dtMs / 1000;
  for (const p of list) {
    p.x += (p.vx + p.drift) * dt;
    p.y += p.vy * dt;
    p.vy += p.g * dt;
    p.life -= dtMs;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].life <= 0) list.splice(i, 1);
  }
  return list;
}
