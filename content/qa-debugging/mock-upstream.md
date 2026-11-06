---
title: A local mock LLM API where a typed word triggers each failure
summary: Claude Code builds a dev fake of your LLM API that streams the real wire format and fails on cue, from a 401 to a cut stream, when a trigger word is typed into the app.
category: qa-debugging
tags: [testing, mocking, streaming, playwright]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: intermediate
use_as: claude-code
---

## The prompt

Run it in Claude Code at the root of an app that calls an LLM API. Fill in the provider, the stack and any failure modes only your app has: one `- "word": what the mock does` line per trigger, or `none`.

```text
Build a local fake of {{provider}}, for this app to point at in development. Every failure the app must handle should be reproducible by typing a trigger word into the app's own input: no API key, no network, no cost.

First read how the app ({{app_stack}}) calls the API: base URL, auth header, request body, streaming or not, timeouts and retries, where the user's input lands in the request, and how each error reaches the user today. Then build the following.

1. The mock: dev/mock-upstream.mjs
- One file, plain Node 22, no dependencies. Listen on 127.0.0.1 only. Port from MOCK_PORT, delay between chunks from MOCK_DELAY_MS.
- Match the real API exactly: paths, methods, status codes, headers, error bodies and error type names, and the streaming event sequence and framing. For the Anthropic Messages API that is message_start, content_block_start, ping, content_block_delta (text_delta), content_block_stop, message_delta (stop_reason, usage), message_stop, each written as "event: <name>\ndata: <json>\n\n". When thinking is on (the request asks for it, or leaves out the thinking field on a model that thinks by default), a thinking block comes first: with display "omitted" (the default on current models), one empty thinking_delta, then a signature_delta. The text block is then index 1. The app's SDK or parser must not be able to tell the mock from the real thing.
- With no trigger word, stream a good answer: the app's own sample or fixture output whose file name best matches the input, else a short built-in one, so the mock works in a fresh checkout. Split it into 40–80 character deltas on code-point boundaries, seeded from a hash of the input, so the same input always streams the same way.
- Answer a request with no auth header with the provider's 401. Serve the non-streaming form too if the app uses it.
- Log one line per request: path, status, mode, which sample it streamed, and the shape of the call (model, stream, max tokens, thinking or effort settings, beta headers, system and user sizes, cache markers). Never log the key.
- Stop writing when the client disconnects. An exception in a handler returns the provider's 500 error body or, once streaming has started, its error event: never a hung socket.

2. Trigger words
Read them only from the user's own text in the request (for example the line of the user message that holds what the user typed): case-insensitive, whole words, first match in the list wins. Never match against the system prompt or the whole body: they can contain "400" or "drop" by accident.
- "401": HTTP 401 with the provider's authentication error.
- "429": HTTP 429 rate-limit error with retry-after. If the SDK retries on its own, add the header that stops it (Anthropic: x-should-retry: false), or every test waits through backoff.
- "400": HTTP 400 invalid-request error.
- "529" and "500": the provider's overloaded and server errors as HTTP statuses, before any stream, with the same no-retry header.
- "overload": a few lines of the good answer, then the provider's mid-stream error event (Anthropic: event: error with overloaded_error). No stop event.
- "drop": a few lines, then destroy the socket. No error event, no stop event.
- "slow": hold the first byte for MOCK_SLOW_MS, longer than the app's upstream timeout. Make that timeout an env var so the test can shorten both. If the app has no timeout of its own, add one. If the SDK retries timeouts, turn retries off in the test env.
- "malformed": a few lines, then a data line that is not valid JSON.
Add these app-specific triggers too:
{{failure_modes}}
Mid-stream failures always come after real content, so the UI has a half-written answer to deal with. If the app falls back through a list of models, add a trigger that fails only the first model, so the fall-through runs. If the app calls other upstreams (search, retrieval, a second provider), mock them in the same file with their own triggers, such as "missing" for no result.

3. Wiring
- The app reads the base URL from an env var (for Anthropic, ANTHROPIC_BASE_URL) and uses the real host when it is unset. The mock's URL never appears in app code.
- Commit an example env file that points at the mock with an obviously fake key, so a copy of it runs against the mock as written, and git-ignore the copy. To call the real API locally, delete the base-URL line in the copy and add a real key. In production the key lives in the host's secret store, never in a file.

4. Tests
- One end-to-end test per trigger word, through the real UI (Playwright if there is a browser front end, else the app's own HTTP endpoint): start the mock on a free port, start the app pointed at it, enter the trigger, assert what the user sees.
- After each failure, assert nothing was cached or saved: send the same input again and check the mock logged it a second time. Then assert that a normal input succeeds.
- If the app caches good answers, clear the cache between tests: a cached answer never reaches the mock.
- If the app rate-limits, gates or bot-checks its own users, give the tests a documented way past it (a separate client IP or access code per test, a bot check mocked in the same file that passes a known token) and list it under the gotchas.
- Fix what the tests expose in the app, never by bending the mock.

5. Docs: a "Running against the mock" section in the dev README
- The commands to run the app against the mock.
- A table with one row per trigger word: trigger | what the mock does | what the user should see. The tests and the table cover the same rows.
- Two or three curl checks, and the gotchas: caching, the app's own rate limit or gates, and restarting the app after editing the env file.

Finish by starting the mock and the app pointed at it (from the example env file). Curl one normal request and one trigger word through the app's own endpoint and show what the client receives, then add one raw curl against the mock with its output.
```

## Example

**Input**:
- `provider`: the Anthropic Messages API, streaming over SSE
- `app_stack`: a plain Node http server, `server.mjs`, that calls the API with `fetch` and streams the recipe text to one HTML page as NDJSON
- `failure_modes`: `- "cutoff": a good answer that stops halfway with stop_reason "max_tokens".`
- The repo: a small recipe-card app with `server.mjs`, `public/index.html` and two sample answers in `samples/`, and no tests yet. The dish the user types goes into the request as a `Dish:` line. The server hard-codes the API host, caches finished recipes in memory, and has a 30-second upstream timeout.

**Output** (trimmed: the opening, two of the failures it found in the app, four rows of the README's trigger table, then the closing run's `overload` request through the app and the mock's log line for it):

> I built the mock, wired the app to it, wrote the README section and the Playwright test file. … The Playwright tests haven't been run: Playwright isn't installed here. …
>
> - **Half cards were saved:** a mid-stream overload error was ignored and a card stopped by `max_tokens` was treated as finished. Both were cached and marked done, so the next request for that dish returned the half card. Only a card that ends with `end_turn` or `stop_sequence` is now cached. Anything else sends an error line with `partial: true`.
> - **Silent failures:** a dropped connection, an unreadable event or a timeout ended the response with no message, leaving a half or empty card. Each now sends a clear error line.
>
> …
>
> | Trigger | What the mock does | What the user should see |
> |---|---|---|
> | `429` | HTTP 429 `rate_limit_error`, `retry-after: 20`, `x-should-retry: false` | No card. "Too many cards are being made right now. Try again in 20 seconds." |
> | `overload` | About 40% of the card, then `event: error` with `overloaded_error`. No `message_stop` | The partial card, dashed. "Claude is overloaded right now. Try again in a minute." |
> | `drop` | About 40% of the card, then destroys the socket. No error event, no `message_stop` | The partial card, dashed. "The connection to Claude dropped before the card was finished. Try again." |
> | `cutoff` | Half the card, then `stop_reason: "max_tokens"` and a normal `message_stop` | The partial card, dashed. "The card was cut off before the end. Try again." |

```text
$ curl -sN localhost:3000/api/recipe -H 'content-type: application/json' -d '{"dish":"miso soup overload"}'
{"type":"text","text":"# Miso soup\n\n**Ingredients**\n- 800 ml dashi\n- 3 tbsp white miso\n- 150 g silken"}
{"type":"text","text":" tofu, cubed\n- 1 tbsp dried wakame\n- 2 spring onions, sliced\n\n**S"}
{"type":"text","text":"teps**\n1. Soak the wakame in cold water for 5 minutes, then drain.\n2. He"}
{"type":"text","text":"at the dashi until it just simmers.\n3. Whisk the miso with a ladle"}
{"type":"error","message":"Claude is overloaded right now. Try again in a minute.","partial":true}
```

```text
[mock] POST /v1/messages 200 mode=overload sample=samples/miso-soup.md deltas=4/8 end=error-event | model=claude-opus-5 stream=true max_tokens=1500 thinking=adaptive(model-default)/omitted effort=- betas=- system=108ch user=48ch cache_markers=0 auth=x-api-key 205ms
```

Typing `overload` after the dish got four text lines from the app's own `samples/miso-soup.md`, then an error line marked `partial: true`, and the mock's log line records the trigger, the sample, where the stream stopped (`deltas=4/8 end=error-event`) and the shape of the call, without the key. The Playwright tests were written but not run.

## Why it works

- **The input picks the failure.** Trigger words in the user's own text make every failure path reachable from the real UI, by anyone, with no flags, headers or test-only branches in app code. A bug report becomes "type `drop` into the input". Matching whole words, and only in the user's field, stops a system prompt that mentions "400", or an input like "dropdown", from failing a request by accident. The app finds the mock through its base-URL env var, so production code never knows the mock exists and nothing test-only ships.
- **The real wire format, not a stub.** The app's own SDK and stream parser read the mock, so whatever breaks is production code, and the request-shape log shows what the app actually sends: model, effort, cache markers, betas. Seeded chunking makes every stream reproducible, and `x-should-retry: false` stops the SDK from hiding a 429 behind a minute of retries (it honours retry-after).
- **"overload" and "drop" are different failures, missed in different ways.** A parser that reads only text deltas skips the provider's error event, takes the half answer as complete and can cache it, as the example app did. A socket cut sends no event at all: the read throws or just ends after the response has started, and the user is left with half an answer and no message. Failing after real content forces the UI to deal with a half-written answer, and the "nothing cached" assertion catches the save.
- **One table, three uses.** README rows, test cases and manual QA steps are the same list, so none drifts from the others. Each row has to fail for the reason it names, and in seconds, so the tests shorten the app's timeout for `slow` and get past any rate limit or gate of its own on purpose instead of tripping over it.

## Variations

- **Provider features.** Add triggers for the features your app relies on: a refusal stop reason, a mid-stream model fallback that restarts the answer, or a 400 for a request option your account doesn't support.
- **A second provider.** The same file can serve another API's stream format from the same samples, with a trigger that fails only the first model in the chain (a 503 for that model) to test fall-through.
- **API-only services.** With no browser front end, the tests call your own endpoint, and the table's last column becomes the response your clients get.
- Generalised from a streaming AI app.
