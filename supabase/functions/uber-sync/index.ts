import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshToken(connection: any, db: any) {
  if (!connection.refresh_token) return connection.access_token;
  const expiresSoon = !connection.expires_at || new Date(connection.expires_at).getTime() < Date.now() + 60_000;
  if (!expiresSoon) return connection.access_token;

  const clientId = Deno.env.get('UBER_CLIENT_ID');
  const clientSecret = Deno.env.get('UBER_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Uber client credentials not configured');

  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: connection.refresh_token });
  const response = await fetch('https://auth.uber.com/oauth/v2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new Error(`Uber token refresh failed: ${response.status}`);
  const token = await response.json();

  const updated = {
    access_token: token.access_token,
    refresh_token: token.refresh_token || connection.refresh_token,
    expires_at: new Date(Date.now() + Number(token.expires_in || 0) * 1000).toISOString(),
    scope: token.scope || connection.scope,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from('uber_connections').update(updated).eq('id', connection.id);
  if (error) throw error;
  return updated.access_token;
}

async function getPaged(url: URL, token: string, key: 'trips' | 'payments') {
  const result: any[] = [];
  let offset = 0;
  while (true) {
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('limit', '50');
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Uber ${key} request failed: ${response.status}`);
    const payload = await response.json();
    result.push(...(payload[key] || []));
    if (result.length >= Number(payload.count || result.length) || !(payload[key] || []).length) break;
    offset += 50;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase service credentials not configured');

    const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: connection, error } = await db.from('uber_connections').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!connection) return new Response(JSON.stringify({ connected: false, trips: [], payments: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const token = await refreshToken(connection, db);
    const now = Math.floor(Date.now() / 1000);
    const from = now - 30 * 24 * 60 * 60;

    const tripsUrl = new URL('https://api.uber.com/v1/partners/trips');
    tripsUrl.searchParams.set('from_time', String(from));
    tripsUrl.searchParams.set('to_time', String(now));
    const trips = await getPaged(tripsUrl, token, 'trips');

    // Uber limits payment queries to 10-day windows, so request three windows.
    const payments: any[] = [];
    for (let end = now; end > from; end -= 10 * 24 * 60 * 60) {
      const start = Math.max(from, end - 10 * 24 * 60 * 60);
      const paymentsUrl = new URL('https://api.uber.com/v1/partners/payments');
      paymentsUrl.searchParams.set('from_time', String(start));
      paymentsUrl.searchParams.set('to_time', String(end));
      payments.push(...await getPaged(paymentsUrl, token, 'payments'));
    }

    return new Response(JSON.stringify({ connected: true, synced_at: new Date().toISOString(), trips, payments }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'uber_sync_failed', message: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
