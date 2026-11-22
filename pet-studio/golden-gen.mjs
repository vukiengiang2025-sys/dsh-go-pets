// Sinh golden.json từ pack hiện tại. Chạy: node golden-gen.mjs
import fs from 'node:fs';
import path from 'node:path';
import { decodePng, pixelHash } from './png-read.js';

const root = path.resolve('../app/assets/pets');
const out = { schema: 1, packs: {} };
for (const id of fs.readdirSync(root).sort()) {
  const dir = path.join(root, id);
  const packFile = path.join(dir, 'pack.json');
  if (!fs.existsSync(packFile)) continue;
  const pack = JSON.parse(fs.readFileSync(packFile, 'utf8'));
  const sheets = {};
  const names = new Set();
  for (const anim of Object.values(pack.animations || {})) {
    if (anim && anim.sheet) names.add(anim.sheet);
  }
  for (const name of [...names].sort()) {
    const img = decodePng(fs.readFileSync(path.join(dir, name)));
    sheets[name] = { w: img.width, h: img.height, hash: pixelHash(img.data) };
  }
  out.packs[id] = sheets;
}
fs.writeFileSync('golden.json', JSON.stringify(out, null, 2) + '\n');
console.log('golden packs:', Object.keys(out.packs).length);
