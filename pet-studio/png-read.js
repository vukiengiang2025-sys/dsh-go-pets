// Đọc PNG tối giản (8-bit, không interlace) để test vàng.
import zlib from 'node:zlib';
import crypto from 'node:crypto';

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export function decodePng(buffer) {
  const bytes = Buffer.from(buffer);
  if (bytes.readUInt32BE(0) !== 0x89504e47) throw new Error('không phải PNG');
  let pos = 8;
  let width = 0, height = 0, bitDepth = 8, colorType = 6;
  let palette = [];
  let trns = null;
  const idat = [];
  while (pos < bytes.length) {
    const length = bytes.readUInt32BE(pos);
    const type = bytes.toString('ascii', pos + 4, pos + 8);
    const data = bytes.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('interlace chưa hỗ trợ');
      if (colorType !== 3 && bitDepth !== 8) throw new Error('bitDepth chưa hỗ trợ: ' + bitDepth);
    } else if (type === 'PLTE') {
      for (let i = 0; i < data.length; i += 3) palette.push([data[i], data[i + 1], data[i + 2]]);
    } else if (type === 'tRNS') {
      trns = data;
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : 0;
  if (!bpp) throw new Error('colorType chưa hỗ trợ: ' + colorType);
  const samplesPerPixel = colorType === 3 ? 1 : bpp;
  const bitsPerPixel = samplesPerPixel * bitDepth;
  const filterBpp = Math.max(1, Math.ceil(bitsPerPixel / 8));
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = Math.ceil(width * bitsPerPixel / 8);
  const pixels = Buffer.alloc(stride * height);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const row = raw.subarray(rp, rp + stride);
    rp += stride;
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= filterBpp ? out[x - filterBpp] : 0;
      const b = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const c = x >= filterBpp && y > 0 ? pixels[(y - 1) * stride + x - filterBpp] : 0;
      const v = row[x];
      if (filter === 0) out[x] = v;
      else if (filter === 1) out[x] = (v + a) & 0xff;
      else if (filter === 2) out[x] = (v + b) & 0xff;
      else if (filter === 3) out[x] = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) out[x] = (v + paeth(a, b, c)) & 0xff;
      else throw new Error('filter lạ ' + filter);
    }
  }
  const rgba = Buffer.alloc(width * height * 4);
  const indexAt = (i) => {
    if (bitDepth === 8) return pixels[i];
    const perByte = 8 / bitDepth;
    const byte = pixels[Math.floor(i / perByte)];
    const shift = 8 - bitDepth * ((i % perByte) + 1);
    return (byte >> shift) & ((1 << bitDepth) - 1);
  };
  for (let i = 0; i < width * height; i++) {
    if (colorType === 3) {
      const idx = indexAt(i);
      const rgb = palette[idx] || [0, 0, 0];
      rgba[i * 4] = rgb[0];
      rgba[i * 4 + 1] = rgb[1];
      rgba[i * 4 + 2] = rgb[2];
      rgba[i * 4 + 3] = trns && idx < trns.length ? trns[idx] : 255;
    } else if (colorType === 6) {
      pixels.copy(rgba, i * 4, i * 4, i * 4 + 4);
    } else {
      rgba[i * 4] = pixels[i * 3];
      rgba[i * 4 + 1] = pixels[i * 3 + 1];
      rgba[i * 4 + 2] = pixels[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
  }
  return { width, height, data: rgba };
}

export function pixelHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
