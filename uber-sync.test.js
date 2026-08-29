const { buildUberAuthorizeUrl, UBER_SCOPE } = require('./uber-sync.js');

const testUrl = buildUberAuthorizeUrl({
  clientId: 'test-client',
  redirectUri: 'https://example.supabase.co/functions/v1/uber-auth',
  state: 'test-state'
});

if (!testUrl.includes('client_id=test-client')) throw new Error('client_id missing');
if (!testUrl.includes('response_type=code')) throw new Error('response_type missing');
if (!testUrl.includes('partner.trips')) throw new Error('partner.trips missing');
if (!testUrl.includes('partner.payments')) throw new Error('partner.payments missing');
if (!testUrl.includes('state=test-state')) throw new Error('state missing');
if (UBER_SCOPE !== 'partner.accounts partner.trips partner.payments') throw new Error('scope contract changed');

console.log('Uber OAuth contract tests passed.');
