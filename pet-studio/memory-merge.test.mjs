import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMemory } from './pet-chat.js';

test('mergeMemory thay sở thích cũ và tên cũ', () => {
  let list = mergeMemory([], 'thích trà sữa');
  list = mergeMemory(list, 'ghét trà sữa');
  assert.deepEqual(list, ['ghét trà sữa']);
  list = mergeMemory(list, 'tên An');
  list = mergeMemory(list, 'tên Bình');
  assert.deepEqual(list.filter(x => x.startsWith('tên ')), ['tên Bình']);
});

test('mergeMemory không nhân đôi', () => {
  const list = mergeMemory(['thích cà phê'], 'thích cà phê');
  assert.deepEqual(list, ['thích cà phê']);
});
