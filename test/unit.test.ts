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
 * 1.6) Built-in map and join filter testing
 * ================================================================ */

{
  const policy = { asString: String };

  // Test basic map functionality with automatic join
  const mapTemplate = loom.compile('items={items|map#item => - $item.title$ x$item.qty$\\n,}');
  const mapData = {
    items: [
      { title: 'Apple', qty: 5 },
      { title: 'Orange', qty: 3 },
      { title: 'Banana', qty: 8 },
    ],
  };
  const mapResult = mapTemplate.render(mapData as any, policy);
  assert.equal(mapResult, 'items=- Apple x5\n- Orange x3\n- Banana x8\n');

  // Test map with join separator
  const listTemplate = loom.compile('list={names|map#name => $name$, }');
  const listData = { names: ['Alice', 'Bob', 'Charlie'] };
  const listResult = listTemplate.render(listData as any, policy);
  assert.equal(listResult, 'list=Alice, Bob, Charlie');

  // Test map with nested property access and pipe separator
  const nestedTemplate = loom.compile('users={users|map#user => $user.profile.name$, | }');
  const nestedData = {
    users: [
      { profile: { name: 'John' } },
      { profile: { name: 'Jane' } },
      { profile: { name: 'Bob' } },
    ],
  };
  const nestedResult = nestedTemplate.render(nestedData as any, policy);
  assert.equal(nestedResult, 'users=John | Jane | Bob');

  // Test map returning array (no join argument)
  const arrayTemplate = loom.compile('items={items|map#item => $item$}');
  const arrayResult = arrayTemplate.render({ items: ['a', 'b', 'c'] }, policy);
  assert.equal(arrayResult, 'items=a,b,c'); // Default array-to-string conversion

  // Test map error cases
  const mapErrors = loom.compile('bad={items|map}');
  assert.throws(
    () => mapErrors.render({ items: [] }, policy),
    /map: missing template expression argument/
  );

  const mapNoArrow = loom.compile('bad={items|map#item}');
  assert.throws(
    () => mapNoArrow.render({ items: [] }, policy),
    /map: template expression must use => syntax/
  );

  const mapNotArray = loom.compile('bad={notarray|map#item => $item$}');
  assert.throws(
    () => mapNotArray.render({ notarray: 'string' }, policy),
    /map: value must be an array/
  );

  // Test join error cases
  const joinNotArray = loom.compile('bad={notarray|join}');
  assert.throws(
    () => joinNotArray.render({ notarray: 'string' }, policy),
    /join: value must be an array/
  );

  // Test simple join without map
  const simpleJoin = loom.compile('nums={numbers|join#-}');
  const joinResult = simpleJoin.render({ numbers: [1, 2, 3, 4] }, policy);
  assert.equal(joinResult, 'nums=1-2-3-4');
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
