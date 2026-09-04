(function(){
'use strict';
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function brNumber(v){
 const s=String(v??'').trim().replace(/R\$\s?/g,'');
 if(!s)return 0;
 const normalized=s.includes(',') ? s.replace(/\./g,'').replace(',','.') : s;
 return Number(normalized)||0;
}
function calc(){
 const service=document.getElementById('kmc-service')?.value||'manual';
 const km=Math.max(0,brNumber(document.getElementById('kmc-manual-km')?.value));
 const rate=Math.max(0,brNumber(document.getElementById('kmc-km-rate')?.value));
 const kmValue=km*rate;
 const serviceBase=service==='manual' ? 0 : Number(service||0);
 const base=kmValue+serviceBase;
 const extraHours=brNumber(document.getElementById('kmc-hours')?.value)*90;
 const excess=brNumber(document.getElementById('kmc-excess')?.value)*3;
 const toll=brNumber(document.getElementById('kmc-toll')?.value);
 const parking=brNumber(document.getElementById('kmc-parking')?.value);
 const total=base+extraHours+excess+toll+parking;
 document.getElementById('kmc-km').textContent=numberKm(km);
 document.getElementById('kmc-km-value').textContent=money(kmValue);
 document.getElementById('kmc-base').textContent=money(serviceBase);
 document.getElementById('kmc-total').textContent=money(total);
 document.getElementById('kmc-result').hidden=false;
 document.getElementById('kmc-summary').value=buildMessage(total,km,rate,kmValue,serviceBase,extraHours,excess,toll,parking);
}
function numberKm(v){return Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:2})+' km';}
function buildMessage(total,km,rate,kmValue,serviceBase,hours,excess,toll,parking){
 const client=document.getElementById('kmc-client').value.trim()||'Cliente';
 const s=document.getElementById('kmc-service');
 const label=s.options[s.selectedIndex]?.text||'';
 return `*LOPES TUR — COTAÇÃO*\n\nCliente: ${client}\nServiço: ${label}\nKM rodados: ${numberKm(km)}${rate?'\nValor por KM: '+money(rate):''}${kmValue?'\nValor dos KM: '+money(kmValue):''}${serviceBase?'\nValor do serviço: '+money(serviceBase):''}${hours?'\nHoras extras: '+money(hours):''}${excess?'\nQuilometragem excedente: '+money(excess):''}${toll?'\nPedágio: '+money(toll):''}${parking?'\nEstacionamento: '+money(parking):''}\n\n*TOTAL: ${money(total)}*\n\nLopes Tur — Transporte Executivo`;
}
function share(){calc();window.open('https://wa.me/?text='+encodeURIComponent(document.getElementById('kmc-summary').value),'_blank');}
function moneyInput(id){
 const el=document.getElementById(id); if(!el)return;
 el.addEventListener('input',calc);
 el.addEventListener('blur',()=>{if(el.value)el.value=money(brNumber(el.value));calc();});
}
function render(){
 const host=document.getElementById('kmc-view'); if(!host)return;
 host.innerHTML=`<div class="section-head"><div><h2>🧮 Calculadora de KM</h2></div></div><div class="form-card"><div class="form-grid"><label class="wide">Nome do cliente<input id="kmc-client" placeholder="Digite o nome do cliente"></label><label class="wide">Serviço<select id="kmc-service"><option value="manual" selected>KM rodado — calcular em R$</option><option value="180">Transfer Aeroporto SDU — R$ 180,00</option><option value="250">Transfer Aeroporto GIG — R$ 250,00</option><option value="450">Meia Diária Corporativa de 4h — R$ 450,00</option><option value="750">Diária Corporativa Cheia de 8h — R$ 750,00</option></select></label><label>KM rodados<input id="kmc-manual-km" type="text" inputmode="decimal" placeholder="Ex.: 100"></label><label>Valor por KM (R$)<input id="kmc-km-rate" type="text" inputmode="decimal" placeholder="Ex.: 1,50"></label><label>Horas extras (R$ 90/h)<input id="kmc-hours" type="number" min="0" step="0.5" inputmode="decimal"></label><label id="kmc-excess-label">KM excedente (R$ 3/km)<input id="kmc-excess" type="number" min="0" step="0.01" inputmode="decimal"></label><label>Pedágio<input id="kmc-toll" type="text" inputmode="decimal" placeholder="R$ 0,00"></label><label>Estacionamento<input id="kmc-parking" type="text" inputmode="decimal" placeholder="R$ 0,00"></label></div><div class="form-actions"><button class="button" id="kmc-calc">Calcular</button><button class="button secondary" id="kmc-clear">Limpar</button></div></div><div id="kmc-result" class="card" hidden style="margin-top:12px"><div class="summary-grid"><div class="metric"><span>KM rodados</span><strong id="kmc-km">0 km</strong></div><div class="metric"><span>Valor dos KM</span><strong id="kmc-km-value">R$ 0,00</strong></div><div class="metric"><span>Valor do serviço</span><strong id="kmc-base">R$ 0,00</strong></div><div class="metric full"><span>Total da cotação</span><strong id="kmc-total" class="positive">R$ 0,00</strong></div></div><textarea id="kmc-summary" aria-label="Resumo da cotação" style="margin-top:12px"></textarea><div class="form-actions"><button class="button" id="kmc-whatsapp">📲 Compartilhar no WhatsApp</button></div></div>`;
 document.getElementById('kmc-calc').onclick=calc;
 document.getElementById('kmc-whatsapp').onclick=share;
 document.getElementById('kmc-clear').onclick=()=>render();
 document.getElementById('kmc-client').addEventListener('input',calc);
 ['kmc-manual-km','kmc-km-rate','kmc-hours','kmc-excess'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
 document.getElementById('kmc-service').addEventListener('change',calc);
 moneyInput('kmc-km-rate'); moneyInput('kmc-toll'); moneyInput('kmc-parking');
 calc();
}
window.LopesTurCalculadoraKM={render};
})();
