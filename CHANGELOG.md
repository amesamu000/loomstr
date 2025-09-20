# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Filter Chaining**: Filters can now be chained using multiple pipe operators
  - Syntax: `{value|filter1|filter2|filter3}` applies filters left-to-right
  - Full parser support for unlimited filter chains
  - Comprehensive TypeScript support for chained filters
  - Extensive test coverage for complex chaining scenarios

- **New String Manipulation Filters**:
  - `trim`: Remove whitespace from both ends of string
  - `slice`: Extract substring with start and optional end positions
    - Usage: `{text|slice#6}` or `{text|slice#0,5}`
  - `wrap`: Wrap string with prefix and optional suffix
    - Usage: `{text|wrap#"[","]"}` or `{text|wrap#"*"}` (same prefix/suffix)

- **Enhanced Array Processing Filters**:
  - `map`: Transform array elements using template expressions
    - Syntax: `{items|map#item => - $item.title$ x$item.qty$\n}`
    - Supports property access with `$variable.property$` syntax
    - Returns arrays that can be chained with other filters
  - `join`: Join array elements with optional separator
    - Usage: `{array|join#", "}` or `{array|join}` (no separator)
    - Works standalone or chained after map filter

- **Advanced Template Examples**: Added comprehensive examples showing:
  - Filter chaining for complex data transformations
  - Array processing with map and join combinations
  - Multi-step text processing workflows
  - Real-world use cases for all new filters

### Enhanced
- **Parser Infrastructure**: Complete rewrite to support filter chaining
  - Updated `FilterDescriptor` interface for chain support
  - Enhanced slot parsing to handle multiple filter segments
  - Improved error handling for malformed filter chains
  
### Fixed
- **Template Parsing**: Improved escape sequence handling in map filter templates
  - Fixed `\n` and `\t` processing in template expressions
  - Better handling of complex template arguments
  
### Known Issues
- Parser has limitations with quoted strings containing spaces in filter arguments
  - Workaround: Use quotes without spaces or escape sequences where possible
  - This will be addressed in a future release

### Previous Releases

- **Path Filter**: New built-in `path` filter for deep object and array traversal
  - Supports dot notation for nested property access: `{user|path#profile.name}`
  - Array index access: `{items|path#0.title}`
  - Mixed object/array traversal: `{data|path#users.0.profile.email}`
  - Safe handling of null/undefined values (returns empty string)
  - Comprehensive test coverage and documentation

### Enhanced
- Updated README with path filter examples and usage patterns
- Added integration tests for real-world path filter scenarios
- Improved built-in filter documentation

### Fixed
- **CommonJS Compatibility**: Fixed module exports to work properly with both `require()` and `import`
  - Added `module.exports` compatibility for CommonJS users
  - Fixed "TypeError: loom.compile is not a function" when using `require()`
  - Both `const loom = require('loomstr')` and `import loom from 'loomstr'` now work correctly

## [1.0.1] - 2025-09-19

### Fixed
- Build configuration and export improvements

## [1.0.0] - 2025-09-19

### Added
- Initial release of Loomstr template engine
- Core template parsing with slot-based interpolation
- Filter system with support for arguments and quoted strings
- Three optimized parser implementations:
  - Original regex-based parser (`parser.ts`)
  - Optimized character-by-character parser (`newparger.ts`) - 25-40% faster
  - Ultra-optimized parser with fast-paths (`newerparser.ts`)
- Comprehensive API with `parseTemplate`, `compile`, and `renderTemplate`
- Full TypeScript support with type definitions
- Escape sequence support (`\{`, `\\`)
- Quoted argument parsing for complex filter arguments
- Extensive test suite with acceptance tests
- Performance benchmark suite comparing all parser implementations
- Real-world template examples (emails, logs, reports, UI, API)

### Features
- **Fast Performance**: Optimized parsers with significant speed improvements
- **Flexible Syntax**: Support for nested object access (`user.name`, `items.0.title`)
- **Powerful Filters**: Custom filter functions with multiple arguments
- **Type Safety**: Full TypeScript support for better developer experience
- **Zero Dependencies**: Lightweight with no external dependencies
- **Error Handling**: Comprehensive error messages for malformed templates
- **Memory Efficient**: Optimized memory usage during parsing and rendering

### Documentation
- Comprehensive README with examples and API reference
- Benchmark results and performance analysis
- Real-world usage examples for common scenarios
- Complete API documentation with TypeScript types

### Development
- TypeScript build configuration
- Test suite with acceptance tests
- Benchmark suite for performance analysis
- Git repository with proper .gitignore
- MIT license
- NPM package configuration

## [Unreleased]
- Future enhancements and optimizations will be tracked here