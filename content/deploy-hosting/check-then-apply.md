---
title: "Risky one-off infra change: check mode, typed apply, automatic rollback"
summary: Have Claude Code write a DNS cutover or migration as a workflow that proves every permission on throwaway probes, refuses ambiguous matches and rolls itself back.
category: deploy-hosting
tags: [ops, deploy, github-actions, cloudflare]
model_tested: Claude Opus 5.5
date_tested: 2026-11-06
difficulty: advanced
use_as: claude-code
---

## The prompt

Run this in a Claude Code session on the repository whose CI already holds the credential. Claude writes the workflow. You merge it to the default branch (on GitHub, a manual workflow can't be run until its file is on the default branch; check what that merge deploys) and run it.

```text
Write a one-off workflow for a risky infrastructure change: {{change_description}}

What is there now, exactly: {{current_state}}
Provider and API: {{provider}}
Credential: {{credential}}
Exact name of the thing being changed: {{resource}}

Put it where the credential already lives, as a manually dispatched CI workflow, so the credential never leaves CI. If CI doesn't hold it, write a script that reads it from the environment. First read how this repo already uses the credential and list the API calls it has actually made with it. Any permission the change needs that no existing code has exercised is unproven.

Then check whether the provider can make the change in one atomic call: a batch or transaction endpoint, an override or upsert flag, a transactional swap. If it can, use that call, keep check mode and the exact-match rules, and leave out the window (rules 7–10). Build the window only when no atomic path exists, and say in a comment why not.

Build it to these rules. Above each part, write a short comment saying why it is there, specific to this change, so nobody "simplifies" it away later.

Two modes
1. A `mode` input: `check` (the default) or `apply`. Both run the same reads and probes; only apply continues past them.
2. check leaves the target untouched; its only writes are probes it removes, together with anything they create as a side effect (an issued certificate, for example), or check lists what stays behind. It:
   - confirms the credential works (a validity check does not prove scopes);
   - validates every hard-coded literal (account id, zone, service or target name) read-only against something that already uses it;
   - reads and prints the current state, and records a baseline of what is served right now;
   - proves every permission the change needs by creating a throwaway probe and deleting it, with the same API call and the same kind of target as the real step (for example a hostname that can get a certificate, not an underscore name). Prove the permission of the step after the destructive one too: it is the call that runs after the point of no return;
   - ends with a summary of exactly what apply would delete (with its id) and what it would create.
3. apply also requires a `confirm` input typed exactly as {{resource}}. Anything else stops before any change.

Refuse to guess
4. Fetch every candidate and filter client-side on every identifying field (name, type, content) against the current state given above. Don't rely on a server-side filter to scope it. Stop if the response holds fewer rows than the reported total; where no total is reported, require a row you know exists to be in it.
5. Continue only if exactly one row matches. On zero or several, stop and print what you found. Also read everything at the real target that could make the constructive step fail, or that it would overwrite besides the matched row (other records at that name, the name already attached to another service), and stop if anything is there. A probe on another name cannot see these.
6. Capture and validate the original's attributes (ttl, proxied flag, priority, whatever applies) before touching it. The rollback rebuilds it from them.

The dangerous window
7. Put the destructive step and the constructive step next to each other, with nothing else between them. Say in a comment what a gap costs. For DNS: once a record is gone, resolvers cache the negative answer (NXDOMAIN, or NODATA if other records remain at that name) for the zone's negative-cache TTL, the lower of the SOA's own TTL and its minimum field (often 15–60 minutes). So a gap of seconds can leave the name dark that long, and recreating the record does not flush those caches. Because rollback cannot undo that, everything that can fail is proven before the destructive step, not discovered after it.
8. Arm automatic rollback just before the destructive call is sent, with a trap on EXIT, INT and TERM rather than an if-branch, and disarm it only once the constructive step succeeds. The INT and TERM handlers roll back, then exit. Guard the rollback so it runs only once. As a backstop, add a final step that runs even after a cancel and restores if the window was left open.
9. The rollback re-reads the current state first. If the original is still there (the delete never landed), change nothing. If the new thing is already in place (the call landed but its response was lost), don't revert. Otherwise restore the original with its original attributes, and warn about anything the restore can't undo.
10. If the restore fails, print the exact manual fix, every attribute included, to the log and the run summary.

Calls and failures
11. Every network call has a connect timeout and a total timeout: an untimed call in the window hangs until the job times out with the resource gone. Set a job timeout too. Calls inside the window, and the rollback itself, must finish within the runner's cancel grace (on GitHub Actions, SIGTERM comes 7.5 s after SIGINT and the process tree is killed 2.5 s later), so give them timeouts of a few seconds.
12. Treat a lost response (status 000, a timeout) as unknown, not as a permission failure: the write may have landed. Re-read before reporting, and remove any orphaned probe.
13. Check each call's status explicitly rather than relying on the shell exiting on error. When an error body isn't JSON (an HTML 502), print the raw body, truncated. In GitHub Actions, steps run with `bash -e`: turn errexit off (`set +e` or a custom `shell:`). Pass inputs to the script through `env:`, never `${{ }}` inside `run:`. Expose the secret only to the steps that call the API.
14. Add a concurrency group with cancel-in-progress false. A second dispatch must never cancel a run between the delete and the create.

After the change
15. Verify by polling the live endpoint for a bounded time. If it isn't confirmed, print how to check whether the change landed and, if a revert would reopen the window, say not to revert by hand yet (a new certificate can take minutes).
16. Side effects outside the main job only warn: a probe that won't clean up, a registry or directory update, a notification. A change that succeeded must never report failure.
17. If another tool treats a config file as the source of truth for this resource (a deploy tool that reconciles routes, Terraform state), its next run may undo the change. Name the follow-up edit in the summary.

Don't run apply. When the workflow is written, reply with: what check proves and how; what apply does, step by step; and the run order: merge the workflow on its own (on GitHub, a manual workflow can't be dispatched until its file is on the default branch; say what that merge deploys), check, read its output with me, commit any source-of-truth config change without deploying it, apply with the confirmation, then deploy that config change straight after.
```

## Example

**Input**:
- `change_description`: Move the apex `example.org` off its CNAME to the old static host and attach it to the Cloudflare Worker `site` as a custom domain.
- `current_state`: `CNAME example.org -> legacy.example.net`, proxied, TTL auto
- `provider`: Cloudflare (DNS records and Workers custom domains), v4 REST API
- `credential`: `CLOUDFLARE_API_TOKEN`, a GitHub Actions repository secret
- `resource`: `example.org`

The repository deploys with that token; nothing in it had written a DNS record before. Its README says `www.example.org` is already on the Worker and the zone's SOA minimum is 1800 s.

**Output** (trimmed: the rollback's decisions, the probe lines check writes to the run summary, and the window in apply, from a 76-line workflow and the 838-line script it runs):

```bash
rollback() { # rollback REASON fast|patient
  [ "$ROLLBACK_STARTED" = 1 ] && return 0
  ROLLBACK_STARTED=1
  …
  read_original "$ct" "$rd" "$tries"
  …
  case $ORIG_STATE in
    present)
      note "- Rollback: the original record $ORIG_ID is still in place; the delete never landed. Nothing changed."
      window_resolved; return 0 ;;
  …
  attach_landed "$tries" "$ct" "$rd"
  case $? in
    0) LANDED=1
       note "- Rollback: not reverting. $TARGET is attached to $WORKER: the attach landed and only its answer was lost."
       window_resolved; return 0 ;;
  …
  cf POST "/zones/$ZONE_ID/dns_records" "$(jq -c . "$RESTORE_BODY")" "$ct" "$wr"
…
step_probes() {
  …
  md "### Permissions proven on $PROBE_HOST"
  note "- P1 POST /zones/{zone}/dns_records (proxied CNAME, the rollback's exact body): ok"
  note "- P2 DELETE /zones/{zone}/dns_records/{id} (apply's destructive call): ok"
  note "- P3 POST copies of the $(jq length "$STATE_DIR/coexisting.json") TXT/MX/CAA record(s) that stay at $TARGET: ok"
  note "- P4 PUT /accounts/{account}/workers/domains (apply's constructive call, ${t}s): ok"
  note "- P5 attached to $WORKER; coexisting records untouched: ok"
  note "- Detach DELETE /accounts/{account}/workers/domains/{id}: $([ "$DETACH_OK" = 1 ] && echo ok || echo FAILED)"
…
step_apply() {
  …
  # ============================== THE WINDOW ===============================================
  # From the DELETE until the attach lands, example.org has no address record. A resolver that
  # asks in that gap gets NXDOMAIN (or NODATA if TXT/MX stay at the name) and caches it for the
  # zone's negative-cache TTL, the lower of the SOA's own TTL and its minimum field: here up to
  # $NEG_TTL s (the README gives an SOA minimum of 1800 s, 30 minutes). So a gap of seconds can
  # leave the apex dark that long for that resolver's users, and recreating the record does not
  # flush those caches. That is why everything that can fail was proven above, and why the two
  # calls sit back to back with nothing between them but reading the first one's status.
  # Rollback is armed here, just before the DELETE is sent: the traps act on WINDOW_OPEN.
  : >"$WINDOW_MARKER"; WINDOW_OPEN=1
  t_open=$(date +%s.%N)
  cf DELETE "/zones/$ZONE_ID/dns_records/$ORIG_ID" "" "$W_CT" "$W_MT"
  # A clear refusal (403, 409...) means nothing was deleted: leave through the trap, which re-reads.
  # A lost answer may have deleted it: attach anyway. If the CNAME is still there the attach is
  # refused (that is the documented rule) and the trap's re-read sorts it out.
  if cf_ok; then echo ok >"$STATE_DIR/delete-result"
  elif cf_lost; then echo lost >"$STATE_DIR/delete-result"
  else echo refused >"$STATE_DIR/delete-result"; die "DELETE refused: $(cf_why)"; fi
  cf PUT "/accounts/$ACCOUNT_ID/workers/domains" "$attach" "$W_CT" "$W_MT"
  # ==========================================================================================

  local attach_why; attach_why=$(cf_why)
  if cf_ok; then
    new_domain=$(jq -c '.result | {id, hostname, service, zone_id, cert_id}' "$CF_BODY")
  elif cf_lost && attach_landed 8 "$W_CT" 5; then
    # Lost answer, but the attach landed (re-read, not assumed).
    new_domain="(answer lost; listed as attached on re-read)"
  else
    die "the attach did not land ($attach_why): rolling back"   # the EXIT trap re-reads and restores
  fi
  t_close=$(date +%s.%N)
  window_resolved   # disarmed only now that the constructive step has succeeded
```

Check sends the rollback's create, the delete and the attach on a throwaway hostname before apply touches the apex, with copies of any TXT, MX or CAA records that stay at the apex, and stops if the attach removes one of them. In apply, nothing but the DELETE's status check sits between the two calls, and the window is disarmed only once the attach succeeds or a re-read shows it landed.

One slip in the generated comment: a zone apex always holds SOA and NS records, so a resolver asking in the gap gets NODATA, never NXDOMAIN. Resolvers cache NODATA for the same negative-cache TTL ([RFC 2308, section 5](https://www.rfc-editor.org/rfc/rfc2308#section-5)), so the comment's conclusion stands.

## Why it works

- **Avoid the window, or prove everything before it.** Resolvers that cached a negative answer during the gap keep it for the zone's negative-cache TTL whatever you recreate, so an atomic call beats any rollback. Where there is none, check moves every failure it can to before the delete: a literal checked against something that already uses it can't be a typo, and only a probe with the same call on the same kind of target proves a permission. A token that "verifies" can still lack a scope, and a probe on an underscore name can't get a certificate, so it would test a different path.
- **Exactly one match, on every field, filtered by you.** A filter on a single field, or a server-side filter nobody checked, is how a cleanup deletes the wrong record. Matching the stated current state on name, type and content client-side, failing on a short page and requiring the name typed back (passed through `env:`, so free text can't become shell) mean apply either acts on the row you meant or stops. Reading everything at the real target catches what a probe on another name can't see, such as a record that would make the create fail after the delete, and validating the captured attributes first gives the rollback something correct to restore.
- **Adjacent steps, a trap, and a rollback that looks before it acts.** A trap fires on failure, cancellation and signals, but only once the call in flight returns and before the runner kills the step, hence the short timeouts and a final step that still runs after a cancel. Armed before the delete is sent and re-reading first, the rollback neither misses a delete whose answer was lost nor undoes a change that landed. If the restore itself fails, the printed record makes the worst case one paste rather than a reconstruction under pressure.
- **The run's report has to match what happened.** No cancel-in-progress and short timeouts on every call keep a run from stalling inside the window. Explicit status checks, with errexit off, let a lost response be re-read instead of killing the script, and a raw error body shows a gateway failure for what it is. Treating a lost response as unknown, only warning on side effects and naming the config file that could revert the change keep the operator from "fixing" something that worked; a comment on each rule says why it exists, so the next edit doesn't remove it.

## Variations

- **Data migration.** Where the database supports it, rename and swap the tables in one transaction (Postgres, or MySQL's multi-table `RENAME TABLE`): there is no window. Where it can't, the destructive and constructive steps become the rename and the swap; the probe creates and drops a scratch table with the same role; "exactly one match" becomes an expected row count and checksum; the rollback swaps back.
- **Keep check as a canary.** For a change you will repeat, schedule check mode so a credential that loses a scope fails a quiet run, not the day you need it. Use one fixed probe name, treat an empty mode as check (scheduled runs have no inputs), and remove what the probe leaves behind, such as its certificate.
- Works for any one-off change where a gap between delete and create causes damage a rollback can't undo.
