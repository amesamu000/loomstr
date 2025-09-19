import { strict as assert } from 'node:assert';
import loom, { type TemplatePolicy } from '../src/loomstr';

// sink for formatTo()
function makeSink() {
  let buf = '';
  return {
    text(chunk: string) {
      buf += chunk;
    },
    value(v: string) {
      buf += v;
    },
    toString() {
      return buf;
    },
    reset() {
      buf = '';
    },
  };
}

/* ------------------------------------------------------------------ */
/* 1) compile + render with custom policy (json)                       */
/* ------------------------------------------------------------------ */

const T = loom.compile('[{level}] user={user} msg={msg} ctx={ctx|json}');

const logPolicy: TemplatePolicy = {
  // WRAP JSON.stringify so it matches FilterFn
  filters: { json: (v: unknown) => JSON.stringify(v) },
  asString: String,
};

type RenderParams = Parameters<typeof T.render>[0];
const data: RenderParams = {
  level: 'INFO',
  user: 'megalith',
  msg: 'ok',
  ctx: { ip: '127.0.0.1' },
};

const out = T.render(data, logPolicy);
assert.equal(out, `[INFO] user=megalith msg=ok ctx={"ip":"127.0.0.1"}`);

/* ------------------------------------------------------------------ */
/* 2) transform hook (redaction) + render                              */
/* ------------------------------------------------------------------ */

const secPolicy: TemplatePolicy = {
  filters: { json: (v: unknown) => JSON.stringify(v), redact: () => '██' },
  asString: String,
  transform: (slot, value) => (slot.name === 'user' ? '██' : value),
};

const redacted = T.render({ ...data, user: 'anything' }, secPolicy);
assert.equal(redacted, `[INFO] user=██ msg=ok ctx={"ip":"127.0.0.1"}`);

/* ------------------------------------------------------------------ */
/* 3) toParts + toPartsRaw                                            */
/* ------------------------------------------------------------------ */

const parts = T.toParts({ level: 'INFO', user: 'x', msg: 'ok', ctx: { a: 1 } }, logPolicy);
assert.equal(parts.chunks.length, parts.slots.length);
assert.deepEqual(
  parts.slots.map(s => s.name),
  ['level', 'user', 'msg', 'ctx']
);
assert.equal(parts.values.length, 4);
assert.equal(String(parts.values[3]), `{"a":1}`);

const raw = T.toPartsRaw({ level: 'INFO', user: 'x', msg: 'ok', ctx: { a: 1 } });
assert.equal(typeof raw.values[3], 'object'); // still object here
assert.equal(parts.chunks[0], '[');

/* ------------------------------------------------------------------ */
/* 4) concat                                                          */
/* ------------------------------------------------------------------ */

const P1 = loom.compile('[INFO] ');
const P2 = loom.compile('id={id|pad#3,0} ok={ok}');
const combined = loom.concat(P1, P2);
const combinedOut = combined.render({ id: 7, ok: true });
assert.equal(combinedOut, '[INFO] id=700 ok=true');

/* ------------------------------------------------------------------ */
/* 5) meta helpers: slotNames / hasSlot                               */
/* ------------------------------------------------------------------ */

const names = loom.slotNames(T);
assert.deepEqual(names, ['level', 'user', 'msg', 'ctx']);
assert.equal(loom.hasSlot(T, 'user'), true);
assert.equal(loom.hasSlot(T, 'nope'), false);

/* ------------------------------------------------------------------ */
/* 6) validate / missingKeys / extraKeys (runtime checks)             */
/* ------------------------------------------------------------------ */

const badParams = { level: 'INFO', user: 'x', msg: 'ok', extra: 1 } as const;
const missing = loom.missingKeys(T, badParams);
const extra = loom.extraKeys(T, badParams);
const v = loom.validate(T, badParams);

assert.deepEqual(missing, ['ctx']);
assert.deepEqual(extra, ['extra']);
assert.equal(v.ok, false);
assert.deepEqual(v.missing, ['ctx']);
assert.deepEqual(v.extra, ['extra']);

/* ------------------------------------------------------------------ */
/* 7) tryRender (success + failure)                                   */
/* ------------------------------------------------------------------ */

const okTry = loom.tryRender(T, data, logPolicy);
assert.equal(okTry.ok, true);
assert.equal((okTry as any).value, `[INFO] user=megalith msg=ok ctx={"ip":"127.0.0.1"}`);

const badTry = loom.tryRender(T, { level: 'INFO', user: 'x', msg: 'ok' } as any, logPolicy);
assert.equal(badTry.ok, false);
assert.match((badTry as any).error.message, /Missing value for slot "ctx"/);

/* ------------------------------------------------------------------ */
/* 8) formatTo                                                        */
/* ------------------------------------------------------------------ */

const sink = makeSink();
loom.formatTo(T, data, logPolicy, sink);
assert.equal(sink.toString(), `[INFO] user=megalith msg=ok ctx={"ip":"127.0.0.1"}`);
sink.reset();

/* ------------------------------------------------------------------ */
/* 9) bind (pre-bind some params)                                     */
/* ------------------------------------------------------------------ */

const Bound = loom.bind(loom.compile('[{level}] u={user} m={msg}'), { level: 'INFO' });
const boundOut = Bound.render({ user: 'e', msg: 'ok' }, { asString: String });
assert.equal(boundOut, '[INFO] u=e m=ok');

// bind with default policy (json) and render (provide ctx!)
const T2 = loom.compile('ctx={ctx|json}');
const BoundJson = loom.bind(
  T2,
  {},
  { filters: { json: (v: unknown) => JSON.stringify(v) }, asString: String }
);
const bOut = BoundJson.render({ ctx: { ip: 'x' } });
assert.equal(bOut, `ctx={"ip":"x"}`);

/* ------------------------------------------------------------------ */
/* 10) withDefaultPolicy (default policy only; still pass params)     */
/* ------------------------------------------------------------------ */

const TD = loom.withDefaultPolicy(T, logPolicy);
const wdpOut = (TD as any).render(data);
assert.equal(wdpOut, `[INFO] user=megalith msg=ok ctx={"ip":"127.0.0.1"}`);

/* ------------------------------------------------------------------ */
/* 11) negative compile-time tests (MUST NOT RUN)                     */
/* ------------------------------------------------------------------ */
if (false as boolean) {
  // @ts-expect-error missing ctx
  T.render({ level: 'INFO', user: 'x', msg: 'ok' }, logPolicy);
  // @ts-expect-error extra key
  T.render({ level: 'INFO', user: 'x', msg: 'ok', ctx: {}, extra: 1 }, logPolicy);

  T.render({ level: 123, user: 'x', msg: 'ok', ctx: {} }, logPolicy);
  // @ts-expect-error toParts missing msg
  T.toParts({ level: 'INFO', user: 'x', ctx: {} }, logPolicy);
}

console.log('All loomstr tests (node:assert) passed ✅');
