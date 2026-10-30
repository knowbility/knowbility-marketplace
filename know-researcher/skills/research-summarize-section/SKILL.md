---
name: research-summarize-section
description: This skill should be used when the user asks to draft, synthesize, or write up a section from the sources collected so far (e.g. "draft the phase 2 section", "synthesize what we have on pricing", "write up the findings"). Pulls claims and evidence from relevant processed sources into a draft under research/drafts/ and stages it for the /know-research:audit-claims gate — never writes straight to outputs/.
argument-hint: "[section-name-or-phase-number]"
---

# /know-research:summarize-section

Synthesize research notes into a draft output section for a specific phase or topic. Drafts are written to `research/drafts/` — NOT `research/outputs/`. Only `/know-research:audit-claims` can promote a draft to `outputs/`.

## Input
The user will provide a section name or phase number to summarize.

## Pre-checks (mandatory)

Before writing anything, verify:
1. **`research/cross-reference.md`** has been updated within the last 5 sources (the checkpoint counter in STATE.md). If it hasn't, stop and run `/know-research:cross-ref` first.
2. **`research/gaps.md`** has been updated for this phase. If it hasn't, stop and run `/know-research:check-gaps` first.
3. **`research/cross-reference.md` has no unresolved core contradictions.** Read the Contradictions section. If any contradiction classified as "core" (directly addresses a current phase question) has status "unresolved," stop and tell the user:

   ```
   Synthesis blocked — unresolved contradictions on core phase questions:

   - [Contradiction description]: [Source A claim] vs. [Source B claim]
     Suggested resolution: [Claude's suggestion from cross-ref]

   To proceed, resolve each contradiction by running /know-research:cross-ref and confirming or overriding the suggested resolution. Peripheral contradictions (flagged but not core) do not block synthesis.
   ```

   Do not proceed until all core contradictions are resolved. Peripheral contradictions (those not directly addressing a current phase question) should be noted in the draft but do not block synthesis.

3a. **`research/gaps.md` has no collection-exhausted question awaiting the commissioner's decision.** Read the coverage entries. If a question on this phase is recorded as saturated with coverage still below the bar and no recorded outcome — no acceptance, no re-scope, no new channel — stop and tell the user:

   ```
   Synthesis blocked — a coverage decision is open on this phase:

   - [Question]: [N] independent Direct source(s); the mapped channels have stopped
     producing new information on it.

   The three ways forward are in the gap report: accept the gap and carry it into the
   draft's limitations, re-scope the question, or open a channel discovery hasn't
   mapped. Run /know-research:check-gaps to see the recommendation, and record your decision
   there. Drafting now would answer it by proceeding.
   ```

   Do not proceed until the decision has an outcome. **An accepted gap is an outcome and does not block** — that is what acceptance is for: the phase proceeds carrying the limitation, and the draft's Methodology & Limitations section states it in the commissioner's recorded terms. What blocks is the *unanswered* question, for the same reason an unresolved core contradiction blocks: the corpus needs a decision it does not have, and drafting past it makes the decision silently and in one direction.

4. **Source staleness advisory.** Read `research/research-plan.md` to identify the research type, then read the corresponding type template in `${CLAUDE_PLUGIN_ROOT}/reference/templates/types/` to get the **Staleness Threshold** value. Read all source notes in `research/notes/` relevant to this section. For each source note, compare its **data year** (not publication year — a 2025 article citing 2021 data uses 2021) against `current year minus threshold`. If any sources exceed the threshold, display a staleness advisory before proceeding:

   ```
   Source staleness advisory (threshold: N years for [research type]):

   - [source-note-filename]: data year [YYYY], [M] years over threshold
   - [source-note-filename]: data year [YYYY], [M] years over threshold

   These sources will be included in synthesis with age caveats. Stale evidence is still evidence but carries reduced weight.
   ```

   This is a **warning, not a gate** — synthesis proceeds after displaying the advisory. If no sources exceed the threshold, skip the advisory silently.

5. **Counter-evidence gate — keyed on the claim, not the research type.** Every load-bearing claim this draft makes must show that someone looked for evidence against it. **Load-bearing** is B16's bar and no new one: a statement a reader acting on this report would act on. Reuse the audit's reading of it rather than inventing a second definition.

   **Why this is not scoped by research type.** Until v1.14.x this gate read "PRD Validation and Exploratory Thesis only", because it worked by looking for a source note tagged `CHALLENGED` or `CONTRADICTED` — and those tags exist only in those two types' tag sets. So the discipline was coupled to a tag, the tag was coupled to a type, and **nine of eleven research types had no disconfirmation requirement of any kind**. A Competitive Analysis or a Market study could reach a promoted deliverable with nothing having asked whether its central claim could be wrong. v1.9.0 already settled the principle this violated: research type is internal routing metadata, not a classification that decides which disciplines apply. Every type has load-bearing claims that could be false. **The two tags stay as tags** — they are still how those two types mark a challenge — but they stop being the trigger.

   For each load-bearing claim, one of three outcomes must be on the record. The third is new and is the honest exit this gate previously lacked. **They are named, not lettered, deliberately:** steps (d) and (e) below are the *procedure* for reaching Outcome 2 and for blocking when none of the three is available, and a single a–e sequence covering both outcomes and procedure invites citing a procedural step as though it were a disposition — observed on the first run against this gate.

   **Outcome 1 — a credible source disputes it.** Scan the processed source notes in `research/notes/` for this phase for a finding that opposes the claim, from a source above "blog/opinion" credibility (official docs, analyst reports, peer-reviewed, industry data, developer community). **Whatever tag the project's set happens to use, or none** — a note that plainly contradicts the claim qualifies whether or not it carries `CHALLENGED`/`CONTRADICTED`.

      **But it must dispute *this* claim, measured the same way.** Dropping the tag requirement removes the bar's *label*, not the bar itself, and the gap is where a false challenger walks in. A source reporting a different figure for a **different quantity** is not a challenger — it is a second finding about a second thing. Test it before accepting: does this source and the claim measure the same quantity, over the same population, on the same clock? If any of the three differ, it is not opposition and taking it as opposition is the manufactured-challenger move wearing a real citation.

      **The project's own cross-reference has usually already ruled on this — do not overturn it silently.** If `cross-reference.md` filed a source as measuring a different sub-metric rather than contradicting, that is a recorded disposition and B13's rule applies: you may supersede it, but not by quietly reading it the other way inside a gate check. Observed on one sample in three: a run accepted a vendor's *implementation* timeline as a challenger to a *decommissioning* claim, against its own cross-reference, and passed the gate on it. Two sibling runs rejected the same source unaided — "that's the setup timeline, not the teardown" — which is the reasoning this paragraph now makes mandatory instead of optional.
   **Outcome 2 — a documented adverse search came back empty.** The existing exit, unchanged; its procedure is step (d) below.
   **Outcome 3 — the claim is not disconfirmable through the mapped channels, stated as such with the reason.** Some claims genuinely cannot be refuted by what discovery mapped — no channel produces evidence against them, or the claim is definitional, or the disconfirming evidence would sit behind a source type this project has no access to. **Saying so is a real result**, and it is what stops the gate becoming a ritual people route around. It must be stated with what would have been needed, and it must **name the claims it covers**. **One reason may cover several claims when it genuinely applies to each** — two claims that both rest on a figure only the company's own unpublished books could contradict share one reason (the refuting source type is unreachable, not merely unfound), and writing it out twice is the repeated-template tic, not rigour. What is banned is the *unearned* blanket: a phase-level "none of these are disconfirmable" that names no claims and stretches one reason over claims it does not fit. The test is the one the adverse-search exit uses two screens down — **the label may cover the group; the reason may not, unless it is true of every member and you have named them.**

   **Say the finding, never the machinery — posture rule 7 applies to this gate like every other write.** Do not name "the counter-evidence gate", "pre-check 5", or "Outcome 3" to the commissioner; observed on the first control run, whose turn said the draft "satisfies the section's counter-evidence check" — a sentence posture-register uses as its own example of what not to say aloud. What the commissioner needs is the substance: who disputes the claim, or that a search was run and came back empty, or that nothing available could refute it and what would have been needed. **The register constraint is stated here rather than left to the register section on purpose** — this repo has now recorded several times that a requirement added without its register constraint defaults to narrating the mechanism, because the mechanism is what the instruction was about.

   **The requirement is per claim; the record is one phase-level pass.** List every load-bearing claim with its disposition (Outcome 1, 2, or 3). Where a single adverse search genuinely covers several claims — one search against the phase's subject, not one per sentence — cite that one record against each claim it covers. This is the whole cost answer: the obligation is per claim so that nothing slips through, while the *work* is per search so the gate stays affordable.

   d. **Procedure for Outcome 2.** Check for a **documented adverse search**. Read `research/reference/retrieval-log.json` and the phase's candidates file(s) in `research/discovery/` and identify queries that specifically sought opposing evidence (negating/challenging terms, counter-viewpoint channels). If such a search was run and surfaced nothing credible, present the record for acknowledgment:

   ```
   No credible counter-evidence exists in the processed sources — but an adverse search was run and came back empty:

   - Queries: [the challenging-term queries, verbatim, with dates]
   - Channels: [channels searched]
   - What came back: [N results reviewed; why none qualified as credible counter-evidence]

   "Named, searched, none found" is a legitimate recorded outcome. If you acknowledge this record, synthesis proceeds and the output is stamped: "No credible counter-evidence found after documented search ([N] queries across [channels], [date]) — acknowledged by commissioner."

   Acknowledge, or direct further search?
   ```

   **Present it as the record it is, not as work you just did.** These queries come out of `retrieval-log.json`; they were run when they were run, and the commissioner is being asked to accept a *record*. Attribute it — "the adverse search logged for this phase, run [date]" / "the three adverse searches logged for this phase, run [dates]" — and carry the dates into the turn, not only into the artifact. **Make the number agree with the log.** A single logged query described as "the searches" overstates the record in the flattering direction, and it is the phrasing here that causes it: observed once, where the artifact and the M&L stamp both correctly said one query and only the spoken turn said "searches". Never write it in the first-person present ("I went looking… and came back empty") when what happened is that you read a log. The distinction is the whole point of this exit: recency is what decides whether "none found" still holds, and a commissioner who is not told the search is four weeks old cannot make that call. If the log's searches are old enough that the answer might have changed, say so and offer to re-run before asking for the acknowledgment.

   **Any summary line you put above the itemization must be true of the items below it.** The commissioner is being asked to accept "nothing credible was found," and a summary is what most of them will actually read — so a roll-up that reshapes the results reshapes the decision. Count the dispositions before you characterize them: a result that found *no effect* is not a result that *affirmed* the finding while criticizing something else, and an item already counted under one disposition is not counted again under another. Errors here run one direction — toward making the evidence look stronger than the log says it is — which is exactly the direction this gate exists to resist.

   **Name each bucket by its disposition, never by what its items said.** A disposition group is heterogeneous by construction: "did not qualify as counter-evidence" legitimately holds an article that endorsed the finding, one that took no position, and a study that measured no effect at all. Any verb that fits one of them misdescribes the others — and the verb that gets reached for is invariably the agreeable one, so the group reads as support when part of it is silence and part of it is a null result. "Four did not qualify as counter-evidence" is true by construction and needs no defending. "Four affirmed the benefit" is a fresh content claim about four different things, and it is a claim the log does not make. If an item deserves characterizing, characterize *it*, on its own line.

   **The label may cover the group. The reason may not.** This is the whole distinction, and it is narrow:

   - **A disposition name covers its members legitimately.** "Four did not qualify as a challenger", "Three were off-topic", "Two fell below the credibility floor" — these are the log's own classifications, true by construction, and you do not need to defend them. Give the count with the label.
   - **A reason attached to that label is a per-item claim wearing a group's clothes.** "Three were off-topic — *each about a different subject entirely*" asserts one explanation for three separate items, and it only takes one of them to have been off-topic for a different reason. Same for "four did not qualify — *they restated the same benefit*", and same in the generous direction for "two — *with no position either way*". The group is defined by what its members are **not**; that tells you nothing about why each one is that way, and the why is what a reason claims to know.

   So: label the group, count it, then **give every result its own line and its own reason, lifted from its own triage entry**. Nine results is nine lines. That is not verbosity — the itemization *is* the record, and the roll-up is only an index to it.

   Watch the sub-group especially. "Three were off-topic, two of them from the same trade publication" is the same move one level down, and it is the one that survives the obvious version of this rule.

   **This binds every surface that carries a disposition, not just the turn.** The spoken turn,
   `research/discovery/negative-searches.md`, and any draft prose describing the adverse search all
   carry the same itemization; a surface not named here is still bound — **including a closing recap.** Restating the dispositions
   later in the session is still stating them: a wrap-up turn that says "three were about a different
   subject entirely" has done the forbidden thing at the end, after doing it correctly at the start.
   Observed on a run whose acknowledgment turn, durable record, and draft were all clean. **The pull
   is that a recap feels like a summary and summaries compress** — but the compression is the defect,
   and this is the fourth distinct surface on which this one rule has leaked. If you are restating
   what the search found, restate the labels bare and leave the reasons on their own items, or point
   at the record instead of re-summarizing it. **Naming surfaces one at a
   time is how this rule leaks** — four runs across two scenarios each glossed on whichever surface
   the rule did not happen to mention, and the durable record is the worst place to lose it, because
   every later reader inherits it and the acknowledgment attests to an itemization the file no
   longer holds.

   **A group descriptor that is true of every member, with each member's own reason still present,
   is fine.** The failure is a roll-up that *replaces* the per-item reasons or claims more than the
   log supports — not an accurate sentence sitting above a complete list.

   On acknowledgment: append the record to `research/discovery/negative-searches.md` — phase, date, queries, channels, results reviewed, outcome, acknowledgment, **and the per-item lines exactly as you gave them in the turn** (this list is the whole record, and the itemization is the part of it that carries the finding) (create with a one-line header if absent), then proceed to synthesis and include the stamp in the draft's Methodology & Limitations section.

   e. **Block only when none of the three outcomes is available.** If no credible source disputes the claim (Outcome 1), no adverse search is on record (Outcome 2), **and the claim is not one you can honestly place under Outcome 3**, then synthesis blocks. Work the outcomes in order and reach this step last — it is the failure branch, not the default.

      **Outcome 3 is a real exit and this step must not swallow it.** Observed across three samples of the same scenario: two runs correctly placed a claim under Outcome 3 and drafted, and one blocked instead — because this step, written when the gate had only two exits, says block whenever a source and a search are both missing. Two rules disagreed and the run picked one. If the claim genuinely cannot be refuted through the mapped channels, take Outcome 3, say why and what would have been needed, and proceed. Blocking a claim nothing could ever disconfirm is the ritual this gate is supposed to avoid.

      When you do block:

   ```
   [Say this in substance, not in gate voice — posture rule 7 applies here too. Do not open with "Synthesis blocked" or name the research type as the thing imposing the requirement.]

   Nothing on file pushes back on [the load-bearing claim], and there is no record of anyone having looked.

   Before drafting a claim a reader would act on, one of three things has to be true: someone credible disputes it, a search for opposition came back empty and was recorded, or it is a claim nothing available could refute — and this one is refutable, so the third does not apply. This ensures the research stress-tests its thesis rather than just confirming it.

   Nothing on file disputes it. Two ways forward:
   1. Look for opposition — [negating/challenging terms], in [specific channels: academic databases, industry analysts, competing viewpoints]. If something credible turns up, it goes in the draft as a real qualification. If the search genuinely comes back empty, that empty result is itself the record and I'll write it down.
   2. Tell me this is a claim nothing available could refute, and why — then I'll carry that, name what would have been needed, and draft.
   ```

   **Do not offer to record an empty search from a block turn — there is no search to record yet.** At block time nobody has looked, so "I'll just log that a search came back empty" offers to write a finding about an event that has not happened. Observed on one sample in three: a block that was otherwise correct closed with "if you'd rather I just log that a search was run and came back empty, say so and I'll record it" — turning the valve into precisely the bypass this gate exists to prevent, on the menu, as the cheaper option. **Outcome 2 becomes available only once a search has actually run**; from here it is a destination, never a choice. The two offers above are the only two, and neither of them is "skip it."

   This gate applies to every phase of every research type, not just the final synthesis — it is keyed on the load-bearing claim, and every type has those. The valve (exit d) is not a bypass: it requires an actual adverse search recorded with queries and channels, plus explicit user acknowledgment. "We probably won't find anything" satisfies nothing.

6. **Pre-check 6 — Lopsided coverage advisory.** Read `research/gaps.md` and find the questions relevant to this section. If any question has a lopsided coverage flag (only 1 independent Direct source), display an advisory:

   ```
   Lopsided coverage advisory:

   - Q: [question text] — 1 independent source ([source-note-filename])
   - Q: [question text] — 1 independent source ([source-note-filename])

   These questions are supported by a single independent data point. Findings from these questions will be flagged with "single source suggests" language per guardrail 5. Consider running /know-research:discover to find additional independent sources before synthesis.
   ```

   This is a **warning, not a gate** — synthesis proceeds after displaying the advisory. If no questions have lopsided coverage, skip the advisory silently.

   **It has to reach the user before the draft exists, or it is not the thing it claims to be.**
   The advisory's whole content is an offer: run `/know-research:discover` first, or proceed knowing
   the coverage is thin. Delivered after the draft is written, that offer is gone and what remains
   is a caveat about work already done. **If pre-check 5 pauses for acknowledgment, this advisory
   rides in that same turn** — one pause, both things the user needs in order to choose. If nothing
   else pauses, display it and wait before drafting.

   Observed on two runs of one scenario: the substance arrived in the post-draft turn, correctly
   worded, and the user never got the choice. **This is the same failure the stale-reading stop in
   `research-check-gaps` step 7d was built to prevent** — a decision point that arrives after the
   decision has been made is a caveat wearing a question's clothes.

If any pre-check fails, do not proceed. Tell the user which check failed and what to run. Note: pre-checks 4 and 6 are advisories that do not block synthesis — they display warnings and then allow synthesis to proceed.

## Process

1. **Read `research/research-plan.md`** to understand what this phase/section covers and what questions it needs to answer.
2. **Read `research/reference/writing-standards.md`** for output formatting rules.
3. **Read `research/reference/source-standards.md`** for citation and evidence rules.
4. **Read all relevant files in `research/notes/`** that pertain to this section.
5. **Read `research/cross-reference.md`** for patterns relevant to this section. Include resolved contradiction decisions in the draft — present the resolution with the reasoning, not just the winning side. The reader should see that a disagreement existed and how it was resolved. **Scale the treatment to what turned on it.** A contradiction the user adjudicated gets the resolution and its reasoning in the body. One marked `resolved (auto)` — immaterial, where either side produced the same finding — gets a single parenthetical or a footnote, not a paragraph: the record stays complete without inviting a board reader to weigh a discrepancy that changed nothing. Note any peripheral unresolved contradictions in the draft as open questions that do not affect the section's core findings.

   **Commissioner overrides are disclosed where they land.** A resolution is an override when its recorded `user_resolution` differs from its recorded `suggested_resolution` — check the two fields, not just the `user_override` boolean (the flag corroborates; the field comparison decides; a `confirm: side-A` against a side-B assessment is an override however it was typed). For every override, the draft must say so at the finding site, not just internally: state what the evidence assessment was, then the commissioner's resolution, explicitly labeled — e.g., "Cross-referencing assessed Source B as stronger (disclosed methodology, recency); the commissioner directed resolution toward Source A **[commissioner override]**. Confidence in this finding is reduced accordingly." Never present an overridden resolution as if the evidence produced it, and list every override again in the Methodology & Limitations section.
6. **Read `research/gaps.md`** — if there are unresolved gaps for this phase, note them explicitly in the draft as open questions.
6a. **Read `research/reference/decision-ledger.md`** (if present) — the durable record of recorded dispositions: audit corrections, contradiction resolutions, accepted gaps, commissioner directives. The draft conforms to the latest entry in each subject's supersession chain by default — a prior audit's causal→correlational reframing holds in this draft too, a resolved contradiction stays resolved, an accepted gap is not re-litigated. If this section's evidence genuinely supersedes a ledgered disposition, say so explicitly in the draft and flag it in the turn — the supersession is disclosed and ledgered at audit, never made silently. The audit's B13 enforces this; reading the ledger now is what makes conformance the default instead of an audit catch.
7. **Read `${CLAUDE_PLUGIN_ROOT}/reference/evidence-failure-modes.md`** to understand the evidence degradation patterns to avoid during synthesis.
7a. **If this draft recommends anything, the recommendation carries what would refute it and what it depends on.** Scope: a **recommendation** — a statement that someone should do something. A descriptive phase output has none, and then this step is **n/a and silent**: no empty section, no "not applicable" line, nothing that tells the reader a check ran.

   These two questions are the writing side of the corpus reviewer's **C5 Falsifiability** and **C6 Prerequisite honesty**, and they use C5 and C6's framing on purpose, so the end-of-project review reads what was written here instead of reconstructing it.

   **What would show this wrong.** Name an observation that, if seen, would mean the recommendation should not be followed — and say whether anything planned could produce it. **"Further research may refine this" is not an answer**; it is what fluent writing produces when asked this question, and it is the failure mode to expect. If the project's own plan or a measurement the recommendation itself proposes could surface the refuting observation, name which. **If nothing could, say that** — that is C5's actual fail condition at Tier 2, and stating it plainly here is the honest result rather than the embarrassing one.

   **Some recommendations are genuinely not refutable by anything this project could observe** — "comply with the regulation" is not a falsifiable proposition. Say so once, per recommendation, and move on. A check with no honest exit becomes a ritual people route around; the counter-evidence gate above learned this and this step inherits it.

   **What it depends on.** Walk what the recommendation rests on. If it rests on a decision nobody has made, or a dependency that is unbuilt, uncosted, or unscheduled, **the recommendation says so in the recommendation** — not in a caveats section further down. C6's failure is a prerequisite "presented as actionable", which makes the fix positional as much as factual: a reader who acts on the first sentence has to meet the prerequisite in that sentence. Read `research/reference/decision-ledger.md` and the plan for the record; where the record says a decision is open, the recommendation may not speak as though it is closed.

   **Register — say it as part of the recommendation, never as a labelled compliance section.** "We'd drop this if onboarding time doesn't fall below X in the first quarter, and it assumes the migration budget gets approved" is the shape. Never a `## Falsifiability` heading, never the check's name, never "prerequisite" as a bureaucratic noun. This constraint is stated here rather than left to the register section because a requirement added without one defaults to narrating its own mechanism — recorded in this repo more times than it should have been.

7b. **If this draft states a decision rule, the rule has to be computable from what the evidence
   measures.** Scope: a **decision rule** — a sentence that turns a quantity into an action or a
   verdict. A threshold ("adopt if X exceeds 40%"), a cutoff, a score, a comparison that decides
   something. Descriptive prose stating a figure is not a decision rule. When the draft states none,
   this step is **n/a and silent** — no empty section, no "not applicable" line.

   This is the writing side of the corpus reviewer's **C7 Instrument validity**, and it uses C7's
   framing on purpose so the end-of-project review reads what was written here.

   **Two patterns, and only these two.** C7 checks four and is explicit that it checks *only* named
   patterns; two of its four need an instrument in full view and do not survive the move to a single
   section. Do not extend this list.

   **The rule's quantities must be measured.** Every quantity the rule references traces to a figure
   record whose `measures` field actually covers it. The failure is a rule that thresholds or
   compares something no figure measures: the number is real, and it is not the number the rule
   needs. "Adopt when time-to-value drops below 30 days" cannot be evaluated against a figure that
   measures *the share of teams reporting any reduction* — that figure's `not:` field says the size
   of the reduction is exactly what it does not carry. Say so plainly in the draft, at the rule:
   the rule as written cannot be evaluated from this evidence, and name what would be needed.

   **Two figures whose populations overlap need their relationship stated.** When the draft uses two
   or more figures whose `measures` describe overlapping populations, say how they relate — subset,
   superset, a different slice, or unknown. The failure is two counts side by side implying
   arithmetic nobody established. **"Unknown" is a legitimate answer and silence is not**: a recorded
   unknown survives into the draft, a blank one is lost. Same principle as a figure's `basis`.

   **An unknown relationship constrains every later sentence about those figures; it is not a
   paragraph you discharge once.** Having written "whether the 890 sit inside the 1,240 is not
   established", you may not then call one a "narrower slice of that broader population", say
   "within that broader population", or describe either as a share of the other — in the draft or
   in the spoken turn. Those phrasings assert the containment the disclaimer refused, and a reader
   who meets them first never reaches the retraction. **Check the sentences around the disclaimer,
   and check the turn, before calling this done.** Observed: a run stated the relationship as
   unestablished in one paragraph while an earlier paragraph and the spoken turn had already
   asserted it — written as an obligation to satisfy rather than a constraint to hold.

   **Anything else about the instrument is `needs-domain-expert`, and you do not settle it.** If
   something about how the evidence was produced looks wrong but is not one of the two patterns
   above, say so in the draft, in plain language, and stop there — **"this needs a domain expert's eye
   before the finding is leaned on" is the register**, not the literal token. C7's term
   `needs-domain-expert` is the corpus reviewer's filing vocabulary, and printing it in a draft is
   naming machinery, which the Register rule below forbids; what carries to Tier 2 is the
   *substance* — the concern named precisely, and the fact that this draft did not settle it. **The routing sentence is required, and it names a person.** The draft must contain, in
   substance, "this needs a domain expert's eye before X is leaned on" — an actual hand-off to
   someone qualified. Naming what evidence would resolve it ("an independent comparison group would
   settle this") is good writing and welcome **in addition**, but it is not the routing: it says
   more data would help, not that judgment this analysis cannot supply is required. Observed across
   six runs, four routed and two substituted an adjacent framing — an evidence gap in one, an
   unanswerable-by-any-channel note in the other. Both read to Tier 2 as coverage notes.

   **Route it to a person; do not retire it as unanswerable.** "That question sits
   outside what any of the mapped channels can settle" is a *saturation* statement — it says nobody
   can know, it belongs to a different check, and it quietly converts an open question into an
   accepted limitation. This exit says the opposite: the question **is** answerable, by someone with
   expertise this analysis does not have, and you are handing it to them. Name that. A concern filed
   as a coverage dead end reaches Tier 2 looking like a sampling caveat, and C7 never learns it was
   routed at all. Say
   which of the two patterns it is not, so the reviewer can see the routing was deliberate rather
   than an oversight. This is C7's own term
   and C7's own instruction, and it is the reason this check is safe to run with less context than
   C7 has. A Tier-1 check that starts settling methodology is the failure this scoping exists to
   prevent.

   **Register — say it as part of the finding, never as a labelled compliance section.** "We can't
   actually test that 30-day threshold with what we have; the survey only asked whether time-to-value
   fell, not by how much" is the shape. Never a `## Instrument validity` heading, never the check's
   name, never "decision rule" as a bureaucratic noun.

8. **Write a draft section** to `research/drafts/<part-number>-<section-slug>.md`.

   **Before writing, check if the target file already exists at that path.** If it does, a prior draft is already in flight — do not silently overwrite it. Present the user with three named options: **(a) overwrite** — the existing draft is replaced entirely; note that any matching audit report in `research/audits/` for the old draft becomes stale and should be deleted or renamed by the user before the new draft is audited; **(b) suffix** — write the new draft to `research/drafts/<part-number>-<section-slug>-v2.md` instead and leave the original in place; **(c) cancel** — stop the synthesis entirely; do not write anything. Wait for the user to pick one. Do not proceed on an ambiguous response — re-ask. Only after the user chooses, write the draft with these requirements:

   - Lead with findings, support with evidence
   - Every finding answers "so what does this mean?"
   - **Where a number, range, date or qualifier moves from a note into the draft, it moves whole.**
     Check endpoints against the note before writing, not after. **Errors here run one direction —
     toward making the evidence look stronger than the note says it is** — and that direction is the
     reason to check rather than trust your recall of it. Three observed instances all compressed
     toward the favourable end (a 6–10 week range written as "6 to 9"; 22–38 months written as "low
     to high 20s"; "before decommissioning the incumbent" written as "before cutover"), and in one
     the correct range appeared correctly one paragraph below the wrong one — the right figure was
     in hand while the wrong one was being written. Recall is the failure, so re-read the note.
   - Apply the project's finding tags to key conclusions. Tag set fallback chain: **(1)** read `CLAUDE.md` and use the Finding Tags section; **(2)** if missing, fall back to the type template at `${CLAUDE_PLUGIN_ROOT}/reference/templates/types/{research-type}.md`; **(3)** if neither source has a tag set, do not invent tags — render findings without tags and add an explicit note in the draft's opening metadata: "Finding tags unavailable for this project — CLAUDE.md and type template both missing the Finding Tags section. Tagging skipped." Do not block synthesis on missing tags.
   - Cite sources inline using `[Source: <note-filename>]`
   - Use prose paragraphs, not bullet lists (except for data tables and key findings)
   - Present contradictions when sources disagree
   - No orphan claims — if it can't be cited, label it (below) or cut it
   - **Label every load-bearing "so what" with where it comes from.** A finding states what the
     evidence says; a "so what" states what it means, and the two have different warrants. Three
     labels, and they are fixed — the corpus reviewer uses these exact words, so a different
     wording here makes its check unrunnable against your output:
     - **evidence-supported implication** — a reader can follow the cited notes to this
       conclusion without supplying anything themselves.
     - **analyst inference** — reasoning past what any source states. This is legitimate and is
       often the most valuable thing in the report. It simply may not present as established.
     - **commissioner priority** — it follows from a stated preference, constraint or directive
       rather than from the evidence. Cite the directive.

     **Load-bearing** means a reader acting on this report would act on this statement. Not every
     sentence: a label on everything stops carrying signal. But the test cuts the other way too —
     if a sentence reads like a recommendation and carries no label, that is the sentence most in
     need of one, and the audit treats its absence as a finding rather than a formatting nit.

     **The label goes in the sentence**, not in a block at the end: "…which points to a Q3
     cutover *(analyst inference)*." The reader who most needs to know a conclusion is a judgment
     call is the one reading it and deciding whether to act on it, and a provenance section near
     the end is read by someone who has already decided.

     **Say the provenance in the turn as well.** The same rule as posture rule 8 and for the same
     reason: the draft is audited and the turn is not, and the turn is what gets repeated. You do
     not have to speak the label as a label — "that last part is my read, not something the
     sources say" carries it in plain words. What is not allowed is describing an inference to
     the commissioner in the grammar of an established finding.
   - **End every draft with a `## Methodology & Limitations` section.** This section is part of the deliverable, not backstage — it is what keeps the output honest to a reader who wasn't in the engagement. It contains:
     1. **Sampling disclosure:** "Sources were gathered by purposive sampling through mapped discovery channels, not exhaustive literature coverage. Where this report notes that evidence was not found, that means 'not found via the mapped channels,' not 'does not exist.'" (Adapt the wording to the project; keep the substance.)
     2. **Single-source findings:** list each finding resting on one independent source (or "none").
     3. **Commissioner overrides:** each `user_override=true` resolution, labeled, with the evidence assessment it overrode (or "none").
     4. **Counter-evidence status** (every type — see pre-check 5): per load-bearing claim, one of the credible challenger(s) cited, the adverse-search stamp, or the not-disconfirmable statement with what would have been needed. A load-bearing claim with no disposition here is the gate not having run.
     5. **Waivers:** left as a placeholder line — `/know-research:audit-claims` inserts any commissioner waivers verbatim at audit time.
8a. **Log assumptions to `research/assumptions.md`.** While writing the draft, identify any judgment or finding that meets these criteria:
    - Based on a single source (already flagged with "single source suggests" per guardrail 5)
    - Inferred from indirect evidence rather than directly stated
    - Extrapolated beyond what the source data strictly supports
    - Based on sources that exceed the staleness threshold

    For each assumption identified, append an entry to `research/assumptions.md` (create the file if it does not exist). Entry format:

    ```markdown
    ### [Short assumption description]
    - **Status:** Open
    - **Phase:** [phase number and name]
    - **Section:** [draft section name]
    - **Basis:** [What evidence exists and why it is thin — e.g., "single source (vendor whitepaper)", "inferred from adjacent market data", "based on 2021 data exceeding 2-year threshold"]
    - **What would validate:** [What kind of evidence would confirm this]
    - **What would challenge:** [What kind of evidence would overturn this]
    - **Added:** [date]
    ```

    **The entry's own text carries its referent, exactly as the draft's does.** An assumption
    description is a claim, and W1's fidelity rule binds it: a figure means what its note's
    `measures` field says it means, and the note's `not` field names the misreading to avoid.
    Observed under W4's own verification: a run wrote the assumption "Onboarding automation reduces
    time-to-value by 60–70%" from a note recording that **60–70% of teams reported a reduction, with
    the study not measuring its size** — a share of a population restated as a magnitude, which is
    the iteration-39 drift arriving in a third file.

    This is the **ninth** instance of the pattern this repo has recorded repeatedly: a rule stated
    for one surface does not bind the next one. W1 bound the draft; v1.12.1 bound the spoken turn;
    `assumptions.md` was neither, and it is now the most durable of the three — W4 makes closeout
    read it, so a drifted assumption is surfaced to the commissioner at the moment they decide
    whether to ship. **Write the assumption in the referent its note supports, and if the entry
    names a figure, carry the `measures` wording with it.**

    **`Status` carries the outcome, and it has four values — not two.** The criterion above was
    always written down and, until v1.14.x, nothing ever recorded that it had been *tested*. An
    assumption could sit `Open` from the phase that logged it through to the final deliverable, with
    its falsification criterion on file, noticed at every phase start, and never once run. That is a
    state with no route out, which is the same defect W2 closed for accepted gaps.

    - **`Open`** — logged, not yet tested. Still the default, and now meaningfully different from
      the three below rather than being the only value.
    - **`Tested — held`** — the challenge criterion was run and the assumption survived. **Name what
      was run**, in the entry. "Tested" with nothing behind it is the same empty claim as an
      adverse-search stamp with no search record.
    - **`Tested — broke`** — the assumption failed. This is the valuable one and it does not stop
      here: it must propagate to anything resting on it, which is a **`correction` entry in
      `research/reference/decision-ledger.md`** citing this assumption, exactly as an audit
      correction does. An assumption that broke silently is worse than one never tested, because the
      record now says someone checked.
    - **`Untestable via mapped channels`** — the criterion cannot be run with what discovery mapped.
      Record **what would have been needed**. This is an honest result, not a failure, and it is the
      same exit pre-check 5's outcome (c) gives a claim — for the same reason: a disposition with no
      honest option stops being used honestly.

    Whichever step tests a criterion writes the outcome. Do not leave a tested assumption reading
    `Open` because the testing happened somewhere other than where it was logged.

    The file header (create only if file does not exist):
    ```markdown
    # Research Assumptions Record

    Judgments synthesized from weak, thin, or indirect evidence. Revisit when new phases add evidence.

    **Statuses:** Open (still assumed) | Validated (later evidence confirmed) | Challenged (later evidence contradicts)

    ---
    ```

    When adding new assumptions, also scan existing assumptions in the file. If new evidence from current synthesis validates or challenges a prior assumption, update its status from Open to Validated or Challenged and add a note with the evidence that changed it.

9. **Run the research-integrity agent** on the draft. Pass the filepath. If the agent finds issues, fix them in the draft before proceeding. Do not move to audit with known integrity issues — fix them now while the source context is fresh.

   **Verify the agent returned a real result.** A real result is either (a) an explicit "no integrity issues found" confirmation for the filepath you passed, or (b) a list of issues with specific file locations (line numbers, claim text, or section names). An empty response, a tool-error return, or a generic acknowledgment with no issue list does NOT count as "integrity checked" — if that happens, do not report the draft as integrity-checked, surface the agent failure to the user, and either re-invoke the agent or fall back to a manual re-read of the draft against the source notes. Do not proceed to Step 10 (STATE.md update) until a real integrity result is recorded.
10. **Update `research/STATE.md`** — note the draft was written, integrity-checked, and is pending audit. **Check the `Synthesize` box in `Current Phase Cycle` and move `Cycle step` on to `Verify (5 of 5)` in the same edit — the box and the pointer are one write, never two.** Checking `Synthesize` while `Cycle step` still reads `Synthesize (4 of 5)` leaves the file saying the step is both finished and current, and a session resuming on it cannot tell which. Set `Next Action` to `/know-research:audit-claims <draft path>`. The rule the whole cycle block obeys: every step before the active one is checked, and the active step is not. These STATE writes are silent (posture rule 7).

## Guardrails

1. Write only from source notes in `research/notes/`. If a fact is not in a source note, it does not go in the draft.
2. Preserve every qualifier from the source. "Primarily in enterprise deployments" does not become "broadly adopted."
3. When sources disagree, present the disagreement. Do not smooth contradictions into a consensus that does not exist.
4. Preserve the full range from source notes. If the source says "$2M–$8M," the draft says "$2M–$8M," not "$4M–$8M" or "approximately $5M."
4a. **Use every figure for what its note says it measures.** Where a note carries a figure record, its `measures` field is the figure's meaning, and **neither the draft nor the turn may quietly widen it** — the rule binds both surfaces in full, and the turn is the one nothing audits afterwards. Carrying the digits across correctly is not the same as carrying the claim across correctly: a note's "60–70% of teams reported a reduction" is a share of a population, and writing "a 60–70% reduction" turns it into the size of an effect — a different and much stronger claim, built from a number that matches perfectly. Nothing that compares numbers will catch this, because nothing about the number changed. Where the record carries a `not` field, it names the misreading in advance; if your sentence is the one it names, rewrite the sentence. On a note with no figure record, work from its verbatim wording and preserve what the number is *of*, not just its digits.

   **State this in the turn as carefully as in the draft.** A run that writes "60–70% of teams reported a reduction" into the draft and then tells the commissioner "teams are seeing a 60–70% reduction" has published the correct claim and *communicated* the stronger one — and the spoken version is the one that gets remembered and repeated. Posture rule 8 governs this on every turn of every skill; it is restated here because this is the skill that first puts a figure into words.
4b. **A figure may not be spoken about a wider population than its note's `carries-to` records.** `measures` (4a) governs *what the number is of*; `carries-to` governs *who it is about*, and they fail separately. A figure measured on 212 self-selected respondents and written about "the mid-market" has kept its meaning perfectly and changed its population — a different claim, from an unchanged number, which nothing that compares digits will catch.

   Where the source itself generalises, `carries-to` records the wider population **and that the source made that leap**; the draft may follow it and should say whose leap it is. Where `carries-to` is the sample, the draft stays there. **`basis: unknown` is carried, not dropped** — a figure whose methodology nobody disclosed is usable and ordinary, and saying so at the claim site is the difference between using it and laundering it.

   **This binds the turn as well as the draft**, for the reason 4a gives: the spoken version is the one that gets remembered, and it is the one nothing audits afterwards. v1.12.1 exists because a run wrote a figure correctly and then described it to the commissioner in the stronger form; shipping this for the draft alone would rebuild that defect one field over.

5. Flag any finding supported by only one source with "single source suggests" language. Do not present single-source findings as established facts.
6. Run the research-integrity agent before declaring the draft ready for audit. Do not skip this step.
7. Never synthesize past an unresolved core contradiction. If cross-reference.md shows unresolved contradictions on questions this section addresses, the pre-check should have caught it. If you reach synthesis and notice a contradiction that was not in cross-reference.md, stop and flag it — do not smooth it into consensus.
8. When a source exceeds the staleness threshold, include its findings in the draft but add an explicit age caveat noting the data year. Do not silently present stale data as current.
9. Every "single source suggests" finding in the draft must have a corresponding entry in `research/assumptions.md`. If you wrote "single source suggests" but did not log the assumption, go back and add it.
10. Do not bypass the counter-evidence gate by re-tagging a supporting source as CHALLENGED. The gate requires genuinely opposing evidence from a credible source, not relabeled confirmatory evidence. The documented-adverse-search exit is equally protected: it requires a real search record (queries, channels, dates) and explicit user acknowledgment — do not fabricate or embellish a search record to unlock synthesis.
11. **Real people are protected by default.** For research types that observe or profile real individuals (Person Research, Customer Safari), the draft anonymizes everyone other than the commissioned research subject unless a source note records explicit permission: no usernames, handles, or real names of community members or third parties; attribute quotes as "a community member on [platform]" or equivalent. Real specificity, not real identity — keep the exact words, the platform, and the context; drop the identity. The fail direction is always over-anonymization. (Notes may hold identifying source links for traceability; the *deliverable* does not expose them.)

## Common Failure Modes

| Failure Mode | Prevention |
|---|---|
| Synthesizing from memory instead of source notes | For every claim in the draft, find the corresponding source note and verify the value. If you wrote the source notes earlier in the session, re-read them anyway — memory drifts. |
| Dropping qualifiers during compression | Compare the draft's language against each cited source note. If a qualifier was present in the note, it must be present in the draft or the simplification must be noted explicitly. |
| Smoothing contradictions into false consensus | When two sources disagree, present both positions with citations. "Source A reports X; Source B reports Y" is correct. "Evidence suggests approximately Z" (splitting the difference) is fabrication. |
| Range narrowing — presenting the favorable end of a range | Every range in the draft must match the source note's range exactly. Check endpoints. If the source says "5–25%" and the draft says "15–25%," the lower bound was dropped. |
| False precision — converting ranges to point estimates | "The market is $4.7B" when the source says "$3–6B" is false precision. Preserve the range. |
| Synthesizing past unresolved contradictions — smoothing disagreements into false consensus | Check cross-reference.md Contradictions section before writing. If any core contradiction is unresolved, stop. Do not proceed by picking the "more likely" side — the user must explicitly decide. |
| Treating stale sources as equally current — using old data without age caveat | Check each source's data year against the type's staleness threshold. If stale, include the finding but add an age caveat: "Based on [YYYY] data..." so the reader knows the evidence may not reflect current conditions. |
| Silent assumptions — presenting thin-evidence judgments as established findings without logging them | Before finalizing the draft, re-read it and check every finding: is it supported by 2+ independent credible sources with direct evidence? If not, it is an assumption and must be logged to `research/assumptions.md`. |
| Counter-evidence theater — processing a weak source just to satisfy the gate | The counter-evidence gate requires a credible source (not blog/opinion tier) with a genuine CHALLENGED or CONTRADICTED finding. Processing a low-quality source and tagging it as challenging does not satisfy the gate — the source must genuinely present opposing evidence. When opposition genuinely does not exist, the honest path is the documented-adverse-search exit (pre-check 5d), not a manufactured challenger. |
| Manufacturing a challenger because the gate has no other visible exit | The gate has two exits: a credible challenging source, or a documented adverse search acknowledged by the user. If genuine search finds nothing, use the valve — record the negative search, get the acknowledgment, stamp the output. Never relabel a supporting source or process a straw-man source to escape the block. |
| Presenting an overridden resolution as evidence-driven | Check every carried-forward resolution for `user_override=true`. If present, the finding site must show the evidence assessment AND the labeled commissioner override, and the override must appear in Methodology & Limitations. The internal cross-reference record is not the disclosure. |
| Skipping the Methodology & Limitations section, or writing it as boilerplate | Every draft ends with the section, populated for THIS draft: real single-source findings listed, real overrides labeled, the actual counter-evidence status. A generic paragraph pasted across drafts defeats its purpose — the audit checks the content, not the heading. |
| Synthesizing lopsided questions with confident language | Check gaps.md for lopsided flags on this section's questions. If a question has only 1 independent source, use "single source suggests" language — not "evidence shows" or "research confirms." |

## Output

**Register (read `${CLAUDE_PLUGIN_ROOT}/reference/posture-register.md` — it governs this
turn).** The findings are the product; the pipeline is not. Present what the draft
establishes — the key findings, in the analyst's own words, at the confidence the
evidence earns — and what needs the user's attention (open assumptions logged, lopsided
sections, the counter-evidence status). Say nothing about the machinery: not the file
path written, not that the integrity check ran, not which steps executed — a reader
should learn what the research found, not what the process did. (The draft's location
and the audit gate are already carried by the transition prompt below.)

Then render the transition prompt (format defined in `${CLAUDE_PLUGIN_ROOT}/reference/prompt-templates-runtime.md`):

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:audit-claims research/drafts/<filename>` — Fact-check the draft against source notes before it moves to `outputs/`.

**What to expect:** Audit-claims traces every factual claim to its source note, checks for range narrowing and qualifier stripping, and either promotes the draft to `outputs/` or lists specific issues to fix. This is a hard gate — nothing reaches `outputs/` without passing.

───────────────────────────────────────────────────────────

The "Also available" section is omitted here because audit-claims is the only legitimate next step after a draft is written — summarize-section → audit-claims is a required pipeline, not a choice.
