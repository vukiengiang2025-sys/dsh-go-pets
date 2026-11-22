import test from 'node:test';
import assert from 'node:assert/strict';
import { friendlyAIError } from './ai.js';

test('friendlyAIError dịch mã lỗi', () => {
  assert.match(friendlyAIError(new Error('HTTP 401: bad')), /Key sai/);
  assert.match(friendlyAIError(new Error('HTTP 429')), /giới hạn/);
  assert.match(friendlyAIError(new Error('HTTP 500')), /Máy chủ/);
  assert.match(friendlyAIError(new Error('Failed to fetch')), /Không kết nối/);
});
