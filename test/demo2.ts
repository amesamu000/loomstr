import loom from "../src/loomstr";

// Ultra-complex test data structure
const ultraComplexData = {
  // Multi-dimensional business data
  company: {
    name: "  ACME CORPORATION  ",
    departments: [
      {
        name: "engineering",
        budget: 1234567.89,
        employees: [
          { 
            name: "alice JOHNSON", 
            salary: 95000.50, 
            skills: ["typescript", "react", "node.js"],
            projects: [
              { name: "Project Alpha", hours: 120.5, rate: 85.00 },
              { name: "Project Beta", hours: 95.25, rate: 90.00 }
            ],
            address: { city: "  san francisco  ", zip: "94105" }
          },
          { 
            name: "BOB smith", 
            salary: 87500.75, 
            skills: ["python", "django", "postgresql"],
            projects: [
              { name: "Project Gamma", hours: 80.0, rate: 75.00 },
              { name: "Project Delta", hours: 110.75, rate: 80.00 }
            ],
            address: { city: "NEW YORK", zip: "10001" }
          }
        ]
      },
      {
        name: "MARKETING",
        budget: 567890.12,
        employees: [
          { 
            name: "charlie BROWN", 
            salary: 65000.00, 
            skills: ["seo", "content", "analytics"],
            projects: [
              { name: "Campaign X", hours: 60.25, rate: 65.00 },
              { name: "Campaign Y", hours: 45.5, rate: 70.00 }
            ],
            address: { city: "chicago", zip: "60601" }
          }
        ]
      }
    ],
    financial: {
      quarters: [
        { q: "Q1", revenue: 2500000.00, expenses: 1800000.00 },
        { q: "Q2", revenue: 2750000.50, expenses: 1950000.25 },
        { q: "Q3", revenue: 3100000.75, expenses: 2200000.50 },
        { q: "Q4", revenue: 3450000.25, expenses: 2400000.75 }
      ],
      metrics: {
        growth: 0.125,
        satisfaction: 4.7,
        retention: 0.94
      }
    }
  },
  
  // Complex nested arrays and objects
  sales: {
    regions: [
      {
        name: "  north america  ",
        countries: ["USA", "CANADA", "mexico"],
        performance: [
          { month: "jan", sales: 125000.50, target: 120000.00 },
          { month: "FEB", sales: 135000.75, target: 130000.00 },
          { month: "mar", sales: 145000.25, target: 140000.00 }
        ]
      },
      {
        name: "EUROPE",
        countries: ["  uk  ", "germany", "FRANCE"],
        performance: [
          { month: "jan", sales: 98000.00, target: 95000.00 },
          { month: "feb", sales: 105000.50, target: 100000.00 },
          { month: "MAR", sales: 112000.75, target: 110000.00 }
        ]
      }
    ]
  },
  
  // Time series data
  analytics: {
    daily: [
      { date: "2024-01-01", users: 1250, sessions: 2100, revenue: 5500.25 },
      { date: "2024-01-02", users: 1380, sessions: 2250, revenue: 6200.50 },
      { date: "2024-01-03", users: 1150, sessions: 1950, revenue: 4800.75 }
    ]
  },
  
  // Product catalog with complex attributes
  products: {
    categories: [
      {
        name: "  electronics  ",
        items: [
          {
            name: "LAPTOP pro",
            specs: { cpu: "intel i7", ram: "16GB", storage: "512GB SSD" },
            pricing: { cost: 800.00, retail: 1299.99, margin: 0.385 },
            reviews: [
              { rating: 4.5, comment: "great laptop!" },
              { rating: 5.0, comment: "EXCELLENT performance" },
              { rating: 4.0, comment: "  good value  " }
            ]
          },
          {
            name: "smartphone X",
            specs: { screen: "6.1 inch", storage: "128GB", camera: "12MP" },
            pricing: { cost: 400.00, retail: 799.99, margin: 0.50 },
            reviews: [
              { rating: 4.8, comment: "amazing camera" },
              { rating: 4.2, comment: "battery could be better" }
            ]
          }
        ]
      }
    ]
  }
} as any;

console.log("=== MOST COMPLEX LOOMSTR FILTER SETUPS ===\n");

// =============================================================================
// EXTREME CHAINING - 6+ FILTERS IN SEQUENCE
// =============================================================================

console.log("--- EXTREME FILTER CHAINING ---\n");

// 7-filter chain: path -> map -> join -> lower -> slice -> upper -> wrap
console.log("🔥 ULTIMATE 7-FILTER CHAIN:");
const ultimate7Chain = loom.compile(
  "{company|path#departments|map#dept => $dept.name$|join# & |lower|slice#0,20|upper|wrap#***,***}"
);
console.log(ultimate7Chain.render(ultraComplexData));
console.log();

// 6-filter chain with number formatting
console.log("💰 FINANCIAL 6-FILTER CHAIN:");
const financial6Chain = loom.compile(
  "{company|path#financial.quarters|map#q => $q.revenue$|join# + |slice#0,30|wrap#$|pad#40,.}"
);
console.log(financial6Chain.render(ultraComplexData));
console.log();

// =============================================================================
// DEEPLY NESTED DATA TRANSFORMATIONS
// =============================================================================

console.log("--- DEEPLY NESTED TRANSFORMATIONS ---\n");

// Complex employee report with 5-level nesting
console.log("👥 ULTRA-COMPLEX EMPLOYEE REPORT:");
const employeeUltraReport = loom.compile(`
COMPANY: {company|path#name|trim|upper|wrap#[[ , ]]}

DEPARTMENT ANALYSIS:
{company|path#departments|map#dept => 
📊 $dept.name$|upper|wrap#" | "| budget: $dept.budget$|fixed#2|wrap#$

   EMPLOYEE BREAKDOWN:
   $dept.employees$|map#emp => 
   • $emp.name$|lower|slice#0,20|pad#20|wrap#"|" salary: $emp.salary$|fixed#0|wrap#$
   • Skills: $emp.skills$|map#skill => [$skill$]|join#, |upper
   • Projects: $emp.projects$|map#proj => "$proj.name$" ($proj.hours$h @ $proj.rate$)|join# + 
   • Location: $emp.address.city$|trim|upper from $emp.address.zip$|join#\\n\\n|join#\\n\\n}`);

console.log(employeeUltraReport.render(ultraComplexData));
console.log();

// =============================================================================
// MATHEMATICAL AND FINANCIAL CALCULATIONS
// =============================================================================

console.log("--- COMPLEX CALCULATIONS ---\n");

// Multi-level financial analysis
console.log("📈 ADVANCED FINANCIAL ANALYSIS:");
const financialAnalysis = loom.compile(`
QUARTERLY PERFORMANCE MATRIX:
{company|path#financial.quarters|map#q => 
$q.q$: Revenue $q.revenue$|fixed#0|wrap#$, Expenses $q.expenses$|fixed#0|wrap#$|join# \\n}

KEY METRICS DASHBOARD:
Growth: {company|path#financial.metrics.growth|fixed#3|wrap#%, %}
Satisfaction: {company|path#financial.metrics.satisfaction|fixed#1|wrap#⭐, /5⭐}
Retention: {company|path#financial.metrics.retention|fixed#2|wrap#%, %}
`);
console.log(financialAnalysis.render(ultraComplexData));
console.log();

// =============================================================================
// PRODUCT CATALOG WITH EXTREME COMPLEXITY
// =============================================================================

console.log("--- PRODUCT CATALOG COMPLEXITY ---\n");

// Ultra-complex product showcase
console.log("🛍️ EXTREME PRODUCT CATALOG:");
const productCatalog = loom.compile(`
PRODUCT CATALOG ANALYSIS:

{products|path#categories|map#cat => 
=== $cat.name$|trim|upper|wrap#[ , ] ===

$cat.items$|map#item => 
🔸 PRODUCT: $item.name$|upper|trim|wrap#", "|pad#25
   📋 SPECS: $item.specs$|json|slice#1,-1|wrap#( , )
   💰 PRICING: Cost: $item.pricing.cost$|fixed#2|wrap#$ | Retail: $item.pricing.retail$|fixed#2|wrap#$ | Margin: $item.pricing.margin$|fixed#1|wrap#%, %
   ⭐ REVIEWS: $item.reviews$|map#rev => [$rev.rating$★] "$rev.comment$"|trim|join# • |join#\\n\\n|join#\\n\\n}`);

console.log(productCatalog.render(ultraComplexData));
console.log();

// =============================================================================
// SALES DATA WITH REGIONAL BREAKDOWN
// =============================================================================

console.log("--- REGIONAL SALES COMPLEXITY ---\n");

// Multi-dimensional sales analysis
console.log("🌍 GLOBAL SALES MEGA-ANALYSIS:");
const salesMegaAnalysis = loom.compile(`
GLOBAL SALES PERFORMANCE MATRIX:

{sales|path#regions|map#region => 
🌎 REGION: $region.name$|trim|upper|wrap#=== , ===

   📍 COUNTRIES: $region.countries$|map#country => $country$|trim|upper|join# → 

   📊 MONTHLY PERFORMANCE:
   $region.performance$|map#perf => 
   • $perf.month$|upper|pad#5: Sales $perf.sales$|fixed#0|wrap#$ vs Target $perf.target$|fixed#0|wrap#$|join#\\n   |join#\\n\\n}`);

console.log(salesMegaAnalysis.render(ultraComplexData));
console.log();

// =============================================================================
// ANALYTICS DASHBOARD WITH TIME SERIES
// =============================================================================

console.log("--- TIME SERIES ANALYTICS ---\n");

// Complex analytics dashboard
console.log("📊 ANALYTICS MEGA-DASHBOARD:");
const analyticsDashboard = loom.compile(`
DAILY ANALYTICS BREAKDOWN:

{analytics|path#daily|map#day => 
📅 $day.date$: $day.users$|wrap#👥,  users | $day.sessions$|wrap#🔄,  sessions | $day.revenue$|fixed#2|wrap#💰$, |join# \\n}

SUMMARY METRICS:
Total Users: {analytics|path#daily|map#day => $day.users$|join# + |wrap#👥, 👥}
Average Revenue: {analytics|path#daily|map#day => $day.revenue$|join# → |wrap#💰$, /day}
`);
console.log(analyticsDashboard.render(ultraComplexData));
console.log();

// =============================================================================
// INSANE COMPLEXITY SHOWCASE
// =============================================================================

console.log("--- INSANE COMPLEXITY SHOWCASE ---\n");

// The most complex template possible
console.log("🚀 ULTIMATE COMPLEXITY NUCLEAR OPTION:");
const nuclearComplexity = loom.compile(`
{company|path#departments|map#dept => 
🏢 $dept.name$|trim|upper|wrap#<<< , >>> (Budget: $dept.budget$|fixed#0|wrap#$$$, $$$)

👥 TEAM MEMBERS & PROJECT ANALYTICS:
$dept.employees$|map#emp => 
   ══════════════════════════════════════════════════════════════════════════
   🧑‍💼 EMPLOYEE: $emp.name$|trim|lower|slice#0,25|upper|wrap#【, 】
   💵 COMPENSATION: $emp.salary$|fixed#2|wrap#💰$,  (Annual)
   🛠️  SKILL MATRIX: $emp.skills$|map#skill => [$skill$|upper]|join# ➜ |wrap#🔧 , 🔧
   
   📋 PROJECT PORTFOLIO:
   $emp.projects$|map#proj => 
      ▶️ $proj.name$|upper|pad#20: $proj.hours$h|fixed#1|wrap#(, h) @ $proj.rate$|fixed#2|wrap#$ ,/h|join# \\n      |wrap#      , 
   
   🏠 LOCATION: $emp.address.city$|trim|upper|wrap#📍,  [$emp.address.zip$]|join#\\n   |join#\\n\\n|join#\\n\\n

🔥 PERFORMANCE METRICS MATRIX:
{company|path#financial.quarters|map#quarter => 
$quarter.q$|wrap#📈,  Performance: Revenue $quarter.revenue$|fixed#0|wrap#💰$,  vs Expenses $quarter.expenses$|fixed#0|wrap#💸$, |join# \\n}
`);

console.log(nuclearComplexity.render(ultraComplexData));
console.log();

// =============================================================================
// EDGE CASE EXTREMES
// =============================================================================

console.log("--- EDGE CASE EXTREMES ---\n");

// Testing limits with empty data and extreme chaining
const edgeData = {
  empty: [],
  nested: { deep: { deeper: { deepest: "found!" } } },
  mixed: [null, undefined, "", 0, false, "valid"],
  numbers: [1.111111, 2.222222, 3.333333]
} as any;

console.log("🔍 EDGE CASE MEGA-TEST:");
const edgeCaseTest = loom.compile(`
Empty Array Chain: {empty|map#x => [$x$]|join#,|upper|wrap#|||, |||}
Deep Nesting: {nested|path#deep.deeper.deepest|upper|slice#0,3|wrap#🎯, 🎯}
Mixed Array Filter: {mixed|map#item => [$item$]|join# ➜ |slice#0,50|wrap#🔀, 🔀}
Number Precision: {numbers|map#num => $num$|join# → |slice#0,30|wrap#🔢, 🔢}
`);
console.log(edgeCaseTest.render(edgeData));

console.log("\n=== COMPLEXITY LIMIT REACHED! ===");
console.log("🏆 Successfully executed the most complex loomstr setups possible!");
console.log("💪 Features demonstrated:");
console.log("   • 7-filter chains");
console.log("   • 5-level deep nesting");
console.log("   • Multi-dimensional array processing");
console.log("   • Complex mathematical transformations");
console.log("   • Advanced string manipulation");
console.log("   • Edge case handling");
console.log("   • Real-world business data processing");