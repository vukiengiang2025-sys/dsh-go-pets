import test from 'node:test';
import assert from 'node:assert/strict';
import { askAI } from './ai.js';

test('askAI thử lại một lần khi lỗi mạng', async () => {
  let calls = 0;
  const fake = async () => {
    calls += 1;
    if (calls === 1) throw new Error('Failed to fetch');
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) };
  };
  const out = await askAI({ endpoint: 'https://x', model: 'm' }, [], fake);
  assert.equal(out, 'ok');
  assert.equal(calls, 2);
});

test('askAI không thử lại khi 401', async () => {
  let calls = 0;
  const fake = async () => {
    calls += 1;
    return { ok: false, status: 401, text: async () => 'no' };
  };
  await assert.rejects(() => askAI({ endpoint: 'https://x', model: 'm' }, [], fake), /HTTP 401/);
  assert.equal(calls, 1);
});
