import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryFrom } from './pet-chat.js';

test('memoryFrom lấy nội dung sau "nhớ"', () => {
  assert.equal(memoryFrom('nhớ rằng mình thích trà sữa'), 'mình thích trà sữa');
  assert.equal(memoryFrom('remember that I like tea'), 'I like tea');
  assert.equal(memoryFrom('hôm nay trời đẹp'), null);
});
