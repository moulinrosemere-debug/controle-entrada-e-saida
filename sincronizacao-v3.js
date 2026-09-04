/* Lopes Tur — sincronização v4: lançamentos + Contas e manutenção */
(function(){
  const URL='https://gtrntzlbipyxehtaxybu.supabase.co';
  const KEY='sb_publishable_EIn3yLKsJs3FJKiZeZDs9g_4uAB5xyX';
  const ID='principal',TABLE='lopes_tur_dados',CAR_KEY='lopesTur.contasCarro.v1',STATE_KEY='meuLucroUber.v1';
  const loadScript=u=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch(e){return f}};
  const carData=()=>read(CAR_KEY,{});
  const mainData=()=>read(STATE_KEY,null);
  const hasData=x=>x&&['ipva','seguro','manutencoes','multas'].some(k=>Array.isArray(x[k])&&x[k].length);
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const saveCar=x=>localStorage.setItem(CAR_KEY,JSON.stringify(x||{}));
  const saveMain=x=>localStorage.setItem(STATE_KEY,JSON.stringify(x||{}));
  const status=t=>{let e=document.getElementById('syncStatus');if(!e){e=document.createElement('div');e.id='syncStatus';e.style.cssText='position:fixed;right:12px;bottom:78px;z-index:9999;padding:7px 11px;border-radius:999px;background:#116149;color:#fff;font:600 12px system-ui;box-shadow:0 3px 12px rgba(0,0,0,.15);opacity:.92'}e.textContent='☁ '+t};
  async function start(){try{
    if(!window.supabase)await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    const client=window.supabase.createClient(URL,KEY);window.lopesTurSupabase=client;
    let remote=false,lastCar=carData(),lastMain=mainData(),sending=false,timer=0,reloading=false;
    async function send(){
      if(remote||sending||typeof state==='undefined')return false;
      sending=true;
      try{
        const payload={...state,__lopesTurContasCarro:carData()};
        const r=await client.from(TABLE).upsert({id:ID,dados:payload,atualizado_em:new Date().toISOString()},{onConflict:'id'});
        if(r.error)throw r.error;
        lastCar=carData();lastMain=mainData();status('Sincronizado');return true;
      }catch(e){console.error('Falha ao enviar sincronização:',e);status('Sem sincronização');return false}
      finally{sending=false}
    }
    window.lopesTurSincronizacao={syncNow:send};
    const originalSave=window.save;
    if(typeof originalSave==='function')window.save=function(){originalSave();clearTimeout(timer);timer=setTimeout(send,150)};
    const localCar=carData(),localMain=mainData();
    const r=await client.from(TABLE).select('dados,atualizado_em').eq('id',ID).maybeSingle();
    if(r.error)throw r.error;
    if(r.data&&r.data.dados){
      const d={...r.data.dados},c=d.__lopesTurContasCarro;
      remote=true;
      if(c)saveCar(c);
      delete d.__lopesTurContasCarro;
      if(Object.keys(d).length)saveMain(d);
      if(typeof state!=='undefined')state=d;
      if(typeof render==='function')render();
      remote=false;lastCar=carData();lastMain=mainData();
      if(c&&!same(localCar,c)&&!reloading){reloading=true;setTimeout(()=>location.reload(),100)}
    }else await send();
    client.channel('lopes-tur-sync-v4').on('postgres_changes',{event:'*',schema:'public',table:TABLE,filter:`id=eq.${ID}`},p=>{
      if(!p.new||!p.new.dados)return;
      const d={...p.new.dados},c=d.__lopesTurContasCarro,oldCar=carData();
      delete d.__lopesTurContasCarro;remote=true;
      if(c)saveCar(c);
      saveMain(d);if(typeof state!=='undefined')state=d;if(typeof render==='function')render();
      remote=false;lastCar=carData();lastMain=mainData();
      if(c&&!same(oldCar,c)&&!reloading){reloading=true;setTimeout(()=>location.reload(),100)}
      if(window.lopesTurLembretes)window.lopesTurLembretes.run();status('Atualizado em outro dispositivo');
    }).subscribe(s=>{if(s==='SUBSCRIBED')status('Sincronização ativa')});
    setInterval(()=>{const c=carData(),m=mainData();if(!same(c,lastCar)||!same(m,lastMain)){lastCar=c;lastMain=m;send()}},1000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')send()});
    window.addEventListener('beforeunload',()=>send());
    status('Sincronização ativa');
  }catch(e){console.error('Falha ao iniciar sincronização:',e);status('Sincronização indisponível')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
