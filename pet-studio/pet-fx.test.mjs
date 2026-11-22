import test from 'node:test';
import assert from 'node:assert/strict';
import { ThrowPhysics, createStrokeDetector, spawnParticles, stepParticles } from './pet-fx.js';

test('ThrowPhysics quay về 0 và tắt dần', () => {
  const p = new ThrowPhysics({ x: 40, vx: 120 });
  let maxV = 0;
  for (let i = 0; i < 240; i++) { p.step(1 / 60); maxV = Math.max(maxV, Math.abs(p.vx)); }
  assert.ok(Math.abs(p.x) < 1);
  assert.ok(p.settled);
});

test('strokeDetector nhận vuốt qua lại', () => {
  const d = createStrokeDetector({ reversals: 2, windowMs: 1000 });
  let fired = 0;
  let t = 0;
  for (const x of [0, 20, 40, 20, 0, 20, 40]) {
    t += 100;
    if (d.push(x, t)) fired++;
  }
  assert.ok(fired >= 1);
  d.reset();
  assert.equal(d.push(10, t + 5000), false);
});

test('spawnParticles tạo hạt có đời sống', () => {
  const list = spawnParticles('hearts', 0, 0, () => 0.5);
  assert.equal(list.length, 6);
  for (const p of list) assert.ok(p.life > 0);
  stepParticles(list, 2000);
  assert.equal(list.length, 0);
});
