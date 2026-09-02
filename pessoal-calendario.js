/* Lopes Tur — calendário das despesas pessoais */
(function(){
  const KEY='meuLucroUber.v1';
  const personalItems=()=>state.expenses.filter(x=>x.use==='Lazer/pessoal');
  const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const moneyBR=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0));
  const isoDate=s=>String(s||'').replace(/[^0-9-]/g,'');
  function dtstamp(){return new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');}
  function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
  function event(item){
    const due=isoDate(item.dueDate||item.date);
    const uid=`lopes-tur-pessoal-${item.id}@lopestur`;
    const title=`Lopes Tur — ${item.category||'Despesa pessoal'}`;
    const desc=`Valor: ${moneyBR(item.amount)}${item.note?'\\nObservação: '+item.note:''}`;
    return [
      'BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${dtstamp()}`,`DTSTART;VALUE=DATE:${due.replaceAll('-','')}`,`DTEND;VALUE=DATE:${due.replaceAll('-','')}`,
      `SUMMARY:${icsEscape(title)}`,`DESCRIPTION:${icsEscape(desc)}`,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Lembrete de vencimento — Lopes Tur','END:VALARM','END:VEVENT'
    ].join('\r\n');
  }
  function syncCalendar(){
    const items=personalItems().filter(x=>x.dueDate||x.date);
    if(!items.length){toast('Não há despesas pessoais para sincronizar.');return;}
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lopes Tur//Despesas Pessoais//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH',...items.map(event),'END:VCALENDAR'].join('\r\n');
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='lopes-tur-pessoal.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Calendário gerado com lembrete 1 dia antes. Abra o arquivo no telefone e adicione ao calendário.');
  }
  window.lopesTurCalendarioPessoal={syncCalendar};
  document.addEventListener('click',e=>{if(e.target.closest('#syncPersonalCalendar'))syncCalendar();});
})();
