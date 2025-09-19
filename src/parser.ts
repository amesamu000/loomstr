import type { SlotDescriptor } from './types';

const freeze = <T extends object>(o: T): T => Object.freeze(o);

const isIdentStart = (c: number) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95; // A-Z a-z _
const isIdent = (c: number) => isIdentStart(c) || (c >= 48 && c <= 57); // + 0-9

/** Parse a single slot body: name[|filter][#arg1,arg2,...]
 * Supports:
 *  - name, filter: identifier-ish (letters/digits/_). Trim around them is allowed.
 *  - args: comma-separated; allow quoted ('', "") and backslash escapes; empty args ok.
 */
function parseSlotBody(body: string): SlotDescriptor {
  let i = 0;
  const n = body.length;

  // skip leading spaces
  while (i < n && body.charCodeAt(i) <= 32) i++;

  // name
  const ns = i;
  if (i >= n || !isIdentStart(body.charCodeAt(i))) {
    throw new Error(`Invalid slot: missing/invalid name in {${body}}`);
  }
  i++;
  while (i < n && isIdent(body.charCodeAt(i))) i++;
  let name = body.slice(ns, i);

  // optional whitespace
  while (i < n && body.charCodeAt(i) <= 32) i++;

  let filter: string | undefined;
  let args: string[] = [];

  // optional |filter
  if (i < n && body.charCodeAt(i) === 124 /* '|' */) {
    i++;
    while (i < n && body.charCodeAt(i) <= 32) i++;
    const fs = i;
    if (i >= n || !isIdentStart(body.charCodeAt(i))) {
      throw new Error(`Invalid slot: missing/invalid filter in {${body}}`);
    }
    i++;
    while (i < n && isIdent(body.charCodeAt(i))) i++;
    filter = body.slice(fs, i);
    while (i < n && body.charCodeAt(i) <= 32) i++;
  }

  // optional #args
  if (i < n && body.charCodeAt(i) === 35 /* '#' */) {
    if (!filter) {
      throw new Error(`Invalid slot: args provided without filter in {${body}}`);
    }
    i++;
    while (i < n && body.charCodeAt(i) <= 32) i++;

    const out: string[] = [];
    let cur = '';
    let inQuote: number | null = null; // 39 or 34
    let escaped = false;

    while (i < n) {
      const ch = body.charCodeAt(i);

      if (escaped) {
        // accept any escaped char literally
        cur += body[i];
        escaped = false;
        i++;
        continue;
      }

      if (ch === 92 /* '\' */) {
        escaped = true;
        i++;
        continue;
      }

      if (inQuote) {
        if (ch === inQuote) {
          inQuote = null;
          i++;
        } else {
          cur += body[i++];
        }
        continue;
      }

      // not in quote
      if (ch === 39 /* ' */ || ch === 34 /* " */) {
        inQuote = ch;
        i++;
        continue;
      }
      if (ch === 44 /* ',' */) {
        out.push(cur.trim());
        cur = '';
        i++;
        // allow spaces after comma
        while (i < n && body.charCodeAt(i) <= 32) i++;
        continue;
      }

      cur += body[i++];
    }

    // push last
    out.push(cur.trim());
    args = out;
  }

  // trailing spaces allowed
  while (i < n && body.charCodeAt(i) <= 32) i++;
  if (i !== n) {
    throw new Error(`Invalid slot: unexpected trailing content in {${body}}`);
  }

  return freeze({ name, filter, args: freeze(args) });
}

/** Main parser: splits into chunks and slots
 * Supports escaping in text:
 *   - \\  -> \
 *   - \{  -> literal '{'
 *   - \}  -> literal '}'
 */
export const parseTemplate = (source: string) => {
  const chunks: string[] = [];
  const slots: SlotDescriptor[] = [];

  let i = 0;
  const n = source.length;
  let buf = ''; // current text buffer

  while (i < n) {
    const ch = source.charCodeAt(i);

    if (ch === 92 /* '\' */) {
      // escape in text
      if (i + 1 < n) {
        const next = source[i + 1];
        if (next === '{' || next === '}' || next === '\\') {
          buf += next;
          i += 2;
          continue;
        }
      }
      // lone backslash
      buf += source[i++];
      continue;
    }

    if (ch === 123 /* '{' */) {
      // flush text
      if (buf) {
        chunks.push(buf);
        buf = '';
      }
      // find matching }
      i++;
      const start = i;
      let depth = 1;
      while (i < n) {
        const c = source.charCodeAt(i);
        if (c === 92 /* '\' */) {
          // skip escaped char inside slot body literally
          i += 2;
          continue;
        }
        if (c === 123 /* '{' */) {
          // nested braces are not allowed in this grammar; error out
          throw new Error(`Invalid template: nested '{' at ${i} in "${source.slice(start - 1)}"`);
        }
        if (c === 125 /* '}' */) {
          depth--;
          if (depth === 0) break;
        }
        i++;
      }
      if (i >= n || source.charCodeAt(i) !== 125 /* '}' */) {
        throw new Error(`Invalid template: unmatched '{' at index ${start - 1}`);
      }

      const body = source.slice(start, i);
      slots.push(parseSlotBody(body));
      i++; // skip '}'
      continue;
    }

    // normal text
    buf += source[i++];
  }

  if (buf) chunks.push(buf);

  return freeze({
    chunks: freeze(chunks),
    slots: freeze(slots),
  });
};
