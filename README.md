# Loomstr

Lightweight, type-safe template strings for TypeScript and modern JavaScript runtimes. Loomstr turns simple template literals into compiled renderers with first-class filter support, strong typing, and practical runtime utilities.

## Highlights
- Type-driven: templates remember their required params via `Template<S>` and `SlotKeys<S>`
- Zero-dependency runtime with a tiny API surface
- Built-in filters (`upper`, `lower`, `json`, `path`, `pad`, `fixed`) plus easy custom filters
- Filter arguments, quoting, and escaping handled by a fast character scanner
- Runtime helpers for validation, safe rendering, binding, and composition

## Installation

```bash
npm install loomstr
# yarn add loomstr
# pnpm add loomstr
# bun add loomstr
```

## Quick Start

```ts
import loom from 'loomstr';

const logTemplate = loom.compile('[{level}] user={user|upper} ctx={ctx|json#2}');

const rendered = logTemplate.render({
  level: 'INFO',
  user: 'megalith',
  ctx: { requestId: '42', path: '/healthz' },
});

// rendered → "[INFO] user=MEGALITH ctx={\n  \"requestId\": \"42\",\n  \"path\": \"/healthz\"\n}"

// Array processing with map and join
const arrayTemplate = loom.compile('Array: {arr|join#","}');
arrayTemplate.render({ arr: [1, 2, 3] }); // "Array: 1,2,3"

// Nested array mapping
const mapTemplate = loom.compile('Items: {items|map#item => $item.val$|join#"-"}');
const items = [{ val: 'a' }, { val: 'b' }];
mapTemplate.render({ items }); // "Items: a-b"
```

## Template Syntax

```
{name}                 basic slot
{name|filter}          apply a filter
{value|filter#arg1,arg2}  pass comma-separated arguments
{value|filter#'quoted',"args"}  arguments may be quoted and escaped
{value|filter1|filter2}  chain multiple filters in sequence
\{literal\}            use backslash to escape `{`, `}`, and `\`
```

Slots and filters are trimmed, so `{ name | upper }` is valid. Filter arguments keep internal spacing unless quoted. Multiple filters can be chained using the pipe (`|`) operator and are applied left-to-right.

## Built-in Filters

| Filter | Description | Examples |
| --- | --- | --- |
| `upper` | Uppercase string conversion | `{text|upper}` → `"HELLO"` |
| `lower` | Lowercase string conversion | `{text|lower}` → `"hello"` |
| `trim` | Remove whitespace from both ends | `{text|trim}` → `"hello"` (from `"  hello  "`) |
| `slice` | Extract substring with start/end positions | `{text|slice#6}`, `{text|slice#0,5}` |
| `wrap` | Wrap string with prefix and suffix | `{text|wrap#"[","]"}`→ `"[hello]"`, `{text|wrap#"*"}` → `"*hello*"` |
| `json` | JSON stringify with optional pretty-printing | `{data|json}`, `{data|json#2}` for 2-space indent |
| `path` | Deep object/array traversal with dot notation | `{user|path#profile.name}`, `{items|path#0.title}` |
| `pad` | Right-pad to specified length with fill character | `{id|pad#5,0}` → `"00042"`, `{text|pad#10," "}` |
| `fixed` | Format numbers to fixed decimal places | `{price|fixed#2}` → `"99.50"`, `{value|fixed#0}` |
| `map` | Transform array elements using template expressions | `{items|map#item => $item.name$: $item.price$}` |
| `join` | Join array elements with optional separator | `{array|join#", "}`, `{array|join}` (no separator) |

### Filter Chaining

Filters can be chained using the pipe (`|`) operator for powerful data transformations:

```ts
// Chain multiple string filters
const result = loom.compile('{text|trim|upper|wrap#">>>","<<<"}')
  .render({ text: '  hello  ' }); // ">>>HELLO<<<"

// Complex array processing with chaining
const list = loom.compile('{users|map#u => $u.name$|join#", "|upper}')
  .render({ users: [{name: 'alice'}, {name: 'bob'}] }); // "ALICE, BOB"

// Multi-step data transformation
const formatted = loom.compile('{items|map#item => [$item$]|join#" -> "|slice#0,20}')
  .render({ items: ['a', 'b', 'c'] }); // "[a] -> [b] -> [c]"
```

Custom filters are merged into the policy; built-ins remain available unless explicitly overwritten.

## Path Filter Examples

The `path` filter enables deep traversal of objects and arrays using dot notation:

```ts
// Array access
const template = loom.compile('First: {items|path#0}, Second: {items|path#1.name}');
const data = { 
  items: ['apple', { name: 'orange' }] 
};
template.render(data); // "First: apple, Second: orange"

// Object traversal
const userTemplate = loom.compile('User: {user|path#profile.name} ({user|path#profile.email})');
const userData = { 
  user: { 
    profile: { name: 'John Doe', email: 'john@example.com' } 
  } 
};
userTemplate.render(userData); // "User: John Doe (john@example.com)"

// Nested arrays and objects
const deepTemplate = loom.compile('Title: {data|path#articles.0.title}');
const deepData = { 
  data: { 
    articles: [{ title: 'Getting Started' }] 
  } 
};
deepTemplate.render(deepData); // "Title: Getting Started"
```

## New Filters Examples

### String Manipulation Filters

```ts
// trim: Remove whitespace
const trimTemplate = loom.compile('clean={text|trim}');
trimTemplate.render({ text: '  hello world  ' }); // "clean=hello world"

// slice: Extract substrings
const sliceTemplate = loom.compile('part={text|slice#6} first={text|slice#0,5}');
sliceTemplate.render({ text: 'hello world' }); // "part=world first=hello"

// wrap: Add prefix/suffix
const wrapTemplate = loom.compile('result={text|wrap#"[","]"}');
wrapTemplate.render({ text: 'content' }); // "result=[content]"

// wrap with same prefix/suffix
const starTemplate = loom.compile('result={text|wrap#"*"}');
starTemplate.render({ text: 'content' }); // "result=*content*"
```

### Array Processing Filters

```ts
// map: Transform array elements
const listTemplate = loom.compile('items={items|map#item => - $item.title$ ($item.qty$)\\n}');
const items = [
  { title: 'Apple', qty: 5 },
  { title: 'Orange', qty: 3 }
];
listTemplate.render({ items });
// Result: "items=- Apple (5)\n- Orange (3)\n"

// join: Combine array elements
const joinTemplate = loom.compile('list={names|join#", "}');
joinTemplate.render({ names: ['Alice', 'Bob', 'Charlie'] });
// Result: "list=Alice, Bob, Charlie"
```

### Real-World Examples

#### E-commerce Applications

```ts
// Shopping cart summary
const cartTemplate = loom.compile(`
Cart Summary:
{items|map#item => - $item.name$: $item.price$ x $item.quantity$|join#\n}
Total items: {totalItems}
`);

const cartData = {
  items: [
    { name: 'Laptop', price: '$999', quantity: 1 },
    { name: 'Mouse', price: '$25', quantity: 2 },
    { name: 'Keyboard', price: '$75', quantity: 1 }
  ],
  totalItems: 4
};

// Output:
// Cart Summary:
// - Laptop: $999 x 1
// - Mouse: $25 x 2  
// - Keyboard: $75 x 1
// Total items: 4
```

#### API Response Formatting

```ts
// User list for API responses
const userListTemplate = loom.compile('Users: {users|map#user => $user.firstName$ $user.lastName$|join#", "}');
const userListData = {
  users: [
    { firstName: 'John', lastName: 'Doe' },
    { firstName: 'Jane', lastName: 'Smith' },
    { firstName: 'Bob', lastName: 'Johnson' }
  ]
};
// Output: "Users: John Doe, Jane Smith, Bob Johnson"
```

#### Structured Logging

```ts
// Advanced log formatting with event tracking
const logTemplate = loom.compile('[{timestamp}] {level}: {events|map#event => $event.type$($event.value$)|join#" | "}');
const logData = {
  timestamp: '2025-09-20T10:30:00Z',
  level: 'INFO',
  events: [
    { type: 'click', value: 'button1' },
    { type: 'scroll', value: '50%' },
    { type: 'hover', value: 'menu' }
  ]
};
// Output: "[2025-09-20T10:30:00Z] INFO: click(button1) | scroll(50%) | hover(menu)"
```

#### HTML/XML Generation

```ts
// Tag generation for web applications
const tagTemplate = loom.compile('Tags: {tags|map#tag => <span>$tag$</span>|join}');
const tagData = { tags: ['JavaScript', 'TypeScript', 'React'] };
// Output: "Tags: <span>JavaScript</span><span>TypeScript</span><span>React</span>"
```

#### Advanced Filter Chaining

```ts
// Complex data transformation pipeline
const complexTemplate = loom.compile('{data|map#item => [$item$]|join#" -> "|upper|slice#0,30|wrap#">>>","<<<"}');
complexTemplate.render({ data: ['alpha', 'beta', 'gamma'] });
// Output: ">>>[ALPHA] -> [BETA] -> [GAMMA]<<<"

// Financial report formatting
const financialTemplate = loom.compile('Revenue: {quarters|map#q => $q.revenue$|join#" + "|slice#0,50|wrap#"Total: $"}');
const quarters = [
  { revenue: 250000 },
  { revenue: 275000 },
  { revenue: 310000 }
];
// Processes quarterly revenue with mathematical formatting
```

## Rendering Policies & Custom Filters

Rendering is controlled through `TemplatePolicy`:

```ts
import type { TemplatePolicy } from 'loomstr';

const policy: TemplatePolicy = {
  filters: {
    redact: () => '██',
    date: (value, locale = 'en-US') => new Date(value as number).toLocaleString(locale),
  },
  transform: (slot, value) => (slot.name === 'secret' ? '██' : value),
  asString: value => (typeof value === 'string' ? value : JSON.stringify(value)),
};

const message = loom
  .compile('[{timestamp|date}] user={user} secret={secret|redact}')
  .render({ timestamp: Date.now(), user: 'ada', secret: '1234' }, policy);
```

`resolvePolicy` automatically combines built-ins with your custom filters. If you only need the defaults, skip the policy argument entirely.

## Working with Templates

```ts
const tmpl = loom.compile('Hello {name}, you have {count} alerts');

// Direct render (throws on missing slots)
tmpl.render({ name: 'Alice', count: 5 });

// Inspect structure
loom.slotNames(tmpl); // ['name', 'count']
loom.hasSlot(tmpl, 'count'); // true

// Runtime validation
loom.missingKeys(tmpl, { name: 'Alice' }); // ['count']
loom.extraKeys(tmpl, { name: 'Alice', count: 5, foo: true }); // ['foo']
loom.validate(tmpl, { name: 'Alice', foo: true });

// Safe rendering without throw
const result = loom.tryRender(tmpl, { name: 'Alice', count: 5 });
if (!result.ok) console.error(result.error.message);

// Decompose output
const parts = tmpl.toParts({ name: 'Alice', count: 5 });
// parts.chunks, parts.slots, parts.values for inspection or custom sinks

// Stream-style rendering
loom.formatTo(tmpl, { name: 'Sam', count: 3 }, undefined, {
    text(chunk) {
        process.stdout.write(chunk + "\n");
    },
    value(v) {
        process.stdout.write("<" + v + ">" + "\n");
    },
});

/* Output:
Hello 
<Sam>
, you have 
<3>
 alerts
*/
```

## Composition and Reuse

```ts
// Concatenate compiled templates
const greeting = loom.compile('Hello {name}! ');
const footer = loom.compile('Kind regards, {team}');
const combined = loom.concat(greeting, footer);

// Bind default data (partial application)
const bound = loom.bind(combined, { team: 'Platform' });
bound.render({ name: 'Jess' });

// Attach a default policy once
const jsonTemplate = loom.compile('ctx={ctx|json}');
const withPolicy = loom.bind(jsonTemplate, {}, {
  filters: { json: (value, indent = '2') => JSON.stringify(value, null, Number(indent)) },
  asString: String,
});
withPolicy.render({ ctx: { ok: true } });

// Nested property extraction
const extractor = loom.compile('Hello, {items|path#0.title}!');
extractor.render({ items: [{ title: 'world' }] }); // "Hello, world!"

// Filter chaining for data transformation
const dataProcessor = loom.compile('result={data|map#item => $item$|join#"-"|upper}');
dataProcessor.render({ data: ['a', 'b', 'c'] }); // "result=A-B-C"

// Multi-step text processing
const textProcessor = loom.compile('clean={input|trim|slice#0,10|wrap#"[","]"}');
textProcessor.render({ input: '  Hello, World!  ' }); // "clean=[Hello, Wor]"
```

## Type Safety

Loomstr leverages template literal types to infer required keys:

```ts
import type { SlotKeys, ExactParamsFor } from 'loomstr';

const SOURCE = 'User {user} has {count|fixed#1} alerts' as const;
const tmpl = loom.compile(SOURCE);

type Keys = SlotKeys<typeof SOURCE>; // 'user' | 'count'

type Params = ExactParamsFor<typeof SOURCE, { user: string; count: number }>;

function renderAlerts(params: Params) {
  return tmpl.render(params);
}

// renderAlerts({ user: 'Ada' }); // TypeScript error: 'count' missing
```

`Template<S>` instances expose `chunks` and `slots` for metadata, while `TemplateParts`/`TemplatePartsRaw` let you inspect processed and raw values respectively.

## Development

```bash
npm install            # install dependencies
npm run build          # compile TypeScript to dist/
npm run test           # type-check + acceptance tests
npm run test:unit      # node:assert unit suite
npm run test:integration
npm run test:performance
npm run lint           # eslint over src/ and test/
npm run format:check
```

The project targets Node.js ≥ 16 and ships ESM output by default (`dist/loomstr.js`).

## License

MIT License. See [LICENSE](./LICENSE) for details.
