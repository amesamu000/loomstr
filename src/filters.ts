/**
 * Built-in filters and policy management for loomstr templates.
 * This module provides default filters and utilities for resolving template policies.
 */

import type { FilterFn, TemplatePolicy, ResolvedPolicy } from './types';

/**
 * Built-in filter functions available in all templates.
 * These filters can be used with the {slot|filter} syntax.
 *
 * Available filters:
 * - `upper`: Convert to uppercase
 * - `lower`: Convert to lowercase
 * - `json`: JSON stringify the value (optionally pretty-print with {slot|json#2})
 * - `path`: Extract nested properties using dot notation with optional fallback
 * - `pad`: Right-pad with character to specified length
 * - `fixed`: Format number to fixed decimal places
 */
export const builtinFilters: Record<string, FilterFn> = Object.freeze({
  /** Convert value to uppercase string */
  upper: v => String(v).toUpperCase(),

  /** Convert value to lowercase string */
  lower: v => String(v).toLowerCase(),

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
