import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPackMeta, gridFor, packIdFrom, scaleToFit, MAX_SHEET_SIDE } from './pack-import.js';

test('buildPackMeta tạo pack hợp lệ', () => {
  const pack = buildPackMeta({
    id: 'user-demo', name: 'Demo', width: 64, height: 64, count: 6,
    durations: [100, 120, 140, 160, 180, 200], cols: 3,
    contentBox: { x: 8, y: 6, w: 48, h: 52 },
  });
  assert.equal(pack.schema, 1);
  assert.equal(pack.animations.idle.frames.length, 6);
  assert.equal(pack.animations.idle.cols, 3);
  assert.equal(pack.animations.idle.frames[2].ms, 140);
  assert.deepEqual(pack.states.idle, ['idle']);
  assert.equal(pack.anchor.x, 32);
  assert.equal(pack.anchor.baseline, 58);
  assert.equal(pack.contentBox.w, 48);
});

test('gridFor không vượt 4096 px', () => {
  const { cols, rows } = gridFor(24, 256);
  assert.ok(cols * 256 <= MAX_SHEET_SIDE);
  assert.equal(cols * rows >= 24, true);
});

test('packIdFrom ổn định và an toàn', () => {
  const a = packIdFrom('Mèo Mun (1).gif');
  const b = packIdFrom('Mèo Mun (1).gif');
  assert.equal(a, b);
  assert.match(a, /^user-[a-z0-9-]+$/);
  assert.ok(a.length <= 40);
});

test('scaleToFit giữ tỉ lệ', () => {
  const s = scaleToFit(1024, 512);
  assert.equal(s.width, 256);
  assert.equal(s.height, 128);
  assert.deepEqual(scaleToFit(64, 64), { width: 64, height: 64 });
});
