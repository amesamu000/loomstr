import { strict as assert } from 'node:assert';
import loom, { type TemplatePolicy } from '../src/loomstr';

/** Helper to build a sink for formatTo */
function makeSink() {
  let buf = '';
  return {
    text(s: string) {
      buf += s;
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

/* ================================================================
 * 1) compile + render + built-in filters
 * ================================================================ */

{
  const T = loom.compile('[{level}] user={user|upper} msg={msg} n={n|fixed#2}');
  const out = T.render(
    { level: 'INFO', user: 'megalith', msg: 'ok', n: 9.756 },
    { asString: String }
  );
  assert.equal(out, '[INFO] user=MEGALITH msg=ok n=9.76');
}

{
  const policy = { asString: String };
  const data = { a: 1, b: { c: 2 } };

  const compact = loom.compile('ctx={ctx|json}');
  assert.equal(compact.render({ ctx: data }, policy), `ctx=${JSON.stringify(data)}`);

  const pretty4 = loom.compile('ctx={ctx|json#4}');
  assert.equal(
    pretty4.render({ ctx: data }, policy),
    `ctx=${JSON.stringify(data, null, 4)}`
  );
}

/* ================================================================
 * 1.5) Built-in path filter testing
 * ================================================================ */

{
  const policy = { asString: String };

  // Test array index access
  const arrayTemplate = loom.compile('first={items|path#0} second={items|path#1.name}');
  const arrayData = {
    items: ['apple', { name: 'orange', color: 'orange' }],
  };
  const arrayResult = arrayTemplate.render(arrayData, policy);
  assert.equal(arrayResult, 'first=apple second=orange');

  // Test object property access
  const objTemplate = loom.compile('name={user|path#profile.name} age={user|path#profile.age}');
  const objData = {
    user: {
      profile: {
        name: 'John',
        age: 30,
      },
    },
  };
  const objResult = objTemplate.render(objData, policy);
  assert.equal(objResult, 'name=John age=30');

  // Test deep nested access
  const deepTemplate = loom.compile('title={data|path#items.0.title}');
  const deepData = {
    data: {
      items: [{ title: 'world' }],
    },
  };
  const deepResult = deepTemplate.render(deepData, policy);
  assert.equal(deepResult, 'title=world');

  // Test null/undefined handling
  const nullTemplate = loom.compile('missing={obj|path#missing.prop} fallback={obj|path#missing.prop,"unknown"}');
  const nullResult = nullTemplate.render({ obj: {} }, policy);
  assert.equal(nullResult, 'missing= fallback=unknown');

  // Test error on empty path
  const emptyPathTemplate = loom.compile('bad={obj|path}');
  assert.throws(
    () => emptyPathTemplate.render({ obj: {} }, policy),
    /path: missing property path argument/
  );
}

/* ================================================================
 * 2) custom json filter + toParts + toPartsRaw
 * ================================================================ */

{
  const T = loom.compile('ctx={ctx|json}');
  const policy: TemplatePolicy = { filters: { json: v => JSON.stringify(v) }, asString: String };

  const s1 = T.render({ ctx: { ip: '127.0.0.1' } }, policy);
  assert.equal(s1, `ctx={"ip":"127.0.0.1"}`);

  const parts = T.toParts({ ctx: { a: 1 } }, policy);
  assert.deepEqual(parts.chunks, ['ctx=']); // chunks = slots.length + 1
  assert.equal(parts.values[0], `{"a":1}`);

  const raw = T.toPartsRaw({ ctx: { a: 1 } });
  assert.equal(typeof raw.values[0], 'object'); // still object, not stringified
}

/* ================================================================
 * 3) missing value / unknown filter errors
 * ================================================================ */

{
  const T = loom.compile('a={a} b={b}');
  // missing 'b'
  assert.throws(
    () => T.render({ a: 1 } as any, { asString: String }),
    /Missing value for slot "b"/
  );

  // unknown filter
  const U = loom.compile('x={x|nope}');
  assert.throws(() => U.render({ x: 1 }, { asString: String }), /Unknown filter "nope"/);
}

/* ================================================================
 * 4) tryRender: ok + error
 * ================================================================ */

{
  const T = loom.compile('v={v}');
  const ok = loom.tryRender(T, { v: 1 }, { asString: String });
  assert.equal(ok.ok, true);
  assert.equal((ok as any).value, 'v=1');

  const bad = loom.tryRender(T, {} as any, { asString: String });
  assert.equal(bad.ok, false);
  assert.match((bad as any).error.message, /Missing value for slot "v"/);
}

/* ================================================================
 * 5) formatTo basic
 * ================================================================ */

{
  const T = loom.compile('[{l}] {m}');
  const sink = makeSink();
  loom.formatTo(T, { l: 'INFO', m: 'ok' }, { asString: String }, sink);
  assert.equal(sink.toString(), '[INFO] ok');
}

/* ================================================================
 * 6) compile-time negatives (must NOT run)
 * ================================================================ */

{
  const T = loom.compile('[{level}] user={user} msg={msg} ctx={ctx|json}');
  const policy: TemplatePolicy = { filters: { json: v => JSON.stringify(v) }, asString: String };

  if (false as boolean) {
    // @ts-expect-error missing ctx
    T.render({ level: 'INFO', user: 'x', msg: 'ok' }, policy);
    // @ts-expect-error extra key
    T.render({ level: 'INFO', user: 'x', msg: 'ok', ctx: {}, extra: 1 }, policy);
  }
}

console.log('unit.test.ts passed ✅');
