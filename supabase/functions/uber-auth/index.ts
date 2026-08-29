import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const scopes = 'partner.accounts partner.trips partner.payments';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function base64url(bytes: Uint8Array) {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function signState(state: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(state))));
}

function getCookie(req: Request, name: string) {
  const cookies = req.headers.get('cookie') || '';
  const item = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function redirect(url: string, cookie?: string) {
  const headers = new Headers({ Location: url });
  if (cookie) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const requestUrl = new URL(req.url);
  const clientId = Deno.env.get('UBER_CLIENT_ID');
  const clientSecret = Deno.env.get('UBER_CLIENT_SECRET');
  const stateSecret = Deno.env.get('UBER_STATE_SECRET');
  const redirectUri = Deno.env.get('UBER_REDIRECT_URI') || `${requestUrl.origin}${requestUrl.pathname}`;
  const appUrl = Deno.env.get('LOPES_TUR_APP_URL') || 'https://moulinrosemere-debug.github.io/controle-entrada-e-saida/';

  if (!clientId || !clientSecret || !stateSecret) {
    return new Response(JSON.stringify({
      error: 'uber_not_configured',
      message: 'Configure UBER_CLIENT_ID, UBER_CLIENT_SECRET e UBER_STATE_SECRET nos Secrets da Edge Function.',
    }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const code = requestUrl.searchParams.get('code');
  const returnedState = requestUrl.searchParams.get('state');

  // First request: create OAuth state and send the driver to Uber.
  if (!code) {
    const state = randomState();
    const signature = await signState(state, stateSecret);
    const authUrl = new URL('https://login.uber.com/oauth/v2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    return redirect(authUrl.toString(), `uber_oauth_state=${encodeURIComponent(`${state}.${signature}`)}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`);
  }

  // Callback: validate the OAuth state before exchanging the code.
  const cookie = getCookie(req, 'uber_oauth_state') || '';
  const [cookieState, cookieSignature] = cookie.split('.');
  const validState = Boolean(returnedState && cookieState && cookieSignature && returnedState === cookieState && cookieSignature === await signState(returnedState, stateSecret));

  if (!validState) return redirect(`${appUrl}?uber=invalid_state`);

  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });

  const tokenResponse = await fetch('https://login.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody,
  });

  if (!tokenResponse.ok) return redirect(`${appUrl}?uber=token_error`);

  const token = await tokenResponse.json();

  // Never send access/refresh tokens to the browser.
  // The next deployment step will persist these values in a protected table and
  // use the refresh token for automatic trip/payment synchronization.
  console.log('Uber OAuth completed', {
    expires_in: token.expires_in,
    scope: token.scope,
    has_refresh_token: Boolean(token.refresh_token),
  });

  return redirect(`${appUrl}?uber=connected`);
});
