/* Relatórios Lopes Tur - apresentação simplificada */
(function(){
  function atualizar(){
    if(typeof view==='undefined' || view!=='reports') return;
    const app=document.querySelector('#app');
    if(!app) return;
    // Remove o bloco antigo de uso pessoal dos relatórios.
    [...app.querySelectorAll('.section-title')].forEach(h=>{
      if(h.textContent.trim()==='Uso pessoal do carro'){
        const card=h.nextElementSibling;
        if(card) card.remove();
        h.remove();
      }
    });
    // Troca a mensagem antiga por uma mensagem simples.
    [...app.querySelectorAll('.empty')].forEach(el=>{
      if(el.textContent.includes('Cadastre gastos de trabalho')) el.textContent='Nenhum gasto de trabalho registrado ainda.';
    });
  }
  const oldRender=window.render;
  if(oldRender){
    window.render=function(){oldRender(); atualizar();};
  }
  document.addEventListener('click',()=>setTimeout(atualizar,0));
  setTimeout(atualizar,100);
})();
