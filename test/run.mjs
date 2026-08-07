#!/usr/bin/env node
// Chạy toàn bộ test suite. Dùng: npm test
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cardPath = process.env.CARD_PATH || join(here, '..', 'NLK-3d-energy-card.js');

// Thay import CDN bằng stub cục bộ để chạy được ngoài Home Assistant.
const src = readFileSync(cardPath, 'utf8');
writeFileSync(join(here, 'card.mjs'),
  src.replace('https://unpkg.com/lit-element@2.4.0/lit-element.js?module', './litstub.js'));

const suites = ['test.mjs', 'selfsuf.mjs', 'supports.mjs', 'legacy2.mjs', 'lifecycle.mjs', 'domtest.mjs'];
let total = 0, failed = 0;

console.log(`Card: ${cardPath}\n`);
for (const s of suites) {
  const r = spawnSync(process.execPath, [join(here, s)], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/(\d+) passed, (\d+) failed/);
  if (m) {
    total += +m[1]; failed += +m[2];
    console.log(`${s.padEnd(16)} ${m[1]} passed, ${m[2]} failed`);
    if (+m[2] > 0) console.log(out.split('\n').filter(l => l.includes('FAIL')).join('\n'));
  } else {
    failed++;
    console.log(`${s.padEnd(16)} ERROR`);
    console.log(out.split('\n').slice(-6).join('\n'));
  }
}
console.log(`\n${'='.repeat(40)}\nTotal: ${total} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
