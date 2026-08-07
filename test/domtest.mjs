// Kiểm chứng SELECTOR MATCHING trên DOM thật (jsdom).
// Giới hạn: jsdom không tính cascade đầy đủ -> chỉ khẳng định được
// "selector có khớp đúng element hay không", không khẳng định computed style.
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
const doc = dom.window.document;

// Dựng lại đúng cấu trúc DOM mà render() sinh ra.
function buildCard({ compact=false, size='normal', offgridOnLoad=false }) {
  const host = doc.createElement('nlk-3d-energy-card');   // :host
  const card = doc.createElement('ha-card');              // attribute nằm ở ĐÂY
  card.setAttribute('data-size', size);
  if (compact) card.setAttribute('data-compact', '');
  const scene = doc.createElement('div'); scene.className='scene';
  for (const n of ['solar','grid','battery','load']) {
    const node = doc.createElement('div'); node.className='node '+n;
    const sub = doc.createElement('div'); sub.className='sub-info';
    const row = doc.createElement('div'); row.className='sub-row';
    row.textContent = n+' today';
    sub.appendChild(row);
    if (n==='load' && offgridOnLoad) {
      const b=doc.createElement('span'); b.className='status-badge status-offgrid'; b.textContent='offgrid';
      sub.appendChild(b);
    }
    node.appendChild(sub); scene.appendChild(node);
  }
  card.appendChild(scene); host.appendChild(card); doc.body.appendChild(host);
  return { host, card, scene };
}

let pass=0, fail=0;
const t=(name,got,want)=>{
  const ok=JSON.stringify(got)===JSON.stringify(want);
  ok?pass++:fail++;
  console.log((ok?'  PASS ':'  FAIL ')+name+(ok?'':` got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
};

console.log('\n=== A. Chứng minh :host([data-compact]) KHÔNG khớp (bug gốc) ===');
{
  doc.body.innerHTML='';
  const {host,card}=buildCard({compact:true});
  // :host chỉ khớp chính host element trong shadow context.
  // Ở đây ta kiểm: attribute có nằm trên host không?
  t('data-compact KHÔNG nằm trên host', host.hasAttribute('data-compact'), false);
  t('data-compact NẰM trên ha-card', card.hasAttribute('data-compact'), true);
  // => mọi rule :host([data-compact]) không thể khớp. Đây là lý do compact mode chưa từng hoạt động.
}

console.log('\n=== B. Selector ha-card[data-compact] .sub-info khớp bao nhiêu node? ===');
{
  doc.body.innerHTML='';
  buildCard({compact:true, offgridOnLoad:true});
  const all=doc.querySelectorAll('ha-card[data-compact] .sub-info');
  t('khớp cả 4 .sub-info', all.length, 4);
}

console.log('\n=== C. Rule LỖI của v1.7.0 (không giới hạn) ===');
{
  doc.body.innerHTML='';
  buildCard({compact:true, offgridOnLoad:true});
  // rule v1.7.0: .sub-info > *:not(.status-offgrid)
  const hidden=doc.querySelectorAll('ha-card[data-compact] .sub-info > *:not(.status-offgrid)');
  // 4 sub-row (solar,grid,battery,load) đều bị ẩn -> đây chính là bug
  t('v1.7.0 ẩn 4 sub-row trên MỌI node (bug)', hidden.length, 4);
  const rows=[...hidden].map(e=>e.textContent);
  t('gồm cả node không có badge', rows.includes('solar today')&&rows.includes('grid today'), true);
}

console.log('\n=== D. Rule v1.7.1 (giới hạn đúng bằng :has) ===');
{
  doc.body.innerHTML='';
  buildCard({compact:true, offgridOnLoad:true});
  const scoped=doc.querySelectorAll('ha-card[data-compact] .sub-info:has(.status-offgrid) > *:not(.status-offgrid)');
  t('chỉ ẩn 1 sub-row (trong node có badge)', scoped.length, 1);
  t('đó là node load', scoped[0].textContent, 'load today');
  const wrappers=doc.querySelectorAll('ha-card[data-compact] .sub-info:has(.status-offgrid)');
  t('chỉ 1 wrapper chứa badge', wrappers.length, 1);
}

console.log('\n=== E. v1.8.x+: compact_mode va card_size da XOA HAN ===');
{
  const src=await (await import('node:fs/promises')).readFile(process.env.CARD_PATH || new URL('../NLK-3d-energy-card.js', import.meta.url),'utf8');
  const nocomment=src.replace(/\/\*[\s\S]*?\*\//g,'');
  // Ca hai option da bi xoa o v1.8.0 / v1.8.1 -> khong con selector nao ca.
  t('0 rule ha-card[data-compact]', (nocomment.match(/ha-card\[data-compact\]/g)||[]).length, 0);
  t('0 rule ha-card[data-size', (nocomment.match(/ha-card\[data-size/g)||[]).length, 0);
  t('0 selector :host([data-compact]) (da xoa)', (nocomment.match(/:host\(\[data-compact\]\)/g)||[]).length, 0);
  t('0 selector :host([data-size (da xoa)', (nocomment.match(/:host\(\[data-size/g)||[]).length, 0);
  t('KHONG con key compact_mode', (nocomment.match(/compact_mode/g)||[]).length, 0);
  t('KHONG con key card_size', (nocomment.match(/card_size/g)||[]).length, 0);
  // --card-height giu lai co chu dich, cho card-mod ghi de.
  t('--card-height GIU LAI (cho card-mod)', (nocomment.match(/--card-height/g)||[]).length >= 2, true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
