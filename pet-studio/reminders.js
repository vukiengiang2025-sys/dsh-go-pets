// Nhắc nghỉ: hàm thuần để test được.
export function shouldRemind(lastMs, nowMs, minutes) {
  const mins = Number.isFinite(Number(minutes)) ? Math.max(1, Number(minutes)) : 45;
  const gap = mins * 60000;
  if (!lastMs) return false;
  return nowMs - lastMs >= gap;
}
export function breakText(minutes) {
  return 'Ngồi ' + (Number(minutes) || 45) + ' phút rồi — đứng dậy vươn vai nhé!';
}
