function parseDate(s){return new Date(String(s)+'T12:00:00');}
function dueLabel(date,today){const d=Math.round((parseDate(date)-parseDate(today))/86400000);if(d===0)return'hoje';if(d===1)return'amanhã';if(d>1)return'em '+d+' dias';if(d===-1)return'ontem';return'há '+Math.abs(d)+' dias';}
function upcoming(items,today){const limit=parseDate(today);const end=new Date(limit);end.setDate(end.getDate()+7);return (items||[]).filter(x=>x&&!x.paga&&x.data&&parseDate(x.data)>=limit&&parseDate(x.data)<=end);}
if(typeof module!=='undefined')module.exports={dueLabel,upcoming};