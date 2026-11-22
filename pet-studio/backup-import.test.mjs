import test from 'node:test';
import assert from 'node:assert/strict';
import { importableBackup } from './share.js';

test('importableBackup nhận trường an toàn, bỏ key', () => {
  const out = importableBackup({ name: 'Mây', userName: 'An', chat: [{ text: 'hi' }], aiKey: 'secret', aiModel: 'm' });
  assert.equal(out.name, 'Mây');
  assert.equal(out.userName, 'An');
  assert.equal(out.aiModel, 'm');
  assert.equal('aiKey' in out, false);
});

test('importableBackup từ chối dữ liệu không phải object', () => {
  assert.throws(() => importableBackup(null));
});
