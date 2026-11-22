import test from 'node:test';
import assert from 'node:assert/strict';
import qrcode from './vendor/qrcode.mjs';

test('qrcode tạo ma trận có finder pattern', () => {
  const qr = qrcode(0, 'M');
  qr.addData('https://example.com/pet-studio/#cfg=abc');
  qr.make();
  const n = qr.getModuleCount();
  assert.ok(n >= 21);
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const expected = x === 0 || y === 0 || x === 6 || y === 6
        || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
      assert.equal(qr.isDark(y, x), expected, 'finder ' + x + ',' + y);
    }
  }
});
