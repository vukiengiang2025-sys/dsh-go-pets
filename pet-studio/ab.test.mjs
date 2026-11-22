import test from 'node:test';
import assert from 'node:assert/strict';
import { assignVariant } from './ab.js';

test('assignVariant ổn định', () => {
  assert.equal(assignVariant('abc'), assignVariant('abc'));
  assert.match(assignVariant('abc'), /^[AB]$/);
});

test('assignVariant có cả hai nhóm', () => {
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(assignVariant('seed' + i));
  assert.equal(seen.size, 2);
});
