import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeConfig, decodeConfig, shareUrl, pickConfig } from './share.js';

test('encode/decode giữ nguyên tiếng Việt', () => {
  const cfg = { name: 'Mây nhỏ', palette: 'tim', quiet: true };
  const code = encodeConfig(cfg);
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeConfig(code), cfg);
});

test('decode rác trả null', () => {
  assert.equal(decodeConfig('!!!'), null);
  assert.equal(decodeConfig(''), null);
});

test('shareUrl đặt hash cfg', () => {
  const url = shareUrl('https://x.test/pet-studio/', { pack: 'may' });
  assert.match(url, /#cfg=/);
});

test('pickConfig chỉ lấy khoá đã biết', () => {
  const picked = pickConfig({ pack: 'may', name: 'A', stats: { poke: 9 }, evil: 1 });
  assert.deepEqual(picked, { pack: 'may', name: 'A' });
});
