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

/* ================================================================
 * 1) end-to-end render with policy (json) + meta helpers
 * ================================================================ */

const T = loom.compile('[{level}] user={user} msg={msg} ctx={ctx|json}');
const logPolicy: TemplatePolicy = {
  filters: { json: v => JSON.stringify(v) },
  asString: String,
};

type RenderParams = Parameters<typeof T.render>[0];
const data: RenderParams = { level: 'INFO', user: 'megalith', msg: 'ok', ctx: { ip: '127.0.0.1' } };

const out = T.render(data, logPolicy);
assert.equal(out, `[INFO] user=megalith msg=ok ctx={"ip":"127.0.0.1"}`);

const names = loom.slotNames(T);
assert.deepEqual(names, ['level', 'user', 'msg', 'ctx']);
assert.equal(loom.hasSlot(T, 'user'), true);
assert.equal(loom.hasSlot(T, 'nope'), false);

/* ================================================================
 * 2) validate / missingKeys / extraKeys
 * ================================================================ */

const badParams = { level: 'INFO', user: 'x', msg: 'ok', extra: 1 } as const;
assert.deepEqual(loom.missingKeys(T, badParams), ['ctx']);
assert.deepEqual(loom.extraKeys(T, badParams), ['extra']);
assert.deepEqual(loom.validate(T, badParams), { ok: false, missing: ['ctx'], extra: ['extra'] });

/* ================================================================
 * 3) concat + formatTo
 * ================================================================ */

const P1 = loom.compile('[INFO] ');
const P2 = loom.compile('id={id|pad#3,0} ok={ok}');
const P = loom.concat(P1, P2);

JSON.stringify({}, null, 2); //?

const sink = makeSink();
loom.formatTo(P, { id: 7, ok: true }, { asString: String }, sink);
assert.equal(sink.toString(), '[INFO] id=700 ok=true');

/* ================================================================
 * 4) bind + withDefaultPolicy
 * ================================================================ */

const Base = loom.compile('[{level}] u={user} m={msg}');
const Bound = loom.bind(Base, { level: 'INFO' });

const boundOut = Bound.render({ user: 'e', msg: 'ok' }, { asString: String });
assert.equal(boundOut, '[INFO] u=e m=ok');

// bind with default policy (json) and render
const T2 = loom.compile('ctx={ctx|json}');
const BoundJson = loom.bind(
  T2,
  {},
  { filters: { json: v => JSON.stringify(v) }, asString: String }
);
const bOut = BoundJson.render({ ctx: { ip: 'x' } });
assert.equal(bOut, `ctx={"ip":"x"}`);

// withDefaultPolicy attaches a default policy (params still required)
const TD = loom.withDefaultPolicy(T, logPolicy);
// Cast to any to call render directly on the bound wrapper
const wdpOut = (TD as any).render(data);
assert.equal(wdpOut, `[INFO] user=megalith msg=ok ctx={"ip":"127.0.0.1"}`);

/* ================================================================
 * 5) security / transform (redaction)
 * ================================================================ */

const secPolicy: TemplatePolicy = {
  filters: { json: v => JSON.stringify(v), redact: () => '██' },
  asString: String,
  transform: (slot, value) => (slot.name === 'user' ? '██' : value),
};
const redacted = T.render({ ...data, user: 'anything' }, secPolicy);
assert.equal(redacted, `[INFO] user=██ msg=ok ctx={"ip":"127.0.0.1"}`);

/* ================================================================
 * 6) path filter integration testing
 * ================================================================ */

{
  // E-commerce product display with path filter
  const productTemplate = loom.compile('Product: {product|path#name}, Price: {product|path#price.amount}');
  const productData = {
    product: {
      name: 'Headphones',
      price: { amount: '99.99' }
    }
  };
  
  const result = productTemplate.render(productData as any, { asString: String });
  assert.equal(result, 'Product: Headphones, Price: 99.99');

  // Nested array access
  const arrayTemplate = loom.compile('First item: {data|path#items.0.name}');
  const arrayData = {
    data: {
      items: [{ name: 'apple' }, { name: 'banana' }]
    }
  };
  
  const arrayResult = arrayTemplate.render(arrayData as any, { asString: String });
  assert.equal(arrayResult, 'First item: apple');
}

/* ================================================================
 * 7) map and join filter integration testing
 * ================================================================ */

{
  // E-commerce shopping cart summary
  const cartTemplate = loom.compile(
    'Cart Summary:\n{items|map#item => - $item.name$: $item.price$ x $item.quantity$\n|join}\nTotal items: {totalItems}'
  );
  
  const cartData = {
    items: [
      { name: 'Laptop', price: '$999', quantity: 1 },
      { name: 'Mouse', price: '$25', quantity: 2 },
      { name: 'Keyboard', price: '$75', quantity: 1 }
    ],
    totalItems: 4
  };
  
  const cartResult = cartTemplate.render(cartData as any, { asString: String });
  const expectedCart = `Cart Summary:
- Laptop: $999 x 1
- Mouse: $25 x 2
- Keyboard: $75 x 1
Total items: 4`;
  assert.equal(cartResult, expectedCart);

  // API response formatting for user list
  const userListTemplate = loom.compile('Users: {users|map#user => $user.firstName$ $user.lastName$|join#, }');
  const userListData = {
    users: [
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'Jane', lastName: 'Smith' },
      { firstName: 'Bob', lastName: 'Johnson' }
    ]
  };
  
  const userListResult = userListTemplate.render(userListData as any, { asString: String });
  assert.equal(userListResult, 'Users: John Doe, Jane Smith, Bob Johnson');

  // Log formatting with structured data
  const logTemplate = loom.compile('[{timestamp}] {level}: {events|map#event => $event.type$($event.value$)|join# | }');
  const logData = {
    timestamp: '2025-09-20T10:30:00Z',
    level: 'INFO',
    events: [
      { type: 'click', value: 'button1' },
      { type: 'scroll', value: '50%' },
      { type: 'hover', value: 'menu' }
    ]
  };
  
  const logResult = logTemplate.render(logData as any, { asString: String });
  assert.equal(logResult, '[2025-09-20T10:30:00Z] INFO: click(button1) | scroll(50%) | hover(menu)');

  // Simple tag list with HTML-like output
  const tagTemplate = loom.compile('Tags: {tags|map#tag => <span>$tag$</span>|join}');
  const tagData = { tags: ['JavaScript', 'TypeScript', 'React'] };
  
  const tagResult = tagTemplate.render(tagData as any, { asString: String });
  assert.equal(tagResult, 'Tags: <span>JavaScript</span><span>TypeScript</span><span>React</span>');
}

console.log('integration.test.ts passed ✅');
