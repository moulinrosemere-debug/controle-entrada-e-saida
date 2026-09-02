/* Lopes Tur — lembretes de contas, manutenção e despesas pessoais */
(function(){
  const KEY='lopesTur.contasCarro.v1',DAY=86400000;
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}};
  const dateOnly=s=>new Date(String(s)+'T12:00:00');
  const today=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate(),12).getTime()};
  const diff=s=>Math.round((dateOnly(s).getTime()-today())/DAY);
  const label=n=>n===0?'vence hoje':n===1?'vence amanhã':`vence em ${n} dias`;
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0));
  function personal(){return window.state&&Array.isArray(state.expenses)?state.expenses.filter(x=>x.use==='Lazer/pessoal'&&(x.dueDate||x.date)):[];}
  function collect(){const db=read(),out=[];const add=(arr,nome)=>(arr||[]).forEach(x=>{if(x.paga||!x.data)return;const n=diff(x.data);if(n>=0&&n<=7)out.push({key:nome+'-'+(x.id||x.data),title:nome,message:`${nome} ${label(n)}${x.valor?' — '+money(x.valor):''}.`,date:x.data})});
    add(db.ipva,'IPVA');add(db.seguro,'Seguro');add(db.multas,'Multa');
    (db.manutencoes||[]).forEach(x=>{if(x.nextDate){const n=diff(x.nextDate);if(n>=0&&n<=7)out.push({key:'manut-date-'+x.id,title:'Manutenção',message:`${x.servico||'Manutenção'} ${label(n)}.`,date:x.nextDate})}});
    personal().forEach(x=>{const data=x.dueDate||x.date,n=diff(data);if(n===1)out.push({key:'pessoal-'+x.id+'-'+data,title:'Pessoal',message:`${x.category||'Despesa pessoal'} vence amanhã${x.amount?' — '+money(x.amount):''}.`,date:data})});
    return out.sort((a,b)=>a.date.localeCompare(b.date));
  }
  function collectAll(){const db=read(),out=[];const add=(arr,nome)=>(arr||[]).forEach(x=>{if(!x.paga&&x.data)out.push({id:nome+'-'+(x.id||x.data),nome,data:x.data,paga:false})});
    add(db.ipva,'IPVA');add(db.seguro,'Seguro');add(db.multas,'Multa');
    (db.manutencoes||[]).forEach(x=>{if(x.nextDate)out.push({id:'manut-date-'+x.id,nome:'Manutenção — '+(x.servico||'serviço'),data:x.nextDate,paga:false})});
    personal().forEach(x=>out.push({id:'pessoal-'+x.id,nome:'Pessoal — '+(x.category||'despesa'),data:x.dueDate||x.date,paga:false,reminderDays:1,valor:Number(x.amount||0)}));
    return out;
  }
  function syncWorker(){if(!('serviceWorker' in navigator))return;navigator.serviceWorker.ready.then(reg=>{if(reg.active)reg.active.postMessage({type:'SET_REMINDERS',items:collectAll()})}).catch(()=>{});}
  function notify(list){if(!('Notification' in window)||Notification.permission!=='granted')return;list.forEach(x=>{const k='lopesTur.notificado.'+x.key+'-'+x.date;if(!localStorage.getItem(k)){new Notification('🔔 Lopes Tur — lembrete',{body:x.message,tag:k});localStorage.setItem(k,'1')}});}
  function panel(list){let p=document.getElementById('lopesLembretes');if(!p){p=document.createElement('div');p.id='lopesLembretes';p.style.cssText='position:fixed;right:18px;bottom:78px;width:min(390px,calc(100vw - 36px));z-index:9998';document.body.appendChild(p)}if(!list.length){p.innerHTML='';return}p.innerHTML='<div style="background:#fff;border:1px solid #e1e8e4;border-radius:15px;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,.15)"><b>🔔 Próximos vencimentos</b>'+list.map(x=>`<div style="padding:9px 0;border-bottom:1px solid #eee"><strong>${x.title}</strong><br><span>${x.message}</span></div>`).join('')+'</div>';}
  async function request(){if(!('Notification' in window))return;if(Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}}
  async function enableBackground(){try{const reg=await navigator.serviceWorker.ready;if('periodicSync' in reg){const tags=await reg.periodicSync.getTags();if(!tags.includes('lopes-tur-reminders'))await reg.periodicSync.register('lopes-tur-reminders',{minInterval:6*60*60*1000});}}catch(e){}}
  function run(){const list=collect();panel(list);syncWorker();notify(list)}
  window.lopesTurLembretes={run,request,collect,enableBackground};
  document.addEventListener('click',e=>{if(e.target.closest('#ctcOpen')){request().then(enableBackground)}},{capture:true});
  setTimeout(run,1200);setInterval(run,60000);
})();