// Gọi API chat completions kiểu OpenAI (DeepSeek, Groq, Ollama...).

export function chatUrl(endpoint) {
  const base = String(endpoint || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('thiếu endpoint');
  if (base.endsWith('/chat/completions')) return base;
  return base + '/chat/completions';
}

export function buildRequest({ endpoint, model, messages, maxTokens = 160 }) {
  if (!model) throw new Error('thiếu model');
  return {
    url: chatUrl(endpoint),
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: maxTokens,
        stream: false,
      }),
    },
  };
}

export function parseReply(json) {
  const text = json && json.choices && json.choices[0]
    && json.choices[0].message && json.choices[0].message.content;
  if (!text) throw new Error('phản hồi không có nội dung');
  return String(text).trim().slice(0, 300);
}

export async function askAI(config, messages, fetchImpl = null) {
  const { url, init } = buildRequest({
    endpoint: config.endpoint,
    model: config.model,
    messages,
  });
  const bridge = typeof window !== 'undefined' && window.AndroidPet && window.AndroidPet.aiRequest;
  if (bridge && !fetchImpl) {
    const raw = bridge(url, config.key ? 'Bearer ' + config.key : '', init.body);
    let envelope;
    try {
      envelope = JSON.parse(raw);
    } catch (err) {
      throw new Error('bridge trả về không hợp lệ');
    }
    if (!envelope.ok) throw new Error('HTTP ' + envelope.status + ': ' + String(envelope.body || '').slice(0, 120));
    let json;
    try {
      json = JSON.parse(envelope.body);
    } catch (err) {
      throw new Error('phản hồi không phải JSON');
    }
    return parseReply(json);
  }
  const doFetch = fetchImpl || fetch;
  const headers = { ...init.headers };
  if (config.key) headers.Authorization = 'Bearer ' + config.key;
  const res = await doFetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('HTTP ' + res.status + (body ? ': ' + body.slice(0, 120) : ''));
  }
  return parseReply(await res.json());
}
