/* Lopes Tur — calendário das despesas pessoais */
(function(){
  const personalItems=()=>window.state?.expenses?.filter(x=>x.use==='Lazer/pessoal')||[];
  const moneyBR=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0));
  const icsEscape=s=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
  const stamp=()=>new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  function event(item){
    const due=String(item.dueDate||item.date||'').replace(/-/g,'');
    const uid=`lopes-tur-pessoal-${item.id||Date.now()}@lopestur`;
    return ['BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${stamp()}`,`DTSTART;VALUE=DATE:${due}`,`DTEND;VALUE=DATE:${due}`,`SUMMARY:${icsEscape('Lopes Tur — '+(item.category||'Despesa pessoal'))}`,`DESCRIPTION:${icsEscape('Valor: '+moneyBR(item.amount)+(item.note?'\\nObservação: '+item.note:''))}`,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Lembrete de vencimento — Lopes Tur','END:VALARM','END:VEVENT'].join('\r\n');
  }
  function syncCalendar(items=personalItems()){
    items=items.filter(x=>x.dueDate||x.date);
    if(!items.length){window.toast?.('Não há despesas pessoais com data para sincronizar.');return;}
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lopes Tur//Despesas Pessoais//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH',...items.map(event),'END:VCALENDAR'].join('\r\n');
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='lopes-tur-pessoal.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    window.toast?.(`${items.length} despesa(s) preparada(s) para o calendário, com lembrete 1 dia antes.`);
  }
  window.lopesTurCalendarioPessoal={syncCalendar};
})();
