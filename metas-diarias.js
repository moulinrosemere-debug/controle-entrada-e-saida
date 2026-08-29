/* Meta diária Lopes Tur - conta somente dias com ganhos de trabalho */
(function(){
  const oldDashboard = window.dashboard;
  const oldSettings = window.settings;
  const oldStats = window.stats;

  function ensureMeta(){
    if(!state.meta || typeof state.meta !== 'object') state.meta = {daily:100};
    if(typeof state.meta.daily !== 'number' || state.meta.daily < 0) state.meta.daily = 100;
    return state.meta;
  }

  function monthKey(d){ return String(d||'').slice(0,7); }
  function isWorkIncome(x){ return x.use === 'Trabalho Uber' || x.use === 'Misto'; }

  // Um dia só conta para a meta se houver pelo menos um ganho de trabalho nesse dia.
  function workedDaysThisMonth(){
    const key = monthKey(today());
    return [...new Set(state.incomes.filter(x => monthKey(x.date) === key && isWorkIncome(x) && Number(x.amount||0)+Number(x.tips||0) > 0).map(x => x.date))];
  }

  // A reserva é calculada dia a dia para nunca reservar mais do que foi ganho naquele dia.
  function reserveForMonth(){
    const daily = ensureMeta().daily;
    return workedDaysThisMonth().reduce((sum,date) => {
      const gained = state.incomes.filter(x => x.date === date && isWorkIncome(x))
        .reduce((s,x) => s + Number(x.amount||0) + Number(x.tips||0), 0);
      return sum + Math.min(daily, gained);
    }, 0);
  }

  function targetMonth(){ return ensureMeta().daily * workedDaysThisMonth().length; }

  window.getWorkedDaysThisMonth = workedDaysThisMonth;
  window.getDailyReserve = reserveForMonth;
  window.getDailyTarget = targetMonth;

  window.stats = function(){
    const s = oldStats();
    const reserve = reserveForMonth();
    return {...s, reserve, profit:s.profit-reserve};
  };

  window.dashboard = function(){
    const s = window.stats();
    const daily = ensureMeta().daily;
    const target = targetMonth();
    const worked = workedDaysThisMonth().length;
    const percent = target ? Math.min(100,(s.reserve/target)*100) : 0;
    const remaining = Math.max(0,target-s.reserve);
    const base = oldDashboard();
    return base.replace('</div><h3 class="section-title">Ações rápidas</h3>',
      `</div><div class="card meta-card"><div><span>🎯 Meta diária</span><strong>${money(daily)}</strong></div><div><span>Dias trabalhados no mês</span><strong>${worked}</strong></div><div><span>Meta acumulada</span><strong>${money(target)}</strong></div><div><span>Guardar para o carro</span><strong>${money(s.reserve)}</strong></div><div><span>Falta para a meta</span><strong>${money(remaining)}</strong></div><div class="bar"><i style="width:${percent}%"></i></div><small>${number(percent)}% da meta acumulada</small></div><h3 class="section-title">Ações rápidas</h3>`);
  };

  window.settings = function(){
    const base = oldSettings();
    const daily = ensureMeta().daily;
    return base.replace('<div class="setting-group"><h3 class="section-title">Manutenção</h3>',
      `<div class="setting-group"><h3 class="section-title">🎯 Meta diária para o carro</h3><form id="metaForm" class="form-card"><div class="form-grid"><label>Valor para guardar por dia (R$)<input required min="0" step="0.01" name="daily" type="number" value="${daily}" /></label></div><div class="form-actions"><button class="button" type="submit">Salvar meta</button></div></form><p class="hint">Somente os dias que tiverem ganhos de trabalho contam para a meta. A reserva diária é automática.</p></div><div class="setting-group"><h3 class="section-title">Manutenção</h3>`);
  };

  const oldRender = window.render;
  window.render = function(){
    oldRender();
    const form=document.querySelector('#metaForm');
    if(form) form.onsubmit=function(e){
      e.preventDefault();
      ensureMeta().daily=Math.max(0,Number(new FormData(e.target).get('daily')||0));
      save(); toast('Meta diária atualizada.'); render();
    };
  };
})();
