const UBER_AUTH_ENDPOINT = '/functions/v1/uber-auth';
const UBER_SCOPE = 'partner.accounts partner.trips partner.payments';

function buildUberAuthorizeUrl({ clientId, redirectUri, state }) {
  const url = new URL('https://login.uber.com/oauth/v2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', UBER_SCOPE);
  url.searchParams.set('state', state);
  return url.toString();
}

function supabaseFunctionUrl() {
  const explicit = window.LOPES_TUR_UBER_FUNCTION_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const host = window.LOPES_TUR_SUPABASE_URL;
  if (host) return host.replace(/\/$/, '') + UBER_AUTH_ENDPOINT;
  return null;
}

function uberCard() {
  return `<section class="card" id="uberIntegrationCard" style="margin-top:16px">
    <div class="section-head"><div><h3>🚗 Uber</h3><p class="hint">Conecte sua conta para sincronizar viagens e ganhos automaticamente.</p></div></div>
    <button class="button" id="connectUberButton">Conectar Uber</button>
    <p class="hint" id="uberIntegrationStatus" style="margin-top:10px">Ainda não conectada.</p>
  </section>`;
}

function injectUberCard() {
  if (document.querySelector('#uberIntegrationCard')) return;
  const target = document.querySelector('#app');
  if (!target) return;
  const card = document.createElement('div');
  card.innerHTML = uberCard();
  target.appendChild(card.firstElementChild);
  document.querySelector('#connectUberButton').onclick = () => {
    const endpoint = supabaseFunctionUrl();
    if (!endpoint) {
      document.querySelector('#uberIntegrationStatus').textContent = 'A integração ainda precisa ser configurada no Supabase.';
      return;
    }
    document.querySelector('#uberIntegrationStatus').textContent = 'Abrindo autorização da Uber...';
    window.location.href = endpoint;
  };
}

function handleUberReturn() {
  const params = new URLSearchParams(window.location.search);
  const uber = params.get('uber');
  if (!uber) return;
  const status = uber === 'connected' ? 'Uber conectada. A sincronização poderá ser feita automaticamente.' : `Não foi possível conectar a Uber (${uber}).`;
  window.setTimeout(() => alert(status), 50);
  history.replaceState({}, '', window.location.pathname + window.location.hash);
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(injectUberCard);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', () => { injectUberCard(); handleUberReturn(); });
}

if (typeof module !== 'undefined') module.exports = { buildUberAuthorizeUrl, UBER_SCOPE };
