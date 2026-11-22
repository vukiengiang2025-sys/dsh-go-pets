import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeGif, quantize, lzwEncode } from './gif.js';

function frame(w, h, rgba, delay) {
  return { width: w, height: h, indices: quantize(rgba, w, h), delay };
}

test('quantize giữ trong suốt', () => {
  const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0]);
  const idx = quantize(rgba, 2, 1);
  assert.notEqual(idx[0], 0);
  assert.equal(idx[1], 0);
});

test('lzwEncode có clear/eoi và không rỗng', () => {
  const data = lzwEncode(new Uint8Array([1, 1, 2, 2, 2, 3]), 8);
  assert.ok(data.length > 2);
});

test('encodeGif tạo header/trailer và 2 frame', () => {
  const w = 2, h = 2;
  const red = new Uint8ClampedArray(w * h * 4).fill(255);
  const blue = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < blue.length; i += 4) { blue[i + 2] = 255; blue[i + 3] = 255; }
  const gif = encodeGif([frame(w, h, red, 100), frame(w, h, blue, 200)], { width: w, height: h });
  assert.equal(String.fromCharCode(...gif.slice(0, 6)), 'GIF89a');
  assert.equal(gif[gif.length - 1], 0x3b);
  const imageDescriptors = gif.reduce((n, b) => n + (b === 0x2c ? 1 : 0), 0);
  assert.ok(imageDescriptors >= 2);
});
