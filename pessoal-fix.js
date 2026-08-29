/* Aba Pessoal Lopes Tur - despesas pessoais separadas do trabalho */
(function(){
  function personalItems(){
    return state.expenses.filter(x => x.use === 'Lazer/pessoal');
  }
  function personal(){
    const items = personalItems().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const total = items.reduce((s,x)=>s+Number(x.amount||0),0);
    return `<div class="section-head"><div><h2>Despesas pessoais</h2><p class="hint">Somente despesas pessoais. Elas não entram no resultado do trabalho.</p></div></div>
      <div class="summary-grid"><article class="card metric"><span>Total pessoal</span><strong class="negative">${money(total)}</strong></article><article class="card metric"><span>Lançamentos</span><strong>${items.length}</strong></article></div>
      <h3 class="section-title">Nova despesa pessoal</h3>
      <form id="personalForm" class="form-card"><div class="form-grid">
        <label>Data<input required name="date" type="date" value="${today()}" /></label>
        <label>Categoria<select name="category">${options(state.categories)}</select></label>
        <label>Valor (R$)<input required min="0" step="0.01" name="amount" type="number" /></label>
        <label>Quilometragem<input min="0" step="0.1" name="km" type="number" /></label>
        <label class="wide">Observação<textarea name="note" placeholder="Ex.: mercado, farmácia, escola..."></textarea></label>
      </div><div class="form-actions"><button class="button" type="submit">Adicionar despesa pessoal</button></div></form>
      <h3 class="section-title">Últimas despesas pessoais</h3>${items.length?`<div class="list">${items.map(x=>`<article class="row"><div><div class="row-title">${escape(x.category)}</div><div class="row-sub">${String(x.date).split('-').reverse().join('/')} ${x.note?'· '+escape(x.note):''}</div></div><div><div class="row-value negative">− ${money(x.amount)}</div><div class="row-actions"><button class="text-button" data-personal-edit="${x.id}">Editar</button><button class="text-button delete" data-personal-delete="${x.id}">Excluir</button></div></div></article>`).join('')}</div>`:'<div class="empty">Nenhuma despesa pessoal registrada ainda.</div>'}`;
  }
  function editPersonal(item){
    const app=document.querySelector('#app');
    app.innerHTML=`<div class="section-head"><div><h2>Editar despesa pessoal</h2><p class="hint">Altere os dados e salve.</p></div></div><form id="personalEditForm" class="form-card"><div class="form-grid"><label>Data<input required name="date" type="date" value="${item.date}" /></label><label>Categoria<select name="category">${options(state.categories,item.category)}</select></label><label>Valor (R$)<input required min="0" step="0.01" name="amount" type="number" value="${item.amount}" /></label><label>Quilometragem<input min="0" step="0.1" name="km" type="number" value="${item.km||''}" /></label><label class="wide">Observação<textarea name="note">${escape(item.note)}</textarea></label></div><div class="form-actions"><button type="button" class="button secondary" id="personalCancel">Cancelar</button><button class="button" type="submit">Salvar alterações</button></div></form>`;
    document.querySelector('#personalCancel').onclick=()=>{view='personal';render();};
    document.querySelector('#personalEditForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));Object.assign(item,{date:d.date,category:d.category,amount:Number(d.amount),km:Number(d.km||0),note:d.note,use:'Lazer/pessoal'});save();toast('Despesa pessoal atualizada.');render();};
  }
  const oldRender=window.render;
  window.personal=personal;
  window.render=function(){
    if(view==='personal'){
      document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
      document.querySelector('#app').innerHTML=personal();
      bindPersonal();
      return;
    }
    oldRender();
  };
  function bindPersonal(){
    const form=document.querySelector('#personalForm');
    if(form) form.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));state.expenses.push({id:id(),date:d.date,category:d.category,amount:Number(d.amount),km:Number(d.km||0),hours:0,trips:0,odometer:0,use:'Lazer/pessoal',note:d.note||''});save();toast('Despesa pessoal adicionada.');render();};
    document.querySelectorAll('[data-personal-edit]').forEach(b=>b.onclick=()=>{const item=state.expenses.find(x=>x.id===b.dataset.personalEdit);if(item)editPersonal(item);});
    document.querySelectorAll('[data-personal-delete]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta despesa pessoal?')){state.expenses=state.expenses.filter(x=>x.id!==b.dataset.personalDelete);save();toast('Despesa pessoal excluída.');render();}});
  }
  document.querySelectorAll('[data-view="personal"]').forEach(b=>b.onclick=()=>{view='personal';editing=null;render();});
})();
