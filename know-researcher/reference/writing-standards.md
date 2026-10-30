# Writing & File Standards

Reference standards for writing research outputs and naming files.

## Writing Standards

- Lead with the finding, support with evidence. Not the reverse.
- Every finding must answer "so what does this mean for the project?"
- Be specific: not vague hedging, but "The [document/thesis/company] assumes X, but evidence shows Y."
- No orphan claims. If you can't cite it, label it or cut it.
- **Label every load-bearing "so what" with where it comes from** — the statements a reader would act on. Three labels, fixed, and shared with the corpus reviewer so both use the same words for the same distinction: **evidence-supported implication** (a reader can follow the cited notes there), **analyst inference** (reasoning past what any source states — legitimate, often the best thing in the report, simply not established), **commissioner priority** (follows from a stated preference or directive; cite it). The label goes inline in the sentence, not in a block at the end: the reader who most needs it is the one deciding whether to act. Citing a source is not the same as licensing a conclusion — all four failures this rule exists to stop were properly cited.
- Use prose paragraphs in outputs. Reserve bullet lists for data tables and key findings sections only.
- Use people's names, not titles. "Carolyn" not "the CEO." "Elizabeth" not "the co-founder." Establish the name-title mapping once in the first phase output, then use names throughout.

## Precision Preservation

- When summarizing a range from source notes, preserve the full range. Do not midpoint. Do not drop the unfavorable end. If a range is too wide to be useful, say so — do not narrow it silently.
- Qualifiers present in phase outputs must be carried into downstream documents. If compression requires dropping a qualifier, note the simplification explicitly.
- Editorial judgments (e.g., "X is right about Y") must be explicitly supported by findings, not inferred from the overall direction of the research.

## Source Triangulation

For each major finding in an output, note how many independent sources support it:
- **1 source** — Flag as preliminary. Use language: "single source suggests."
- **2 sources** — Moderate confidence. Use language: "supported by limited evidence."
- **3+ sources** — Converged. Use language: "confirmed by multiple sources."

This makes evidence strength visible at a glance and prevents single-source findings from being presented with unearned confidence.

## Synthesis-Specific Rules

These apply when writing synthesis documents that pull from multiple phase outputs:
- Every specific number in a synthesis must appear in the phase output it cites, with the same value. Do not round, adjust, or "improve" numbers during synthesis.
- Ranges must be preserved from source. Do not narrow, midpoint, or round favorably.
- When citing a finding from a previous phase, reference the phase output file directly — do not rely on STATE.md summaries for specific numbers.
- When a number is carried forward from a previous phase, cite the specific phase output.
- When math is performed in the synthesis (e.g., calculating a remainder), show the work and cite the inputs.
- If multiple synthesis documents reference the same underlying finding, they must use the same figure. Cross-check before finalizing.

## File Naming

- Source notes: `research/notes/<slugified-source-title>.md`
- Draft sections: `research/drafts/<part-number>-<section-slug>.md`
- Audited outputs: `research/outputs/<part-number>-<section-slug>.md`
- Audit reports: `research/audits/<original-filename>-audit.md`

Slugs are lowercase, hyphens instead of spaces, no special characters. Keep them short but identifiable.
