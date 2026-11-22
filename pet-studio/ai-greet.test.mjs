import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldGreet } from './ai.js';

test('shouldGreet sau 2 giờ', () => {
  const now = 10_000_000;
  assert.equal(shouldGreet(now - 3 * 3600 * 1000, now), true);
  assert.equal(shouldGreet(now - 3600 * 1000, now), false);
  assert.equal(shouldGreet(0, now), false);
});
