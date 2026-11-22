import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readZip } from './zip-read.js';
import { buildPackFromZip } from './pack-import.js';

async function fixture() {
  return readFile(new URL('./test-fixtures/mini-pack.zip', import.meta.url));
}

test('readZip đọc được zip deflate', async () => {
  const entries = await readZip(await fixture());
  assert.ok(entries.has('pack.json'));
  assert.ok(entries.has('idle.png'));
  const json = JSON.parse(new TextDecoder().decode(entries.get('pack.json')));
  assert.equal(json.id, 'mini');
  assert.equal(entries.get('idle.png')[0], 0x89);
});

test('buildPackFromZip dựng pack + Blob ảnh', async () => {
  const built = await buildPackFromZip(await fixture());
  assert.equal(built.pack.id, 'mini');
  assert.equal(built.frames, 1);
  assert.ok(built.files['idle.png'] instanceof Blob);
  assert.equal(await built.files['idle.png'].arrayBuffer().then(b => b.byteLength > 40), true);
});

test('zip rác bị từ chối', async () => {
  await assert.rejects(() => readZip(new Uint8Array([1, 2, 3, 4, 5])), /zip/);
});
