import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { decodePng, pixelHash } from './png-read.js';

const golden = JSON.parse(fs.readFileSync(new URL('./golden.json', import.meta.url), 'utf8'));
const root = path.resolve(new URL('../app/assets/pets', import.meta.url).pathname);

test('mọi pack khớp golden pixel', () => {
  for (const [id, sheets] of Object.entries(golden.packs)) {
    for (const [name, meta] of Object.entries(sheets)) {
      const img = decodePng(fs.readFileSync(path.join(root, id, name)));
      assert.equal(img.width, meta.w, id + '/' + name + ' width');
      assert.equal(img.height, meta.h, id + '/' + name + ' height');
      assert.equal(pixelHash(img.data), meta.hash, id + '/' + name + ' hash');
    }
  }
});
