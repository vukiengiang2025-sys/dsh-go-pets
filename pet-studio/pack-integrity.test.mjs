import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, verifyChecksums } from './pack-integrity.js';

test('sha256Hex khớp vector chuẩn', async () => {
  const hex = await sha256Hex(new TextEncoder().encode('abc'));
  assert.equal(hex, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('verifyChecksums phát hiện sai', async () => {
  const files = { 'idle.png': new Blob([new Uint8Array([1, 2, 3])]) };
  const hash = await sha256Hex(new Uint8Array([1, 2, 3]));
  assert.equal((await verifyChecksums({ checksums: { 'idle.png': hash } }, files)).ok, true);
  assert.equal((await verifyChecksums({ checksums: { 'idle.png': '00' } }, files)).ok, false);
});
