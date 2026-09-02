(function(){
'use strict';
const services=[
 ['Transfer Aeroporto SDU',180],['Transfer Aeroporto GIG',250],['Meia Diária Corporativa de 4h',450],['Diária Corporativa Cheia de 8h',750],['Viagem por KM Rodado — R$ 4,50/km',4.5],['Viagem por KM Rodado — R$ 3,50/km',3.5],['Viagem por KM Rodado — R$ 2,50/km',2.5]
];
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function isKm(){return document.getElementById('kmc-service')?.value.startsWith('km:');}
function calc(){
 const service=document.getElementById('kmc-service').value, initial=+document.getElementById('kmc-initial').value||0, final=+document.getElementById('kmc-final').value||0;
 const km=Math.max(0,final-initial); let base=0;
 if(service.startsWith('km:')) base=km*Number(service.slice(3)); else base=Number(service.split(':')[1]||0);
 const extraHours=(+document.getElementById('kmc-hours').value||0)*90;
 const excess=isKm()?0:(+document.getElementById('kmc-excess').value||0)*3;
 const toll=+document.getElementById('kmc-toll').value||0, parking=+document.getElementById('kmc-parking').value||0;
 const total=base+extraHours+excess+toll+parking;
 document.getElementById('kmc-km').textContent=km+' km'; document.getElementById('kmc-base').textContent=money(base); document.getElementById('kmc-total').textContent=money(total);
 document.getElementById('kmc-result').hidden=false;
 document.getElementById('kmc-summary').value=buildMessage(total,km,base,extraHours,excess,toll,parking);
}
function buildMessage(total,km,base,hours,excess,toll,parking){
 const client=document.getElementById('kmc-client').value.trim()||'Cliente'; const s=document.getElementById('kmc-service'); const label=s.options[s.selectedIndex]?.text||'';
 return `*LOPES TUR — COTAÇÃO*\n\nCliente: ${client}\nServiço: ${label}\nKM rodados: ${km} km\nValor do serviço: ${money(base)}${hours?'\nHoras extras: '+money(hours):''}${excess?'\nQuilometragem excedente: '+money(excess):''}${toll?'\nPedágio: '+money(toll):''}${parking?'\nEstacionamento: '+money(parking):''}\n\n*TOTAL: ${money(total)}*\n\nLopes Tur — Transporte Executivo`;
}
function share(){calc(); const text=document.getElementById('kmc-summary').value; window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');}
function render(){
 const host=document.getElementById('kmc-view'); if(!host)return;
 host.innerHTML=`<div class="section-head"><div><h2>🧮 Calculadora de KM</h2><p class="hint">Cotação independente — não entra nos lançamentos do aplicativo.</p></div></div><div class="form-card"><div class="form-grid"><label class="wide">Nome do cliente<input id="kmc-client" placeholder="Digite o nome do cliente"></label><label class="wide">Serviço<select id="kmc-service"><option value="180">Transfer Aeroporto SDU — R$ 180,00</option><option value="250">Transfer Aeroporto GIG — R$ 250,00</option><option value="450">Meia Diária Corporativa de 4h — R$ 450,00</option><option value="750">Diária Corporativa Cheia de 8h — R$ 750,00</option><option value="km:4.5">Viagem por KM Rodado — R$ 4,50/km</option><option value="km:3.5">Viagem por KM Rodado — R$ 3,50/km</option><option value="km:2.5">Viagem por KM Rodado — R$ 2,50/km</option></select></label><label>KM inicial<input id="kmc-initial" type="number" min="0" inputmode="numeric"></label><label>KM final<input id="kmc-final" type="number" min="0" inputmode="numeric"></label><label>Horas extras (R$ 90/h)<input id="kmc-hours" type="number" min="0" step="0.5" inputmode="decimal"></label><label id="kmc-excess-label">KM excedente (R$ 3/km)<input id="kmc-excess" type="number" min="0" inputmode="decimal"></label><label>Pedágio<input id="kmc-toll" type="number" min="0" step="0.01" inputmode="decimal"></label><label>Estacionamento<input id="kmc-parking" type="number" min="0" step="0.01" inputmode="decimal"></label></div><div class="form-actions"><button class="button" id="kmc-calc">Calcular</button><button class="button secondary" id="kmc-clear">Limpar</button></div></div><div id="kmc-result" class="card" hidden style="margin-top:12px"><div class="summary-grid"><div class="metric"><span>KM rodados</span><strong id="kmc-km">0 km</strong></div><div class="metric"><span>Valor do serviço</span><strong id="kmc-base">R$ 0,00</strong></div><div class="metric full"><span>Total da cotação</span><strong id="kmc-total" class="positive">R$ 0,00</strong></div></div><textarea id="kmc-summary" aria-label="Resumo da cotação" style="margin-top:12px"></textarea><div class="form-actions"><button class="button" id="kmc-whatsapp">📲 Compartilhar no WhatsApp</button></div></div>`;
 document.getElementById('kmc-service').addEventListener('change',()=>{document.getElementById('kmc-excess-label').hidden=isKm();});
 document.getElementById('kmc-calc').onclick=calc; document.getElementById('kmc-whatsapp').onclick=share; document.getElementById('kmc-clear').onclick=()=>render();
 document.getElementById('kmc-excess-label').hidden=isKm();
}
window.LopesTurCalculadoraKM={render};
})();