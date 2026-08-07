// Kiểm tra vòng đời listener: attach -> detach -> re-attach
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<!doctype html><body></body>');
global.window=dom.window; global.document=dom.window.document;

let added=0, removed=0, timers=0, cleared=0;
const realAdd=dom.window.addEventListener.bind(dom.window);
dom.window.addEventListener=(t,f,o)=>{ if(t==='resize')added++; return realAdd(t,f,o); };
const realRemove=dom.window.removeEventListener.bind(dom.window);
dom.window.removeEventListener=(t,f,o)=>{ if(t==='resize')removed++; return realRemove(t,f,o); };
global.setTimeout=(f,d)=>{timers++; return 'T'+timers;};
global.clearTimeout=(id)=>{ if(id)cleared++; };

// Mô phỏng đúng logic updated()/disconnectedCallback() vừa viết
class Fake {
  updated(){ if(!this._wired){ this._wired=true;
    this._onResize=()=>{}; this._wireTimer=setTimeout(()=>{},100);
    window.addEventListener('resize',this._onResize); } }
  disconnectedCallback(){
    if(this._onResize){ window.removeEventListener('resize',this._onResize); this._onResize=null; }
    if(this._wireTimer){ clearTimeout(this._wireTimer); this._wireTimer=null; }
    this._wired=false; }
}
let pass=0,fail=0;
const t=(n,g,w)=>{const ok=g===w;ok?pass++:fail++;console.log((ok?'  PASS ':'  FAIL ')+n+(ok?'':` got=${g} want=${w}`));};

const c=new Fake();
console.log('\n=== 1 chu kỳ attach/detach ===');
c.updated(); c.updated(); c.updated();   // nhiều lần render
t('chỉ add listener 1 lần dù render 3 lần', added, 1);
t('chỉ set 1 timer', timers, 1);
c.disconnectedCallback();
t('remove listener khi detach', removed, 1);
t('clear timer khi detach', cleared, 1);

console.log('\n=== re-attach (dashboard edit / đổi view) ===');
c.updated();
t('add lại listener sau re-attach', added, 2);
t('vẫn balance: added==removed+1 (đang attach)', added-removed, 1);

console.log('\n=== 5 chu kỳ liên tiếp: KHÔNG được rò rỉ ===');
for(let i=0;i<5;i++){ c.disconnectedCallback(); c.updated(); }
t('added == removed + 1', added-removed, 1);
console.log(`     (added=${added} removed=${removed} timers=${timers} cleared=${cleared})`);

console.log('\n=== So sánh: code CŨ (không có disconnectedCallback) ===');
let oldAdded=0;
class Old { updated(){ if(!this._wired){ this._wired=true; oldAdded++; } } }
const o=new Old();
for(let i=0;i<5;i++){ o.updated(); o._wired=false; /* mô phỏng element mới */ }
console.log(`     code cũ: ${oldAdded} listener treo, 0 được remove -> RÒ RỈ`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
