# W6a/b design — completion integrity + cross-phase consistency

Status: APPROVED — all four forks resolved per recommendation (Kelsey, 2026-08-06):
(1) hard stop, (2) advisory, (3) new append-only ledger, (4) all four entry classes.
Build order: W6b ledger foundation → writers + B13 → W6a mechanisms → fixtures/goldens →
release. Authored under the upskill discipline: every
mechanism below states its intent; nothing scripts what a model should judge; anything
deterministic moves to a mechanism.

## The delta against W7 (why these workstreams still exist)

W7 shipped the *mitigation*: a cold reviewer reads the finished corpus against the brief
and the completion criteria (C1 enumerates every SC-N with a disposition), and the
validator refuses completion until material findings close. What W7 deliberately did not
build is *prevention* — nothing in-line stops a not-ready project from reaching the
reviewer, and nothing at phase grain checks criteria at all. The engine project's failure
modes map cleanly:

| Engine failure | W7 catches it? | W6a/b closes it |
|---|---|---|
| Registered validation items unrun at close | Yes, at final review (C1 unmet) | W6a: caught in-line at preflight, before a reviewer run is spent |
| Headline deliverable rated "Insufficient" by its own audit, presented as settled | Partially (C-checks on contradiction) | W6a: closeout framing must carry the audit record forward |
| Later phase silently reverses an earlier disposition (causal→correlational undone) | Yes, if the reviewer notices across ~everything | W6b: ledgered disposition + battery enforcement at every audit |
| Phase closes with plan criteria unexamined | No — reviewer runs only at final | W6a: phase-close criteria surface |

W7 remains the authority on completion. W6a/b make it rare for the authority to have to
say no.

## W6a — completion integrity at closeout

### Mechanism 1: SC self-assessment at final-close preflight (stage 1 addition)

At closeout stage 1 (already read-only, already terminal-on-discrepancy), add: read
`research/reference/completion-criteria.md`, enumerate every SC-N, and self-assess each
with a pointer to the evidence (an output, an audit, a ledger entry). Three dispositions:
**met (evidence named)**, **unmet**, **accepted-unmet (commissioner acceptance on
record — their words, dated, in notes-to-self.md or the decision ledger)**.

Any plain **unmet** ends the turn with the named remedy, exactly like a manifest gap —
before `/know-research:review-corpus final` is ever suggested. Intent: a reviewer run is
expensive and the receipt is frozen to a corpus hash; spending it on a corpus with a
self-detectably unmet criterion wastes the run and teaches the user the gate is noise.
The self-assessment is *not* written into the corpus as an artifact — the reviewer's C1
stays cold and authoritative; this is a preflight, not a rival verdict.

### Mechanism 2: criteria surface at non-final phase close (advisory)

At non-final phase closeout (After Audit step 3), after the deliverable manifest: read
completion-criteria.md and report, in the debrief, any SC whose subject matter this
phase's work touched — moved toward met, still unmet, newly at risk. Advisory register:
it informs the commissioner's sense of trajectory; it blocks nothing. Intent: the engine
project reached final close with criteria nobody had looked at since init. The fix is
recurring visibility, not a per-phase hard gate (phases legitimately leave criteria for
later phases; a binding per-phase gate would force artificial criteria-to-phase
assignments the plan never made).

### Mechanism 3: the settled-framing guard (closeout content contract)

At final close (stage 3 exit 0 → debrief) and at phase debriefs, the completion/phase
report must carry the qualification record forward — in its own words, but conveying:
every waiver granted on a promoted deliverable, every accepted gap, and any headline
claim whose audit confidence tier is below the deliverable's presented confidence. A
completion whose record contains qualifications may never read as unqualified. Intent:
"validated closeout" attests process, not strength; the engine corpus read as settled
because the closing prose outran the audit record. This is a content contract on the
existing debrief, not a new artifact.

## W6b — cross-phase disposition + correction consistency

### The anchor problem (verified 2026-08-06)

The three existing disposition records are all soft:
- Contradiction resolutions live in `cross-reference.md`, which fully regenerates;
  resolutions carry forward only "if the contradiction still exists in re-analyzed data."
- Accepted gaps live in `gaps.md`, which fully regenerates; acceptance survives by
  re-recording convention (check-gaps 7b).
- Audit corrections (the causal→correlational class) exist only as prose in immutable
  audit reports and as edits to drafts — no structured record at all.

A reversal-enforcement check needs an append-only durable anchor. **FORK 3** below.

### Mechanism 4 (fork-dependent): the decision ledger

Proposed: `research/reference/decision-ledger.md` — append-only, one entry per recorded
disposition, exact grammar (W7 resolution-ledger precedent). Entry classes:

- **correction** — an audit downgraded/reframed a claim (writer: audit-claims, at the
  audit that made the correction)
- **resolution** — a contradiction resolved, incl. user overrides (writer: cross-ref, at
  resolution time — the regenerated cross-reference.md remains the working view; the
  ledger is the durable record)
- **acceptance** — an accepted gap (writer: check-gaps 7b, alongside the gaps.md record)
- **directive** — a commissioner directive that changes scope/criteria (writer: whichever
  skill receives it; today these go to notes-to-self.md — the ledger entry points there)

Supersession, never edit: reversing a ledgered disposition is a *new* entry citing the
old ID and the new evidence. Grammar (draft):

```
D-<n> | <class> | <ISO date> | phase <N> | <subject, one line> | <disposition, one line> | evidence: <path or "commissioner: '<their words>'"> [| supersedes D-<m>]
```

### Mechanism 5: battery enforcement (new item B13)

**B13 — Disposition conformance.** For every claim in the draft whose subject matter a
decision-ledger entry covers, the claim must conform to the ledgered disposition or
carry an explicit, evidenced supersession (new ledger entry + disclosure at the claim
site and in Methodology & Limitations, the B10 pattern). A silent reversal is
**Disposition reversal undisclosed** (high-severity). Runs at every audit — this is what
makes a correction *hold downstream* without any per-phase ceremony.

### Mechanism 6: synthesis-side prevention (light)

summarize-section reads the decision ledger before drafting (alongside its existing
canonical-figures read) so conformance is the default, not an audit catch. One read, no
new judgment: the intent is that the drafter knows the record, not that the drafter
re-adjudicates it.

## Author forks

1. **(W6a-M1) Unmet SC at final preflight: hard stop, or disclose-and-proceed?**
   Rec: hard stop — matches the manifest-gap precedent; the accepted-unmet path is the
   pressure valve, and it requires the commissioner's words, not the agent's.
2. **(W6a-M2) Phase-close criteria surface: advisory (rec) or binding per-phase gate?**
   Rec: advisory — binding would force criteria-to-phase mappings the plan never made.
3. **(W6b-M4) New append-only decision-ledger artifact (rec), or federate enforcement
   over the existing regenerated files?** Rec: the ledger — the anchor problem is real
   (verified above); federation enforces against records that can silently vanish.
4. **(W6b scope) All four entry classes (rec), or corrections only?** Rec: all four —
   the entry-writers already own their decisions today; the ledger only makes the
   records durable. Corrections-only leaves resolutions and acceptances on soft anchors.
5. **(Adoption)** Resolved at build time with a lighter mechanism than proposed: init
   installs the ledger for new projects; on existing projects the *writing skills
   create it from the plugin template on first use* (create-if-absent). No upgrade
   ceremony, covers every project, and B13 degrades gracefully — no ledger file means
   nothing ledgered, reported as `B13 — n/a`, never an error. Step 0b stays strictly
   about the review-protocol kit.

## Touches

- `research-audit-claims` — stage-1 SC preflight (M1), settled-framing contract (M3),
  B13 (M5), correction ledger writes (M4)
- `research-check-gaps` — acceptance ledger write beside 7b (M4)
- `research-cross-ref` — resolution ledger write at resolution time (M4)
- `research-summarize-section` — ledger read before drafting (M6)
- `research-init` — completion-criteria template note, ledger template + install +
  upgrade path (M4, adoption)
- `dev/know-researcher/MAINTAINERS.md` — Layer 2 ownership rows (ledger writers), Layer 3
  artifact table (decision-ledger.md: durable), Layer 8 seam updates, Layer 9 prevention
  half, same change
- corpus-review-brief: reviewers already read everything; note the ledger as a named
  input for C-checks (additive, no protocol bump — confirm against frozen contract
  before touching)

## Verification

- Fixtures: extend corpus-a with (a) an unmet SC at close, (b) a silent
  causal→correlational reversal across phases — both must be caught in-line (new
  goldens), and corpus-b stays clean (ledger present, conformant).
- Eval: new golden for the final-preflight SC stop; extend the audit golden for B13;
  regression on the four touched skills.
- Live: the remediated engine corpus, when Kelsey's fixes land — would W6a/b have
  caught what Codex caught?
