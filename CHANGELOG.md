# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **🔗 Filter Chaining System**: Complete infrastructure for chaining multiple filters
  - Syntax: `{value|filter1|filter2|filter3}` applies filters left-to-right  
  - Parser completely rewritten to support unlimited filter chains
  - Full TypeScript support with proper type inference for chained operations
  - Comprehensive error handling for malformed filter chains
  - Extensive test coverage including edge cases and complex scenarios

- **🎯 New String Manipulation Filters**:
  - `trim`: Remove whitespace from both ends of strings
    - Example: `{text|trim}` transforms `"  hello  "` → `"hello"`
  - `slice`: Extract substrings with start and optional end positions
    - Usage: `{text|slice#6}` (from index 6), `{text|slice#0,5}` (range 0-5)
    - Supports negative indices: `{text|slice#-5}` (last 5 characters)
  - `wrap`: Wrap strings with prefix and optional suffix
    - Usage: `{text|wrap#"[","]"}` → `"[content]"` 
    - Same prefix/suffix: `{text|wrap#"*"}` → `"*content*"`
    - Advanced wrapping: `{text|wrap#">>>","<<<"}` → `">>>content<<<"`

- **📊 Enhanced Array Processing Filters**:
  - `map`: Transform array elements using template expressions with variable substitution
    - Syntax: `{items|map#item => - $item.title$ x$item.qty$\n}`
    - Supports deep property access: `$item.user.profile.name$`
    - Escape sequence processing: `\n`, `\t`, `\r` in templates
    - Returns arrays that can be chained with other filters
    - Real-world example: Shopping cart item formatting
  - `join`: Join array elements into strings with customizable separators
    - Usage: `{array|join#", "}` (comma-separated), `{array|join#"\n"}` (newlines)
    - No separator: `{array|join}` (concatenate directly)
    - Works seamlessly after map operations for complete data pipelines

- **🏗️ Real-World Template Examples**: Added comprehensive examples covering:
  - **E-commerce**: Shopping cart summaries, product catalogs, pricing displays
  - **API Responses**: User lists, data formatting, structured outputs
  - **Logging Systems**: Event tracking, structured logs, multi-dimensional data
  - **HTML/XML Generation**: Tag creation, markup generation, templating
  - **Financial Reports**: Revenue calculations, multi-step data processing
  - **Business Intelligence**: Employee reports, department analysis, metrics dashboards

- **🧪 Comprehensive Testing Suite**:
  - Unit tests covering all individual filters with edge cases
  - Integration tests with real-world scenarios (e-commerce, logging, API responses)
  - Complex chaining tests with 5+ filter combinations
  - Edge case testing with null/undefined values, empty arrays
  - Performance testing with large datasets and complex templates
  - Demo showcasing nuclear complexity with multi-dimensional data processing

### Enhanced
- **🚀 Parser Infrastructure**: Complete architecture overhaul for filter chaining
  - Rebuilt `parseSlotBody` function with state machine approach
  - Updated `FilterDescriptor` interface supporting chain metadata
  - Enhanced slot parsing with proper argument isolation between filters
  - Robust error handling with detailed error messages for debugging
  - Optimized performance for complex filter chains
  
- **🔧 Development Experience**: Improved tooling and error handling
  - Better TypeScript integration with exact parameter inference
  - Enhanced error messages showing filter context and position
  - Comprehensive validation functions: `missingKeys`, `extraKeys`, `validate`
  - Template composition utilities: `concat`, `bind`, `withDefaultPolicy`
  
- **📚 Documentation**: Extensive updates with practical examples
  - Real-world use cases for every filter combination
  - Step-by-step guides for complex data transformations
  - Performance considerations and best practices
  - Migration guide for upgrading existing templates
  
### Fixed
- **🔨 Parser Argument Handling**: Resolved critical filter chaining bug
  - Fixed double `pushArg()` calls causing empty arguments in filter chains
  - Improved escape sequence processing in map filter templates (`\n`, `\t`, `\r`)
  - Better handling of pipe characters in filter arguments
  - Resolved template argument truncation in chained filter scenarios
  
- **💡 Template Processing**: Enhanced robustness and reliability
  - Fixed newline preservation in map filter template expressions
  - Improved quoted string handling in complex argument scenarios
  - Better error recovery for malformed filter expressions
  
### Known Issues
- **⚠️ Parser Limitations**: Some edge cases with complex quoted arguments
  - Limited support for pipe characters (`|`) within quoted filter arguments
  - Workaround: Use alternative separators or escape sequences
  - Improvement planned for next major release
  
- **🔍 Performance**: Complex filter chains may impact performance
  - Templates with 5+ chained filters on large datasets
  - Consider breaking complex chains into multiple template steps for better performance
  - Fixed double `pushArg()` calls causing empty arguments in filter chains
  - Improved escape sequence processing in map filter templates (`\n`, `\t`, `\r`)
  - Better handling of pipe characters in filter arguments
  - Resolved template argument truncation in chained filter scenarios
  
- **💡 Template Processing**: Enhanced robustness and reliability
  - Fixed newline preservation in map filter template expressions
  - Improved quoted string handling in complex argument scenarios
  - Better error recovery for malformed filter expressions
  
### Known Issues
- **⚠️ Parser Limitations**: Some edge cases with complex quoted arguments
  - Limited support for pipe characters (`|`) within quoted filter arguments
  - Workaround: Use alternative separators or escape sequences
  - Improvement planned for next major release
  
- **🔍 Performance**: Complex filter chains may impact performance
  - Templates with 5+ chained filters on large datasets
  - Consider breaking complex chains into multiple template steps for better performance

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