import test from 'node:test';
import assert from 'node:assert/strict';
import { todayKey, bumpStreak, questDone, clock } from './care.js';

test('bumpStreak tăng khi hôm qua, reset khi đứt', () => {
  const today = '2026-11-22';
  assert.deepEqual(bumpStreak({ count: 3, last: '2026-11-21' }, today), { count: 4, last: today });
  assert.deepEqual(bumpStreak({ count: 3, last: '2026-11-20' }, today), { count: 1, last: today });
  assert.deepEqual(bumpStreak({ count: 3, last: today }, today), { count: 3, last: today });
  assert.deepEqual(bumpStreak(null, today), { count: 1, last: today });
});

test('bumpStreak qua cuối tháng', () => {
  assert.deepEqual(bumpStreak({ count: 1, last: '2026-10-31' }, '2026-11-01'), { count: 2, last: '2026-11-01' });
});

test('questDone và clock', () => {
  assert.equal(questDone(2, 3), false);
  assert.equal(questDone(3, 3), true);
  assert.equal(clock(65_000), '01:05');
  assert.equal(clock(0), '00:00');
  assert.match(todayKey(new Date(2026, 0, 5)), /2026-01-05/);
});
