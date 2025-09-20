import type { SlotDescriptor } from './types';

const freeze = <T extends object>(o: T): T => Object.freeze(o);
const EMPTY_ARGS = freeze([] as string[]);

const isIdentStart = (c: number) =>
  (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95; // A-Z a-z _
const isIdent = (c: number) => isIdentStart(c) || (c >= 48 && c <= 57); // + 0-9

interface FilterSegment {
  name: string;
  args: string[];
}

/** Decode standard escapes for TEXT (outside slots). */
function decodeTextEscape(next: string): string {
  switch (next) {
    case 'n': return '\n';
    case 'r': return '\r';
    case 't': return '\t';
    case 'b': return '\b';
    case 'f': return '\f';
    case 'v': return '\v';
    case '0': return '\0';
    case '\\': return '\\';
    case '{': return '{';
    case '}': return '}';
    case '"': return '"';
    case "'": return "'";
    default: return next; // unknown becomes literal (e.g. "\," -> ",")
  }
}

/** Decode a single escape in ARGS (slightly broader: also allows comma, hash) */
function decodeArgEscape(next: string): string {
  switch (next) {
    case ',': return ',';
    case '#': return '#';
    default: return decodeTextEscape(next);
  }
}

/** Parse a single slot body with possible chained filters:
 *   name ( '|' ident ( '#' args )? )*
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
  const name = body.slice(ns, i);

  // optional whitespace
  while (i < n && body.charCodeAt(i) <= 32) i++;

  const filters: FilterSegment[] = [];

  // zero or more |filter[#args]
  while (i < n && body.charCodeAt(i) === 124 /* '|' */) {
    i++;
    while (i < n && body.charCodeAt(i) <= 32) i++;

    const fs = i;
    if (i >= n || !isIdentStart(body.charCodeAt(i))) {
      throw new Error(`Invalid slot: missing/invalid filter in {${body}}`);
    }
    i++;
    while (i < n && isIdent(body.charCodeAt(i))) i++;
    const filterName = body.slice(fs, i);

    while (i < n && body.charCodeAt(i) <= 32) i++;

    let args: string[] = EMPTY_ARGS;

    if (i < n && body.charCodeAt(i) === 35 /* '#' */) {
      i++;
      while (i < n && body.charCodeAt(i) <= 32) i++;

      const out: string[] = [];
      let cur = '';
      let inQuote: number | null = null; // 34 or 39
      let escaped = false;
      let quotedThisArg = false;
      let argPushed = false;

      const pushArg = () => {
        let result;
        if (quotedThisArg) {
          // preserve spaces and decode escapes
          result = decodeArgString(cur);
          out.push(result);
        } else {
          // Only trim if there are no escape sequences that could be meaningful whitespace
          const processed = decodeArgString(cur);
          const trimmed = decodeArgString(cur.trim());
          // If decoding changed the length significantly, don't trim
          result = (processed.length !== trimmed.length) ? processed : trimmed;
          out.push(result);
        }
        cur = '';
        quotedThisArg = false;
      };

      while (i < n) {
        const ch = body.charCodeAt(i);

        if (escaped) {
          cur += decodeArgEscape(body[i]);
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

        if (ch === 34 /* " */ || ch === 39 /* ' */) {
          inQuote = ch;
          quotedThisArg = true;
          i++;
          continue;
        }

        if (ch === 44 /* ',' */) {
          pushArg();
          // skip spaces after comma
          i++;
          while (i < n && body.charCodeAt(i) <= 32) i++;
          continue;
        }

        if (ch === 124 /* '|' */) {
          // Found next filter in chain, push current arg and break
          pushArg();
          argPushed = true;
          break;
        }

        cur += body[i++];
      }

      if (!argPushed) {
        pushArg();
      }
      args = out.length ? freeze(out) : EMPTY_ARGS;
    }

    filters.push({ name: filterName, args });
    while (i < n && body.charCodeAt(i) <= 32) i++;
  }

  if (!filters.length && i < n && body.charCodeAt(i) === 35 /* '#' */) {
    throw new Error(`Invalid slot: args provided without filter in {${body}}`);
  }

  // trailing spaces allowed
  while (i < n && body.charCodeAt(i) <= 32) i++;
  if (i !== n) {
    throw new Error(`Invalid slot: unexpected trailing content in {${body}}`);
  }

  if (!filters.length) {
    return freeze({ name, args: EMPTY_ARGS });
  }

  const chain = freeze(filters.map(f => freeze({ name: f.name, args: f.args })));

  return freeze({
    name,
    filter: chain[0]!.name,
    args: chain[0]!.args,
    filters: chain,
  });
}

function decodeArgString(s: string): string {
  if (s.indexOf('\\') === -1) return s;
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c !== 92 /* '\' */ || i + 1 >= s.length) { out += s[i]; continue; }
    out += decodeArgEscape(s[++i]);
  }
  return out;
}

/** Main parser: splits into chunks and slots; decodes text escapes (\n, \t, \{, \}, \\) */
export const parseTemplate = (source: string) => {
  const chunks: string[] = [];
  const slots: SlotDescriptor[] = [];

  let i = 0;
  const n = source.length;
  let buf = ''; // current text buffer

  while (i < n) {
    const ch = source.charCodeAt(i);

    if (ch === 92 /* '\' */) {
      // decode known escapes in TEXT
      if (i + 1 < n) {
        buf += decodeTextEscape(source[i + 1]);
        i += 2;
        continue;
      }
      // lone trailing backslash
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
        if (c === 92 /* '\' */) { i += 2; continue; } // skip escaped char inside slot body
        if (c === 123 /* '{' */) {
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
