# W1 design — source-note fidelity (Seam 0)

The trust anchor. Every check in the plugin terminates at the AI-authored note; nothing ever
re-reads the original. A dropped qualifier or a misquote committed at capture is invisible
forever after, because everything downstream validates against the note that contains it.

Written 2026-08-09, before implementation, per the plan's "design before build" rule.
Grounding: `~/.claude/plans/shimmying-sauteeing-storm.md` § W1, plus a defect observed in eval
iteration 28.

## First, a correction to how this workstream got promoted

W1 was moved ahead of W3 on the strength of a defect found during W2's verification. Reading
that defect closely, **it is not the seam W1 is scoped around.** Saying so before building,
because it changes what gets built.

The observed run (`_eval/iteration-28/adv-counter-evidence-valve/run-3/`):

| | Text |
|---|---|
| The note says | "60–70% **of mid-market SaaS teams report** onboarding automation reduced time-to-value" |
| The draft says | "Mid-market SaaS teams that adopted onboarding automation **report a 60–70% reduction in** time-to-value" |

The note is faithful to its source. The **draft** is unfaithful to the **note** — and the
number kept its digits while changing what it measures, from *a proportion of teams* to *a
magnitude of effect*. Those are different claims, and the second is far stronger.

So there are two distinct gaps here, and the evidence proves only one of them.

**Gap A — note vs. original (W1 as scoped, Seam 0).** Structurally certain and **never
observed**, because observing it requires re-reading originals and nothing in the system does
that. Its invisibility is the finding.

**Gap B — draft vs. note, at the level of meaning (observed today).** Every numeric check
compares digits. None compares what the number is *of*. Call it **referent drift**.

The uncomfortable part: **the planned first cut for W1 — passage locators — would not have
caught the observed defect**, and a fix for the observed defect would not touch Gap A. Building
W1 as written and calling the observed defect covered would be exactly the kind of
"orderly-looking wrong ending" this program keeps finding.

### Why every existing check missed Gap B

Traced against the checks that actually ran:

- **Integrity check 1 (fabricated data)** — "60–70%" appears in a source note. Passes.
- **Integrity check 2 (range narrowing)** — the range is identical. Passes.
- **Integrity check 3 (qualifier stripping)** — "mid-market SaaS teams" survives into the draft.
  What changed was the figure's referent, not a qualifier. Passes.
- **Battery B3 (canonical-figure match, *including units*)** — the closest existing check, and
  the only one whose wording reaches this. It never ran: this scenario ends at synthesis and
  `audit-claims` was not invoked. And "unit" is undefined for a proportion — % of *what* is
  precisely the thing that drifted.

There is also a **third, separate failure in the same run**, and it is a miss of a check that
exists rather than a missing check: the draft's Methodology & Limitations says "Single-source
findings: none. Both findings in this section rest on two independent sources," when finding 1
comes from the adoption study and finding 2 from the case studies — one source each. Integrity
**check 7 (confidence inflation)** compares language strength against source count and cleared
it.

## The design

### The insight that shapes it: both gaps land on the same surface

Gap A's fix is a per-quote/figure **locator** in the note. Gap B's fix is a per-figure
**referent** in the note. Both are the same schema change to the same file, enforced by the
same kind of battery item, and both require the same migration for existing projects.

Shipping them separately means migrating the note format twice and asking every live project to
re-init twice. Shipping them together costs one migration.

### M1 — structured figure records in the note (both gaps)

`research-process-source` step 5 currently asks for "Key findings" as prose and "Direct quotes
for important claims (with context)." Every quote and figure that a draft may later cite gets a
structured record instead:

```markdown
- **figure:** 60–70%
  **measures:** share of surveyed mid-market SaaS teams reporting any reduction in time-to-value
  **not:** the size of the reduction
  **locator:** §3, "Adoption Outcomes" table, row 2
  **verbatim:** "60–70% of mid-market SaaS teams report that onboarding automation reduced time-to-value"
```

`measures` is the anti-referent-drift field and the load-bearing one. `not` is optional and
exists because the failure mode is a *plausible neighbouring reading* — naming the reading the
figure does **not** support is what makes the drift checkable rather than a judgment call.
`locator` is Gap A's enabling condition: it is what a re-validation pass would need in order to
go look, and it makes "I could not find this in the source" a statable result.

### M2 — battery item B14, referent conformance (Gap B)

For every figure in the draft that traces to a note's figure record: does the draft's sentence
use it for what `measures` says it measures? A draft that uses a share-of-population figure as a
magnitude-of-effect figure fails, at high severity, **even though the digits match** — and the
report says which reading the note supports and which the draft used.

This is the check whose absence let the observed defect through, and it belongs in the battery
rather than in the integrity agent because the integrity agent already had three chances at it.

### M3 — battery item B15, locator presence (Gap A, first cut)

Any quote or figure in a note lacking a `locator` is flagged. This does **not** verify the
locator is correct — nothing re-reads the source yet. It makes the *absence* of a verifiable
anchor visible, which is the honest first cut and the precondition for the sampled
re-validation in fork option (c).

### M4 — tighten confidence inflation (the check that exists and missed)

Check 7 compares language strength to source count. It cleared "Both findings rest on two
independent sources" over two findings with one source each, because it counted the sources in
the *section* rather than the sources for *each finding*. The count is per finding, not per
section, and an M&L statement about source counts is a claim like any other.

## Author forks — all three resolved 2026-08-09 (Kelsey took the recommendation on each)

**Fork 1 — scope of this release.**
(a) W1 as originally scoped: locators only. Closes Gap A's enabling condition; leaves the
observed defect open.
(b) Referent drift only: B14 + M4. Closes what was observed; leaves Gap A untouched.
(c) Both, one release: M1–M4 together.
*Recommendation: (c).* They are one schema change and one migration. Doing them apart costs two
note-format migrations and asks every live project to re-init twice, which is the larger cost by
some distance.

**Fork 2 — how far the locator goes now.**
(a) Locator field + presence check only (nothing re-reads the source).
(b) Also add sampled re-validation at audit: for N sampled quotes, re-fetch the source and
compare.
*Recommendation: (a) now.* (b) needs a fetch inside the audit path, which is a new capability
and a new failure surface — and re-fetching is unreliable for exactly the sources that matter
most (paywalled, dated, moved). Ship the anchor first; decide (b) once locators exist and we can
see how often they are even resolvable. **Note this makes Gap A's *detection* still deferred** —
that should be said plainly in the changelog rather than implied closed.

**Fork 3 — migration for existing projects.**
Notes written before this change have no figure records. (a) Retrofit on next touch: any note a
skill reads gets its figure records built then. (b) Bulk migration via `/know-research:init upgrade`.
(c) Grandfather: B14/B15 report `n/a (pre-schema note)`.
*Recommendation: (c) plus (a).* Grandfathering keeps the battery honest — a check that fires on
every old note is noise people learn to skip — while retrofit-on-touch means the corpus converges
without a migration event. The absence of a figure record on an old note is a fact worth
reporting once, not a finding to repeat every pass.

## Touches

- `know-researcher/skills/research-process-source/SKILL.md` — note schema (M1).
- `know-researcher/skills/research-audit-claims/SKILL.md` — B14, B15 (M2, M3).
- `know-researcher/agents/research-integrity.md` — check 7 per-finding counting (M4).
- `know-researcher/skills/research-init/SKILL.md` — scaffold + docs for the new note shape.
- `dev/know-researcher/MAINTAINERS.md` — Layer 2 ownership rows + Layer 4 judgment map, same change
  (plan rule 1). Seam 0's partial-mitigation entry in Layer 8.

## Verification

- A golden built directly from the observed defect: the note says "60–70% of teams report a
  reduction," the draft says "a 60–70% reduction," and the audit must fail it as referent drift
  rather than passing it as a matching figure.
- A negative control: same figure used correctly must not be flagged. Referent checks that fire
  on correct usage are worse than none.
- An M&L source-count golden for M4: two findings with one source each, an M&L claiming two
  independent sources per finding.
- A pre-schema note must report `n/a`, not a finding (Fork 3).
- `adv-counter-evidence-valve` must stay green — it is where this came from, and its Valve
  Honesty score must not move.
