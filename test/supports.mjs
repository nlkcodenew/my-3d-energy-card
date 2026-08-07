// Kiểm chứng: mọi color-mix() nằm trong @supports, và fallback không dùng color-mix
import { readFile } from 'node:fs/promises';
const src = await readFile(process.env.CARD_PATH || new URL('../NLK-3d-energy-card.js', import.meta.url),'utf8');
const m = src.match(/static get styles\(\) \{\s*return css`([\s\S]*?)`;\s*\}/);
let cssTxt = m[1].replace(/\/\*[\s\S]*?\*\//g,''); // bỏ comment

let pass=0,fail=0;
const t=(n,c)=>{c?pass++:fail++;console.log((c?'  PASS ':'  FAIL ')+n);};

// tách khối @supports
const sup = cssTxt.match(/@supports \(background: color-mix[^)]*\)\) \{([\s\S]*?)\n      \}/);
t('có khối @supports color-mix', !!sup);
const inside = sup ? sup[1] : '';
const outside = cssTxt.replace(sup ? sup[0] : '', '');

t('KHÔNG còn color-mix ngoài @supports', !outside.includes('color-mix'));
t('color-mix có trong @supports', inside.includes('color-mix'));

// 4 biến phải được khai CẢ ở fallback lẫn trong @supports
for (const v of ['--surface-card','--surface-node','--surface-inverter','--border-color']) {
  t(`${v}: có fallback ngoài @supports`, new RegExp(v.replace(/-/g,'\\-')+'\\s*:').test(outside));
  t(`${v}: có bản color-mix trong @supports`, new RegExp(v.replace(/-/g,'\\-')+'\\s*:').test(inside));
}
t('--glass-highlight (dead) đã xoá', !cssTxt.includes('glass-highlight'));

// fallback phải là giá trị hợp lệ cho browser cũ
const fb = outside.match(/--surface-card:([^;]+);/);
t('fallback --surface-card không rỗng', fb && fb[1].trim().length>10);
t('fallback dùng var(--bg-card)', fb && fb[1].includes('var(--bg-card)'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
