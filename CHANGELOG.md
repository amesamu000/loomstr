# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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