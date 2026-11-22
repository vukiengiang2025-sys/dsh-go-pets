import test from 'node:test';
import assert from 'node:assert/strict';
import { moodFor } from './pet-chat.js';

test('moodFor nhận buồn/vui', () => {
  assert.equal(moodFor('hôm nay mệt quá'), 'sleeping');
  assert.equal(moodFor('vui ghê'), 'attention');
  assert.equal(moodFor('bình thường'), null);
});
