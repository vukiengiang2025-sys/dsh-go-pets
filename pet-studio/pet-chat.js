// Trả lời chat ngắn, kể chuyện, tóm tắt — không gọi model, chạy offline.

const GENERIC = [
  'Mình nghe đây. Kể tiếp đi.',
  'Hừm, để mình nghĩ đã…',
  'Bạn nói gì mình cũng nghe.',
  'Mình đang ngồi cạnh bạn mà.',
];

export function replyTo(text, ctx = {}) {
  const raw = (text || '').trim();
  if (!raw) return 'Bạn chưa nói gì cả.';
  const t = raw.toLowerCase();
  const you = ctx.you || 'bạn';
  const pet = ctx.petName || 'mình';

  if (/(xin )?chào|hello|^hi\b|hí/.test(t)) return 'Chào ' + you + '! ' + pet + ' đang ở đây.';
  if (/mệt|buồn|stress|căng|chán/.test(t)) return 'Nghỉ một chút nhé. Mình ngồi cùng ' + you + '.';
  if (/vui|hay quá|tuyệt|xong rồi/.test(t)) return 'Tuyệt quá! Mình cũng thấy vui.';
  if (/ngủ|buồn ngủ|mất ngủ/.test(t)) return 'Mình cũng hơi buồn ngủ rồi đây…';
  if (/cảm ơn|thanks|thank/.test(t)) return 'Không có gì đâu, ' + you + '.';
  if (/tên gì|tên bạn|tên mày/.test(t)) return 'Mình là ' + pet + '. Còn ' + you + ' tên gì?';
  if (/nhớ gì|ghi nhớ|nhớ không/.test(t)) {
    const mem = (ctx.memories || [])[0];
    return mem ? 'Mình vẫn nhớ: ' + mem : 'Mình chưa được dặn gì để nhớ cả.';
  }
  if (/mấy giờ|giờ/.test(t)) {
    const h = new Date().getHours();
    return 'Bây giờ khoảng ' + h + ' giờ. ' + (h >= 22 || h < 6 ? 'Khuya rồi, ngủ sớm nhé.' : '');
  }
  const seed = raw.length + raw.charCodeAt(0);
  return GENERIC[seed % GENERIC.length];
}

export function storyFor(hour, petName = 'pet') {
  if (hour >= 21 || hour < 6) {
    return petName + ' kể: "Ngày xưa có một ngọn hải đăng nhỏ chỉ sáng khi có người cần. '
      + 'Một đêm, nó thấy bạn thức khuya, bèn hạ ánh sáng xuống thật dịu. '
      + 'Sáng ra, bạn ngủ ngon, còn nó tự hào cả ngày."';
  }
  return petName + ' kể: "Có một chú cá nhỏ học cách bơi ngược dòng. '
    + 'Mỗi lần mệt, nó chỉ bơi chậm lại một nhịp, rồi đi tiếp. '
    + 'Cuối cùng nó tới nơi — chậm hơn, nhưng vẫn tới."';
}

export function summaryFrom(stats = {}, memories = []) {
  const poke = stats.poke || 0;
  const tickle = stats.tickle || 0;
  const minutes = Math.round((stats.seconds || 0) / 60);
  const states = Object.keys(stats.states || {}).length;
  const parts = [
    'Hôm nay: ' + poke + ' lần chọc, ' + tickle + ' lần cù, ' + minutes + ' phút bên nhau, '
      + states + ' trạng thái đã thấy.',
  ];
  if (memories.length) parts.push('Mình còn nhớ ' + memories.length + ' điều bạn dặn.');
  return parts.join(' ');
}
