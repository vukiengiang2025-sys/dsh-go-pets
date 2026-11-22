import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRemind, breakText } from './reminders.js';

test('shouldRemind theo khoảng phút', () => {
  const now = 10_000_000;
  assert.equal(shouldRemind(0, now, 45), false);
  assert.equal(shouldRemind(now - 44 * 60000, now, 45), false);
  assert.equal(shouldRemind(now - 45 * 60000, now, 45), true);
  assert.equal(shouldRemind(now - 90 * 60000, now, 45), true);
  assert.equal(shouldRemind(now - 60000, now, 0), true);
});

test('breakText có số phút', () => {
  assert.match(breakText(45), /45 phút/);
});
