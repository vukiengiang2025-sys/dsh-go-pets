import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryFrom } from './pet-chat.js';

test('memoryFrom lấy nội dung sau "nhớ"', () => {
  assert.equal(memoryFrom('nhớ rằng mình thích trà sữa'), 'mình thích trà sữa');
  assert.equal(memoryFrom('remember that I like tea'), 'I like tea');
  assert.equal(memoryFrom('hôm nay trời đẹp'), null);
});

test('memoryFrom nhận sở thích/tên/sinh nhật', () => {
  assert.equal(memoryFrom('mình thích trà sữa'), 'thích trà sữa');
  assert.match(memoryFrom('tôi ghét mưa'), /ghét mưa/);
  assert.match(memoryFrom('mình tên là An'), /An/);
  assert.match(memoryFrom('sinh nhật của mình là 3/4'), /3\/4/);
});
