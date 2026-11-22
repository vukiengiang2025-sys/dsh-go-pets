import test from 'node:test';
import assert from 'node:assert/strict';
import { replyTo, storyFor, summaryFrom } from './pet-chat.js';

test('replyTo bắt từ khoá cơ bản', () => {
  assert.match(replyTo('xin chào', { you: 'An', petName: 'Mây' }), /Chào An/);
  assert.match(replyTo('mệt quá'), /Nghỉ/);
  assert.match(replyTo('cảm ơn nhé'), /Không có gì/);
  assert.match(replyTo('', {}), /chưa nói/);
});

test('replyTo dùng ký ức và tên', () => {
  assert.match(replyTo('mày nhớ gì không', { petName: 'Bơ', memories: ['thích trà sữa'] }), /trà sữa/);
  assert.match(replyTo('tên gì', { petName: 'Bơ' }), /Bơ/);
});

test('storyFor khác nhau theo giờ', () => {
  assert.notEqual(storyFor(22, 'Mây'), storyFor(10, 'Mây'));
  assert.match(storyFor(9, 'Mây'), /Mây kể/);
});

test('summaryFrom gộp số liệu', () => {
  const s = summaryFrom({ poke: 3, tickle: 2, seconds: 600, states: { idle: 1, error: 1 } }, ['a']);
  assert.match(s, /3 lần chọc/);
  assert.match(s, /10 phút/);
  assert.match(s, /2 trạng thái/);
  assert.match(s, /1 điều/);
});
