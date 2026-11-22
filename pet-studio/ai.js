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

export async function askAI(config, messages, fetchImpl = fetch) {
  const { url, init } = buildRequest({
    endpoint: config.endpoint,
    model: config.model,
    messages,
  });
  const headers = { ...init.headers };
  if (config.key) headers.Authorization = 'Bearer ' + config.key;
  const res = await fetchImpl(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('HTTP ' + res.status + (body ? ': ' + body.slice(0, 120) : ''));
  }
  return parseReply(await res.json());
}
