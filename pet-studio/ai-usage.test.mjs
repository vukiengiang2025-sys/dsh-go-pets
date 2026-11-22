import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateTokens } from './ai.js';

test('estimateTokens ước lượng theo ký tự', () => {
  assert.equal(estimateTokens('abcd'), 1);
  assert.equal(estimateTokens('a'.repeat(40)), 10);
  assert.equal(estimateTokens(''), 1);
});
