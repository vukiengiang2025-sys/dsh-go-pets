// GIF89a tối giản: palette 255 màu + trong suốt, LZW, lặp vô hạn.
// Thuần JS (không DOM), test được bằng Node.

function colorIndex(r, g, b, a) {
  if (a < 128) return 0;
  const idx = 1 + (r >> 6) * 64 + (g >> 5) * 8 + (b >> 5);
  return idx > 255 ? 255 : idx;
}

export function paletteEntry(i) {
  if (i === 0) return [0, 0, 0];
  const n = i - 1;
  const r = (n >> 6) * 85;
  const g = ((n >> 3) & 7) * 36;
  const b = (n & 7) * 36;
  return [r, g, b];
}

export function lzwEncode(indices, minCodeSize = 8) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let dict = new Map();
  let nextCode = eoi + 1;
  let codeSize = minCodeSize + 1;
  const out = [];
  let cur = 0;
  let bits = 0;

  function emit(code) {
    cur |= code << bits;
    bits += codeSize;
    while (bits >= 8) {
      out.push(cur & 0xff);
      cur >>>= 8;
      bits -= 8;
    }
  }
  function reset() {
    dict = new Map();
    nextCode = eoi + 1;
    codeSize = minCodeSize + 1;
  }

  emit(clear);
  let prefix = null;
  for (const k of indices) {
    if (prefix === null) { prefix = k; continue; }
    const key = prefix + ':' + k;
    const found = dict.get(key);
    if (found !== undefined) { prefix = found; continue; }
    emit(prefix);
    dict.set(key, nextCode++);
    if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
    if (nextCode >= 4096) {
      emit(clear);
      reset();
    }
    prefix = k;
  }
  if (prefix !== null) emit(prefix);
  emit(eoi);
  if (bits > 0) out.push(cur & 0xff);
  return Uint8Array.from(out);
}

function writeString(arr, s) { for (const ch of s) arr.push(ch.charCodeAt(0)); }
function writeU16(arr, v) { arr.push(v & 0xff, (v >> 8) & 0xff); }

function lzwSubBlocks(data) {
  const out = [];
  for (let i = 0; i < data.length; i += 255) {
    const chunk = data.subarray(i, i + 255);
    out.push(chunk.length, ...chunk);
  }
  out.push(0);
  return out;
}

export function encodeGif(frames, { width, height, loop = true } = {}) {
  if (!frames.length) throw new Error('không có khung hình');
  const w = width || frames[0].width;
  const h = height || frames[0].height;
  const bytes = [];
  writeString(bytes, 'GIF89a');
  writeU16(bytes, w);
  writeU16(bytes, h);
  bytes.push(0xf7, 0, 0);
  for (let i = 0; i < 256; i++) bytes.push(...paletteEntry(i));
  if (loop) {
    bytes.push(0x21, 0xff, 0x0b);
    writeString(bytes, 'NETSCAPE2.0');
    bytes.push(0x03, 0x01);
    writeU16(bytes, 0);
    bytes.push(0);
  }
  for (const frame of frames) {
    const delay = Math.max(2, Math.round((frame.delay || 100) / 10));
    bytes.push(0x21, 0xf9, 0x04, (2 << 2) | 1);
    writeU16(bytes, delay);
    bytes.push(0, 0);
    bytes.push(0x2c);
    writeU16(bytes, 0);
    writeU16(bytes, 0);
    writeU16(bytes, w);
    writeU16(bytes, h);
    bytes.push(0);
    bytes.push(8);
    const data = frame.indices;
    bytes.push(...lzwSubBlocks(lzwEncode(data, 8)));
  }
  bytes.push(0x3b);
  return Uint8Array.from(bytes);
}

export function quantize(rgba, width, height) {
  const out = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    out[p] = colorIndex(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]);
  }
  return out;
}
