import test from 'node:test';
import assert from 'node:assert/strict';
import { chatUrl, buildRequest, parseReply, askAI, PRESETS } from './ai.js';

test('chatUrl chuẩn hoá endpoint openai', () => {
  assert.equal(chatUrl('https://api.deepseek.com/'), 'https://api.deepseek.com/chat/completions');
  assert.equal(chatUrl('https://x/v1/chat/completions'), 'https://x/v1/chat/completions');
});

test('chatUrl gemini có model', () => {
  assert.equal(chatUrl('https://g/v1beta', 'gemini-2.0-flash', 'gemini'),
    'https://g/v1beta/models/gemini-2.0-flash:generateContent');
});

test('buildRequest openai có model/messages', () => {
  const { url, init } = buildRequest({ endpoint: 'https://x', model: 'm', messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(url, 'https://x/chat/completions');
  const body = JSON.parse(init.body);
  assert.equal(body.model, 'm');
  assert.equal(body.messages[0].content, 'hi');
});

test('buildRequest gemini dùng contents/parts', () => {
  const { init } = buildRequest({ provider: 'gemini', endpoint: 'https://g', model: 'gm', messages: [{ role: 'user', content: 'hi' }] });
  const body = JSON.parse(init.body);
  assert.equal(body.contents[0].parts[0].text, 'hi');
});

test('parseReply openai và gemini', () => {
  assert.equal(parseReply({ choices: [{ message: { content: ' chào ' } }] }), 'chào');
  assert.equal(parseReply({ candidates: [{ content: { parts: [{ text: 'hí' }] } }] }, 'gemini'), 'hí');
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

test('askAI gemini đưa key vào query', async () => {
  let seen;
  const fake = async (url) => {
    seen = url;
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) };
  };
  const out = await askAI({ provider: 'gemini', endpoint: 'https://g', model: 'gm', key: 'K' }, [], fake);
  assert.equal(out, 'ok');
  assert.match(seen, /key=K/);
});

test('askAI báo lỗi HTTP', async () => {
  const fake = async () => ({ ok: false, status: 401, text: async () => 'no' });
  await assert.rejects(() => askAI({ endpoint: 'https://x', model: 'm' }, [], fake), /HTTP 401/);
});

test('có preset cho các nhà cung cấp', () => {
  for (const k of ['openai', 'deepseek', 'gemini', 'groq', 'ollama']) assert.ok(PRESETS[k].endpoint);
});
