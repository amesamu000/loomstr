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
```

## Template Syntax

```
{name}                 basic slot
{name|filter}          apply a filter
{value|filter#arg1,arg2}  pass comma-separated arguments
{value|filter#'quoted',"args"}  arguments may be quoted and escaped
\{literal\}            use backslash to escape `{`, `}`, and `\`
```

Slots and filters are trimmed, so `{ name | upper }` is valid. Filter arguments keep internal spacing unless quoted.

## Built-in Filters

| Filter | Description |
| --- | --- |
| `upper` | Uppercase string conversion |
| `lower` | Lowercase string conversion |
| `json` | `JSON.stringify(value)`; supply `{slot|json#4}` (or any non-negative integer) to pretty-print |
| `path` | Traverse nested structures via dot notation with optional fallback `{user|path#profile.email,'n/a'}` |
| `pad` | Right-pad value to a length: `{id|pad#5,0}` → `00042` |
| `fixed` | Format numbers with fixed decimals: `{price|fixed#2}` |

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
