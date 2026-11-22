import test from 'node:test';
import assert from 'node:assert/strict';
import { backupOf } from './share.js';

test('backupOf không chứa API key', () => {
  const out = backupOf({ name: 'Mây', aiKey: 'secret', aiModel: 'm', aiTestSig: 'x' });
  assert.equal(out.name, 'Mây');
  assert.equal(out.aiModel, 'm');
  assert.equal('aiKey' in out, false);
  assert.equal('aiTestSig' in out, false);
});
