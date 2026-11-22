// Nhắc nghỉ: hàm thuần để test được.
export function shouldRemind(lastMs, nowMs, minutes) {
  const mins = Number.isFinite(Number(minutes)) ? Math.max(1, Number(minutes)) : 45;
  const gap = mins * 60000;
  if (!lastMs) return false;
  return nowMs - lastMs >= gap;
}
export function breakText(minutes, lang = 'vi') {
  const m = Number(minutes) || 45;
  return lang === 'en'
    ? 'You have sat for ' + m + ' minutes — stand up and stretch!'
    : 'Ngồi ' + m + ' phút rồi — đứng dậy vươn vai nhé!';
}
