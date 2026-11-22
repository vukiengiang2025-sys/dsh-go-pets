// Chọn pet theo mùa — thuần, test được.

export const SEASON_PACK = { tet: 'may-tet', snow: 'may-snow' };

export function seasonFor(date = new Date()) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if ((m === 1 && d >= 20) || (m === 2 && d <= 15)) return 'tet';
  if (m === 12 || m === 1 || m === 2) return 'snow';
  return null;
}
