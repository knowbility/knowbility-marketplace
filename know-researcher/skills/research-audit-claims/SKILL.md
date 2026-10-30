---
name: research-audit-claims
description: This skill should be used when the user asks to audit, fact-check, or verify the claims in a research draft before it ships, or to promote a draft to outputs (e.g. "audit this draft", "fact-check phase 2", "can this go to outputs"). Walks every claim against its cited source notes and, if it passes, logs the gate row and promotes the draft from research/drafts/ to research/outputs/.
argument-hint: "[filepath]"
---

# /know-research:audit-claims

Audit a research draft for unsupported claims. If the audit passes, promote the draft from `research/drafts/` to `research/outputs/`. If it fails, the draft stays in `drafts/` until issues are fixed and the audit is re-run.

**What this audit is for:** `outputs/` is the trusted tier — what reaches it is what the commissioner will act on. The audit's outcome is decision-readiness: every claim in a promoted output is one the commissioner can stand behind, traced to its evidence, at the confidence the evidence earns. Accuracy of representation is the bar; the audit never grades whether the research's conclusions are *right*, only whether they are honestly evidenced.

**Severity, defined once:** **High** — the finding, uncorrected, could mislead a decision: an unsupported or misrepresented claim, a wrong or drifted figure, a hidden override or identity exposure, a missing required component, a false statement about the draft's own contents, an unwaived standard violation. **Moderate** — the claim's substance is supportable but its precision or context degraded: a narrowed range, a dropped qualifier, a cross-document inconsistency. **Low** — the record is imperfect but the reader is not misled: a missing attribution for a supportable claim, stale-but-flagged data. Classes without a listed severity take the severity this definition assigns to their effect; borderline cases take the higher severity.

## Input
The user will provide a filepath to audit (should be a file in `research/drafts/`).

## Process

1. **Read the file to audit.**
2. **Read `research/reference/source-standards.md`** for evidence rules.
3. **Read `research/reference/writing-standards.md`** for precision preservation and synthesis rules.
4. **Read `${CLAUDE_PLUGIN_ROOT}/reference/evidence-failure-modes.md`** for the catalog of evidence degradation patterns. Check for each pattern type during the audit.
4a. **Read the project's commissioned evidence standard.** Read `research/reference/evidence-standard.md` (written by `/know-research:init`). If it does not exist (project predates the convention), fall back to the "Audience & Evidence Standard" section of the project's `CLAUDE.md`. If neither exists, note in the audit report: "No audience evidence standard on file — standard gate inactive for this project" and skip the standard checks below. The standard's Enforceable Rules are part of this audit's pass/fail criteria — see "Audience-standard violations" under Pass/Fail Criteria.
4b. **Read the waivers already standing against this draft.** Read the existing audit report at `research/audits/<basename>-audit.md` (if one exists from a prior audit) and the draft's Methodology & Limitations section. Collect every waiver recorded for this draft — each names a claim and carries the commissioner's rationale verbatim. A finding covered by a standing waiver is still found and still reported (it appears in the findings table, marked `waived`), but it does not fail the draft. A waiver covers the claim it names, and every open finding on that claim (see "Scope it" under Waiver Arriving Between Audits — the commissioner names the claim; you never subdivide it). It does not carry to a *different* claim. If a waived claim has changed materially since the waiver was granted — the figure moved, the sourcing changed — the waiver has lapsed: report the violation as open and say why.
5. **Run the check battery — every item, every pass.** This is the audit's core. The Pass/Fail Criteria below are exact; the battery makes the *procedure* exact to match. Run every item on every audit pass — including re-audits — and report each in the audit report's `## Checks run this pass` section as `run — clean` or `run — N findings`. The point is not that these checks are novel; it is that they are **the same every pass**, so a defect class first surfaced on the third pass was simply one nobody had run yet. Do not improvise which classes to run, and never skip an item because a prior pass ran it — a fix can introduce a fresh instance of any class.

   **B1 — Claim tracing & representation.** Every factual claim traces to a file in `research/notes/` or a previous phase output. The claim matches its source: same numbers, same ranges (not narrowed or midpointed), same qualifiers (not dropped in compression), same denominators. A number carried from a previous phase matches the original exactly. Confidence language matches the number of supporting sources. Contradicting sources are acknowledged. Information older than 2 years is flagged.

   **B2 — Quotation integrity.** Every quoted span in the draft appears verbatim in a source note, a phase output, or the research plan. Normalize smart quotes and emphasis markers before comparing. **Flag any quoted span that traces to the research's OWN prose** — a note's analysis, a prior draft — rather than to source text. Quoting the research's own synthesis back as if it were a citation is a finding (**Self-sourced quote**), not a citation.

   **B3 — Canonical-figure match, including units.** For every number in the draft that exists in `canonical-figures.json`, verify **value AND unit AND qualifier** (the registry read and drift detection are step 6a; this item adds the unit/qualifier match to the value match). A figure registered as `median 3 turns/user/mo` cited as `3 messages/month` is a finding even when the two are definitionally equal.

   **B4 — Derived-figure labelling.** Any figure computed from other inputs but not stated in any source must be labelled *derived* at every use, never presented as a sourced value (**Derived figure unlabelled**).

   **B5 — Section cross-reference resolution.** Every internal reference — `§N`, "see Section X", "Table Y" — resolves to a heading or table that actually exists in the draft (**Broken cross-reference**).

   **B6 — Plan-requirement conformance.** Read this phase's section of `research/research-plan.md`, enumerate the deliverable components it requires, and confirm each is present in the draft. **This is the only check that finds *absent* content** — a required component that was never written is invisible to claim-tracing because there is no claim to trace. A missing required component is **Missing required component** (high-severity).

   **B7 — Constructed-bracket check.** A claim whose components each trace to a source but whose *combining frame* is the research's own synthesis must be labelled as construction, not presented as a single sourced finding (**Constructed bracket unflagged**).

   **B8 — Internal-table consistency.** Every assertion the draft makes about its own tables ("every line that passes Test 1 fails Test 4") must be recomputed against the table it summarizes. This defect cites no source, contains no figure, and breaks no quotation, so every other battery item misses it — it is only findable by re-deriving the summary from the table (**Internal table inconsistency**). Any draft carrying a scoring or comparison table needs this item.

   **B9 — Standing-provision conformance.** Every claim complies with the project's commissioned evidence standard (step 4a) — a breach is an **Audience-standard violation** — AND with any standing project rules in the project's `CLAUDE.md` (per-section objective-divergence statements, de-identification by function, and the like). Example: if the standard says "single-source financial claims are unacceptable," a financial figure traced to one source note fails here, accurately cited or not.

   **Enumerate every claim the standard governs; do not stop at the first one that complies.**
   Report the count you checked ("4 claims against the audience standard; 1 single-sourced, flagged")
   so a pass says how much was examined. Observed once: a draft carried two single-sourced claims,
   one flagged and one not; the audit named the compliant one, wrote `B9 — run — clean`, and
   promoted the draft. A check that verifies the instance it happened to look at, rather than the
   set the rule covers, produces a clean report over a live breach — and this is the item where
   that costs a promotion.

   **B10 — Override disclosure & identity.** For every contradiction resolution in `research/cross-reference.md` a claim rests on, compare the recorded `user_resolution` against `suggested_resolution`. If they differ — regardless of the `user_override` flag (the flag corroborates; the field comparison decides) — the draft must label the override at the finding site AND in Methodology & Limitations; an overridden resolution presented as if the evidence produced it is **Override undisclosed**.

   **The claim-site disclosure carries its content; it may not be a pointer.** "A commissioner override of the evidence assessment (see Methodology & Limitations)" is not disclosure — it is a footnote marker, and the reader who most needs the fact is the one reading the claim, who now has to go somewhere else to learn what was overridden. The site must name the value the evidence favored and say the recorded decision went the other way, in the sentence itself. A cross-reference to M&L may follow that; it may not replace it. Both surfaces carry the fact in full, which is the same rule B13's supersession route obeys and for the same reason. A resolution record missing either field is itself a finding. For Person Research and Customer Safari, every real person other than the commissioned research subject is anonymized unless a source note records explicit permission; an identifiable non-subject individual is **Identity exposure** (the fail direction is over-anonymization). **The same pass checks pronouns, because they are a sourced attribute and not a stylistic choice.** For every real individual the draft refers to — subject included — a gendered pronoun requires a source recording that person's own usage: a self-description, a byline or profile they control, an outlet quoting them. A name is not a source, and neither is a photograph, a voice, or a job title. A gendered pronoun with no such record is **Identity assertion** (moderate; high if the individual is named), and the mechanical fix is they/them. Measured on a real capture: a draft carried eighteen gendered pronouns over a corpus containing zero — an unsourced claim about a named person, repeated on every line, that reads to the commissioner as something the research established.

   **B11 — Structure & consistency (mechanics elaborated below, run and reported as battery items).** The Methodology & Limitations structural check (step 5b), the cross-document consistency check (step 6), and the canonical-figures/drift pass (step 6a) are part of the battery, not separate from it. Run all three every pass and list them alongside the rest in `Checks run this pass`.

   **B18 — Recommendation serviceability.** Only when the draft makes a **recommendation** — a statement that someone should do something. Otherwise report `B18 — n/a (no recommendation)` and move on; a battery item that fires on every descriptive phase output is noise, and noise is what gets an item skipped.

   Two things must be present at the recommendation, and this checks **presence and non-vacuity, never quality** — whether the recommendation is *right* is C5 and C6's job at Tier 2, and B18's job is making sure there is something there for them to read:

   - **A refutation.** Something named that, if observed, would mean not to follow the recommendation. **A vacuous refutation fails the same as a missing one**, and it is the likelier of the two: "further research may refine this", "this may change as the market evolves", "we will continue to monitor" — each is a sentence that survives any observation, which is exactly what a refutation must not do. The test: *could a reader tell, from this sentence, what would have to happen for the recommendation to be wrong?* If not, it is **Refutation vacuous** (moderate).
   - **Its prerequisites, at the claim site.** A recommendation resting on an unmade decision or an unbuilt, uncosted, or unscheduled dependency must say so where the recommendation is made. Buried in a limitations section is the failure C6 names — "presented as actionable" — because the reader who acts is the reader who read the first sentence. **Check the decision ledger**: where it records a decision as open and the recommendation speaks as though it is closed, that is **Prerequisite undisclosed** (high — it is the one that gets acted on).

   A recommendation stated as genuinely not refutable by anything the project could observe **passes**, provided it says so. That is the honest exit, and an audit that punished it would teach the next run to write a vacuous refutation instead of an honest one.

   **B19 — Decision-rule computability.** Only when the draft states a **decision rule** — a
   sentence turning a quantity into an action or a verdict (a threshold, a cutoff, a score, a
   comparison that decides something). Otherwise report `B19 — n/a (no decision rule)` and move on.

   Like B18, this checks **presence and non-vacuity, never quality**. Whether the instrument is any
   good is C7's call at Tier 2 with the whole corpus in view; B19's job is making sure there is
   something there for C7 to read.

   Two questions, and only these two — C7 is explicit that it checks only named patterns, and this
   is the Tier-1 subset that survives seeing one section:

   - **Does every quantity the rule references trace to a figure whose `measures` covers it?** A
     rule that thresholds something no figure measures cannot be evaluated. If the draft has already
     said so at the rule, that is a pass — the disclosure is the deliverable, not a clean result.
   - **Where two figures' populations overlap, does the draft say how they relate?** Subset,
     superset, different slice, or unknown. **"Unknown" passes; silence does not.**

   **Anything else about the instrument is filed as `needs-domain-expert` and is not settled here** —
   C7's own term, carried verbatim. **The literal token belongs in the audit report and nowhere the
   commissioner reads**: the report is a durable internal artifact where filing vocabulary is
   correct and greppable, while the draft says the same thing in plain language because naming the
   check in prose is what the Register rule forbids. If the draft routed a concern to a domain
   expert without the token, that is the draft behaving correctly — record it here with the token
   so Tier 2 can find it.
   An audit that starts adjudicating methodology with one section in view is the failure C7's
   scoping already proved out.

   **B12 — Regression sweep (re-audits only).** On any pass after the first, for **every defect class fixed in a prior pass on this artifact**, re-scan the *whole document*, not the location that was fixed — a fix applied to one instance while an identical construction survives elsewhere is exactly what this catches. On a first audit, report `B12 — n/a (first pass)`.

   **B13 — Disposition conformance.** Read `research/reference/decision-ledger.md`; if the file is absent, nothing is ledgered — report `B13 — n/a (no ledger)` and move on, never treat absence as an error. For every claim in the draft whose subject matter a ledger entry covers, the claim must conform to the **latest entry in that subject's supersession chain**, or carry an explicit supersession: a new ledger entry citing the superseded `D-<n>` plus disclosure at the claim site and in Methodology & Limitations (the B10 pattern). A claim asserting a pre-correction frame, re-adopting the losing side of a resolved contradiction, claiming coverage a ledgered acceptance concedes is missing, or contradicting a recorded directive — without the supersession record — is **Disposition reversal undisclosed** (high-severity). B13's job is not to freeze dispositions; new evidence can supersede any of them. Its job is to make *silent* reversal impossible: the record moves forward by appending, and the reader is always told.

   **B16 — Provenance conformance.** For every load-bearing "so what" in the draft — anything a reader acting on this report would act on — check its label against what stands behind it. The three labels are fixed and shared with the corpus reviewer's C14; a draft using different words for the same distinction is itself the finding, because it makes C14 unrunnable against this output.

   - **evidence-supported implication** — walk the cited notes. If reaching the conclusion needs a step no source supplies, the label is wrong: **Implication unsupported** (high). This is the check that catches an option "ruled out" on the *absence* of evidence for it — absence is not affirmative evidence against, and a conclusion that treats it as such has invented a step.
   - **analyst inference** — no evidence chain is required and none is asked for. What is checked is the grammar around it: an inference presented with established-fact wording ("the data shows", "this establishes", "the research confirms") is **Inference dressed as evidence** (high). The label and the sentence must agree.
   - **commissioner priority** — must cite a real directive: a `directive` entry in `research/reference/decision-ledger.md`, or a recorded resolution. A priority attributed to the commissioner they never stated is **Priority unattributed** (high), and it is the worst of the three: it launders an analyst's choice through the commissioner's authority, where nobody downstream will question it.

   **A load-bearing "so what" with no label at all is a finding** — *Provenance unlabelled*, **moderate**. Moderate rather than high on purpose: on a project predating this convention the writer has simply not met it yet, and a check that fires high on every older draft is one people learn to skip. It still fails the draft and still gets fixed. A *wrong* label is high, because a wrong label misrepresents where a claim came from, which is the thing this check exists to prevent.

   **Report the census, not only the individual findings.** State how many load-bearing statements the draft carries and how many of them are labelled — "three load-bearing statements, none labelled" is a different message from three separate findings that happen to share a cause, and the reader who gets only the findings can reasonably conclude the other statements had labels that were merely wrong. One line, before the findings.

   Judge the **set**, not only the labels present. A sentence that reads like a recommendation and carries no label is exactly the sentence most in need of one — "load-bearing" is the writer's judgment, and this is where a shrunken definition shows up. Report `B16 — n/a (pre-convention draft)` only when the draft carries no labelled statements *and* no recommendation-shaped ones; never let a missing label read as conformance.

   **B17 — Conclusion vs. brief.** Read the commissioned question — `research/research-plan.md` § The Core Question, with the `Research Subject` line above it — and every `directive` entry in `research/reference/decision-ledger.md`. **Precedence: the plan is the original commission; a directive supersedes it for whatever it touches.** Then two questions:

   1. **Does the conclusion answer the question that was actually asked?** Not a neighbouring question the evidence happened to answer more cleanly. Drift is not a defect in itself — evidence sometimes lands somewhere better than the brief anticipated — but *undisclosed* drift is: **Brief drift undisclosed** (high). Name both, the commissioned question and the question actually answered, and let the commissioner decide which they wanted.
   2. **Is it stated at the strength the evidence licenses?** A range stays a range unless a recorded decision rule converts it — a rule on disk, not a rule in the sentence. "Ruled out" requires affirmative evidence, not the absence of evidence for. A constraint asserted as immovable must cite what establishes that it cannot move. Each is **Unlicensed strengthening** (high).

   **The immovable-constraint case belongs to B17, not B16, and it is high.** It will look like a B16 problem, because such a sentence is usually also unlabelled — and an unlabelled statement is a moderate B16 finding. Route it here anyway: the defect is not that the provenance is unstated, it is that the draft asserts something the evidence does not establish, and filing it as a missing label understates it by a whole severity band. The test: if adding the right label would leave the sentence still wrong, it is a B17 finding. "The $20 floor cannot move *(commissioner priority)*" is still wrong — the commissioner set a preference, not a law of nature.

   Run B17 at **every phase close, not only the final one.** Drift accumulates: each phase can be individually defensible while the arc walks away from what was commissioned, and by the final close unpicking it means rewriting several phases. Mid-project the comparison is to that phase's question plus the arc so far.

   **B14 — Referent conformance.** For every figure in the draft that traces to a note's figure record: the draft must use it for what the record's `measures` field says it measures. Compare the *referent*, not the digits — the digits matching is the precondition for this check, not evidence of anything. A draft that renders a note's "60–70% of teams report a reduction" as "a 60–70% reduction" has changed a share-of-population into a magnitude-of-effect while every numeric check passes, and that is **Referent drift** (high severity). Report both readings, always: what the note supports and what the draft asserted. "The figure is used incorrectly" tells the writer nothing — the two readings side by side tell them exactly what to change, and which of the two the evidence actually bought.

   **When the note's record carries a `not` field and the draft matched it, say so and quote it.** That field was written at capture, by someone reading the source, naming in advance the misreading the draft then made. Reporting the finding without it leaves a defensible-looking disagreement between two readings; reporting it with the quote makes the finding documented rather than argued, and it is the single most persuasive sentence available. It also tells the reader the note did its job, which matters when the next question is how far to trust the rest of the corpus.

   A note with no figure record for a cited number is **not** a B14 finding — B15 owns that. Report `B14 — n/a (no figure records in the cited notes)` when a draft's sources all predate the schema, and never let a missing record read as conformance.

   **B15 — Source-anchor presence.** For every figure record in the notes this draft cites: does it carry a `locator`, and does that locator point somewhere specific? A record whose locator is missing, empty, or vague to the point of being unusable ("throughout", "in the report") is **Unanchored figure** (moderate severity). A locator that honestly says "not locatable in the extracted content" is **not** a finding — that is the note doing its job, and the fact belongs in Methodology & Limitations rather than in a defect list.

   **What B15 does not do, stated plainly so nobody reads more into a green result:** it does not open the source and check the locator is right. Nothing in this plugin re-reads originals. B15 asserts that a verifiable anchor *exists*, not that the note is faithful to the source it names. A clean B15 means the corpus is checkable, not that it has been checked.

   Notes predating the figure-record schema have no locators to check. Report `B15 — n/a (pre-schema notes)` and move on; a check that fires on every note written before it existed is noise, and noise is what gets a battery item skipped.

   **Reporting a reversal — a content contract binding two surfaces equally.** A reversal the user hears about as "this claim isn't supported" has been reported as the wrong kind of problem: the severity comes from a recorded decision being undone, and that is the fact they need. **The audit report and the turn each carry the full contract — neither substitutes for the other.** The report is the durable record a later reader works from; the turn is what the commissioner acts on now. Satisfying one and shortchanging the other is the predictable failure here, so check both before you finish.

   For **each** reversal, in your own words, both surfaces convey:
   - **That a recorded disposition was reversed** — which one, what it said, when it was recorded. Every reversal gets this, not just the most striking one; a draft reversing two dispositions while one is framed as a reversal and the other as a dropped qualifier has reported one problem, not two.
   - **The sanctioned route to reverse it, stated affirmatively** — all four elements, every time: (1) new evidence that postdates or outweighs the recorded basis; (2) a new ledger entry that **points back at the entry it replaces** (the ledger is append-only — superseding is an addition that cites, never an edit); (3) disclosure at the claim site; (4) disclosure in Methodology & Limitations. "No superseding entry exists" states an absence; "the way back is new evidence plus a new entry pointing at the 2026-07-15 correction it replaces, disclosed at the claim and in Methodology" states the route. Only the second tells the user what to do.

   Say all four in plain language. Ledger IDs spoken aloud read as machinery (posture rule 7), and "put it on record" swings past the mechanic that makes supersession legitimate — the middle path names the act and the target without the filing reference: "a new entry pointing back at the phase-1 correction it replaces."
5b. **Methodology & Limitations structural check.** The draft must end with a `## Methodology & Limitations` section, and the section must be real — populated for THIS draft, not boilerplate. Verify each element:
   - **Sampling disclosure present**, with properly scoped absence language: "not found via the mapped channels," never "does not exist."
   - **Single-source findings list** consistent with what this audit itself found — a finding the audit traced to one independent source must appear here (or the draft must gain it as a mechanical fix).
   - **Commissioner overrides listed**, matching the field comparison in step 5 — every resolution whose `user_resolution` differs from its `suggested_resolution` appears.
   - **Counter-evidence status** (PRD Validation and Exploratory Thesis only): either the credible challenger(s) cited, or the documented-adverse-search stamp. **When the stamp is present, verify the record behind it:** `research/discovery/negative-searches.md` must contain a matching entry for this phase (queries, channels, acknowledgment). A stamp with no matching record is an unsupported claim about the research process itself — high severity; the stamp comes out or the valve is run properly.
   - **Waiver lines** for every waiver standing against this draft (step 4b) — granted during an audit or recorded between audits. A waiver on record whose rationale is not in the M&L verbatim is a recording failure, not a mechanical fix to paper over: write the line, and say you did.

   A missing section, a missing sampling disclosure, or a stamp without its record fails the draft (classification: **Methodology omission**). A missing-but-derivable element (the sampling disclosure, a single-source list the audit just computed) is a mechanical fix — apply it per the FAIL sequence. A missing negative-search record is never mechanical: the audit cannot invent the search.
6. **Cross-document consistency check:** If other files already exist in `research/outputs/` or `research/drafts/`, check whether this draft and those documents cite the same numbers for the same claims. Flag any inconsistencies.
6a. **Canonical figures check:** Read `research/reference/canonical-figures.json`. If the file does not exist, note "No canonical figures registry yet — first phase of this research project or registry not yet populated. Skipping this check; it will activate once figures are registered." and continue to step 7. If the file exists but fails to parse as JSON, stop the audit and tell the user: "`research/reference/canonical-figures.json` exists but cannot be parsed as JSON. This is a registry corruption — restore from git or fix the file manually before re-running the audit. Do not promote the draft." Do not proceed until the file is valid. If the file exists and parses correctly, for every number in the draft that exists in the canonical registry, verify it matches exactly. Flag any discrepancy as high-severity.

   **Drift detection (claim graph):** If `research/reference/claim-graph.json` exists and parses correctly, walk every claim node whose `figure_ids` array is non-empty. For each figure ID listed, look up the current value in the canonical-figures.json registry (already read above). If the registry value differs from the value stored when the claim was written (detectable when the claim text contains a specific figure that no longer matches the canonical value), annotate the claim node with a `drift_warning` object:
   ```json
   {
     "figure_id": "<id from figure_ids>",
     "expected_value": "<value stored in claim at last audit>",
     "canonical_value": "<current registry value>"
   }
   ```
   Write the annotated claim-graph.json back to disk. Do not alter the claim's `confidence_tier`. Collect all drift warnings for reporting in the findings table (step 7) and scorecard (step 8). If claim-graph.json does not exist or fails to parse, skip drift detection without comment — the graph is supplementary infrastructure; its absence does not block the audit.

   **Transitive detection:** Drift is resolved in the same read pass — a figure ID may appear in multiple claim nodes. Flag all nodes referencing a revised figure; no separate traversal step is needed because `figure_ids` is a flat array on each node.

   **Error handling:** If claim-graph.json exists but fails to parse as JSON, log a warning and skip drift detection — do not fail the audit. After writing drift_warning annotations back to disk, re-read the file and confirm it parses as valid JSON. If the write verification fails, log: "WARNING: claim-graph.json drift annotation write failed" and continue the audit.

7. **Classify each issue found:**
   - **Unsupported claim** — No source note backs this up
   - **Misrepresented** — Source says something different than what's claimed
   - **Missing attribution** — Claim is supportable but citation is missing
   - **Stale data** — Information may be outdated
   - **Contradiction ignored** — Sources disagree but only one side is presented
   - **Range narrowed** — Source range was compressed or midpointed
   - **Qualifier dropped** — Source qualification was lost in compression
   - **Number drift** — Figure doesn't match the cited source
   - **Cross-document inconsistency** — Same claim, different figures across documents
   - **Drift detected** — A canonical figure this claim references has changed since the claim was written; `drift_warning` field has been set on the claim node in claim-graph.json
   - **Audience-standard violation** — The claim breaches an Enforceable Rule in the project's commissioned evidence standard (high-severity; promotable only under a named waiver — see Pass/Fail Criteria)
   - **Override undisclosed** — A `user_override=true` contradiction resolution reaches the draft without a visible commissioner-override label (high-severity)
   - **Identity exposure** — A real person other than the research subject is identifiable in the draft with no recorded permission (Person Research / Customer Safari; high-severity)
   - **Methodology omission** — The Methodology & Limitations section is missing, lacks the sampling disclosure, or carries an adverse-search stamp with no matching negative-search record (high-severity; see step 5b for which fixes are mechanical)
   - **Identity assertion** — A gendered pronoun, or any other personal attribute, applied to a real individual with no source recording it (B10; moderate, high when the individual is named). Mechanical fix: they/them, or drop the attribute
   - **Self-sourced quote** — A quoted span traces to the research's own prose (a note's analysis, a prior draft), not to source text (B2)
   - **Derived figure unlabelled** — A figure computed from inputs is presented as a sourced value rather than labelled derived (B4)
   - **Broken cross-reference** — An internal `§`/section/table reference resolves to nothing in the draft (B5)
   - **Missing required component** — A deliverable component the phase's research plan requires is absent from the draft (B6; high-severity — the only defect class that finds absent content, since there is no claim to trace)
   - **Constructed bracket unflagged** — Each component traces, but the frame combining them is the research's own synthesis, presented as one sourced finding (B7)
   - **Refutation vacuous** — A recommendation's stated refutation would survive any observation ("further research may refine this"), so nothing could show it wrong (B18; moderate)
   - **Prerequisite undisclosed** — A recommendation rests on an unmade decision or an unbuilt/uncosted dependency and does not say so at the claim site (B18; high — this is the one that gets acted on)
   - **Status contradiction** — Two documents the project stands behind disagree about what is blocked, done, or depended on (closeout status check; reported as the pair, never resolved by the agent)
   - **Internal table inconsistency** — A claim the draft makes about its own table is false by that table (B8; high-severity — it is a factual misstatement)
8. **Generate audit scorecard:**
   - Total specific claims checked: N
   - Claims traced to source: N (X%)
   - Claims matching source value and context: N (X%)
   - Claims with appropriate qualifiers: N (X%)
   - Issues found: N mismatches, N unsourced, N drift, N range narrowed
   - Severity distribution: N high, N moderate, N low

   - Drift warnings: N claims referencing figures that have changed since last audit
     (claim IDs: [id1, id2, ...] — review canonical-figures.json for current values)

   Section confidence tiers (weakest-link per section from claim graph):
   - [Section name]: [minimum tier among claims in this section] — weakest claim: [claim id], [rationale]
   - [Section name]: [minimum tier] — weakest claim: [claim id], [rationale]

   Tier ordering: Insufficient (0) < Low (1) < Moderate (2) < High (3). For each section, group claim nodes by `section` field from claim-graph.json, take the minimum `confidence_tier` value. The node with the lowest score is the weakest link for that section.

   Overall confidence: [minimum tier across all sections] (weakest-link determines overall)

8a. **Compute per-section confidence tier:**

   For each section of the draft, assess four inputs and produce a named tier (High / Moderate / Low / Insufficient):

   **Four inputs:**
   1. **Source count** — How many independent sources back this section's claims? Map to pattern-recognition-guide levels: Claim (1 source), Emerging (2–3 sources), Pattern (4+ sources). Echo-level sources (dependent sources sharing a common origin as identified during cross-reference) count as one, not multiple.
   2. **Credibility tiers** — What is the highest credibility tier among the section's sources (from source-assessment-guide.md)? A mix of credibility tiers is stronger than uniform low-tier coverage.
   3. **Evidence directness** — Are sources directly addressing the claim, or are they adjacent/inferred? Direct = source explicitly states the finding. Indirect = finding is inferred from related data, extrapolated, or adjacent to the claim.
   4. **Staleness** — What proportion of the section's sources exceed the research type's staleness threshold (defined in the type template from process-source)? Majority stale = downgrade.

   **Confidence tier definitions:**
   - **High**: 4+ independent sources from credible tiers (official docs, analyst reports, peer-reviewed), majority direct evidence, no stale sources dominating
   - **Moderate**: 2–3 independent sources with at least one credible-tier source, mostly direct evidence, stale sources are minority
   - **Low**: 1–2 sources, or sources are primarily low-credibility (vendor marketing, blog posts), or evidence is mostly indirect, or stale sources dominate
   - **Insufficient**: 0–1 sources for a section's claims, or all sources are the same low credibility tier with no triangulation

   **Tier computation approach:**
   - Start at the source-count level: Claim → Low, Emerging → Moderate, Pattern → High
   - Upgrade if credibility is strong (all high-tier sources) or evidence is entirely direct
   - Downgrade if credibility is weak (no high-tier sources), evidence is mostly indirect, or stale sources dominate
   - Cap at Insufficient if fewer than 2 sources with no high-credibility source

   Record the tier and a one-sentence rationale for each section. Add to the scorecard output (step 8) after severity distribution.

   **What a tier does not say.** A confidence tier rates how well the sources support the claim as
   written. It is not a statement about the state of anything in the world, and it must not be
   phrased as one. This matters most where the research subject is a standard or a requirement:
   a High-confidence finding about **what an accessibility criterion requires** is a well-sourced
   reading of that criterion, not a determination that any product, document, or interface meets
   it. Those are different claims resting on different evidence — the second one needs a person
   exercising the thing with assistive technology, which no source note contains and no tier can
   supply.

   So when a section's claims concern accessibility requirements, conformance criteria, or what a
   standard obliges, write the tier against the sourcing as normal, and keep the claim language on
   the standard rather than on a product. A sentence that slides from "WCAG 2.2 requires X" to
   "the product therefore satisfies X" is an unsupported claim under step 5 regardless of how
   strong the sourcing for the first half is, and it is flagged as one. If the draft needs to say
   something about a specific artifact's conformance, the source for that is an evaluation
   somebody performed, cited like any other source — not an inference from the standard's text.

8b. **Write claim graph nodes to `research/reference/claim-graph.json`.**

   For every factual claim traced in step 5, construct a claim node using the data already in context:
   - `id` — sequential prefix (c001, c002, ...) + slug from first 4-5 words of claim text (lowercase, hyphenated, non-alphanumeric stripped). Example: `"c001-market-size-exceeds-four"`. Sequential prefix guarantees uniqueness; slug makes IDs human-scannable.
   - `text` — the claim **as it stands in the draft at the moment you write this node**, not as traced in step 5. Where this pass applied a fix, the fixed wording is what goes in. The graph is the durable record the next audit compares against, so a node holding pre-fix text points the next B12 regression sweep at a sentence the draft no longer contains — it will either report a defect that was already corrected, or fail to recognise the corrected claim as the same claim. Measured on a real capture: three nodes, none of their text present in the draft the same run had just fixed.
   - `phase` — current phase number (read from `research/STATE.md` `Active phase` field)
   - `section` — section name from the audit pass
   - `confidence_tier` — tier computed in step 8a for this claim's section (High / Moderate / Low / Insufficient)
   - `source_files` — array of note filenames traced in step 5
   - `figure_ids` — array of figure IDs from canonical-figures.json that appear in this claim (empty array `[]` if none)
   - `evidence_directness` — Direct / Indirect classification from step 8a
   - `source_count` — integer count of independent sources from step 8a

   Read `research/reference/claim-graph.json`. If the file does not exist, create it with `{"claims": []}`. If it exists but fails to parse as JSON, log a warning in the audit report and skip the graph write — do not fail the audit.

   For claims already present in the graph (matched by `phase` + `section` + `text` equality), overwrite the existing node with the new data. For new claims, append to the `claims` array.

   **A claim whose text this pass changed is still the same claim — update its node, never append a second one.** Text equality is the match key and a fix is exactly what breaks it, so the naive read appends a duplicate and leaves the pre-fix node behind as an orphan. You know which claims you fixed and what they said before: match the *old* text to find the node, then rewrite it in place with the new text and a regenerated `id`. Two nodes for one claim is worse than a stale one — the next pass sees a contradiction in its own record and has no way to tell which half is current.

   **Drift warning lifecycle:** On re-audit, the drift detection pass in step 6a evaluates all figure_ids against the current canonical registry before step 8b runs. If a previously drifted figure now matches (drift resolved), the node written here will have no `drift_warning` field. If drift persists, the `drift_warning` set by step 6a will be included in the overwritten node. Step 8b does not independently manage drift_warning — it inherits whatever state step 6a established for each node.

   Write the updated JSON back to `research/reference/claim-graph.json`.

   **After writing, verify the write succeeded.** Re-read the file and confirm it parses as valid JSON with a `claims` array. If the read fails or the array is missing, log: "WARNING: claim-graph.json write failed — graph incomplete for this phase. Re-run `/know-research:audit-claims` to retry graph write without re-running the full audit." Do not fail the audit or block promotion.

9. **Write audit report to `research/audits/<basename>-audit.md`**, where `<basename>` is the draft's filename with its `.md` extension stripped — `research/drafts/04-test-section.md` audits to `research/audits/04-test-section-audit.md`, not `04-test-section.md-audit.md`. Include: scorecard, pass/fail determination, findings table, list of claims that need correction, the confidence tier table (section name, tier, rationale) from step 8a, and a **`## Checks run this pass`** section listing **every battery item this skill defines** with its result (`run — clean` or `run — N findings`; `n/a (first pass)` for B12 on a first audit, `n/a (no ledger)` for B13, `n/a (no figure records in the cited notes)` for B14, `n/a (pre-schema notes)` for B15, `n/a (pre-convention draft)` for B16, `n/a (no recommendation)` for B18 and `n/a (no decision rule)` for B19, where they apply). **Take the list from the battery above, not from a number range quoted here** — a hardcoded range silently omits every item added after it was written, which is exactly how B18 went unlisted from v1.16.0 until it was noticed. This section is what makes a skipped check visible at the time rather than three passes later, and lets a reader see that this pass ran the same battery as the last.


## Pass/Fail Criteria

A draft passes when:
- Zero high-severity issues (unsupported claims, misrepresented data, number drift, undisclosed overrides, identity exposure, methodology omissions)
- The Methodology & Limitations section exists and passes the step 5b structural check
- Zero unwaived audience-standard violations (see below)
- Zero moderate-severity issues left unresolved (range narrowed, qualifier dropped, cross-document inconsistency)
- 100% of specific numerical claims trace to a source note or phase output with a matching value
- Low-severity issues (missing attribution, stale data) are acceptable if documented in the audit report

There is no percentage threshold. Every specific claim must check out. The scorecard is for visibility into the draft's quality, not for setting a "good enough" bar.

**Audience-standard violations fail by default — a named waiver is the only other exit.** The evidence standard captured at init is a contract the user commissioned; enforcing it is user sovereignty, not agent paternalism. When a violation is found, present it and the two options: fix the claim (add sources, cut it, or requalify it), or grant a waiver. A waiver requires the user's own words in the format `waive: <claim or finding> — <rationale>` — do not draft the rationale for them, and do not accept "just waive it" without one. Waivers are per-claim, never blanket. A draft with an unwaived standard violation does not promote.

A waiver is recorded the moment it is granted, in all three loci — audit report, gate-log Detail, and the draft's Methodology & Limitations verbatim (`Waiver (commissioner): "<rationale>" — applies to: <claim>`). Most waivers arrive as a bare message after a failed audit, with no audit running; record them then, on that turn. See "Waiver Arriving Between Audits" below.

Only audience-standard violations are waivable. The standard gate has a waiver exit because the user commissioned the standard and can amend their own contract. Evidence accuracy has no such exit — an unsupported claim, a misrepresented source, a number that doesn't match its note, an undisclosed override, or an identity exposure cannot be waived by anyone. If the user tries, say which of the two kinds of finding they are looking at and why this one has no waiver door.

**Confidence tiers are advisory — they indicate evidence strength, not audit compliance.** A section can be High confidence and fail (misrepresented claim) or Low confidence and pass (single source but accurately cited). A Low-confidence section that passes the audit is promoted with its tier visible in the audit report. Do not use confidence tier as a reason to fail or hold a draft — with one exception: a rule the project's own evidence standard declares (step 4a) is enforced at this gate. That is not tier-based grading; it is the standard the user themselves set at init, applied where it was always meant to apply.

## After Audit

- **If PASS:**
  1. **Promote the draft.** This is a two-step operation: append a gate-log row first, then move the file.

     But first, understand what a passing audit does and does not do: it promotes ONE file. It does not by itself end the phase — that requires the full deliverable manifest (step 2).

     1a. **Append a row to `research/audits/gate-log.md`.** The hook gate on `research/outputs/` reads this log to authorize the move (Claude Code only; the hook is inert in Cowork). Use the Edit tool to append a single row to the gate-log table. Row format (no leading spaces, single-line):

         ```
         | <ISO-8601 UTC timestamp> | promote | pass | research/outputs/<filename> | from research/drafts/<filename> |
         ```

         The timestamp must be current and in UTC with a trailing `Z` (format `YYYY-MM-DDTHH:MM:SSZ`). The `File` column path is project-relative (no `${CLAUDE_PROJECT_DIR}` prefix). The filename in both columns is the draft's basename — promotion preserves the filename across the move.

         The gate hook authorizes a write to `research/outputs/<filename>` only when the most recent gate-log row's timestamp is within 120 seconds, the result column is `pass`, and the file column matches the write target. Append the row immediately before the move — any delay risks the 120s window expiring.

     1b. **Move the file from `research/drafts/<filename>` to `research/outputs/<filename>`.** Prefer Bash `mv` (single operation, atomic on the same filesystem) over a Read+Write+delete sequence. The hook gates Write/Edit/MultiEdit, not Bash, so `mv` proceeds without consulting the gate-log — the row written in 1a is the durable audit record of the authorization decision regardless.
  2. **Deliverable manifest check — close against the whole contract.** Read `research/research-plan.md` and list every output the current phase promises: the phase's `**Output:**` line, or the full `**Outputs:**` list for a synthesis phase (e.g., executive summary + final report + recommendations). For each promised deliverable, check two things: the file exists in `research/outputs/`, and a passing audit report for it exists in `research/audits/`. Present the manifest as a short table: deliverable | in outputs/ | audited. **This table goes to
     the user, every time — it is the contract, not the pipeline.** The Register rule below silences
     the machinery that produced a result; the manifest *is* the result: what the phase promised
     against what exists. A phase closed without showing it asks the commissioner to take the
     closure on trust. Observed: a run closed Phase 1 correctly on substance and never showed the
     contract it closed against.

     - **All promised deliverables exist and are audited:** the phase's contract is met — proceed to step 3 (phase closeout).
     - **Any promised deliverable is missing or unaudited:** do NOT close the phase. Leave the phase active in STATE.md: uncheck `Synthesize` and `Verify` (the cycle is not done until the whole inventory is), **and move `Cycle step` back to `Synthesize (4 of 5)` in the same edit** — the box and the pointer are one write, and leaving the pointer at `Verify (5 of 5)` above an unchecked `Synthesize` says the phase is both past that step and not done with it. Then rewrite `Next Action` to the next concrete step, e.g.: `Run /know-research:summarize-section <next-deliverable> for Phase N — 2 of 3 promised deliverables remain: <list>.` Tell the user exactly which deliverables remain and confirm the one just promoted. Do not present the phase debrief — the debrief marks phase completion, and the phase is not complete. Stop here.

     One audited executive summary does not close a synthesis phase that promised a report and recommendations. The final-phase branch in step 3 is subject to the same rule — and further: on a protocol-adopted project, "all phases complete" is never declared by this skill at all. The validated corpus-review closeout (final phase branch, stages 1–3) is the only path, and its STATE write belongs to the validator.

  3. **Close out the phase in `research/STATE.md`.** A passing audit that completes the phase's deliverable manifest (step 2) is the end of the current phase's cycle. STATE.md must be advanced *before* the debrief so that any subsequent `/clear` leaves the project in a correct state — the user may jump straight to `/know-research:discover` on resume without running `/know-research:start-phase`, and `discover`'s pre-check depends on "Active phase" already pointing at Phase N+1.

     **Branch before any write.** Read `research/research-plan.md` first and determine
     whether Phase N is the plan's final phase. If it is, perform **none** of the manual
     STATE writes below — go directly to the **Final phase branch** (the corpus-review
     closeout): on a protocol-adopted project the validator performs every completion
     write, Verify check-off included; on a legacy project the branch's exit-10 path
     performs the coherent pre-protocol transition (Verify check-off, phase completion,
     the legacy completion fields) as one write, with the visible no-credibility-gate
     notice. Only for a **non-final** phase, perform all of the following writes in a
     single STATE.md update:
     - **Check off Verify.** In `Current Phase Cycle → Phase N`, change `- [ ] **Verify** …` to `- [x] **Verify** …`. Confirm all five steps (Collect, Connect, Assess, Synthesize, Verify) are now checked. If any earlier step is still unchecked, **verify artifacts before prompting the user.** For each unchecked step, check whether the expected artifact exists and is current:
       - **Collect:** Phase N source notes exist in `research/notes/` (grep for `phase: N` or check filenames) AND corresponding entries exist in `research/sources/registry.md`.
       - **Connect:** `research/cross-reference.md` contains Phase N cross-reference data (check for Phase N heading or entries citing Phase N sources).
       - **Assess:** `research/gaps.md` contains a coverage assessment for Phase N.
       - **Synthesize:** A draft for Phase N exists in `research/drafts/`.

       If the artifacts confirm the step was completed (the expected files exist with Phase N content), this is a checkbox-only discrepancy caused by a context clear — silently mark the step checked and continue the closeout. Log one line per reconciled step: "Reconciled [Step]: artifacts confirm completion (e.g., 10 Phase N notes in registry, cross-reference.md updated YYYY-MM-DD)."

       Only prompt the user when **artifacts are missing or ambiguous** — e.g., no Phase N notes exist, cross-reference.md has no Phase N data, or gaps.md doesn't cover Phase N. In that case, present three named options: **(a) cancel the closeout and re-run the missing cycle step** (the user goes back to run the relevant skill for whichever step lacks artifacts, then re-invokes audit-claims); **(b) authorize marking the step checked anyway** (the user confirms the step was completed through means not reflected in the standard artifacts); **(c) abort the audit promotion entirely and leave the draft in drafts/** (the audit report is still written, but the draft is not promoted and STATE.md is not advanced). Wait for the user to pick one. Do not proceed until they do, and do not leave STATE.md half-updated.

       **Option (b) does not exist for the final phase.** When Phase N is the final phase, a conversational confirmation cannot authorize anything the cold corpus reviewer will never see: the authorization must be a written commissioner directive in `research/notes-to-self.md` (their words, dated). Offer (a), (c), and "(b-final) record a commissioner directive in notes-to-self.md, then re-invoke" — and note that the directive changes the corpus, so the final review runs (or re-runs) after it. When a directive is recorded, also append a `directive` entry to `research/reference/decision-ledger.md` (create from `${CLAUDE_PLUGIN_ROOT}/reference/templates/decision-ledger.md` if absent) — next `D-<n>`, class `directive`, date, phase, the directive's subject, its effect in one line, evidence: `research/notes-to-self.md` — so the disposition is durable and enforceable, not just filed.
     - **Mark the phase complete in Completed Phases.** Change `- [ ] Phase N: [Name]` to `- [x] Phase N: [Name] — COMPLETE [YYYY-MM-DD]`.
     - **Read `research/research-plan.md`** to determine Phase N+1's name. If Phase N was the final phase in the plan, skip to the "final phase" branch below.
     - **Advance `Active phase`** in `Current Position` from `N — [Phase N Name]` to `N+1 — [Phase N+1 Name]`.
     - **Reset `Cycle step`** to `Collect (1 of 5)`.
     - **Reset `Blocking on`** to `Nothing — ready to start.` (unless a real blocker carried over, in which case preserve it and note the phase transition).
     - **Replace the Current Phase Cycle block** with a fresh Phase N+1 cycle checklist, all five steps unchecked, using the same format as the Phase 1 template in `/know-research:init`:

       ```markdown
       ### Phase N+1: [Name]
       - [ ] **Collect** — Sources gathered for this phase's questions (start with /know-research:discover)
       - [ ] **Connect** — `/know-research:cross-ref` run, cross-reference.md current
       - [ ] **Assess** — `/know-research:check-gaps` run, coverage confirmed for this phase
       - [ ] **Synthesize** — `/know-research:summarize-section` run, draft in `drafts/`, integrity checked
       - [ ] **Verify** — `/know-research:audit-claims` passed, output promoted to `outputs/`
       ```

       The completed Phase N checklist is NOT preserved in `Current Phase Cycle` — its record lives in `Completed Phases`. `Current Phase Cycle` always reflects exactly one active phase.
     - **Reset `Sources Processed` counters for the new phase:**
       - `Sources for current phase: 0`
       - Leave `Total count`, `Sources since last cross-reference`, `Last cross-reference`, and `Last gap check` as-is — those are project-wide or will be reset by their respective skills.
     - **Update `Next Action`** to a specific executable command for Phase N+1. Prefer:

       ```
       Run /know-research:start-phase to brief Phase N+1, or /know-research:discover to jump straight to source collection. No sources collected yet for Phase N+1.
       ```

       `Next Action` must be a concrete command the user can execute after a fresh session load, not a phase-level description.

     **Final phase branch — the corpus-review closeout.** If Phase N was the final phase
     in the research plan, the project's completion is **not yours to declare**. Do not
     check off the final phase in Completed Phases, do not set any completion sentinel,
     do not touch Active phase or Next Action by hand. The final phase's Verify box and
     the whole-project completion belong to the validated closeout below — three strict
     stages, each terminal for the invocation when it fails.

     **Closeout-only invocations (no corpus mutation).** When audit-claims is invoked on
     a final phase whose deliverable manifest is *already complete* — every promised
     final-phase output already in `research/outputs/` with a passing audit on file, and
     no pending draft was given to audit — this is a closeout resumption (the normal
     state after "run `/know-research:review-corpus final`, then re-invoke"). **Skip the
     audit entirely: no battery, no audit-report write, no claim-graph write, no draft
     edits — zero writes to any in-scope file** — because any write changes the corpus
     hash and orphans the review receipts the gate is about to consume. Run only the
     three closeout stages below. (This is also why the exit-12 remedy works: the review
     runs against the finished corpus, and the closeout re-entry touches nothing.)

     First, locate the validator: the installed copy at
     `research/bin/validate-corpus-review.py`, or — only if none is installed — the
     plugin copy at `${CLAUDE_PLUGIN_ROOT}/reference/validate-corpus-review.py` (used
     solely to *classify* the project below; an un-adopted project never hard-gates).

     **Closeout stage 1 — read-only preflight, terminal for this invocation.** The
     deliverable manifest (step 2) and the cycle-artifact reconciliation are *checks
     only* here. Any discrepancy — a missing deliverable, an unaudited output, an
     unchecked earlier cycle step whose artifacts don't confirm completion — ends the
     turn with the named remedy.

     Stage 1 also runs the **criteria preflight**: read
     `research/reference/completion-criteria.md` (on a legacy-prose project, the plan's
     Success Criteria section) and self-assess every criterion with a pointer to its
     evidence — an output, an audit, a ledger entry. Three dispositions: **met**
     (evidence named), **unmet**, or **accepted-unmet** (a commissioner acceptance or
     directive is on record — their words, dated, in `research/notes-to-self.md` or the
     decision ledger; never the agent's inference). Any plain **unmet** ends the turn
     exactly like a missing deliverable, naming the criterion and what meeting it would
     take — before a reviewer run is ever suggested: a review is expensive and its
     receipt freezes to the corpus hash, so spending it on a self-detectably unmet
     criterion wastes the run.

     **Stage 1 also asks whether the project's own documents agree about what is blocked.** Collect every blocker, dependency, and status claim across `research/outputs/`, `research/STATE.md`, and the decision ledger. **Promoted material only** — a draft in flight is allowed to disagree with the record, that is what drafting is; the contradiction matters once both statements are things the project stands behind.

     **A contradiction is the finding, and it is reported as the pair.** This output says the vendor integration is blocked on a signed contract; that one says it shipped in phase 3. Name both **by filename, with a line number where the file has one** — `research/outputs/03-vendor-landscape.md:88`, not "the vendor write-up" or "Phase 1's output". Descriptive naming reads fine in a two-output project and goes blurry in a large corpus, and **C4 requires `file:line` at Tier 2**: a contradiction reported descriptively has to be re-located by hand before the reviewer can act on it, which is work this stage already did. Same for the criteria preflight above — dispose of a criterion by its **SC-id**, not by paraphrasing what it said. **Do not resolve it** — a status claim is only wrong relative to another status claim, and the plugin has no way to know which document is current. Guessing writes a fact nobody recorded.

     **A stop, not a block** — the same shape as the stale-reading decision and the standing-assumption question above, which is now this skill's one way of handing a decision back. Say which claims disagree, say the project cannot close on a contradictory status picture without someone saying which holds, and ask. The commissioner answers and closeout proceeds.

     **This belongs at closeout and nowhere earlier.** Status claims accumulate: a contradiction between phase 2 and phase 5 does not exist until phase 5 does, and running this at every phase would report the same not-yet-contradiction repeatedly until it became invisible.

     This is the Tier-1 half of the corpus reviewer's **C4 Status coherence**, and uses its framing so the reviewer reads this record rather than rebuilding it.

     **Stage 1 also asks the standing-assumption question.** Read `research/assumptions.md`
     (absent file → nothing to ask; never treat absence as an error). **Does any load-bearing
     conclusion in the promoted outputs rest on an assumption whose `Status` is still `Open`?**
     If so, name them: the assumption, the conclusion resting on it, and how many phases it has
     been open.

     **This is a stop, not a block — the same shape as the gap check's stale-reading decision, and
     for the same reason.** Shipping on an untested assumption is a legitimate call that researchers
     make knowingly and constantly; what is not legitimate is shipping on one silently. So this does
     not end the turn the way a plain unmet criterion does. Present the list, say plainly that the
     project can close on them, and ask. The commissioner says the word and closeout proceeds.

     Two constraints carried over from that decision, because the same failure modes apply:

     - **Do not predict what testing the assumption would have found.** "Probably wouldn't change the
       conclusion" answers the exact question an `Open` status says nobody answered, and it makes the
       disclosure hollow. Recommend on cost and context — the deadline is real, the conclusion holds
       on its other support — never on a forecast of the untested result.
     - **`Untestable via mapped channels` is not `Open`.** An assumption whose criterion genuinely
       could not be run has been dispositioned honestly and does not belong in this list; putting it
       there turns the honest exit into a penalty and teaches the next run to write `Open` instead.

     This is the Tier-1 half of the corpus reviewer's **C5 Falsifiability**, which asks the same
     question once at the end. Use C5's framing rather than a parallel one, so the reviewer reads
     this record instead of reconstructing it.

     **`met` requires a thing you can point at.** A criterion is met when you can name
     the artifact that satisfies it — this output, that audit, this ledger entry. It is
     **not** met by the absence of a violation. Criteria are routinely written as
     conditionals ("any single-figure cost carries a recorded decision rule," "every
     contested claim is dispositioned"), and a conditional over an empty set is
     vacuously true as logic while telling you nothing about whether the work was done.
     When a criterion names a record the project is supposed to hold and that record
     does not exist in the corpus, the disposition is **unmet** — the commissioner asked
     for the record, not for the absence of the thing that would have required it. When
     you find yourself reasoning "there was never a case that would have triggered
     this, so it's satisfied," that is this rule firing: stop, and mark it unmet.

     **Report the receipts, not just the verdicts — this binds the turn.** For each
     criterion the turn names the artifact the disposition rests on, not a description of
     it: "the platform comparison in `01-platform-landscape.md`, audited clean" rather
     than "is sourced and audited." An unmet-by-absence disposition carries the same
     burden in reverse — **say where you looked**: the decision ledger, notes-to-self, and
     the promoted outputs, named. "Nothing on record" is the single claim in the turn most
     likely to be wrong and least checkable by the reader; the commissioner's next
     question is "did you check the ledger?", and a preflight that cannot answer it is
     asking them to take an unmet criterion on trust. Naming the criteria positionally
     ("the third one") reads better than reciting IDs and is fine — the artifact is what
     must be named, not the SC number.

     The self-assessment is a preflight, not a rival verdict — **write nothing into the
     corpus during it**, and note that this write-free rule is what the stop protects: a
     criterion cleared here falls through to stage 2, where the legacy branch performs
     real completion writes. A wrongly-passed preflight does not produce a visible
     error; it produces an orderly-looking close. The cold reviewer's C1 remains the
     authority on criteria dispositions at the gate. **There is no conversational authorization at final
     closeout:** the (b) "authorize anyway" option does not exist on this branch.
     Authorizing a missing cycle artifact requires a written commissioner directive in
     `research/notes-to-self.md` (their words, dated); once written, the corpus has
     changed — so the preflight reruns on a later invocation and any existing final
     review is stale by construction. Nothing conversation-only can affect what a cold
     reviewer sees.

     **Closeout stage 2 — the validator's verdict.** Run the validator's `--self-test`
     (it must end green — a damaged validator blocks), then
     `python3 <validator> gate --json --root .`. Route on the exit code, reporting the
     validator's own named reason — never a bare "blocked":
     - **valid (0):** proceed to stage 3.
     - **no-marker (10):** this project predates review protocol v1. Take the legacy
       path: perform the pre-protocol completion writes (set `Active phase: — all
       phases complete`, `Cycle step: — all cycles complete`, replace the cycle block
       with `*(No active phase — all phases complete.)*`, point Next Action at
       `/know-research:progress`) and say, visibly, in the completion report: "This project
       has no credibility gate — it was initialized before review protocol v1. Its
       completion is unvalidated. To adopt the gate, re-run `/know-research:init` and ask
       for the review-protocol upgrade." Never write the validated completion sentinel
       on a legacy project.
     - **no-review (12):** the final corpus review has not run (or produced no valid
       receipt). End the turn: "Run `/know-research:review-corpus final` — the completion
       gate needs a final review set." Failed attempts on record mean the reviewers are
       unavailable; the terminal option for an unreviewable project is the
       administrative archive (`transition --apply --closed-unreviewed --reason "…"`),
       which is never described as decision-ready.
     - **open-material-findings (15):** report each open finding and its closure paths
       (reconcile → corpus changes → fresh review; cited rejection in the resolution
       ledger; commissioner exception — never for a missing deliverable or an internal
       contradiction). End the turn.
     - **stale-hash (13):** the corpus changed since the reviewed snapshot — a fresh
       `/know-research:review-corpus final` run is needed. End the turn.
     - **Anything else** (validator-mismatch, criteria-drift, manifest or ledger
       errors): report the validator's reasons and the repair it names (most commonly
       "repair via re-init"). End the turn.
     - **Legacy-vs-damage note:** partial protocol state (a STATE discriminator line
       without a marker, or vice versa) is exit 11, not 10 — it fails closed. Only a
       clean exit 10 takes the legacy path.

     **Closeout stage 3 — one atomic write, the validator's.** Run
     `python3 <validator> transition --apply --root .`. The validator re-runs the gate,
     writes `research/reviews/completion.json`, and performs the exact four-op STATE
     transition itself — you never hand-edit STATE at final close. Route its exit
     explicitly, reporting the validator's own reasons:
     - **0:** done — report the recorded `review_set_id` and proceed to the debrief with
       the completion framed as: validated closeout, frozen corpus, any corpus change
       from here invalidates the completion. The completion report carries the
       qualification record forward: every waiver on a promoted deliverable, every
       accepted gap, any headline finding whose audit confidence tier sits below the
       confidence the completion prose would otherwise project. "Validated" attests
       that the process ran and the reviewer found nothing material — it never upgrades
       the strength of the findings themselves. A completion whose record contains
       qualifications may not read as unqualified.
     - **13 (stale-hash):** the corpus or STATE changed between the stage-2 gate and the
       apply (the TOCTOU guard). If nothing should have changed, re-run stage 3 once; a
       second 13 means something is writing to the corpus — stop and report.
     - **19 (state-format):** STATE's structure cannot support the four-op transition
       (the validator's reasons name what's wrong — a missing section, an ambiguous
       checklist). The repair is a *structural* hand-edit of STATE to the documented
       format — never a completion write — then re-run from stage 2.
     - **Interrupted/resumable half-apply** (a prior run wrote `completion.json` but not
       STATE): just run `transition --apply` again — the validator resumes
       deterministically. This is the only case where an immediate automatic retry is
       the documented remedy.
     - **Any other non-zero** (11/12/14/15/16/17/18/20/24): the gate re-run found
       something new — report the named reason and its stage-2 remedy, and end the
       turn. Never fall back to a manual STATE write because the apply refused.

  4. **Append backstage tasks for the next phase.** Before the debrief, append to `research/reference/backstage-tasks.md` (create with its header if absent) any private prep items this phase surfaced for future work — a figure that looked shaky and deserves a re-check, a suspected shared-origin cluster to trace, a source type the next phase should prioritize. These are the agent's own homework, not user-facing actions: `/know-research:start-phase` reads and works through them silently at the next phase start. Do not narrate this write to the user or read the list aloud — if an item is worth the user's attention, it belongs in the debrief instead. If nothing warrants an entry, write nothing.

  5. **Present the phase debrief** (see below). The debrief runs *after* STATE.md is advanced, not before.

- **If FAIL:** Do not promote the draft. Do not touch STATE.md. Execute the following steps in order — do not stop after step 1:

  1. **Classify each issue as mechanical or judgment.**
     - *Mechanical:* the correct value or wording is already knowable from the source notes, canonical-figures.json, or an analogous fix already made elsewhere in the same draft. Examples: misattributed range, typo'd figure, wrong citation pointing at a note that exists, qualifier strip that matches canonical data.
     - *Judgment:* choosing between two plausible sources, rewriting a claim whose support is missing entirely, resolving a contradiction the draft got wrong. Audience-standard violations are always judgment issues — only the user can decide between fixing the claim and granting a waiver.

  2. **Apply every mechanical fix to the draft now.** Do not ask permission. Use the Edit tool to make each change in the draft file. This is not optional — if a fix is mechanical, apply it. **Fix hygiene: an inserted qualifier, caveat, or warning must not split an existing sentence or orphan the clause it interrupts.** If the only clean insertion point would break a sentence or an argument mid-flow, the fix is no longer mechanical — reclassify it as judgment and hand it back rather than shipping a fix that damages the prose it was meant to protect.

     **Ledger frame corrections.** When an applied fix — mechanical now, or a judgment fix applied after the user decides — changes a claim's *interpretive frame or evidentiary strength* rather than its value (a causal claim reframed as correlational, a confidence tier downgraded, an "established" finding recast as single-source, a scope narrowed), append a `correction` entry to `research/reference/decision-ledger.md`, creating the file from `${CLAUDE_PLUGIN_ROOT}/reference/templates/decision-ledger.md` if absent: next sequential `D-<n>`, class `correction`, today's date, the phase, the claim's subject in one line, the reframing in one line (old frame → new frame), evidence pointing at this audit's report in `research/audits/`.

     Two things are **not** ledgered here, and the boundary matters more than it looks:
     - **Value corrections** — a figure fixed to match its note. `canonical-figures.json` and B1 already hold values; the ledger holds frames.
     - **A disposition another skill already recorded.** Disclosing an override, restating a resolved contradiction, or writing an accepted gap into Methodology is *conformance with* an existing entry, not a new decision — the resolution or acceptance was ledgered by cross-ref or check-gaps when it was made. Filing a second entry for the same decision double-records it and makes the supersession chain unreadable. The audit's job in that case is the disclosure, not a ledger write.

     A `correction` entry belongs here only when **this audit is what changed the frame**. The entry is what makes that change hold downstream: a later draft asserting the pre-correction frame without a superseding entry is a B13 finding. The write is silent (posture rule 7) — the *fix* is reported to the user; the filing is not.

     **A B14 fix is always a frame change, and always gets an entry.** Correcting referent drift changes what a claim asserts — a magnitude becomes a share, a relative percentage becomes percentage points — which is the definition of the frame moving, even though the digits never changed and the edit can look like wording. It is *especially* worth ledgering for that reason: the next draft reaching for the same figure has nothing but the note and this entry standing between it and the same mistake, and a fix that changed a claim without leaving a record is one re-run away from being undone. If the project has no ledger yet, create it from the template as you would for any other class.

  3. **List what you did and what remains.** For each mechanical fix applied, show: file, line, before → after. For each judgment issue, describe what needs to change and why the user must decide.

  3a. **Sub-classify the mechanical fixes — this decides who triggers the re-audit.** The split is narrow on purpose: the automatic lap ends in promotion to `outputs/`, so it is reserved for fixes that changed nothing a reader would call a fact.
     - *Citation-level:* the claim's wording and every number, range, and qualifier in it are untouched — only the pointer moved. A citation retargeted to a note you have **read and confirmed contains that exact value**, or a citation added alongside existing ones. Nothing the reader sees as a fact changed.
     - *Substantive:* anything else, even when the correct answer was obvious from the notes. A figure corrected, a range restored, a qualifier reinstated, a phrase struck, a sentence rewritten, a Methodology element written in. These are still applied automatically at step 2 — but they change what the draft asserts, and the user sees that land before it reaches `outputs/`.

     When a fix is arguable between the two, it is substantive. The cost of over-classifying is one extra user turn; the cost of under-classifying is an unreviewed change promoted to the trusted tier.

  4. **Re-audit immediately only if every finding was citation-level. Otherwise hand the re-run back.**

     - **Every finding was citation-level** → re-audit now, in this same turn. Return to step 1 and run the audit **in full, from the top** — not a spot-check of the lines you just touched. The reason re-audit exists is that fixes can introduce new problems, so a partial re-check would defeat it. Report the fresh audit's verdict as this run's outcome: PASS runs the promotion sequence, FAIL reports per this branch.
       - **Exactly one auto-re-audit per invocation.** If the second full audit also fails, stop and hand the re-run to the user, however the new findings classify. Two automated laps that both fail means the fixes are not converging; the re-run belongs to the user.
       - **Report both laps.** Say what the first audit found, what you fixed, and what the fresh audit concluded. Never present a second-lap PASS as though the draft passed clean the first time — the audit report and the debrief both record that fixes were required.
     - **Any substantive fix, or any judgment finding** → do not re-audit. Apply the fixes (step 2), then hand the re-run back so the user sees what moved before it can promote. Say only what is true of this audit:
       Name what you fixed and what is left in plain terms, never which internal bucket each fell into (see "What stays backstage" — the citation-level/substantive/judgment triage is yours, not the user's vocabulary). Where a fix changed what the draft says, show the before → after so the user is reviewing the change, not taking your word that it was minor. The turn — in your own words, matched to which of these is true — must convey:
       - When fixes were applied and something the reader would call a fact moved: what changed, that it changes what the draft claims (so it deserves their look), and that re-running `/know-research:audit-claims <filepath>` is what promotes it.
       - When some findings were fixed and others need a decision: what was settled from the notes, what remains theirs to decide, and the re-run instruction.
       - When nothing could be settled from the notes (every finding a judgment call — an audience-standard violation always is): do NOT claim fixes were applied; say these need their decision, and give the re-run instruction.

     If the user's next message is a waiver rather than a re-run, follow "Waiver Arriving Between Audits" below: record it, then hand the re-run back to them. A waiver is a judgment resolution, so it never triggers the automatic lap.

## Waiver Arriving Between Audits

A waiver almost never arrives during an audit. It arrives after one — the user reads the findings, decides a violation is a risk they will carry, and types `waive: <claim> — <rationale>` as a bare message. No audit is running when it lands.

**Record it on that turn.** Recording is not re-auditing. The re-audit rule restrains the audit loop; it says nothing about the record, and the two must not be confused. A waiver accepted in conversation and written to no file is the user exercising control that leaves no trace — indistinguishable, a week later, from having been ignored. Deferring the write to a re-audit that may never happen is not caution; it is the failure.

When a `waive:` message arrives outside an audit run:

1. **Validate it.** The message must carry the user's own rationale in the format `waive: <claim or finding> — <rationale>`. "Just waive it," "fine, ship it," or a bare `waive:` with no rationale is not a waiver — re-ask with the format and record nothing. Never author the rationale.

   It must also name a finding on record. Read the audit report at `research/audits/<basename>-audit.md`. If no audit report exists, or it holds no open audience-standard violation this waiver could address, say so and ask the user to run `/know-research:audit-claims <filepath>` first — a waiver against nothing is not recorded. If the finding it names is real but not an audience-standard violation, it is not waivable (see Pass/Fail Criteria): tell the user which kind of finding it is and that evidence accuracy has no waiver exit.

2. **Scope it — across claims yourself, within a claim never.** The two directions are not symmetrical, and conflating them is how a waiver gets quietly cut down.

   **Across claims, scope it yourself.** A waiver covers the claim(s) it names — not every finding open on the draft. If the audit found violations on two different claims and the waiver names one, the other stays open and the draft does not promote. Do not stretch the user's words onto a claim they did not name, and do not ask them to re-type a waiver you could scope yourself. State plainly which findings the waiver clears and which remain.

   **Within a named claim, the waiver reaches every open finding on it.** When the commissioner names a claim, they have accepted the risk of carrying *that claim* as it stands. If the claim carries three violations rather than one, the waiver clears all three. Do not subdivide a claim the commissioner named — deciding that their words reached one violation but not another is narrowing their own exercise of control on their behalf, which is the failure this whole protocol exists to prevent. A waiver that leaves the draft blocked on a second violation of the same claim has, from the commissioner's side, done nothing at all.

   **The one exception is an explicit one.** If the rationale itself distinguishes among the violations on that claim — it speaks to sourcing but expressly not to labeling, say — honor the distinction they drew and say which findings remain. A rationale that is merely *silent* about one violation is not a distinction; silence is covered.

   **If you genuinely cannot tell** whether the rationale meant to cover a second violation on the same claim, ask. Name both findings, say which you read the waiver as clearing, and let them answer. Asking costs one turn; narrowing silently costs them a decision they thought they had made.

3. **Record it in all three loci, now.**

   a. **Draft Methodology & Limitations** — insert the rationale verbatim: `Waiver (commissioner): "<rationale>" — applies to: <claim>`. If the section carries a `Waivers: none` placeholder, replace it. The draft is in `research/drafts/`, so Edit is ungated.

   b. **Audit report** (`research/audits/<basename>-audit.md`) — append or update a `## Waivers` section: date, the claim, the rationale verbatim, and which finding it clears. The finding stays in the findings table, marked `waived`. A waiver does not erase the violation; it sits next to it. The reader of the audit must be able to see both what was found and what the commissioner chose to carry.

   c. **Gate-log** (`research/audits/gate-log.md`) — append one row:

      ```
      | <ISO-8601 UTC timestamp> | waive | waived | research/drafts/<filename> | <finding> — commissioner waiver: "<rationale>" |
      ```

      The Result column is `waived`, never `pass`: a waiver authorizes no promotion by itself, and the hook reads the most recent row. The File column points at the draft, which is where the file still is.

   After writing, re-read each of the three files and confirm the waiver text landed. If any write failed, say which one, with the path — do not report the waiver as recorded.

4. **Confirm, and hand the re-run back.** In your own words, the closing turn must convey: what was recorded and where it lives in the deliverable, which findings the waiver clears and which remain open, that the draft has not moved, and that re-running `/know-research:audit-claims <filepath>` verifies it against the standing waiver. Then stop. Do not re-run the audit, do not promote, do not touch STATE.md. The next audit reads the waiver at step 4b and will not fail the draft on the waived finding.

## Adjudicating Corpus-Review Findings (the ledger writes)

Corpus-review findings (from `/know-research:review-corpus`) close through two append-only
ledgers, and **this skill is where the commissioner's adjudication gets recorded** — the
review runner never adjudicates, and no other skill writes these files. Adjudication
happens when the commissioner, looking at an open finding, gives one of two decisions in
conversation:

1. **"That finding is factually wrong — here's why."** Append to
   `research/reviews/resolutions.md`, exactly this grammar (the validator parses it;
   malformed entries block the gate):

   ```markdown
   ## R-<next-seq>: <short action title>
   - Refs: <review_id>/<finding_id>
   - Action: rejected-with-record
   - Date: YYYY-MM-DD
   - Closure evidence: <why the finding is factually wrong, with at least one
     <path>:<line> citation resolving to a corpus file — an uncited rejection does not
     close the finding>
   ```

   The refutation must actually cite the corpus; "we disagree" closes nothing. A
   `reconciled` entry uses the same grammar with `Action: reconciled` and names what
   changed where — but record it knowing the validator will still demand a **fresh
   review** (the fix changed the corpus, so the old set is stale by construction; a
   reconciliation can never close a finding against the current set).

2. **"I accept that risk."** First check the sequencing rule: the exception must be
   disclosed in each affected deliverable's Methodology & Limitations **before** the
   final review runs — write that disclosure now (substantive language: the risk and its
   decision impact, not a bare pointer), tell the commissioner the corpus changed, and
   only then append to `research/reviews/exceptions.md`:

   ```markdown
   ## E-<next-seq>
   - Refs: <review_id>/<finding_id>
   - Class: <the finding's class>
   - Commissioner rationale (verbatim): "<their words — never yours; re-ask if they
     give none>"
   - Decision impact and risk accepted: <...>
   - Binds to decision_corpus_hash: <the full current corpus hash from the validator's
     manifest mode>
   - Affected deliverables: <paths>
   - Date: YYYY-MM-DD
   ```

   Say plainly what the validator will enforce: the exception expires the moment the
   corpus changes, and a `deliverable-missing` or `internal-contradiction` finding can
   never be covered by one (waivability is validator-owned; the commissioner deciding to
   accept it does not make it acceptable).

Both ledgers are **append-only**: entries are never edited or deleted; a correction is a
new entry. Never author a rationale, never batch-adjudicate findings the commissioner
did not individually address, and never write a ledger entry from your own judgment —
these files exist to record *their* decisions.

## Phase Debrief (after pass)

When a phase's audit passes, do NOT just say "Audit passed" and recommend clearing context. Present a comprehensive debrief of what the phase established. Read the promoted output file and present:

1. **Key findings** — The substantive things this phase established, with specifics (numbers, comparisons, named entities). Not a one-line summary — cover all the major findings, not just the headline.
2. **Surprises or counterintuitive results** — Anything that challenges assumptions or conventional wisdom.
3. **Gaps that remain** — What this phase couldn't answer and why (data doesn't exist, sources conflict, needs internal verification).
3a. **Completion-criteria trajectory** — Read `research/reference/completion-criteria.md` (or the plan's Success Criteria section if no canonical file exists) and report any criterion this phase's work touched: moved toward met (say what now evidences it), still unmet, or newly at risk. Advisory only — never a gate at a non-final phase close. Its job is recurring visibility, so nobody meets the criteria for the first time at final closeout. When no criterion was touched, write nothing — an empty ritual line teaches the reader to skip the section.
4. **Implications for upcoming phases** — How these findings shape what to look for next.

**The qualification record travels with the findings.** When the promoted deliverable carries a waiver, when an accepted gap touches a finding's subject, or when a headline finding's audit confidence tier sits below the register the debrief would naturally use, the debrief says so where the finding is stated — a qualified record never reads unqualified. This is the same rule the final completion report follows.

5. **Register self-check — silent, before you present.** Run it over your recent turns this phase: validate-then-elaborate openers (any first sentence whose job is agreement, however honest the rest of the turn); ungraded validation (building on a user interpretation you never checked against the notes); premature-certainty drift (conclusions stated ahead of the evidence tier that supports them); machinery narration (state-file bookkeeping, counters, gate mechanics, step numbers narrated in first person); and pet phrases — any expression recurring across your responses, your own or one absorbed from these instructions. If you find any, correct the register from the debrief onward — do not announce the correction, just stop doing it. Check the debrief draft itself the same way: findings stated at the confidence their tier earns, surprises framed as what the evidence did (not what the user hoped), gaps named plainly. The doctrine is `${CLAUDE_PLUGIN_ROOT}/reference/posture-register.md`.

After presenting the debrief, pause and invite the user to react:

```
That's what Phase {N} established. Anything you want to capture, question, or dig into before we move on?
```

Wait for the user to respond. They may:
- Ask follow-up questions about specific findings
- Want to capture a note for later (`research/notes-to-self.md`)
- Challenge or comment on something the research surfaced
- Say they're good to move on

Only after the user is done reacting to the debrief, render the transition prompt (format defined in `${CLAUDE_PLUGIN_ROOT}/reference/prompt-templates-runtime.md`):

───────────────────────────────────────────────────────────

**▶ NEXT:** `/clear` then `/know-research:start-phase` — Start Phase [N+1] with a fresh context window.

**Also available:**
- `/know-research:progress` — See the overall project dashboard before clearing.
- `/know-research:check-gaps` — Confirm no unresolved gaps from Phase [N] should be carried forward.

**What to expect:** A fresh context window gives sharper analysis for the new phase. STATE.md and commonplace.md carry everything forward — no context is lost. Start-phase will read the research plan, gaps, commonplace entries, and open assumptions, and brief you on what Phase [N+1] needs.

───────────────────────────────────────────────────────────

## Non-Negotiable Rules

- **No bypassing.** If the user asks to skip the audit or move a failed draft to outputs manually, refuse. Explain that the audit gate exists to protect research quality and that fixing the issues is faster than dealing with unreliable findings downstream.
- **No soft passes.** Do not downgrade a high-severity issue to moderate to make the draft pass. If a claim doesn't trace to a source, it's unsupported regardless of whether the claim "feels right."
- **The full battery runs on every pass.** Step 5's B1–B17 are run in full on every audit — the first pass and every re-audit — and reported in `## Checks run this pass`. Improvising which classes to run (figures this pass, structure the next, quotations the pass after) is the defect that turns one audit into three: a finding surfaced on the third pass was never harder to detect, it was simply a check nobody had run yet. A skipped battery item is a failure of the audit, not a shortcut.
- **Recording a waiver is not re-auditing.** A valid `waive:` message is recorded the moment it arrives — draft Methodology & Limitations, audit report, gate-log — even when no audit is running, and even though the draft does not promote until the user re-invokes the audit. The re-audit rule below governs the audit loop, not the record — and a waiver is a judgment resolution, so it never earns the automatic lap. Never let a waiver the user granted end the turn with no trace on disk.
- **Re-audit after fixes — always full, never a spot-check.** When a draft is fixed after a failed audit, run the audit again from the top. Do not re-check only the previously flagged lines: fixes can introduce new problems, and catching those is the entire reason the second pass exists. Who triggers that pass depends on what the findings were:
  - **Citation-level findings only** → the agent re-audits itself, once, in the same turn (FAIL branch step 4). When the only corrections were pointers — a citation retargeted to a note confirmed to hold that exact value — nothing a reader would call a fact has moved, and asking the user to re-type the command to confirm bookkeeping is latency, not rigor.
  - **Any substantive fix** — a figure, range, qualifier, or sentence changed, even where the notes made the answer obvious → the re-run belongs to the user. The automatic lap ends in promotion to `outputs/`, and a change to what the draft asserts should be seen before it lands in the trusted tier. Over-classify when unsure: one extra turn costs less than an unreviewed change promoted.
  - **Any judgment finding, or a second consecutive automated failure** → the re-run belongs to the user. Judgment findings need a decision the agent must not make for them, and a draft that fails two full audits in a row is not converging.
  - **The loop is bounded at one automatic lap per invocation.** The agent never re-audits repeatedly, and never re-audits to work around a judgment finding.
- **No confidence tier inflation.** Do not inflate confidence tiers. If a section relies on a single source, it is Low confidence regardless of how authoritative that source is. Single-source High confidence does not exist — triangulation requires multiple independent sources.
- **Phase close is against the whole contract, never one file.** The deliverable manifest check (After Audit / If PASS step 2) is mandatory before any closeout. If the plan promises three synthesis outputs and one has been audited, the phase stays open — no debrief, no Active-phase advance, no "all phases complete." Record the partial progress in Next Action and stop.
- **The final phase closes only through the validator.** On a protocol-adopted project, this skill never writes a completion sentinel, never checks off the final phase, and never hand-edits STATE at final close — the corpus-review closeout's stage 3 (`transition --apply`) performs the one atomic write. A blocked gate is reported with the validator's own named reason and the turn ends; the remedy is the user's next move (run the final review, adjudicate a finding, or record a directive), never a workaround. On a legacy project (clean no-marker), the pre-protocol writes are allowed but the completion report must carry the visible "no credibility gate" notice.
- **A passing audit that completes the deliverable manifest must advance STATE.md before the debrief.** Promotion, phase closeout (check off Verify, mark Phase N complete, advance Active phase to N+1, generate the new cycle checklist, reset Next Action) all happen in one atomic step before you present findings to the user. The debrief is for the user; the STATE.md advance is for the next session. The next session may start with `/clear` immediately followed by `/know-research:discover` (skipping `/know-research:start-phase` entirely) — if STATE.md still points at Phase N when that happens, discover will either error or silently re-discover a completed phase. If you cannot advance STATE.md cleanly — e.g., `research/research-plan.md` is missing Phase N+1 and Phase N was not marked as final, or the cycle checklist has unchecked steps you did not expect — stop, surface the discrepancy to the user, and do NOT leave STATE.md half-updated. Either the full closeout happens or none of it does.

## Common Failure Modes

| Failure Mode | Prevention |
|---|---|
| Soft passes — downgrading severity to make a draft pass | Every severity classification must cite the specific rule it violates. If a claim lacks a source, it is high-severity regardless of how plausible it sounds. |
| Scope narrowing — auditing only "important" claims while skipping minor ones | Audit every factual claim, including numbers in passing references and claims inherited from prior phases. Minor claims are where drift hides. |
| Treating audit as formality — skimming rather than tracing each claim to its source | For each claim, open the cited source note and verify the value. Do not rely on memory of what the source said. |
| Post-fix spot-checking — only re-checking flagged issues after a fix | Re-run the full audit after fixes. Edits can introduce new mismatches, especially when adjusting ranges or qualifiers. |
| Improvised battery — running a different set of check-classes each pass | Step 5 is a fixed battery (B1–B17), not a menu. Run every item every pass and report each in `Checks run this pass`. Serial re-discovery — a defect found on pass 3 that was present all along — is the signature of a skipped item, and it turns one audit into several. The classes stay the same every pass on purpose. |
| Auditing only what claims assert, missing what the plan required — an absent component has no claim to trace | Battery item B6 (plan-requirement conformance) reads the phase's plan section, enumerates the required deliverable components, and confirms each is present. This is the only check that finds absent content — citation-checking structurally cannot, because there is no claim to trace. A required component that was never written is a high-severity Missing required component. |
| Consistency blind spot — auditing the draft in isolation without checking other outputs | Always run the cross-document consistency check and canonical figures check. Same claim, different numbers across documents is high-severity. |
| Conflating confidence with audit pass/fail — treating low confidence as a failure | Confidence tier measures evidence strength (how well-supported). Audit pass/fail measures evidence accuracy (how truthfully represented). A section with one source, accurately cited, passes the audit with Low confidence — unless the project's own evidence standard names that pattern as unacceptable, in which case it fails as an audience-standard violation. The standard gate enforces the user's commissioned rules; the tier stays advisory for everything the standard doesn't name. |
| Waiving standards on the user's behalf — treating a shrug as a waiver | A waiver exists only when the user typed `waive: <claim> — <rationale>` with a real rationale in their own words. "Fine, ship it" is not a waiver — re-ask with the format. Never author the rationale yourself; it appears verbatim in the deliverable's Methodology & Limitations under the commissioner's name. |
| Accepting a waiver in conversation and recording it nowhere — deferring the write to a re-audit that may never come | The waiver arrives as a bare message after the failed audit; there is no audit running to carry the write. Record it on that turn, in all three loci (draft M&L verbatim, audit report Waivers section, gate-log `waived` row), then hand the re-run back to the user. Recording is not re-auditing — the re-audit rule restrains the loop, not the record. A granted waiver that leaves no on-disk trace reads, later, exactly like a waiver that was ignored. |
| Blanket-waiving across claims — letting a waiver named on one claim clear findings on another | The waiver covers the claim it names. A violation on a *different* claim stays open and the draft stays unpromoted. Say which findings it clears and which remain — do not stretch the user's words onto a claim they never named, and do not make them re-type a waiver you could scope yourself. |
| Narrowing a waiver *within* the claim it names — clearing one violation and leaving the draft blocked on another violation of the same claim | The commissioner names the claim; you never subdivide it. Naming a claim accepts carrying that claim as it stands, so the waiver reaches every open finding on it. Honor a distinction only when the rationale itself draws one — silence about a second violation is not a distinction. If you truly cannot tell, name both findings and ask; do not decide the reach of their control for them. A waiver that leaves the draft blocked on the same claim has, from their side, done nothing. |
| Override laundering — a commissioner override reaching the deliverable as if the evidence produced it | For every resolution the draft relies on, compare `user_resolution` to `suggested_resolution` in cross-reference.md — never trust the `user_override` boolean alone (a `confirm: side-A` against a side-B assessment may carry no flag). If the fields differ, verify the label survived into the draft (finding site + Methodology & Limitations). The internal record is not the disclosure — the reader of the output must see that the commissioner chose against the evidence assessment. |
| Treating Methodology & Limitations as the writer's problem | Summarize-section writes the section; this audit gates on it (step 5b). A draft whose claims all trace but whose section is missing, boilerplate, or stamped with an adverse search that has no record does not promote. The section is part of the deliverable's evidence contract, not decoration. |
| Closing a multi-deliverable phase on one audited file | The deliverable manifest check (If PASS step 2) reads the plan's promised output inventory and requires every deliverable to exist in `outputs/` with a passing audit before closeout. A synthesis phase promising executive summary + report + recommendations needs all three audited — auditing `00-executive-summary.md` alone leaves the phase open with Next Action pointing at the next deliverable. |
| Declaring the final phase complete without the validator — writing the sentinel by hand, or treating a reviewer's `ready` as the gate opening | The final-phase branch runs the three-stage closeout: preflight (checks only, no conversational authorization), the validator's gate verdict routed by exit code, and `transition --apply` as the only STATE writer. A missing final review is exit 12 with the `/know-research:review-corpus final` remedy — not a reason to fall back to manual completion. |
| Silent phase closeout — promoting the draft and presenting the debrief but leaving STATE.md pointing at the completed phase | On PASS, execute the full closeout sequence in `After Audit / If PASS` step 3 before presenting the debrief. Every write — check off Verify, mark Phase N complete, advance Active phase to N+1, reset Cycle step, replace Current Phase Cycle with a fresh Phase N+1 checklist, reset per-phase source counters, rewrite Next Action — must land in STATE.md atomically. If any part cannot be completed (e.g., research-plan.md has no Phase N+1), stop and surface the discrepancy instead of partially updating. The next session may skip `/know-research:start-phase` and run `/know-research:discover` directly — STATE.md must be correct before the debrief, not after. |
| Leaving the completed phase's cycle checklist in Current Phase Cycle alongside the new one | `Current Phase Cycle` always reflects exactly one active phase. When advancing to Phase N+1, replace the Phase N checklist entirely — the completed record lives in `Completed Phases`, not in `Current Phase Cycle`. Two checklists in `Current Phase Cycle` is a bug, not a history feature. |
| Listing issues without applying mechanical fixes — stopping after the report instead of editing the draft | On FAIL, the 4-step sequence is mandatory: classify → apply mechanical fixes → list changes → tell user to re-run. If a fix is mechanical (correct value knowable from sources), apply it with the Edit tool. Do not present fixes as suggestions — make the edits. |
| Graph write blocking audit promotion — treating a claim-graph.json write failure as an audit failure | Graph write is supplementary infrastructure, not an evidence gate. If claim-graph.json cannot be written or parsed, log a WARNING in the audit report but continue to the pass/fail determination. The audit gate protects research quality; the graph is for downstream traceability (Phase 12). Never fail an audit or block promotion due to a graph write issue. |
| Skipping drift detection when claim-graph.json exists — missing drift warnings because graph parse is slow or unexpected | Always attempt drift detection when claim-graph.json exists and parses. A drift_warning in the claim graph means a canonical figure changed after a claim was written — surfacing it is the point. Only skip if the file is absent or unparseable. |

## Output

**Register (read `${CLAUDE_PLUGIN_ROOT}/reference/posture-register.md` — this is rule 7 applied to this skill, and it governs the FAIL turn as much as the PASS turn).** The audit's *findings* are the product; the audit's *plumbing* is not. Say the verdict, the findings, what changed in the draft, and what the user has to decide. Say nothing about the pipeline that got you there.

**On a FAIL, the verdict goes first — before any clean count.** Opening with what passed ("38 of 41 claims trace cleanly") and reaching the failure in paragraph three means a reader who stops early leaves believing the draft is sound. Observed on two separate scenarios. The clean figures are real and belong in the turn; they belong *after* the reader knows the draft did not pass. This is the same asymmetry the range rule names: an error here runs toward making the work look better than it is.

**Never tell the user what a re-run will find.** "Re-run it and it should come back clean" pre-judges a verification that has not happened, and if it comes back dirty the promise was the finding. Say what was fixed and what the re-run will check, never how it will turn out.

Backstage, always — never spoken:
- **Write verification.** Where a step requires verifying a write (machine-parsed files, the waiver's three loci), do it silently. Never say "verified," "confirmed on disk," "all three writes re-read," or "(verified after write)."
- **Internal step names and numbers.** No "step 4b," no "the M&L structural check," no "the FAIL sequence."
- **Gate activation state.** Not "the standard gate is inactive for this project." Say the substance: "there's no audience evidence standard recorded for this project, so nothing here was checked against one."
- **The mechanical/judgment taxonomy.** That split is how you decide what to fix; it is not vocabulary the user was taught. Say what you fixed and what needs their call, not which internal bucket each fell into.
- **Bookkeeping status.** Not "STATE.md is untouched," not "claim graph updated at `research/reference/claim-graph.json`," not the raw counter block.
- **Gate-log mechanics.** When you record a waiver, tell the user it is on the record *in the deliverable* — the Methodology & Limitations section, where the reader of the output will see it. Do not narrate the gate-log row or explain that `waived` is not `pass`.

Onstage, always: the product vocabulary the user was taught — the audit, the findings and their severity, confidence tiers, the draft, the deliverable, the Methodology & Limitations section, and what happens next.

- Not: "Step 4b — the waiver is recorded. Your rationale is now in three places: the draft M&L, the audit report's Waivers section, and the gate log (`research/audits/gate-log.md`) as a `waived` row (not `pass` — a waiver authorizes no promotion by itself). All three writes are confirmed on disk. STATE.md is unchanged."
- Say: "Recorded — your rationale goes into the deliverable's methodology section verbatim, so anyone reading the output sees the call you made and why. It clears Finding 1 only; Finding 2 is still open, so the draft can't move yet. Re-run the audit when you've settled it."

Scorecard summary and pass/fail status.

**If failed:** Execute the full 4-step fail sequence (classify → apply mechanical fixes → list changes and remaining issues → tell user to re-run). Do NOT render a transition prompt — a failed audit is a loop, not a transition. Do NOT stop after listing issues — if any fix is mechanical, apply it before responding to the user.

**If a waiver arrives after the failed audit:** record it on that turn — draft Methodology & Limitations verbatim, audit report Waivers section, gate-log `waived` row — then hand the re-run back to the user (see "Waiver Arriving Between Audits"). Do not defer the write to an audit that has not been invoked.

**If passed:** confirm the promotion to `outputs/`, present the phase debrief (see above), wait for the user to react, and then render the transition prompt (format defined in `${CLAUDE_PLUGIN_ROOT}/reference/prompt-templates-runtime.md`). The transition prompt appears only after the user is done reacting to the debrief — not before.
