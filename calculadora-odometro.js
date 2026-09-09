(function(){
'use strict';
function brNumber(v){const s=String(v??'').trim().replace(/R\$\s?/g,'');if(!s)return 0;const normalized=s.includes(',')?s.replace(/\./g,'').replace(',','.'):s;return Number(normalized)||0;}
function setupOdometer(){
  const view=document.getElementById('kmc-view');
  if(!view || !document.getElementById('kmc-manual-km') || document.getElementById('kmc-odometer-start')) return;
  const kmInput=document.getElementById('kmc-manual-km');
  const kmLabel=kmInput.closest('label');
  const odometerWrap=document.createElement('div');
  odometerWrap.className='form-grid';
  odometerWrap.style.marginBottom='12px';
  odometerWrap.innerHTML='<label>Odômetro inicial (km)<input id="kmc-odometer-start" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Ex.: 25430"></label><label>Odômetro final (km)<input id="kmc-odometer-end" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Ex.: 25630"></label>';
  view.querySelector('.form-card')?.insertBefore(odometerWrap, view.querySelector('.form-grid'));
  if(kmLabel){
    const title=kmLabel.querySelector('input')?.parentElement;
    kmLabel.firstChild.textContent='KM rodados (calculado pelo odômetro)';
    kmInput.readOnly=false;
    kmInput.placeholder='Ex.: 200';
    kmInput.title='Preenchido automaticamente quando os dois odômetros forem informados.';
  }
  const start=document.getElementById('kmc-odometer-start');
  const end=document.getElementById('kmc-odometer-end');
  function calculate(){
    const a=brNumber(start.value),b=brNumber(end.value);
    if(start.value!=='' && end.value!=='' && b>=a){
      const km=(b-a).toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');
      kmInput.value=km;
      kmInput.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }
  start.addEventListener('input',calculate);
  end.addEventListener('input',calculate);
}
const view=document.getElementById('kmc-view');
if(view){
  const observer=new MutationObserver(setupOdometer);
  observer.observe(view,{childList:true,subtree:true});
  setupOdometer();
}
window.LopesTurOdometro={setup:setupOdometer};
})();
