// Danh sách endpoint agent đã lưu.
export function upsertHost(hosts, url) {
  const clean = String(url || '').trim();
  if (!/^https?:\/\//.test(clean)) return hosts || [];
  const rest = (hosts || []).filter(h => h !== clean);
  return [clean, ...rest].slice(0, 6);
}

export function removeHost(hosts, url) {
  return (hosts || []).filter(h => h !== url);
}
