/* Lopes Tur — sincronização completa: lançamentos + Contas e manutenção */
(function(){
  const URL='https://gtrntzlbipyxehtaxybu.supabase.co';
  const KEY='sb_publishable_EIn3yLKsJs3FJKiZeZDs9g_4uAB5xyX';
  const ID='principal',TABLE='lopes_tur_dados',CAR_KEY='lopesTur.contasCarro.v1';
  const loadScript=u=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  const carData=()=>{try{return JSON.parse(localStorage.getItem(CAR_KEY))||{}}catch(e){return{}}};
  const hasCarData=x=>x&&['ipva','seguro','manutencoes','multas'].some(k=>Array.isArray(x[k])&&x[k].length);
  const saveCar=x=>localStorage.setItem(CAR_KEY,JSON.stringify(x||{}));
  const status=t=>{let e=document.getElementById('syncStatus');if(!e){e=document.createElement('div');e.id='syncStatus';e.style.cssText='position:fixed;right:12px;bottom:78px;z-index:9999;padding:7px 11px;border-radius:999px;background:#116149;color:#fff;font:600 12px system-ui;box-shadow:0 3px 12px rgba(0,0,0,.15);opacity:.92'}e.textContent='☁ '+t};
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  async function start(){try{
    if(!window.supabase)await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    const client=window.supabase.createClient(URL,KEY);window.lopesTurSupabase=client;
    const originalSave=window.save;let timer=null,remote=false,lastCar=carData(),reloading=false;
    async function send(){if(remote||typeof state==='undefined')return;try{await client.from(TABLE).upsert({id:ID,dados:{...state,__lopesTurContasCarro:carData()},atualizado_em:new Date().toISOString()},{onConflict:'id'});lastCar=carData();status('Sincronizado')}catch(e){console.error(e);status('Sem sincronização')}}
    window.lopesTurSincronizacao={syncNow:send};
    window.save=function(){if(typeof originalSave==='function')originalSave();clearTimeout(timer);timer=setTimeout(send,250)};
    const localBefore=carData();
    const r=await client.from(TABLE).select('dados,atualizado_em').eq('id',ID).maybeSingle();if(r.error)throw r.error;
    if(r.data&&r.data.dados){
      const d=r.data.dados,c=d.__lopesTurContasCarro;
      remote=true;
      if(c)saveCar(c);
      else if(hasCarData(localBefore)){remote=false;await send();remote=true}
      if(d.__lopesTurContasCarro)delete d.__lopesTurContasCarro;
      state=d;if(typeof originalSave==='function')originalSave();if(typeof render==='function')render();
      remote=false;lastCar=carData();
      if(c&&!same(localBefore,c)&&!reloading){reloading=true;setTimeout(()=>location.reload(),150)}
    }else await send();
    client.channel('lopes-tur-sync-v3').on('postgres_changes',{event:'*',schema:'public',table:TABLE,filter:`id=eq.${ID}`},p=>{
      if(!p.new||!p.new.dados)return;
      const d=p.new.dados,c=d.__lopesTurContasCarro,old=carData();remote=true;
      if(c)saveCar(c);if(d.__lopesTurContasCarro)delete d.__lopesTurContasCarro;
      state=d;if(typeof originalSave==='function')originalSave();if(typeof render==='function')render();remote=false;lastCar=carData();
      if(c&&!same(old,c)&&!reloading){reloading=true;setTimeout(()=>location.reload(),150)}
      if(window.lopesTurLembretes)window.lopesTurLembretes.run();status('Atualizado em outro dispositivo')
    }).subscribe(s=>{if(s==='SUBSCRIBED')status('Sincronização ativa')});
    setInterval(()=>{const now=carData();if(!same(now,lastCar)){lastCar=now;send()}},2000);
    status('Sincronização ativa');
  }catch(e){console.error('Falha ao iniciar sincronização:',e);status('Sincronização indisponível')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
