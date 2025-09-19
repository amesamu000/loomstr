import { strict as assert } from 'node:assert';
import loom, { type TemplatePolicy } from '../src/loomstr';
import { performance } from 'node:perf_hooks';

const T = loom.compile('[{level}] user={user} msg={msg} ctx={ctx|json}');
const policy: TemplatePolicy = {
  filters: { json: v => JSON.stringify(v) },
  asString: String,
};

const params = { level: 'INFO', user: 'perf', msg: 'ok', ctx: { i: 0 } };

const N = 50_000;

// loom:render x50k
const startRender = performance.now();
let last = '';
for (let i = 0; i < N; i++) {
  params.ctx.i = i;
  last = T.render(params, policy);
}
const endRender = performance.now();
console.log(`loom:render x50k took ${(endRender - startRender).toFixed(2)} ms`);

// sanity on last output
assert.ok(last.startsWith('[INFO] user=perf msg=ok ctx={'));
assert.ok(last.endsWith(`"i":${params.ctx.i}}`));

// loom:toParts x50k
const startParts = performance.now();
let partsLen = 0;
for (let i = 0; i < N; i++) {
  params.ctx.i = i;
  const p = T.toParts(params, policy);
  partsLen += p.values.length;
}
const endParts = performance.now();
console.log(`loom:toParts x50k took ${(endParts - startParts).toFixed(2)} ms`);
assert.equal(partsLen % 4, 0);

console.log('performance.test.ts passed ✅');
