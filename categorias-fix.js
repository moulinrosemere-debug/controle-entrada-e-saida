(function(){
  const KEY='meuLucroUber.v1';
  const remover=new Set(['IPVA 3/3','IPVA/licenciamento','Seguro','Manutenção','Multas','Financiamento/aluguel']);
  try{
    const s=JSON.parse(localStorage.getItem(KEY)||'{}');
    let cats=Array.isArray(s.categories)?s.categories:[];
    cats=cats.filter(c=>!remover.has(String(c).trim()));
    if(!cats.includes('GRT')) cats.push('GRT');
    s.categories=cats;
    localStorage.setItem(KEY,JSON.stringify(s));
  }catch(e){}
})();