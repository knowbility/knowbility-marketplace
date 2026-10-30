---
name: research-cross-ref
description: This skill should be used when the user asks to find patterns, agreements, or contradictions across already-processed sources (e.g. "what patterns are emerging", "do my sources agree", "cross-reference the notes"). Scans every processed note for repeated claims, contradictions, supporting clusters, and outliers, and updates research/cross-reference.md.
---

# /know-research:cross-ref

Analyze all processed source notes for cross-cutting patterns.

## Process

1. **Read all files in `research/notes/`.**
2. **Read `research/cross-reference.md`** for previously identified patterns.
3. **Read `${CLAUDE_PLUGIN_ROOT}/reference/pattern-recognition-guide.md`** for the types of patterns worth surfacing and how to assess pattern strength.
4. **Check for existing contradiction resolutions.** If cross-reference.md contains previously resolved contradictions, record them. These will be carried forward if the contradiction still exists after re-analysis.
5. **Identify contradictions (XREF-01).** For each pair of sources that address the same claim or question, compare their assertions. A contradiction exists when sources make incompatible claims about the same fact — not when they cover different aspects or use different terminology. For each contradiction found:
   - Record both sides with specific source citations and the exact claims
   - Assess which side is stronger based on recency, methodology quality, and source credibility tier (reference source-assessment-guide.md criteria)
   - Write Claude's suggested resolution with the reasoning (e.g., "Source B's methodology is stronger because it discloses sample size and selection criteria, while Source A's is proprietary")
   - Set resolution status: "unresolved" for new contradictions, carry forward "resolved: [decision]" for previously resolved ones that still exist in the data
   - **Resolution record schema (all four fields, always):** every resolved contradiction records `suggested_resolution` (the side the evidence assessment favored, with the reasoning), `user_resolution` (the commissioner's choice, verbatim), `rationale` (the commissioner's stated reason, if any), and `user_override` — which is **derived, never chosen**: it is `true` whenever `user_resolution` differs from `suggested_resolution`, in ANY form — `confirm:` of a side the assessment did not favor, `both`/`neither` when the assessment favored one side, or a `resolve:` free-text that departs from the suggestion. `confirm:` of the suggested side is the only path to `user_override=false`. The flag is arithmetic on the two recorded fields, not a property of which keyword the commissioner typed.
   - Classify as "core" (directly addresses a current phase question) or "peripheral" (relevant but not blocking)
   - **Classify materiality — this decides whether the user is asked at all.** A contradiction is **immaterial** only when BOTH tests pass:
     - **(a) Same-conclusion test.** Adopting either side leaves every finding this phase would write unchanged in substance — both values sit on the same side of every threshold, band, and qualifier the findings use. Write the finding sentence both ways and compare them. If the two sentences say the same thing, (a) passes.
     - **(b) Clear-favorite test.** The evidence decisively favors one side — the minority value is outweighed by a majority that includes at least one independent source, or it traces to a different rendering of the same document whose canonical version carries the majority value.

     Everything else is **material**, including any contradiction that would move a recommendation, cross a threshold, touch a kill-gate, or change a figure the user has already asked about. When the tests are arguable, it is material. Materiality is about consequence, not confidence: a contradiction can be easy to call and still be material if the finding turns on it.
5a. **Resolve immaterial contradictions yourself; escalate only material ones.**
   - **Immaterial:** adopt the favored side and write the full resolution record with `user_resolution: "auto — immaterial, not escalated"`, `user_override: false`, and the minority value preserved verbatim so nothing is erased. Status is `resolved (auto)`; it never blocks synthesis. Report it in **one line** among the findings, as an observation rather than a decision: "One figure disagrees across two renderings of the same card (1.0 vs 2.1). I've gone with 2.1 — three sources including the independent one — and kept the other on the record. It doesn't move any finding either way." Do not open a decision prompt, do not lay out both sides at length, and do not ask for a `confirm:`.
   - **Material:** do not resolve it. Present both sides, give the suggested resolution with its reasoning, mark it `unresolved`, and block synthesis on it until the user confirms per guardrail 6.
   - **Either way the record is complete.** An auto-resolution is visible, not silent: it appears in the contradictions table marked `resolved (auto)` with both values intact. If the user reopens one, revert it to `unresolved` and take their answer through the normal resolution record.
6. **Detect shared-origin clusters (XREF-03).** Read the origin chain field from each source note. Group sources that cite the same original study, dataset, report, or primary source. For each cluster:
   - Name the shared origin (original study/report title, author, date)
   - List the processed sources that trace to it
   - Note that this cluster counts as ONE data point for pattern strength assessment, not independent corroboration
   - Apply Echo level from pattern-recognition-guide.md to any pattern that relies solely on sources within the same cluster

   **Independence defaults to unknown.** A source whose note records "Origin unclear" never supplies independent corroboration — its independence is unknown, not assumed. A pattern whose strength depends on unclear-origin sources is capped at Echo level until their origins are established.

   **Shared-wording / shared-figure heuristics (Echo triggers).** The origin_chain field only catches shared origins the processing agent could see. Also compare the sources themselves: when two or more sources — especially unclear-origin ones — share distinctive phrasing (near-identical sentences), the same uncommon figure with identical rounding and framing, or the same quote without attribution, treat them as a **suspected shared-origin cluster**: apply Echo level, list them under Shared-Origin Clusters marked `suspected (heuristic: shared wording/figures)` with the matching passage quoted, and add an item to `research/reference/backstage-tasks.md` to try to locate the common origin. Three differently-bylined articles repeating one hidden press release are one data point, whether or not any of them admits it.
7. **Calculate saturation signals (XREF-02) — over independent origins, never raw source counts.** Saturation runs AFTER step 6 so the shared-origin clusters (confirmed and suspected) exist. For each phase question (from research-plan.md):
   - Collapse the sources addressing it into independent origin clusters first: sources in the same shared-origin cluster (confirmed or suspected via the wording/figure heuristics) count as ONE, and a source with "Origin unclear" that matches no cluster contributes existence but no confirmation.
   - For each independent cluster's findings on that question, classify as "new" (adds information not present in previously processed clusters) or "confirmatory" (a genuinely independent cluster confirming another cluster's finding). A second article repeating the same hidden press release is **repetition, not confirmation** — it never increments the confirmatory count.
   - Calculate saturation percentage: confirmatory / total findings, counted per independent cluster.

   Saturation and pattern strength must agree: if step 6 capped a pattern at Echo, the sources inside that cluster cannot simultaneously drive a "converging" saturation signal. One file, one judgment.

   **Thresholds and advisories (explicit):**
   - **Question saturated:** confirmatory ratio **≥80%** — display per-question: "Q: [question] — saturated (N% confirmatory across independent origins). Additional sources unlikely to shift this question."
   - **Question under-covered:** confirmatory ratio **<40%** — display per-question: "Q: [question] — under-covered (N% confirmatory). Prioritize discovery here."
   - **Aggregate saturation advisory:** when **≥75%** of findings *across all questions for the current phase* are confirmatory (independent-origin basis) — display: "Evidence is converging across independent origins — additional sources are unlikely to shift the picture. Consider moving to synthesis for saturated questions." If the raw repeat rate is high but the independent-origin ratio is not (many echoes, few origins), say that instead: "High repetition, low independence — [N] sources trace to [M] origins. More independent origins would shift the picture; more echoes will not."

   **Fire frequency:** these advisories regenerate on every cross-ref run. They are NOT sticky — if a question is still saturated on the next run, the advisory fires again. Do not suppress a repeated advisory; the user needs the current state each run.

7a. **Write the saturation verdict where the stop decision can read it — `research/reference/saturation.json`.** The prose Saturation Summary in `cross-reference.md` is the human working view; this is the record `/know-research:check-gaps` reads to decide whether "go collect more" is honest advice or a treadmill. Both carry the same verdicts — they are two renderings of step 7, never two judgments. Overwrite the file each run (it describes the current phase's current state, like the advisories themselves). Create it if absent.

   ```json
   {
     "generated": "YYYY-MM-DD",
     "phase": 2,
     "basis": "independent origin clusters",
     "aggregate_advisory": true,
     "questions": [
       {
         "question": "verbatim question text from research-plan.md",
         "verdict": "saturated | under-covered | neither",
         "confirmatory_ratio": 0.86,
         "independent_clusters": 4
       }
     ]
   }
   ```

   `verdict` follows step 7's own thresholds: `saturated` at ≥80% confirmatory, `under-covered` at <40%, `neither` in between. Every question in the current phase gets a row, including ones with no sources yet (`"verdict": "under-covered", "confirmatory_ratio": 0.0, "independent_clusters": 0`) — a question missing from the list reads downstream as "no saturation opinion," and an unanswered question having no opinion is different from its having none *available*. Question text must match `research-plan.md` verbatim; the reader matches on it.

   This write is silent (posture rule 7) and non-blocking — guardrail 8 stands. Saturation still never stops the user processing more sources. What changes is that the skill that owns the stop can now see it.
8. **Identify cross-cutting patterns** (convergence, gap clusters, temporal trends, source-type skew, outliers). When assessing pattern strength, apply shared-origin cluster adjustments: sources in the same cluster — confirmed or suspected — count as one data point, and unclear-origin sources add no corroboration credit.
8a. **Read the exclusion ledger AND the unselected remainder.** Read `research/discovery/exclusions.md` (if it exists) and the phase candidates files at `research/discovery/*-candidates.md`; cross-check the candidates against `research/sources/registry.md` to find candidates that were neither processed nor formally excluded — the unselected remainder. Report both counts in the dashboard. When a convergence pattern exists on a question where an excluded OR unprocessed candidate's title or snippet suggested a dissenting view, note it beside the pattern: "Convergence on [question] should be read alongside the discovery record: [candidate] ([excluded: reason] / [discovered, never selected]) appeared to carry an opposing view." Report neutrally — the curation is the user's call; its visibility is this skill's job, and a candidate stranded by `top 5` is as invisible to the notes as one formally declined.
9. **Regenerate `research/cross-reference.md`** using the template structure (Dashboard -> Contradictions -> Saturation Summary -> Shared-Origin Clusters -> pattern types). Carry forward existing contradiction resolutions if the contradiction still exists. Drop resolutions for contradictions that no longer exist in the data. Dropping a resolution from this working view never touches its `decision-ledger.md` entry — the ledger is append-only and is not this skill's to prune. Update the dashboard counts.
10. **Update `research/STATE.md`** — set last cross-reference date to today and reset "Sources since last cross-reference" to 0. **Then update `Next Action` to the true next step** — the same command your context-sensitive ▶ NEXT block renders below (resume processing the batch, run `/know-research:check-gaps`, or resolve an unresolved contradiction). Never leave `Next Action` pointing at the cross-ref that just ran: a session resuming after a clear reads this field to know what to do, and a stale value sends it to the wrong step. If this cross-ref completed the phase's **Connect** cycle step — the approved batch is fully processed and no more sources are queued — also check the `Connect` box in `Current Phase Cycle` **and move `Cycle step` on to `Assess (3 of 5)` in the same edit. The box and the pointer are one write, never two.** Checking `Connect` while `Cycle step` still reads `Connect (2 of 5)` leaves the file saying the step is both finished and current; a session resuming on it cannot tell which is true, and `Next Action` will already be pointing at the gap check. The rule the whole cycle block obeys: every step before the active one is checked, and the active step is not. **After the edit, re-read STATE.md and confirm `Last cross-reference` is today's date, `Sources since last cross-reference` is 0, and `Next Action` names the next step, not this one.** If any field does not match, do not report cross-ref as complete — surface the write failure with the expected vs. actual values and stop. These STATE writes are silent (posture rule 7); the next `/know-research:process-source` call trusts the counter, and a resume trusts `Next Action`.

## Guardrails

1. Report patterns only when two or more independent sources support them. A pattern from one source is a claim, not a pattern.
2. When sources contradict each other **materially**, present both sides with source citations. Do not resolve a material contradiction by picking the more recent or more authoritative source. This guardrail governs material contradictions only — immaterial ones (both tests in step 5) are resolved in place per step 5a and reported in one line. That is not cherry-picking: the losing value stays in the record verbatim, and the user is told which value was adopted and why.
3. Do not force thematic connections. If sources cover different aspects of the topic without overlapping, say "no cross-cutting patterns found for [theme]" rather than inventing a connection.
4. Weight patterns by source independence. Three blog posts citing the same original study are one data point, not convergence. Independence is never assumed: origin_chain establishes it only when it affirmatively identifies distinct origins. "Origin unclear" means independence unknown — no corroboration credit, and shared-wording/shared-figure matches trigger a suspected cluster at Echo level.
5. Date-stamp patterns. A pattern supported by sources from 2019 and contradicted by a 2024 source is a temporal shift, not a contradiction.
6. **This guardrail applies to material contradictions.** (Immaterial ones never reach it — step 5a resolves and reports them.) When logging a material contradiction, present both sides with specific source citations. Include Claude's suggested resolution with explicit reasoning (recency, methodology, credibility tier), but mark it as a suggestion — the user must confirm resolution before synthesis can proceed on affected questions. **Confirmation format:** a valid confirmation is either `confirm: <side-A | side-B | both | neither>` (accepting or overriding the suggestion with a specific side) or `resolve: <free-text>` (a custom resolution, recorded verbatim). Either way the full resolution record schema from step 5 is written — `suggested_resolution`, `user_resolution`, `rationale`, and the DERIVED `user_override` (true whenever the commissioner's resolution differs from the suggestion, regardless of which keyword carried it — `confirm: side-A` against a side-B assessment is an override exactly as much as free-text is). Any other response — including implicit agreement by moving forward, lukewarm affirmatives like "sure" without a side specified, or deferrals — is treated as still-unresolved; re-surface the contradiction and re-ask. Do not infer user agreement from silence or from the user starting the next command.

   **After the commissioner decides, the case is closed — say what was recorded and stop.** Their answer stands (posture doctrine: "Once named, their answer stands"). The turn that follows a decision may state what is now on record, that it went against the assessment, and any *forward* consequence the commissioner needs — that the question's evidence stays thin, that a figure is now single-sourced, that this is what the output will carry. It may **not** restate the case for the side they rejected. Re-explaining why the other source had better methodology, or characterizing the chosen source's weakness in fresh terms after the fact, is argument wearing disclosure's clothes: the decision was made with that reasoning already in hand, so repeating it can only read as pressure. The test is tense and direction — "I'd recommended the other one, and you've gone the other way; here's what that means downstream" is a record; "the figure you've picked is the vendor's own claim about its own market" is relitigating. One sentence of disclosure, then move to what happens next.

   **State the forward consequence in terms of what the output will now carry — never in terms of the comparison you already made.** This is where the rule keeps failing, because a comparative restatement is genuinely forward-looking and so it feels permitted. It isn't: the commissioner already weighed those merits, so re-describing the chosen source's provenance or the rejected source's independence adds nothing they don't have and reads as pressure. If a clause would still make sense as an argument for the other side, it is one.

   - Not: "The growth figure now rests on the vendor's own claim about its own market rather than the independent estimate."
   - Not: "Going against my recommendation here means the number is self-reported."
   - Say: "The 40% goes into the phase output, single-sourced, with the range flagged in Methodology & Limitations."

   The forward consequences that belong here are concrete and about the record: which figure the output carries, that it is now single-sourced, what the audit will flag, what the minority value's status is. Adjectives about credibility are not consequences.

   **The override gets named once, inside the forward sentence — never appended after it.** You may say the decision went against the assessment; that is the override label and it belongs on the record. What fails is adding it as a separate trailing item once the consequence has already been stated, because a sentence that comes *after* the forward-looking one is not carrying information — it is landing a point. "The output will carry the 40%, single-sourced, with Forrester's 12–18% held in Methodology & Limitations" does the whole job in one breath. "…held in Methodology & Limitations. I'd recommended Forrester's; that's now on the record too" does the same job and then reaches back for the last word.

   One sentence. Then the next step. If you find yourself starting a new sentence about the resolution after you have already said what the output carries, delete it.

   **Ledger the resolution (durable record).** When a material resolution record is written, also append a `resolution` entry to `research/reference/decision-ledger.md` — create the file from `${CLAUDE_PLUGIN_ROOT}/reference/templates/decision-ledger.md` first if it doesn't exist (projects predating the ledger). Entry per the ledger's grammar: next sequential `D-<n>`, class `resolution`, today's date, the current phase, the contradiction's subject in one line, the adopted disposition in one line, evidence pointing at `research/cross-reference.md` — and when the commissioner overrode the suggestion, their words quoted in the disposition. The regenerated `cross-reference.md` is the working view; the ledger entry is the durable record `/know-research:audit-claims` enforces downstream. Immaterial auto-resolutions are **not** ledgered — they move no finding, and the working record preserves both values. This write is silent (posture rule 7), like every other file write in this skill.
7. Shared-origin clusters collapse to one data point for pattern strength. Three blog posts citing the same study are Echo level, not Convergence. This applies retroactively to all existing patterns when shared-origin clusters are detected.
8. Saturation signals are informational, not blocking. Display the signal and suggest focusing discovery on under-covered questions, but do not prevent the user from processing more sources. **Not blocking is not the same as not consulted:** `/know-research:check-gaps` reads the step-7a record to tell a genuine gap from a treadmill, and saturation feeds that routing without ever deciding it. Saturation never promotes a question to adequate coverage — adequacy is counted over independent Direct sources and belongs to the gap check. A question can be fully saturated and still badly under-evidenced; those are two different facts and this skill only produces one of them.
9. Regenerate cross-reference.md from scratch on every run for consistency. The only state carried forward is resolved contradiction decisions.

## Common Failure Modes

| Failure Mode | Prevention |
|---|---|
| Forcing patterns that do not exist — connecting unrelated sources to show "insight" | Each pattern must cite at least two independent sources. If you cannot name them, the pattern is not real. |
| Missing contradictions between sources | Actively compare sources that address the same question. Check whether Source A's numbers match Source B's for the same metric. |
| Recency bias — treating newer sources as automatically more reliable | Note the date of each source contributing to a pattern. Recent is not synonymous with correct, especially for historical or structural claims. |
| Overlooking absence patterns — gaps visible only when comparing across sources | Look for questions that multiple sources reference but none answer with evidence. These are significant gaps, not irrelevant omissions. |
| Echo-chamber patterns — multiple sources tracing to the same original | Trace claims to their origin. If three articles cite the same study, that is one source, not convergence. |
| Treating shared-origin sources as independent corroboration | Check origin chain fields. If two sources cite the same study, they are one data point. Label as Echo in pattern strength. |
| Assuming independence because no shared origin was recorded | "Origin unclear" is not "independent." Apply the shared-wording/shared-figure heuristics — near-identical phrasing, the same uncommon figure with identical rounding, the same unattributed quote — and demote matches to a suspected cluster at Echo level. False convergence from a hidden common origin is exactly what this step exists to catch. |
| Reporting convergence while dissenting candidates sit in the exclusion ledger | Read exclusions.md every run. Convergence built on a curated evidence base is reported WITH the curation visible — note excluded candidates that appeared to dissent, neutrally, beside the pattern. |
| Resolving a **material** contradiction without user confirmation | Log material contradictions with a suggested resolution, but mark as "unresolved" until the user explicitly confirms. Synthesis is blocked on unresolved core contradictions. Apply step 5's two tests honestly — a contradiction that would move a finding is material no matter how obvious the answer looks. |
| Escalating an **immaterial** contradiction to the user | Run step 5's materiality tests before opening any decision prompt. Handing the user a choice whose two branches produce the identical finding spends their attention on bookkeeping and teaches them the gate is noise. If you find yourself about to write "it doesn't change the conclusion either way" in a prompt asking them to choose, the tests already told you not to ask — adopt the favored side, keep the other value on the record, and say so in one line. |
| Letting the confirmation keyword decide the override flag | `confirm: side-A` against a side-B assessment is an override — the same override as free-text, wearing politer syntax. `user_override` is derived by comparing `user_resolution` to `suggested_resolution`; it is never inferred from which keyword the commissioner used. A resolution record missing either field cannot be marked resolved. |
| Saturation contradicting pattern strength | Step 6 and step 7 read the same sources; if step 6 called a cluster Echo, step 7 must not count its members as mutually confirming. Compute saturation over independent origin clusters only — a file that says "Echo, one data point" in one section and "100% confirmatory, evidence converging" in another has issued contradictory judgments. |
| Reporting raw saturation % without actionable guidance | Every saturation signal must include direction: "saturated — consider synthesis" or "under-covered — prioritize discovery here." A number alone is not useful. |
| Dropping previous contradiction resolutions on regeneration | Before regenerating, read existing cross-reference.md and extract resolved contradictions. Carry them forward if the contradiction still exists in re-analyzed data. |

## Output

**Register (read `${CLAUDE_PLUGIN_ROOT}/reference/posture-register.md` — this is rule 7 applied to this skill).** Open with what the evidence shows, not with what you ran. The writes are silent: never say `cross-reference.md` was regenerated, never report the counter reset or the last-cross-reference date, never say a write was verified or re-read, and never name the backstage-task file when you log a follow-up. Those are mandatory and invisible. A follow-up you've queued is said plainly — "I'll chase down where that figure actually comes from" — not as a filing action.

- Not: "`research/cross-reference.md` regenerated; `research/STATE.md` updated — Last cross-reference: 2026-07-12, Sources since last cross-reference: 0 (verified after write). I've added a backstage task to locate the common origin (`research/reference/backstage-tasks.md`)."
- Say: "Those three sources agree, but they don't corroborate each other — same figure, same rounding, same phrasing. That reads as one origin echoed three times, so it's one data point, not three. I'll go find where the number actually came from."

### Cross-Reference: Phase [N]

| Signal | Count |
|--------|-------|
| Contradictions (unresolved — material, awaiting you) | N |
| Contradictions (auto-resolved — immaterial, on the record) | N |
| Contradictions (total) | N |
| Shared-origin clusters (confirmed) | N |
| Shared-origin clusters (suspected — wording/figure heuristics) | N |
| Independence-unknown sources | N |
| Excluded candidates (user-declined, see exclusions.md) | N |
| Unprocessed candidates (discovered, never selected) | N |
| Saturation advisory | triggered / not triggered |
| Patterns identified | N |

**Aggregate saturation:** [N%] confirmatory — [converging / still building]

---

[Contradictions detail, saturation per-question, cluster list, pattern list follow below]

Summarize new patterns found since the last cross-reference. Report: number of contradictions found (unresolved/auto-resolved/total — auto-resolved ones get one line each, not a decision prompt), saturation status (aggregate % and any per-question advisories), shared-origin clusters detected. Highlight any contradictions that block synthesis and any questions that are under-covered. If aggregate saturation advisory is triggered, suggest the user consider moving saturated questions to synthesis.

**Context-sensitive next-action block (per D-08):**

If unresolved contradictions exist:

───────────────────────────────────────────────────────────

**▶ NEXT:** Resolve the [N] unresolved contradiction(s) above — synthesis is blocked until core contradictions are confirmed.

**Also available:**
- `/know-research:check-gaps` — Check coverage after resolving contradictions.
- `/know-research:phase-insight` — Get a full picture of phase strength before deciding next steps.

───────────────────────────────────────────────────────────

If no blocking contradictions and coverage is converging:

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:check-gaps` — Confirm coverage for Phase [N] before synthesis.

**Also available:**
- `/know-research:process-source <url>` — Process additional sources if any questions remain under-covered.
- `/know-research:phase-insight` — Analyze phase strength in detail before deciding.

───────────────────────────────────────────────────────────

