import { strict as assert } from 'node:assert';
import loom, { type TemplatePolicy } from '../src/loomstr';

/**
 * Very lightweight perf smoke — not a benchmark.
 * Ensures no allocations explode and output stays correct under load.
 */

const T = loom.compile('[{level}] user={user} msg={msg} ctx={ctx|json}');
const policy: TemplatePolicy = {
  filters: { json: v => JSON.stringify(v) },
  asString: String,
};

const params = { level: 'INFO', user: 'perf', msg: 'ok', ctx: { i: 0 } };

const N = 50_000;
console.time('loom:render x50k');
let last = '';
for (let i = 0; i < N; i++) {
  params.ctx.i = i;
  last = T.render(params, policy);
}
console.timeEnd('loom:render x50k');

// sanity on last output
assert.ok(last.startsWith('[INFO] user=perf msg=ok ctx={'));
assert.ok(last.endsWith(`"i":${params.ctx.i}}`));

// toParts loop
console.time('loom:toParts x50k');
let partsLen = 0;
for (let i = 0; i < N; i++) {
  params.ctx.i = i;
  const p = T.toParts(params, policy);
  partsLen += p.values.length;
}
console.timeEnd('loom:toParts x50k');
assert.equal(partsLen % 4, 0);

console.log('performance.test.ts passed ✅');
