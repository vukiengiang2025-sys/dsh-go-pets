import test from 'node:test';
import assert from 'node:assert/strict';
import { upsertHost, removeHost } from './agent-hosts.js';

test('upsertHost thêm, khử trùng, giới hạn 6', () => {
  let list = [];
  for (let i = 0; i < 8; i++) list = upsertHost(list, 'http://host' + i);
  assert.equal(list.length, 6);
  assert.equal(list[0], 'http://host7');
  list = upsertHost(list, 'http://host7');
  assert.equal(list.filter(x => x === 'http://host7').length, 1);
});

test('upsertHost bỏ URL không hợp lệ', () => {
  assert.deepEqual(upsertHost(['http://a'], 'ftp://b'), ['http://a']);
});

test('removeHost xoá đúng', () => {
  assert.deepEqual(removeHost(['http://a', 'http://b'], 'http://a'), ['http://b']);
});
