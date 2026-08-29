/* Meta diária Lopes Tur: reserva automática para o carro */
(function(){
  const oldSaveEntry = window.saveEntry;
  const oldDashboard = window.dashboard;
  const oldSettings = window.settings;
  const oldStats = window.stats;

  function ensureMeta(){
    if(!state.meta || typeof state.meta !== 'object') state.meta = {daily:100};
    if(typeof state.meta.daily !== 'number' || state.meta.daily < 0) state.meta.daily = 100;
    return state.meta;
  }
  ensureMeta();

  function monthKey(d){ return String(d||'').slice(0,7); }
  function monthDays(){
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  }
  function dayIncome(date){
    return state.incomes.filter(x=>x.date===date && (x.use==='Trabalho Uber'||x.use==='Misto'))
      .reduce((s,x)=>s+Number(x.amount||0)+Number(x.tips||0),0);
  }
  function monthIncome(){
    const k=monthKey(new Date().toISOString().slice(0,10));
    return state.incomes.filter(x=>monthKey(x.date)===k && (x.use==='Trabalho Uber'||x.use==='Misto'))
      .reduce((s,x)=>s+Number(x.amount||0)+Number(x.tips||0),0);
  }
  function reserveForMonth(){
    ensureMeta();
    const now=new Date();
    const daysPassed=now.getDate();
    const target=ensureMeta().daily*daysPassed;
    return Math.min(target, monthIncome());
  }
  function targetMonth(){ return ensureMeta().daily*new Date().getDate(); }

  window.getDailyReserve = reserveForMonth;
  window.getDailyTarget = targetMonth;

  window.stats = function(){
    const s=oldStats();
    const reserve=reserveForMonth();
    return {...s,reserve,profit:s.profit-reserve};
  };

  window.saveEntry = function(e){
    const before=state.incomes.length;
    oldSaveEntry(e);
    if(state.incomes.length>=before){ ensureMeta(); }
  };

  window.dashboard = function(){
    const s=window.stats();
    const daily=ensureMeta().daily;
    const target=targetMonth();
    const percent=target?Math.min(100,(s.reserve/target)*100):0;
    const remaining=Math.max(0,target-s.reserve);
    const base=oldDashboard();
    return base.replace('</div><h3 class="section-title">Ações rápidas</h3>',
      `</div><div class="card meta-card"><div><span>🎯 Meta diária</span><strong>${money(daily)}</strong></div><div><span>Meta acumulada até hoje</span><strong>${money(target)}</strong></div><div><span>Guardar para o carro</span><strong>${money(s.reserve)}</strong></div><div><span>Falta para a meta</span><strong>${money(remaining)}</strong></div><div class="bar"><i style="width:${percent}%"></i></div><small>${number(percent)}% da meta acumulada</small></div><h3 class="section-title">Ações rápidas</h3>`);
  };

  window.settings = function(){
    const base=oldSettings();
    const daily=ensureMeta().daily;
    return base.replace('<div class="setting-group"><h3 class="section-title">Manutenção</h3>',
      `<div class="setting-group"><h3 class="section-title">🎯 Meta diária para o carro</h3><form id="metaForm" class="form-card"><div class="form-grid"><label>Valor para guardar por dia (R$)<input required min="0" step="0.01" name="daily" type="number" value="${daily}" /></label></div><div class="form-actions"><button class="button" type="submit">Salvar meta</button></div></form><p class="hint">Ao lançar ganhos de trabalho, o aplicativo reserva automaticamente esse valor para o carro. A meta acumula pelos dias do mês.</p></div><div class="setting-group"><h3 class="section-title">Manutenção</h3>`);
  };

  const oldRender=window.render;
  window.render=function(){ oldRender(); bindMeta(); };

  function bindMeta(){
    const form=document.querySelector('#metaForm');
    if(form) form.onsubmit=function(e){
      e.preventDefault();
      const value=Number(new FormData(e.target).get('daily')||0);
      ensureMeta().daily=Math.max(0,value);
      save();
      toast('Meta diária atualizada.');
      render();
    };
  }

  // Corrige a renderização do lucro líquido após a substituição de stats.
  const initialRender=window.render;
  window.render=function(){
    initialRender();
    const cards=document.querySelectorAll('.metric');
    cards.forEach(card=>{
      if(card.textContent.includes('Lucro líquido')){
        const s=window.stats();
        const strong=card.querySelector('strong');
        if(strong){strong.textContent=money(s.profit);strong.className=s.profit>=0?'positive':'negative';}
      }
    });
  };
})();
