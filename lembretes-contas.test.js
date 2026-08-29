const assert=require('node:assert/strict');
const {dueLabel,upcoming}=require('./lembretes-contas-core.js');
assert.equal(dueLabel('2026-08-29','2026-08-29'),'hoje');
assert.equal(dueLabel('2026-08-30','2026-08-29'),'amanhã');
assert.equal(dueLabel('2026-09-05','2026-08-29'),'em 7 dias');
assert.equal(upcoming([{id:'1',tipo:'IPVA',data:'2026-08-30',paga:false}], '2026-08-29').length,1);
assert.equal(upcoming([{id:'1',tipo:'IPVA',data:'2026-09-10',paga:false}], '2026-08-29').length,0);
console.log('lembretes: ok');
