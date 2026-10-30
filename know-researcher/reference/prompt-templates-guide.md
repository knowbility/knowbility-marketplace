# Prompt Templates — Design Guide

Canonical formats for user-facing prompts across research skills. The goal is consistency — the user should be able to scan any skill's output and find the next action in under two seconds without reading paragraphs.

This file defines ONE template today: the **transition prompt**. More may be added if specific patterns emerge.

For the runtime format, rules, examples 1-3, and CLI tone rules, see `prompt-templates-runtime.md`.

---

## When to use the transition prompt

- At the end of a skill run where the agent is transitioning control to the user with a clear recommended next step.
- When the skill's purpose is to produce a result AND point at what comes after (e.g., `start-phase` briefs then recommends discover; `summarize-section` writes a draft then recommends audit-claims).
- When the end-of-phase reminder fires (phase complete → next phase briefing or context clear).

## When NOT to use it

- **Read-only status skills** — `/know-research:progress`, `/know-research:check-gaps`, `/know-research:cross-ref` (when purely reporting patterns), `/know-research:phase-insight` (when the recommendation is ambiguous). These skills inform a decision the user is about to make; they don't transition to the next one. Adding a template to them creates noise and reintroduces the drift problem.
- **Mid-skill status updates** — "processed source 12, added to notes." Those are one-line status lines, not handoffs.
- **Decision prompts** — when the agent hits a contradiction, access failure, or strategic choice and genuinely needs a judgment call from the user. Those use their own skill-specific prompts (documented in the relevant skill). The transition prompt is for *recommending* a next step, not for *asking* the user to resolve something.
- **Confirmation prompts mid-batch** — "should I continue processing?" is almost never legitimate. See `discover/SKILL.md` → "Legitimate Pause Points" for the four conditions where pausing IS legitimate during a batch. None of them use this template; they use the skill's own prompts.
- **Error prompts** — rare and context-specific. Use plain language, not the template.

## Anti-patterns this template prevents

These are the failure modes the template is designed to make impossible:

1. **"Want me to do these next three steps in order?"** — batch confirmation. The template allows only ONE NEXT action. If three steps need to happen, they happen sequentially with their own transition prompts, or the agent just does them (if approved earlier).
2. **"Should I continue?"** — accountability avoidance, the pattern named in `discover/SKILL.md`. The template has no slot for a yes/no question. The agent must formulate a concrete NEXT action or omit the block entirely.
3. **Open-ended "what should we do next?"** — handing the steering wheel back. The template requires the agent to make a recommendation, not ask the user to make one.
4. **Paragraphs with the next step buried in the middle.** The template puts the NEXT action on the first line inside the block. The user cannot miss it.
5. **Stacked questions.** If the block has multiple questions, it's not a transition prompt — it's a decision prompt or a confirmation prompt. Use the skill's own language.

---

## Example 4: Heavy Collect step → intra-phase clear → cross-ref

Use this pattern when the current step consumed significant context (primary documents, large PDFs, structured data files) and the next step would benefit from a fresh window. The phase cycle continues from the same position after the clear — intra-phase clears are a legitimate transition, not a phase end.

```markdown
───────────────────────────────────────────────────────────

**▶ NEXT:** `/clear` then `/know-research:cross-ref` — Run cross-reference for Phase 4 in a fresh context window.

**Also available:**
- `/know-research:cross-ref` — Run cross-ref without clearing if you want to preserve the current conversation.
- `/know-research:progress` — See where you are before deciding.

**What to expect:** Collect for Phase 4 processed 6 sources including three 990 XML filings, a 31-page PDF, and a canonical figures correction cascade. Context is ~55% used. Cross-ref reads `research/notes/` directly and doesn't need the current conversation — a fresh window gives sharper pattern detection. STATE.md's Next Action field is updated so the next session can resume with one command.

───────────────────────────────────────────────────────────
```

**Important — intra-phase clear rules:**

- **Only at step boundaries, never mid-step.** Finish the current step (write all source notes, update STATE.md, complete pending file writes) before rendering this prompt. Clearing mid-step loses work.
- **Only when the step is heavy.** After Collect with 5+ sources including primary regulatory documents (990 XMLs, SEC filings, court records), large PDFs (>15 pages), or structured data files (XML/CSV/JSON >50KB), or when context is estimated >50% used. After Synthesize when the draft is long (>3000 words) or the source notes are unusually rich.
- **Never between Verify and phase-end.** The phase-level clear already handles that case — do not double-clear. If you just finished Verify and the phase audit passed, render the phase-level transition prompt (Example 3), not this one.
- **STATE.md must be updated before rendering.** The Next Action field must read like a specific command (e.g., "Run /know-research:cross-ref for Phase 4 — 6 sources ready in research/notes/") so the next session can resume without needing the current conversation.

---

## Skills That Use This Template

- `/know-research:init` — after Step 7 report (Phase 1 discovery handoff)
- `/know-research:start-phase` — at end of phase briefing
- `/know-research:discover` — after discovery completion summary
- `/know-research:process-source` — after source processing summary
- `/know-research:cross-ref` — after cross-reference report (context-sensitive)
- `/know-research:check-gaps` — after gap analysis (context-sensitive)
- `/know-research:summarize-section` — after draft is written
- `/know-research:audit-claims` — after phase debrief, on pass only
- `/know-research:phase-insight` — conditionally, only when the recommendation is unambiguous
- End-of-phase reminder (defined in the assembled CLAUDE.md Section 8)

## Skills That Do NOT Use This Template

- `/know-research:progress` — read-only dashboard, no handoff
