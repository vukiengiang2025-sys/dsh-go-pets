import test from 'node:test';
import assert from 'node:assert/strict';
import { PetModel, frameAt, normalizePack, pickStateAnim } from './pet-engine.js';

const pack = normalizePack({
  schema: 1,
  canvas: { w: 10, h: 10 },
  contentBox: { x: 1, y: 1, w: 8, h: 8 },
  states: { idle: ['idle'], attention: ['done'], sleeping: ['sleep'], notification: ['notify'] },
  animations: {
    idle: { sheet: 'a.png', frameW: 10, frameH: 10, cols: 1, box: { x: 0, y: 0, w: 10, h: 10 }, frames: [{ i: 0, ms: 100 }, { i: 0, ms: 100 }] },
    done: { sheet: 'a.png', frameW: 10, frameH: 10, cols: 1, box: { x: 0, y: 0, w: 10, h: 10 }, frames: [{ i: 0, ms: 100 }], loop: false },
    sleep: { sheet: 'a.png', frameW: 10, frameH: 10, cols: 1, box: { x: 0, y: 0, w: 10, h: 10 }, frames: [{ i: 0, ms: 900 }] },
    notify: { sheet: 'a.png', frameW: 10, frameH: 10, cols: 1, box: { x: 0, y: 0, w: 10, h: 10 }, frames: [{ i: 0, ms: 200 }] },
    poke: { sheet: 'a.png', frameW: 10, frameH: 10, cols: 1, box: { x: 0, y: 0, w: 10, h: 10 }, frames: [{ i: 0, ms: 100 }] },
  },
  reactions: { tapLeft: 'poke' },
  sleep: { afterMs: 5000 },
});

test('frameAt chia thời lượng và lặp', () => {
  assert.equal(frameAt({ frames: [{ ms: 100 }, { ms: 100 }] }, 0), 0);
  assert.equal(frameAt({ frames: [{ ms: 100 }, { ms: 100 }] }, 150), 1);
  assert.equal(frameAt({ frames: [{ ms: 100 }, { ms: 100 }] }, 250), 0);
  assert.equal(frameAt({ frames: [{ ms: 100 }, { ms: 100 }], loop: false }, 999), 1);
});

test('normalizePack gắn tên animation và idle mặc định', () => {
  const p = normalizePack({ schema: 1, animations: { walk: { sheet: 'a.png', frameW: 1, frameH: 1, cols: 1, box: { x: 0, y: 0, w: 1, h: 1 }, frames: [] } } });
  assert.equal(p.animations.walk.name, 'walk');
  assert.deepEqual(p.states.idle, ['walk']);
  assert.equal(pickStateAnim(p, 'missing').name, 'walk');
});

test('one-shot attention quay về idle', () => {
  const m = new PetModel(pack, { now: 0 });
  assert.equal(m.tick(0).name, 'idle');
  m.setState('attention');
  assert.equal(m.tick(10).name, 'done');
  assert.equal(m.tick(5300).name, 'idle');
});

test('notification giữ tới khi xoá', () => {
  const m = new PetModel(pack, { now: 0 });
  m.setState('notification');
  assert.equal(m.state, 'notification');
  assert.equal(m.tick(10000).name, 'notify');
  m.clearNotification();
  assert.equal(m.tick(10100).name, 'idle');
});

test('tự ngủ sau sleep.afterMs, chạm thì thức', () => {
  const m = new PetModel(pack, { now: 0 });
  m.tick(500);
  assert.equal(m.state, 'idle');
  m.tick(6000);
  assert.equal(m.state, 'sleeping');
  assert.equal(m.touch(), true);
  assert.equal(m.state, 'waking');
});

test('reaction tạm thời rồi trả về trạng thái', () => {
  const m = new PetModel(pack, { now: 0 });
  m.poke(-10);
  assert.equal(m.tick(10).name, 'poke');
  assert.equal(m.tick(1200).name, 'idle');
  assert.equal(m.state, 'idle');
});

test('pack thật: mọi sheet và state đều tồn tại', async () => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const roots = ['may', 'dsh-bot'];
  for (const id of roots) {
    const dir = path.join(import.meta.dirname, '..', 'app', 'assets', 'pets', id);
    const json = JSON.parse(await fs.readFile(path.join(dir, 'pack.json'), 'utf8'));
    const p = normalizePack(json);
    for (const [name, anim] of Object.entries(p.animations)) {
      assert.ok(anim.sheet, name + ' thiếu sheet');
      await fs.access(path.join(dir, anim.sheet));
    }
    for (const [state, list] of Object.entries(p.states)) {
      for (const name of list) assert.ok(p.animations[name], id + ': state ' + state + ' trỏ ' + name);
    }
  }
});
