import loom from "../src/loomstr";

// Test data
const testData = {
  // Basic types
  text: "Hello World",
  number: 123.456789,
  negativeNumber: -42.75,
  
  // Arrays
  simpleArray: [1, 2, 3, 4, 5],
  stringArray: ["apple", "banana", "cherry"],
  objectArray: [
    { name: "Alice", age: 25, city: "New York" },
    { name: "Bob", age: 30, city: "London" },
    { name: "Charlie", age: 35, city: "Tokyo" }
  ],
  
  // Objects
  user: {
    profile: {
      name: "John Doe",
      email: "john@example.com",
      settings: {
        theme: "dark",
        notifications: true
      }
    },
    posts: [
      { title: "First Post", content: "Hello world!" },
      { title: "Second Post", content: "TypeScript is great" }
    ]
  },
  
  // Shopping cart example
  cart: {
    items: [
      { name: "Laptop", price: 999.99, qty: 1 },
      { name: "Mouse", price: 25.50, qty: 2 },
      { name: "Keyboard", price: 75.00, qty: 1 }
    ],
    customer: "Jane Smith",
    total: 1125.99
  },
  
  // Edge cases
  whitespaceText: "  spaced out  ",
  emptyArray: [],
  nullValue: null,
  undefinedValue: undefined
} as any; // Use 'as any' to bypass strict type checking for comprehensive demo

console.log("=== LOOMSTR COMPREHENSIVE FILTER TESTS ===\n");

// =============================================================================
// STRING FILTERS
// =============================================================================

console.log("--- STRING FILTERS ---");

// upper filter
console.log("UPPER:", loom.compile("{text|upper}").render(testData));
// -> UPPER: HELLO WORLD

// lower filter  
console.log("LOWER:", loom.compile("{text|lower}").render(testData));
// -> LOWER: hello world

// trim filter
console.log("TRIM:", loom.compile("'{whitespaceText|trim}'").render(testData));
// -> TRIM: 'spaced out'

// slice filter - various forms
console.log("SLICE(6):", loom.compile("{text|slice#6}").render(testData));
// -> SLICE(6): World

console.log("SLICE(0,5):", loom.compile("{text|slice#0,5}").render(testData));
// -> SLICE(0,5): Hello

console.log("SLICE(-5):", loom.compile("{text|slice#-5}").render(testData));
// -> SLICE(-5): World

// wrap filter - various forms
console.log("WRAP(*):", loom.compile("{text|wrap#*}").render(testData));
// -> WRAP(*): *Hello World*

console.log("WRAP([,]):", loom.compile("{text|wrap#[,]}").render(testData));
// -> WRAP([,]): [Hello World]

console.log("WRAP(>>>,<<<):", loom.compile("{text|wrap#>>>,<<<}").render(testData));
// -> WRAP(>>>,<<<): >>>Hello World<<<

// pad filter
console.log("PAD(20):", loom.compile("'{text|pad#20}'").render(testData));
// -> PAD(20): 'Hello World         '

console.log("PAD(15,.):", loom.compile("'{text|pad#15,.}'").render(testData));
// -> PAD(15,.): 'Hello World....'

console.log("\n");

// =============================================================================
// NUMBER FILTERS  
// =============================================================================

console.log("--- NUMBER FILTERS ---");

// fixed filter
console.log("FIXED(2):", loom.compile("{number|fixed#2}").render(testData));
// -> FIXED(2): 123.46

console.log("FIXED(0):", loom.compile("{number|fixed#0}").render(testData));
// -> FIXED(0): 123

console.log("NEGATIVE FIXED(1):", loom.compile("{negativeNumber|fixed#1}").render(testData));
// -> NEGATIVE FIXED(1): -42.8

console.log("\n");

// =============================================================================
// JSON FILTER
// =============================================================================

console.log("--- JSON FILTER ---");

// json filter - compact
console.log("JSON COMPACT:", loom.compile("{user|json}").render(testData));

// json filter - pretty print
console.log("JSON PRETTY:");
console.log(loom.compile("{user|json#2}").render(testData));

console.log("\n");

// =============================================================================
// PATH FILTER
// =============================================================================

console.log("--- PATH FILTER ---");

// path filter - nested object access
console.log("PATH(profile.name):", loom.compile("{user|path#profile.name}").render(testData));
// -> PATH(profile.name): John Doe

console.log("PATH(profile.settings.theme):", loom.compile("{user|path#profile.settings.theme}").render(testData));
// -> PATH(profile.settings.theme): dark

// path filter - array access
console.log("PATH(posts.0.title):", loom.compile("{user|path#posts.0.title}").render(testData));
// -> PATH(posts.0.title): First Post

console.log("PATH(posts.1.content):", loom.compile("{user|path#posts.1.content}").render(testData));
// -> PATH(posts.1.content): TypeScript is great

// path filter - with fallback
console.log("PATH(nonexistent,fallback):", loom.compile("{user|path#nonexistent.path,Not Found}").render(testData));
// -> PATH(nonexistent,fallback): Not Found

console.log("\n");

// =============================================================================
// ARRAY FILTERS
// =============================================================================

console.log("--- ARRAY FILTERS ---");

// join filter - simple
console.log("JOIN(,):", loom.compile("{simpleArray|join#,}").render(testData));
// -> JOIN(,): 1,2,3,4,5

console.log("JOIN( - ):", loom.compile("{stringArray|join# - }").render(testData));
// -> JOIN( - ): apple - banana - cherry

// join filter - no separator
console.log("JOIN(no sep):", loom.compile("{simpleArray|join}").render(testData));
// -> JOIN(no sep): 12345

// map filter - simple transformation
console.log("MAP(simple):", loom.compile("{simpleArray|map#n => [$n$]}").render(testData));
// -> MAP(simple): ["[1]","[2]","[3]","[4]","[5]"]

console.log("MAP(object props):", loom.compile("{objectArray|map#person => $person.name$ ($person.age$)}").render(testData));
// -> MAP(object props): ["Alice (25)","Bob (30)","Charlie (35)"]

console.log("\n");

// =============================================================================
// FILTER CHAINING
// =============================================================================

console.log("--- FILTER CHAINING ---");

// Chain: map + join
console.log("CHAIN(map|join):");
console.log(loom.compile("{objectArray|map#person => - $person.name$ from $person.city$|join#\\n}").render(testData));

// Chain: multiple string transformations
console.log("CHAIN(lower|slice|upper|wrap):", 
  loom.compile("{text|lower|slice#6|upper|wrap#[,]}").render(testData));
// -> CHAIN(lower|slice|upper|wrap): [WORLD]

// Chain: path + fixed + wrap
console.log("CHAIN(path|fixed|wrap):", 
  loom.compile("{cart|path#total|fixed#2|wrap#$}").render(testData));
// -> CHAIN(path|fixed|wrap): $1125.99$

// Chain: map + join + upper + wrap
console.log("CHAIN(map|join|upper|wrap):");
console.log(loom.compile("{stringArray|map#fruit => [$fruit$]|join# , |upper|wrap#>>>>,<<<<}").render(testData));

// Chain: complex object transformation
console.log("CHAIN(complex cart):");
console.log(loom.compile("{cart|path#items|map#item => • $item.name$: $item.qty$ × $item.price$|join#\\n}").render(testData));

console.log("\n");

// =============================================================================
// ADVANCED CHAINING EXAMPLES
// =============================================================================

console.log("--- ADVANCED CHAINING ---");

// Shopping cart receipt
console.log("SHOPPING CART RECEIPT:");
const receiptTemplate = `
Customer: {cart|path#customer}
Items:
{cart|path#items|map#item => - $item.name$ (Qty: $item.qty$) @ $item.price$|join#\\n}
Total: {cart|path#total|fixed#2|wrap#$}
`.trim();
console.log(loom.compile(receiptTemplate).render(testData));

// User profile summary  
console.log("\nUSER PROFILE:");
const profileTemplate = `
Name: {user|path#profile.name|upper}
Email: {user|path#profile.email|lower}
Posts: {user|path#posts|map#post => "$post.title$"|join#, }
Theme: {user|path#profile.settings.theme|upper|wrap#(,)}
`.trim();
console.log(loom.compile(profileTemplate).render(testData));

// Number formatting showcase
console.log("\nNUMBER FORMATTING:");
const numbers = { values: [1.1, 22.22, 333.333, 4444.4444] };
console.log("Raw numbers:", loom.compile("{values|map#n => $n$|join# - }").render(numbers));
console.log("Fixed to 2 places:", loom.compile("{values|join# -> }").render(numbers));

// Multiple data processing
console.log("\nDATA PROCESSING:");
const data = { 
  names: ["alice", "bob", "charlie"],
  ages: [25, 30, 35],
  cities: ["NEW YORK", "london", "  tokyo  "]
} as any;

console.log("Names (upper):", loom.compile("{names|map#name => $name$|join#, }").render(data));
console.log("Cities (clean):", loom.compile("{cities|map#city => $city$|join# -> }").render(data));

console.log("\n");

// =============================================================================
// EDGE CASES AND ERROR HANDLING
// =============================================================================

console.log("--- EDGE CASES ---");

// Empty arrays
console.log("EMPTY ARRAY JOIN:", loom.compile("'{emptyArray|join#,}'").render(testData));
// -> EMPTY ARRAY JOIN: ''

console.log("EMPTY ARRAY MAP:", loom.compile("'{emptyArray|map#x => [$x$]|join#,}'").render(testData));
// -> EMPTY ARRAY MAP: ''

// Null/undefined handling with path
console.log("NULL PATH:", loom.compile("'{nullValue|path#some.path,DEFAULT}'").render(testData));
// -> NULL PATH: 'DEFAULT'

// Number to string conversions
console.log("NUMBER AS STRING:", loom.compile("{number|upper}").render(testData));
// -> NUMBER AS STRING: 123.456789

// Complex nested access
console.log("DEEP NESTING:", loom.compile("{user|path#profile.settings.notifications}").render(testData));
// -> DEEP NESTING: true

console.log("\n");

// =============================================================================
// SPECIAL CHARACTER HANDLING
// =============================================================================

console.log("--- SPECIAL CHARACTERS ---");

// Newlines and tabs in map
const specialData = { items: ["line1", "line2", "line3"] };
console.log("NEWLINES IN MAP:");
console.log(loom.compile("{items|map#item => > $item$|join#\\n}").render(specialData));

console.log("TABS IN MAP:");
console.log(loom.compile("{items|map#item => \\t- $item$|join#\\n}").render(specialData));

// Special characters in wrap
console.log("SPECIAL WRAP:", loom.compile("{text|wrap#\\n---\\n}").render(testData));

console.log("\n=== ALL TESTS COMPLETED ===");
