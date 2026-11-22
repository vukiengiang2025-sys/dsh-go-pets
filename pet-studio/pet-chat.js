// Trả lời chat ngắn, kể chuyện, tóm tắt — không gọi model, chạy offline.

const GENERIC = [
  'Mình nghe đây. Kể tiếp đi.',
  'Hừm, để mình nghĩ đã…',
  'Bạn nói gì mình cũng nghe.',
  'Mình đang ngồi cạnh bạn mà.',
];

const GENERIC_EN = [
  "I'm listening. Tell me more.",
  'Hmm, let me think…',
  "I'm here for whatever you say.",
  "I'm sitting right next to you.",
];

export function replyTo(text, ctx = {}) {
  const raw = (text || '').trim();
  const en = ctx.lang === 'en';
  if (!raw) return en ? "You haven't said anything yet." : 'Bạn chưa nói gì cả.';
  const t = raw.toLowerCase();
  if (/^(ừ+|uh+|hmm+|ok|oke|vâng|dạ|\.\.\.+\?*|\?+)$/.test(t)) {
    return en ? 'Tell me a little more — what is on your mind?' : 'Kể mình nghe thêm chút đi — bạn đang nghĩ gì?';
  }
  const you = ctx.you || (en ? 'you' : 'bạn');
  const pet = ctx.petName || (en ? 'me' : 'mình');

  if (/(xin )?chào|hello|^hi\b|hí/.test(t)) return en ? 'Hi ' + you + '! ' + pet + ' is here.' : 'Chào ' + you + '! ' + pet + ' đang ở đây.';
  if (/mệt|buồn|stress|căng|chán|tired|sad/.test(t)) return en ? "Take a short break. I'm right here with you." : 'Nghỉ một chút nhé. Mình ngồi cùng ' + you + '.';
  if (/vui|hay quá|tuyệt|xong rồi|great|nice/.test(t)) return en ? 'That is great! I feel happy too.' : 'Tuyệt quá! Mình cũng thấy vui.';
  if (/ngủ|buồn ngủ|mất ngủ|sleepy|sleep/.test(t)) return en ? "I'm getting a little sleepy too…" : 'Mình cũng hơi buồn ngủ rồi đây…';
  if (/cảm ơn|thanks|thank/.test(t)) return en ? "You're welcome, " + you + '.' : 'Không có gì đâu, ' + you + '.';
  if (/tên gì|tên bạn|tên mày|your name/.test(t)) return en ? "I'm " + pet + '. What is your name?' : 'Mình là ' + pet + '. Còn ' + you + ' tên gì?';
  if (/nhớ gì|ghi nhớ|nhớ không|remember/.test(t)) {
    const mem = (ctx.memories || [])[0];
    return en ? (mem ? 'I still remember: ' + mem : "I haven't been asked to remember anything yet.")
      : (mem ? 'Mình vẫn nhớ: ' + mem : 'Mình chưa được dặn gì để nhớ cả.');
  }
  if (/mấy giờ|giờ|time/.test(t)) {
    const h = new Date().getHours();
    return en ? ('It is about ' + h + ':00. ' + (h >= 22 || h < 6 ? 'It is late, sleep soon.' : ''))
      : ('Bây giờ khoảng ' + h + ' giờ. ' + (h >= 22 || h < 6 ? 'Khuya rồi, ngủ sớm nhé.' : ''));
  }
  const seed = raw.length + raw.charCodeAt(0);
  const pool = en ? GENERIC_EN : GENERIC;
  return pool[seed % pool.length];
}

export function storyFor(hour, petName = 'pet', lang = 'vi') {
  if (lang === 'en') {
    return hour >= 21 || hour < 6
      ? petName + ' tells: "Once there was a small lighthouse that only shone when someone needed it. One night it saw you staying up late, so it lowered its light softly. In the morning you slept well, and it was proud all day."'
      : petName + ' tells: "A little fish learned to swim upstream. Whenever it got tired, it just slowed down one beat, then kept going. It reached the end — slower, but it got there."';
  }
  if (hour >= 21 || hour < 6) {
    return petName + ' kể: "Ngày xưa có một ngọn hải đăng nhỏ chỉ sáng khi có người cần. '
      + 'Một đêm, nó thấy bạn thức khuya, bèn hạ ánh sáng xuống thật dịu. '
      + 'Sáng ra, bạn ngủ ngon, còn nó tự hào cả ngày."';
  }
  return petName + ' kể: "Có một chú cá nhỏ học cách bơi ngược dòng. '
    + 'Mỗi lần mệt, nó chỉ bơi chậm lại một nhịp, rồi đi tiếp. '
    + 'Cuối cùng nó tới nơi — chậm hơn, nhưng vẫn tới."';
}

export function summaryFrom(stats = {}, memories = [], lang = 'vi') {
  const poke = stats.poke || 0;
  const tickle = stats.tickle || 0;
  const minutes = Math.round((stats.seconds || 0) / 60);
  const states = Object.keys(stats.states || {}).length;
  if (lang === 'en') {
    const partsEn = ['Today: ' + poke + ' pokes, ' + tickle + ' tickles, ' + minutes + ' minutes together, '
      + states + ' states seen.'];
    if (memories.length) partsEn.push('I remember ' + memories.length + ' things you told me.');
    return partsEn.join(' ');
  }
  const parts = [
    'Hôm nay: ' + poke + ' lần chọc, ' + tickle + ' lần cù, ' + minutes + ' phút bên nhau, '
      + states + ' trạng thái đã thấy.',
  ];
  if (memories.length) parts.push('Mình còn nhớ ' + memories.length + ' điều bạn dặn.');
  return parts.join(' ');
}

export function moodFor(text) {
  const t = String(text || '').toLowerCase();
  if (/(mệt|buồn|stress|căng|chán|tired|sad|exhausted)/.test(t)) return 'sleeping';
  if (/(vui|hay quá|tuyệt|xong rồi|great|happy|done)/.test(t)) return 'attention';
  return null;
}

export function memoryFrom(text) {
  const m = String(text || '').trim();
  const match = m.match(/^(?:nhớ|ghi nhớ|remember)\s+(?:rằng|that)?\s*(.+)$/i);
  if (!match) return null;
  const value = match[1].trim();
  return value ? value.slice(0, 60) : null;
}
