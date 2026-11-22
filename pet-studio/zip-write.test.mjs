import test from 'node:test';
import assert from 'node:assert/strict';
import { buildZip, crc32 } from './zip-write.js';

test('crc32 khớp giá trị chuẩn', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('buildZip tạo cấu trúc zip hợp lệ', () => {
  const zip = buildZip([
    { name: 'pack.json', data: new TextEncoder().encode('{"schema":1}') },
    { name: 'idle.png', data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) },
  ]);
  assert.equal(new DataView(zip.buffer).getUint32(0, true), 0x04034b50);
  assert.equal(new DataView(zip.buffer).getUint32(zip.length - 22, true), 0x06054b50);
});
