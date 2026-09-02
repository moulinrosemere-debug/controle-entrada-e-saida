const CACHE='lopes-tur-v8';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

const DB='lopesTurAlarmes';
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function getData(){const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction('data','readonly');const r=t.objectStore('data').get('reminders');r.onsuccess=()=>resolve(r.result||{});r.onerror=()=>reject(r.error);});}
async function setData(value){const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction('data','readwrite');t.objectStore('data').put(value,'reminders');t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}
function daysBetween(a,b){const x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');return Math.round((x-y)/86400000);}
function dueText(d){const n=daysBetween(d,new Date().toISOString().slice(0,10));if(n<0)return 'está vencida';if(n===0)return 'vence hoje';if(n===1)return 'vence amanhã';return `vence em ${n} dias`;}
function money(n){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0));}
async function check(){const data=await getData(),today=new Date().toISOString().slice(0,10),notified=data?.notified||{};for(const item of (data?.items||[])){if(item.paga||!item.data)continue;const n=daysBetween(item.data,today);const allowed=typeof item.reminderDays==='number'?n===item.reminderDays:(n>=0&&n<=7);if(!allowed)continue;const key=`${item.id}:${item.data}:${n}`;if(notified[key])continue;notified[key]=true;const amount=item.valor?` — ${money(item.valor)}`:'';await self.registration.showNotification('🔔 Lopes Tur',{body:`${item.nome} ${dueText(item.data)}${amount}.`,tag:`lopes-${item.id}`,data:{url:'./'}});}await setData({...data,notified});}
self.addEventListener('message',event=>{if(event.data?.type==='SET_REMINDERS'){event.waitUntil((async()=>{const current=await getData();await setData({items:event.data.items||[],notified:current?.notified||{}});await check();})());}if(event.data?.type==='CHECK_REMINDERS')event.waitUntil(check());});
self.addEventListener('periodicsync',event=>{if(event.tag==='lopes-tur-reminders')event.waitUntil(check());});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus' in c)return c.focus();}return clients.openWindow('./');}));});
