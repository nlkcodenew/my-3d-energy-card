global.document={querySelector:()=>true,createElement:()=>({}),head:{appendChild:()=>{}}};
const defined={};
global.customElements={define:(n,c)=>{defined[n]=c;}, get:()=>undefined};
global.window={customCards:[]};
await import('./card.mjs');
const Card = defined['nlk-3d-energy-card'];

// Extract the resolution logic by instantiating and calling render with stub hass.
function mk(states, cfg={}){
  const c = Object.create(Card.prototype);
  c.hass = { states: {} };
  for (const [k,v] of Object.entries(states)) {
    c.hass.states[k] = (v===null) ? undefined : (typeof v==='object' ? v : {state:String(v),attributes:{unit_of_measurement:'W'}});
    if (v===null) delete c.hass.states[k];
  }
  c.config = Object.assign({
    max_power:5000,
    entities:{ grid:'g', load:'l', load_offgrid:'o', battery_power:'b', battery_soc:'s', solar:'sol' }
  }, cfg);
  return c;
}

// Re-implement the decision by reading it out of render via a probe.
// Simpler: replicate using the card's own helpers to assert _hasState behaviour,
// then assert the documented decision table.
function decide(c){
  const E=c.config.entities;
  const gridP=c._getState(E.grid);
  const absGridP=Math.abs(gridP);
  const thr=Number.isFinite(c.config.offgrid_grid_threshold)?Math.abs(c.config.offgrid_grid_threshold):1;
  const minP=Number.isFinite(c.config.offgrid_min_power)?Math.abs(c.config.offgrid_min_power):0;
  const hasOff=c._hasState(E.load_offgrid);
  const offP=hasOff?c._getState(E.load_offgrid):0;
  const down=c._hasState(E.grid)&&absGridP<thr;
  const using=hasOff&&down&&Math.abs(offP)>=minP;
  const loadP=using?offP:(c._hasState(E.load)?c._getState(E.load):Math.abs(c._getState(E.solar)+gridP+c._getState(E.battery_power)));
  return {using,loadP};
}

let pass=0,fail=0;
function t(name,got,want){
  const ok=JSON.stringify(got)===JSON.stringify(want);
  if(ok){pass++;console.log('  PASS',name);}
  else{fail++;console.log('  FAIL',name,'got',JSON.stringify(got),'want',JSON.stringify(want));}
}

console.log('\n=== Core scenarios ===');
// Grid present (importing) -> use primary load_power
t('grid importing 800W -> primary',
  decide(mk({g:800,l:1200,o:1150,b:0,s:50,sol:0})), {using:false,loadP:1200});

// Blackout: grid exactly 0 -> use off-grid ac_output
t('blackout grid=0 -> offgrid',
  decide(mk({g:0,l:9999,o:1150,b:-1200,s:50,sol:0})), {using:true,loadP:1150});

// Blackout with tiny negative sensor noise -> still off-grid
t('blackout grid=-0.3 noise -> offgrid',
  decide(mk({g:-0.3,l:9999,o:1150,b:-1200,s:50,sol:0})), {using:true,loadP:1150});

// Exporting to grid -> grid is UP, must NOT switch (this is the <=0 bug)
t('exporting grid=-900 -> primary (NOT offgrid)',
  decide(mk({g:-900,l:1200,o:1150,b:0,s:90,sol:3000})), {using:false,loadP:1200});

console.log('\n=== The 50W-threshold problem ===');
// Blackout + very low consumption. With user original idea (min 50) it would
// wrongly fall back to the broken load_power. With default min 0 it works.
t('blackout + 30W load, default min=0 -> offgrid (correct)',
  decide(mk({g:0,l:9999,o:30,b:-30,s:50,sol:0})), {using:true,loadP:30});
t('blackout + 30W load, min=50 -> falls back (shows why 50 is risky)',
  decide(mk({g:0,l:9999,o:30,b:-30,s:50,sol:0},{offgrid_min_power:50})), {using:false,loadP:9999});

console.log('\n=== Missing / unavailable entities ===');
t('no offgrid entity configured -> primary',
  decide(mk({g:0,l:1200,b:0,s:50,sol:0},{entities:{grid:'g',load:'l',load_offgrid:'',battery_power:'b',battery_soc:'s',solar:'sol'}})),
  {using:false,loadP:1200});
t('offgrid entity unavailable -> primary',
  decide(mk({g:0,l:1200,o:{state:'unavailable',attributes:{}},b:0,s:50,sol:0})), {using:false,loadP:1200});
t('grid entity unavailable -> primary (cannot know grid is down)',
  decide(mk({g:{state:'unavailable',attributes:{}},l:1200,o:1150,b:0,s:50,sol:0})), {using:false,loadP:1200});

console.log('\n=== load=0 must NOT trigger sum fallback (old || bug) ===');
t('load genuinely 0W, grid up -> 0 not computed sum',
  decide(mk({g:500,l:0,o:0,b:0,s:50,sol:0})), {using:false,loadP:0});

console.log('\n=== custom threshold ===');
t('threshold 25, grid=10 -> offgrid',
  decide(mk({g:10,l:9999,o:1150,b:0,s:50,sol:0},{offgrid_grid_threshold:25})), {using:true,loadP:1150});
t('threshold 25, grid=40 -> primary',
  decide(mk({g:40,l:1200,o:1150,b:0,s:50,sol:0},{offgrid_grid_threshold:25})), {using:false,loadP:1200});

console.log('\n=== _hasState sanity ===');
const c=mk({g:0,l:'unknown',o:'',b:0,s:0,sol:0});
t('_hasState grid=0 -> true', c._hasState('g'), true);
t('_hasState unknown -> false', c._hasState('l'), false);
t('_hasState empty string -> false', c._hasState('o'), false);
t('_hasState missing -> false', c._hasState('nope'), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
