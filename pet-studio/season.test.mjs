import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonFor, SEASON_PACK } from './season.js';

test('seasonFor đúng cửa sổ Tết và tuyết', () => {
  assert.equal(seasonFor(new Date(2026, 0, 25)), 'tet');
  assert.equal(seasonFor(new Date(2026, 1, 10)), 'tet');
  assert.equal(seasonFor(new Date(2026, 1, 20)), 'snow');
  assert.equal(seasonFor(new Date(2026, 11, 5)), 'snow');
  assert.equal(seasonFor(new Date(2026, 6, 1)), null);
});

test('SEASON_PACK ánh xạ id', () => {
  assert.equal(SEASON_PACK.tet, 'may-tet');
  assert.equal(SEASON_PACK.snow, 'may-snow');
});
