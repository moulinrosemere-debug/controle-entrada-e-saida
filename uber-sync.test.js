// TDD contract for the Uber integration UI.
// This file documents the pure behavior expected from uber-sync.js.
function buildUberAuthorizeUrl({clientId, redirectUri, state}) {
  const url = new URL('https://login.uber.com/oauth/v2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'partner.accounts partner.trips partner.payments');
  url.searchParams.set('state', state);
  return url.toString();
}

const testUrl = buildUberAuthorizeUrl({
  clientId: 'test-client',
  redirectUri: 'https://example.supabase.co/functions/v1/uber-auth',
  state: 'test-state'
});

if (!testUrl.includes('client_id=test-client')) throw new Error('client_id missing');
if (!testUrl.includes('response_type=code')) throw new Error('response_type missing');
if (!testUrl.includes('partner.trips')) throw new Error('partner.trips scope missing');
if (!testUrl.includes('partner.payments')) throw new Error('partner.payments scope missing');
if (!testUrl.includes('state=test-state')) throw new Error('state missing');

console.log('Uber OAuth contract tests passed.');
