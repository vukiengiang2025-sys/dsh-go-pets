// Dựng pack.json + sheet từ một ảnh/GIF/APNG. Không phụ thuộc DOM ở phần meta
// để test được bằng Node; phần đọc ảnh cần trình duyệt.

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

export function buildPackMeta({ id, name, width, height, count, durations, contentBox, cols }) {
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
    animations: {
      idle: {
        sheet: 'idle.png', frameW: width, frameH: height, cols,
        box: { x: 0, y: 0, w: width, h: height }, frames, loop: true,
      },
    },
    states: { idle: ['idle'] },
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

export async function buildPackFromFile(file) {
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
    id, name: file.name.replace(/\.[a-z0-9]+$/i, ''), width: size.width, height: size.height,
    count, durations, contentBox, cols,
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
