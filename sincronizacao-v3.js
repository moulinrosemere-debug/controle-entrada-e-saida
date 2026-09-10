/* Lopes Tur — sincronização v10: preserva a tela da Calculadora KM */
(function(){
  const URL='https://gtrntzlbipyxehtaxybu.supabase.co';
  const KEY='sb_publishable_EIn3yLKsJs3FJKiZeZDs9g_4uAB5xyX';
  const ID='principal',TABLE='lopes_tur_dados',CAR_KEY='lopesTur.contasCarro.v1',STATE_KEY='meuLucroUber.v1',CALC_KEY='lopesTur.calculadoraKM.v1';
  const loadScript=u=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch(e){return f}};
  const carData=()=>read(CAR_KEY,{}),mainData=()=>read(STATE_KEY,null),calcData=()=>read(CALC_KEY,{});
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const saveCar=x=>localStorage.setItem(CAR_KEY,JSON.stringify(x||{}));
  const saveMain=x=>localStorage.setItem(STATE_KEY,JSON.stringify(x||{}));
  const saveCalc=x=>localStorage.setItem(CALC_KEY,JSON.stringify(x||{}));
  const calculatorOpen=()=>{const e=document.getElementById('kmc-view');return !!(e&&!e.hidden)};
  const refreshVisibleView=()=>{if(calculatorOpen()){if(window.LopesTurCalculadoraKM)window.LopesTurCalculadoraKM.render();return;}if(typeof render==='function')render()};
  const status=t=>{let e=document.getElementById('syncStatus');if(!e){e=document.createElement('div');e.id='syncStatus';e.style.cssText='position:fixed;right:12px;bottom:78px;z-index:99999;padding:7px 11px;border-radius:999px;background:#116149;color:#fff;font:600 12px system-ui;box-shadow:0 3px 12px rgba(0,0,0,.15);opacity:.92;pointer-events:none'}e.textContent='☁ '+t};
  status('Sincronização ativa');
  async function start(){try{
    if(!window.supabase)await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    const client=window.supabase.createClient(URL,KEY);window.lopesTurSupabase=client;
    let remote=false,lastCar=carData(),lastMain=mainData(),lastCalc=calcData(),sending=false,timer=0;
    async function send(){
      if(remote||sending||typeof state==='undefined')return false;
      sending=true;
      try{
        const payload={...state,__lopesTurContasCarro:carData(),__lopesTurCalculadoraKM:calcData()};
        const r=await client.from(TABLE).upsert({id:ID,dados:payload,atualizado_em:new Date().toISOString()},{onConflict:'id'});
        if(r.error)throw r.error;
        lastCar=carData();lastMain=mainData();lastCalc=calcData();status('Sincronizado');return true;
      }catch(e){console.error('Falha ao enviar sincronização:',e);status('Sem sincronização');return false}
      finally{sending=false}
    }
    const queueSend=()=>{clearTimeout(timer);timer=setTimeout(send,50)};
    window.lopesTurSincronizacao={syncNow:send};
    const originalSave=window.save;
    if(typeof originalSave==='function')window.save=function(){originalSave();queueSend()};
    window.addEventListener('lopes-tur:state-saved',queueSend);
    window.addEventListener('lopes-tur:calculadora-saved',queueSend);
    window.addEventListener('online',queueSend);
    const localCar=carData(),localMain=mainData(),localCalc=calcData();
    const r=await client.from(TABLE).select('dados,atualizado_em').eq('id',ID).maybeSingle();
    if(r.error)throw r.error;
    if(r.data&&r.data.dados){
      const d={...r.data.dados},c=d.__lopesTurContasCarro,k=d.__lopesTurCalculadoraKM;
      remote=true;
      if(c)saveCar(c);if(k)saveCalc(k);
      delete d.__lopesTurContasCarro;delete d.__lopesTurCalculadoraKM;
      if(Object.keys(d).length)saveMain(d);
      if(typeof state!=='undefined')state=d;
      refreshVisibleView();
      remote=false;lastCar=carData();lastMain=mainData();lastCalc=calcData();
    }else await send();
    client.channel('lopes-tur-sync-v10').on('postgres_changes',{event:'*',schema:'public',table:TABLE,filter:`id=eq.${ID}`},p=>{
      if(!p.new||!p.new.dados)return;
      const d={...p.new.dados},c=d.__lopesTurContasCarro,k=d.__lopesTurCalculadoraKM;
      const oldCar=carData(),oldMain=mainData(),oldCalc=calcData();
      delete d.__lopesTurContasCarro;delete d.__lopesTurCalculadoraKM;
      const localEcho=(!c||same(oldCar,c))&&(!k||same(oldCalc,k))&&same(oldMain,d);
      if(localEcho){status('Sincronizado');lastCar=oldCar;lastMain=oldMain;lastCalc=oldCalc;return;}
      remote=true;
      if(c)saveCar(c);if(k)saveCalc(k);
      saveMain(d);if(typeof state!=='undefined')state=d;
      if(!calculatorOpen())refreshVisibleView();
      remote=false;lastCar=carData();lastMain=mainData();lastCalc=calcData();
      if(window.lopesTurLembretes)window.lopesTurLembretes.run();status('Atualizado em outro dispositivo');
    }).subscribe(s=>{if(s==='SUBSCRIBED')status('Sincronização ativa')});
    setInterval(()=>{const c=carData(),m=mainData(),k=calcData();if(!same(c,lastCar)||!same(m,lastMain)||!same(k,lastCalc)){lastCar=c;lastMain=m;lastCalc=k;send()}},1000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')send()});
    window.addEventListener('beforeunload',()=>send());
    status('Sincronização ativa');
  }catch(e){console.error('Falha ao iniciar sincronização:',e);status('Sincronização indisponível')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
