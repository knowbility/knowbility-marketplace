# researcher — maintainer's map

The precise version of the system, for people changing it. Exact decision and write ownership,
the status of every known limit, the version each piece landed in, and the claims that are
enforced by code versus merely deduced.

**If you want to understand how researcher works, read [ARCHITECTURE.md](ARCHITECTURE.md)
instead.** That is the explanation. This is the ledger behind it, and it is written in the
plugin's internal shorthand on purpose: workstream labels (W1–W7), audit battery items (B1–B19),
corpus-review checks (C1–C15), and seam numbers. Those labels are how the design records, the
changelog, and the eval pack refer to each other.

**Current version: 1.18.0.** Every workstream is built. The eval set is 45 of 45 golden.

## Keeping this fresh

When a change moves an ownership boundary, a judgment home, a principle, or a seam, update this
file in the same change. A stale map that looks authoritative is worse than none.

This file is authoritative on relationships, ownership, principles, and seams, because those live
nowhere else. It is subordinate to the skills on mechanics. When this file and a skill disagree
about how a step works, the skill is right and this file gets fixed. Do not restate skill
mechanics here; duplicated mechanics rot, and when they rot the skill wins.

## Evidence labels

Behavioral claims below are tagged, because conflating these four was the central defect of an
earlier revision:

- **[enforced]** — a hook, gate, or hard skill rule makes it so. Verifiable from the code.
- **[observed]** — seen in real project runs or transcripts. Evidence exists, but outside this
  repo, so it is not derivable from the code alone.
- **[inferred]** — deduced from the code as a possibility or exposure, not demonstrated to happen.
- **[proposed]** — under consideration, not built and not vetted.

## Read-provenance

Built from a first-hand read of all 12 skills, both agents, and the reference guides
`coverage-assessment-guide`, `source-assessment-guide`, `evidence-failure-modes`,
`posture-register`, `workflow-ownership`, and `where-am-i.py`. Corrected against an adversarial
Codex read of the same files, which caught two reversed write-owners, an overstated outputs gate,
and the omission of Seam 0. Not fresh-read: `pattern-recognition-guide`, `writing-standards`,
`tools-guide`, `prompt-templates-*`, the 11 type templates, and the discovery channel playbooks.
Sections leaning on those are marked `[unverified]`.

---

## Workstream → version map

Correct as of v1.18.0. Earlier revisions of this file carried these one version low.

| Workstream | What it closed | Version |
|---|---|---|
| W7 | Corpus-level credibility gate (contract, reviewer, wiring) | 1.8.0 |
| W6a / W6b | Prevention layer for W7: criteria preflight, criteria trajectory, settled-framing guard, decision ledger + B13 | 1.10.0 |
| W2 | Seam 1 — saturation ↔ adequacy precedence | 1.11.0 |
| W1 | Seam 0 (partial) — per-figure records, B15; plus referent drift, B14 | 1.12.0 |
| W3 | Seam 2 — significance labels, B16/B17 | 1.13.0 |
| (interim) | The stale-reading stop in `check-gaps` | 1.14.0 |
| W4 | Seam 4 — claim-keyed disconfirmation, four-value assumption status | 1.15.0 |
| W6c / W6e / W6f | Recommendation serviceability, B18 | 1.16.0 |
| W5 | Seam 5 — `basis` / `carries-to`, integrity check 10 | 1.17.0 |
| W6d | Instrument validity, step 7b, B19 | 1.18.0 |

---

## Layer 1 — The pipeline

Phase-sequential: one phase at a time, each completing a five-step cycle before the next begins.

| Step | Skill | Produces |
|---|---|---|
| **Collect** | `discover` → `process-source` | candidates file → source notes + registry rows |
| **Connect** | `cross-ref` | `cross-reference.md` (patterns, contradictions, saturation) |
| **Assess** | `check-gaps` | `gaps.md` (coverage verdict) |
| **Synthesize** | `summarize-section` | draft in `drafts/` (+ integrity check) |
| **Verify** | `audit-claims` | promotes draft → `outputs/` (by convention, the only path in) |

Read-only decision-support runs alongside the cycle, never in it: `phase-insight` (per-phase
strength), `graph-analysis` (evidence-base structural health), `progress` (project dashboard).
`start-phase` briefs the next phase; `init` scaffolds the project once; `review-corpus` runs the
Tier-2 gate at final close.

Each `commands/know-research/<x>` is a thin wrapper delegating to its `skills/research-<x>` engine.
Behavior lives in the skill; this map describes the skills. See `know-researcher/AGENTS.md` for the
wrapper/engine split and hook manifest.

---

## Layer 2 — Ownership map

The seam-exposer. Read it when a change might touch a boundary.

| Skill (step) | Owns (decisions) | Writes (state) |
|---|---|---|
| **init** | plan generation, subject identity, evidence-standard compilation, STATE template, helper install, discovery strategy, protocol kit install, `upgrade` adoption path | everything, once (dirs, CLAUDE.md, STATE.md, registries incl. empty `canonical-figures.json` / `claim-graph.json`, gate-policy, standards, validator → `research/bin/`, marker, SC-ID'd criteria, `reviews/` scaffold) |
| **start-phase** | phase-entry briefing, carryover (assumptions / commonplace / gaps / backstage), source-material reconciliation | Phase Tier Record row; backstage check-offs; `source-material-digest.md` (created/updated during reconciliation) |
| **discover** (Collect) | channel selection, query construction, candidate prioritization, batch cadence + auto cross-ref, exclusion recording | `discovery/*-candidates.md`, `exclusions.md`, `retrieval-log.json` |
| **process-source** (Collect) | per-source note, credibility assessment, contradiction flagging, counter increments, candidate `[PROCESSED]` marking, pre-schema note backfill on contact | `notes/`, `registry.md`, candidate tags, STATE counters, source-material-digest; invokes integrity **check 10** when a note carries figures (W5) |
| **cross-ref** (Connect) | contradiction materiality, shared-origin/echo detection (triangulation), saturation signals (advisory), pattern ID | `cross-reference.md`, `saturation.json` (W2), resets counter, checks **Connect** box, backstage-tasks, Next Action, `decision-ledger.md` `resolution` entries (material resolutions only, at resolution time — W6b) |
| **check-gaps** (Assess) | coverage adequacy verdict (2-test), candidate disposition, owns the **Collect** box + cycle reconciliation; routes `Evidence Against` to synthesis; reads `saturation.json` and owns the saturation↔adequacy precedence contract and the collection-exhausted decision (W2); the stale-reading stop (1.14.0) | `gaps.md`, STATE (Collect box, Cycle step, Next Action, gap-check date), `decision-ledger.md` `acceptance` entries (first acceptance only — W6b) |
| **summarize-section** (Synthesize) | synthesis and "so what", qualifier + range preservation, counter-evidence gate (claim-keyed, all types — W4), assumption logging, methodology section, runs integrity; reads the decision ledger pre-draft (W6b); significance labels (W3); rule 4a `measures` + rule 4b `carries-to` binding draft **and** turn (W1/W5); step 7a recommendation serviceability (W6e/6f); step 7b instrument validity (W6d) | `drafts/`, `assumptions.md`, `negative-searches.md`, STATE (draft pending) |
| **audit-claims** (Verify) | the provenance gate — enumerated check battery **B1–B19**; confidence tiers, deliverable manifest, waivers, phase closeout incl. the criteria preflight (W6a) and the advisory criteria trajectory; the three-stage validated closeout at final phase (W7 stage 4) | `outputs/` (by convention the only deliverable writer), `audits/`, `gate-log.md`, `claim-graph.json` incl. drift annotations, `decision-ledger.md` `correction` + `directive` entries |
| phase-insight / graph-analysis / progress | read-only decision-support (progress and start-phase also validate completion claims via `check-completion` — verdict outranks STATE text) | nothing |
| **research-integrity** (agent) | independent provenance / consistency / drift check; **check 10** reads figure `basis` / `carries-to` for internal consistency, never study quality | registers cross-phase figures in `canonical-figures.json`; *reads and surfaces* drift warnings, does not write them |
| **corpus-reviewer** (agent) | Tier-2 C1–C15 battery; cold, read-only; reads only the manifest | nothing |
| **review-corpus** (runner) | reviewer orchestration, execution metadata, four-inputs coldness, disclosure preflight | sole writer of `research/reviews/` pre-close: receipts + reports (immutable), `.failed.json` attempts |
| **validator** (`research/bin/validate-corpus-review.py`) | the completion verdict (gate), the allowed STATE transition, post-close validation, archive drift-checking | `completion.json` + the four-op final STATE transition (`transition --apply`) — the only writer of project completion on adopted projects |

Boundaries that are load-bearing and easy to get wrong:

- **`discover` never crosses into `process-source`'s territory.** It never writes notes or
  registry rows. The discovery→processing boundary is a human gate. **[enforced]** (discover
  guardrail 1).
- **`check-gaps` owns the Collect box.** Gathering sources is not gathering enough.
- **The `canonical-figures.json` / `claim-graph.json` split reverses easily.** Integrity registers
  canonical figures; audit writes the claim graph and its drift annotations. Read is not write.
- **The coordinator stays inline.** `process-source` guardrail 7 and `discover` forbid delegating
  the cycle to subagents. **[enforced]**
- **Voice and mechanics do not borrow from each other.** `posture-register.md` governs how the
  agent *sounds* in every conversational turn; the skills govern *what* it says — steps, gates,
  and the facts each output must carry. A skill that tells you how to sound has drifted; a voice
  rule that names a file to write has drifted the other way. Voice lives at plugin level
  precisely so a researcher does not become a different person between `discover` and
  `check-gaps`. Note that two invariants (principles 4 and 12) are voice rules promoted to the
  constitution because they bind the turn as well as the draft: machinery stays backstage
  (posture rule 7), and a spoken figure carries what its note says it measures (posture rule 8).
  `writing-standards.md` is the third surface — it governs the written output rather than the
  turn, and carries the three significance labels and the source-count confidence language.

---

## Layer 3 — State model

`STATE.md` is the durable position digest, read first every session and written after every
significant action. Sections: Current Position (Active phase, Cycle step, Blocking), Current Phase
Cycle (5-step checklist), Completed Phases, Key Decisions, Sources Processed (counters), Next
Action (a startable command), Phase Tier Record.

| Artifact | Role | Volatility |
|---|---|---|
| `STATE.md` | position digest; Next Action is the resume anchor | durable |
| `research-plan.md` | the assignment (phases + questions) | durable |
| `bin/where-am-i.py` | computes position from files (project-local so Cowork can run it) | durable |
| `bin/validate-corpus-review.py` | completion verdict + STATE transition (project-local, installed by init) | durable |
| `sources/registry.md` | completion ledger | durable |
| `discovery/*-candidates.md` | batch ledger (`[PROCESSED]` tags = disposition) | durable |
| `notes/` | per-source notes carrying per-figure records (`measures` / `not` / `locator` / `verbatim` — W1; `basis` / `carries-to` — W5). **The trust anchor. See Seam 0.** | durable |
| `cross-reference.md`, `gaps.md` | regenerated each run (patterns, coverage) | derived |
| `saturation.json` | machine-readable half of the saturation verdict (W2) | derived |
| `drafts/` → `outputs/` + `audits/` | synthesis → audited output + reports | durable |
| `reference/canonical-figures.json` | cross-phase figure registry (written by **integrity**) | durable |
| `reference/claim-graph.json` | claim nodes + drift warnings (written by **audit**) | durable |
| `reference/decision-ledger.md` | append-only disposition record (corrections / resolutions / acceptances / directives; each class written by its owning skill at decision time; supersession by new entry, never edit; enforced by B13; in the reviewed corpus manifest) | durable — the anchor for records whose working views regenerate |
| `reference/retrieval-log.json` | discovery audit trail | durable |
| `reference/evidence-standard.md` | compiled audience rules, enforced at audit | durable |
| `reference/backstage-tasks.md` | agent's private prep queue (worked at phase start) | disposable |
| `reviews/` | receipts + reports, immutable, written only by the review runner | durable |
| `assumptions.md` | thin-evidence judgments; four-value `Status` (`Open`, `Tested — held`, `Tested — broke`, `Untestable via mapped channels` — W4) | durable |
| `commonplace.md` | the agent's carried thinking — Working Reads read by `start-phase` | durable |
| `source-material-digest.md` | digest of user-dropped files; reconciled each phase | durable |
| `discovery/exclusions.md`, `negative-searches.md` | curation + adverse-search ledgers | durable |

---

## Layer 4 — Judgment map

Judgments that would otherwise live only in the human's head. Without an encoded criterion the
agent drifts (decides silently) or stalls (hands the call back).

**Framing caveat:** the "family" is a diagnostic lens for finding gaps, not an architectural unit.
Members share no common object or control mechanism. Position is state-recovery, saturation is a
novelty ratio, triangulation is provenance clustering, significance is normative, disconfirmation
is an evidence-search discipline, instrument validity is a computability check. Design each in its
own place. Do not build "one judgment system."

| Judgment | Where it's made today | Status |
|---|---|---|
| **Position** | `STATE.md` + `where-am-i.py` + candidates ledger | Shipped 1.6.0. Computable **with a legacy/fallback path** — untagged legacy ledgers and helper failure fall back to manual file derivation. **[enforced]** |
| **Sufficiency / saturation** | cross-ref XREF-02 computes the per-question confirmatory ratio over independent origins → `saturation.json`; check-gaps reads it and owns the stop verdict | **Seam 1 closed, 1.11.0 (W2).** Precedence contract: adequacy governs the stop, saturation governs the route. Collection-exhausted is a commissioner decision with three enumerated outcomes, holding the cycle at `Assess (3 of 5)`. |
| **Triangulation** | cross-ref: "a pattern from one source is a claim" (guardrail 1), echo detection, independence-defaults-unknown | Fires before synthesis **[enforced]**. See Seam 3 for the residual. |
| **Significance / interpretive license** | summarize-section labels each load-bearing "so what" inline (implication / inference / commissioner priority — W3); B16 enforces per label; B17 checks conclusion vs Core Question + ledger directives | **Seam 2 closed, 1.13.0 (W3).** Labels are C14's verbatim. |
| **Disconfirmation** | counter-evidence gate (summarize, claim-keyed, all types); `negative-searches.md`; `Evidence Against`; `assumptions.md` four-value `Status` | **Seam 4 closed, 1.15.0 (W4).** Tier-1 layer for C5. |
| **Quantitative basis** | figure records carry `basis` + `carries-to`; integrity check 10 invoked from `process-source`; synthesis rules 4a/4b bind draft and turn | **Seam 5 closed, 1.17.0 (W5).** Records the basis, declines the judgment. |
| **Instrument validity** | summarize-section step 7b: (i) a decision rule must be computable from what the evidence measures; (ii) overlapping figure populations must state their relationship. B19 checks presence and non-vacuity only. | **Closed, 1.18.0 (W6d).** Two of C7's four patterns, deliberately. Everything else routes to `needs-domain-expert` and is **not settled**. |

---

## Layer 5 — Roles & expertise

- **Strategic owner (PI) = the human.** Accountable; makes the load-bearing calls. Encoded as the
  `workflow-ownership` stop list: source selection, mid-batch curation, material contradiction,
  waiver, access failure, genuine fork, promotion to outputs, material corpus-review finding.
- **Operational coordinator = the main agent.** Holds position, sequences the batch, runs the
  cycle, mutates shared state, stays interruptible. Must stay inline and in-conversation.
  **[enforced]**
- **Specialist contributors = isolated agents.** Two ship: `research-integrity` (Tier 1) and
  `corpus-reviewer` (Tier 2). A specialist adds **context isolation and independence**, not a
  separate knowledge store. Its expertise comes from the shared reference docs.

Canonical expertise stays in reference docs (`source-assessment-guide`,
`pattern-recognition-guide`, `coverage-assessment-guide`, `evidence-failure-modes`,
`writing-standards`, `posture-register`, `workflow-ownership`). Coordinator and specialists both
read those.

| Work | Role | Execution |
|---|---|---|
| The cycle, state, batch cadence | coordinator | inline, in-conversation |
| Provenance / integrity check | specialist | isolated agent (built) |
| Corpus-level review | specialist | isolated agent, cold, read-only (built) |
| Significance, disconfirmation, instrument validity | — | inline at synthesis |
| Saturation, triangulation | coordinator | inline / cross-ref |

**Decision of record (W5):** significance and disconfirmation stay **inline** unless a seam proves
otherwise. W4 shipped disconfirmation inline at 3/3. The specialist is deferred with a condition
rather than rejected.

### The data-analyst question

Splits in two.

1. **Structural analysis** (`graph-analysis`, `phase-insight`) already exists as read-only
   decision-support **[enforced]**. Simple counting over the claim graph; no independence needed,
   so **not** a persona agent. The metrics could move to a helper.
2. **Deep quantitative reasoning** — judging whether a study's method supports its headline.
   W5 addressed the **positional** half of this: the criteria always existed in
   `source-assessment-guide` §2 and §4, were used to pick a credibility tier, and were then
   dropped. `basis` / `carries-to` + integrity check 10 carry them forward. What W5 deliberately
   did **not** build is the judgment itself, and W6d's escape hatch routes it to a person.
   A conditional specialist remains **[proposed]**, not needed.

---

## Layer 6 — Principles / invariants

A change that violates one is almost certainly wrong.

1. **Provenance.** Every claim traces to a note, every note to a declared source. Nothing reaches
   `outputs/` without a passing audit. **Caveat (Seam 0):** the audit terminates at the *note*,
   not the original source.
2. **Independence defaults to unknown, never assumed.** **[enforced]** across cross-ref and
   check-gaps.
3. **Template beats prose.** Doctrine and the concrete skill edits land together.
4. **Silent pipeline** (posture rule 7). Machinery invisible; findings spoken. **[enforced]** in
   most skills; `discover` prints tool/strategy status, a partial exception.
5. **Stop only for X.** Proceeding is the default; stopping is enumerated.
6. **Position is computed from files, not inferred from conversation** (with the Layer 4 fallback).
7. **Non-invention.** Subject identity from the user only; author names from bylines only; no
   fabricated data.
8. **Phases are sequential.**
9. **The outputs gate is Write/Edit-protected + convention + audit trail, NOT a hard filesystem
   gate.** On Claude Code the hook blocks Write/Edit/MultiEdit to `outputs/`; it does **not** gate
   Bash, and audit itself promotes via `mv`, bypassing the hook by design. `init` also writes
   `.gitkeep` / `.gate-policy.md` there. "Only writer" is a **convention** (audit is the only
   *deliverable* writer) backed by the `gate-log.md` trail. In Cowork the hook is inert and only
   the convention holds.
10. **Curation is the user's; visibility is the plugin's.**
11. **Carry the thinking, not just the position.**
12. **A figure carries what its note says it measures — in the turn as well as the draft**
    (posture rule 8, synthesis rules 4a/4b).
13. **A recorded unknown survives; a blank field loses it.** An omitted field reads as an unasked
    question rather than a refused answer.

---

## Layer 7 — Surface model

- **Hooks are Claude-Code-only** (outputs gate + PreCompact staleness). In Cowork the outputs gate
  holds only by convention. "Structural" here means *not enforced, dependent on the skill obeying
  its own rule*, not technically impossible.
- **Executables must be project-local.** `where-am-i.py` and `validate-corpus-review.py` are
  copied into `research/bin/` at init.
- **Cowork file deletion is gated per folder.** Setup uses Read/Write/Glob, never shell.

---

## Layer 8 — Known limits (seams)

Two are open. The rest are closed and kept here as the record of what the fix actually is.

| Seam | Subject | Status |
|---|---|---|
| **0** | Source-note fidelity — nothing re-reads the original | **OPEN** (partly mitigated, 1.12.0) |
| **1** | Saturation ↔ adequacy | Closed, 1.11.0 (W2) |
| **2** | Significance has no synthesis-time control | Closed, 1.13.0 (W3) |
| **3** | Significance elevated in conversation before cross-ref | **OPEN — watch item, [inferred], unproven** |
| **4** | Disconfirmation type-limited | Closed, 1.15.0 (W4) |
| **5** | Source-level quantitative reasoning thin | Closed, 1.17.0 (W5) |
| — | Recommendation serviceability | Closed, 1.16.0 (W6c/6e/6f) |
| — | Instrument validity | Closed, 1.18.0 (W6d) |

### Seam 0 — Source-note fidelity. OPEN.

Every downstream gate — cross-ref, integrity, audit, synthesis — terminates at the AI-authored
**note**, not the original source, and no step reopens the original. A transcription error,
dropped qualifier, or selective quote baked into a note passes every later check clean. Still
**[inferred]**, and still the most fundamental gap: it is the one failure class whose *observation*
requires the control that does not exist.

**What 1.12.0 (W1) changed.** Notes carry a per-figure record (`measures`, `not`, `locator`,
`verbatim`), and **B15** asserts every cited figure has a usable anchor. That makes the corpus
*checkable* and makes an unlocatable figure a stated fact rather than a silent one. **It does not
check the note against the source.** A green B15 must never be read as "the notes are faithful."

Sampled re-validation at audit was deliberately deferred (W1 fork 2): it needs fetching inside the
audit path and fails on exactly the sources that matter most — paywalled, dated, moved.

**A different seam wearing this one's clothes.** The defect observed in eval iteration 28 was
draft-vs-note, not note-vs-original: a note's "60–70% of teams report a reduction" became "a
60–70% reduction" in the draft. The digits matched, so every numeric check passed. That is
**referent drift**, now **B14**, with prevention at the writing site (`summarize-section`
guardrail 4a). See `w1-design.md`.

### Seam 3 — Significance before triangulation. OPEN, watch item.

In the pipeline, triangulation fires before synthesis **[enforced]**, so the earlier claim that
"triangulation fires too late" was wrong. The residual concern — that significance gets elevated
*in conversation* before cross-ref runs — is **[inferred]** and unproven. Keep as a watch item,
not a confirmed seam.

### Seam 1 — Saturation ↔ adequacy. CLOSED, 1.11.0 (W2).

Was: cross-ref computed saturation (Connect); check-gaps owned the stop (Assess) and never read
it, so a question that was saturated *and* inadequate routed back to Collect every run. Every step
correct, the loop the defect, invisible to every gate because each state was well-formed. The
stall was **[observed]** and not derivable from the code.

**Fix as built:** a precedence contract, not a merged score. cross-ref writes `saturation.json`
(step 7a); check-gaps reads it (step 4a) and crosses it with coverage status (step 6h). Adequacy
governs the stop; saturation never promotes a question to covered. Saturation governs the route
inside the gaps-remain branch. The saturated+inadequate cell is a commissioner decision (step 7c:
three enumerated outcomes, a recommendation, the mapped-channels limit), and step 8 gained the
cycle state that decision lives in. See `w2-design.md`.

### Seam 2 — Significance has no synthesis-time control. CLOSED, 1.13.0 (W3).

Was: "so what" generated at `summarize-section`, with audit and integrity checking *facts* rather
than normative leaps, so a properly cited fact could carry an uncited priority. **[observed]** in a
finished project four ways — a range became a point, an option was "ruled out" on the absence of
evidence for it, the recommendation drifted from leadership's stated frame, and a constraint was
asserted as immovable that the research found was not a lever. None was a citation error; all four
traced.

**Fix as built, and the shape matters:** the taxonomy already existed one tier up, in **C2**
(conclusion-vs-brief) and **C14** (recommendation provenance). W3 is the Tier-1 prevention layer
for them, so it adopts C14's three labels verbatim rather than inventing a parallel taxonomy —
C14's failure condition ("inference *dressed as* evidence-supported") is unrunnable if writer and
reviewer use different words. **B16** checks each label against what stands behind it, wrong label
high and missing one moderate; **B17** compares the conclusion against the Core Question plus any
`directive` ledger entries, at every phase close rather than only the final one, because drift
accumulates. See `w3-design.md`.

### Seam 4 — Disconfirmation type-limited. CLOSED, 1.15.0 (W4).

The counter-evidence gate ran for two of eleven research types, because it triggered on
`CHALLENGED` / `CONTRADICTED` tags that only exist in PRD Validation and Exploratory Thesis. The
discipline was coupled to a tag, the tag to a type. v1.9.0 had already settled that research type
is internal routing metadata, not a decision about which disciplines apply.

**Fix as built:** the gate keys on the **claim** (B16's bar, reused rather than redefined). Every
load-bearing claim carries one of three dispositions — a credible disputing source, a documented
adverse search that came back empty, or an explicit statement that the claim is not disconfirmable
through the mapped channels with what would have been needed. The tags survive as tags and stop
being the trigger.

The falsification loop closed at the other end too. `assumptions.md`'s "what would challenge" was
always *read* (`start-phase` step 5a surfaces relevant Open assumptions), but nothing recorded that
a criterion had been **tested**. `Status` now carries four values, a break propagates as a ledger
`correction`, and closeout asks whether any load-bearing conclusion rests on a still-`Open`
assumption — a **stop, not a block**. Tier-1 prevention layer for **C5**; C5's brief now says a
Tier-1 record may exist and to **check it rather than trust it**. See `w4-design.md`.

### Recommendation serviceability. CLOSED, 1.16.0 (W6c/6e/6f).

The plugin examined whether a conclusion was *supported* (B17, C2) and never whether a
recommendation was **usable**. Three checks close that, each a Tier-1 layer for an existing
reviewer check:

- **6e → C5.** A recommendation names what would show it wrong and whether anything planned could
  produce that observation, with an honest exit for recommendations nothing observable could
  refute. **B18** rejects a refutation that would survive any observation. "Further research may
  refine this" is the expected failure, because it is what fluent writing produces when asked.
- **6f → C6.** A recommendation resting on an unmade decision or unbuilt dependency says so **at
  the recommendation**. C6's failure is "presented as actionable," so the fix is positional: the
  reader who acts is the one who read the first sentence.
- **6c → C4.** Closeout collects every status claim across promoted outputs, STATE, and the ledger,
  and reports contradictions **as a pair without resolving them**. A status claim is only wrong
  relative to another, and the plugin cannot know which document is current.

All three use their C-check's vocabulary verbatim. See `w6cef-design.md`.

### Seam 5 — Source-level quantitative reasoning. CLOSED, 1.17.0 (W5).

The criteria always existed (`source-assessment-guide` §2 Methodology Quality, §4 Sample Size and
Representativeness, including an explicit instruction to flag extrapolation). They were read at
assessment time, used to pick a credibility tier, and dropped. Nothing carried them forward, and
the integrity agent ran on drafts, plans and digests but **never on notes**, so a number's basis
was first examined three steps after the sample had left the building. **The defect was positional,
not analytical**, which is why no new specialist role was added.

**Fix as built:** the figure record gains `basis` (n, selection, who ran it, when — with "unknown"
a legitimate value and omission not) and `carries-to` (the population the figure supports a claim
*about*, which is not always the one it was measured on). The integrity agent gains **check 10**,
invoked from `research-process-source` when a note carries figures, making true a promise the
agent's own usage list had carried since it was written and no skill had kept. Synthesis rule 4b
binds draft **and turn** to `carries-to`, beside 4a's `measures` rule. See `w5-design.md`.

**Correction carried from 1.18.0:** the 1.17.0 changelog said W5 "does not reach" notes arriving
through the interrupted-processing branch. That was wrong. `research-process-source` has a
pre-schema note gain its figure records on contact when the source material is still on disk, and
that rule reaches this branch. The real finding is narrower: it fires inconsistently (0 of 3 runs
before the 1.18.0 recovery change, 2 of 3 after).

### Instrument validity. CLOSED, 1.18.0 (W6d).

**C7 is scoped to "ONLY these named patterns," and that scoping is a concession, not a style
choice.** C7's author had a whole corpus in view, one pass, at the end of a project, and still
concluded that unbounded study-design critique does not work. A Tier-1 version has **less** context
(one section, mid-project) and **more** chances to fire (every synthesis). So the question was not
how to port C7 but which of its four patterns still work when you can see less.

| C7 pattern | Decision |
|---|---|
| Decision rules comparing quantities the instrument never measures | **Build** — the rule is in the draft, `measures` is in the note, the comparison is local |
| Rubrics that structurally predetermine the result | **Leave at C7** — needs the whole instrument; this is the unbounded critique that failed at Tier 2 |
| Unsupported precision (constants beyond supported range) | **Fold into pattern 1** — W5's `carries-to` + check 10 cover most; the residue is a special case |
| Missing measurement crosswalk when overlapping counts coexist | **Build** — concrete trigger, and W5 supplies the raw material |

**Where it lives:** `research-summarize-section` step 7b (after 7a), and **B19** in audit —
presence and non-vacuity only, never quality, mirroring B18's relationship to 7a.

**The escape hatch is mandatory.** Anything outside the two patterns is reported as
`needs-domain-expert`, C7's exact term, and **not settled**. This is what stops a Tier-1 check with
less context from doing the thing Tier 2 already proved does not work. Note the distinction that
matters: "no mapped channel can settle this" says nobody can know, and quietly converts an open
question into an accepted limitation. "A statistician should look at this" hands it to someone who
can, and the end-of-project reviewer still receives it.

**Fork left open deliberately:** whether pattern (ii) should also fire at cross-ref, where
overlapping figures across sources first become visible, rather than only at synthesis. Synthesis
is the smaller, verifiable step and cross-ref already owns independence. Revisit if evals show the
draft is too late. See `w6d-design.md`.

---

## Layer 9 — The corpus-level credibility gate

Corpus-level failures — completion criteria unmet, conclusions exceeding evidence, cross-phase
reversals — are invisible to every per-claim gate above. A real project closed all-green and was
not decision-ready. W7 adds an independent adversarial corpus review as a hard completion gate.
Design: `W7-corpus-review-design.md` (v3.1).

**The prevention half (W6a/b, 1.10.0).** W7 is mitigation — the authority that says no at final
close. W6a/b make it rare that it has to:

- **The criteria preflight.** Final-close stage 1 self-assesses every SC with evidence pointers.
  A plain unmet is a hard stop before a reviewer run is spent; accepted-unmet requires the
  commissioner's recorded words.
- **The advisory criteria trajectory** in every phase debrief, so nobody meets the criteria for the
  first time at final close.
- **The settled-framing guard.** A qualified record (waivers, accepted gaps, sub-headline
  confidence tiers) never reads unqualified, at phase or project close.
- **The decision ledger + B13.** A durable append-only disposition record, so a silent cross-phase
  reversal is a high-severity audit finding at every audit rather than a hope that the final
  reviewer notices.

See `w6ab-design.md`.

**Build status by stage.**

- **Stage 2 — contract spine: shipped.** `reference/corpus-review-protocol.md` (frozen protocol v1:
  manifest/hash identities with STATE split out of the corpus hash, receipt + ledger + completion
  record schemas, the four-op STATE transition and completion sentinels, trust contract, verdict
  logic, exit codes); `reference/validate-corpus-review.py` (manifest / gate / transition /
  check-completion + an embedded deterministic fixture battery);
  `reference/review-protocol-contract.json` (the shipped trust anchor: expected validator hash per
  protocol version); templates for the project marker and canonical completion-criteria file.
- **Stage 3 — reviewer implementation: built and proven.** `skills/research-review-corpus/` (the
  runner: only writer of review artifacts, four-inputs coldness, exclusive-create publishes, failed
  attempts as `.failed.json` in both run kinds, fail-closed disclosure preflight);
  `reference/corpus-review-brief.md` (the fixed C1–C15 battery with required-evidence fields,
  coverage/verdict discipline, the read-nothing-outside-the-manifest rule, the reviewer-result
  schema); `agents/corpus-reviewer.md` (Tier 2, cold, read-only). The validator gained
  `validate-receipt` as an additive mode; battery 69 cases at that point.

  **Proof complete.** The corpus-scale golden campaign (eval iterations 10–18) closed with both
  goldens judged PASS — known-bad `corpus-a` at iteration 10 (Credibility Gate 3, 7/7 seeded-class
  recall) and clean `corpus-b` at iteration 18 (Credibility Gate 3, zero material findings). Every
  intermediate red was a true positive: six fixture authoring defects, one runner-register
  deficiency, three turn-phrasing gaps, all fixed. Fixtures live in
  `eval/targets/know-researcher/fixtures/`; names are neutral so the blind eval-runner cannot infer the
  expected condition.
- **Stage 4 — gate wiring: built.** `audit-claims`' final-phase closeout is the three-stage
  validated closeout: read-only preflight with no conversational authorization; validator gate
  verdict routed by exit code, with a legacy exit-10 path keeping pre-W7 behavior behind a visible
  no-credibility-gate notice; STATE written only via `transition --apply`, every apply exit routed;
  a mutation-free closeout-only re-entry, so a completed final manifest skips the audit entirely and
  the reviewed corpus is never touched between review and close.

  **Side doors closed.** `init`'s STATE/CLAUDE templates scope manual completion to non-final
  phases; `discover`'s inconsistency menu drops manual advance for the final phase. Sentinel readers
  (`progress`, `start-phase`) treat completion as a claim — `check-completion` runs and its verdict
  outranks STATE text. `init` installs the protocol kit and gained a verify-not-presence adoption
  path (`/know-research:init upgrade`) for existing projects, including the pre-adoption-receipts
  staleness case. The validator gained archive drift-checking (closed-unreviewed + corpus/STATE
  drift → stale, never a quiet archive), battery 69→71.
- **Stage 5 — live proof on a real remediated corpus, Cowork path, five release surfaces:**
  **[proposed]**, not run.

**Ownership, enforced:** the **runner** is the only writer of review artifacts; reviewers are
read-only samplers; the **validator** owns the completion verdict and the allowed STATE transition,
and the closeout calls it. See the Layer 2 rows.

**The program-level pattern.** The corpus reviewer enumerated the failure classes first, because it
was written from a real failed project. Almost every Tier-1 addition since has been prevention for
a check that already existed one tier up: W6a/b→closeout classes, W3→C2/C14, W4→C5, W6c/e/f→C4/C5/C6,
W6d→C7. Each uses its C-check's vocabulary verbatim so Tier 2 reads the record instead of
reconstructing it. When adding a Tier-1 check, look for its Tier-2 parent first.

---

## Open work

Not seams. Design calls that want a scope decision, carried from `dev/state/researcher.md`.

1. **The side-file coverage gap.** The referent rules bind notes and drafts. They do not bind the
   durable side-files a synthesize run also writes: `assumptions.md`, `negative-searches.md`,
   arguably the registry. Three instances appeared in one session. **Enumerate which artifacts a
   run writes and decide which the referent rules should bind.** Fixing the instance you noticed is
   the exact error that session paid for four separate times.
2. **Pre-schema-note fixtures.** Several goldens seed notes with no figure records, so Referent
   Fidelity is `n/a` on them and W5's protection is not exercised. Enumerate the set first.
3. **Unfalsifiable `must_not_do` clauses.** The integrity-agent clause cannot be confirmed or
   refuted: the skill forbids narrating the check and the capture records only narration. Either
   observe it mechanically or delete the clause. Applies to any scenario whose `must_not_do` names
   a silent step.
4. **Recommendation-vs-implication boundary.** Descriptive "so what" lines can be prescriptive in
   grammar ("needs its own transfer activities") while labelled implications. A stricter read of 7a
   would score them and they would not score well. Genuine scope question.

---

*Both open seams (0 and 3) are observation problems rather than build problems: Seam 0's failure
class cannot be observed without the control that does not exist, and Seam 3 has never been
demonstrated. Every workstream is built. The next work is the scope decision in item 1 above.*
