/* Lopes Tur — calendário de Contas e manutenção */
(function(){
  const KEY='lopesTur.contasCarro.v1';
  const load=()=>{try{const x=JSON.parse(localStorage.getItem(KEY))||{};return{ipva:Array.isArray(x.ipva)?x.ipva:[],seguro:Array.isArray(x.seguro)?x.seguro:[],manutencoes:Array.isArray(x.manutencoes)?x.manutencoes:[],multas:Array.isArray(x.multas)?x.multas:[]}}catch(e){return{ipva:[],seguro:[],manutencoes:[],multas:[]}}};
  const esc=s=>String(s??'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
  const stamp=()=>new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const addDay=d=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+1);return x.toISOString().slice(0,10).replace(/-/g,'')};
  const event=(id,date,title,desc)=>['BEGIN:VEVENT',`UID:lopes-tur-carro-${id}@lopestur`,`DTSTAMP:${stamp()}`,`DTSTART;VALUE=DATE:${date.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${addDay(date)}`,`SUMMARY:${esc(title)}`,`DESCRIPTION:${esc(desc)}`,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Lembrete Lopes Tur','END:VALARM','END:VEVENT'].join('\r\n');
  function syncCalendar(){
    const d=load(), events=[];
    d.ipva.forEach(x=>{if(x.data)events.push(event('ipva-'+x.id,x.data,`Lopes Tur — IPVA parcela ${x.parcela}/${x.totalParcelas}`,`Valor: R$ ${Number(x.valor||0).toFixed(2).replace('.',',')} — ${x.paga?'Paga':'Pendente'}`))});
    d.seguro.forEach(x=>{if(x.data)events.push(event('seguro-'+x.id,x.data,`Lopes Tur — Seguro parcela ${x.parcela}/${x.totalParcelas}`,`Valor: R$ ${Number(x.valor||0).toFixed(2).replace('.',',')} — ${x.paga?'Paga':'Pendente'}`))});
    d.manutencoes.forEach(x=>{if(x.nextDate)events.push(event('manut-'+x.id,x.nextDate,`Lopes Tur — Próxima manutenção: ${x.servico||'Manutenção'}`,x.nextKm?`Próxima aos ${x.nextKm} km`:'Lembrete de manutenção') )});
    d.multas.forEach(x=>{if(x.vencimento)events.push(event('multa-'+x.id,x.vencimento,`Lopes Tur — Multa: ${x.descricao||'Multa'}`,`Valor: R$ ${Number(x.valor||0).toFixed(2).replace('.',',')} — ${x.paga?'Paga':'Pendente'}`))});
    if(!events.length){window.toast?.('Não há contas do carro com data para sincronizar.');return;}
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lopes Tur//Contas do Carro//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH',...events,'END:VCALENDAR'].join('\r\n');
    const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='lopes-tur-contas-carro.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);window.toast?.(`${events.length} evento(s) preparado(s) para o calendário, com lembrete 1 dia antes.`);
  }
  function inject(){const box=document.querySelector('.ctc-title');if(!box||box.querySelector('#ctcCalendar'))return;const b=document.createElement('button');b.id='ctcCalendar';b.className='ctc-btn';b.textContent='📅 Calendário';b.onclick=syncCalendar;box.appendChild(b)}
  new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
  window.lopesTurCalendarioCarro={syncCalendar};
})();
