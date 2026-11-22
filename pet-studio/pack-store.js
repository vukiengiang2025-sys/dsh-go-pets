// Lưu pack người dùng nhập vào IndexedDB (ảnh + pack.json), không gửi đi đâu.

const DB_NAME = 'petstudio-packs';
const DB_VERSION = 1;
const STORE = 'packs';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const out = fn(store);
    t.oncomplete = () => { db.close(); resolve(out && out.result !== undefined ? out.result : undefined); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

export async function savePack(record) {
  await tx('readwrite', store => store.put(record));
  return record;
}

export async function listPacks() {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => { db.close(); resolve(req.result || []); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function getPack(id) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deletePack(id) {
  await tx('readwrite', store => store.delete(id));
}
