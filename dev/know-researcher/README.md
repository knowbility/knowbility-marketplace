# dev/know-researcher

Build and maintenance documentation for the `know-researcher` plugin. None of this ships in the
installed plugin — it lives here so it does not bloat every project's plugin cache.

## Read these two first

| File | What it is |
|---|---|
| **`ARCHITECTURE.md`** | The explanation. What the plugin does, how the research cycle works, what it remembers between sessions, who decides what, and what it does **not** protect against — framed against the harness it runs on. Plain language. Hand this to anyone who needs to understand the system. |
| **`MAINTAINERS.md`** | The ledger. Exact decision and write ownership, the seam register with status, the workstream-to-version map, and evidence labels. Read it before any non-trivial change, and **update it in the same change** when a boundary or principle moves. Authoritative on relationships, subordinate to the skills on mechanics. |

## The design notes

`w1-design.md` through `w6d-design.md` and `W7-corpus-review-design.md` are the per-workstream
design records. `MAINTAINERS.md` cites them by name at nine points in its seam register, which is
why they came across with the port rather than being left behind — a seam register that points at
missing files is worse than no pointer at all.

They record decisions made during the original build, in the repository this plugin was forked
from, and they name the author who made each call at the time. That attribution is left as written.
Rewriting a dated decision record to remove the person who decided would make the record false, and
these documents are only useful to the extent they are true.

## What did not come across

Two files from the source repository's `dev/researcher/` were left there:

- **`constraint-audit.md`** (612 lines) — a sweep of constraints during the original build. Nothing
  that came across cites it.
- **`spike/`** (4 files, 534 lines) — the two-tier corpus-review spike, including its receipt and
  summary. The spike's conclusion is already carried in `W7-corpus-review-design.md`; the raw
  artifacts are a record of one run in another repository.

Both are recoverable from the source repository if a maintainer ever needs them. Neither is
referenced by anything in this directory or in the plugin, so nothing here dangles.

## Versioning

The plugin kept the version it arrived with, `1.18.0`, rather than resetting to `0.1.0` the way
`know-photo-generator` did. That was a deliberate exception, and the reasoning is in the plugin's
`CHANGELOG.md` under the arrival entry. The release procedure is in the plugin's own `AGENTS.md`.
