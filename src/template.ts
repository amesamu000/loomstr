/**
 * Core template implementation for loomstr.
 * Provides the CompiledTemplate class and template compilation functionality.
 */

import type {
  Template,
  SlotKeys,
  ExactParamsFor,
  TemplatePolicy,
  TemplateParts,
  TemplatePartsRaw,
  ResolvedPolicy,
  SlotDescriptor,
} from './types';
import { TEMPLATE_BRAND } from './types';
import { resolvePolicy } from './filters';
import { parseTemplate } from './parser';

/**
 * A compiled template that can be rendered with data.
 * Provides efficient rendering by pre-parsing template structure and caching parsed components.
 *
 * @template S - The literal template string type
 */
export class CompiledTemplate<S extends string> implements Template<S> {
  /** @internal Unique brand to identify template instances */
  readonly [TEMPLATE_BRAND] = true as const;

  /**
   * Create a new compiled template.
   *
   * @param source - The original template string
   * @param chunks - Pre-parsed static text chunks
   * @param slots - Pre-parsed slot descriptors
   * @internal
   */
  constructor(
    public readonly source: S,
    public readonly chunks: readonly string[],
    public readonly slots: readonly SlotDescriptor[]
  ) {}

  /**
   * Evaluate slot values by applying transforms and filters.
   *
   * @param record - Object containing values for template slots
   * @param rp - Resolved policy with transforms and filters
   * @returns Array of processed values ready for rendering
   * @throws Error if required slots are missing or filters fail
   * @internal
   */
  private evaluate(record: Record<string, unknown>, rp: ResolvedPolicy): unknown[] {
    const values: unknown[] = [];
    for (const slot of this.slots) {
      if (!Object.prototype.hasOwnProperty.call(record, slot.name)) {
        throw new Error(`Missing value for slot "${slot.name}"`);
      }
      const raw = record[slot.name];
      const transformed = rp.transform ? rp.transform(slot, raw) : raw;
      if (slot.filter) {
        const f = rp.filters[slot.filter];
        if (!f) throw new Error(`Unknown filter "${slot.filter}"`);
        values.push(f(transformed, ...slot.args));
      } else {
        values.push(transformed);
      }
    }
    return values;
  }

  /**
   * Convert template to parts with processed values.
   * Returns the template structure with evaluated slot values.
   *
   * @param params - Object containing values for template slots
   * @param policy - Optional policy for transforms and custom filters
   * @returns Template parts with chunks, slots, and processed values
   *
   * @example
   * ```typescript
   * const tmpl = loom.compile("Hello {name|upper}!");
   * const parts = tmpl.toParts({ name: "world" });
   * // { chunks: ["Hello ", "!"], slots: [...], values: ["WORLD"] }
   * ```
   */
  toParts<P extends Record<SlotKeys<S>, unknown>>(
    params: ExactParamsFor<S, P>,
    policy?: TemplatePolicy
  ): TemplateParts {
    const rp = resolvePolicy(policy);
    const values = this.evaluate(params as Record<string, unknown>, rp);
    return { chunks: this.chunks.slice(), slots: this.slots.slice(), values };
  }

  /**
   * Convert template to raw parts without processing.
   * Returns the template structure with unprocessed slot values.
   *
   * @param params - Object containing values for template slots
   * @returns Template parts with chunks, slots, and raw values
   *
   * @example
   * ```typescript
   * const tmpl = loom.compile("Hello {name|upper}!");
   * const parts = tmpl.toPartsRaw({ name: "world" });
   * // { chunks: ["Hello ", "!"], slots: [...], values: ["world"] }
   * ```
   */
  toPartsRaw<P extends Record<SlotKeys<S>, unknown>>(
    params: ExactParamsFor<S, P>
  ): TemplatePartsRaw {
    const record = params as Record<string, unknown>;
    const values = this.slots.map(s => record[s.name]);
    return { chunks: this.chunks.slice(), slots: this.slots.slice(), values };
  }

  /**
   * Render the template with provided data.
   * Applies transforms and filters according to the policy, then converts to string.
   *
   * @param params - Object containing values for template slots
   * @param policy - Optional policy for transforms and custom filters
   * @returns Rendered string with all slots replaced
   * @throws Error if required slots are missing or filters fail
   *
   * @example
   * ```typescript
   * const tmpl = loom.compile("Hello {name|upper}!");
   * tmpl.render({ name: "world" }); // "Hello WORLD!"
   * ```
   */
  render<P extends Record<SlotKeys<S>, unknown>>(
    params: ExactParamsFor<S, P>,
    policy?: TemplatePolicy
  ): string {
    const rp = resolvePolicy(policy);
    const values = this.evaluate(params as Record<string, unknown>, rp);
    let out = this.chunks[0] ?? '';
    for (let i = 0; i < this.slots.length; i++) {
      out += rp.asString(values[i]);
      out += this.chunks[i + 1] ?? '';
    }
    return out;
  }
}

/**
 * Compile a template string into a reusable template instance.
 * Parses the template structure once for efficient repeated rendering.
 *
 * @param source - Template string with {slot} patterns
 * @returns Compiled template ready for rendering
 *
 * @example
 * ```typescript
 * const tmpl = compile("Hello {name|upper}!");
 * tmpl.render({ name: "world" }); // "Hello WORLD!"
 * ```
 */
export function compile<S extends string>(source: S): Template<S> {
  const { chunks, slots } = parseTemplate(source);
  return new CompiledTemplate(source, chunks, slots);
}

/**
 * Concatenate two templates into a single template.
 * Combines the source strings and returns a new compiled template.
 *
 * @param a - First template to concatenate
 * @param b - Second template to concatenate
 * @returns New template representing the concatenation
 *
 * @example
 * ```typescript
 * const greeting = compile("Hello {name}");
 * const punctuation = compile("!");
 * const combined = concat(greeting, punctuation);
 * combined.render({ name: "world" }); // "Hello world!"
 * ```
 */
export function concat<A extends string, B extends string>(
  a: Template<A>,
  b: Template<B>
): Template<`${A}${B}`> {
  return compile((a.source + b.source) as `${A}${B}`);
}
