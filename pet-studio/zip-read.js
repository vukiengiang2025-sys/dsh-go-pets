// Đọc zip tối giản (store + deflate), không thư viện ngoài. Trả Map<tên, Uint8Array>.
// Giới hạn theo docs/pets/README.md của dsh-go.

export const ZIP_LIMITS = {
  entries: 256,
  total: 64 * 1024 * 1024,
  entry: 8 * 1024 * 1024,
  packJson: 256 * 1024,
};

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

function unsafeName(name) {
  if (!name || name.startsWith('/') || name.includes('\\') || name.includes(':')) return true;
  const parts = name.split('/');
  return parts.some(p => p === '..' || p === '.');
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('trình duyệt không hỗ trợ giải nén deflate');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZip(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let eocd = -1;
  const stop = Math.max(0, bytes.length - 22 - 0xffff);
  for (let i = bytes.length - 22; i >= stop; i--) {
    if (view.getUint32(i, true) === EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('không phải tệp zip');

  const count = view.getUint16(eocd + 10, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  if (count > ZIP_LIMITS.entries) throw new Error('zip có quá nhiều tệp');

  const out = new Map();
  let total = 0;
  let offset = cdOffset;

  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== CENTRAL) throw new Error('zip hỏng (central directory)');
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const size = view.getUint32(offset + 24, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder('utf-8').decode(bytes.subarray(offset + 46, offset + 46 + nameLen));
    offset += 46 + nameLen + extraLen + commentLen;

    if (flags & 0x1) throw new Error('zip có mật khẩu, không hỗ trợ');
    if (compressedSize === 0xffffffff || size === 0xffffffff) throw new Error('zip64 chưa hỗ trợ');
    if (size > ZIP_LIMITS.entry) throw new Error('tệp trong zip quá lớn: ' + name);
    total += size;
    if (total > ZIP_LIMITS.total) throw new Error('zip giải nén quá lớn');
    if (unsafeName(name)) throw new Error('đường dẫn không hợp lệ: ' + name);
    if (name.endsWith('/')) continue;

    if (view.getUint32(localOffset, true) !== LOCAL) throw new Error('zip hỏng (local header)');
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const raw = bytes.subarray(dataStart, dataStart + compressedSize);

    let data;
    if (method === 0) data = raw;
    else if (method === 8) data = await inflateRaw(raw);
    else throw new Error('zip dùng kiểu nén lạ: ' + method);

    if (data.length !== size) throw new Error('giải nén sai kích thước: ' + name);
    out.set(name, data);
  }
  return out;
}
