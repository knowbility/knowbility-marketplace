# Source & Evidence Standards

Reference standards for processing sources, citing evidence, and assessing credibility.

## Evidence Rules

- Every factual claim must trace to a file in `research/notes/`.
- Use confidence language: "confirmed by multiple sources" vs. "single source suggests" vs. "inferred from available data."
- When sources contradict each other, present both. Do not silently pick a winner.
- When a single source contains contradictory figures for the same metric, flag both in the note and resolve which is more reliable before carrying either into an output. Do not silently pick one.
- Date-stamp all data points. Information goes stale — flag anything older than 2 years as potentially outdated.
- Do not interpolate or fabricate midpoints between two data ranges to create a new estimate. If Source A says 5% and Source B says 25%, the answer is not "15%" unless a third source independently reports that figure. Present the range with both endpoints cited.

## Cross-Phase Citation Rules

- When citing a finding from a previous phase, reference the phase output file directly — do not rely on STATE.md summaries for specific numbers. STATE.md carries position and context; phase outputs carry evidence.
- When a number is carried forward from a previous phase, cite the specific phase output.
- When a number appears for the first time in a phase output, it must trace to a source note.
- When referencing a specific number from a previous phase, check `research/reference/canonical-figures.json` first. If the number is registered there, use the canonical value. If it's not registered and this is a cross-phase citation, register it before using it with: `id` (short slug), `value` (exact number or range), `unit`, `qualifier` (domain/context from source), `source_phase`, `source_file`, `confidence` (triangulation level), `registered_when` (which phase first cited it cross-phase), `referenced_by` (array of referencing documents). Never copy numbers from STATE.md summaries or conversation memory — always verify against the canonical file or original phase output.

## Citation Format

- Inline: `[Source: <note-filename>]`
- All sources must appear in `research/sources/registry.md`.

## Source Credibility Hierarchy

[INSERT THE SOURCE CREDIBILITY HIERARCHY FROM THE MATCHING TYPE TEMPLATE]

## Source Processing Rule

Every URL that informs a finding must be processed as a source first.

The workflow is: search finds it → extract full content → structure it into a research note → reference the note in outputs. No shortcuts. Don't cite search snippets directly in outputs — they're discovery tools, not sources.
