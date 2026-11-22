import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemPrompt, PERSONAS } from './ai.js';

test('buildSystemPrompt có tên, tính cách, ký ức, trạng thái', () => {
  const prompt = buildSystemPrompt({
    name: 'Mây', persona: 'funny', memories: ['thích trà sữa'], state: 'đang làm', hour: 23,
  });
  assert.match(prompt, /Mây/);
  assert.match(prompt, /hóm hỉnh/);
  assert.match(prompt, /trà sữa/);
  assert.match(prompt, /đang làm/);
  assert.match(prompt, /đêm khuya/);
});

test('persona lạ quay về dịu dàng', () => {
  assert.match(buildSystemPrompt({ persona: 'unknown' }), new RegExp(PERSONAS.gentle.hint));
});
