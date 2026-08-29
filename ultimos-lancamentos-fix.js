// Lopes Tur - correção dos Últimos lançamentos
// O painel mostra somente ganhos e gastos do trabalho Uber.
(function () {
  if (typeof entriesList !== 'function') return;
  const originalDashboard = dashboard;
  dashboard = function () {
    const html = originalDashboard();
    const marker = '<h3 class="section-title">Últimos lançamentos</h3>';
    const start = html.indexOf(marker);
    if (start < 0) return html;
    const before = html.slice(0, start + marker.length);
    const items = [
      ...state.incomes.filter(x => x.use === 'Trabalho Uber').map(x => ({...x, kind:'income'})),
      ...state.expenses.filter(x => x.use === 'Trabalho Uber').map(x => ({...x, kind:'expense'}))
    ].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
    return before + entriesList(items, true);
  };
  if (typeof render === 'function') render();
})();
