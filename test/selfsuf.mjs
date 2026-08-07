global.document={querySelector:()=>true,createElement:()=>({}),head:{appendChild:()=>{}}};
const defined={};
global.customElements={define:(n,c)=>{defined[n]=c;},get:()=>undefined};
global.window={customCards:[]};
await import('./card.mjs');
const Card=defined['nlk-3d-energy-card'];

function calc(states, ents){
  const c=Object.create(Card.prototype);
  c.hass={states:{}};
  for(const [k,v] of Object.entries(states)){
    if(v===null) continue;
    c.hass.states[k]= typeof v==='object'? v : {state:String(v),attributes:{unit_of_measurement:'kWh'}};
  }
  const E=Object.assign({load_daily:'ld', grid_buy_daily:'gb'}, ents||{});
  // replicate the logic
  let ss=null;
  if(c._hasState(E.load_daily) && c._hasState(E.grid_buy_daily)){
    const l=c._getState(E.load_daily), g=c._getState(E.grid_buy_daily);
    if(l>0) ss=Math.max(0,Math.min(100,((l-g)/l)*100));
  }
  return ss===null? '--' : ss.toFixed(0)+'%';
}

let pass=0,fail=0;
const t=(n,g,w)=>{const ok=g===w;ok?pass++:fail++;console.log((ok?'  PASS ':'  FAIL ')+n+(ok?` -> ${g}`:` got=${g} want=${w}`));};

console.log('\n=== CONFIG CỦA BẠN (có cả 2 entity) - số KHÔNG ĐỔI ===');
t('load 10 kWh, mua 3 kWh -> 70%', calc({ld:10, gb:3}), '70%');
t('load 10, mua 0 (toàn tự cấp) -> 100%', calc({ld:10, gb:0}), '100%');
t('load 10, mua 10 (toàn từ lưới) -> 0%', calc({ld:10, gb:10}), '0%');
t('load 8.5, mua 2.1 -> 75%', calc({ld:8.5, gb:2.1}), '75%');

console.log('\n=== TRƯỚC ĐÂY SAI: thiếu grid_buy_daily ===');
t('thiếu gb -> "--" (trước: 100% SAI)', calc({ld:10, gb:null}), '--');
t('gb unavailable -> "--"', calc({ld:10, gb:{state:'unavailable',attributes:{}}}), '--');
t('gb unknown -> "--"', calc({ld:10, gb:{state:'unknown',attributes:{}}}), '--');
t('gb không cấu hình -> "--"', calc({ld:10}, {grid_buy_daily:''}), '--');

console.log('\n=== Biên ===');
t('load_daily = 0 -> "--"', calc({ld:0, gb:0}), '--');
t('thiếu cả 2 -> "--"', calc({}), '--');
t('mua > load (kẹp 0%)', calc({ld:5, gb:8}), '0%');
t('gb âm (kẹp 100%)', calc({ld:10, gb:-2}), '100%');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
