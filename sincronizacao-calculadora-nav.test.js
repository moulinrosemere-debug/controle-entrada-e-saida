const fs = require('fs');
const source = fs.readFileSync('sincronizacao-v3.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Regression: opening the calculator must survive the async initial sync and Realtime updates.
assert(source.includes('const calculatorOpen=()=>'), 'Calculator-view guard is missing.');
assert(source.includes('const refreshVisibleView=()=>'), 'Visible-view refresh helper is missing.');
assert(source.includes('if(calculatorOpen())'), 'Sync does not check whether Calculator KM is open.');
assert(!source.includes('location.reload()'), 'Sync still forces a full page reload.');

console.log('PASS: synchronization preserves the Calculator KM view.');
