/* Sincronizacao Lopes Tur: computador + celular */
(function () {
  const SUPABASE_URL = 'https://gtrntzlbipyxehtaxybu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_EIn3yLKsJs3FJKiZeZDs9g_4uAB5xyX';
  const ROW_ID = 'principal';
  const TABLE = 'lopes_tur_dados';

  function carregarScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function iniciar() {
    try {
      if (!window.supabase) {
        await carregarScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      }
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      window.lopesTurSupabase = client;

      const originalSave = window.save;
      let timer = null;
      let aplicandoRemoto = false;

      async function enviar() {
        if (aplicandoRemoto || typeof state === 'undefined') return;
        try {
          await client.from(TABLE).upsert({
            id: ROW_ID,
            dados: state,
            atualizado_em: new Date().toISOString()
          }, { onConflict: 'id' });
          mostrarStatus('Sincronizado');
        } catch (err) {
          console.error('Erro ao sincronizar:', err);
          mostrarStatus('Sem sincronização');
        }
      }

      window.save = function () {
        if (typeof originalSave === 'function') originalSave();
        clearTimeout(timer);
        timer = setTimeout(enviar, 250);
      };

      const { data, error } = await client
        .from(TABLE)
        .select('dados, atualizado_em')
        .eq('id', ROW_ID)
        .maybeSingle();

      if (error) throw error;

      if (data && data.dados) {
        aplicandoRemoto = true;
        state = data.dados;
        if (typeof originalSave === 'function') originalSave();
        if (typeof render === 'function') render();
        aplicandoRemoto = false;
      } else {
        await enviar();
      }

      client
        .channel('lopes-tur-sync')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLE,
          filter: `id=eq.${ROW_ID}`
        }, payload => {
          if (!payload.new || !payload.new.dados) return;
          aplicandoRemoto = true;
          state = payload.new.dados;
          if (typeof originalSave === 'function') originalSave();
          if (typeof render === 'function') render();
          aplicandoRemoto = false;
          mostrarStatus('Atualizado em outro dispositivo');
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') mostrarStatus('Sincronização ativa');
        });

      mostrarStatus('Sincronização ativa');
    } catch (err) {
      console.error('Falha ao iniciar sincronização:', err);
      mostrarStatus('Sincronização indisponível');
    }
  }

  function mostrarStatus(texto) {
    let el = document.getElementById('syncStatus');
    if (!el) {
      el = document.createElement('div');
      el.id = 'syncStatus';
      el.style.cssText = 'position:fixed;right:12px;bottom:78px;z-index:9999;padding:7px 11px;border-radius:999px;background:#116149;color:#fff;font:600 12px system-ui;box-shadow:0 3px 12px rgba(0,0,0,.15);opacity:.92';
      document.body.appendChild(el);
    }
    el.textContent = '☁ ' + texto;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
