// Tính chuỗi ngày, nhiệm vụ ngày, đồng hồ Pomodoro — thuần, test được.

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function yesterdayKey(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export function nextStreak(prev, today) {
  const count = prev && Number(prev.count) > 0 ? Number(prev.count) : 0;
  if (!prev || !prev.last) return { count: 1, last: today };
  if (prev.last === today) return { count: Math.max(1, count), last: today };
  return { count: 1, last: today };
}

export function bumpStreak(prev, today) {
  if (!prev || !prev.last) return { count: 1, last: today };
  if (prev.last === today) return prev;
  if (prev.last === yesterdayFrom(today)) return { count: (prev.count || 0) + 1, last: today };
  return { count: 1, last: today };
}

function yesterdayFrom(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

export function questDone(roams, goal = 3) {
  return (roams || 0) >= goal;
}

export function clock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
