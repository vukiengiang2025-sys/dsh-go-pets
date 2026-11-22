import test from 'node:test';
import assert from 'node:assert/strict';
import { hostColor, batteryText } from './care.js';

test('hostColor ổn định và theo tên', () => {
  assert.equal(hostColor('local'), hostColor('local'));
  assert.notEqual(hostColor('local'), hostColor('desk'));
  assert.match(hostColor('local'), /^hsl\(\d+ 78% 62%\)$/);
});

test('batteryText làm tròn và trạng thái sạc', () => {
  assert.match(batteryText(0.82, true), /82%.*đang sạc/);
  assert.match(batteryText(0.1, false), /10%.*dùng pin/);
});
