(function(){
'use strict';
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function brNumber(v){const s=String(v??'').trim().replace(/R\$\s?/g,'');if(!s)return 0;const normalized=s.includes(',')?s.replace(/\./g,'').replace(',','.'):s;return Number(normalized)||0;}
let waitTimer=null;
let waitStartedAt=null;
let waitElapsedSeconds=0;
let manualStartTime='';
let manualEndTime='';
function formatDuration(sec){sec=Math.max(0,Math.floor(sec||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':');}
function waitRate(){return Math.max(0,brNumber(document.getElementById('kmc-wait-rate')?.value||90));}
function waitHours(){return waitElapsedSeconds/3600;}
function waitValue(){return waitHours()*waitRate();}
function parseTime(v){if(!/^\d{2}:\d{2}$/.test(v||''))return null;const [h,m]=v.split(':').map(Number);if(h>23||m>59)return null;return h*60+m;}
function calculateManualWait(){const a=parseTime(manualStartTime),b=parseTime(manualEndTime);if(a===null||b===null)return null;let diff=b-a;if(diff<0)diff+=1440;return diff*60;}
function updateWaitDisplay(){const elapsed=document.getElementById('kmc-wait-elapsed');if(elapsed)elapsed.textContent=formatDuration(waitElapsedSeconds);const value=document.getElementById('kmc-wait-value');if(value)value.textContent=money(waitValue());const status=document.getElementById('kmc-wait-status');if(status)status.textContent=waitStartedAt?'⏱️ Espera em andamento':(manualStartTime&&manualEndTime?'Horário informado manualmente':'Aguardando para iniciar');}
function calc(){
 const service=document.getElementById('kmc-service')?.value||'manual';
 const km=Math.max(0,brNumber(document.getElementById('kmc-manual-km')?.value));
 const rate=Math.max(0,brNumber(document.getElementById('kmc-km-rate')?.value));
 const kmValue=km*rate;
 const serviceBase=service==='manual'?0:Number(service||0);
 const base=kmValue+serviceBase;
 const extraHours=brNumber(document.getElementById('kmc-hours')?.value)*90;
 const excess=brNumber(document.getElementById('kmc-excess')?.value)*3;
 const toll=brNumber(document.getElementById('kmc-toll')?.value);
 const parking=brNumber(document.getElementById('kmc-parking')?.value);
 const waiting=waitValue();
 const total=base+extraHours+excess+toll+parking+waiting;
 document.getElementById('kmc-km').textContent=numberKm(km);
 document.getElementById('kmc-km-value').textContent=money(kmValue);
 const serviceMetric=document.getElementById('kmc-service-metric');if(serviceMetric)serviceMetric.hidden=service==='manual';
 document.getElementById('kmc-base').textContent=money(serviceBase);
 document.getElementById('kmc-total').textContent=money(total);
 document.getElementById('kmc-result').hidden=false;
 document.getElementById('kmc-summary').value=buildMessage(total,km,rate,kmValue,serviceBase,extraHours,excess,toll,parking,waiting);
 updateWaitDisplay();
}
function numberKm(v){return Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:2})+' km';}
function buildMessage(total,km,rate,kmValue,serviceBase,hours,excess,toll,parking,waiting){
 const client=document.getElementById('kmc-client').value.trim()||'Cliente';const s=document.getElementById('kmc-service');const isManual=s.value==='manual';const label=s.options[s.selectedIndex]?.text||'';const waitSec=waitElapsedSeconds;
 const waitTime=(manualStartTime&&manualEndTime)?`\nHorário de espera: ${manualStartTime} às ${manualEndTime}`:'';
 return `*LOPES TUR — COTAÇÃO*\n\nCliente: ${client}${isManual?'':`\nServiço: ${label}`}\nKM rodados: ${numberKm(km)}${rate?'\nValor por KM: '+money(rate):''}${kmValue?'\nValor dos KM: '+money(kmValue):''}${serviceBase?'\nValor do serviço: '+money(serviceBase):''}${hours?'\nHoras extras: '+money(hours):''}${excess?'\nQuilometragem excedente: '+money(excess):''}${waitSec?waitTime+'\nTempo de espera: '+formatDuration(waitSec)+' — '+money(waiting):''}${toll?'\nPedágio: '+money(toll):''}${parking?'\nEstacionamento: '+money(parking):''}\n\n*TOTAL: ${money(total)}*\n\nLopes Tur — Transporte Executivo`;
}
function startWait(){if(waitStartedAt)return;manualStartTime='';manualEndTime='';const now=new Date();manualStartTime=now.toTimeString().slice(0,5);waitStartedAt=Date.now();waitElapsedSeconds=0;clearInterval(waitTimer);waitTimer=setInterval(()=>{waitElapsedSeconds=Math.floor((Date.now()-waitStartedAt)/1000);updateWaitDisplay();calc();},1000);document.getElementById('kmc-wait-start').disabled=true;document.getElementById('kmc-wait-stop').disabled=false;updateWaitDisplay();}
function stopWait(){if(!waitStartedAt)return;waitElapsedSeconds=Math.floor((Date.now()-waitStartedAt)/1000);const now=new Date();manualEndTime=now.toTimeString().slice(0,5);clearInterval(waitTimer);waitTimer=null;waitStartedAt=null;document.getElementById('kmc-wait-start').disabled=false;document.getElementById('kmc-wait-stop').disabled=true;updateWaitDisplay();calc();}
function applyManualTimes(){if(waitStartedAt){alert('Finalize a espera pelo cronômetro antes de informar horários manualmente.');return;}const sec=calculateManualWait();if(sec===null){waitElapsedSeconds=0;updateWaitDisplay();calc();return;}waitElapsedSeconds=sec;updateWaitDisplay();calc();}
function resetWait(){clearInterval(waitTimer);waitTimer=null;waitStartedAt=null;waitElapsedSeconds=0;manualStartTime='';manualEndTime='';const a=document.getElementById('kmc-wait-start'),b=document.getElementById('kmc-wait-stop');if(a)a.disabled=false;if(b)b.disabled=true;const st=document.getElementById('kmc-wait-start-time'),en=document.getElementById('kmc-wait-end-time');if(st)st.value='';if(en)en.value='';updateWaitDisplay();calc();}
function share(){calc();window.open('https://wa.me/?text='+encodeURIComponent(document.getElementById('kmc-summary').value),'_blank');}
function moneyInput(id){const el=document.getElementById(id);if(!el)return;el.addEventListener('input',calc);el.addEventListener('blur',()=>{if(el.value)el.value=money(brNumber(el.value));calc();});}
function render(){
 clearInterval(waitTimer);waitTimer=null;waitStartedAt=null;waitElapsedSeconds=0;manualStartTime='';manualEndTime='';
 const host=document.getElementById('kmc-view');if(!host)return;
 host.innerHTML=`<div class="section-head"><div><h2>🧮 Calculadora de KM</h2></div></div><div class="form-card"><div class="form-grid"><label class="wide">Nome do cliente<input id="kmc-client" placeholder="Digite o nome do cliente"></label><label class="wide">Serviço<select id="kmc-service"><option value="manual" selected>KM rodado — calcular em R$</option><option value="180">Transfer Aeroporto SDU — R$ 180,00</option><option value="250">Transfer Aeroporto GIG — R$ 250,00</option><option value="450">Meia Diária Corporativa de 4h — R$ 450,00</option><option value="750">Diária Corporativa Cheia de 8h — R$ 750,00</option></select></label><label>KM rodados<input id="kmc-manual-km" type="text" inputmode="decimal" placeholder="Ex.: 100"></label><label>Valor por KM (R$)<input id="kmc-km-rate" type="text" inputmode="decimal" placeholder="Ex.: 1,50"></label><label>Horas extras (R$ 90/h)<input id="kmc-hours" type="number" min="0" step="0.5" inputmode="decimal"></label><label id="kmc-excess-label">KM excedente (R$ 3/km)<input id="kmc-excess" type="number" min="0" step="0.01" inputmode="decimal"></label><label class="wide">Valor da espera<select id="kmc-wait-rate"><option value="80">Diurna — R$ 80,00/h</option><option value="90" selected>Noturna — R$ 90,00/h</option></select></label></div><div class="wait-card" style="margin-top:12px;padding:14px;border-radius:12px;background:#f3f4f6"><strong>⏱️ Tempo parado aguardando passageiro</strong><div id="kmc-wait-status" style="margin-top:6px">Aguardando para iniciar</div><div class="form-grid" style="margin-top:10px"><label>Hora de início<input id="kmc-wait-start-time" type="time"></label><label>Hora de fim<input id="kmc-wait-end-time" type="time"></label></div><div style="font-size:30px;font-weight:800;margin:8px 0" id="kmc-wait-elapsed">00:00:00</div><div>Valor da espera: <strong id="kmc-wait-value">R$ 0,00</strong></div><div class="form-actions" style="margin-top:10px"><button class="button" id="kmc-wait-start">▶ Iniciar espera</button><button class="button secondary" id="kmc-wait-stop" disabled>■ Finalizar espera</button></div><small style="display:block;margin-top:8px">Você pode informar o horário de início e fim manualmente ou usar o cronômetro.</small></div><div class="form-grid" style="margin-top:12px"><label>Pedágio<input id="kmc-toll" type="text" inputmode="decimal" placeholder="R$ 0,00"></label><label>Estacionamento<input id="kmc-parking" type="text" inputmode="decimal" placeholder="R$ 0,00"></label></div><div class="form-actions"><button class="button" id="kmc-calc">Calcular</button><button class="button secondary" id="kmc-clear">Limpar</button></div></div><div id="kmc-result" class="card" hidden style="margin-top:12px"><div class="summary-grid"><div class="metric"><span>KM rodados</span><strong id="kmc-km">0 km</strong></div><div class="metric"><span>Valor dos KM</span><strong id="kmc-km-value">R$ 0,00</strong></div><div class="metric" id="kmc-service-metric" hidden><span>Valor do serviço</span><strong id="kmc-base">R$ 0,00</strong></div><div class="metric full"><span>Total da cotação</span><strong id="kmc-total" class="positive">R$ 0,00</strong></div></div><textarea id="kmc-summary" aria-label="Resumo da cotação" style="margin-top:12px"></textarea><div class="form-actions"><button class="button" id="kmc-whatsapp">📲 Compartilhar no WhatsApp</button></div></div>`;
 const st=document.getElementById('kmc-wait-start-time'),en=document.getElementById('kmc-wait-end-time');st.addEventListener('change',()=>{manualStartTime=st.value;applyManualTimes();});en.addEventListener('change',()=>{manualEndTime=en.value;applyManualTimes();});
 document.getElementById('kmc-calc').onclick=calc;document.getElementById('kmc-whatsapp').onclick=share;document.getElementById('kmc-clear').onclick=()=>render();document.getElementById('kmc-wait-start').onclick=startWait;document.getElementById('kmc-wait-stop').onclick=stopWait;document.getElementById('kmc-client').addEventListener('input',calc);['kmc-manual-km','kmc-km-rate','kmc-hours','kmc-excess'].forEach(id=>document.getElementById(id).addEventListener('input',calc));document.getElementById('kmc-service').addEventListener('change',calc);document.getElementById('kmc-wait-rate').addEventListener('change',calc);moneyInput('kmc-km-rate');moneyInput('kmc-toll');moneyInput('kmc-parking');calc();
}
window.LopesTurCalculadoraKM={render};
})();
