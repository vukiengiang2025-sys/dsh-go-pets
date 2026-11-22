// Mã hoá cấu hình vào URL (chia sẻ) — thuần, test được.

export function encodeConfig(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeConfig(text) {
  if (!text) return null;
  try {
    const normalized = text.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function shareUrl(base, config) {
  const url = new URL(base);
  url.hash = 'cfg=' + encodeConfig(config);
  return url.toString();
}

export function pickConfig(store = {}) {
  const keys = ['pack', 'size', 'quiet', 'palette', 'name', 'profile', 'speech', 'speechRate', 'voiceName', 'breakMinutes', 'simple', 'autoTheme'];
  const out = {};
  for (const key of keys) if (key in store) out[key] = store[key];
  return out;
}

export function backupOf(store = {}) {
  const copy = { ...store };
  delete copy.aiKey;
  delete copy.aiTestSig;
  delete copy.aiTestAt;
  return copy;
}

export const BACKUP_KEYS = ['pack', 'size', 'quiet', 'palette', 'name', 'userName', 'profile', 'stats', 'journal',
  'chat', 'memories', 'speech', 'speechRate', 'voiceName', 'breakReminder', 'breakMinutes',
  'autoTheme', 'autoSeason', 'simple', 'ambientMode', 'ambientVolume', 'overlayFloat',
  'aiProvider', 'aiEndpoint', 'aiModel', 'aiPersona'];

export function importableBackup(data) {
  if (!data || typeof data !== 'object') throw new Error('không phải JSON');
  const out = {};
  for (const key of BACKUP_KEYS) if (key in data) out[key] = data[key];
  return out;
}
