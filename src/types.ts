/** Whitespace characters for trimming */
type WS = ' ' | '\n' | '\r' | '\t';

/** Remove whitespace from the left side of a string type */
type TrimLeft<S extends string> = S extends `${WS}${infer R}` ? TrimLeft<R> : S;

/** Remove whitespace from the right side of a string type */
type TrimRight<S extends string> = S extends `${infer R}${WS}` ? TrimRight<R> : S;

/** Remove whitespace from both sides of a string type */
type Trim<S extends string> = TrimLeft<TrimRight<S>>;

/**
 * Extract slot name from slot body, handling filters and format specifiers.
 * Examples:
 * - "name" -> "name"
 * - "name|filter" -> "name"
 * - "name#format" -> "name"
 * - " name | filter " -> "name"
 */
type SlotNameFromBody<Body extends string> = Body extends `${infer Name}|${string}`
  ? Trim<Name>
  : Body extends `${infer Name}#${string}`
    ? Trim<Name>
    : Trim<Body>;

/**
 * Recursively collect all slot names from a template string.
 * Parses "{name}" patterns and extracts the slot names.
 */
type CollectSlotNames<S extends string> = S extends `${string}{${infer Body}}${infer Rest}`
  ? SlotNameFromBody<Body> | CollectSlotNames<Rest>
  : never;

/** All slot keys as a string union for a given template source S */
export type SlotKeys<S extends string> = CollectSlotNames<S> & string;

/**
 * Enforce exact object keys (no extras) for a given key set K.
 * This prevents passing extra properties that aren't used by the template.
 */
export type ExactParamsForKeys<K extends string, P extends Record<K, unknown>> = P &
  Record<Exclude<keyof P, K>, never>;

/**
 * Enforce exact object keys for a template source S.
 * Ensures the params object has exactly the keys required by the template slots.
 */
export type ExactParamsFor<
  S extends string,
  P extends Record<SlotKeys<S>, unknown>,
> = ExactParamsForKeys<SlotKeys<S>, P>;

/**
 * Filter function that transforms a value with optional arguments.
 * @param value - The input value to transform
 * @param args - Optional string arguments for the filter
 * @returns The transformed value
 */
export type FilterFn = (value: unknown, ...args: string[]) => unknown;

/**
 * Single filter invocation with its arguments inside a slot's filter chain.
 */
export interface FilterDescriptor {
  /** Filter name as referenced in the template (e.g., "upper") */
  readonly name: string;
  /** Arguments supplied to the filter (parsed and trimmed) */
  readonly args: readonly string[];
}

/**
 * Policy configuration for template rendering behavior.
 * Defines custom filters, transforms, and string conversion.
 */
export interface TemplatePolicy {
  /** Custom filter functions accessible via {slot|filter} syntax */
  readonly filters?: Record<string, FilterFn>;
  /** Transform function applied to slot values before filtering */
  readonly transform?: (slot: SlotDescriptor, value: unknown) => unknown;
  /** Custom string conversion function (defaults to String()) */
  readonly asString?: (value: unknown) => string;
}

/**
 * Internal resolved policy with all defaults applied.
 * Used internally during template rendering.
 */
export interface ResolvedPolicy {
  /** Merged filters (built-in + custom) */
  readonly filters: Record<string, FilterFn>;
  /** Transform function (optional) */
  readonly transform?: (slot: SlotDescriptor, value: unknown) => unknown;
  /** String conversion function (always present) */
  readonly asString: (value: unknown) => string;
}

/**
 * Describes a template slot with its name, filter chain, and arguments.
 * Parsed from patterns like {name|filter#arg1,arg2}
 */
export interface SlotDescriptor {
  /** The slot name (e.g., "user" from "{user|upper}") */
  readonly name: string;
  /** The filter name if present (e.g., "upper" from "{user|upper}") */
  readonly filter?: string;
  /**
   * Legacy alias for the first filter's arguments.
   * For chained filters this mirrors filters[0].args for backward compatibility.
   */
  readonly args: readonly string[];
  /** Ordered filter chain applied to the slot value (includes the first filter) */
  readonly filters?: readonly FilterDescriptor[];
}

/**
 * Template parts with processed values after transforms and filters.
 * Used for rendering the final output.
 */
export interface TemplateParts {
  /** Static text chunks between slots */
  readonly chunks: readonly string[];
  /** Slot descriptors with metadata */
  readonly slots: readonly SlotDescriptor[];
  /** Values after transform/filter application (pre-stringify) */
  readonly values: readonly unknown[];
}

/**
 * Template parts with raw unprocessed values.
 * Used for inspection and debugging.
 */
export interface TemplatePartsRaw {
  /** Static text chunks between slots */
  readonly chunks: readonly string[];
  /** Slot descriptors with metadata */
  readonly slots: readonly SlotDescriptor[];
  /** Raw values from params (no transform/filter applied) */
  readonly values: readonly unknown[];
}

/** Unique symbol for template branding to prevent duck typing */
const TEMPLATE_BRAND: unique symbol = Symbol('loomstr.template');

export { TEMPLATE_BRAND };
export type { TEMPLATE_BRAND as TEMPLATE_BRAND_TYPE };

/**
 * Compiled template interface with type-safe parameter requirements.
 * Provides rendering and introspection capabilities.
 *
 * @template S - The template source string type
 */
export interface Template<S extends string> {
  /** Original template source string */
  readonly source: S;
  /** Static text chunks between slots */
  readonly chunks: readonly string[];
  /** Parsed slot descriptors */
  readonly slots: readonly SlotDescriptor[];

  /**
   * Render the template with the given parameters and optional policy.
   * @param params - Object with values for all template slots
   * @param policy - Optional rendering policy for filters/transforms
   * @returns Rendered string
   */
  render<P extends Record<SlotKeys<S>, unknown>>(
    params: ExactParamsFor<S, P>,
    policy?: TemplatePolicy
  ): string;

  /**
   * Get template parts with processed values (after transforms/filters).
   * @param params - Object with values for all template slots
   * @param policy - Optional rendering policy for filters/transforms
   * @returns Template parts with processed values
   */
  toParts<P extends Record<SlotKeys<S>, unknown>>(
    params: ExactParamsFor<S, P>,
    policy?: TemplatePolicy
  ): TemplateParts;

  /**
   * Get template parts with raw unprocessed values.
   * @param params - Object with values for all template slots
   * @returns Template parts with raw values (no transforms/filters)
   */
  toPartsRaw<P extends Record<SlotKeys<S>, unknown>>(
    params: ExactParamsFor<S, P>
  ): TemplatePartsRaw;

  /** Brand for nominal typing */
  readonly [TEMPLATE_BRAND]: true;
}

/**
 * Template with some parameters pre-bound, requiring only remaining parameters.
 * Created by the bind() function for partial application scenarios.
 *
 * @template S - The original template source string type
 * @template R - The remaining (unbound) parameter keys
 */
export interface BoundTemplate<S extends string, R extends string> {
  /** Original template source string */
  readonly source: S;
  /** Static text chunks between slots */
  readonly chunks: readonly string[];
  /** Parsed slot descriptors */
  readonly slots: readonly SlotDescriptor[];

  /**
   * Render the bound template with only the remaining parameters.
   * @param params - Object with values for unbound slots only
   * @param policy - Optional rendering policy for filters/transforms
   * @returns Rendered string
   */
  render<P extends Record<R, unknown>>(
    params: ExactParamsForKeys<R, P>,
    policy?: TemplatePolicy
  ): string;

  /**
   * Get template parts with processed values for the bound template.
   * @param params - Object with values for unbound slots only
   * @param policy - Optional rendering policy for filters/transforms
   * @returns Template parts with processed values
   */
  toParts<P extends Record<R, unknown>>(
    params: ExactParamsForKeys<R, P>,
    policy?: TemplatePolicy
  ): TemplateParts;

  /**
   * Get template parts with raw unprocessed values for the bound template.
   * @param params - Object with values for unbound slots only
   * @returns Template parts with raw values (no transforms/filters)
   */
  toPartsRaw<P extends Record<R, unknown>>(params: ExactParamsForKeys<R, P>): TemplatePartsRaw;

  /** Brand for nominal typing */
  readonly [TEMPLATE_BRAND]: true;
}
