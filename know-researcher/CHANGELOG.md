# Changelog — know-researcher

All notable changes to the know-researcher plugin. Per-plugin semver; tags are plugin-scoped
(`know-researcher--vX.Y.Z`).

## 1.18.1 — 2026-10-31

**The "What leaves your machine" section contradicted its own table.**

It said that for every service except the Codex CLI, what goes out is "a search query derived from
your topic," and that "every call goes through Bash, so you can see what was requested." Its own
table, directly above, listed content extraction, a filing lookup by CIK, `mailto` and email
parameters, an identifying `User-Agent`, and the built-in `WebSearch`/`WebFetch` floor. Three ways
the blanket claim was wrong:

- **Extraction sends a URL and pulls the page back.** Tavily's and Firecrawl's extract modes and
  the built-in `WebFetch` fetch a specific address, which is not a search query.
- **Three services receive an identifier.** OpenAlex takes a `mailto` and Unpaywall an email for
  polite-pool access; SEC EDGAR requires a `User-Agent` identifying the tool.
- **The default path does not go through Bash.** `WebSearch` and `WebFetch` are Claude's own tools.
  With no search CLI installed — which is the documented starting state — those calls are not
  visible as shell commands at all.

This is the section a user reads to decide whether a research topic is safe to point this at, so a
claim that narrows the described traffic is the wrong error to make there. Rewritten with the three
cases named, and with what remains true stated plainly: no file from the project is uploaded, and
what leaves is queries, URLs, and those identifiers.

`AGENTS.md` also now records the release procedure's corrected tag format.

Found by an independent adversarial review (Codex). No behavior changed.

## Arrival in the Knowbility marketplace — 2026-10-30

**Not a version bump.** The plugin arrived at `1.18.0` and kept it. Everything below this entry is
the version history it brought with it.

Forked with the original author's clearance from an MIT-licensed plugin of the same design, then
de-branded for Knowbility's use. The research cycle, the eleven research types, the integrity spine
(canonical figures, claim graph, integrity agent), the three-tier discovery chain, the audit gate,
and the adversarial corpus-review protocol are all unchanged.

### The version was deliberately not reset

`know-photo-generator` reset from `1.2.0` to `0.1.0` on arrival, because its brand-style library
was rebuilt and it genuinely is not a continuation of the original's line. This one is different:
nothing about the research system was rebuilt. Twelve skills, an eighteen-release history of
sharpening the same disciplines, and an adversarial corpus-review protocol are a mature system, and
`0.1.0` would tell a first-time reader the opposite of the truth about what they are installing.
The convention in the root `AGENTS.md` says reset; this is the documented exception, made by
Knowbility's board chair, who is also the original author.

### What changed in the port

- **Renamed** to `know-researcher`. The command namespace moved from `/research:` to
  `/know-research:`, so the twelve commands cannot collide with the plugin this was forked from.
  **402 invocation references were rewritten.** The source carried two forms for the same commands
  — a hyphen form (`/research-audit-claims`, 366 references) and a colon form
  (`/research:audit-claims`, 36) — and its own v1.5.0 entry argues the hyphen is the one that
  resolves. This port uses one form everywhere rather than carrying the ambiguity across.
  Skill `name:` frontmatter was left un-prefixed, matching the three plugins already in this
  marketplace.
- **A confidence tier now says what it does not mean.** This is the only behavior change. The
  house rule in the root `AGENTS.md` forbids any plugin here from implying that automated output is
  a conformance evaluation, and this plugin can break it from a direction none of the others can:
  a well-sourced, High-confidence research finding about *what an accessibility criterion requires*
  is not a determination that any product meets it. Step 8a of `research-audit-claims` now says so
  where the tier is assigned, and flags a draft that slides from what a standard requires to what a
  product therefore satisfies — that slide is an unsupported claim no matter how good the sourcing
  for its first half. The same distinction is in the manifest description and the README.
- **The `outputs/` gate no longer fails open without `jq`.** Found during the port and worth
  recording in full, because the failure was invisible. `hooks/gate-outputs.sh` parses its hook
  payload with `jq`. When `jq` was not on PATH, both parses returned empty, the empty-path guard
  exited 0, and **the write was allowed** — the plugin's central guarantee, that nothing reaches
  `research/outputs/` except through an audit, silently stopped holding, with nothing but
  `jq: command not found` on stderr where nobody reads it. A gate that cannot verify authorization
  must not grant it, so a missing `jq` now refuses writes naming the outputs directory and names
  the install command. Verified in four cases: gate present and blocking, unrelated paths
  unaffected, no-`jq` writes to `outputs/` blocked, and a legitimate promotion with a fresh pass
  row still allowed. `jq` ships with macOS 15 and later, which is why this went unnoticed.
- **`hooks/setup-paths.sh` now adds the directory its own comment promised.** The header listed
  `/usr/local/bin` among the locations it detects — Homebrew on Intel Macs and on Linux — and the
  loop did not include it. Code now matches the comment.
- **`.DS_Store` files and a stale `__pycache__/*.pyc` were not carried across.**
- Author, homepage, and repository set to Knowbility's. License was already MIT. The trailing
  "Part of the Kenzie Creative marketplace" was removed from the manifest description.

### Documentation

`dev/know-researcher/` carries the two operating-model documents (`ARCHITECTURE.md`, the
explanation; `MAINTAINERS.md`, the ownership and seam ledger) plus the nine per-workstream design
notes `MAINTAINERS.md` cites by name — a seam register pointing at missing files is worse than no
pointer. Left in the source repository: `constraint-audit.md` and the corpus-review `spike/`,
neither cited by anything that came across. `dev/know-researcher/README.md` records both lists.

### What has not been exercised here

No research project has been run end to end in this repository. No live discovery call has been
made, and no corpus has been reviewed. What was verified: the invocation namespace resolves, the
corpus-review validator runs, the output gate behaves correctly with and without `jq`, and every
documented path exists.

## History from before the fork

The entries below are preserved verbatim from the plugin this was forked from, including their
version numbers, which belong to that lineage. They describe the plugin under its original name
and, in the older entries, its original command forms.

## [1.18.0] — 2026-08-25

**W6d — instrument validity, and the last workstream closes.**

A decision rule is only as good as the quantities it references. "Adopt where picking error falls
below 0.5%" reads as rigour because it contains an operator, but if every figure measures *the share
of sites reporting any reduction*, no figure measures the error rate the rule needs, and the rule
cannot be evaluated at all. Synthesis now checks that at the rule, names what would be needed, and
still writes the section.

**Two of the corpus reviewer's four patterns, deliberately — not four.** C7 is scoped to "ONLY these
named patterns", which is its author conceding that unbounded study-design critique failed even at
the end of a project with the whole corpus in view. A check running earlier, on one section, has
less context and more chances to fire. So it takes the two that survive the move — a decision rule
referencing unmeasured quantities, and two figures whose populations overlap without their
relationship stated — and leaves the other two where they work.

**An unknown relationship constrains the prose around it.** Writing "whether the 890 sit inside the
1,240 is not established" and then calling one a "narrower slice of that broader population" asserts
the containment the sentence just refused. The disclaimer is a constraint, not a paragraph to
discharge.

**Anything outside those two patterns is routed to a person and left unsettled.** Not adjudicated —
and equally not retired as unanswerable. "No mapped channel can settle this" says nobody can know;
"a statistician should look at this" hands it to someone who can. The first quietly converts an open
question into an accepted limitation, and the end-of-project reviewer never receives it.

**Fixes found by running the set, not by reading it.**

- **An audit reported "clean" over a live breach and promoted the draft.** The standing-provision
  check verified the one compliant claim it read and never enumerated the rest; a single-source
  claim missing its required flag went to `outputs/`. It now enumerates the governed claims and
  reports the count, so a clean result says how much was examined.
- **The adverse-search itemization leaked through four surfaces.** The rule was written per-surface
  — turn, then durable record — and every surface it did not name lost the per-item reasons: the
  draft's prose, and a closing recap. It now binds every surface that carries a disposition.
- **A phase closed without showing the contract it closed against.** The deliverable manifest is the
  result, not the pipeline; it reaches the user every time.
- **`/research-init upgrade` reported step 5's verification while standing at step 3**, and never
  told the user their existing work survived — one ordering defect with two opposite symptoms. The
  untouched-content report now lands the moment the writes do, and no step may report a later step's
  result.
- **The fresh-project guard offered to run the destructive `mv` itself.** It now states that the
  `mv` and `rm -rf` are the user's to run.
- **A stop-and-ask that arrives after the draft is a caveat, not a choice.** The lopsided-coverage
  advisory now rides the same pause as the counter-evidence gate, before anything is written — the
  same failure the stale-reading stop was built to prevent.
- A corrupted line in the counter-evidence block template had re-created the fabrication path: it
  offered output stamped "no credible counter-evidence found after documented search" for a search
  nobody ran.
- The audit report's check-list enumerated "B1–B17", so B18 had been invisible since v1.16.0.

**New deterministic gate.** A draft claiming a documented adverse search must be accompanied by the
record it refers to. Found once in nine runs, which is exactly why it belongs in a gate: a rule
catches it when the run remembers.

**Correction to v1.17.0.** That entry said W5 "does not reach" notes arriving through the
interrupted-processing branch. That was wrong — `research-process-source` has a pre-schema note gain
its figure records on contact when the source material is still on disk, and that rule reaches this
branch. The real finding is narrower: it fires inconsistently (0 of 3 runs before this release's
recovery change, 2 of 3 after).

The eval set is **45 of 45 golden**, every scenario verified 3× against this build. The five that
had been tracked-not-golden were each blocked by a fixture or a skill defect rather than by the
behaviour they tested.

## [1.17.0] — 2026-08-24

**W5 — a figure carries the population it was measured on.**

A number is only as wide as what it was measured against, and that width is the first thing lost
when a figure moves from a source into a draft. "4.2% spoilage across one carrier's nine eastern
depots over a summer quarter" becomes "regional operators see 4.2%" in a single retelling, and
nothing in the record marks the moment it widened. This release makes the width part of the figure.

**Two new fields on every figure record.** `basis` records what the number was measured on —
sample, method, population, when it was fielded. `carries-to` records how far the source itself
licenses it to travel. Both are recorded from the source's own words, and when a source withholds
its methodology, **the withholding is the finding**: `basis` says so plainly rather than leaving the
field off, because an omitted field reads as an unasked question rather than a refused answer.

**The turn is bound as tightly as the draft.** The earlier failure was never that a draft got a
figure wrong — it was that the draft stayed accurate while the spoken turn quietly widened. A
`carries-to` now binds both surfaces, so the sentence said aloud has to hold the same population the
record does.

**Restraint is half the check.** A figure whose source generalises it — an industry panel extending
its own sample to the sector — travels at the width the source claims, attributed as the source's
leap rather than the analysis's. A check that flags every figure is as useless as one that flags
none, and a lopsided-corroboration caveat must not collapse into a population hedge: "not
independently corroborated" and "only true of the 34 measured" are different statements.

**A degenerate source stays silent.** Notes with no figures skip the integrity pass without
mentioning it. That sounds trivial and was not: nine samples produced three distinct ways of
narrating machinery — announcing which branch the skill took, reporting a clean pre-flight, and
volunteering that "the usual sampling and methodology checks don't apply." All three came from one
impulse, **justifying a degenerate result**. An empty field looks like an error, so a run explains
it. The Output rule now leads with the principle — the reader gets the pipeline's result, never its
reasoning about itself — and treats its list of examples as illustrations rather than a boundary,
because an enumeration of today's mechanisms silently exempts tomorrow's.

One boundary worth stating plainly: this covers every figure record the plugin **writes**. A note
that predates the requirement and arrives through the interrupted-processing branch is backfilled
as-is — that branch is forbidden to regenerate a note, which is what stops a resumed run from
duplicating work or double-counting. Older notes in an existing corpus keep whatever they had.

Four scenarios added to the golden set (31 → 35).

## [1.16.0] — 2026-08-24

**W6c/6e/6f — a recommendation has to be usable, not just supported.**

The plugin has always checked whether a conclusion is *supported* — traced to its sources, matched
against the brief. It never asked whether a recommendation is **actionable and refutable**. Three
checks close that, and they were built together because they share a subject and none of them had a
home: separately they would have been three near-identical passes over the same sentences.

**A recommendation names what would show it wrong.** Something that, if observed, would mean not to
follow it — and whether anything planned could produce that observation. **A refutation that would
survive any observation fails as vacuous**, which matters more than it sounds: "further research may
refine this" is not a rare edge case, it is what fluent writing produces when asked this question.
The test is whether a reader could tell what would have to happen for the recommendation to be
wrong.

**And a recommendation nothing observable could refute passes — when it says so.** A compliance
requirement is not a falsifiable proposition. Saying that plainly is a real answer, and an audit
that punished it would teach the next draft to invent a vacuous refutation instead of stating an
honest one. Verified: across three samples the audit accepted the honest exit, named why, and
declined to author a replacement refutation — *"that's not mine to invent on your behalf."*

**A recommendation's prerequisites are disclosed where the recommendation is made.** If it rests on
a decision nobody has taken or a dependency nobody has built, that belongs in the sentence a reader
acts on — not in a limitations section they may never reach. This is judged on **position, not
presence**: the buried disclosure is the defect, not a partial fix.

**Closeout refuses to close on a corpus that contradicts itself.** Every status and blocker claim
across promoted outputs, STATE, and the decision ledger is collected and compared. A contradiction
is reported **as a pair, with both locations, unresolved** — the plugin cannot know which document
is current, and guessing would write a fact nobody recorded. A stop, not a block: say which is
current and closeout proceeds. Verified against the case that makes it necessary — every completion
criterion genuinely met, both phase outputs individually passing their own audits, and the
contradiction existing only *between* them, where nothing before closeout could see it.

All three use the corpus reviewer's own vocabulary (C4, C5, C6), so the end-of-project review reads
the record rather than rebuilding it — and C4/C5/C6 each now carry the instruction to **check that
record rather than trust it**.

**31 goldens**, up from 27.

## [1.15.0] — 2026-08-24

**W4 — someone has to have looked for evidence against it, whatever kind of research this is.**

Until now the counter-evidence gate ran for **two of eleven research types**. It worked by looking
for a source note tagged `CHALLENGED` or `CONTRADICTED`, and those tags exist only in PRD Validation
and Exploratory Thesis. So the discipline was coupled to a tag, the tag was coupled to a type, and a
Competitive Analysis or a Market study could reach a promoted deliverable with nothing having asked
whether its central claim could be wrong. v1.9.0 had already settled the principle that made this
indefensible: research type is internal routing metadata, not a decision about which disciplines
apply.

**The gate now keys on the claim.** Every load-bearing claim — B16's existing bar, reused rather
than redefined — needs one of three things on the record:

- a credible source that disputes it,
- a documented adverse search that came back empty, or
- a statement that the claim is not disconfirmable through the mapped channels, with what would
  have been needed.

The third is new, and it is the honest option the gate lacked. Some claims genuinely cannot be
refuted by what discovery mapped — a standard's definition of its own term is not the kind of thing
an outside source can contradict. Saying so is a real result, and it is what stops the gate becoming
a ritual people route around. **A challenger must dispute the same claim measured the same way** —
same quantity, same population, same clock. A source reporting a different figure for a different
quantity is a second finding about a second thing, and taking it as opposition is the
manufactured-challenger move wearing a real citation.

The requirement is per claim; the record is one phase-level pass, so a single adverse search can
discharge several claims and the gate stays affordable.

**And the assumption loop finally closes.** `assumptions.md` has always recorded "what would
challenge this," and `research-start-phase` has always surfaced the relevant ones at phase start —
but nothing ever recorded that a criterion had been **tested**. An assumption could sit `Open` from
the phase that logged it through to the final deliverable, with its falsification criterion on file,
noticed at every phase start, and never once run. `Status` now carries four values: `Open`,
`Tested — held` (naming what was run), `Tested — broke` (which propagates as a `correction` in the
decision ledger), and `Untestable via mapped channels` (recording what would have been needed).
Phase start reports how many phases each open assumption has survived, because an assumption open
across four phases is a different fact from one logged last week.

At closeout, the audit asks whether any load-bearing conclusion rests on a still-`Open` assumption.
**It is a stop, not a block** — shipping on an untested assumption is a legitimate call researchers
make knowingly; shipping on one silently is not. The same shape v1.14.0 introduced for the stale
saturation reading, including its ban on predicting what the untested result would have been.

This is the in-line half of the corpus reviewer's C5 Falsifiability check, which asks the same
question once at the end. C5's brief now says a Tier-1 record may exist and to **check it rather
than trust it** — the posture C14 already takes toward provenance labels.

**Also in this release**

- **Pronouns are a sourced fact.** A Person Research run wrote eighteen gendered pronouns into a
  draft whose entire corpus contained none. That is an unsourced claim about a real, named person,
  asserted on every line of a document written about them. they/them is now the default for the
  subject and everyone who surfaces, in Person Research and Customer Safari, unless a source records
  that person's own usage — a name is not a source, and neither is a photo, a voice, or a job title.
  The audit battery checks it alongside identity exposure, as a named defect class with a mechanical
  fix.
- An assumption entry now carries its referent, so a note recording that 60–70% of teams *reported*
  a reduction cannot become an assumption that the reduction *was* 60–70%.
- A block turn can no longer offer to log an empty search. At block time nobody has looked, so that
  offered to write a finding about an event that had not happened.

## [1.14.0] — 2026-08-24

**The gap check stops handing you a caveat and then deciding anyway.**

Found by a regression sweep before what was meant to be a patch release. Three defects in
`research-check-gaps`, and the first two share an anatomy: **the spoken turn was right and the
durable record was wrong.** In each case the run followed the instruction exactly — the instruction
only bound one surface.

**A stale saturation reading now stops the phase and puts the decision to you.** When the record
that answers "would more searching turn anything up?" is out of date and coverage otherwise looks
adequate, the gap check used to say so and then, three lines later, recommend drafting and advance
the cycle. The disclosure was true and changed nothing, which is the shape of a caveat that exists
to be stepped over — and drafting is the phase's expensive, hard-to-unwind step. Now it presents
what is known, the two legitimate routes (re-run the cross-reference, or proceed and carry the
limitation into Methodology & Limitations), and its recommendation, then stops. **This is a stop,
not a block:** say the word and the phase proceeds. The point is that proceeding is something you
chose rather than something that happened while you were being told a caveat. Same shape as the
collection-exhausted decision the skill already presents this way.

The staleness sentence also carries the **count** again — "three sources have landed since the last
cross-reference," not "a few sources behind." Naming the file is plumbing; how far behind the record
is, is a fact about your project and the input that tells you whether re-running matters. The
earlier wording drew the wrong lesson from the no-machinery rule: strip the mechanism, keep the
substance.

**And the disclosure reaches `gaps.md`, not just the conversation.** It was unconditional "in the
turn" and bound to nothing else, so a run could disclose the staleness accurately while writing a
`gaps.md` that closed "None — every question in the active phase meets the coverage bar." The turn
scrolls away; the file is what the next person opens, and it read clean.

**Counter-evidence can no longer fall off the priority list.** An Evidence Against question — one
where a credible source contradicts the claim — only reached `gaps.md`'s Highest-Priority Gaps when
synthesis was imminent. Every other status had a non-imminent route, so counter-evidence more than
one step from synthesis appeared in the per-question detail and nowhere the reader actually looks.
It now has its own bucket, ranked **above** thin coverage: thin coverage is a claim weakly supported
and collecting fixes it, while counter-evidence is a claim the draft cannot make at all and no
amount of collecting resolves.

### Also in this release: eight fixes that had been sitting unreleased

All found by running the plugin rather than by designing anything new. These were staged as a
1.13.1 patch; the sweep that was meant to verify them found the three defects above, so they ship
here instead.

`/research-init` is the centre of gravity here. It had shipped through six releases without a
single eval run, because it is the one command that runs *before* a project exists and the
harness had no way to reach it. Making it runnable found two defects on its first two runs and
six more over the following rounds.

**Init reported results it did not get.**

- **A missing environment variable was read as validator drift.** With `CLAUDE_PLUGIN_ROOT` set,
  the gate check exits 12; unset, it exits 11 — `validator-mismatch` — on a completely intact
  install. Step 3a said 11 means the kit is partial and to fix it before reporting. A fresh
  project told its validator is mismatched gets distrusted for the life of the project over an
  unset variable. Step 3a now passes `--plugin-root` explicitly and distinguishes exit 11's two
  causes.
- **A run reported "exit code 12, the protocol is intact"** when the plain invocation returned 11,
  and its own notes conceded the 12 came from a hand-set path. The honesty rule was being held for
  the grounding line and never generalized: report the result you got from the invocation you ran,
  and if a flag or variable was supplied by hand to make it succeed, that is part of the result.
- **The same rule, running the other way.** Runs told the user retrieval was unavailable with no
  attempted call anywhere behind the claim, while a sibling run made the search for real and got
  results. "No retrieval was available" is a claim about the environment and needs an attempt
  behind it exactly as "grounded in preliminary research" needs research. An under-claim is
  friendlier than an over-claim and it is the same defect.
- **A false claim about init's own capabilities**, written into the skill by its author and caught
  by a runner reading the steps literally.

**Init inferred routing metadata it could not know.**

- **A project with no PRD was typed as PRD Validation**, which ships that type's finding tags and
  its "does the PRD address…" source standards into `CLAUDE.md`, where every later phase inherits
  them. A type is not inferable without its defining artifact — Person Research needs a person,
  Competitive Analysis needs named competitors. Durable, rarely revisited metadata does not
  self-correct when it is wrong.
- **Adoption's criteria branch had two cases and needed three.** It branched on "already carries
  SC-N IDs" and "is prose", and a plan with no success-criteria section at all fell through both.
  Absent is not a formatting gap; it means the project never wrote down what finishing looks like.
  The new branch says so and forbids inventing criteria unasked — a completion gate bound to
  criteria the agent wrote for itself checks nothing, and is worse than no gate because it reads
  like one.

**Two fixes outside init.**

- **The saturation disclosure had one worked example for three different causes**, and the example
  was the stale-record wording. Runs copied it onto the absent case and asserted the cross-
  reference was "a few sources out of date" where the counter reads zero — inventing a state fact.
  Now one sentence per cause. Step 4a's classification, which had drifted two-way against a
  three-way disclosure in the same step, was reconciled with it.
- **The claim graph recorded pre-fix claim text by instruction**, so the next audit's regression
  sweep compares against sentences the draft no longer contains. It compounds: node matching is by
  text equality and a fix is exactly what breaks it, so the naive read appends a duplicate and
  orphans the original. The graph now records post-fix text, and a fixed claim updates its node
  rather than gaining a second one.

## [1.13.0] — 2026-08-09

**W3 — conclusion exceeds evidence, and drifts from the brief (Seam 2).**

A finished pricing project produced four of these, and its gates passed on all four: a range
became a single number; an option was "ruled out" on the *absence* of evidence for it; the
recommendation drifted from leadership's stated frame; a constraint was asserted as immovable
that the research had found was not a lever. **None was a citation error.** Every one traced to a
note. Tracing a claim and licensing a conclusion are different things, and only the first was
being checked.

**The taxonomy for this already existed one tier up**, in the corpus reviewer's C2
(conclusion-vs-brief) and C14 (recommendation provenance) — which between them name all four
failures. So this release is the in-line prevention layer for checks that until now only ran as
end-of-project review, the same relationship v1.10.0 has to v1.8.0. It uses C14's three labels
verbatim rather than a parallel taxonomy, because C14's failure condition is "inference *dressed
as* evidence-supported", and that means nothing unless the writer and the reviewer use the same
three words.

### Added

- **Provenance labels at synthesis.** Every load-bearing "so what" — anything a reader would act
  on — is labelled inline, in the sentence: **evidence-supported implication** (a reader can
  follow the cited notes there), **analyst inference** (reasoning past what any source states —
  legitimate, often the most valuable thing in the report, simply not established), or
  **commissioner priority** (follows from a stated preference or directive; cite it). Inline
  rather than in a block at the end, because the reader who most needs the label is the one
  deciding whether to act on the sentence. The provenance is carried into the spoken turn too —
  the draft is audited and the turn is not.
- **B16 — provenance conformance.** Each label checked against what stands behind it. An
  implication's chain gets walked; an inference is asked for no evidence but is checked for
  established-fact grammar; a priority must trace to a real `directive`. **The set is judged as
  well as the labels** — a recommendation-shaped statement carrying no label is the one most in
  need of one. A wrong label is high severity; a missing label is moderate, because an older
  project has simply not met the convention yet and a check that fires high on every legacy draft
  is one people learn to skip.
- **B17 — conclusion vs. brief.** Compares the conclusion against the plan's Core Question and
  any `directive` ledger entries, which supersede the plan for whatever they touch. A range stays
  a range unless a decision rule on disk converts it. "Ruled out" requires affirmative evidence.
  Drift is not a defect — evidence sometimes lands somewhere better than the brief expected — but
  *undisclosed* drift is, and the finding names both questions and leaves the choice with the
  commissioner. Runs at **every phase close**, not only the final one, because drift accumulates
  while each phase stays individually defensible.

### Changed

- `writing-standards.md`'s two-way split ("cite it or flag it as inference") becomes the
  three-way one, so the two documents do not contradict each other. That rule keyed on whether a
  citation exists, which is exactly why it missed all four failures — they were all cited.
- The corpus-review brief's C14 gains a line: where labels are present, check them rather than
  trust them; where they are absent, identify provenance as before and do not report the absence
  as a finding. **No protocol version change, no validator change** — the contract hash is
  untouched and the battery still self-tests 74/74.
- `check-gaps` gains a count-and-reconcile step before regenerating `gaps.md`: walk the notes and
  confirm each appears in the per-question detail. The rule it protects is easy to hold and easy
  to forget for a structural reason now stated in the instruction — the natural way to write the
  output is note-by-note while the correct way is question-by-question.

### Fixed

- The immovable-constraint case is routed to B17 at high severity rather than B16 at moderate. It
  *looks* like a labelling problem because such a sentence is usually also unlabelled, so the rule
  carries a test: if adding the right label would leave the sentence still wrong, it is a B17
  finding. "The $20 floor cannot move (commissioner priority)" is still wrong.
- B16 reports a census line before its findings. Three statements each drawing a finding is a
  different message from "three load-bearing statements, none labelled", and a reader given only
  the findings can reasonably infer the others were labelled wrongly rather than not at all.

## [1.12.1] — 2026-08-09

**The fidelity rules now bind what the plugin says, not only what it writes.**

v1.12.0 stopped a figure changing meaning between the note and the draft. Verifying it turned
up the other half: a run wrote "60–70% of teams reported a reduction" into the draft and then
told the commissioner "a 60–70% reduction". The published claim was right and the communicated
one was stronger — and the spoken version is the one that gets remembered and repeated into a
meeting. The audit reads the draft; nothing audits a turn.

This is the same authoring failure the whole W1/W2 verification kept producing, for the fifth
time: guardrail 4a said "the draft may not quietly widen it", so the turn was never bound. A
requirement written for one surface does not reach the other, and adding emphasis does not fix
it — stating both surfaces does.

### Added

- **Posture rule 8 — a figure you say out loud carries what its note says it measures.** Placed
  in `posture-register.md` § Register rules — every response, because that is the one document
  every skill reads for every turn, so the rule reaches every path a figure can be spoken on.
  It carries the reason the spoken form is the harder one: speech compresses, and compression
  runs toward the stronger reading.
- **`adv-referent-drift-spoken`** — a synthesize-entry golden whose second turn asks for "the
  headline number I can take to the exec team", which is precisely the pull that turns a share
  into a magnitude. Referent Fidelity now applies to synthesize runs and is scored on the turn
  as well as the draft, with the worse surface governing.

### Changed

- `summarize-section` guardrail 4a binds the draft **and** the turn, stated symmetrically
  rather than as an aside.

### Verified

3× sampling, Referent Fidelity 3/3/3 — **twice**, and only the second round counts. The first
used the same figure and example sentences that posture rule 8 used, so a green could have been
recall rather than capability. Rule 8's worked example was changed to a different figure in a
different domain, the scenario was left untouched, and the re-run came back 3/3 with no sample
echoing the rule's wording. All three runs refused to hand the exec team a magnitude the study
never measured.

**The lesson is the reusable part: keep an instruction's worked example and its scenario's case
distinct.** Otherwise the eval measures memory of the example, and a green means nothing.

## [1.12.0] — 2026-08-09

**W1 — source-note fidelity (Seam 0), and the thing that turned out to be sitting next to it.**

A number can keep every digit and change what it means. In eval iteration 28 a note recorded
"60–70% **of teams report** a reduction in time-to-value" and the draft written from it said
"a 60–70% **reduction in** time-to-value" — a share of a population rendered as the size of an
effect, which is a different and much stronger claim. Every check that compares numbers passed
it, because nothing about the number changed. Nothing in the plugin asked what a number is *of*.

That is **not** the seam W1 was scoped around, and the distinction is recorded rather than
smoothed over: W1's subject is the note versus the *original source*, which nothing has ever
checked and which no defect has ever demonstrated — because demonstrating one requires re-reading
originals. Both land on the same surface, so they ship together rather than as two migrations of
the note format.

### Added

- **Per-figure records in source notes.** Every quote and number a draft might cite now carries
  `measures` (what the figure is a measurement *of*, with its population), an optional `not` (the
  plausible neighbouring reading it does **not** support), `locator` (where in the source it
  sits), and `verbatim` (the source's own words). `measures` is the load-bearing field: "60–70%"
  is not a fact, "60–70% *of surveyed teams*, reporting *any* reduction" is.
- **B14 — referent conformance.** A draft must use each figure for what its note says it measures.
  Digits matching is the precondition for the check, not evidence of anything. High severity, and
  the finding reports *both* readings — what the note supports and what the draft asserted —
  because "used incorrectly" tells a writer nothing.
- **B15 — source-anchor presence.** Every cited figure record must carry a usable locator.
  Moderate severity. A locator that honestly reads "not locatable in the extracted content" is
  not a finding — that is the note doing its job.
- **Prevention at the writing site**, not only detection at the gate: `summarize-section`
  guardrail 4a states the rule where drafts are written.

### Changed

- **The integrity agent counts sources per finding, not per section.** It cleared a draft whose
  Methodology & Limitations read "Single-source findings: none. Both findings rest on two
  independent sources" over two findings with one source each — the ordinary case of finding A
  from note 1 and finding B from note 2, counted as a section total and applied to both. A
  statement about source counts is now itself a checked claim.
- Old notes predating the schema report `n/a`, never a finding, and are upgraded when a skill
  reads them. A check that fires on every note written before it existed is noise, and noise is
  what gets a battery item skipped.

### Verified

Eval iterations 30–40. **All 19 goldens pass**, with every noisy scenario sampled 3× and scored
on the worst sample. Zero deterministic-gate failures and zero capture-integrity failures across
the whole sweep.

Nine defects were found and fixed during verification — four in W1's own new wording, five
pre-existing and newly caught. The two that took the most work:

- **The adverse-search summary.** Five rounds. A roll-up above the itemized results kept
  describing a heterogeneous group with a single phrase — "four affirmed the benefit" over a
  group holding an academic null result, then "two with no position" over a pair the log calls
  supportive. The distinction that finally landed: a disposition *name* covers its members
  legitimately (it is the log's own classification), a *reason* attached to that name does not.
- **The clean-corpus control returned a material finding four times.** One was the reviewer
  inventing one — the brief named required evidence per check and never said what to do when it
  cannot be produced, so a finding was filed with an empty evidence array. Three were the test
  corpus genuinely not being clean: the one fact the recommendation gates on was vendor-sourced
  only while every other single-source claim was flagged.

Also recorded: `adv-adverse-search-summary` was split out of the valve golden and is **tracked,
not asserted** — the plugin runs 2-of-3 clean on it and five instruction rewrites did not move
that. The bar is unchanged and carries all five rounds of evidence; it now fails on its own
dimension rather than blocking an invariant that has passed throughout.

### Verified

Eval iterations 43–50. **All 22 goldens pass**, with every noisy scenario sampled 3× and scored on
the worst sample. Zero deterministic-gate failures and zero capture-integrity failures across the
whole sweep.

Three regressions specifically re-confirmed at 3×: post-decision re-argument (open from iteration
4, closed in v1.11.0), claim-site disclosure carrying its content rather than pointing at
Methodology & Limitations (v1.12.1), and the counter-evidence valve's exit, now scored separately
from the accuracy of its summary.

**Four times during this verification a failing test turned out to be the test's fault, not the
plugin's** — a fixture asserted clean that was not, a seeded draft missing a required section, a
scenario expecting a note under the wrong question, and an expectation that turned on an arguable
reading. The tell was identical every time: most samples doing the thing the expectation forbade.
Recorded because it cost real time: when the majority of runs disagree with the test, read the
test first.

### What this does not do — stated plainly

**Nothing re-reads original sources.** B15 asserts that a verifiable anchor *exists*; it does not
open the source and check the note against it. A clean B15 means the corpus is checkable, not
that it has been checked, and **Seam 0 remains open**. Sampled re-validation at audit was
deliberately deferred: it needs fetching inside the audit path and fails on exactly the sources
that matter most — paywalled, dated, moved. Revisit once locators exist and we can see how often
they resolve at all.

Design, and the correction to how W1 got promoted: `dev/researcher/w1-design.md`.

## [1.11.0] — 2026-08-09

**W2 — saturation to the stop decision (Seam 1).** The most-felt gap: on a live run the
agent stalls. `/research-cross-ref` computed saturation, `/research-check-gaps` owned the
stop, and the gap check never opened the saturation summary. So a question that was
*saturated* (the last discovery rounds returned confirmations of what was already there) and
*inadequate* (one independent Direct source) routed back to Collect — every run, forever.
Every skill did its job correctly at every step. The loop was the defect, and no gate could
see it, because each individual state was well-formed.

The fix is a precedence contract, not a merged score. Saturation and adequacy answer
different questions — "is more collecting going to change this?" and "is there enough here to
write from?" — and merging them fails in both directions. Merged one way, a lopsided
single-origin question gets promoted because nobody new showed up, which is how a project
closes on one interested source. Merged the other way, you get the stall back.

### Added

- **`research/reference/saturation.json`** — the machine-readable half of cross-ref's
  saturation verdict (new step 7a), per phase question, alongside the prose summary that
  stays the human working view. Two renderings of one judgment, never two judgments.
- **The precedence contract** in `/research-check-gaps` (new step 6h). Adequacy governs the
  stop: saturation never promotes a question to covered, never checks the `Collect` box,
  never advances `Cycle step`. Saturation governs the route inside the gaps-remain branch,
  where it decides whether "go collect more" is honest advice or a treadmill.
- **The collection-exhausted decision** (new step 7c) — the saturated-and-inadequate cell,
  which has no automatic answer. The skill reaches it, names it, enumerates three outcomes
  (accept the gap, re-scope the question, open a channel discovery never mapped), gives a
  recommendation with its reason, and stops. The contract binds the `gaps.md` entry and the
  user-facing turn, each carrying it in full. Accepted gaps (step 7b) are now reachable by
  computation instead of only when the commissioner volunteers.
- **A fourth cycle state** in step 8: *collection exhausted, decision pending* holds the
  phase at `Assess (3 of 5)` with `Next Action` naming the decision rather than a command.
  Advancing or rolling back would both answer on the commissioner's behalf, in opposite
  directions — which is why the stall previously had nowhere to live.
- **Synthesis pre-check 3a** — an unanswered collection decision blocks
  `/research-summarize-section`, the same way an unresolved core contradiction does. An
  *accepted* gap is an outcome and does not block; that is what acceptance is for.

### Changed

- **The gaps-remain rollback now unchecks `Connect`.** It means "cross-ref run,
  `cross-reference.md` current," and sending the phase back for more sources makes it not
  current. The previous text unchecked `Collect` and `Assess` and forgot `Connect`, leaving a
  finished Connect sitting above an unfinished Collect. Found by the eval harness's new
  `state_cycle_coherent` gate across iterations 20–22.
- **Saturation staleness is a first-class state.** An absent or stale record (sources
  processed since it was written) reads as *no reading available*, never as "not saturated."
  The turn says so rather than implying a reading was consulted.
- Cross-ref guardrail 8 keeps saturation non-blocking and adds what changed: not blocking is
  not the same as not consulted.
- `coverage-assessment-guide.md` — "When to Accept Gaps" records how its first condition now
  gets reached, and the standing limit: saturation supports "not found where we looked," never
  "does not exist."

### Fixed (found during verification, iterations 24–29)

- **Post-decision re-argument after `confirm: <side>`** — open since iteration 4 and not
  closed by the v1.10.0 attempt. The ban existed; it failed because a comparative restatement
  *is* forward-looking, so it read as the permitted "forward consequence." Now: state what the
  output will carry, never the comparison already made, and name the override once *inside*
  that sentence rather than appending it. If a clause would still work as an argument for the
  other side, it is one.
- **The cycle box and the `Cycle step` pointer are one write** — `cross-ref` step 10 and
  `summarize-section` step 10 each checked their box and left the pointer on it, so STATE said
  a step was both finished and current.
- **Classification is per question** — a note Direct for one question and Adjacent to another
  belongs in both places, not filed once under the one it fits best.
- Two defects in W2's own new wording, caught and fixed in the same pass: the stale-saturation
  disclosure did not bind the adequate-coverage branch, and the fix for that narrated file
  mechanics at the user instead of stating the substance.

### Verified

Iterations 24–29. **17 of 17 goldens pass**, with all seven noisy scenarios sampled 3× and
scored on the worst sample. Zero deterministic-gate failures and zero capture-integrity
failures across 43 runs.

Known and recorded, not fixed here: on one of three samples, `summarize-section` rendered a
note's "60–70% of teams report a reduction" as "a 60–70% reduction," and the same draft's
Methodology & Limitations claimed two independent sources for single-sourced findings. The
integrity agent cleared both. Traceability is not a critical dimension on that scenario so it
passes, but this is the note-fidelity seam (W1) showing up as observed rather than inferred.

Design and the three resolved author forks: `dev/researcher/w2-design.md`. Map updated in the
same change (`dev/researcher/ARCHITECTURE.md` — Seam 1 closed).

## [1.10.0] — 2026-08-06

**W6a/b — the prevention layer.** W7 (v1.8.0) built the authority that refuses completion
at the end. This release makes it rare that it has to, and closes the one thing an
end-of-project review structurally cannot reach: nothing checked the project's own
completion criteria until the very end, and nothing stopped a later phase from quietly
undoing a decision an earlier one recorded.

### Added

- **Decision ledger** (`research/reference/decision-ledger.md`) — an append-only record of
  the dispositions later work must honor: audit frame corrections, contradiction
  resolutions, accepted gaps, and commissioner directives. Each class is written by the
  skill that owns the decision, at the moment it is made. Supersession is a new entry
  citing the one it replaces; entries are never edited or deleted. Installed by
  `/research-init` on new projects, and created from the template on first use by any
  writing skill on projects that predate it — absence is never an error.

  Before this, every disposition lived somewhere that regenerates. Contradiction
  resolutions survived only while the contradiction did; accepted gaps survived by being
  re-recorded; audit corrections had no structured record at all. Enforcement against
  records that can silently vanish is not enforcement.

- **B13 — Disposition conformance**, in the audit battery. A claim that asserts a
  pre-correction frame, re-adopts the losing side of a resolved contradiction, claims
  coverage a ledgered acceptance concedes is missing, or contradicts a recorded directive
  — without a superseding record — is **Disposition reversal undisclosed** (high
  severity). The point is not to freeze decisions: new evidence can supersede any of them.
  The point is that reversing one silently becomes impossible. Reports name the reversal as
  a reversal and state the route to a legitimate supersession, on both the audit report and
  the turn.

- **Criteria preflight at final close.** Before a corpus review is ever suggested, the
  closeout self-assesses every `SC-N` with the artifact its disposition rests on. A plain
  unmet criterion ends the turn; an unmet-by-absence disposition says where it looked.
  Accepted-unmet requires the commissioner's recorded words, never the agent's inference,
  and a criterion naming a record the project should hold is unmet when the record is
  absent — a conditional over an empty set is not satisfaction.

- **Criteria trajectory in phase debriefs** (advisory) — any criterion this phase's work
  touched, so nobody meets the criteria for the first time at final close.

- **Settled-framing guard** at phase and project close: waivers, accepted gaps, and
  headline findings whose audit tier sits below the presented confidence travel with the
  report. "Validated" attests that the process ran, never that the findings are stronger
  than their evidence.

### Changed

- `research-summarize-section` reads the decision ledger before drafting, so conformance is
  the default rather than an audit catch.
- The adverse-search exit now presents its record as a record: attributed to the retrieval
  log, dated in the turn, with staleness stated and a re-run offered. A month-old logged
  search narrated as work just performed asks the commissioner to accept the wrong thing —
  recency is what decides whether "none found" still holds.
- After a commissioner resolves a contradiction, the turn states what was recorded and any
  forward consequence, and stops. Restating the case for the rejected side is argument
  wearing disclosure's clothes.
- `corpus-review-brief.md`: C3 reads the decision ledger as the primary disposition record
  when present, supplementing rather than replacing the reviewer's own sweep. Additive; no
  protocol version change.

### Verified

Eval iterations 21–23. Iteration 21 ran 16 captures and found **four red goldens** — two of
them these new mechanisms — and every fix that followed was to *how a result is reported*,
not to a detection mechanism. All four are green at iteration 23, including a
post-decision-re-argument defect open since iteration 4. Validator battery 74/74; contract
hash unchanged; deterministic gates clean throughout.

Known, recorded, not fixed here: the deterministic gate set cannot see a STATE write during
a write-free preflight, nor cycle-step/checkbox incoherence. Both are harness work.

## [1.9.0] — 2026-08-06

The headroom release. A full constraint audit (/upskill) of every instruction surface
sorted each rule by source — intent, method, contract, or capability workaround — and
removed only the last kind. The plugin's gates, evidence disciplines, and voice rules
are untouched; what's gone is the scaffolding that assumed a weaker model.

### Changed
- **All model pins removed** (ten skills, two agents). Every surface now runs on the
  session's model instead of overriding it; receipts and audit artifacts continue to
  record what actually ran.
- **`/research-init` rebuilt around your research challenge.** Instead of choosing from
  an 11-type menu, describe what you need to find out — init infers an internal research
  profile (types are routing metadata now), derives phases from the work rather than
  numeric type quotas, and proposes the plan for your review. Synthesis phases promise
  exactly the deliverables you commissioned — no mandated report trio. The
  audience-calibration anchors and the full context-management guidance are retained.
- **Scripted turns became content contracts.** Where skills used to dictate exact
  sentences (audit FAIL turns, waiver confirmations, the review runner's closing lines),
  they now state what a turn must convey and leave the words to the model — with the
  eval pack holding the substance floor. The register doctrine now covers
  summarize-section's output (the one surface the original register fix missed).
- Cross-reference checkpoint is uniformly **5 sources** everywhere, owned by the
  counter mechanism.
- Accepted gaps now have a home: acknowledge a gap once and `/research-check-gaps`
  records it (your words, dated) and stops re-flagging it as actionable while keeping
  it visible.
- The claim audit states its purpose (decision-readiness) and carries explicit
  High/Moderate/Low severity definitions.
- Trigger-text accuracy sweep: six wrapper/description pairs corrected (wrong
  filenames, a claimed write the skill never performs, missing tool declarations).

### Removed
- Blanket re-read-after-write rituals (incident-backed verifications — machine-parsed
  JSON checks, the waiver's three-loci confirmation — remain).
- The expert-persona line in the integrity agent; the plan-generation subagent option
  (plan generation is inline on all surfaces).

### Verified
- Regression net: six goldens green (three multi-sampled 3×), two contract smokes, all
  deterministic gates passing; judges reported no substance drift and, in places,
  measurable improvement over the scripted forms. Full record in the eval pack's
  iteration-20 scorecards. `/research-init` has no runtime eval scenario yet — its
  rebuild ships behaviorally unverified pending one.

## [1.8.0] — 2026-08-06

The credibility-gate release (W7). A completed project used to be whatever STATE.md said it
was — every per-claim gate could pass while the corpus as a whole wasn't decision-ready.
Now completion is earned: an independent adversarial review reads the entire corpus against
the project's own success criteria, and a deterministic validator — not the agent, not the
conversation — owns the completion verdict.

### Added
- `/research-review-corpus` — the review runner: dual reviewer tiers (Codex CLI as an
  independent cross-family sampler; a cold in-plugin `corpus-reviewer` agent as an isolated
  same-family sampler), a fixed C1–C15 review battery with per-check required evidence and
  honest coverage discipline, immutable receipts and reports under `research/reviews/`,
  failed attempts recorded as failed attempts — never receipts.
- `reference/corpus-review-protocol.md` (frozen protocol v1) and
  `reference/validate-corpus-review.py` — canonical corpus manifest and hashes, receipt and
  ledger schemas, commissioner exceptions with validator-owned waivability, the exact
  allowed STATE transition, post-close seals, distinct exit codes, and a 74-case embedded
  self-test. The shipped trust contract pins the validator's hash.
- Project completion now runs through the validator: `audit-claims`' final-phase closeout is
  a three-stage sequence (read-only preflight, gate verdict, `transition --apply` as the
  only completion writer), with a mutation-free re-entry after the review runs. Projects
  that cannot obtain a review can close only as a visibly-marked unreviewed archive.
- Sentinel-as-claim readers: `progress` and `start-phase` validate any completion claim via
  `check-completion` and report what the validator says — a stale or unbacked completion is
  reported as exactly that, and drifted archives are never quietly "archived".
- `init` installs the protocol kit (validator, marker, STATE discriminator, stable-ID
  completion criteria, reviews/ scaffold) on new projects; existing projects adopt with
  `/research-init upgrade` (content untouched; pre-existing review receipts handled
  honestly).

### Changed
- Research plans now carry stable-ID (`SC-N`) success criteria, generated from a canonical
  `completion-criteria.md` the review binds to; drift between the two blocks the gate.
- Manual completion instructions everywhere (STATE template, project CLAUDE.md, discover's
  recovery menu) are scoped to non-final phases.
- `tools-guide.md` documents the optional Codex CLI tier; `workflow-ownership.md` adds
  material corpus findings to the stop list.

### Migration
- Existing projects keep pre-W7 behavior with a visible "no credibility gate" notice at
  closeout until upgraded via `/research-init upgrade`. Un-upgraded projects cannot claim
  the validated completion state.

## [1.7.0] — 2026-08-05

The audit-battery release. The claim audit now runs a fixed, enumerated check battery on every pass instead of an improvised set — which stops the "one draft audited three times" pattern — plus three fixes to places where a skill's own generated docs contradicted what the skill does.

**Why the battery.** Diagnosed from a live 9-phase project (15 audit reports): the audit's pass criteria were exact, but its check *procedure* was a list of questions, so the auditor ran a different set of checks each pass — figures on pass one, structure on pass two, quotations on pass three — and kept discovering defects that were there all along. Enumerating the battery (the same checks, every pass, each reported) collapses the serial re-discovery into one pass.

**Verification is structural, said honestly.** The plugin passes validation and the drift lint. The eval golden set is single-turn and cannot exercise a multi-pass audit, so the battery's real proof is a live audit run — not yet done.

**Upgrade note:** the battery and the routing fix are skill-level and apply as soon as you update the plugin — no re-init needed. The two documentation fixes live in the project scaffold, so they only affect newly initialized projects; existing projects are unaffected in behavior.

### Added

- **An enumerated audit check battery (B1–B12).** `research-audit-claims` now runs a fixed battery in full on every pass — first audit and every re-audit — each item reported in a new `Checks run this pass` section. New checks: quotation integrity with a self-sourced-quote flag (catches the research quoting its own prose back as a citation), derived-figure labelling, section cross-reference resolution, **plan-requirement conformance** (the only check that finds *absent* required content, since an unwritten component has no claim to trace), constructed-bracket, and internal-table consistency (a summary claim that is false by its own table). Canonical-figure matching now checks units and qualifiers, not just value; the regression sweep now re-scans the whole document.
- **A fix-hygiene rule.** A mechanical fix may not split a sentence or orphan the clause it interrupts; if the only clean insertion point would, the fix is a judgment call and is handed back.

### Fixed

- **Three contradictions between skills and their own generated docs.** The scaffold claimed the integrity agent runs automatically after every source note (it runs on drafts and source-material integration, not per note); it claimed nothing reads `commonplace.md` except the user (`/research-start-phase` reads it to re-adopt in-flight thinking across a context clear); and `/research-check-gaps` routed `Evidence Against` questions to discovery, though more sources cannot resolve a contradiction — they now route to synthesis, where the commissioner addresses it in the draft.

## [1.6.0] — 2026-08-05

The workflow-ownership release. It fixes the two things that made the research assistant tiring to run over long, multi-day projects: it stopped to ask for input it didn't need, and it lost its place in the protocol after any deep conversation. Alongside that, a batch of correctness fixes and a readability pass on how the assistant talks.

**Verification is staged and structural, said honestly.** The batch-flow behavior was exercised by a staged runner against the skills (no per-source hand-back, cross-ref auto-ran at the checkpoint, the re-anchor reflex fired after a mid-batch tangent, STATE stayed truthful), and the plugin passes validation and the drift lint. But **no real interactive project has run these skills end to end** — that live run is still the gold standard. The Cowork project-local-script path has strong indirect evidence but is not confirmed by a live Cowork run.

**Upgrade note:** existing research projects must **re-init** to pick up the position helper (`research/bin/where-am-i.py`) and the CLAUDE.md doctrine pointers. Projects that don't re-init degrade correctly — the helper refuses to guess and defers to the maintained `Next Action` — but the re-anchor reflex won't be loaded.

### Added

- **Workflow-ownership doctrine + a position helper.** `reference/workflow-ownership.md` governs staying anchored to the protocol across long, interrupted work. `where-am-i.py` — installed into each project's `research/bin/` by init — computes the current position (phase, cycle step, next unprocessed source, counters) from the files, so after a deep tangent the agent re-anchors by reading the files instead of inferring the next step from the conversation. init adds a `## Workflow Ownership` CLAUDE.md pointer beside the posture one.
- **A live batch ledger.** The candidates file now tracks disposition: `process-source` marks each processed candidate `[PROCESSED]` (a status the taxonomy already reserved but never wired), so "next source = first pending candidate" is derivable exactly rather than inferred. Notes gain a machine-readable `Source URL:` line as a stable identity.
- **Plugin-level voice doctrine.** `posture-register.md` rewritten as a full voice/response doctrine with a worked-example gallery covering how to sound, when to grade a hunch, and what stays backstage.
- **`Clarity` eval dimension** (`eval/targets/researcher/`, marketplace-internal). Scores whether a response is one-pass readable — with anchors for reread cost, undefined internal jargon, and over- versus under-formatting.

### Changed

- **The pipeline stops only when it needs you.** Once you approve a batch, a clean source completion is a status line, not a question; cross-reference and the gap check run automatically at their triggers with a one-line heads-up; the per-source hand-back that forced a "keep going" after every source is gone. The stop list is now explicit and short: which sources to process, source curation, a material contradiction, a waiver, a real access failure, a genuine strategic fork, and promotion to `outputs/`. Everything else proceeds.
- **Contradictions carry a materiality threshold.** A disagreement whose resolution changes no finding is auto-resolved and reported in one line, with the losing value preserved on the record; only a material contradiction — one that would move a finding — stops for your call.
- **Waiver scope.** A waiver covers every open finding on the claim it names. The agent no longer subdivides the commissioner's decision, leaving a draft blocked on a second violation of a claim the commissioner already chose to carry.
- **Coverage adequacy weighs perspective, not just count.** Two sources from one vendor no longer clear the adequacy gate — they are one point of view, however many of them there are.
- **Slash-command references corrected.** Every user-facing reference now points at the `/research-*` (hyphen) commands that actually resolve; the `/research:*` colon form could never resolve, since the plugin is named `researcher`, not `research`.

### Fixed

- **STATE.md stays truthful across a run.** cross-ref and check-gaps now write a fresh, specific `Next Action` instead of leaving it pointing at the step that just ran; the Collect/Connect/Assess cycle boxes have explicit owners and are reconciled to the coverage verdict (no more `Collect [x]` sitting next to a `Next Action` that says "go find more sources"); `process-source` keeps all three source counters in sync.
- **Auto-re-audit, narrowed.** An audit that fails on citation-level fixes re-runs itself once; the moment a fix changes a figure, range, qualifier, or claim, the re-run is handed back so you see the change before it can promote.
- **audit-claims no longer leaks its internal vocabulary.** The mechanical/judgment fix triage stays backstage; the user-facing wording names what changed, not which bucket it fell in.

### Known limitations (unchanged or newly recorded)

- **Not live-tested** (see the verification note above).
- **The self-reported-flag determinism hazard** in the `audience-standard-waiver` scenario is unresolved: the same seeded standard reads two defensible ways across runs. It is a seeded-standard decision, not a code fix.
- **The per-skill Register blocks remain.** The attempt to have the plugin-level voice doctrine fully replace them was not proven and is parked; the doctrine and the blocks currently both operate.

## [1.5.0] — 2026-07-12

The convergence release: delivery-integrity, record-never-restrict, and honesty fixes from the 2026-07 blind review (9/9 findings citation-verified) and the convergence re-audit, plus the researcher eval target pack. Every behavioral change in this release is **SHIPPED-UNTESTED** per the marketplace's pattern-graduation rule — encoded from verified findings, not yet exercised in a live research project.

**What this release deliberately does NOT include, said honestly:** the plugin's two biggest open items ship later. The **evidence architecture** (immutable source snapshots, passage locators, note-against-snapshot verification — the blind review's Critical finding that the audit chain stops at AI-authored notes) is commissioned as its own design session (Decision B1) and lands in a future release; nothing here pretends to fix it, and the marketing copy has been softened accordingly (Decision C1: "audits every claim back to its source note — and every note to a declared source"). The **turn-level posture & register port** (Decision D1) is drafted and parked in the owner's review queue pending voice review — not shipped here.

### Added

- **Deliverable manifest — phases close against the whole contract** (blind F4). `/research:audit-claims` now reads the plan's promised output inventory before any closeout; a passing audit on one file cannot close a phase (or the project) that promised several deliverables. The final-phase branch requires every promised deliverable in `outputs/` with a passing audit.
- **Audience evidence standard enforced at the promotion gate** (blind F2, Decision D2). `/research:init` compiles the audience answer into `research/reference/evidence-standard.md` with enforceable rules; `/research:audit-claims` fails violating claims by default. The only other exit is a named waiver in the user's own words (`waive: <claim> — <rationale>`), recorded in the audit report and gate-log and inserted verbatim into the output's Methodology & Limitations. This deliberately narrows the "do not use confidence tier as a reason to fail" rule: the user's own commissioned standard is now enforced; the tier stays advisory for everything the standard doesn't name.
- **Source-exclusion ledger** (blind F3, contract invariant 11). Every candidate the user explicitly declines — during discovery batch selection, mid-batch, or at an access failure — is recorded with a verbatim reason in `research/discovery/exclusions.md`. `/research:check-gaps` and `/research:cross-ref` read it: excluded candidates appear beside the questions they addressed, and convergence reported on a curated evidence base says so. Record, never restrict — no exclusion is ever contested.
- **Counter-evidence gate valve** (blind F7). The gate now has an honest second exit: a documented adverse search (real queries, channels, dates) plus explicit user acknowledgment satisfies it, writes `research/discovery/negative-searches.md`, and stamps the output "no credible counter-evidence found after documented search." "Named, searched, none found" is a legitimate recorded outcome; manufacturing a challenger remains forbidden.
- **Commissioner-override disclosure downstream** (blind F6). A `user_override=true` contradiction resolution must be visibly labeled in the draft at the finding site and listed in Methodology & Limitations; `/research:audit-claims` fails a draft that presents an overridden resolution as evidence-driven (new high-severity class: Override undisclosed).
- **Methodology & Limitations section required in every draft.** Purposive-sampling disclosure, single-source findings, labeled commissioner overrides, counter-evidence status, and audit-time waivers — the deliverable now carries its own honesty record.
- **Mid-source interruption recovery branch** (blind F8). `process-source` handles the note-exists/registry-row-missing state: backfill the registry from the note, increment counters once with verification, never re-fetch.
- **Independence defaults to unknown** (blind F9). "Origin unclear" sources never count as independent corroboration; shared-wording/shared-figure heuristics demote matching sources to suspected shared-origin clusters at Echo level in `/research:cross-ref`, and `/research:check-gaps` flags questions whose coverage rests on independence-unknown sources.
- **Real-person protection for Person Research + Customer Safari** (Brand Compass 4.2.0 consent-doctrine port, Decision D3). Real specificity, not real identity: non-subject individuals are anonymized in drafts and outputs unless permission is on record; `summarize-section` defaults to anonymize and `audit-claims` fails identity exposure. The fail direction is over-anonymization.
- **Mid-phase session debrief** (Backstage element 6). Contact boundaries mid-phase now capture a Working Read entry to `commonplace.md` (in-flight hypotheses, half-formed reads) before any recommended clear; `start-phase` silently re-adopts them on return.
- **Backstage tasks** (Backstage element 7). `research/reference/backstage-tasks.md` — the agent's private prep queue, written at phase close and by cross-ref's suspected-cluster heuristics, worked through silently by `start-phase`.
- **Researcher eval target pack** (`eval/targets/researcher/` — marketplace-internal, not shipped in the plugin). Adapter, principles, gates, coverage map, and 9 scenarios seeded from the blind review's confirm/refute tests (7 adversarial goldens + 2 representative). Scaffolded from the strategist pack's shape (the goal-setting scaffold was not yet available). Rubric scoring anchors were drafted at a STOP point and **approved by the owner 2026-07-12** — the pack is fully runnable (`/eval-run --target researcher`); its 9 goldens are the regression tripwires for this release's fixes.

### Changed

- **D3 method softenings.** Coverage guide: gaps are acceptable when sources were "not found via the mapped discovery channels" — purposive sampling can never establish "does not exist." Academic discovery: the citation-count floor is a per-run choice with a default (>10 for established topics; dropped in favor of recency for emerging topics), stated per run and recorded in the retrieval log.
- **Marketing copy softened (Decision C1).** plugin.json, the marketplace catalog entry, and both READMEs now promise "audits every claim back to its source note — and every note to a declared source." The stronger claim returns when the B1 evidence architecture ships.
- **`start-phase` declares its real write surface** — frontmatter allowed-tools now includes Edit/Write (it always wrote the Phase Tier Record; it now also checks off backstage tasks).

### Fixed

- **Progress health-check contract mismatch** (re-audit finding; checklist row 2). `/research:progress` checked `.claude/settings.json` for separate Write/Edit hook matchers and STATE.md for YAML frontmatter — neither of which the plugin ships — producing false failures on every real project. The checks now read the deployment that actually exists: the plugin's `hooks.json` (combined `Write|Edit|MultiEdit` matcher), the init-written permissions pre-allow, and STATE.md's real sections (Current Position / Current Phase Cycle).

### Pass-2 re-attack repairs (same release window, pre-publication)

Before this version was tagged or merged, the disclosed external re-attack (pass 2 of the review protocol) graded the repairs: 3 CLOSED, 3 PARTIAL, 2 OPEN. All five actionable verdicts were verified against the files and repaired in the same release — v1.5.0 was never published, so the version stands. Full triage: `dev/blind-reviews/researcher-pass2-2026-07.md`.

- **Unselected candidates are no longer invisible (pass-2 F3, OPEN → repaired).** The exclusion ledger only caught explicit declines; a `top 5` reply stranded adverse candidates with no trace. `check-gaps` now computes a disposition (processed / excluded / unprocessed) for every discovered candidate and surfaces unprocessed counter-suggesting candidates per question; `cross-ref` reads the unselected remainder beside its convergence patterns.
- **`user_override` is now derived, never keyword-triggered (pass-2 F6, OPEN → repaired).** `confirm: side-A` against a side-B assessment previously set no flag, and every disclosure keyed on the flag. Resolution records now carry `suggested_resolution` + `user_resolution` + `rationale`, with `user_override` computed from the fields differing; synthesis and audit compare the fields and treat the boolean as corroborating only.
- **Methodology & Limitations became a structural audit gate (pass-2 shared seam behind F5 and F7, PARTIAL → repaired).** The section was required of the writer but never checked by the audit. `audit-claims` step 5b now fails drafts missing the section, the sampling disclosure, or an adverse-search stamp whose `negative-searches.md` record doesn't exist (new high-severity class: Methodology omission).
- **Saturation is computed over independent origins (pass-2 F9, PARTIAL → repaired).** The confirmatory ratio previously counted raw repeats, letting one file say "Echo — one data point" and "100% confirmatory, evidence converging" about the same sources. Saturation now collapses confirmed and suspected shared-origin clusters, gives unknown-origin repeats no confirmation credit, and reports high-repetition/low-independence as exactly that.
- **Two pass-2 bypass goldens added to the eval pack:** `adv-unselected-invisible` and `adv-confirm-side-override`.

### Eval iteration-1 repairs (same release window, pre-publication)

The golden set was run before this version was tagged or merged: 23 runs, zero deterministic gate failures, 5 PASS / 2 FAIL / 2 invalid-as-seeded. One of the two red goldens was a real plugin defect and is repaired here; v1.5.0 was never published, so the version stands. Scorecard: `eval/targets/researcher/_eval/iteration-1/scores.md`.

- **A granted waiver is recorded when it is granted (red golden `adv-audience-standard-waiver`).** The waiver protocol described recording as part of the promotion path, and a waiver almost never arrives during an audit — it arrives as a bare message *after* a failed one. With no branch for that, one run in three accepted a valid waiver, correctly scoped it, correctly declined to auto-re-run, and then wrote it nowhere: the draft's Methodology & Limitations still read "Waivers: none," and the audit report and gate-log were silent. The user's exercise of control left no trace on disk. `audit-claims` now carries an explicit **"Waiver Arriving Between Audits"** branch: validate the waiver (user's own rationale, naming a real finding on record), scope it to what the rationale actually covers, and record it immediately in all three loci — draft M&L verbatim, audit report `## Waivers` section, and a gate-log `waived` row (never `pass` — a waiver authorizes no promotion by itself). Promotion still waits for the user-invoked re-audit; recording is not re-auditing. A new step 4b makes re-audits read standing waivers so a recorded waiver is honored rather than re-failed, and only audience-standard violations are waivable — evidence-accuracy findings have no waiver exit.
- **Waiver golden re-run green (iteration-2, 3 samples).** The repaired branch was re-tested against the golden that caught the defect: 3/3 PASS, both critical dimensions (Standard Enforcement, Record-Never-Restrict) at 3 in every sample, each judge verifying the waiver against the artifacts on disk rather than the runner's claims. Record-Never-Restrict went 0 → 3; Standard Enforcement's cap came off (2 → 3). Scorecard: `_eval/iteration-2/scores.md`. Register scored 0–1 in all three samples — the D1 gap, unchanged and still measured.
- **Two audit-claims copy repairs** (surfaced independently by all three iteration-2 judges; both made the agent say something untrue). The FAIL branch's closer was unconditionally "Fixes applied. Re-run…" even when zero mechanical fixes existed — which is always the case for a pure judgment finding like an audience-standard violation, so the run contradicted itself. It is now conditional on what actually happened. And the audit-report path spec read literally as `04-test-section.md-audit.md`; every run quietly wrote the sensible `04-test-section-audit.md` instead, so spec and behavior had drifted. The spec now says `<basename>` with the extension stripped. Both landed after the iteration-2 captures and are unexercised by that run.
- **Doctrine-drift lint config shipped** (`dev/scripts/drift-configs/researcher.json`). The shared lint landed after v1.5.0 was built; the deferral reason no longer holds. Eight stale-phrase guards (the narrowed confidence-tier rule, waiver-at-promotion, both F9 independence reversions, the pre-valve counter-evidence hard block, raw-repeat saturation, keyword-set `user_override`, and the progress health-check's phantom `.claude/settings.json` contract), nine reader/writer contracts (gate-log, evidence standard, waiver format, exclusion ledger, negative-search record, backstage queue, derived-override fields, the M&L writer/gate seam, and the "Origin unclear" independence token), and presence pins on the C1 softened copy across all four surfaces. Runs clean; verified to go red on reverts of the waiver branch, the F9 qualifier, and the C1 copy.

### Known limitations in this release (read before you rely on it)

Two conversational defects ship with 1.5.0. Neither touches evidence integrity — the audit gate, sourcing, traceability, and independence machinery scored full marks across every eval iteration (23/23 deterministic gates green, four runs running). These are about how the plugin *talks*, and they are fixed in the next patch.

1. **It can get preachy after you make a call.** When you decline a source or override a contradiction resolution, the plugin records your decision correctly and verbatim — but the conversation may then question your stated reason ("if it's out on credibility grounds rather than on what it found…") or ask which project you *really* want to run. Your decision always stands and is always recorded; the record is never restricted. But the tone can read as second-guessing you after the fact, which is not what it should do. If it happens, it is a known bug, not a judgment about your choice.
2. **A failed audit may use internal vocabulary.** On a failing audit, the turn can surface the plugin's own mechanical/judgment distinction ("No mechanical fixes to apply") — internal shorthand that means nothing to you. Harmless, just noise.

### Register work (same release window)

- **D1 register port shipped** (`researcher/reference/posture-register.md` + a pointer-only `## Working Posture` section in init's CLAUDE.md template + a silent register self-check in the phase debrief). Ported from Brand Compass v4.4.0, adapted to research voice: pushback targets premature certainty and preferred-conclusion steering.
- **Every skill that composes a user-facing turn now points at the doctrine from its Output section and names what stays backstage.** The doctrine alone was not enough: eval iteration-3 measured Register 0 in 15 of 23 runs because the skills' own Output templates *instructed* the narration a doctrine file cannot override. The control run proved the mechanism — the one skill left un-rewritten leaks on precisely the rule the doctrine forbids without modelling.
- **Result:** machinery narration is fixed. `adv-independence-unknown` (red since iteration-1) scores Register 3/3/3; `adv-override-disclosure` and `adv-unselected-invisible` went 0/0/0 → 3/3.
- **Two known open defects, honestly stated — this work is NOT finished:**
  1. The doctrine's **preferred-conclusion-steering** rule fires *after* a user's decision and relitigates it. Two goldens (`adv-exclusion-visibility`, `adv-confirm-side-override`) now fail Record-Never-Restrict: the record is clean but the *conversation* contests the user's stated reason. Pushback belongs before a decision; after one, the turn states the consequence and stops. Fix pending.
  2. `audit-claims` contradicts itself — the Output section forbids the mechanical/judgment taxonomy as user vocabulary while the FAIL-branch closer prescribes it verbatim. And `process-source`'s recovery branch was over-tightened into a bare receipt that tells the user nothing about the source. Both fixes pending.
- Full measurement: `eval/targets/researcher/_eval/iteration-4/scores.md`.

### Deferred (named, with reasons)

- **Evidence architecture (blind F1, Critical)** — commissioned separately (Decision B1); researcher is the reference implementation and its release follows the design session. The permitted precursor (process-source persisting raw extractions) was NOT taken: it is not trivially separable from the current fetch flow, and a half-measure would prejudge B1's snapshot format.
- **D1 register port** — drafted in full (posture doctrine + debrief register check + wiring plan), parked in the review queue for voice review. STOP point honored; nothing shipped.
- ~~**Doctrine-drift lint config**~~ — no longer deferred: the shared lint landed and researcher's config shipped in this release window (see Eval iteration-1 repairs). No canon pairs — researcher ships no copies of external canonical framework docs, so that check is not configured.
- **Full PRISMA machinery** — deferred by decision (G1); not built.

## [1.4.1] — 2026-06-08

A structural fix so the plugin works in Cowork as well as Claude Code. The eleven `/research:*` entry points were previously authored as skills living under `commands/research/<name>/SKILL.md`. Claude Code (which also surfaces skills) found them; Cowork (which discovers commands from flat `commands/*.md` files) found nothing, so no slash commands appeared. v1.4.1 splits each entry point into a model-invokable skill plus a slash-command wrapper, matching the pattern used by `sage` and `intelligence-briefing`.

### Changed

- **`commands/research/<name>/SKILL.md` moved to `skills/research-<name>/SKILL.md`.** Each skill's frontmatter `name` was rewritten from the bare verb (e.g. `init`) to the prefixed form (e.g. `research-init`), so they surface as `researcher:research-init`, `researcher:research-discover`, and so on. Skill bodies are unchanged. `research-init` retains its `disable-model-invocation: true` flag (it's destructive); the other ten remain auto-invokable.
- **New `commands/research/<name>.md` wrappers.** Eleven thin slash-command wrappers, one per skill, that delegate to the matching skill. Pattern matches `sage/commands/sage-run.md`. `/research:init`, `/research:discover`, `/research:process-source`, `/research:phase-insight`, `/research:check-gaps`, `/research:cross-ref`, `/research:start-phase`, `/research:progress`, `/research:summarize-section`, `/research:audit-claims`, `/research:graph-analysis` now resolve as real commands in both Cowork and Claude Code.

### Fixed

- **Slash commands now appear in Cowork.** Previously, none of the `/research:*` commands showed up in Cowork because no `commands/*.md` files existed — the directory contained skill bundles instead.

## [1.4.0] — 2026-06-07

Four behavioral rewrites that close out assumptions still living in v1.3.x. v1.4 makes init work in any fresh folder, adds a hook backstop on the audit gate, surfaces per-phase discovery quality, and runs plan generation in the main agent's context.

### Added

- **PreToolUse hook gate on `research/outputs/`.** A new `hooks/gate-outputs.sh` script blocks Write/Edit/MultiEdit operations targeting the output directory unless `/research:audit-claims` has appended a `pass` row to `research/audits/gate-log.md` within the last 120 seconds and the row's file path matches the write target. Claude Code only; the hook is inert in Cowork (the structural workflow rule remains).
- **PreCompact staleness check.** A new `hooks/state-staleness-check.sh` script warns to stderr when `research/STATE.md` is more than 5 minutes older than the most recent file in `research/notes/` or `research/drafts/`. Never blocks compaction.
- **Per-entry `tier` field in `research/reference/retrieval-log.json`.** Records which discovery tier (1 = Tavily, 2 = Firecrawl, 3 = built-in) actually returned results for each channel-tool execution. Complementary to the existing `degraded_to` field, which records the fallback chain.
- **Tier-3 banner in candidate files.** `/research:discover` prepends a warning banner above the Summary table when every entry in a run fell back to built-in WebSearch/WebFetch.
- **`## Phase Tier Record` table in `research/STATE.md`.** `/research:start-phase` writes (or updates) a row per phase showing the highest discovery tier that returned results for that phase. `/research:progress` surfaces the table verbatim.
- **`research/outputs/.gate-policy.md`** — a human-readable note about the gate, written by `/research:init` at scaffold time.
- **Fresh-project guard in `/research:init`.** A new Step 0 refuses to run when `research/STATE.md` already exists, and tells the user how to start over (`mv research research.old` or `rm -rf research`).

### Changed

- **`/research:init` Step 3 creates the directory tree.** No longer assumes `research/` and `source-material/` already exist from a clone. Init writes a `.gitkeep` into each leaf directory via the Write tool, rooted at `${CLAUDE_PROJECT_DIR}`.
- **`/research:init` Step 3b writes `.claude/settings.json`.** Pre-allows the tools researcher uses (`WebSearch`, `WebFetch`, `Read`, `Write`, `Edit`, `Grep`, `Glob`, `Bash(tvly:*)`, `Bash(npx:*)`, `Bash(ls:*)`, `Bash(mv:*)`). Additive merge — never overwrites an existing config.
- **`/research:init` Step 4 plan generation runs inline.** Default execution moves from a `general-purpose` subagent invocation to the main agent's own context. Subagent delegation is now an opt-in Claude Code optimization. Cowork is fully supported on the default path.
- **`/research:init` Step 5 writes use `${CLAUDE_PROJECT_DIR}/research/...` paths** instead of bare `research/...`, making the skill cwd-independent.
- **`/research:audit-claims` appends a gate-log row before promoting a draft.** The PreToolUse hook reads this row to authorize the write to `outputs/`. The row is the durable audit record of the promotion authorization regardless of which tool performs the move.
- **`/research:progress` glob tightened.** The discovery-strategy check (1e) now looks for `research/discovery/strategy.md` specifically (the canonical path written by `/research:init`), replacing the loose `research/discovery-strategy*.md` OR `research/discovery/*.md` pattern.
- **README "hard gate" language softened.** Now reads "a workflow gate — with a PreToolUse hook backstop on Claude Code — that prevents unaudited content from reaching the output directory." Honest about the Claude-Code-vs-Cowork distinction.

### Fixed

- `/research:init` no longer fails silently in a fresh marketplace-installed project. The clone-rooted Step 3 assumption ("directory structure already exists from the clone") is gone.

### Known limitations (deferred)

- Plugin-defined subagent behavior in Cowork is still unverified. Inline-first plan generation works on both surfaces; whether Cowork honors `subagent_type: "research-integrity"` against the plugin's own agents is a separate question with a dedicated post-v1.4 test.

## [1.3.1] — 2026-06-07

### Fixed

- `/research:init` now explicitly instructs the model to present Question 1's 11 research types (and Question 3's 6 audience examples) as plain text in the reply, not via `AskUserQuestion`. `AskUserQuestion` caps at 4 options and was silently truncating the list — making 7 of the 11 research types unreachable through the picker. This is a quick fix; Question 1's broader UX (e.g., leading with "describe what you're trying to research" instead of presenting the full type list up front) is on the v1.4 init-rework agenda.

## [1.3.0] — 2026-06-07

### Changed

- **First Kenzie Creative marketplace release.** Migrated from a clone-and-use repo (`github.com/kenziecreative/research-agent`) to a plugin (`researcher@kenzie-creative`). Logic and knowledge base now ship from the plugin and update in place; per-project state continues to live under `${CLAUDE_PROJECT_DIR}/research/` exactly as before. One install, many projects, in-flight updates.
- Internal reference paths repointed from `.claude/reference/...` to `${CLAUDE_PLUGIN_ROOT}/reference/...`. Read-only knowledge base lives in the installed plugin; per-project state stays project-local.

### Carried forward from v1.3 (pre-marketplace)

- **CLI-first tool architecture.** 3-tier CLI fallback chain (Tavily CLI → Firecrawl CLI → built-in WebSearch/WebFetch). CLIs return structured JSON; local PDFs go through `pdftotext`. Works out of the box with zero CLIs installed.
- **Claim graph.** Every factual claim is a node with edges to source notes and canonical figures. Figure revisions trace downstream drift.
- **Academic expansion.** Discovery now queries Crossref and Unpaywall alongside OpenAlex.
- **Web search diversity.** Exa neural search runs parallel to Tavily; results deduplicated.
- **Per-claim confidence.** Each claim gets its own confidence tier; section confidence equals the weakest claim.
- **Retrieval provenance.** Every discovery call is logged with query, channel, and URLs returned.
- **CLI polish.** All commands use consistent formatting, clear next-action guidance, plain language, and progressive disclosure.

### Known limitations in v1.3.0 (resolved in v1.4)

- `/research:init` retains some clone-rooted directory assumptions from the pre-marketplace era. Users may need to pre-create `research/` and `source-material/` in a fresh project. Fixed in v1.4.
- Hard hook gate to block unaudited writes to `research/outputs/` is not yet bundled — the gate is enforced by structural workflow rules only. v1.4 adds the hook backstop for Claude Code.
- Cowork is not yet a supported runtime; init's plan-generation step still relies on a subagent that requires Claude Code. v1.4 makes plan-gen inline-first and adds Cowork support.
- The clone→plugin migration path for existing users is documented in v1.4.
