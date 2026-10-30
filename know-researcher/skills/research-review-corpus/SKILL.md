---
name: research-review-corpus
description: This skill should be used when the user asks to run the independent adversarial corpus review — the credibility gate's review run — over a research project (e.g. "review the corpus", "run the corpus review", "is this project decision-ready", "run the credibility review"), or when the final closeout needs its review set. Orchestrates one or both reviewer tiers cold over the whole decision corpus and writes immutable receipts to research/reviews/. It runs the review; it never closes the project — the gate verdict belongs to the validator.
argument-hint: "[final|on-demand] [t1|t2|both]"
allowed-tools: Read, Write, Glob, Grep, Bash, Task
---

# /know-research:review-corpus

Run the independent adversarial corpus review. This skill is the **runner** defined by
`${CLAUDE_PLUGIN_ROOT}/reference/corpus-review-protocol.md` (protocol v1) §2: it
orchestrates the reviewer(s), owns all execution metadata, and is the **only writer** of
review artifacts. The reviewers are read-only samplers; the validator computes every
verdict. Nothing in this skill re-implements a protocol rule — where the protocol has
machinery, call it.

## Invocation

Arguments (both optional):

- **Run kind** — `final` (a final-closeout review set: the one the completion gate
  consumes) or `on-demand` (a mid-project health check). Default: `on-demand`.
- **Tiers** — `t1` (Codex CLI, independent cross-family sampler), `t2` (the
  `corpus-reviewer` agent, isolated same-family sampler), or `both`. Default: `both`.
  **Tier selection is `on-demand`-only.** A `final` run always plans both tiers — the
  gate operates on the union of the set, the validator rejects a final receipt planning
  fewer, and a tier that turns out to be unavailable is recorded as a failed attempt,
  never silently dropped. If the user passes `final` with a tier selector, say the
  selector doesn't apply to final runs (both are planned; an unavailable one becomes a
  visible failed attempt) and proceed with both.

## Ground rules (before any step)

- **Reviewers receive exactly four inputs**: the fixed brief, the canonical manifest, the
  corpus root, and the output schema (embedded in the brief). No conversation history, no
  summary, no explanation of intent, no "context" — structural coldness is the point. There
  is no channel for a reviewer to ask questions, and you never answer one.
- **Never overwrite.** If any target artifact path already exists in `research/reviews/`,
  that member run fails rather than replaces. Receipts and reports are immutable after
  write; failed attempts are immutable too.
- **A failure is a failed attempt, never a receipt.** An unparseable, incomplete, timed-out,
  or truncated reviewer result is recorded as `<attempt_id>.failed.json` with its failure
  chain. Only a result the validator accepts becomes a receipt.
- **The corpus must be quiet.** Do not edit any in-scope file between manifest build and
  receipt write — the review binds to the corpus hash, and a mid-run edit makes the result
  stale-born. If the user asks for corpus edits mid-run, finish or abort the review first.
- **You never adjudicate.** Findings are closed later — by reconciliation (corpus changes →
  fresh review), by a cited `rejected-with-record` entry in the resolution ledger, or by a
  commissioner exception. None of that happens inside a review run.
- **Work silently; report once.** Steps 1–9 run backstage. The only things they may say to
  the user are: the one-sentence protocol-adoption notice (step 1), a stop with its remedy
  (failed preconditions, preflight, manifest, or validator errors), and a brief heads-up
  when a long reviewer run starts. Everything else — hashes, identities, commands, exit
  codes, staging, assembly, existence checks, write verification, step names — is
  machinery, and machinery is never narrated. The review is presented exactly once, at
  step 10, verdict first. A turn that walks the user through the steps as bolded headers
  has failed this skill regardless of how good the review was.

## Process

### 1. Locate the machinery and check preconditions

- **Validator:** prefer the installed copy at `research/bin/validate-corpus-review.py`. If
  it is absent, copy `${CLAUDE_PLUGIN_ROOT}/reference/validate-corpus-review.py` into the
  scratch run directory and run it from there (reading a plugin file works on every
  surface; *executing* one in place may not — Cowork included — so the runnable copy
  lives in scratch, outside the project, where it cannot read as a partial adoption).
  Tell the user, in one sentence, that this project has not adopted review protocol v1,
  the review will still run and produce receipts, and the completion gate cannot consume
  them until the project adopts (`/know-research:init upgrade`). **That sentence carries no
  mechanics** — no file paths, no marker or STATE-line names, no mention of where the
  validator ran from; the fallback plumbing is backstage like all other machinery. If
  the surface cannot execute the scratch copy either, stop with that finding: adoption
  is the prerequisite, and `/know-research:init upgrade` is the remedy.
- Run the validator's `--self-test` once. If it does not end green, stop: the validator is
  damaged; report the failure and do not review.
- `research/STATE.md` must exist (its absence is a manifest error — this is not a research
  project yet). `research/research-plan.md` should exist; if it does not, say so and stop —
  there is nothing to review against.
- Ensure `research/reviews/` exists; if not, create it by writing
  `research/reviews/.gitkeep` (empty) with the Write tool.
- **Tier availability:** for t1, run `codex --version` and capture the version string. For
  t2, no preflight is needed (the `corpus-reviewer` agent ships with the plugin). If a
  *planned* tier is unavailable (Codex CLI not installed or not authenticated), do not
  silently re-plan: in **both run kinds**, a planned tier that cannot launch becomes a
  failed attempt in step 7 — the set's composition stays visible on disk, never only in
  conversation. (A tier the user explicitly chose not to run was never planned and gets no
  record.) Continue with whatever planned tiers are available.

### 2. Build the canonical manifest

Create a scratch run directory (`mktemp -d`). Then:

```
python3 <validator> manifest --root . > <scratch>/manifest.json
```

A non-zero exit is a manifest failure (unreadable in-scope files, symlink escape, case
collision, missing STATE) — report the validator's reasons verbatim and stop; nothing can
be reviewed until the corpus enumerates cleanly. From the manifest, record:
`decision_corpus_hash`, `state_hash`, `file_count`, `total_bytes`, and `hash8` (the first
8 hex of the corpus hash).

### 3. Disclosure-presence preflight (protocol §4.2)

If `research/reviews/exceptions.md` exists, parse its entries **fail-closed**: on a
`final` run, a malformed entry (missing or empty required fields, an unparseable hash) or
an `Affected deliverables` path that cannot be read stops the run — an exceptions ledger
you cannot verify is a preflight failure, not a pass. For every exception whose
`Binds to decision_corpus_hash` equals the **current** corpus hash (unexpired), verify
each path under `Affected deliverables` contains, in its Methodology & Limitations
section, a **substantive disclosure** of that accepted risk: language identifying the risk
accepted and its decision impact. The bare `E-<seq>` id alone is not disclosure — a reader
of the deliverable must see what was accepted, not a pointer. The sequencing rule exists
so disclosure cannot invalidate the review that gates on it — disclosure must already be
on disk **before** the final review runs.

- Missing or bare-pointer disclosure on a `final` run → **stop before invoking any
  reviewer.** Name the exception, the deliverable, and the remedy: write the disclosure
  into the deliverable's Methodology & Limitations (a corpus change), then re-run this
  review.
- On an `on-demand` run → warn about anything the above would have stopped, and continue.

### 4. Fix the identities

- Set stamp: `date -u +%Y%m%dT%H%M%SZ` at set start. `review_set_id = <stamp>-<hash8>`.
- Per member, at that member's start: `review_id = <member-stamp>-<hash8>-<tier>`
  (`t1` | `t2`).
- Before launching a member, confirm `research/reviews/<review_id>.receipt.json`,
  `<review_id>.report.md`, and `<review_id>.failed.json` do not exist. If any does, that
  member run fails — report it; do not overwrite, do not pick a new name for an artifact
  that already recorded this identity.

### 5. Stage the four inputs

Copy into the scratch run directory:

- `${CLAUDE_PLUGIN_ROOT}/reference/corpus-review-brief.md` → `<scratch>/brief.md`
- `<scratch>/manifest.json` (already there)

The corpus root is the project root's absolute path. The reviewer prompt — identical in
substance for both tiers — is exactly:

```
Read and follow the brief at <scratch>/brief.md completely. Corpus root: <absolute
project root>. Canonical manifest: <scratch>/manifest.json (<file_count> files). Your
output contract is the brief's; end with the single fenced JSON block.
```

Nothing else goes in the prompt. Not the project's history, not what the review is "for",
not prior findings.

### 6. Run the reviewers

For each planned tier, record `started_at` (UTC ISO-8601) immediately before launch.
Timeout budget: **1800 seconds** per member (spike runs took 11–25 minutes).

**Tier 1 (Codex CLI):** run from the scratch directory, in the background, capturing both
streams to files — the run outlives any foreground tool window:

```
cd <scratch> && codex exec -s read-only --skip-git-repo-check "<the prompt>" \
  < /dev/null > t1.out 2> t1.err &
```

(`< /dev/null` is load-bearing: a detached `codex exec` with an open stdin can exit
immediately with empty output — see the tools guide.)

Poll for completion; if it is still running at 1800s, kill it and record a timeout. When it
exits, record `ended_at`, `duration_seconds`, and the exit status.

**Tier 2 (`corpus-reviewer` agent):** dispatch the plugin's `corpus-reviewer` agent with
the same prompt (its four inputs), fresh — no other context. Record the same execution
metadata; the agent's returned text is its output stream. Record the engine version as the
model identifier if the environment reports one, otherwise the literal `unversioned`.

Both tiers of a `final` run should execute in the same review session, against the same
manifest. Run them concurrently when the environment allows; sequentially is fine —
step 8's staleness check protects the identity either way.

### 7. Parse each result — or record a failed attempt

For each member, extract the **last fenced JSON block** from its output. The member is a
**failed attempt** if any of: non-zero exit status; killed at the timeout; no fenced JSON
block; the block does not parse; the output ends inside an unclosed fence (truncation); or
the planned tier never launched (unavailable engine — either run kind). For a failed
attempt, write `research/reviews/<review_id>.failed.json` (never overwriting):

```json
{
  "schema_version": "1.0",
  "attempt_id": "<review_id>",
  "review_set_id": "<set id>",
  "run_kind": "final-closeout | on-demand",
  "reviewer": {"tier": "…", "engine": "…", "engine_version": "…",
               "sampler_label": "…", "fallback_chain": []},
  "execution": {"started_at": "…", "ended_at": "…", "duration_seconds": 0,
                "timeout_seconds": 1800, "exit_status": 1,
                "truncation_detected": false, "environment": {}},
  "failure": ["<the failure chain, most specific first>"]
}
```

A failed attempt ends that member; it never becomes a receipt, and you never retry under
the same `review_id`. The user may re-invoke the review (a fresh member stamp) once the
cause is fixed.

### 8. Assemble and validate the candidate receipt

For each member that returned a parseable result, assemble the candidate receipt **in the
scratch directory** (never in `reviews/`), joining what the runner owns with what the
reviewer returned:

- Runner-owned: `schema_version` ("1.0"), `review_id`, `review_set_id`, `run_kind`,
  `review_set_plan` (`tiers_planned` as invoked; a `note` explaining any partial set),
  `reviewer` (tier, engine `codex-cli`/`claude-agent`, captured `engine_version`,
  `sampler_label` — `independent cross-family sampler` for t1, `isolated same-family
  sampler` for t2 — and `fallback_chain`), `execution` (the metadata from step 6,
  `environment` carrying the flags/settings used), `corpus` (the manifest's
  `decision_corpus_hash`, `state_hash` as `preclose_state_hash`, `file_count`,
  `total_bytes`, and `unreadable_files: []`), `criteria_mode` (`structured` iff
  `research/reference/completion-criteria.md` exists, else `legacy-prose`), and
  `criteria_binding.path` + `criteria_binding.sha256` (the criteria file and its SHA-256;
  in legacy mode the path is `research/research-plan.md`).
- Reviewer-owned, copied verbatim from its JSON: `verdict`, `checks`, `findings`, and the
  `criteria` array (into `criteria_binding.criteria`; `[]` in legacy mode). The
  reviewer's `review_coverage` summary (files opened vs manifest) goes into the
  **report header**, never the receipt — the receipt's `corpus` block is runner-owned.
  Do not repair, reword, re-severity, or drop anything the reviewer returned — a result
  that needs repair is a failed attempt, not raw material.

Then validate through the one implementation:

```
python3 <validator> validate-receipt --root . \
  --receipt <scratch>/<review_id>.candidate.json \
  --filename <review_id>.receipt.json
```

- **Exit 0** — proceed to step 9.
- **Exit 14 (incomplete-receipt)** — the reviewer's result is malformed or incomplete:
  record a failed attempt (step 7's shape) with the validator's reasons as the failure
  chain.
- **Exit 13 (stale-hash)** — the corpus or STATE changed while the reviewer ran: the
  result is stale-born. Record a failed attempt with that failure chain, and tell the user
  the review must be re-run with the corpus quiet.
- Any other exit — report the validator's reasons and stop; something is wrong with the
  project (criteria drift, manifest damage), not with the reviewer.

### 9. Write the artifacts

For each validated member, publish with **exclusive-create semantics** — an existence
check followed by an ordinary write leaves a race window, so create each file in a way
that fails if the path already exists (stage the exact bytes in scratch, then publish via
a hard link or a noclobber redirection: `set -o noclobber` + `> target`; never an
overwrite-capable write). Any collision is terminal for that member — report it; never
overwrite, never pick a new name.

Order matters — the report first, the receipt second, so a gate-visible receipt always
has its report already on disk:

1. Publish `research/reviews/<review_id>.report.md` — a short runner header (review id,
   set id, run kind, tier + sampler label, engine + version, started/ended, duration,
   verdict) followed by the reviewer's full prose analysis (everything before its final
   JSON block), verbatim.
2. Publish `research/reviews/<review_id>.receipt.json` — the candidate, byte-for-byte.

Both are immutable from this moment. Re-read each to confirm the write landed; a failed
write is reported with its path, and the run is not summarized as complete until resolved.
If the receipt publish fails after the report landed, say exactly that — the orphaned
report is inert (the gate reads receipts), but it must be reported, not hidden.

### 10. Report

If the project carries the protocol marker, run the validator's `gate --json` and fold its
named verdict into the report (on a `final` run this is the gate state the closeout will
see; on `on-demand` an open-findings or no-final-review result is expected, not alarming).

**The turn's first sentence is the verdict** — e.g. "The corpus review came back
not-ready: five material findings" or "The review found nothing material — one sampler's
ready." The verdict is always the *sampler's* assessment, never the gate's state: do not
phrase it as "nothing blocks the gate," "the gate would pass," or any equivalent — the
gate's verdict belongs to the validator alone. Everything else, including the
protocol-adoption notice from step 1, comes after it. Then present, in the product's
vocabulary, in this order:

- **The findings** — the product of the run. For each: class, severity, a one-line
  `observed` in plain words, its first evidence citation, **and the remedy the reviewer
  recorded** (`closure_evidence_required`, in plain words) — minor findings included; a
  finding whose fix is withheld is a finding the user can't act on. Material findings
  first. Where two tiers found the same issue, say so; where they disagree, present both
  sides without arbitrating. On a clean run, say plainly what was checked and name two or
  three concrete things that *would have failed this corpus* had they been present (a
  promised deliverable missing, a conclusion outrunning its evidence, a figure reversing
  between phases) — a clean verdict earns its calm by showing its work, never by brevity.
- **Coverage, one line per tier:** how much of the corpus the reviewer actually opened,
  and any `insufficient-coverage` or notably partial checks named plainly. **A check that
  did not apply is named to the user with its reason** — never absorbed into "everything
  was checked" or "nothing was skipped," which overstates coverage in the exact sentence
  asserting honesty. Concretely: words like "full coverage," "complete," or "nothing it
  couldn't assess" are permitted **only when every single check ran with complete
  coverage**; the moment any check is n/a or partial, the coverage line must say so and
  why ("one check — instrument validity — didn't apply: this corpus proposes no study"),
  in the same breath as the rest. Internal vocabulary stays internal — say "the reviewer
  couldn't see enough to assess X," not `insufficient-coverage`; say "the study-design
  check didn't apply — this corpus proposes none," not "C7 n/a."
- **Failed attempts**, if any, with their cause and what would fix a re-run.
- **What happens next — always, findings or none.** Short sentences; two ideas, both
  mandatory in substance — and both **unconditional**: a clean run still states the
  closure paths in brief and still names the two classes no exception can ever cover;
  "nothing needs adjudication" describes the findings, it does not waive the close:
  1. *Closure paths:* a material finding blocks the completion gate until it is fixed
     (which changes the corpus, so a fresh review follows), rejected with a cited record
     in the resolution ledger, or accepted by the commissioner as a recorded exception —
     and a missing promised deliverable or a real internal contradiction can never be
     excepted.
  2. *The ready rule — never omitted:* the turn must convey, in your own words, that
     one sampler's `ready` earns nothing by itself — the gate opens only on valid
     receipts plus zero open material findings, and its verdict belongs to the
     validator. On a clean run this is how the reader knows `ready` did not just open
     the gate. The semantic half is absolute for the whole turn: no sentence anywhere
     in it may assert the gate's state ("nothing blocks the gate," "nothing here blocks
     anything," "the gate would pass") — that inversion is the observed failure this
     rule exists to prevent, whatever the wording.

Backstage, never narrated: the scratch staging, candidate assembly, validator invocations
and exit codes, identity computation, existence checks, write verification. Onstage: the
review, its verdict, its findings, coverage honesty, and the adjudication paths.

## Failure modes

| Failure | Prevention |
|---|---|
| Passing the reviewer anything beyond the four inputs — a summary, history, "context" | The prompt in step 5 is exact and closed. Coldness is structural: a reviewer that knows the intent stops being independent. |
| Repairing a reviewer's result — fixing its JSON, filling a missing check, softening a finding | Any result the validator rejects is a failed attempt with the validator's reasons on record. The runner assembles and transports; it never authors review content. |
| Overwriting or retrying under the same identity | Existence checks before launch (step 4) and before write (step 9). A collision or leftover artifact fails the member; a re-run gets a fresh stamp. |
| Editing the corpus while reviewers run | The quiet-corpus rule, enforced mechanically by `validate-receipt`'s staleness check — a mid-run edit surfaces as exit 13 and the member is recorded stale-born, never written as a receipt. |
| Silently narrowing a `final` run to one tier | `final` plans both tiers; an unavailable tier is a recorded failed attempt, so a single-sampler close stays visible in the set's composition. |
| Treating a `ready` verdict as the gate opening | The gate's verdict belongs to the validator (valid receipts + zero open material findings + no insufficient coverage). Report `ready` as one sampler's assessment, nothing more. |
| Adjudicating findings in the run report — "this one seems wrong, ignore it" | Closure paths are the ledgers': reconcile, reject-with-record (cited), or commissioner exception. The runner reports; the commissioner decides. |
| Running the review over a corpus that fails to enumerate | Manifest failure stops the run before any reviewer launches — an unreadable file or symlink escape means the review would be reviewing an unknown corpus. |
| Narrating the run — step headers, hashes, command lines, exit codes, staging, and write checks walked through in the user-facing turn | The ground rule is "work silently; report once." Steps 1–9 speak only to stop or to give the sanctioned one-sentence notices; the review is presented once at step 10, verdict in the first sentence. The machinery lives in the report header and the receipt, where an auditor looks — not in the conversation. |
| Skipping the what-happens-next close because the run was clean | The gate-semantics close is unconditional. A clean run still ends by saying what a material finding would have done, that no exception can cover a missing deliverable or an internal contradiction, and that one sampler's `ready` does not open the gate. |
