const SUPABASE_URL = window.LOPES_TUR_SUPABASE_URL || 'https://gtrntzlbipyxehtaxybu.supabase.co';
const UBER_AUTH_ENDPOINT = '/functions/v1/uber-auth';
const UBER_SYNC_ENDPOINT = '/functions/v1/uber-sync';
const UBER_SCOPE = 'partner.accounts partner.trips partner.payments';

function buildUberAuthorizeUrl({ clientId, redirectUri, state }) {
  const url = new URL('https://auth.uber.com/oauth/v2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', UBER_SCOPE);
  url.searchParams.set('state', state);
  return url.toString();
}

function functionUrl(endpoint) {
  const explicit = endpoint === UBER_AUTH_ENDPOINT ? window.LOPES_TUR_UBER_FUNCTION_URL : window.LOPES_TUR_UBER_SYNC_URL;
  return (explicit || SUPABASE_URL + endpoint).replace(/\/$/, '');
}

function uberCard() {
  return `<section class="card" id="uberIntegrationCard" style="margin-top:16px">
    <div class="section-head"><div><h3>🚗 Uber</h3><p class="hint">Sincronize viagens e ganhos da Uber com o Lopes Tur.</p></div></div>
    <div class="split">
      <button class="button" id="connectUberButton">Conectar Uber</button>
      <button class="button secondary" id="syncUberButton">Sincronizar agora</button>
    </div>
    <p class="hint" id="uberIntegrationStatus" style="margin-top:10px">Aguardando configuração.</p>
  </section>`;
}

function setUberStatus(text) {
  const element = document.querySelector('#uberIntegrationStatus');
  if (element) element.textContent = text;
}

async function syncUber() {
  setUberStatus('Sincronizando viagens e ganhos...');
  try {
    const response = await fetch(functionUrl(UBER_SYNC_ENDPOINT), { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Falha na sincronização');
    if (!payload.connected) { setUberStatus('Conecte sua conta Uber primeiro.'); return; }

    const existing = new Set((state.incomes || []).filter(item => item.source === 'Uber API').map(item => item.uberPaymentId));
    let added = 0;
    for (const payment of payload.payments || []) {
      const paymentId = payment.payment_id;
      if (!paymentId || existing.has(paymentId)) continue;
      const date = new Date(Number(payment.event_time) * 1000).toISOString().slice(0, 10);
      state.incomes.push({
        id: `uber-${paymentId}`,
        date,
        amount: Number(payment.amount || 0),
        tips: 0,
        trips: payment.trip_id ? 1 : 0,
        hours: 0,
        use: 'Trabalho Uber',
        source: 'Uber API',
        uberPaymentId: paymentId,
        note: `Uber · ${payment.category || 'pagamento'}`,
      });
      added++;
    }
    save();
    render();
    setUberStatus(`Sincronização concluída: ${added} novos pagamentos importados.`);
  } catch (error) {
    setUberStatus(`Não foi possível sincronizar: ${error.message}`);
  }
}

function injectUberCard() {
  if (document.querySelector('#uberIntegrationCard')) return;
  const target = document.querySelector('#app');
  if (!target) return;
  const card = document.createElement('div');
  card.innerHTML = uberCard();
  target.appendChild(card.firstElementChild);
  document.querySelector('#connectUberButton').onclick = () => {
    setUberStatus('Abrindo autorização da Uber...');
    window.location.href = functionUrl(UBER_AUTH_ENDPOINT);
  };
  document.querySelector('#syncUberButton').onclick = syncUber;
}

function handleUberReturn() {
  const params = new URLSearchParams(window.location.search);
  const uber = params.get('uber');
  if (!uber) return;
  if (uber === 'connected') {
    window.setTimeout(syncUber, 100);
  } else {
    setUberStatus(`Não foi possível conectar a Uber (${uber}).`);
  }
  history.replaceState({}, '', window.location.pathname + window.location.hash);
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(injectUberCard);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', () => { injectUberCard(); handleUberReturn(); });
}

if (typeof module !== 'undefined') module.exports = { buildUberAuthorizeUrl, UBER_SCOPE };
