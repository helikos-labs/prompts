# JSON output: schema first, loose parsing as the fallback

## Schema-constrained output

Where the API supports JSON-schema output (Claude: `output_config.format`, or `strict: true` on a tool), write each stage's `{{json_shape}}` as a JSON schema and pass that. The reply is then valid JSON in that shape, so the parser and retry below become a fallback. Small per-stage schemas compile where one whole-document schema may not: an API can reject a large schema as too complex. Set `additionalProperties: false` on every object and list every field in `required` (fields left out of it count toward a limit of 24 optional parameters per request). Allow `null` only where the prompt lets the model return it, and prefer `""` for strings: each nullable field counts toward the API's limit of 16 union-typed parameters per request. Claude's structured outputs reject `minimum`, `maximum`, `minLength` and `maxLength` (a raw schema that includes them gets a 400; most SDK helpers strip them from the schema and check the reply against them), so code still checks every limit. Keep the loose parser and the retry for models without schema output.

A schema does not stop a reply being cut off at the token limit. Check the stop reason on every call (below).

## Loose parsing

Models without schema output return JSON wrapped in code fences, with a sentence before or after it, or with trailing commas. Parse strictly first, repair second, and retry the model once. Fail after the second bad reply.

```ts
/** Fixes common defects in model JSON: empty values, doubled, leading and trailing commas, and output cut off mid-object. */
export function repairJson(input: string): string {
  let t = input
    .replace(/:\s*(?=[,}\]])/g, ': null') // "a": ,   -> "a": null
    .replace(/,\s*,/g, ',') //               1,,2     -> 1,2
    .replace(/\[\s*,/g, '[') //              [,1      -> [1
    .replace(/,\s*(?=[}\]])/g, '') //        1,]      -> 1]

  // Truncated output: cut back to the last complete value and close whatever is still open.
  const stack: string[] = []
  let inString = false
  let escaped = false
  let safe = { pos: 0, open: [] as string[] }
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (inString) {
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') inString = true
    else if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']')
    else if (c === '}' || c === ']') {
      stack.pop()
      safe = { pos: i + 1, open: [...stack] }
    } else if (c === ',') safe = { pos: i, open: [...stack] }
  }
  if (stack.length || inString) {
    t = t.slice(0, safe.pos).replace(/,\s*$/, '') + safe.open.reverse().join('')
    t = t.replace(/,\s*(?=[}\]])/g, '')
  }
  return t
}

/** Where the object that opens at `start` closes, skipping brackets inside strings; -1 if it never closes. */
function closingBrace(text: string, start: number): number {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === '"') inString = false
    } else if (c === '"') inString = true
    else if (c === '{' || c === '[') depth++
    else if ((c === '}' || c === ']') && --depth === 0) return i
  }
  return -1
}

/** The first JSON object in a model reply. Tolerates code fences, prose before or after it, and small defects. */
export function parseJsonLoose(text: string): unknown {
  try {
    return JSON.parse(text.trim()) // a clean reply needs no extraction
  } catch {
    // extract and repair below
  }
  // Fences and prose sit outside the object, so start at the first brace and end where it closes.
  const start = text.indexOf('{')
  if (start < 0) throw new Error('No JSON object in the reply.')
  const end = closingBrace(text, start)
  const body = end < 0 ? text.slice(start) : text.slice(start, end + 1) // never closes: cut off, so repair closes it
  for (const candidate of [body, repairJson(body)]) {
    try {
      return JSON.parse(candidate)
    } catch {
      // try the next candidate
    }
  }
  throw new Error('The reply is not valid JSON, even after repair.')
}
```

The regular expressions in `repairJson` can also touch text inside strings (an empty value after a colon in a sentence). They run only after a strict parse has failed, which makes that rare.

## One retry, and no repair for cut-off replies

Keep the bad reply in the conversation and add one fixed instruction. A fresh call without the bad reply tends to repeat the same mistake.

A reply that stopped at max tokens is a different failure. `repairJson` would close it into a valid object that just lacks its last units or fields, and code would then report thin units and spend a repair round on them. So the caller checks the stop reason first and never parses a cut-off reply.

```ts
const RETRY_NOTE = 'That reply was not one valid JSON object. Return only the JSON object, nothing else.'

type Message = { role: 'user' | 'assistant'; content: string }
/** What your model client returns: the reply text and why it stopped (Claude's stop_reason). */
type Reply = { text: string; stopReason: string | null }

/** A reply that hit max tokens. Repair would close it into a valid but thinner object, so it is never parsed. */
export class TruncatedReply extends Error {}

export async function callJson(
  complete: (system: string, messages: Message[], maxTokens: number) => Promise<Reply>, // your model client
  system: string,
  prompt: string,
  maxTokens: number,
): Promise<unknown> {
  const messages: Message[] = [{ role: 'user', content: prompt }]
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text, stopReason } = await complete(system, messages, maxTokens)
    if (stopReason === 'max_tokens') throw new TruncatedReply(`The reply hit the ${maxTokens}-token limit.`)
    try {
      return parseJsonLoose(text)
    } catch {
      messages.push({ role: 'assistant', content: text || '(no text)' }, { role: 'user', content: RETRY_NOTE })
    }
  }
  throw new Error('The model returned malformed JSON twice. Try again.')
}
```

## Split a chunk that hits the limit

When a reply is cut off, split the chunk in half and call each half, in order so the second half's `Already used` list includes the first half's items. Log each split: frequent splits mean the per-unit token allowance is too small. A single unit that still hits the limit needs a larger allowance.

```ts
/** Runs one chunk of units. If a reply is cut off, logs it, splits the chunk in half and runs each half in order. */
export async function runChunk<U, R>(
  units: U[],
  call: (units: U[]) => Promise<R>, // builds the prompt and max tokens for these units, then calls callJson
  log: (message: string) => void,
): Promise<R[]> {
  try {
    return [await call(units)]
  } catch (e) {
    if (!(e instanceof TruncatedReply) || units.length < 2) throw e
    log(`A chunk of ${units.length} units hit the token limit; splitting it in two.`)
    const half = Math.ceil(units.length / 2)
    return [...(await runChunk(units.slice(0, half), call, log)), ...(await runChunk(units.slice(half), call, log))]
  }
}
```

Track the cost of every attempt and split.
