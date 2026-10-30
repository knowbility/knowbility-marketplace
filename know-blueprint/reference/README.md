# Blueprint — reference library

Read-only material the skills load at runtime. Doctrine lives here once; the skills point at
these files and never copy their content inline.

Used by `blueprint-capture`:

- `blueprint-template.md` — the Process Blueprint output structure. Every capture fills
  this template; template changes must be additive so existing Blueprints stay valid.
- `example-blog-content-blueprint.md` — a worked example (deep mode, blog content
  workflow). Sets the specificity bar a finished Blueprint should hit. Illustrative
  content, not a real company's process.

Used by `blueprint-design`:

- `design-doctrine.md` — the grounded-proposer rule (propose only from the operator's real
  goal/constraints and their nearest analog, never generic best-practice), constraint
  non-invention, the proposed/rests-on/breaks-if step convention, conservative ratings, and the
  design→run→capture lifecycle bridge. Capture's `blueprint-template.md` is the shared output
  structure (Design mode + "Designed — not yet run" status).

Used by `blueprint-discover`:

- `discovery-sweep.md` — the recall cues that surface an operator's recurring work, and the
  three lenses (automation opportunity, operational exposure, knowledge-loss risk) that turn
  a raw list into a prioritized starting portfolio.
- `process-inventory-template.md` — the Process Inventory output structure (thin candidates,
  no autonomy ratings). Changes must be additive so existing inventories stay valid.
