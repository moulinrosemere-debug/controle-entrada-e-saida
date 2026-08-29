import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
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
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const redirectUri = Deno.env.get('UBER_REDIRECT_URI') || `${requestUrl.origin}${requestUrl.pathname}`;
  const appUrl = Deno.env.get('LOPES_TUR_APP_URL') || 'https://moulinrosemere-debug.github.io/controle-entrada-e-saida/';

  if (!clientId || !clientSecret || !stateSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'uber_not_configured', message: 'Configure os Secrets da integração Uber no Supabase.' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const code = requestUrl.searchParams.get('code');
  const returnedState = requestUrl.searchParams.get('state');

  if (!code) {
    const state = randomState();
    const signature = await signState(state, stateSecret);
    const authUrl = new URL('https://auth.uber.com/oauth/v2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    return redirect(authUrl.toString(), `uber_oauth_state=${encodeURIComponent(`${state}.${signature}`)}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`);
  }

  const cookie = getCookie(req, 'uber_oauth_state') || '';
  const [cookieState, cookieSignature] = cookie.split('.');
  const validState = Boolean(returnedState && cookieState && cookieSignature && returnedState === cookieState && cookieSignature === await signState(returnedState, stateSecret));
  if (!validState) return redirect(`${appUrl}?uber=invalid_state`);

  const tokenBody = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', redirect_uri: redirectUri, code });
  const tokenResponse = await fetch('https://auth.uber.com/oauth/v2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: tokenBody });
  if (!tokenResponse.ok) return redirect(`${appUrl}?uber=token_error`);

  const token = await tokenResponse.json();
  const profileResponse = await fetch('https://api.uber.com/v1/partners/me', { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!profileResponse.ok) return redirect(`${appUrl}?uber=profile_error`);
  const profile = await profileResponse.json();

  const { error } = await db.from('uber_connections').upsert({
    driver_id: profile.driver_id,
    access_token: token.access_token,
    refresh_token: token.refresh_token || null,
    expires_at: new Date(Date.now() + Number(token.expires_in || 0) * 1000).toISOString(),
    scope: token.scope || scopes,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'driver_id' });

  if (error) {
    console.error('Failed to store Uber connection', error);
    return redirect(`${appUrl}?uber=storage_error`);
  }

  return redirect(`${appUrl}?uber=connected`);
});
