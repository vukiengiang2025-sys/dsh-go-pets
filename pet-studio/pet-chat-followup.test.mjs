import test from 'node:test';
import assert from 'node:assert/strict';
import { replyTo } from './pet-chat.js';

test('câu ngắn mơ hồ được hỏi lại', () => {
  assert.match(replyTo('ừ'), /Kể mình nghe thêm/);
  assert.match(replyTo('hmm', { lang: 'en' }), /Tell me a little more/);
});
