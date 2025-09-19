# Contributing to Loomstr

Thank you for your interest in contributing to Loomstr! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- Bun (preferred) or npm/yarn
- TypeScript knowledge

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/loomstr.git`
3. Install dependencies: `bun install`
4. Run tests: `bun test`
5. Run benchmarks: `bun benchmark.ts`

## 📋 Development Workflow

### Making Changes
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Add tests for new functionality
4. Run the test suite: `bun test`
5. Run benchmarks: `bun benchmark.ts` (ensure no performance regressions)
6. Update documentation if needed
7. Commit with clear messages

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Maintain consistent formatting
- Keep functions focused and small

### Testing
- Write tests for all new features
- Ensure existing tests pass
- Include edge cases and error conditions
- Add performance tests for parser changes

### Performance
- Run benchmarks before and after changes
- Document any performance implications
- Optimize for common use cases
- Consider memory usage in additions

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Minimal reproduction case
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Relevant error messages or logs

## ✨ Feature Requests

For new features:
- Describe the use case and motivation
- Provide examples of the proposed API
- Consider backward compatibility
- Discuss performance implications

## 📚 Documentation

- Update README.md for API changes
- Add examples for new features
- Update CHANGELOG.md
- Include JSDoc comments
- Update type definitions

## 🔍 Code Review Process

- All changes require review
- Address reviewer feedback promptly
- Squash commits before merging
- Ensure CI passes
- Update branch before merging

## 📊 Performance Guidelines

- Maintain or improve parser performance
- Profile changes with the benchmark suite
- Consider memory allocation patterns
- Document performance characteristics
- Test with large templates

## 🏗️ Architecture Notes

### Parser Design
- Character-by-character parsing for precision
- Minimal memory allocation during parsing
- Fast-path optimizations for common cases
- Clear separation of concerns

### Filter System
- Simple function signature: `(value: string, ...args: string[]) => string`
- Type-safe filter definitions
- Efficient argument parsing
- Support for quoted arguments

### Template Compilation
- Pre-compile templates for repeated use
- Optimize for rendering speed
- Minimize runtime overhead
- Cache compiled templates when possible

## 🤝 Community

- Be respectful and inclusive
- Help others learn and contribute
- Share knowledge and best practices
- Follow the code of conduct

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Loomstr better! 🙏