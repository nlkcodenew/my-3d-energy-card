// Config cũ còn compact_mode VÀ card_size -> phải bỏ qua im lặng
global.document={querySelector:()=>true,createElement:()=>({}),head:{appendChild:()=>{}}};
const defined={};
global.customElements={define:(n,c)=>{defined[n]=c;},get:()=>undefined};
global.window={customCards:[]};
await import('./card.mjs');
const Card=defined['nlk-3d-energy-card'], Ed=defined['nlk-3d-energy-card-editor'];
let pass=0,fail=0;
const t=(n,fn)=>{try{const r=fn();if(r===true){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n+' -> '+r)}}catch(e){fail++;console.log('  FAIL '+n+' threw: '+e.message)}};

const hass={states:{sol:{state:'100',attributes:{}},g:{state:'800',attributes:{}},l:{state:'500',attributes:{}},b:{state:'-50',attributes:{}},s:{state:'80',attributes:{}},ld:{state:'5',attributes:{}}}};
const mkLegacy=()=>({max_power:5000, compact_mode:true, card_size:'large', flow_style:'dots',
  entities:{solar:'sol',grid:'g',load:'l',battery_power:'b',battery_soc:'s',load_daily:'ld'}});

t('setConfig OK với compact_mode + card_size cũ', ()=>{const c=Object.create(Card.prototype);c.setConfig(mkLegacy());return c.config.card_size==='large';});
t('render() không lỗi với cả 2 key cũ', ()=>{const c=Object.create(Card.prototype);c.setConfig(mkLegacy());c.hass=hass;return !!c.render();});
t('getStubConfig KHÔNG còn card_size', ()=>!('card_size' in Card.getStubConfig()));
t('getStubConfig KHÔNG còn compact_mode', ()=>!('compact_mode' in Card.getStubConfig()));
t('getCardSize() luôn trả 9', ()=>{const c=Object.create(Card.prototype);
  c.config={card_size:'large'}; const a=c.getCardSize();
  c.config={};                  const b=c.getCardSize();
  c.config=undefined;           const d=c.getCardSize();
  return (a===9&&b===9&&d===9)||`got ${a},${b},${d}`;});
t('editor render OK với key cũ', ()=>{const e=Object.create(Ed.prototype);e.setConfig(mkLegacy());e.hass={states:{}};return !!e.render();});
t('editor KHÔNG còn checkbox Compact Mode', ()=>{
  const src=Ed.prototype.render.toString();
  return !src.includes('Compact Mode');});
t('editor KHÔNG có control card_size', ()=>{
  const src=Ed.prototype.render.toString();
  return !src.includes('card_size');});
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
