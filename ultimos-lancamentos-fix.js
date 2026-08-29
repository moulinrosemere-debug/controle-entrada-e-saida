// Lopes Tur - correção dos Últimos lançamentos
// Mostra Editar/Excluir diretamente em cada lançamento do painel.
(function () {
  if (typeof entriesList !== 'function' || typeof stats !== 'function' || typeof money !== 'function') return;
  const originalDashboard = dashboard;
  dashboard = function () {
    const html = originalDashboard();
    const start = html.indexOf('<h3 class="section-title">Últimos lançamentos</h3>');
    if (start < 0) return html;
    const before = html.slice(0, start + '<h3 class="section-title">Últimos lançamentos</h3>'.length);
    const items = [...state.incomes.map(x => ({...x, kind:'income'})), ...state.expenses.map(x => ({...x, kind:'expense'}))]
      .sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
    return before + entriesList(items, true);
  };
  if (typeof render === 'function') render();
})();
