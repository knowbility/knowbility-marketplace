---
name: research-check-gaps
description: This skill should be used when the user asks where the research is thin, what's missing, or what to chase next across the whole project (e.g. "where are the gaps", "what's not covered yet", "what should I research next"). Walks every phase, cross-references questions against processed sources, and updates research/gaps.md with covered, thin, and unaddressed areas.
---

# /know-research:check-gaps

Assess research coverage against the research plan and identify what's missing.

## Process

1. **Read `research/research-plan.md`** for the full list of phases and questions.
2. **Read all files in `research/notes/`** to understand what's been covered. For each source note, extract:
   - The origin_chain field (primary vs. secondary, cited originals)
   - The specific claims, data points, and arguments the source provides
3. **Read `research/outputs/`** for any completed phase outputs.
4. **Read `${CLAUDE_PLUGIN_ROOT}/reference/coverage-assessment-guide.md`** for match classification criteria (Direct/Adjacent/Contradicts/None), source independence rules, and coverage status definitions.
4a. **Read the saturation record — `research/reference/saturation.json`.** `/know-research:cross-ref` writes it (its step 7a): per phase question, whether the evidence has stopped changing. It answers a different question from the one this skill answers, and the difference is the whole point of reading it:

   - **Adequacy** — is there enough here to write from? Counted over independent Direct sources. **This skill's question.**
   - **Saturation** — is collecting more going to change that? Counted over independent origin clusters. **Cross-ref's question.**

   A question can be fully saturated and still badly under-evidenced. Saturation never promotes a question to adequate coverage, never checks the `Collect` box, never advances `Cycle step`. It is read for one purpose: to tell a real gap from a treadmill when this skill is about to send the phase back to collect more.

   **Classify the record before you use it, and treat unusable as unavailable — never as "not saturated."** It is **current** when it names the active phase and `Sources since last cross-reference` in STATE.md is 0. It is **stale** when sources have been processed since it was written (the STATE counter is above zero). It is **absent** in two different situations that matter later: cross-ref has run but wrote no record (an older project from before this record existed — the counter is zero and a last-cross-reference date exists), or cross-ref has not run on this phase at all. All three mean the same thing for *routing*: you have no saturation reading. They mean three different things for what you **say**, so keep them apart — see the disclosure below. Route every under-covered question the ordinary way — collect more — because that is what this skill did before any saturation record existed.

   **Disclose it whenever the reading is stale or absent. This is unconditional.** It holds no matter what the coverage assessment later turns out to be — adequate, short, or mixed — and no matter whether the missing reading would have changed any routing. It is not a clause attached to the under-covered branch; it is a standing disclosure about the state of the project's own records, and the commissioner is entitled to it in every case.

   **This contract binds two surfaces and each carries it in full: `research/gaps.md` and the user-facing turn.** Neither is a summary of the other, and neither is the "real" one — the same rule step 7c applies to the collection-exhausted decision, for the same reason. In `gaps.md` it is a `**Saturation reading:**` line directly under the Coverage Dashboard. Observed: a run put the caveat in its turn alone and wrote a `gaps.md` closing "None — every question in the active phase meets the coverage bar", with the saturation reading unmentioned anywhere in the file. The turn is spoken once and scrolls away; `gaps.md` is what the next person opens, and it said coverage was settled. A disclosure that lives only in conversation has not been recorded, and the next reader — including the next run of this skill — inherits a file that reads clean.

   **One sentence, in substance, with no machinery in it** — this disclosure is subject to posture rule 7 exactly like every other write this skill performs. Say the fact and its consequence for them, in the wording that matches the cause (below). Do not name `saturation.json`, `STATE.md`, or `cross-reference.md`; do not explain which command writes which file; do not narrate your own routing ("so I'm routing this the ordinary way"). The commissioner needs the fact and its consequence, not the plumbing that produced it.

   **Say the sentence that matches the cause. There are three, and they are not interchangeable.** Step 4a already told them apart — stale, absent-with-a-prior-cross-ref, absent-entirely — and the disclosure has to keep them apart, because each one points the commissioner somewhere different.

   - **Stale** (sources processed since the record was written — the STATE counter is above zero): "Three sources have landed since the last cross-reference, so I can't tell you yet whether more searching would still turn anything up. Re-running it would answer that." **Give the actual count** — read it from the STATE counter and say it. An earlier draft of this line said "a few sources behind", and vagueness was the wrong lesson to draw from the no-machinery rule: naming `saturation.json` is plumbing, but *how far behind the record is* is a fact about their project and the one input that tells them whether re-running matters. Strip the mechanism, keep the substance.
   - **Absent, but a cross-reference has run** (the counter is zero and there is a last-cross-reference date — an older project from before this record existed): one clause, not a warning. "This project doesn't carry a saturation read yet; the next cross-reference will add one." Do not tell them the cross-reference is out of date — it is not, and saying so invents a fact their own state file contradicts.
   - **Absent, and no cross-reference has run at all**: that is a cycle-order problem worth naming, because Connect should precede Assess. "Cross-ref hasn't run on this phase yet, so this coverage read is the only signal you have."

   **Do not reach for the stale sentence when the record is merely absent.** It is the most quotable of the three and the easiest to attach to the wrong case, and it asserts that sources have accumulated since the last cross-reference — a claim about the project's own counter. A run that says "a few sources out of date" where the counter reads zero has invented a state fact, which is worse than saying nothing.

   - Not: "No saturation record exists at `research/reference/saturation.json`. That file is written by `/know-research:cross-ref`, and `STATE.md` shows the last cross-reference was 2026-07-11, so I have no current reading and I'm routing this the ordinary way." (machinery, and it names three files)

   The tempting error is to reason "coverage came out adequate, so the routing was the same either way, so it didn't matter" — and then say nothing. That reasoning is wrong twice. The commissioner learns their cross-reference is out of date only if you tell them, and a reader who is not told assumes a current reading was consulted. Silence here is a claim.

   Normal cycle order makes staleness rare — Connect runs before Assess — which is exactly why it goes unnoticed when it happens. The same order is why "no cross-ref on this phase at all" is worth naming rather than shrugging at: it means the cycle is being run out of order.

5. **Determine source independence.** Group source notes by origin_chain. Sources sharing the same cited original collapse to one independent data point. Build an independence map: for each unique origin, list the source notes that trace to it. **Sources whose note records "Origin unclear" have UNKNOWN independence — mark them `independence-unknown` in the map.** Unknown is not independent: an unclear-origin source still counts as a Direct source for coverage *existence*, but it never supplies corroboration credit — a question whose 2+-source status rests on independence-unknown sources is flagged "independence unverified" and treated as lopsided-risk, not confirmed convergence.
5a. **Compute a disposition for every discovered candidate.** Read the phase candidates files at `research/discovery/*-candidates.md`, `research/discovery/exclusions.md` (if it exists), and `research/sources/registry.md`. Every candidate ever surfaced by discovery has exactly one disposition:
   - **processed** — a registry row corresponds to it. Match on URL when the registry carries one; the registry's columns are source name and note filename, so **fall back to matching the candidate's title against the registry's source name and its note file**. Do not treat "no URL column, therefore no match" as unprocessed — that would silently invent a stranded candidate out of a source that was in fact processed. If a candidate cannot be confidently matched either way, say so explicitly rather than guessing a disposition.
   - **excluded** — a row exists in the exclusion ledger;
   - **unprocessed** — neither. Candidates the user simply never selected (`top 5` leftovers, deferred batches) land here.

   For each phase question, surface BOTH non-processed dispositions where relevant: excluded candidates whose title or snippet indicates they addressed the question, AND unprocessed candidates that did — especially any whose snippet suggests counter-evidence. An adverse study the user skipped past without ever declining it is exactly as invisible to the processed-notes analysis as a ledgered exclusion, and exactly as load-bearing for the coverage picture. None of this restricts anything; it makes the shape of the evidence universe visible before synthesis (this skill is mandatory before every synthesis, so the disposition picture is guaranteed to exist by then).
6. **For each phase in the research plan, for each question:**
   a. Classify each source note's relevance to this question as Direct, Adjacent, Contradicts, or None using the criteria from the coverage assessment guide.
   b. For Direct matches: count independent sources (using the independence map from step 5). Sources sharing the same origin count as one.
   c. For Contradicts matches: note with a one-line explanation of what the source opposes. Do not count Contradicts sources toward Direct coverage. Do not collapse with Adjacent.
   d. For Adjacent matches: note with a one-line explanation: "Addresses [actual topic] rather than [phase question]"

      **Classification is per question, and a note gets classified against every question — not filed once under the question it fits best.** The same note is routinely Direct for one question and Adjacent for another; that is the normal case, not an edge case. Reporting it only where it scored Direct leaves the other question's coverage picture missing a source the reader can see in `research/notes/`, and "why isn't this one listed?" is a question the report should never provoke. Every question's per-question detail carries its own Adjacent section listing every note adjacent to *it*, however many other questions already mention that note.
   e. Assign coverage status using the coverage assessment guide definitions — based on independent Direct source count only. Adjacent matches do not contribute to coverage status.
   f. Flag lopsided coverage: any question with only 1 independent Direct source gets a lopsided flag.
   g. If a question has 0 Direct sources and at least 1 Contradicts source, assign coverage status "Evidence Against" (not "Not Started"). Evidence Against means the question has active counter-evidence, not an absence of evidence.
6h. **Route each question — the precedence contract.** Coverage status (step 6e) decides whether the question is **adequate**; the saturation record (step 4a) decides whether more collecting is likely to help. Cross them, per question:

   | | **Adequate** | **Inadequate** |
   |---|---|---|
   | **Not saturated** | Proceed — saturation is moot, the evidence is sufficient | **Collect more.** The ordinary route: discovery is still yielding. |
   | **Saturated** | Proceed | **Collection exhausted — the decision belongs to the commissioner (step 7c).** |

   The bottom-right cell is the one that has no automatic answer. The question is saturated — the last rounds of discovery returned confirmations of what was already there — and its independent Direct coverage is still below the bar. Sending it back to `/know-research:discover` produces another round of the same, and the run after that will reach this same cell with the same reading. **That loop is why this cell exists: name it and route to step 7c. Never emit a collect-more instruction for a question your own saturation record says more sources are unlikely to shift.**

   State the condition affirmatively when you assess it — "this question is saturated and has N independent Direct sources, below the bar of two" — not as a conditional about what has not been found. A criterion phrased as a conditional over an empty set clears itself vacuously and falls through to whichever branch comes next.

   **Evidence Against outranks this table.** A question with counter-evidence and no Direct sources (step 6g) is inadequate and cannot be closed by collecting, whatever its saturation reads. It never routes to collect-more and never routes to the step-7c decision: its remedy is a synthesis obligation — the draft must address the contradiction. Report it as such.

   **An accepted gap (step 7b) is already routed.** It carries the commissioner's recorded acknowledgment, so it does not re-enter this table and does not block a coverage-adequate verdict. It appears in the Accepted gaps list with its rationale, as it does every run.

6i. **Before regenerating, verify the classification is complete — count, do not recall.** Walk `research/notes/` and confirm every note appears somewhere in the per-question detail you are about to write. A note relevant to two questions appears under both; a note relevant to none appears in neither and that is fine. **The failure this catches is the note filed once under the question it fits best**, which leaves a second question's coverage picture missing a source the reader can see sitting in `research/notes/`. The rule for this is in step 6d and it is easy to *hold* and easy to *forget*, because the natural way to write the output is note-by-note while the correct way is question-by-question. So do not rely on holding it: count the notes, count their appearances, and reconcile the two before you write.

7. **Regenerate `research/gaps.md`** with the following structure (full regeneration each run — read all notes and rebuild, consistent with cross-ref pattern):

   **Dashboard** (at top of file):
   ```
   ## Coverage Dashboard
   - **Total questions:** N
   - **Direct coverage:** N questions (N%)
   - **Lopsided (single independent source):** N questions
   - **Addressed but unbalanced (all sources one perspective/type):** N questions
   - **Independence unverified (coverage rests on unclear-origin sources):** N questions
   - **Adjacent-only matches:** N questions
   - **Evidence Against:** N questions (active counter-evidence, no Direct sources)
   - **Contradicts matches:** N total (across all questions)
   - **Excluded candidates:** N (user-declined — see research/discovery/exclusions.md)
   - **Unprocessed candidates:** N (discovered, never selected — still in the candidates files)
   ```

   Directly beneath the dashboard, when step 4a classified the saturation reading **stale or absent**,
   add the disclosure line — the same fact the turn carries, in the wording step 4a's three-case list
   assigns to that cause:
   ```
   **Saturation reading:** <the sentence for this cause — stale / absent-with-prior-cross-ref / never run>
   ```
   Omit the line only when the reading is **current**. Its absence then means a current reading was
   consulted, which is exactly what a reader is entitled to infer from silence — so it may never be
   omitted in the other three cases.

   **Per-question detail** (for each phase, for each question):
   ```
   ### [Phase N]: [Phase Name]

   #### Q: [Question text]
   **Coverage:** [Complete/Partial/Not Started/Evidence Against/Addressed but unbalanced] | **Independent sources:** N [LOPSIDED if 1]

   **When two status labels both apply, perspective wins over count.** A question whose Direct sources all speak from one perspective or source type is **Addressed but unbalanced**, however many of them there are — that is the fact a reader most needs, and a count-based label ("Partial", "Complete") would hide it behind a number that looks fine. The `LOPSIDED` flag is separate and count-based; it can co-occur with any status, so a question with one vendor source is "Addressed but unbalanced | 1 [LOPSIDED]". Never report a single-perspective question as "Complete" on the strength of its source count.

   **Direct sources:**
   - [source-note-filename] [Source: citation] — [brief evidence summary]
   - [source-note-filename] [Source: citation] — [brief evidence summary]
   *Non-independent: [source-note-filename] shares origin with [other-note] ([origin description])* ← footnote only if non-independent sources exist

   **Adjacent sources:** ← section only if adjacent matches exist
   - [source-note-filename]: Addresses [actual topic] rather than [phase question]

   **Contradicts sources:** ← section only if Contradicts matches exist
   - [source-note-filename]: Contradicts [phase question] by [brief description of what it opposes]

   **Excluded candidates:** ← section only if ledgered exclusions relate to this question
   - [candidate title] — excluded [date]: [reason verbatim from the ledger]. [If the candidate's snippet suggested counter-evidence, say so plainly: "Appeared to carry an opposing view."]

   **Unprocessed candidates:** ← section only if unprocessed candidates relate to this question
   - [candidate title] — discovered [date], never selected for processing. [If the snippet suggested counter-evidence: "Appeared to carry an opposing view — this question's coverage was assessed without it."]
   ```

7b. **Accepted gaps — record the acknowledgment, stop re-flagging.** A gap is
   *accepted* when the commissioner has explicitly acknowledged carrying it (in
   conversation now, or on a prior run). Acceptance is recorded where the gap lives, in
   `research/gaps.md`, as a disposition line under the gap:

   ```
   Accepted (commissioner, YYYY-MM-DD): "<their words — never yours>"
   ```

   From then on this skill reports the gap in its own short **Accepted gaps** list —
   visible, with its recorded reason, never silently dropped — but stops counting it as
   actionable: it does not block a coverage-adequate verdict and is not re-surfaced as
   an open hole every run. Acceptance is per-gap and lapses if the gap materially widens
   (new questions land in its area) — then it returns to open with a note saying why.
   Never author the acceptance rationale, and never treat "documented" as "accepted":
   only the commissioner's recorded acknowledgment moves a gap to this list.

   **Ledger the acceptance (durable record).** The first time a gap is accepted — the
   acknowledgment arrives in conversation now, not carried from a prior run — also
   append an `acceptance` entry to `research/reference/decision-ledger.md` (create the
   file from `${CLAUDE_PLUGIN_ROOT}/reference/templates/decision-ledger.md` if absent):
   next sequential `D-<n>`, class `acceptance`, today's date, the current phase, the
   gap's subject in one line, the disposition carrying the commissioner's quoted words,
   evidence pointing at `research/gaps.md`. The regenerated `gaps.md` is the working
   view; the ledger entry is the durable anchor — if a regeneration ever loses the
   acceptance line, restore it *from the ledger*, never from memory. When an acceptance
   lapses because the gap materially widened, that is not an edit to the old entry
   (the ledger is append-only, and the widened gap is a new situation the old
   acceptance never covered) — the gap simply returns to open, and a fresh acceptance,
   if granted, gets a fresh entry. This write is silent (posture rule 7).

7c. **The collection-exhausted decision — present it, recommend, and stop.** For every question step 6h routed here, the phase cannot proceed and cannot usefully collect. That is a decision only the commissioner can make. **This contract binds two surfaces and each carries it in full: the `research/gaps.md` entry for the question, and the user-facing turn.** Neither is a summary of the other, and neither is the "real" one.

   Each surface carries all four elements:

   1. **The reading, stated plainly** — the question, its independent Direct count, and that its evidence has stopped changing across independent origins. Give the saturation figure once; do not re-derive it.
   2. **The three legitimate outcomes, enumerated.** A route that is not enumerated collapses into "this is stuck," which is the state the commissioner is already in:
      - **Accept the gap** — proceed to synthesis carrying the limitation into the draft's Methodology & Limitations. This is step 7b: their acknowledgment, in their words, ledgered as an `acceptance`.
      - **Change the question** — a question the available evidence cannot answer may be the wrong question for this phase. Re-scope it in `research-plan.md`.
      - **Change the channels** — saturation is measured over the channels discovery actually mapped. An unmapped one may still yield: paywalled or subscription sources, offline and archival material, an expert conversation, a direct request for primary data.
   3. **Your recommendation, with its reason.** Name which of the three the evidence favors and why, in one or two sentences. Then stop — the decision is theirs, and you do not proceed on any of the three until they choose.
   4. **The standing limit on the claim.** Saturation says the mapped channels have stopped producing new information. It never says the evidence does not exist. Carry that sentence whenever saturation is what justifies stopping; without it "saturated" reads as "exhausted," which is a claim about the world that no amount of searching can support.

   Do not choose for them, do not proceed on the recommendation, and do not re-ask a question they have already answered — a recorded acceptance is a closed decision (step 7b), not an invitation to revisit.

7d. **No saturation reading with synthesis next — present it, recommend, and stop.** When step 4a classified the reading **stale or absent** AND coverage came out adequate so the next step would be Synthesize, do not render a `▶ NEXT` that says draft, and do not advance `Cycle step`. Drafting is the phase's expensive, hard-to-unwind step, and the project's own record cannot currently say whether more searching would change the picture it would be drafted from. That is a decision for the commissioner, and it takes the same shape as 7c's: **this contract binds two surfaces and each carries it in full — the `research/gaps.md` entry and the user-facing turn.**

   Carry three elements on each surface:

   1. **What is known and what is not.** Coverage is adequate, assessed from the notes on disk — say so, and say the reading on whether more searching would still turn anything up is not current, with the cause's sentence from step 4a.
   2. **The two routes, both legitimate.** *Re-run the cross-reference* — one step, and it answers the open question before the expensive one. *Proceed to synthesis anyway* — a defensible call when the phase is time-boxed, or when the coverage read is strong **on its own terms** (named sources, named origins — not "the picture looks settled"), and it carries into the draft's Methodology & Limitations as a stated limitation. The qualifier belongs here rather than only in element 3: "the adequacy read is strong" written bare is one word from "already-solid read", which element 3 forbids, and a reader acts on this element before reaching that one.
   3. **Your recommendation, with its reason, in a sentence or two.** Then stop. Do not run either route, and do not set `Next Action` to a command that answers the question by executing it.

      **The reason may never be a prediction about what re-running would find.** "Unlikely to turn anything up", "probably wouldn't change the picture", "not worth it for an already-solid read" — each answers the exact question this step exists because you *cannot* answer, and answering it inside the recommendation makes the disclosure hollow: the commissioner is told the reading is unavailable and, in the same breath, told what it would have said. Observed on one sample in three, which is why the recommendation needs this constraint and not just an instruction to give one.

      **The test:** if your reason would let a reader skip the cross-reference on the grounds that it probably would not matter, it is the forbidden move — you have predicted the unknown and dressed it as judgment. The legitimate reasons for *proceed* are about cost and context, never about content: the phase is time-boxed, the deadline is real, the coverage read is strong **on its own terms** (named sources, named origins). The legitimate reason for *re-run* is that it is one cheap step standing in front of an expensive one. Recommend on those grounds or state plainly that you have no basis for a preference — which is itself an honest recommendation, and better than a confident one built on a guess.

   **This is a stop, not a block.** Say the word and the phase proceeds; the point is that proceeding becomes something they chose rather than something that happened while they were told a caveat. Observed: runs disclosed the staleness accurately and, three lines later, recommended drafting and advanced the cycle — the disclosure was true and changed nothing, which is the shape of a caveat that exists to be stepped over.

   When coverage is **not** adequate this branch does not apply: route the ordinary way (collect more), which step 4a already specifies, and keep the disclosure.

8. **Update `research/STATE.md`** — set last gap check date to today, **then update `Next Action` to the true next step** — the same command your context-sensitive ▶ NEXT block renders below (`/know-research:discover` or `/know-research:process-source <url>` if gaps remain; `/know-research:summarize-section` if coverage is adequate — **except under 7d**, where the decision is pending and `Next Action` names the decision rather than either command, exactly as it does for 7c). Never leave `Next Action` pointing at the gap check that just ran: a session resuming after a clear reads this field, and a stale value sends it to the wrong step. **Reconcile the cycle state to the coverage verdict — the gap check owns this, and nothing else marks `Collect` done.** The batch finishing gathers sources; whether that is *enough* is this skill's call, so it owns the `Collect` box.
   There are four verdicts, and each has exactly one cycle state. Two of them advance the phase, one sends it back, and one holds it still — the state a phase is in when it can neither proceed nor usefully collect:

   - **Coverage adequate** (every question clears both tests): the phase's evidence gathering is complete. Check `Collect`, `Connect`, and `Assess` in `Current Phase Cycle`, set `Cycle step` to `Synthesize (4 of 5)`, and point `Next Action` at `/know-research:summarize-section`.
   - **Coverage adequate given accepted gaps** (the only questions short of the bar are ones the commissioner has accepted, step 7b): the phase proceeds carrying them. Same cycle state as adequate — checked boxes, `Synthesize (4 of 5)`, `Next Action` at synthesis. The gaps stay visible in the Accepted gaps list; the phase moving on is what acceptance *means*.
   - **Gaps remain, collection still viable** (at least one question routes to collect-more under step 6h): the phase is still gathering — it cannot be past Collect. Uncheck `Collect`, `Connect`, **and** `Assess`, set `Cycle step` to `Collect (1 of 5)`, and point `Next Action` at discovery. **`Connect` comes off too:** it means "cross-ref run, `cross-reference.md` current," and sending the phase back for more sources makes it not current. Leaving it checked puts a finished Connect above an unfinished Collect, which is a position no project can be in.
   - **Collection exhausted, decision pending** (step 7c is on the table and unanswered): the phase holds. Leave `Assess` unchecked and `Cycle step` at `Assess (3 of 5)` — assessment is what produced the open question, and it is not finished until the question is answered. Point `Next Action` at the decision itself, naming the question awaiting it, not at a command. Do not advance and do not send the phase back to collect: both would be answering on the commissioner's behalf, in opposite directions.

   This is what stops a `Collect [x]` box from sitting next to a `Next Action` that says "go find more sources": the box, the `Cycle step`, and `Next Action` must all agree, and this reconciliation is what makes them. The rule underneath all four rows is that the boxes run in order — every step before the active one checked, the active one and everything after it not. After the edit, re-read STATE.md and confirm the gap-check date is today, `Next Action` names the next step (not this one), and the `Cycle step` matches the boxes. These STATE writes are silent (posture rule 7).

## Guardrails

1. A question is "addressed" only when a source note contains a direct, substantive answer — not when a source merely mentions the topic in passing.
2. Do not count the same source twice for different questions unless it genuinely addresses both with distinct evidence.
3. Distinguish between breadth (many questions touched) and depth (any single question answered well enough to write about). Report both.
4. When a phase shows "partial" coverage, list exactly which questions are covered and which are open — do not summarize as a percentage.
5. Flag questions whose Direct sources all speak from one perspective or source type as **"Addressed but unbalanced"** — the status name defined in the per-question detail, not a near-miss variant. This covers both shapes it takes: only one side of a live debate, and several documents that all originate with the same interested party. Source count does not clear it.
6. A source classified as Adjacent for a question MUST NOT be counted toward that question's coverage status. Adjacent sources are research leads, not coverage.
7. Independence is established by the origin_chain field only when it affirmatively identifies distinct origins. Sources explicitly tracing to the same original collapse to one data point. Sources whose origin chain reads "Origin unclear" have UNKNOWN independence — they count toward Direct coverage existence but never toward corroboration; never assume independence from the mere absence of a shared-origin record. Two sources with *clear, distinct* origins that happen to reach similar conclusions are still two independent sources.
7a. Exclusions and non-selections are reported neutrally, never contested — and never hidden. If a question's only potential counter-evidence sits in the exclusion ledger OR unselected in a candidates file, the coverage report says so in the per-question detail. The user's curation is legitimate; invisible curation is the defect — and a candidate skipped by simply never picking it is curated exactly as effectively as one formally declined.
8. Lopsided coverage flag triggers at exactly 1 independent Direct source — not 0 (that is Not Started) and not 2+ (that is adequate for non-Complete status).
9. Full regeneration: gaps.md is rebuilt from scratch each run. Never append to or patch an existing gaps.md — stale entries from deleted or reprocessed sources would persist.
9a. **Saturation routes; it never scores.** A saturated question is not a covered question. Coverage status is counted over independent Direct sources and nothing else — the saturation record changes which route an under-covered question takes, never what its status is. The reverse error is equally banned: an under-covered verdict does not suppress the saturation reading. They are two facts about the same question, and the commissioner needs both.
9b. **Never send a question back to discovery when your own record says discovery has stopped paying.** The treadmill is the failure this contract exists to end: gaps remain → collect → the batch returns confirmations → gaps remain → collect. Each step is correct and the loop is the defect. When step 6h routes a question to the collection-exhausted decision, the phase stops there until the commissioner answers — a `Next Action` naming a discovery command is that answer, made on their behalf.
10. Contradicts classification is not a subcategory of Adjacent. A source that actively opposes the research question's hypothesis is Contradicts — not Adjacent. Adjacent means "related but different topic." Contradicts means "same topic, opposing conclusion." Do not collapse the two. A question with 1 Direct and 1 Contradicts source is "Addressed but unbalanced" (the contradiction is surfaced, not hidden in Adjacent).

## Common Failure Modes

| Failure Mode | Prevention |
|---|---|
| Declaring coverage when sources only tangentially mention a question | For each question, identify the specific claim or data point in the source note that answers it. If you cannot point to a specific passage, the question is not addressed. |
| Confusing quantity of sources with quality of coverage | Three sources that all repeat the same press release provide one data point, not three. Count independent evidence, not source count. |
| Marking a phase complete when gaps are documented but unresolved | "Documented gap" is not "acceptable gap." A gap is acceptable only when the user has explicitly acknowledged it (recorded per step 7b) or no public sources exist after a thorough search. |
| The collection treadmill — a saturated, under-covered question sent back to discovery every run | Read the saturation record (step 4a) and route through step 6h. Saturated + inadequate is a decision, not a discovery target: name it, present the three outcomes, recommend one, and hold the cycle at `Assess (3 of 5)` until the commissioner answers. A question that has been through this loop twice will go through it forever, because nothing in the loop changes. |
| Treating a saturated question as adequately covered | Saturation measures whether the evidence is still changing; adequacy measures whether there is enough of it. One independent Direct source that nobody has contradicted in three discovery rounds is saturated and lopsided at the same time. Promoting it on the strength of the saturation figure is how a phase closes on a single interested source. |
| Filing a note under its best-fit question only, so a question it is Adjacent to never lists it | Classification is per question (step 6d). A note that is Direct for Q2 and Adjacent to Q1 appears in both — as a Direct source under Q2 and in Q1's Adjacent section. The reader can see every note in `research/notes/`; a question that silently omits one reads as an incomplete assessment, whether or not the omission changed its status. |
| Detecting stale saturation and not saying so because coverage came out adequate | The disclosure in step 4a is unconditional and survives every coverage verdict. "The routing was the same either way" is not a reason to withhold it — the commissioner learns their cross-reference is out of date only if told, and a reader who is not told assumes a current reading was consulted. |
| Reading an absent or stale `saturation.json` as "not saturated" | Absent means cross-ref has not run; stale means sources landed after it did. Neither is a verdict. Route the ordinary way and say the reading was unavailable — inferring "not saturated" manufactures a collect-more instruction out of missing data and hides the fact that Connect needs re-running. |
| Re-flagging a gap the commissioner already accepted — or silently dropping it | An accepted gap (step 7b) moves to the Accepted gaps list: reported with its recorded rationale every run, never counted as an open hole, never invisible. Re-litigating it wastes the commissioner's attention; hiding it erases their decision. |
| Missing thin coverage on critical questions | Flag any question answered by only one source. Single-source coverage on a phase's central question is a gap, not partial coverage. |
| Inflating coverage with Adjacent matches | Adjacent sources address related topics, not the specific question. A question about "AWS market share" with 3 sources about "cloud market size" has 0 Direct sources — coverage is Not Started, not Complete. |
| Counting non-independent sources as separate evidence | Check origin_chain for each source. Three articles citing the same Gartner report are one independent data point, not three. Use the independence map. |
| Routing a single-perspective question to synthesis because it cleared the source count | The adequacy gate is two tests, not one: >= 2 independent Direct sources AND not Addressed-but-unbalanced. Sources can be independent of each other and still uniformly interested in the answer — two documents published by the research subject are two sources and one point of view. Emitting "Coverage is adequate" there tells the user the phase is ready to draft when its only outside vantage point is missing. Check perspective before rendering the adequate branch. |
| Missing lopsided coverage on central questions | After assigning coverage status, scan for any question with exactly 1 independent Direct source. Single-source coverage on a phase's central question is a gap worth flagging explicitly. |
| Assuming independence when origin is unclear | "Origin unclear" in a note means independence UNKNOWN, not independent. Three unclear-origin articles may all trace to one hidden press release — count them for coverage existence, flag the question "independence unverified," and give no convergence credit until origins are established. |
| Ignoring the exclusion ledger — reporting coverage as if the user's declined candidates never existed | Read `research/discovery/exclusions.md` every run. A question that reads as one-sided or thin while its counter-evidence sits declined in the ledger must say so — the coverage picture includes what was left out, not just what was let in. |
| Treating "never selected" as "never existed" — only surfacing candidates that went through the formal skip path | The exclusion ledger catches explicit declines; the disposition pass (step 5a) catches everything else. A `top 5` reply that strands an adverse study in the candidates file leaves no ledger row and no reason — the only trace is the candidates file itself, which is why every discovered candidate gets a computed disposition and unprocessed counter-suggesting candidates appear in the per-question detail. |
| Collapsing Contradicts into Adjacent or None | Contradicts is a distinct fourth classification. A source that actively argues against the research question's hypothesis is Contradicts. It must appear in the "Contradicts sources" section of the per-question detail and trigger "Evidence Against" status when no Direct sources exist. Dropping it to Adjacent or None hides active counter-evidence from the user. |

## Output

**Register (read `${CLAUDE_PLUGIN_ROOT}/reference/posture-register.md` — this is rule 7 applied to this skill).** Open with the coverage read, not with what you did. The file writes are silent: never say you read the plan, the notes, the ledger, or the guide; never say `gaps.md` was regenerated; never say STATE.md's gap-check date was set; never name the disposition pass. Those things are mandatory and invisible. The user gets the finding — where coverage is thin, what's one-sided, which discovered source never got processed — and nothing about the pipeline that produced it.

- Not: "Gap check complete. I read the research plan, both source notes, and the exclusion ledger, computed dispositions for every candidate, and regenerated `research/gaps.md` from scratch."
- Say: "Everything you have on SecureStack's security comes from SecureStack. The one independent look — the pentest — is the source you declined, so the coverage picture is vendor-only by construction."

Dashboard summary showing coverage status per phase. Per-question detail with independent source counts, Direct/Adjacent classification, and lopsided flags.

**Strength vocabulary (definition site — referenced by `/know-research:phase-insight`):**
- **Strong:** ≥2 independent Direct sources (independence per the origin_chain map in step 5).
- **Thin:** exactly 1 independent Direct source. This is the same condition as the Lopsided flag — "Thin" is the strength label, "Lopsided" is the coverage-dashboard flag.
- **Unsupported:** 0 Direct sources (even if Adjacent sources exist — Adjacent matches never contribute to strength).

**Highest-priority gaps** — render as a numbered list below the per-question detail, at most 10 items, in the format:

```
1. Phase [P] Q: '[question text]' — Status: [Not Started | Lopsided | Adjacent-only | Evidence Against] — Blocking: [what a draft for this phase cannot claim without this gap filled]
2. ...
```

Criticality order for the list:
1. Not Started questions on phases whose Verify step is the *next* cycle step (i.e., synthesis is imminent and the question has no evidence).
2. Evidence Against questions on phases whose Verify step is the next cycle step (synthesis is imminent; the user must address the contradiction before drafting).
3. **Evidence Against questions on any other active or upcoming phase** — everything rule 2 covers, minus the imminence. Rule 2 admits an Evidence Against question only when Verify is the *next* step, and until this bucket existed that was its only route onto the list: a phase three steps from synthesis carried active counter-evidence that appeared in the per-question detail and nowhere the reader looks. Every other status has a non-imminent bucket — Not Started has rule 6, Lopsided and unbalanced are "any active or upcoming phase" — and Evidence Against was the one left with a single conditional entry. **It ranks here, above Lopsided, rather than at the bottom of the order**: thin coverage is a claim weakly supported and more collecting fixes it, while counter-evidence is a claim the draft cannot make at all and no amount of collecting resolves. Ranked below the collectable statuses it would be buried in any list long enough to matter — observed on a two-item list where it landed second behind a Lopsided question.
4. Lopsided (Thin) questions on any active or upcoming phase.
5. **Addressed but unbalanced questions on any active or upcoming phase** — Direct sources exist, and there may be several, but they all speak from one perspective or source type. This bucket exists because such a question passes a source count and still cannot support a defensible claim: three documents published by the research subject are three documents and one point of view. Without a bucket here, a question can be flagged unbalanced in the per-question detail and still never reach this list, which is where the user actually looks.
6. Not Started questions on upcoming phases (beyond the next Verify).
7. Adjacent-only questions on any phase.

Note: "Not Started" questions are discovery targets — run /know-research:discover to fill them. "Evidence Against" questions are synthesis challenges — the user must address the contradiction in the draft, not find more sources.

**Context-sensitive next-action block:**

If any question is **collection-exhausted with the decision pending** (step 6h routed it to step 7c and the commissioner has not answered). This branch outranks every branch below it: a phase with an unanswered decision on the table does not get a command as its next action, because every available command answers the decision by proceeding as if it had been made:

───────────────────────────────────────────────────────────

**▶ NEXT:** Your decision on [question] — collecting has stopped paying and the coverage is still short. The three ways forward are above; [name the one you recommend] is the one I'd take, for [reason in a clause]. Nothing proceeds until you choose.

**Also available:**
- `/know-research:phase-insight` — Review exactly what the existing sources do and don't establish before deciding.
- `/know-research:discover` — If you want to try channels discovery hasn't mapped; the mapped ones have stopped yielding.

───────────────────────────────────────────────────────────

If discoverable gaps exist (Not Started, Lopsided, or Addressed-but-unbalanced questions). Two kinds of open question are **not** discoverable gaps and never trigger this discovery branch on their own: **`Evidence Against`** questions, where active counter-evidence is not resolved by finding more sources (they route to synthesis below), and **collection-exhausted** questions, where the mapped channels have stopped yielding (they route to the decision above). If a discoverable gap is open alongside either kind, render this block for the discoverable gap and name the others in their own terms — a synthesis task to confront in the draft, or a decision awaiting the commissioner — never as discovery targets:

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:discover` — [state the gap truthfully, in the shape it actually has: "[N] questions have no Direct coverage" when that is what you found; "[N] questions rest on a single independent source" for lopsided coverage; "[N] questions are covered only by sources sharing one origin" for a shared-origin cluster. Do not emit the no-Direct-coverage wording for a lopsided gap — it contradicts the report you just gave.] — find sources to fill them.

**Also available:**
- `/know-research:phase-insight` — Review which questions are thin vs. strong before deciding.
- `/know-research:cross-ref` — Re-run cross-reference if sources have been added since the last run.

───────────────────────────────────────────────────────────

If the only open items are `Evidence Against` questions (no Not Started, Lopsided, or Addressed-but-unbalanced gaps remain):

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:summarize-section` — The discoverable questions are covered; the open items are `Evidence Against` (active counter-evidence). More sources will not resolve these — the commissioner addresses the contradiction in the draft. Name each `Evidence Against` question so synthesis confronts it rather than smoothing it into consensus.

**Also available:**
- `/know-research:phase-insight` — Review the contradicting evidence per question before drafting.
- `/know-research:cross-ref` — Confirm the contradiction is current before synthesis.

───────────────────────────────────────────────────────────

If every question clears **both** tests — at least 2 independent Direct sources, **and** not Addressed-but-unbalanced (its sources do not all speak from a single perspective or source type):

**Both tests, not just the count.** A question can reach two, three, or five independent sources that are all the research subject describing itself, and a count-only gate calls that adequate. It is not: the sources are independent of each other and uniformly interested in the answer. If any question is single-perspective, gaps exist — render the block above instead, and say which questions need an outside vantage point rather than simply more sources.

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:summarize-section` — Coverage is adequate — draft the phase output.

**Also available:**
- `/know-research:phase-insight` — Review phase strength in detail before drafting.
- `/know-research:cross-ref` — Confirm patterns are current before synthesis.

───────────────────────────────────────────────────────────


If more than 10 gaps qualify, show the top 10 by the criticality order above and add a final line: "and N more — see the per-question detail above."
