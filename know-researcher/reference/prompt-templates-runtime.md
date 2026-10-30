# Transition Prompt — Runtime Reference

Use this at the end of a skill run when the agent is handing control back to the user and pointing at a next step. The template is a structured handoff, not a question.

### Format

```markdown
───────────────────────────────────────────────────────────

**▶ NEXT:** `/research-<command>` — <one-line description of what this does and why it's the right next step>

**Also available:**
- `/research-<alt-1>` — <one-line description>
- `/research-<alt-2>` — <one-line description>

**What to expect:** <One to two sentences explaining what the next command will do, grounded in the research plan or current state. Tell the user what outputs they'll see and any gates or checkpoints they'll encounter. Substance, not time estimates.>

───────────────────────────────────────────────────────────
```

### Rules

- **`▶ NEXT:` is required and is always the first line inside the block.** Always a single command with a one-line description. Never a menu. Never a question. The user's eye lands here first and knows what to do.
- **`Also available:` is optional.** Include only when there are genuinely useful alternatives — two or three max. If the next step is a required pipeline (e.g., `summarize-section` → `audit-claims` is not a choice), omit this section entirely.
- **`What to expect:` is required.** Always included, always one or two sentences. This is where the agent grounds the recommendation in the project's current state. Never more than two sentences — the block is for scanning, not reading.
- **The horizontal rule delimiters (`───────────────────────────────────────────────────────────`) are required above and below.** They make the block findable in long outputs. Unicode box-drawing characters, not ASCII `=` or `-`.
- **Do NOT ask a question in this block.** The block is a handoff. If the agent needs a judgment call from the user, that is a different interaction.

### Examples

**Example 1: start-phase (phase briefing → discover)**

```markdown
───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:discover` — Find candidate sources for Phase 3's questions using the type-channel map.

**Also available:**
- `/know-research:process-source <url-or-file>` — Skip discovery and process a specific source you already have.
- `/know-research:progress` — See where you are in the overall project before deciding.

**What to expect:** Discovery will surface a prioritized candidate list for Phase 3's channels. After you approve, processing runs sequentially with a mandatory cross-reference checkpoint every 5 sources.

───────────────────────────────────────────────────────────
```

**Example 2: summarize-section (draft written → audit-claims, no alternatives)**

```markdown
───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:audit-claims research/drafts/03-programs-and-service-delivery.md` — Fact-check the draft against source notes before it moves to `outputs/`.

**What to expect:** Audit-claims traces every factual claim to its source note, checks for range narrowing and qualifier stripping, and either promotes the draft to `outputs/` or lists specific issues to fix. This is a hard gate — nothing reaches `outputs/` without passing.

───────────────────────────────────────────────────────────
```

**Example 3: audit-claims pass → phase debrief complete → next phase**

```markdown
───────────────────────────────────────────────────────────

**▶ NEXT:** `/clear` then `/know-research:start-phase` — Start Phase 4 with a fresh context window.

**Also available:**
- `/know-research:progress` — See the overall project dashboard before clearing.
- `/know-research:check-gaps` — Confirm no unresolved gaps from Phase 3 should be carried forward.

**What to expect:** A fresh context window gives sharper analysis for the new phase. STATE.md and commonplace.md carry everything forward. Start-phase will read the research plan, gaps, commonplace entries, and open assumptions, and brief you on what Phase 4 needs.

───────────────────────────────────────────────────────────
```

---

## CLI Tone Rules

These rules apply to all CLI skill output: transition text, status messages, next-action context, and `## Output` section content. They do NOT apply to research output written to `research/outputs/`, which follows `writing-standards.md`.

### Banned phrases

Never use these phrases in CLI skill output:

- "it should be noted that"
- "it is worth noting"
- "the evidence suggests" (in CLI status/transition text — permitted in research outputs)
- "it may be the case that"
- "one might consider"
- "this would allow for"
- "in order to facilitate"
- "to that end"

### Replacement style

Write direct present-tense statements of what the command does and why it applies now.

**Banned:** "It is worth noting that additional sources may facilitate better coverage."
**Correct:** "Coverage is thin on 2 questions — run discover to find more sources."

**Banned:** "One might consider running cross-ref at this point in order to facilitate pattern detection."
**Correct:** "Cross-reference is overdue — 6 sources processed since the last run."

The test: could a developer with no context understand the sentence in under two seconds? If not, rewrite it.
