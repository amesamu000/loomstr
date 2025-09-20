/**
 * Built-in filters and policy management for loomstr templates.
 * This module provides default filters and utilities for resolving template policies.
 */

import type { FilterFn, TemplatePolicy, ResolvedPolicy } from './types';

/**
 * Built-in filter functions available in all templates.
 * These filters can be used with the {slot|filter} syntax and can be chained.
 *
 * Available filters:
 * - `upper`: Convert to uppercase
 * - `lower`: Convert to lowercase
 * - `trim`: Remove whitespace from both ends
 * - `slice`: Extract substring with start and optional end positions
 * - `wrap`: Wrap string with prefix and suffix
 * - `json`: JSON stringify the value (optionally pretty-print with {slot|json#2})
 * - `path`: Extract nested properties using dot notation with optional fallback
 * - `pad`: Right-pad with character to specified length
 * - `fixed`: Format number to fixed decimal places
 * - `map`: Transform array elements using a template expression
 * - `join`: Join array elements into a string with optional separator
 */
export const builtinFilters: Record<string, FilterFn> = Object.freeze({
  /** Convert value to uppercase string */
  upper: v => String(v).toUpperCase(),

  /** Convert value to lowercase string */
  lower: v => String(v).toLowerCase(),

  /** Trim whitespace from both ends of string */
  trim: v => String(v).trim(),

  /**
   * Extract substring with start position and optional end position.
   * Usage: {text|slice#5} starts at index 5, {text|slice#2,8} from index 2 to 8
   * @param v - Value to slice
   * @param startArg - Start index (as string)
   * @param endArg - Optional end index (as string)
   */
  slice: (v, startArg, endArg) => {
    if (startArg === undefined) {
      throw new Error('slice: missing start index argument');
    }
    const start = Number(startArg);
    if (!Number.isInteger(start)) {
      throw new Error(`slice: invalid start index "${startArg}"`);
    }
    const s = String(v);
    if (endArg === undefined) {
      return s.slice(start);
    }
    const end = Number(endArg);
    if (!Number.isInteger(end)) {
      throw new Error(`slice: invalid end index "${endArg}"`);
    }
    return s.slice(start, end);
  },

  /**
   * Wrap string with prefix and optional suffix.
   * Usage: {text|wrap#"[","]"} wraps with brackets, {text|wrap#"*"} wraps with asterisks
   * @param v - Value to wrap
   * @param prefixArg - Prefix string
   * @param suffixArg - Optional suffix string (defaults to prefix)
   */
  wrap: (v, prefixArg = '', suffixArg) => {
    const s = String(v);
    const prefix = prefixArg || '';
    const suffix = suffixArg !== undefined ? suffixArg : prefix;
    return prefix + s + suffix;
  },

  /** JSON stringify the value with optional indentation */
  json: (v, indentArg) => {
    if (indentArg === undefined || indentArg === '') {
      return JSON.stringify(v);
    }
    const indent = Number(indentArg);
    if (!Number.isFinite(indent)) {
      throw new Error(`json: invalid indent \"${indentArg}\"`);
    }
    if (!Number.isInteger(indent) || indent < 0) {
      throw new Error('json: indent must be a non-negative integer');
    }
    return JSON.stringify(v, null, indent);
  },

  /**
   * Access nested properties using dot notation path.
   * Usage: {obj|path#key.subkey} or {arr|path#0.title}
   * @param value - Object or array to traverse
   * @param pathArg - Dot-separated path string
   * @param fallback - Optional fallback value when path is missing
   */
  path: (value, pathArg, fallback) => {
    if (!pathArg) {
      throw new Error('path: missing property path argument');
    }

    const rawSegments = pathArg.split('.');
    const segments: string[] = [];
    for (const raw of rawSegments) {
      const seg = raw.trim();
      if (!seg) {
        throw new Error(`path: invalid segment in "${pathArg}"`);
      }
      segments.push(seg);
    }

    let current: unknown = value;
    for (const segment of segments) {
      if (current === null || current === undefined) {
        current = undefined;
        break;
      }

      if (Array.isArray(current)) {
        const idx = Number(segment);
        if (!Number.isInteger(idx) || idx < 0) {
          current = undefined;
          break;
        }
        current = current[idx];
        continue;
      }

      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[segment];
        continue;
      }

      current = undefined;
      break;
    }

    if (current === undefined) {
      return fallback ?? '';
    }
    return current;
  },

  /**
   * Right-pad string to specified length with fill character.
   * Usage: {value|pad#10,' '} pads to 10 characters with spaces
   * @param v - Value to pad
   * @param lenArg - Target length (as string)
   * @param fillArg - Fill character (defaults to space)
   */
  pad: (v, lenArg = '0', fillArg = ' ') => {
    const len = Number(lenArg);
    if (!Number.isFinite(len)) throw new Error(`pad: invalid length "${lenArg}"`);
    const s = String(v);
    const fill = (fillArg || ' ').slice(0, 1);
    return s.length >= len ? s : s + fill.repeat(len - s.length);
  },

  /**
   * Format number to fixed decimal places.
   * Usage: {value|fixed#2} formats to 2 decimal places
   * @param v - Numeric value to format
   * @param d - Number of decimal places (as string)
   */
  fixed: (v, d = '0') => {
    const n = typeof v === 'number' ? v : Number(v);
    const k = Number(d);
    if (!Number.isFinite(n)) throw new Error(`fixed: non-numeric value ${String(v)}`);
    if (!Number.isInteger(k) || k < 0) throw new Error(`fixed: invalid digits "${d}"`);
    return n.toFixed(k);
  },

  /**
   * Map over array elements using a template expression.
   * Usage: {items|map#item => - $item.title$ x$item.qty$\n} returns array of strings
   * Can be chained with join: {items|map#item => $item.name$|join#, }
   * @param value - Array to map over
   * @param templateArg - Template expression with variable binding using $ syntax
   */
  map: (value, templateArg) => {
    if (!templateArg) {
      throw new Error('map: missing template expression argument');
    }

    if (!Array.isArray(value)) {
      throw new Error('map: value must be an array');
    }

    // Parse template expression: "varName => template"
    const arrowIndex = templateArg.indexOf('=>');
    if (arrowIndex === -1) {
      throw new Error('map: template expression must use => syntax (e.g., "item => - $item.name$")');
    }

    const varName = templateArg.slice(0, arrowIndex).trim();
    const templateStr = templateArg.slice(arrowIndex + 2).trim();

    if (!varName) {
      throw new Error('map: missing variable name before =>');
    }

    if (!templateStr) {
      throw new Error('map: missing template after =>');
    }

    // Validate variable name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
      throw new Error(`map: invalid variable name "${varName}"`);
    }

    // Process template with $varName$ syntax
    const results: string[] = [];
    
    for (const item of value) {
      // Simple template replacement - replace $varName.property$ patterns
      let rendered = templateStr;
      
      // Handle escaped newlines and tabs FIRST (before variable substitution)
      rendered = rendered.replace(/\\n/g, '\n');
      rendered = rendered.replace(/\\t/g, '\t');
      rendered = rendered.replace(/\\r/g, '\r');
      
      // Handle $varName$ direct replacement
      const directPattern = new RegExp(`\\$${varName}\\$`, 'g');
      rendered = rendered.replace(directPattern, String(item));
      
      // Handle $varName.property$ property access
      const propPattern = new RegExp(`\\$${varName}\\.(\\w+(?:\\.\\w+)*)\\$`, 'g');
      rendered = rendered.replace(propPattern, (match, propPath) => {
        const props = propPath.split('.');
        let current: unknown = item;
        
        for (const prop of props) {
          if (current === null || current === undefined) {
            return '';
          }
          if (typeof current === 'object' && prop in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[prop];
          } else {
            return '';
          }
        }
        
        return String(current ?? '');
      });
      
      results.push(rendered);
    }

    return results;
  },

  /**
   * Join array elements into a string with optional separator.
   * Usage: {array|join} or {array|join#, }
   * @param value - Array to join
   * @param separator - Join separator (defaults to empty string)
   */
  join: (value, separator = '') => {
    if (!Array.isArray(value)) {
      throw new Error('join: value must be an array');
    }
    return value.map(v => String(v)).join(separator);
  },
});

/** Default string conversion function */
const defaultAsString = (v: unknown) => String(v);

/**
 * Resolve a template policy by merging with defaults.
 * Combines built-in filters with custom filters and applies default string conversion.
 *
 * @param policy - Optional custom policy to merge with defaults
 * @returns Resolved policy with all defaults applied
 */
export const resolvePolicy = (policy?: TemplatePolicy): ResolvedPolicy => ({
  filters: { ...builtinFilters, ...(policy?.filters ?? {}) },
  transform: policy?.transform,
  asString: policy?.asString ?? defaultAsString,
});

/**
 * Default template policy with built-in filters and string conversion.
 * This is used as the fallback when no policy is provided.
 */
export const defaultPolicy: TemplatePolicy = Object.freeze({
  filters: builtinFilters,
  asString: defaultAsString,
});
