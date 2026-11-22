// Dựng pack.json + sheet từ một ảnh/GIF/APNG hoặc từ zip có sẵn. Phần meta và
// phần đọc zip không phụ thuộc DOM để test được bằng Node.

import { readZip, ZIP_LIMITS } from './zip-read.js';

export const MAX_SIDE = 256;
export const MAX_FRAMES = 24;
export const MAX_SHEET_SIDE = 4096;

export function packIdFrom(name) {
  const base = (name || 'pet').toLowerCase().replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'pet';
  let hash = 0;
  for (const ch of (name || 'pet')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return 'user-' + base + '-' + hash.toString(16).slice(0, 6);
}

export function gridFor(count, frameWidth) {
  const cols = Math.max(1, Math.min(count, Math.floor(MAX_SHEET_SIDE / frameWidth)));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

export function buildPackMeta({ id, name, width, height, count, durations, contentBox, cols, states = ['idle'] }) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push({ i, ms: durations[i] || 120 });
  }
  return {
    schema: 1,
    id,
    name: name || id,
    author: 'Pet Studio',
    license: 'CC-BY-4.0',
    source: 'nhập trong app',
    pixelArt: false,
    scale: 1,
    canvas: { w: width, h: height },
    anchor: { x: Math.round(width / 2), baseline: contentBox.y + contentBox.h },
    contentBox,
    hitBoxes: { default: contentBox },
    animations: Object.fromEntries(states.map(st => [st, {
      sheet: 'idle.png', frameW: width, frameH: height, cols,
      box: { x: 0, y: 0, w: width, h: height }, frames, loop: true,
    }])),
    states: Object.fromEntries(states.map(st => [st, [st]])),
    reactions: {},
    sleep: { afterMs: 60000 },
  };
}

export function scaleToFit(width, height, max = MAX_SIDE) {
  const factor = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}

export async function readFrames(file) {
  const type = file.type || 'image/png';
  if (typeof ImageDecoder !== 'undefined') {
    try {
      const data = await file.arrayBuffer();
      const decoder = new ImageDecoder({ data, type });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;
      const total = Math.min(track ? track.frameCount : 1, MAX_FRAMES);
      const frames = [];
      for (let i = 0; i < total; i++) {
        const { image } = await decoder.decode({ frameIndex: i });
        const ms = Math.min(1000, Math.max(40, Math.round((image.duration || 100000) / 1000)));
        const canvas = document.createElement('canvas');
        canvas.width = image.displayWidth;
        canvas.height = image.displayHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);
        frames.push({ canvas, ms });
        image.close();
      }
      decoder.close();
      if (frames.length) return frames;
    } catch (err) {
      console.warn('ImageDecoder lỗi, dùng ảnh tĩnh', err);
    }
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return [{ canvas, ms: 1000 }];
}

export async function buildPackFromFile(file, options = {}) {
  const raw = await readFrames(file);
  const size = scaleToFit(raw[0].canvas.width, raw[0].canvas.height);
  const count = raw.length;
  const { cols, rows } = gridFor(count, size.width);
  const sheet = document.createElement('canvas');
  sheet.width = cols * size.width;
  sheet.height = rows * size.height;
  const ctx = sheet.getContext('2d');
  const durations = [];
  raw.forEach((item, i) => {
    const x = (i % cols) * size.width;
    const y = Math.floor(i / cols) * size.height;
    ctx.drawImage(item.canvas, x, y, size.width, size.height);
    durations.push(item.ms);
  });
  const first = document.createElement('canvas');
  first.width = size.width;
  first.height = size.height;
  first.getContext('2d').drawImage(raw[0].canvas, 0, 0, size.width, size.height);
  const contentBox = alphaBox(first);
  const id = packIdFrom(file.name);
  const pack = buildPackMeta({
    id, name: options.name || file.name.replace(/\.[a-z0-9]+$/i, ''),
    width: size.width, height: size.height, count, durations, contentBox, cols,
    states: options.states && options.states.length ? options.states : ['idle'],
  });
  const blob = await new Promise(resolve => sheet.toBlob(resolve, 'image/png'));
  return { pack, files: { 'idle.png': blob }, frames: count };
}

export function alphaBox(canvas) {
  const { width, height } = canvas;
  const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w: width, h: height };
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export async function buildPackFromZip(buffer) {
  const entries = await readZip(buffer);
  const candidates = [...entries.keys()].filter(n => n === 'pack.json'
    || (n.endsWith('/pack.json') && n.split('/').length === 2 && !n.startsWith('.')));
  if (!candidates.length) throw new Error('zip không có pack.json ở gốc hoặc trong một thư mục');
  if (candidates.length > 1) throw new Error('zip có nhiều pack.json, chỉ để một');
  const packPath = candidates[0];
  const dir = packPath.includes('/') ? packPath.slice(0, packPath.lastIndexOf('/') + 1) : '';
  const jsonBytes = entries.get(packPath);
  if (jsonBytes.length > ZIP_LIMITS.packJson) throw new Error('pack.json quá lớn');
  let pack;
  try {
    pack = JSON.parse(new TextDecoder().decode(jsonBytes));
  } catch {
    throw new Error('pack.json không phải JSON hợp lệ');
  }
  if (!pack || pack.schema !== 1) throw new Error('pack.json thiếu "schema": 1');
  const animations = pack.animations || {};
  const sheets = [...new Set(Object.values(animations).map(a => a.sheet))];
  if (!sheets.length) throw new Error('pack không có animation nào');
  if (sheets.length > 64) throw new Error('pack có quá nhiều ảnh');
  const files = {};
  for (const name of sheets) {
    if (typeof name !== 'string' || name.includes('/') || name.includes('\\')) {
      throw new Error('tên ảnh không hợp lệ: ' + name);
    }
    const data = entries.get(dir + name) || entries.get(name);
    if (!data) throw new Error('thiếu ảnh ' + name);
    if (data.length < 8 || data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4e || data[3] !== 0x47) {
      throw new Error('ảnh không phải PNG: ' + name);
    }
    files[name] = new Blob([data], { type: 'image/png' });
  }
  const safeId = /^[a-z0-9][a-z0-9-]{0,47}$/.test(pack.id || '') ? pack.id : packIdFrom(pack.id || pack.name || 'zip');
  pack.id = safeId;
  return { pack, files, frames: sheets.length };
}
