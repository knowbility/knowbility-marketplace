# Authoring rules

The rules applied while writing or revising a PRD. Each one exists because skipping it produced a document someone had to interpret.

## Substance

- **Three layers, unbundled.** The problem, the business model, and the solution are three different claims. "I want to sell a nine dollar a month app that tracks inventory" fuses all three. Separate them and examine each on its own: the problem (tracking is error-prone), the business model (subscription), the solution (a mobile app). Never let one sentence carry all three.
- **Layout versus behavior.** Mockups and prototypes are canonical for layout. The PRD is canonical for behavior. Where the two disagree, flag it. Never silently reconcile.
- **Decided versus open, always.** Anything open lives in §0 (needs engineering input), §21 (an open design task), or §22 (provisional, with a stated default and a named confirmer). No hedging inside contract sections. A contract section that says "probably" or "we could" is a defect.
- **A stated default must itself be buildable.** If the fallback cannot be executed, the item has no default and is simply open. An unbuildable default is more dangerous than a blank, because it is formatted like a decision and reads as one.
- **State-keyed everything.** If a state exists in §5 or §13, it has a rendering in §16 or a criterion in §18, and ideally both.
- **Reference, do not duplicate.** Canonical facts live in one document. The PRD points at them in its reads-with line. Copying a value means it will drift.
- **The worked example is part of the spec.** Acceptance criteria name its states. A PRD without a worked example says so, says why, and says what the criteria key to instead.
- **Sourced numbers only.** Any statistic or threshold carries its source or is explicitly marked a placeholder. An unsourced number in a PRD becomes a requirement by accident.
- **Do not invent.** If the answer is not known, it goes in §0 with what must not be assumed. Filling a gap with a plausible guess is the most expensive thing an author can do here, because it reads as decided.

## Writing

- **Readable, not just correct.** Plain, fluid sentences. Section headers say plainly what the section is. No metaphors as labels. No business-speak, no coined slogans, no strings of fragments for drama.
- **Plain language in Part I, terse allowed in Part II.** The experience walkthrough should read like someone explaining the thing to a colleague. The contract tables can be clipped.
- **Write for the person who arrives cold.** Assume the reader was not in the meeting, does not know the acronyms, and will not ask a question before building.
- **No self-narration.** The PRD states the contract. It does not describe its own drafting process, congratulate itself, or explain what changed inside the body. Provenance belongs in the header's Last updated line and the §22 resolutions log, nowhere else.
- **House style is configurable.** Style rules specific to a team (banned punctuation, the preferred word for the end user, forbidden insider language) live in the project profile. See `profile.md`.

## Revision

- **Change-log discipline.** Every editing pass gets a named, dated entry in the header's Last updated line, and if it decided anything, a §22 entry.
- **Sweep every reference, not just the cause.** After applying a change, find every section that *mentions* the changed thing, not only the sections that motivated the change, and account for every mention found: updated, fixed, or unaffected with the reason. This is the most common way a revised PRD acquires contradictions: a decision gets recorded and applied where it originated, while an older section keeps stating the thing that was just replaced. Copy blocks, walkthroughs, and prior-art tables are the usual survivors.
- **Flag, do not smooth.** When new information contradicts something the document states as decided, surface the contradiction. Quietly adjusting scope around it is how a document keeps scoring well while describing work whose reason has evaporated.

## Process

- **Kill the PRD when the case fails.** The deliverable of a weak case is the recommendation not to build, stated plainly. That is a successful outcome, not a failure of the process. The recommendation names which layer failed and what evidence would change the answer, and it never reads as judgment on the person who proposed the work.
- **Do not grow scope to look thorough.** A ships row that does not trace to the outcome is cut or moved post-v1, no matter how good the idea is.
- **Nothing is destroyed quietly.** Every mutation of an existing document is previewed, confirmed, and recoverable.

---

*Authored for this plugin, drawing on the authoring rules in an internal structure-and-authoring guide (retrieved 2026-07-26). The buildable-default rule and the sweep rule were added from findings produced by running the rubric on this plugin's own specification.*
