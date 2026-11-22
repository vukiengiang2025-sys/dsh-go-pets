// Gọi API chat: OpenAI-compatible và Gemini.

export const PRESETS = {
  openai: { endpoint: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  deepseek: { endpoint: 'https://api.deepseek.com', model: 'deepseek-chat' },
  gemini: { endpoint: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash' },
  groq: { endpoint: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  ollama: { endpoint: 'http://10.0.2.2:11434/v1', model: 'llama3.2' },
};

export function normalizeEndpoint(endpoint) {
  let url = String(endpoint || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url.replace(/\/+$/, '');
}

export function chatUrl(endpoint, model = '', provider = 'openai') {
  const base = normalizeEndpoint(endpoint);
  if (!base) throw new Error('thiếu endpoint');
  if (provider === 'gemini') {
    if (!model) throw new Error('thiếu model');
    return base + '/models/' + encodeURIComponent(model) + ':generateContent';
  }
  if (base.endsWith('/chat/completions')) return base;
  return base + '/chat/completions';
}

export function buildRequest({ provider = 'openai', endpoint, model, messages, maxTokens = 120 }) {
  if (!model) throw new Error('thiếu model');
  if (provider === 'gemini') {
    return {
      url: chatUrl(endpoint, model, 'gemini'),
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature: 0.8, maxOutputTokens: maxTokens },
        }),
      },
    };
  }
  return {
    url: chatUrl(endpoint, model, 'openai'),
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

export function parseReply(json, provider = 'openai') {
  if (provider === 'gemini') {
    const parts = json && json.candidates && json.candidates[0]
      && json.candidates[0].content && json.candidates[0].content.parts;
    const text = Array.isArray(parts) ? parts.map(p => p.text || '').join('') : '';
    if (!text.trim()) throw new Error('phản hồi không có nội dung');
    return text.trim().slice(0, 300);
  }
  const text = json && json.choices && json.choices[0]
    && json.choices[0].message && json.choices[0].message.content;
  if (!text) throw new Error('phản hồi không có nội dung');
  return String(text).trim().slice(0, 300);
}

export async function askAI(config, messages, fetchImpl = null) {
  const provider = config.provider || 'openai';
  const { url, init } = buildRequest({
    provider,
    endpoint: config.endpoint,
    model: config.model,
    messages,
  });
  let target = url;
  const headers = { ...init.headers };
  if (provider === 'gemini') {
    if (config.key) target += '?key=' + encodeURIComponent(config.key);
  } else if (config.key) {
    headers.Authorization = 'Bearer ' + config.key;
  }

  const bridge = typeof window !== 'undefined' && window.AndroidPet && window.AndroidPet.aiRequest;
  if (bridge && !fetchImpl) {
    const auth = headers.Authorization || '';
    const raw = bridge(target, auth, init.body);
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
    return parseReply(json, provider);
  }

  const doFetch = fetchImpl || fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await doFetch(target, { ...init, headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('HTTP ' + res.status + (body ? ': ' + body.slice(0, 120) : ''));
  }
  return parseReply(await res.json(), provider);
}

export function friendlyAIError(err) {
  const msg = String((err && err.message) || err || '');
  if (/401|403/.test(msg)) return 'Key sai hoặc không có quyền';
  if (/429/.test(msg)) return 'Bị giới hạn tần suất, thử lại sau';
  if (/HTTP 5\d\d/.test(msg)) return 'Máy chủ AI đang lỗi, thử lại';
  if (/Failed to fetch|NetworkError|ENOTFOUND|timeout/i.test(msg)) return 'Không kết nối được tới API';
  return msg;
}

export const PERSONAS = {
  gentle: { vi: 'dịu dàng', hint: 'nói nhẹ nhàng, quan tâm, kiên nhẫn' },
  funny: { vi: 'hài hước', hint: 'hóm hỉnh, thích đùa, câu ngắn' },
  lazy: { vi: 'lười', hint: 'lười biếng, càu nhàu nhẹ nhưng vẫn quan tâm' },
};

export function buildSystemPrompt({ name = 'pet', persona = 'gentle', memories = [], state = '', hour = 12, userName = '' } = {}) {
  const p = PERSONAS[persona] || PERSONAS.gentle;
  const time = hour >= 22 || hour < 6 ? 'đêm khuya' : hour < 11 ? 'buổi sáng' : hour < 18 ? 'buổi chiều' : 'buổi tối';
  return 'Bạn là ' + name + ', một pet nhỏ sống trên màn hình điện thoại của người dùng. '
    + 'Tính cách: ' + p.hint + '. '
    + 'Trả lời ngắn (1-2 câu), tự nhiên, xưng "mình" và gọi người dùng là "bạn". '
    + 'Trả lời cùng ngôn ngữ với người dùng. Không bịa việc bạn không biết, không hứa làm việc thật. '
    + (userName ? 'Người dùng tên ' + userName + '. ' : '')
    + 'Bây giờ là ' + time + '. '
    + (state ? 'Trạng thái hiện tại của bạn: ' + state + '. ' : '')
    + (memories.length ? 'Bạn nhớ: ' + memories.slice(-5).join('; ') + '. ' : '');
}

export function shouldGreet(lastOpen, now, hours = 2) {
  if (!lastOpen) return false;
  return now - lastOpen >= hours * 3600 * 1000;
}


export function aiSig(config = {}) {
  const raw = [config.provider || 'openai', config.endpoint || '', config.model || ''].join('|');
  let hash = 0;
  const key = String(config.key || '');
  for (const ch of raw + '#' + key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash.toString(36);
}

export function testCacheValid(sig, at, now, minutes = 5) {
  return Boolean(sig && at && now - at < minutes * 60000);
}
