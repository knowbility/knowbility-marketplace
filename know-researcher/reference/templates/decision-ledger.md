# Decision Ledger

Append-only record of the project's recorded dispositions — the decisions later work
must honor or explicitly supersede. The working views (`cross-reference.md`, `gaps.md`,
audit reports) regenerate or accumulate; this file is the durable anchor the audit's
disposition-conformance check (B13) enforces against, and the corpus reviewer reads it
as part of the corpus.

Rules:
- **Append-only.** Never edit or delete an entry. Reversing a disposition is a *new*
  entry that cites the old ID in its `supersedes` field and names the new evidence.
  An edited or deleted entry is corpus damage, not housekeeping.
- **IDs are stable** (`D-1`, `D-2`, …) — sequential, never renumbered, never reused.
- **One entry per line**, exact grammar (fields pipe-separated, in this order):

```
D-<n> | <class> | <YYYY-MM-DD> | phase <N> | <subject, one line> | <disposition, one line> | evidence: <sources> [| supersedes D-<m>]
```

  `<sources>` is a file path, a `commissioner: "<their exact words>"` quote, or **both**
  comma-joined when the decision has a written record *and* the commissioner's words —
  `evidence: research/cross-reference.md, commissioner: "confirm: side-A"`. Both is the
  better record when both exist; never paraphrase the quoted half.

- **Entry classes** (the writer is the skill that owns the decision):
  - `correction` — an audit reframed or downgraded a claim (e.g., causal→correlational).
    Written by `/know-research:audit-claims` at the audit that made the correction.
  - `resolution` — a contradiction resolved, including user overrides. Written by
    `/know-research:cross-ref` at resolution time; the regenerated `cross-reference.md`
    remains the working view.
  - `acceptance` — a coverage gap the commissioner accepted carrying. Written by
    `/know-research:check-gaps` alongside the `gaps.md` record; the quoted words are the
    commissioner's, never the agent's.
  - `directive` — a commissioner directive changing scope, criteria, or method. Written
    by whichever skill receives it; the entry points at the full record (typically
    `research/notes-to-self.md`).

<!-- entries below this line; do not remove this comment -->
