/**
 * Utility functions for loomstr templates.
 * Provides binding, validation, safe rendering, and formatting capabilities.
 */

import type {
  Template,
  SlotKeys,
  ExactParamsFor,
  ExactParamsForKeys,
  TemplatePolicy,
  BoundTemplate,
} from './types';
import { TEMPLATE_BRAND } from './types';
import { resolvePolicy } from './filters';
import { CompiledTemplate } from './template';

/**
 * List slot names in order, deduplicated by first occurrence.
 * Extracts all unique slot names from a template for inspection and validation.
 *
 * @param t - The template to extract slot names from
 * @returns Readonly array of unique slot names in order of first appearance
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}, you have {count} messages, {name}!");
 * slotNames(tmpl); // ["name", "count"]
 * ```
 */
export function slotNames<S extends string>(t: Template<S>): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of t.slots)
    if (!seen.has(s.name)) {
      seen.add(s.name);
      out.push(s.name);
    }
  return Object.freeze(out);
}

/**
 * Check if a template contains a specific slot name.
 * Useful for conditional logic based on template structure.
 *
 * @param t - The template to check
 * @param name - The slot name to look for
 * @returns True if the template contains the named slot
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}!");
 * hasSlot(tmpl, "name"); // true
 * hasSlot(tmpl, "age"); // false
 * ```
 */
export function hasSlot<S extends string>(t: Template<S>, name: string): boolean {
  return t.slots.some(s => s.name === name);
}

/**
 * Find keys missing from provided parameters (runtime check).
 * Identifies which required slots are not present in the data object.
 *
 * @param t - The template requiring slots
 * @param params - The parameter object to check
 * @returns Readonly array of missing slot names
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}, you have {count} messages");
 * missingKeys(tmpl, { name: "Alice" }); // ["count"]
 * missingKeys(tmpl, { name: "Alice", count: 5 }); // []
 * ```
 */
export function missingKeys<S extends string, P extends Record<string, unknown>>(
  t: Template<S>,
  params: P
): readonly string[] {
  const missing: string[] = [];
  const set = new Set(Object.keys(params));
  for (const s of slotNames(t)) if (!set.has(s)) missing.push(s);
  return Object.freeze(missing);
}

/**
 * Find extra keys present that are not used by the template (runtime check).
 * Identifies unused properties in the data object that don't correspond to slots.
 *
 * @param t - The template with defined slots
 * @param params - The parameter object to check
 * @returns Readonly array of unused property names
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}!");
 * extraKeys(tmpl, { name: "Alice", age: 30 }); // ["age"]
 * extraKeys(tmpl, { name: "Alice" }); // []
 * ```
 */
export function extraKeys<S extends string, P extends Record<string, unknown>>(
  t: Template<S>,
  params: P
): readonly string[] {
  const used = new Set(slotNames(t));
  const extra: string[] = [];
  for (const k of Object.keys(params)) if (!used.has(k)) extra.push(k);
  return Object.freeze(extra);
}

/**
 * Validate parameters: report both missing and extra keys (runtime check).
 * Comprehensive validation that checks for both missing required slots and unused properties.
 *
 * @param t - The template to validate against
 * @param params - The parameter object to validate
 * @returns Validation result with ok status, missing keys, and extra keys
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}!");
 * validate(tmpl, { name: "Alice", age: 30 });
 * // { ok: false, missing: [], extra: ["age"] }
 * validate(tmpl, { name: "Alice" });
 * // { ok: true, missing: [], extra: [] }
 * ```
 */
export function validate<S extends string, P extends Record<string, unknown>>(
  t: Template<S>,
  params: P
): { ok: boolean; missing: readonly string[]; extra: readonly string[] } {
  const miss = missingKeys(t, params);
  const extra = extraKeys(t, params);
  return { ok: miss.length === 0 && extra.length === 0, missing: miss, extra };
}

/**
 * Try to render a template without throwing exceptions.
 * Provides safe rendering with error handling for robust template processing.
 *
 * @param t - The template to render
 * @param params - Object containing values for template slots
 * @param policy - Optional policy for transforms and custom filters
 * @returns Result object with either success value or error details
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}!");
 * const result = tryRender(tmpl, { name: "world" });
 * if (result.ok) {
 *   console.log(result.value); // "Hello world!"
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function tryRender<S extends string, P extends Record<SlotKeys<S>, unknown>>(
  t: Template<S>,
  params: ExactParamsFor<S, P>,
  policy?: TemplatePolicy
): { ok: true; value: string } | { ok: false; error: Error } {
  try {
    return { ok: true, value: t.render(params, policy) };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}

/**
 * Stream-like formatter to a sink (e.g., for building buffers).
 * Renders template parts to a sink object for custom output handling.
 *
 * @param t - The template to format
 * @param params - Object containing values for template slots
 * @param policy - Optional policy for transforms and custom filters
 * @param sink - Output sink with text and value methods
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}!");
 * const output: string[] = [];
 * const sink = {
 *   text: (chunk: string) => output.push(`TEXT:${chunk}`),
 *   value: (v: string) => output.push(`VALUE:${v}`)
 * };
 * formatTo(tmpl, { name: "world" }, undefined, sink);
 * // output: ["TEXT:Hello ", "VALUE:world", "TEXT:!"]
 * ```
 */
export function formatTo<S extends string, P extends Record<SlotKeys<S>, unknown>>(
  t: Template<S>,
  params: ExactParamsFor<S, P>,
  policy: TemplatePolicy | undefined,
  sink: { text(chunk: string): void; value(v: string): void }
): void {
  const rp = resolvePolicy(policy);
  const parts = t.toParts(params, rp);
  sink.text(parts.chunks[0] ?? '');
  for (let i = 0; i < parts.slots.length; i++) {
    sink.value(rp.asString(parts.values[i]));
    sink.text(parts.chunks[i + 1] ?? '');
  }
}

/**
 * Bind some parameters to a template; returned template only asks for the rest.
 * Enables partial application and creation of reusable template configurations.
 *
 * @param t - The template to bind parameters to
 * @param bound - Object with values for some of the template slots
 * @param defaultPolicy - Optional default policy for the bound template
 * @returns New bound template requiring only the remaining slots
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}, you have {count} messages from {sender}");
 * const boundTmpl = bind(tmpl, { name: "Alice", sender: "Bob" });
 * boundTmpl.render({ count: 5 }); // "Hello Alice, you have 5 messages from Bob"
 * ```
 */
export function bind<
  S extends string,
  PB extends Partial<Record<SlotKeys<S>, unknown>>,
  R extends Exclude<SlotKeys<S>, keyof PB> = Exclude<SlotKeys<S>, keyof PB>,
>(
  t: Template<S>,
  bound: ExactParamsForKeys<
    Extract<keyof PB, string>,
    PB & Record<Extract<keyof PB, string>, unknown>
  >,
  defaultPolicy?: TemplatePolicy
): BoundTemplate<S, R> {
  const base = t as any as CompiledTemplate<S>;
  const source = t.source,
    chunks = t.chunks,
    slots = t.slots;

  function mergedParams(rest: Record<string, unknown>): Record<string, unknown> {
    return { ...bound, ...rest };
  }

  return {
    source,
    chunks,
    slots,
    [TEMPLATE_BRAND]: true as const,

    render(params, policy) {
      const rp = resolvePolicy(policy ?? defaultPolicy);
      const values = base['evaluate'](mergedParams(params as any), rp);
      let out = chunks[0] ?? '';
      for (let i = 0; i < slots.length; i++) {
        out += rp.asString(values[i]);
        out += chunks[i + 1] ?? '';
      }
      return out;
    },

    toParts(params, policy) {
      const rp = resolvePolicy(policy ?? defaultPolicy);
      const values = base['evaluate'](mergedParams(params as any), rp);
      return { chunks: chunks.slice(), slots: slots.slice(), values };
    },

    toPartsRaw(params) {
      const rec = mergedParams(params as any);
      const values = slots.map(s => rec[s.name]);
      return { chunks: chunks.slice(), slots: slots.slice(), values };
    },
  };
}

/**
 * Wrap a template with a default policy so callers don't have to pass one.
 * Creates a bound template that applies a default policy automatically.
 *
 * @param t - The template to wrap with a default policy
 * @param defaultPolicy - The policy to apply by default
 * @returns Bound template that uses the default policy
 *
 * @example
 * ```typescript
 * const tmpl = loom.compile("Hello {name}!");
 * const policy = { filters: { upper: (v: any) => String(v).toUpperCase() } };
 * const wrappedTmpl = withDefaultPolicy(tmpl, policy);
 * wrappedTmpl.render({ name: "world" }); // Uses the default policy
 * ```
 */
export function withDefaultPolicy<S extends string>(
  t: Template<S>,
  defaultPolicy: TemplatePolicy
): BoundTemplate<S, never> {
  return bind<S, {}>(t, {} as any, defaultPolicy) as BoundTemplate<S, never>;
}
