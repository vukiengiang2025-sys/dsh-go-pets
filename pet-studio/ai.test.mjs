import test from 'node:test';
import assert from 'node:assert/strict';
import { chatUrl, buildRequest, parseReply, askAI } from './ai.js';

test('chatUrl chuẩn hoá endpoint', () => {
  assert.equal(chatUrl('https://api.deepseek.com/'), 'https://api.deepseek.com/chat/completions');
  assert.equal(chatUrl('https://x/v1/chat/completions'), 'https://x/v1/chat/completions');
});

test('buildRequest có model và messages', () => {
  const { url, init } = buildRequest({ endpoint: 'https://x', model: 'm', messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(url, 'https://x/chat/completions');
  const body = JSON.parse(init.body);
  assert.equal(body.model, 'm');
  assert.equal(body.messages[0].content, 'hi');
});

test('parseReply lấy nội dung', () => {
  assert.equal(parseReply({ choices: [{ message: { content: ' chào ' } }] }), 'chào');
});

test('askAI gửi Bearer và trả lời', async () => {
  let seen;
  const fake = async (url, init) => {
    seen = { url, auth: init.headers.Authorization };
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'ừ' } }] }) };
  };
  const out = await askAI({ endpoint: 'https://x', model: 'm', key: 'k' }, [], fake);
  assert.equal(out, 'ừ');
  assert.equal(seen.auth, 'Bearer k');
});

test('askAI báo lỗi HTTP', async () => {
  const fake = async () => ({ ok: false, status: 401, text: async () => 'no' });
  await assert.rejects(() => askAI({ endpoint: 'https://x', model: 'm' }, [], fake), /HTTP 401/);
});
