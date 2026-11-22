import test from 'node:test';
import assert from 'node:assert/strict';
import { greetingFor } from './pet-chat.js';

test('greetingFor theo giờ và ngôn ngữ', () => {
  assert.match(greetingFor(7), /Chào buổi sáng/);
  assert.match(greetingFor(7, 'en'), /Good morning/);
  assert.match(greetingFor(23), /Còn thức/);
});
