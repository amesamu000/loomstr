/**
 * Main entry point for loomstr - TypeScript-native template system.
 *
 * loomstr provides type-safe, slot-based templating with:
 * - Compile-time type checking of template parameters
 * - Built-in filters (upper, lower, json, path, pad, fixed)
 * - Custom filter and transform support via policies
 * - Partial application through binding
 * - Safe rendering with error handling
 * - Security features including redaction capabilities
 *
 * @example
 * ```typescript
 * import loom from './loomstr';
 *
 * const tmpl = loom.compile("Hello {name|upper}!");
 * tmpl.render({ name: "world" }); // "Hello WORLD!"
 *
 * const bound = loom.bind(tmpl, { name: "Alice" });
 * bound.render({}); // "Hello ALICE!"
 * ```
 */

export type {
  SlotKeys,
  ExactParamsForKeys,
  ExactParamsFor,
  FilterFn,
  FilterDescriptor,
  TemplatePolicy,
  ResolvedPolicy,
  SlotDescriptor,
  TemplateParts,
  TemplatePartsRaw,
  Template,
  BoundTemplate,
  TEMPLATE_BRAND_TYPE,
} from './types.js';

export { TEMPLATE_BRAND } from './types.js';

import { compile, concat } from './template.js';
import { defaultPolicy } from './filters.js';
import {
  slotNames,
  hasSlot,
  missingKeys,
  extraKeys,
  validate,
  tryRender,
  formatTo,
  bind,
  withDefaultPolicy,
} from './utils.js';

/**
 * The main loom object providing the complete loomstr API.
 * Central interface for all template operations including compilation,
 * rendering, binding, validation, and utility functions.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const tmpl = loom.compile("Hello {name}!");
 * const result = tmpl.render({ name: "world" });
 *
 * // With binding
 * const bound = loom.bind(tmpl, { name: "Alice" });
 * const rendered = bound.render({});
 *
 * // Safe rendering
 * const safeResult = loom.tryRender(tmpl, { name: "Bob" });
 * if (safeResult.ok) console.log(safeResult.value);
 *
 * // Validation
 * const validation = loom.validate(tmpl, {});
 * console.log(validation.missing); // ["name"]
 * ```
 */
const loom = {
  /** Compile a template string into a reusable template instance */
  compile,

  /** Concatenate two templates into a single template */
  concat,

  /** Default policy with built-in filters */
  builtinPolicy: defaultPolicy,

  /** Get all unique slot names from a template */
  slotNames,

  /** Check if a template contains a specific slot name */
  hasSlot,

  /** Find keys missing from provided parameters */
  missingKeys,

  /** Find extra keys not used by the template */
  extraKeys,

  /** Validate parameters against template requirements */
  validate,

  /** Safely render a template without throwing exceptions */
  tryRender,

  /** Format a template to a sink for custom output handling */
  formatTo,

  /** Bind partial data to a template */
  bind,

  /** Wrap a template with a default policy */
  withDefaultPolicy,
};

export default loom;

// CommonJS compatibility
//module.exports = loom;
//module.exports.default = loom;
