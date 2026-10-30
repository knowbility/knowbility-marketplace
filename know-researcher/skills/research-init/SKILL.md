---
name: research-init
description: This skill should be used when the user asks to start, set up, or scaffold a new structured research project (e.g. "start a research project", "set up researcher here", "initialize research on this topic"). Starts from the user's research challenge, infers an internal research profile, and scaffolds research/ and source-material/ with a project-grounded proposed plan, CLAUDE.md, STATE.md, registries, reference protocols, and gates. Refuses to run if a project already exists.
disable-model-invocation: true
---

# /know-research:init — Initialize a Structured Research Project

You are scaffolding a new research project. This skill creates the research infrastructure: directory structure, CLAUDE.md, STATE.md, reference protocols, source registry, gap tracker, cross-reference file, and a proposed research plan derived from the user's actual challenge, material, intended use, and evidence needs. Research type is internal routing metadata, not a classification task imposed on the user.

## Step 0: Fresh-project guard

Init only runs against fresh project directories. Before asking the user any questions, check whether `${CLAUDE_PROJECT_DIR}/research/STATE.md` exists.

- **If `STATE.md` does not exist:** proceed to Step 1.
- **If `STATE.md` exists AND the user asked for the review-protocol upgrade** (the
  invocation or their message says "upgrade", "adopt the review protocol", "add the
  credibility gate", or equivalent): run the **protocol-adoption path** below — it
  installs the credibility-gate kit onto the existing project and touches nothing else.
- **If `STATE.md` exists** otherwise: stop. Print:

  > There's already a research project here (`research/STATE.md` exists). Init only runs on fresh directories.
  >
  > To start over, either:
  > - `mv research research.old` (preserves your existing work in a side directory), or
  > - `rm -rf research source-material` (discards it), then re-run `/know-research:init`.
  >
  > To check the status of the existing project instead, run `/know-research:progress`.
  > To add the completion credibility gate to this existing project, run `/know-research:init upgrade`.

  Do not modify any files. Do not ask questions. Exit the skill.

  **If the user pushes back — "can't you just work around it", "do it anyway" — hold, and say
  plainly that the `mv` and `rm -rf` are theirs to run.** Restate the two routes and stop. Do
  not offer to perform either one, and do not ask whether you should: "Want me to move the
  current project to `research.old` and start fresh?" is the offer this guard exists to prevent,
  and a user who says yes has approved a destructive move the skill was built not to make. The
  routes are printed so the user can run one after looking at what is there. **The boundary is
  stated here rather than left to be demonstrated** — a run that only *behaves* correctly gives
  the next run nothing to hold onto, which is how one sample in three came to make the offer.

### Step 0b: Protocol-adoption path (existing projects only)

Adoption installs review protocol v1 onto a live project **without touching any research
content** — no plan regeneration, no note or output edits, no STATE position changes
beyond the header line. **Never conclude "already adopted" from file presence alone** —
presence proves nothing about validity. A project only counts as adopted after the
step-5 verification below passes; anything short of that (missing pieces, a drifted
validator hash, a duplicated STATE line, an unparseable marker) is damage, and the
remedy is the same: (re)install the invalid pieces from the plugin's current copies and
verify again. Existing `research/reviews/` artifacts (receipts, reports, ledgers) are
immutable — never edit, move, or delete them during adoption.

1. **Install the validator + marker + reviews/ scaffold** exactly as Step 3a-3 (and
   write `research/reviews/.gitkeep` if the directory is missing).
1a. **The moment the writes land, tell the user what you did NOT touch.** You have just
   written into somebody's existing project. Before anything else, and **before any step below
   can stop the run**, report: the plan, the notes, the registry, and the phase position are
   unchanged; what changed is the validator, the marker, `reviews/`, and (next step) one added
   line in `STATE.md`. This report used to live at step 5, and step 5 is past two places where a
   correct run legitimately halts — so a run that stopped early had already written to disk and
   told the user nothing about what survived. **Every sample of that scenario omitted it**, and
   the fix is the ordering, not a reminder.

2. **Add the STATE discriminator.** Edit `research/STATE.md`: insert the line
   `Review protocol: v1` in the header block (after the `# Research State` title, before
   the first `##` heading). Exactly one such line; nothing else in STATE changes.
3. **Completion criteria.** Read the plan's Success Criteria section:
   - If it already carries `**SC-N**` stable IDs, write
     `research/reference/completion-criteria.md` from them (template header + exact IDs).
   - If it is prose (pre-protocol plan), offer the user two options: (a) assign stable
     IDs now — rewrite the plan's criteria lines as `- **SC-N** — <same text>` (text
     unchanged, IDs added; this is the only content edit adoption may make, and only
     with the user's yes) and write the canonical file to match; or (b) keep prose —
     the project runs in `legacy-prose` criteria mode: honest, explicitly weaker C1
     coverage, no canonical file written. Record their choice in
     `research/notes-to-self.md`.
   - **If the plan has no Success Criteria section at all**, that is a third case and not the
     same as prose. Prose means the criteria exist and are unstructured; absent means the project
     never wrote down what finishing looks like. Say that plainly — it is a substantive fact
     about the project, not a formatting gap, and the commissioner is the only person who can
     supply it. Offer to draft criteria from the plan's phases and deliverables **for their
     review**, or to proceed in `legacy-prose` mode, and record which they chose. Adoption must
     not invent criteria unasked: a completion gate binding to criteria the agent wrote for
     itself checks nothing, and it is worse than no gate because it reads like one.
4. **Pre-allow.** Merge `Bash(python3:*)` and `Bash(codex:*)` into
   `.claude/settings.json` per Step 3b's additive-merge rules.
5. **Verify.** **Nothing before this step may report a verification result from this step.**
   The self-test and the gate run *here*; a run standing at step 3 has not run them and may not
   say the gate "is live", the install "verified clean", or anything equivalent. If the run stops
   before this step — which step 3's missing-criteria case makes a legitimate outcome — say
   exactly that: *reinstalled, not yet gate-verified, pending your decision on the criteria.*
   Reporting an unrun check as passed is the failure this ordering exists to prevent, and it was
   observed in two samples out of three.

   **When you do run it, report the exit code, not an adjective.** "Clean" is not a state this
   validator produces at adoption; the acceptable outcomes are **exit 12** and **exit 13**. Say
   which one came back.

   First `python3 research/bin/validate-corpus-review.py --self-test` (must
   end green), then `python3 research/bin/validate-corpus-review.py gate --root .
   --json`, and check the STATE header carries exactly one `Review protocol: v1` line.
   Acceptable gate exits, each with its honest report:
   - **12 (`no-review`)** — the normal adoption result: protocol intact, no review yet.
   - **13 (`stale-hash`)** — expected **when the project carries pre-adoption review
     receipts**: adding the STATE discriminator changed the state hash, so any existing
     final review is stale *by adoption itself*. This is not an install failure — the
     receipts stay on disk untouched (immutable), and the report says plainly: a fresh
     `/know-research:review-corpus final` run is required before the gate can pass.
   - **10/11** — the install is partial or drifted: fix the named pieces and re-verify.
   - **24** — criteria drift between plan and canonical file: fix and re-verify.
   Then report: the gate is live, project completion now requires
   `/know-research:review-corpus final` plus the validator's verdict, and existing phase work
   is untouched.

---

## Step 1: Gather Project Information

Gather the minimum information required to frame the work correctly. Do not make the user
classify their own problem into the plugin's internal research taxonomy.

**Option-list caution:** any list of more than 4 options (the 11 research types, the audience
examples) must be presented in your reply text, never via AskUserQuestion — AskUserQuestion
silently truncates the list to 4 options.

**Opening question — Research Challenge:**

Ask:

> What are you trying to understand, test, or decide? Describe the research challenge,
> question, or hypothesis, the exact subject it concerns, and any context or source material
> you already have. You can include a URL, document path, or pasted content.

This is deliberately open-ended. Accept the user's framing in their own language. Do not
interrupt a sufficiently specific answer with a menu of research types.

**Adaptive follow-up — Audience, Use, and Stakes:**

If the user's opening answer already makes clear who will use the research, what decision or
deliverable it supports, and how costly a wrong conclusion would be, do not ask again. Otherwise
ask one focused follow-up:

> Who will use this research, what will they use it to decide or produce, and how defensible
> does it need to be?

Accept free-form answers. Examples such as internal decision-making, external publication,
investment due diligence, fundraising support, curriculum design, or personal knowledge are
calibration aids, not categories the user must select.

**Clarify only load-bearing ambiguity:**

- If the exact subject is ambiguous, stop and ask the smallest question needed to identify it.
  Subject ambiguity is blocking because every downstream phase would otherwise target the wrong
  thing.
- If geographic scope, date range, or intended deliverable is missing, do not automatically
  block. Carry a visible assumption into the proposed plan unless different plausible answers
  would materially change the sources, evidence standard, or deliverable. Ask only in that
  material case.

  **And you may not do both.** If you have written the gap into the plan's Assumptions, or given
  a phase the job of resolving it, you have already judged that it does not block — asking about
  it anyway hands the user a question your own plan has answered, and it arrives in the same
  shape as a genuinely blocking one, so they cannot tell the difference. Decide once: carry it,
  or ask it. The tell is a turn that presents an assumption and a question about that same
  assumption, and a STATE file that says "ready to start" underneath.
- Do not ask the user to choose a research type merely because more than one type could apply.

**Form a provisional internal research profile:**

After the challenge and intended use are sufficiently clear, provisionally infer:

- one **primary research type** from the plugin's 11 supported types, used only for downstream
  compatibility: the base finding tags, source standards, CLAUDE.md `research-type` field, and
  fallback type-channel map;
- zero or more **secondary research lenses** when the challenge genuinely crosses types; and
- the intended deliverable and evidence calibration.

The supported primary types remain: PRD Validation, Exploratory Thesis, Competitive Analysis,
Company Research (For-Profit), Company Research (Non-Profit), Person Research, Market/Industry
Research, Presentation Research, Curriculum Research, Opportunity Discovery, and Customer
Safari.

**Do not infer a type whose defining artifact the project does not have.** PRD Validation
validates a PRD; without one there is nothing to validate, and choosing it ships that type's
finding tags (`VALIDATED` / `CHALLENGED` / `MISSING` / `OUTDATED`) and its "does the PRD address…"
source standards into `CLAUDE.md`, where every phase inherits them for the life of the project.
The same test applies across the set: Person Research needs a person, Customer Safari needs a
customer population, Competitive Analysis needs named competitors. Routing metadata still has to
be true — and this one is durable and rarely revisited, so a wrong inference is not self-correcting.

Do not ask the user to confirm this provisional profile before proceeding unless two plausible
profiles would produce materially different deliverables or evidence rules and the user's
stated use does not resolve the choice. The type is routing metadata, not the research question.
Finalize the profile only after reading any source material in Step 2; documents may reveal a
material secondary lens or show that the provisional primary type was too shallow. Report the
final inferred profile with the completed proposed plan so the user can correct it before starting
Phase 1.

Proceed once the research challenge, exact subject, and audience/use calibration are sufficient
to generate a defensible proposed plan.

## Step 2: Ingest Source Material

Before generating a plan, account for every document the user supplied and understand its
complete relevant content. The required outcome is that no supplied material is silently omitted
or represented from a filename, snippet, or partial view. Choose the reading method appropriate
to the file and record any access limitation explicitly.

### 2a. Save pasted or referenced content to source-material/

If the user's research-challenge answer included a document path, URL, or pasted content, save it to `source-material/` with a descriptive filename — use the document's own title or a short slug derived from its first heading, not "source.txt" or "doc1.md". For URLs, fetch the full content with `tvly extract "{url}" --format markdown` first; fall back to `npx firecrawl-cli scrape "{url}" --format markdown`, then `WebFetch` if CLIs unavailable. CLI commands use bare names — the plugin's `SessionStart` hook (`hooks/setup-paths.sh`) puts the necessary bin directories on PATH for every Bash call in the session. Never work from search snippets here — the plan generator will use what you save as ground truth.

### 2b. Account for every file in source-material/

Enumerate every non-dotfile in `source-material/`. For each file, establish:

- what it actually contains;
- the facts, entities, claims, assumptions, decisions, dates, figures, and open questions that
  could affect the plan; and
- whether any portion was inaccessible or intentionally excluded.

If a material file cannot be read, tell the user which file and why. Proceed only after the user
provides an accessible version or explicitly accepts its exclusion; record that exclusion and
reason in the digest. This is a provenance boundary, not a prescribed reading ritual.

### 2c. Write the source-material digest

Create `${CLAUDE_PROJECT_DIR}/research/source-material-digest.md` using the structure below. This file is the ground truth for what the user handed you. The plan generator reads it, the research-integrity agent verifies the plan against it, and `/know-research:start-phase` reconciles future drops against it.

```markdown
# Source Material Digest

Generated by /know-research:init on [TODAY'S DATE]. This file is the ground truth for what the user provided before plan generation. Do not hand-edit — re-run the relevant skill if `source-material/` changes.

## Files Read

| Filename | Type | Size | Read status |
|---|---|---|---|
| [filename] | [PDF/MD/TXT/...] | [pages or lines] | full / partial / unreadable |

## Named Entities
- People: [list every person named, with role if stated]
- Organizations: [list every org named, with relationship to user if stated]
- Institutions: [schools, degree-granting bodies, accreditors, certifying bodies]
- Products/Projects: [any specific product, project, or initiative]

## Dates and Timelines
- [Specific date or range, what it refers to, which file]

## Credentials and Degrees
- [Each degree, certification, or credential; in progress vs. completed; institution; date; which file]
- Include even if the research type is not Person Research — a PRD may reference the authoring team's credentials, a thesis may reference the author's qualifications.

## Stated Facts
- [Each factual claim the document makes, one per line, with the filename]

## Stated Assumptions
- [Each thing the document assumes without proving; these are candidates for the research plan's Assumptions section]

## Decision Points and Open Questions
- [Any place the document says "we are considering X" or "the question is whether Y" — these often become phase questions]

## Things the User Said in Conversation But Did Not Put in a File
- [The user's research challenge and verbal context, preserved verbatim. This lets the plan generator see the gap between "what the user said" and "what the documents say."]

## Out of Scope
- [Anything the user explicitly said not to research, or files that could not be read with the reason. Empty by default.]
```

Populate every section. An empty section means "I checked and found nothing," and should be written as `- (none found)`. A missing section means "I did not check" and is a failure of this step.

### 2d. Hand off to plan generation

Step 4 (Generate the Research Plan) now has access to:
- The user's research challenge and verbal context
- The structured digest at `research/source-material-digest.md`
- The supplied source files, already ingested and available for direct consultation when needed

If `source-material/` is empty (no non-dotfile files), Step 2 has no work to do — skip directly to Step 3 without creating a digest. Most projects start with an empty `source-material/` and rely entirely on discovery. The digest is only required when the user has provided seed documents.

**Acceptance standard:** the digest accounts for every supplied file, preserves the user's verbal
framing separately from document claims, identifies discrepancies without resolving them by
guessing, and makes every omission visible.

## Step 3: Create Directory Structure

This is a fresh-project scaffold — do not assume any of these directories exist. Create them all, rooted at `${CLAUDE_PROJECT_DIR}` so the skill works regardless of the agent's current working directory.

### 3a. Create the directory tree

Create each leaf directory below by writing a `.gitkeep` file into it with the Write tool. Write creates parent directories implicitly, so each `.gitkeep` write also creates the directory. Do **not** use Bash `mkdir` — Write avoids permission prompts and is consistent with the rest of init's file operations.

```
${CLAUDE_PROJECT_DIR}/research/sources/.gitkeep
${CLAUDE_PROJECT_DIR}/research/notes/.gitkeep
${CLAUDE_PROJECT_DIR}/research/drafts/.gitkeep
${CLAUDE_PROJECT_DIR}/research/outputs/.gitkeep
${CLAUDE_PROJECT_DIR}/research/audits/.gitkeep
${CLAUDE_PROJECT_DIR}/research/reference/.gitkeep
${CLAUDE_PROJECT_DIR}/research/discovery/.gitkeep
${CLAUDE_PROJECT_DIR}/research/bin/.gitkeep
${CLAUDE_PROJECT_DIR}/research/reviews/.gitkeep
${CLAUDE_PROJECT_DIR}/source-material/.gitkeep
```

Each `.gitkeep` is empty (zero-byte file). These exist solely to make Git track the empty directories until real content arrives.

### 3a-2. Install the workflow-position helper

Copy the plugin's position helper into the project so the agent can compute "where am I" from the files instead of inferring it from the conversation (see `${CLAUDE_PLUGIN_ROOT}/reference/workflow-ownership.md`). Read `${CLAUDE_PLUGIN_ROOT}/reference/where-am-i.py` with the Read tool, then write it verbatim to `${CLAUDE_PROJECT_DIR}/research/bin/where-am-i.py` with the Write tool.

It must live inside the project, not be run from the plugin directory: the project tree is what every surface can reach in-sandbox, including Cowork. The agent invokes it as `python3 research/bin/where-am-i.py research`. (Docs are read from `${CLAUDE_PLUGIN_ROOT}`; only the executable is copied in — reading a plugin doc works on every surface, but executing a plugin-root script may not.)

### 3a-3. Install the review-protocol kit (the credibility gate)

The project adopts **review protocol v1** — project completion gates on an independent
adversarial corpus review, computed by a deterministic validator. Install its three
pieces (the STATE template in Step 5 carries the fourth, the `Review protocol: v1`
header line — all four travel together; a partial install is protocol damage that fails
closed):

1. **The validator.** Read `${CLAUDE_PLUGIN_ROOT}/reference/validate-corpus-review.py`
   and Write it **verbatim** to
   `${CLAUDE_PROJECT_DIR}/research/bin/validate-corpus-review.py`. Byte-exact matters:
   the closeout compares this installed copy's SHA-256 against the plugin's shipped
   trust contract, and any drift fails closed.
2. **The marker.** Read `${CLAUDE_PLUGIN_ROOT}/reference/templates/review-protocol.json`,
   set `"adopted"` to today's date (`YYYY-MM-DD`), and Write it to
   `${CLAUDE_PROJECT_DIR}/research/reference/review-protocol.json`. It is a version pin,
   never an authority.
3. **Sanity run.** `python3 research/bin/validate-corpus-review.py --self-test` must end
   green. If it does not, stop and report — do not scaffold a project onto a damaged
   validator.

### 3b. Pre-allow researcher's tools in the project settings

Write or merge `${CLAUDE_PROJECT_DIR}/.claude/settings.json` to pre-allow the tools researcher uses. This eliminates per-invocation permission prompts in Claude Code (the file is inert in Cowork — Cowork has its own permission model).

**Read the file first.** If it does not exist, create it with this content:

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "WebFetch",
      "Read",
      "Write",
      "Edit",
      "Grep",
      "Glob",
      "Bash(tvly:*)",
      "Bash(npx:*)",
      "Bash(ls:*)",
      "Bash(mv:*)",
      "Bash(python3:*)",
      "Bash(codex:*)"
    ]
  }
}
```

**If the file already exists**, merge additively: read the existing JSON, ensure `permissions.allow` is an array, append any of the entries above that are not already present, write it back. Never overwrite a top-level key the user already set. If `permissions.allow` exists but is not an array, surface the discrepancy to the user and skip the merge — don't silently overwrite a hand-tuned config.

The pattern mirrors `/intel-setup` in the `intelligence-briefing` plugin — additive merge, never replace.

## Step 4: Generate the Research Plan

**Where this runs.** Plan generation runs inline in your own (the main agent's) context on all
surfaces — Claude Code and Cowork behave identically. Do not delegate plan generation to a
subagent.

Finalize the internal research profile now that the user's complete challenge and all supplied
source material have been read. Preserve the exact subject. You may change the provisional
primary type or add/remove secondary lenses when the material supports it; record the rationale
in the plan rather than asking the user to adjudicate internal taxonomy. Ask only if the remaining
choice would materially change the commissioned deliverable or evidence rules and the user's
stated use does not resolve it.

Read the inferred primary type template from `${CLAUDE_PLUGIN_ROOT}/reference/templates/types/<research-type>.md` to get the base finding tags, validation standards, reference phase pattern, and credibility hierarchy.

Read the primary type-channel map from `${CLAUDE_PLUGIN_ROOT}/reference/discovery/type-channel-maps/{research-type}.md`. You'll use this content to produce the discovery strategy alongside the research plan.

If the inferred research profile includes a material secondary lens, also read that lens's type template and type-channel map. Secondary templates may contribute missing questions, standards, or discovery channels, but they do not replace the primary type's machine-readable field or automatically add every secondary finding tag. The generated discovery strategy may route individual phases through channels from either map; `/know-research:discover` uses the pre-matched strategy before its single-type fallback.

The plan is grounded in:
- The inferred research profile: one primary type, any material secondary lenses, the intended deliverable, and the rationale
- The user's research challenge and verbal context (preserved verbatim)
- The full contents of `research/source-material-digest.md` if it exists (the structured facts extracted from every file in `source-material/` during Step 2). If no digest exists because `source-material/` was empty, say so plainly in the plan and proceed on the user's research challenge plus whatever preliminary research you actually perform in Step 4.

**State the grounding you actually have, and never more.** Step 4 asks you to do preliminary research before deriving phases, and where you do it, saying the plan is grounded in it is correct. What is forbidden is claiming it when it did not happen — "grounded in preliminary research into the subject's public presence, repository, and release history" written by a run that searched nothing. Retrieval is not always available: a sandbox may have no web tool, a CLI may be missing, a source may be unreachable. That is a fine outcome and an honest sentence covers it — *"no source material was supplied and preliminary research was not available in this environment; this plan derives from your description of the challenge."*

This matters more here than anywhere else in the plugin. A plan that claims a grounding it lacks is a fabrication in the project's very first artifact, it is the one every later phase is built on, and nothing downstream ever re-checks it.

**And the same rule governs every result you report, not only the grounding.** Report the result you actually got, from the invocation you actually ran. If a check needed a flag or an environment variable supplied by hand to succeed, that is part of the result and it goes in the report — "the gate returned 12 once I pointed it at the plugin root" is honest; "the gate returned 12, the protocol is intact" is not, when the plain invocation returned 11. Observed: a run reported exit 12 and protocol-intact while its own notes recorded that 12 came only from a hand-set path. The honesty rule was being held for the grounding line and not generalized, which is how a rule stated for one surface leaves the next one uncovered.

**The same rule runs in the other direction: try before you report that you couldn't.** "No retrieval was available in this environment" is a claim about the environment, and it needs an actual attempt behind it exactly as "grounded in preliminary research" needs actual research. Observed in the same round: two runs told the user retrieval was unavailable with no attempted call anywhere in their transcript, while a third ran the search for real and got results — so the first two were reporting an assumption as a finding, and they were wrong. Make the attempt, and let what happens decide what you say. An under-claim is friendlier than an over-claim and it is the same defect.
- The supplied files themselves, available whenever the digest needs verification or added context
- The primary type template content and any material secondary template content
- The audience, intended use, and evidence calibration
- The primary type-channel map and any material secondary type-channel maps

### Plan Generator Instructions

You are generating a research plan for a structured AI-assisted research project. Your output is the content for a `research-plan.md` file that defines the entire research arc for a project.

**Audience calibration:** The evidence standard for this project is set by the audience, intended use, and stakes. Use that context to:
- Adjust the number of sources expected per phase (higher for external publication or investment due diligence, lower for personal knowledge building)
- Calibrate the level of triangulation required before a finding is treated as confirmed
- Set the tone of the success criteria (defensibility for investment research, accuracy for curriculum, understanding for personal research)
Do not override the evidence standard set by the audience. A personal knowledge project should not require academic-grade triangulation. An investment due diligence project should not accept single-source financial claims.

**Source Material Grounding — Non-Negotiable:**

Use the source-material digest as the planning index and consult the supplied files directly
where the digest is ambiguous, incomplete, or insufficient to support a phase decision. Do not
perform a ritual second reading solely because plan generation has begun.

Every substantive phase you generate must demonstrate engagement with the actual project. "Engagement" means its existence and questions are justified by a specific fact, entity, claim, uncertainty, dependency, or evidence gap found in the source material or preliminary research — not by the type label alone. Do not force a supplied document fact into a phase where it is irrelevant, and do not apply this requirement mechanically to the final Synthesis phase. A plan whose phase structure could have been produced from the type label alone is a failed plan.

If the verbal description and the source material disagree (e.g., the user says "I'm pursuing a PhD" but the provided resume shows a terminated Master's with no doctoral enrollment), DO NOT pick a side. Flag the discrepancy in the Assumptions section of the research plan as an open question, and phrase Phase 1 so that it can resolve the discrepancy before committing to a framing.

If `source-material/` is empty (no digest, no files), ground the phase structure in the user's challenge and preliminary research instead.

**Your job:** Generate a complete research plan with:

1. **A Core Question** — One paragraph framing what this research needs to answer
2. **Source Material Location** — Where to find the document/topic being researched
3. **Research Phases** — Each with:
   - A clear name
   - What the source material assumes (or what needs to be understood)
   - The smallest sufficient set of specific validation/research questions
   - The output filename
4. **A Synthesis Phase** — Final phase pulling everything together into the commissioned deliverable
5. **Source Priority** — What kinds of sources are most valuable and what to be skeptical of
6. **Success Criteria** — When the research is done

**Phase Generation Rules:**

The type template loaded above contains a reference phase structure for a typical project of
that kind. Treat it as a starting hypothesis, not a checklist and not a phase-count target.
Numeric ranges in a type template describe historical typicality only; they do not constrain
this plan.

Before deriving phases, do enough preliminary research to understand the subject's actual
shape, likely evidence availability, contested areas, and terminology. Preliminary research
grounds the plan; it does not expand or redefine the user's subject.

Derive the actual phases in this order:

1. **Map the work.** Identify the distinct assumptions, claims, decisions, unknowns, and
   evidence clusters on which this specific Core Question depends. Use both the source material
   and preliminary research. These are candidate work units, not automatically separate phases.
2. **Apply the phase-boundary test.** Create a separate phase only when the candidate has a
   meaningfully distinct evidence base, method, dependency, decision, or auditable intermediate
   output. Merge candidates that would search substantially the same sources and resolve the
   same decision. Do not split work merely to make the plan look comprehensive or to match a
   template heading. Because every phase incurs a full Collect → Connect → Assess → Synthesize
   → Verify cycle, each phase must earn that operational cost.
3. **Compare with the reference structure.** Where a template phase maps cleanly onto a real
   cluster, preserve its intent and, where useful, a recognizable discovery keyword in the phase
   name. Make the full name specific to this subject. Where a template phase has no corresponding
   cluster, drop it. Where the project surfaces a cluster the template does not anticipate, add
   it rather than forcing it into the nearest template phase.
4. **Set the count from genuine complexity.** Phase count is an output of the decomposition,
   never an input. A thin public footprint, narrow document, or tightly scoped question should
   produce fewer phases. A sprawling, contested, or multi-entity question may produce more. Do
   not pad or compress the plan to land inside the template's typical range. If the resulting
   architecture departs materially from the reference pattern, note the project-specific reason
   briefly under the plan's Research Profile & Phase Design assumption.
5. **Order by dependency.** Put identity, scope, definition, or feasibility questions before
   phases that depend on their answer, even when the reference template orders them differently.
   Do not preserve template order at the expense of the actual reasoning sequence.
6. **End with Synthesis.** The final phase always integrates the preceding audited findings into
   the commissioned deliverable. It does not exist to collect a new generic batch of sources.

**Grounding check:** Before finalizing the list, ask of every non-synthesis phase: "Could this
exact phase, with this name and purpose, have been generated from the research-type label without
reading the user's material or doing preliminary research?" If yes, it is generic. Replace it
with a phase grounded in an actual fact, entity, claim, dependency, or evidence gap—or remove it
if no project-specific need justifies it.

**Hybrid and imperfect-fit projects:** If the challenge spans multiple types, say so in the
Research Profile & Phase Design assumption and derive phases from the cluster method above. Do
not force the phase structure into a single template. Retain one inferred primary type solely
for machine-readable compatibility and base standards; use secondary templates and channel maps
where they materially improve specific phases. Build those cross-type channel choices directly
into `research/discovery/strategy.md`, which takes precedence over the primary-type fallback.

**Output format:**

```markdown
# Research Plan: [Project Title]

**Plan status:** Proposed — review this framing and phase structure before starting Phase 1.
**Research Subject:** [exact subject as provided by the user]

## Research Profile & Phase Design

- **Primary research type:** [inferred type used for base standards and fallback routing]
- **Secondary lenses:** [material secondary types, or "none"]
- **Intended use and deliverable:** [what the research will support and produce]
- **Evidence calibration:** [audience, stakes, and required defensibility]
- **Phase design rationale:** [one sentence explaining the project-specific decomposition;
  explicitly explain material departures from the primary template's reference structure]

## The Core Question

[One paragraph framing what this research needs to answer]

## Source Material Location

[Where to find the primary document/subject]

## Assumptions

These assumptions shape what evidence this research will find. Review them before starting Phase 1 — if any are wrong, correct them now. Changing an assumption after sources are collected means rework.

- **Date range:** [e.g., "2023–2026 data preferred" or "Historical: 2010–2020"]
- **Geographic scope:** [e.g., "US market" or "Global" or "EU regulatory context"]
- **Entity scope:** [e.g., "Apple Inc. (AAPL), not Apple Records" or "Both public and private companies"]
- **Financial lens:** [e.g., "Revenue and ARR" or "990 program expenses" — only for types where this applies]
- **Regulatory context:** [e.g., "US SEC filings" or "No regulatory focus" — only for types where this applies]
- [Any other assumption that constrains what sources the research will seek]

Remove lines that don't apply to this research profile. Add assumptions specific to the topic that aren't covered above.

---

## Phase 1: [Phase Name]

**What [the PRD assumes / the thesis claims / needs to be understood]:** [Description]

**What needs [validation / exploration / analysis]:**

1. [Specific question]
2. [Specific question]
...

**Output:** `[##-phase-slug].md`

---

[Repeat for each phase. The project-level workflow contract governs every phase; do not duplicate
the same cycle instructions inside each phase entry.]

---

## Phase N: Synthesis

**Goal:** [What the synthesis produces]

**Outputs:**
- `[commissioned-deliverable].md`
- [Any supporting artifact required by the intended use, such as an evidence map, limitations
  register, or recommendations. Do not create an executive summary, full report, or recommendation
  file unless the commissioned use benefits from it.]

---

## Source Priority

**Highest value sources:**
- [Source type and why]

**Be skeptical of:**
- [Source type and why]

## Success Criteria

Generated from reference/completion-criteria.md (the canonical stable-ID list — the
corpus-review gate rejects ID drift between the two):

- **SC-1** — [Criterion — specific and checkable; a criterion that cannot fail is not a criterion]
- **SC-2** — [Criterion]
...
```

**Success-criteria rules (the credibility gate reads these):** every criterion carries a
stable ID `**SC-N**` in exactly that bold form; the set here must match
`research/reference/completion-criteria.md` exactly — same IDs, no more, no fewer.
Never bold-format any *other* hyphenated identifier in the plan (a `**A-1**` or
`**KPI-2**` token would read as a criterion ID to the validator and register as drift);
plain text for those. Criteria are checkable outcomes ("every output passed its claim
audit"), never activities ("do research on X").

**Subject Identity Rules — Non-Negotiable:**

These rules exist because agents can confabulate a subject when the provided description is ambiguous. If you get the subject wrong, every subsequent phase, source, and output will be wrong. There is no recovery from this error downstream.

- **Use only what the user explicitly provided.** The subject of this research is exactly what the user described — no more. Do not infer, assume, or substitute a subject based on partial matches, similar names, or what "seems most likely."
- **If the topic is ambiguous, stop and ask — do not guess.** If the user says "research the Stripe plugin" but there are multiple Stripe plugins or it's unclear which one, ask for clarification before proceeding. Do not resolve the ambiguity yourself. A wrong guess wastes the entire research effort.
- **If a URL or document was provided, that is the subject.** Do not pivot to a different URL, repository, or document you find during preliminary research, even if it seems more authoritative, more recent, or "closer" to what you think the user wants.
- **Do not expand the subject scope based on preliminary research.** If the user provided a narrow topic, keep it narrow. Preliminary research is to understand the topic, not to redefine it.
- **State the subject explicitly at the top of the research plan.** Before the Core Question, write: "**Research Subject:** [exact subject as provided by the user]". This makes the grounding visible and auditable.

**Common Failure Modes — Plan Generation:**

| Failure Mode | Prevention |
|---|---|
| Misidentifying the research subject — generating a plan for a similarly-named but wrong entity | State the exact research subject at the top of the plan. If the topic is ambiguous, stop and ask. Do not resolve ambiguity by picking the most likely match. |
| Generic phases — questions that could apply to any company/topic rather than this specific one | Every question should reference something specific about the subject. "What is the market size?" is generic. "Does the claimed $4.7B TAM hold up against independent estimates?" is specific. |
| Over-scoping — turning every template heading or minor sub-question into a phase | Apply the phase-boundary test. Merge work that shares an evidence base and resolves the same decision; remove phases whose operational cost is not justified. |
| Under-specifying source priority — vague "be skeptical of marketing" without naming specific source types | Name the specific source types that mislead for this topic. For a startup: press coverage that parrots founder claims. For a non-profit: self-reported impact metrics. |
| Silent assumptions about scope — defaulting to a date range, geography, or entity without stating it | Every assumption that constrains what evidence the research will find must be stated in the Assumptions section. Derive assumptions from the topic and user context — do not default. If the topic says "US pricing" the geographic scope is US. If it says "pricing" with no qualifier, state the assumed scope explicitly so the user can correct it. |

**Quality Standards:**
- Every question must be specific enough that a researcher knows what to search for
- Questions must be answerable with available evidence; name any dependency on internal access,
  paid data, primary research, or unavailable material
- Phase names must be descriptive and scannable
- Output filenames follow the pattern: `##-slug.md`
- Synthesis produces the commissioned deliverable and only the supporting artifacts its use requires
- Be specific in "be skeptical of" — name source types that tend to mislead for this topic

Perform enough preliminary research, using the strongest available retrieval route, to make the
phases and questions project-specific. Derive date range and scope from the actual question rather
than a default. Preliminary research informs the plan; it never changes the subject the user gave.

Write the final research plan to `${CLAUDE_PROJECT_DIR}/research/research-plan.md`.

**Discovery Strategy Generation:**

After generating the research plan, also produce `${CLAUDE_PROJECT_DIR}/research/discovery/strategy.md`. Use the primary type-channel map and any material secondary maps provided to you.

For each phase in the research plan you just generated:
- Search the primary and any loaded secondary type-channel maps for Discovery Groups whose
  purpose and phase keywords match the phase's actual evidence needs. Do not match on name alone.
- If one map matches, record the highest-value primary and secondary channels from that group.
- If multiple maps contribute materially different channels, combine only the channels justified
  by this phase and record which lens contributed each choice. Do not union whole channel lists.
- If no Discovery Group matches but the phase requires new evidence, select channels from the
  loaded maps and channel playbooks based on the source types needed, and label the routing basis
  `project-specific`. A missing keyword match is not proof that discovery is unnecessary.
- Record `no discovery — uses existing sources` only when the phase genuinely synthesizes or
  analyzes material already collected. The final Synthesis phase normally takes this route.

Write `${CLAUDE_PROJECT_DIR}/research/discovery/strategy.md` with this format:

```markdown
# Discovery Strategy: [Project Title]

This file maps each research phase to its highest-value discovery channels.
Generated by /know-research:init — read automatically by /know-research:discover.

**Primary research type:** [type]
**Secondary lenses:** [types or none]

---

## Phase 1: [Phase Name]
**Routing basis:** [primary type / secondary lens / project-specific]
**Primary channels:** [channel1], [channel2]
**Secondary channels:** [channel3], [channel4]

## Phase 2: [Phase Name]
**Primary channels:** [channel1]
**Secondary channels:** [channel2], [channel3]

[...repeat for each phase with a Discovery Group match...]

## Phase N: [Phase Name]
no discovery — uses existing sources

[...etc for phases without a matching Discovery Group...]
```

---

Once `${CLAUDE_PROJECT_DIR}/research/research-plan.md` and `${CLAUDE_PROJECT_DIR}/research/discovery/strategy.md` are written, proceed to Step 5.

## Step 5: Assemble and Write Files

### CLAUDE.md

Assemble a slim CLAUDE.md by combining:

0. **Research Type Field** — A single line at the very top of the file: `research-type: {type}` where `{type}` is the kebab-case inferred primary research type (e.g., `company-for-profit`, `market-industry`, `company-non-profit`, `prd-validation`, `competitive-analysis`, `person-research`, `exploratory-thesis`, `curriculum-research`, `presentation-research`, `opportunity-discovery`, `customer-safari`). This machine-readable compatibility field lets the discover skill select its fallback type-channel map. It does not constrain the phase structure; project-specific and cross-type routing lives in `research/discovery/strategy.md`.

1. **Project Purpose** — Generated from the user's research challenge, intended use, and inferred profile. One paragraph describing what this research project does and why.

2. **Audience & Evidence Standard:**

This research is for: [user's audience, intended-use, and stakes answer, preserved verbatim]

State the evidence standard as the smallest sufficient set of consequences the research must
survive: who will rely on it, what decision or deliverable it supports, which claims need
independent corroboration, what uncertainty must remain visible, and what happens if a claim is
wrong. Derive these rules from the user's stated use and stakes. Do not assign a canned standard
solely because the audience resembles a familiar category.

Calibration anchors — non-binding starting points beneath the derive-from-stakes rule. When the
audience matches one of these commissioned anchors, include the matching guidance; when it
matches none, derive from stakes alone:
- **Internal decision-making:** Focus on directional accuracy and actionable findings. Single-source findings are acceptable when flagged. Speed matters — do not over-triangulate when the decision timeline is tight.
- **External publication:** Every claim must be fully sourced and triangulated. No single-source findings presented as established. All contradictions must be presented. Qualifiers are mandatory. This is the highest evidence bar.
- **Investment / due diligence:** Emphasis on verifiable numbers, risk identification, and red flags. Single-source financial claims are unacceptable. Cross-reference all quantitative claims. Skepticism toward self-reported metrics.
- **Pitch deck / fundraising support:** Evidence must be defensible under skeptical questioning. Focus on claims that will be challenged by investors. Flag any finding that relies on the company's own reporting.
- **Curriculum design:** Prioritize accuracy of mental models over precision of specific numbers. Focus on practitioner reality over theory. Flag areas where the field is actively debating — the curriculum must not present contested claims as settled.
- **Personal knowledge building:** Balanced depth — thorough but not exhaustive. Flag uncertainty but do not over-hedge. Optimize for understanding, not defensibility.

When the audience is not one of the above, calibrate based on: Who will read this? What decisions will they make from it? What happens if a claim turns out to be wrong?

Add this line after the calibration guidance: "This standard is compiled into `research/reference/evidence-standard.md` and enforced at the promotion gate — a claim that violates an enforceable rule fails `/know-research:audit-claims` unless you grant a named waiver, and the waiver rationale appears verbatim in the output's Methodology & Limitations section."

2a. **Working Posture** — a POINTER only. Copy no doctrine text into CLAUDE.md; the plugin ships the doctrine and CLAUDE.md points at it, so the two can never drift. The section reads exactly:

```markdown
## Working Posture

Conversational posture and response register are governed by the plugin's posture doctrine — read `${CLAUDE_PLUGIN_ROOT}/reference/posture-register.md` at session start and hold it for every turn. It governs the conversation the way the audit gate governs the outputs: the evidence machinery can hold perfectly while the conversation quietly fails.

## Workflow Ownership

Staying anchored to the research protocol across long, interrupted work is governed by the plugin's workflow doctrine — read `${CLAUDE_PLUGIN_ROOT}/reference/workflow-ownership.md` at session start and hold it for every turn. Your position in the workflow is a fact on disk, not a memory: at session start, after any `/clear`, and after any deep tangent, re-anchor by running `python3 research/bin/where-am-i.py research` and resuming from what it reports — never infer the next step from the conversation.
```

3. **Directory Structure:**

```
research/
├── research-plan.md          # Master research prompt (the assignment)
├── STATE.md                  # Persistent research state
├── sources/
│   └── registry.md           # Index of all processed sources
├── notes/                    # Structured notes per source
├── drafts/                   # Unaudited synthesis (written by /know-research:summarize-section)
├── outputs/                  # Audited, final sections (promoted by /know-research:audit-claims only)
├── audits/                   # Claim audit reports
├── reference/                # Protocol and standards reference files
│   ├── canonical-figures.json # Single source of truth for cross-phase numbers
│   ├── claim-graph.json       # Claim graph registry, written by /know-research:audit-claims
│   ├── completion-criteria.md # Canonical SC-N criteria — the completion gate binds to these
│   ├── decision-ledger.md     # Append-only disposition record — audits enforce it downstream
│   ├── evidence-standard.md   # Commissioned evidence rules — enforced at the audit gate
│   ├── backstage-tasks.md     # Agent's private prep queue (read at phase start)
│   └── retrieval-log.json     # Retrieval log registry, written by /know-research:discover
├── discovery/               # Discovery strategy and candidate sources
├── cross-reference.md        # Cross-source patterns
└── gaps.md                   # Coverage tracker
```

Do not create files outside this structure for research artifacts. Working files go in `research/`. Synthesized sections go to `research/drafts/` first. Only `/know-research:audit-claims` promotes a draft to `research/outputs/`. Nothing in `outputs/` should exist without a corresponding audit report in `audits/`.

**Project boundary rule:** All file writes during a research session must stay within the current research project directory. Do not write to other projects, system directories, or external paths — even when responding to a user request that could be handled by a skill designed for a different context (e.g., a note-capture skill pointed at another project). If the user wants to capture a note or action item, write it to `research/notes-to-self.md` within this project. Never invoke a skill that writes outside the current project directory.

4. **Skills:**

| Skill | Trigger | Job |
|-------|---------|-----|
| Init | `/know-research:init` | Scaffolds a new research project: directory structure, CLAUDE.md, STATE.md, reference files, research plan |
| Process Source | `/know-research:process-source <url-or-file>` | Processes raw source into structured note |
| Cross-Reference | `/know-research:cross-ref` | Finds patterns across all processed notes |
| Gap Tracker | `/know-research:check-gaps` | Maps research coverage, identifies holes |
| Claim Auditor | `/know-research:audit-claims <filepath>` | Fact-checks a draft against source notes |
| Summarize Section | `/know-research:summarize-section <name>` | Synthesizes notes into polished draft sections |
| Start Phase | `/know-research:start-phase` | Shows what's needed to begin the next phase |
| Phase Insight | `/know-research:phase-insight` | Analyzes current phase progress and thin areas |
| Graph Analysis | `/know-research:graph-analysis` | Analyzes the claim graph for load-bearing claims, fragile foundations, and cheapest confidence upgrades |
| Progress | `/know-research:progress` | Shows project dashboard with phase status |
| Discover Sources | `/know-research:discover` | Finds candidate sources for the current phase using type-aware multi-channel discovery |
| Review Corpus | `/know-research:review-corpus` | Runs the independent adversarial corpus review (the credibility gate's review run); project completion requires a passing final review set |

**Integrity agent:** `research-integrity` — runs automatically after `/know-research:summarize-section` writes a draft, and when `/know-research:init` or `/know-research:start-phase` integrate source material. It watches for fabricated data, range narrowing, qualifier stripping, cross-phase drift, unsourced claims, and confidence inflated beyond the per-finding source count. It is **not** auto-run after every source note — invoke it manually on a note if you want a note-level check.

5. **Workflow:**

**Research is phase-sequential.** You work one phase at a time, in order. Each phase completes its full cycle before the next phase begins. Do not collect sources for Phase 3 while working on Phase 1. Do not batch source collection across multiple phases. Do not invent phase groupings or reorder phases.

The cycle for each phase:

1. **Collect** — Start by running `/know-research:discover` to find candidate sources for the current phase, then use `/know-research:process-source` for each URL, PDF, or document relevant to the *current phase only*.
2. **Connect** — Run `/know-research:cross-ref` after every 5 new sources to find patterns. The cadence is owned by `/know-research:process-source`'s pre-check counter and `research/bin/where-am-i.py`'s threshold; STATE.md carries the counter. This is mandatory, not optional.
3. **Assess** — Run `/know-research:check-gaps` to confirm coverage for this phase. Fill gaps with more sources if needed.
4. **Synthesize** — Use `/know-research:summarize-section` to produce a draft in `research/drafts/`. This is NOT a final output.
5. **Verify** — Run `/know-research:audit-claims` on the draft. This is what promotes it from `drafts/` to `outputs/`. No exceptions.
6. **Transition** — Update STATE.md, mark the phase complete, recommend context clear, and only then begin the next phase.

`research/discovery/strategy.md` maps each phase to its highest-value discovery channels. The discover skill reads this file automatically.

Read the research plan in `research/research-plan.md` before starting. It defines the phases and their order.

**Enforcement rules — these are structural, not guidelines:**

- **Phases are sequential.** Complete Phase N's full cycle (collect → connect → assess → synthesize → verify) before starting Phase N+1. Do not collect sources for future phases. Do not batch work across phases. Do not group or reorder phases. The research plan defines the order — follow it.
- **Nothing reaches `research/outputs/` without passing `/know-research:audit-claims`.** `/know-research:summarize-section` writes to `research/drafts/`. `/know-research:audit-claims` checks the draft against source notes and, if it passes, moves it to `research/outputs/`. If it fails, the draft stays in `drafts/` with an audit report listing what needs fixing.
- **`/know-research:cross-ref` is mandatory after every 5 new sources.** The cadence is owned and enforced by `/know-research:process-source`'s pre-check counter and `research/bin/where-am-i.py`'s threshold — when the checkpoint is due, do not process another source before running `/know-research:cross-ref`. `research/cross-reference.md` must reflect current patterns at all times.
- **`/know-research:check-gaps` is mandatory before starting a new phase.** Do not begin Phase N+1 until `/know-research:check-gaps` has confirmed coverage status for Phase N. If gaps remain, fill them or document them explicitly in `research/gaps.md` with a reason they're acceptable.
- **Phase completion requires all five steps.** A phase is not complete until: sources collected for this phase, cross-reference is current, gaps are assessed, draft is written, and audit has passed. STATE.md should not mark a phase complete until all five are done.
- **The final phase — and the project — close only through the credibility gate.** This project carries review protocol v1: project completion requires an independent adversarial corpus review (`/know-research:review-corpus final`) plus the validator's gate verdict, and the completion write is performed by the validator (`research/bin/validate-corpus-review.py`), never by hand. No skill, and no conversation, can mark the project complete without a valid review set and zero open material findings. Manual completion instructions in this file apply to non-final phases only.
- **Canonical figures registry is the source of truth for cross-phase numbers.** When citing a number from a previous phase, check `research/reference/canonical-figures.json` first. If registered, use the canonical value. If not registered and this is a cross-phase citation, register it before using it. Never copy numbers from STATE.md summaries or conversation memory.
- **The decision ledger is the durable record of dispositions.** `research/reference/decision-ledger.md` is append-only: audit corrections, contradiction resolutions, accepted gaps, and commissioner directives are recorded there by the skills that own them, at decision time. Later work must honor a ledgered disposition or supersede it with a new entry citing the old ID and new evidence — a silent reversal is a high-severity audit finding. Never edit or delete an entry.
- **Never skip, fold, reorder, or merge phases without explicit user approval.** If `/know-research:check-gaps` reveals a phase has insufficient source coverage, tell the user and present options: (1) collect more sources to fill the gaps, (2) skip the phase with the user's explicit approval, or (3) fold the phase's questions into another phase with the user's explicit approval. Do not make this decision yourself. Do not record a phase-skip in STATE.md without the user confirming it on screen first.
- **Running `/know-research:discover` at the start of each phase is recommended but not mandatory.** It surfaces the highest-value sources for the current phase's questions via multi-channel discovery. Sources can still be found manually and processed with `/know-research:process-source`.

**Clear context between phases.** Each phase should start with a fresh context window. STATE.md and your research files carry everything forward — nothing critical lives in conversation history. A fresh context for each phase produces sharper analysis than a saturated one. Before clearing, ensure STATE.md is fully up to date with current position, completed work, and next action. After clearing, read STATE.md first before resuming work.

**Intra-phase clears are allowed at step boundaries when context is heavy.** The 5 steps within a phase (Collect → Connect → Assess → Synthesize → Verify) do not need to share conversation context — each step reads its own files and writes its own artifacts. When a single step consumes significant context (especially Collect with primary regulatory documents, large PDFs, or structured data files, or Synthesize with long source notes), you may clear context between that step and the next. The phase cycle continues from the same position after the clear.

**When to recommend an intra-phase clear:**

- **After Collect**, if the Collect batch processed 5+ sources AND any of the following apply: primary regulatory documents (990 XMLs, SEC filings, court records), large PDFs (>15 pages), structured data files (XML/CSV/JSON >50KB), or the context window estimate is above ~50% used.
- **After Synthesize**, if the draft is long (>3000 words) or the source notes being synthesized are unusually rich (>5 long-form notes), AND Verify is the next step.
- **Never mid-step.** Finish the current step (write all source notes, update STATE.md, complete pending file writes), then suggest the clear.
- **Never if the phase cycle has only one step remaining.** If you're finishing Verify, the next clear is the phase-level clear — don't double-clear.

**How to recommend an intra-phase clear:**

At the end of a step where the criteria above apply, run the session debrief first: (1) append a Working Read entry to `research/commonplace.md` (commonplace trigger 5 — in-flight hypotheses and half-formed reads, so the next session re-adopts the thinking, not just the position), (2) update STATE.md with a step-specific "Next Action" (see State Management section). Then render the transition prompt (format defined in `${CLAUDE_PLUGIN_ROOT}/reference/prompt-templates-guide.md`, Example 4) pointing at `/clear` followed by the next step's command. The user decides whether to accept — if they decline, continue to the next step in the same context window.

**How to resume after an intra-phase clear:**

On the next session, read STATE.md first. The "Cycle step" field tells you which step is active. The "Next Action" field is a specific command — execute it. Do not re-read prior step artifacts unless the current step's skill instructs you to.

**At the end of every phase, render the transition prompt** (format defined in `${CLAUDE_PLUGIN_ROOT}/reference/prompt-templates-runtime.md`):

───────────────────────────────────────────────────────────

**▶ NEXT:** `/clear` then `/know-research:start-phase` — Start Phase [N+1] with a fresh context window.

**Also available:**
- `/know-research:progress` — See the overall project dashboard.
- `/know-research:check-gaps` — Confirm coverage for Phase [N] before moving on.

**What to expect:** Phase [N] is complete — STATE.md is updated and any capture-worthy observations have been appended to commonplace.md. A fresh context window gives sharper analysis for Phase [N+1]; start-phase will brief you on what the new phase needs.

───────────────────────────────────────────────────────────

If no entries were added to commonplace.md during the phase, replace the middle clause of "What to expect" with "No commonplace observations were captured this phase" — do not invent entries just to have something to mention.

6. **[Primary Type] Standards** — Include from the inferred primary type template:
   - The "What to Validate/Explore/Analyze" section
   - The "Finding Tags" section

7. **State Management:**

Research state lives in `research/STATE.md`. It is the source of truth for project position — not memory, not conversation history, not file timestamps.

On every new session or after context clear: Read `research/STATE.md` first. Don't start working until you know where you are. The "Current Phase Cycle" section tells you exactly which step you're on — pick up there. **If STATE.md records any skipped, folded, or deferred phases, report this to the user before resuming work.** The user may not have been present when that decision was made — surface it explicitly so they can confirm or reverse it.

During work: Update state at every transition — phase start/end, meaningful task completion, user decisions. Check off cycle steps as they complete. Write state BEFORE doing anything expensive in case of compaction. A PreCompact hook will warn you if STATE.md is stale, but don't rely on it — update proactively.

The "Active phase" field in STATE.md tells you which phase to work on. Do not work on any other phase. When the current phase's cycle checklist is fully checked, mark it complete, generate the next phase's cycle checklist, and update "Active phase."

**Step-level updates for intra-phase clear support.** At the end of every step (Collect, Connect, Assess, Synthesize, Verify), update STATE.md's "Next Action" field with a specific command that points at the *next* step, not a phase-level description. Example: after finishing Collect for Phase 4, the Next Action should read "Run /know-research:cross-ref for Phase 4 — 6 sources are in research/notes/ ready for cross-referencing. Sources since last cross-reference: 6." This specificity is what makes an intra-phase clear safe — a session resume after the clear reads this field and knows exactly what command to run. Writing a phase-level Next Action ("Continue Phase 4") breaks intra-phase resume.

8. **Context Management:**

This is a long-running project. Clear context between research phases — each phase gets a fresh window for sharper analysis. STATE.md is the source of truth that carries everything forward. Before clearing context, always update STATE.md with current position, completed work, key decisions, and next action — and if the clear lands mid-phase, append a Working Read entry to commonplace.md (trigger 5) so the in-flight reasoning survives, not just the position. After clearing or starting a new session: read `research/STATE.md` first. If unsure what's been done, run `/know-research:check-gaps` before starting new work.

9. **Commonplace Book:**

Research Agent maintains `research/commonplace.md` as a running record of observations worth preserving across context clears. This is NOT a research output, NOT a source note, NOT a draft, and NOT part of any audit or gate. It is never read by synthesis or the audit gate; the one skill that reads it is `/know-research:start-phase`, which re-adopts recent Working Read entries at phase start so the in-flight thinking survives a context clear (not just the position). It also exists so the user can come back later and find observations the agent made in the moment.

**Append to `research/commonplace.md` at the end of any turn in which your response contained any of the following:**

1. **A strategic implication derived from the research but not part of the research output.** Example: after processing 990 filings, you observe that the actual financial picture is materially worse than the board has been working with, and that may be a disclosure issue the Treasurer should know about. The financial facts go in source notes. The strategic implication for the user-as-board-member goes in the commonplace book.

2. **A cross-cutting observation** that connects current evidence to something outside the current phase's scope. Example: a source from Phase 3 contains information relevant to a claim in Phase 1 that was already audited. Note it so the user knows to revisit.

3. **Mid-reasoning synthesis** that you produced in chat but that does not land in a draft, output, or source note. Example: while explaining the decision between two options, you produce a paragraph of synthesis that captures *why* the decision matters — not the decision itself (which goes in STATE.md or notes-to-self.md) but the reasoning that makes it consequential.

4. **An explicit user request** — "note this," "remember this," "capture that" or anything equivalent. This is the highest-priority trigger — the user is telling you directly.

5. **A contact boundary mid-phase.** Whenever you recommend a context clear (intra-phase or end-of-phase) or the session is winding down mid-cycle, append a **Working Read** entry before the boundary: the hypotheses currently in play, what the last few sources are confirming or challenging, and any half-formed read that hasn't landed in a draft or note yet. Position data (which step, what command is next) belongs in STATE.md's Next Action, not here — this entry preserves the *thinking* that would otherwise evaporate with the context. Use the standard entry format with the hook "Working Read at [step] boundary."

**Do NOT append for:**
- Routine status updates ("processed source 12, added to notes")
- Re-statements of what's already in a source note, draft, or output
- Decision options you're presenting to the user — those are conversation artifacts
- Generic conversational acknowledgments

**When in doubt, append.** The file is cheap to maintain and scannable. Missing an observation the user wanted to keep is a worse failure than capturing one too many.

**Entry format:**

```markdown
## [YYYY-MM-DD] — Phase [N] — [one-line hook]

[The agent's observation in its own voice. Preserve the reasoning, not just the conclusion. Include enough context that this entry makes sense when read weeks later without the surrounding conversation.]
```

**Append timing:** Append at the end of the turn, before relinquishing control. If you produced a capture-worthy observation and the user's next message might be `/clear` or a context reset, appending before you end the turn is the last opportunity. Do not wait for the user to ask.

**Do not ask permission.** Appending is a background behavior, like updating STATE.md. Asking "should I save this?" relies on the user recognizing in the moment which observations matter — which is the exact failure mode this file is designed to prevent.

10. **Boundaries** — From the inferred primary type template, supplemented only by any material phase-specific boundary from a secondary lens.

11. **Reference Protocols:**

Detailed protocols are in `research/reference/`. Read the relevant file when you need the full protocol:

| Protocol | File | Read When |
|----------|------|-----------|
| Source & Evidence Standards | `research/reference/source-standards.md` | Processing sources, citing evidence, assessing credibility |
| Writing & File Standards | `research/reference/writing-standards.md` | Writing output sections, naming files |
| Tools Guide | `research/reference/tools-guide.md` | Using tvly, firecrawl-cli, and WebSearch/WebFetch for research discovery and extraction |

Write the assembled CLAUDE.md to `${CLAUDE_PROJECT_DIR}/CLAUDE.md`.

### Reference Files

Read each source and Write to the destination — do not use Bash `cp`, which can trigger permission prompts and obscures the operation in the transcript.

1. Read `${CLAUDE_PLUGIN_ROOT}/reference/writing-standards.md` → Write to `${CLAUDE_PROJECT_DIR}/research/reference/writing-standards.md`
2. Read `${CLAUDE_PLUGIN_ROOT}/reference/tools-guide.md` → Write to `${CLAUDE_PROJECT_DIR}/research/reference/tools-guide.md`

### source-standards.md

Read `${CLAUDE_PLUGIN_ROOT}/reference/templates/source-standards.md` as a template. Replace the `[INSERT THE SOURCE CREDIBILITY HIERARCHY FROM THE MATCHING TYPE TEMPLATE]` placeholder with the Source Credibility Hierarchy from the inferred primary type template. If a secondary lens introduces a materially different source standard needed by a specific phase, add that standard explicitly and label the phase or claim family to which it applies; do not paste a second hierarchy wholesale. Write the result to `${CLAUDE_PROJECT_DIR}/research/reference/source-standards.md`.

### STATE.md

Use this template, customized with data from the generated research plan:

```markdown
# Research State

Review protocol: v1

**Phases are sequential. Complete the current phase's full cycle before starting the next. Do not batch work across phases.**

## Current Position
- Active phase: 1 — [Phase 1 Name]
- Cycle step: Collect (1 of 5)
- Blocking on: Nothing — ready to start.

## Current Phase Cycle

Each phase must complete all five steps in order. Check off each step as it is completed. Do not skip steps. Do not mark a phase complete until all five are checked.

### Phase 1: [Name]
- [ ] **Collect** — Sources gathered for this phase's questions (start with /know-research:discover)
- [ ] **Connect** — `/know-research:cross-ref` run, cross-reference.md current
- [ ] **Assess** — `/know-research:check-gaps` run, coverage confirmed for this phase
- [ ] **Synthesize** — `/know-research:summarize-section` run, draft in `drafts/`, integrity checked
- [ ] **Verify** — `/know-research:audit-claims` passed, output promoted to `outputs/`

When all five are checked, mark this phase complete below, update "Active phase" to the next phase, and generate a new cycle checklist for that phase. **Exception — the final phase:** never mark the final phase complete or write any completion sentinel by hand. The project closes only through the validated corpus-review closeout in `/know-research:audit-claims` (the validator performs the completion write after the independent corpus review passes).

## Completed Phases
[Generate a checklist from the research plan phases, e.g.:]
- [ ] Phase 1: [Name]
- [ ] Phase 2: [Name]
...
- [ ] Phase N: Synthesis

## Key Decisions
- Project initialized [TODAY'S DATE]
- Primary research type: [TYPE]
- Secondary research lenses: [TYPES OR NONE]
- Proposed research plan structured around [N] project-derived phases
- Finding tags: [TAGS FROM TYPE TEMPLATE]
- Canonical figures registry active at `research/reference/canonical-figures.json`

## Sources Processed
- Total count: 0
- Sources for current phase: 0
- Sources since last cross-reference: 0
- Last cross-reference: N/A
- Last gap check: N/A

**Cross-ref is due when "Sources since last cross-reference" reaches 5.** Do not process a 6th source without running `/know-research:cross-ref` first. `/know-research:cross-ref` resets this counter to 0. The cadence is owned by `/know-research:process-source`'s pre-check and `research/bin/where-am-i.py`; this file carries the counter they read.

## Next Action
Begin Phase 1: Collect sources relevant to Phase 1 questions only.

<!--
The Next Action field is updated at every step boundary so that a session resume (including after an intra-phase clear) can pick up with a single, specific command. Example formats:

- "Run /know-research:discover for Phase 4 — no sources collected yet."
- "Run /know-research:cross-ref for Phase 4 — 6 sources are in research/notes/ ready for cross-referencing. Sources since last cross-reference: 6."
- "Run /know-research:check-gaps for Phase 4 — cross-reference.md is current. Gap check is mandatory before Synthesize."
- "Run /know-research:summarize-section for Phase 4 — gaps assessed, draft is next."
- "Run /know-research:audit-claims research/drafts/04-phase-name.md for Phase 4 — draft written and integrity-checked."

This field should always read like a command the user can execute, not a phase-level description ("Continue Phase 4" is too vague — a session resume can't act on that).
-->
```

Write to `${CLAUDE_PROJECT_DIR}/research/STATE.md`.

### Other Files

- Read `${CLAUDE_PLUGIN_ROOT}/reference/templates/registry.md` → Write to `${CLAUDE_PROJECT_DIR}/research/sources/registry.md`

- Write `${CLAUDE_PROJECT_DIR}/research/gaps.md` — use phase names from the generated research plan:

```markdown
# Research Coverage Gaps

Tracks what's been covered and what's still missing across all research phases.

[Generate a section for each phase, e.g.:]

## Phase 1: [Name]
- Coverage: Not started
- Gaps: All questions open

## Phase 2: [Name]
- Coverage: Not started
- Gaps: All questions open

[...etc for all phases]
```

- Write `${CLAUDE_PROJECT_DIR}/research/audits/gate-log.md`:

```markdown
# Gate Log

Promotion authorization log for writes to research/outputs/. The PreToolUse hook in the researcher plugin (Claude Code only) reads the most recent row of this table to authorize a Write/Edit/MultiEdit targeting research/outputs/. /know-research:audit-claims appends a `pass` row immediately before promoting a draft.

| Timestamp | Action | Result | File | Detail |
|-----------|--------|--------|------|--------|
```

- Write `${CLAUDE_PROJECT_DIR}/research/outputs/.gate-policy.md` with the following content (this file documents the gate for humans reading the directory; the hook itself reads gate-log.md):

```markdown
# Output Directory Gate Policy

Files in `research/outputs/` are promoted from `research/drafts/` by `/know-research:audit-claims` only. Direct Write/Edit/MultiEdit operations targeting this directory are blocked by a PreToolUse hook (Claude Code) until an authorizing row appears in `research/audits/gate-log.md` (within the last 120 seconds, result: pass, matching file path).

The hook is inert in Cowork — Cowork has no PreToolUse hooks. In Cowork the gate is structural-only: `/know-research:audit-claims` is the only skill that writes here. Don't bypass it.

The hook does not gate Bash operations (`mv`, `cp`, `rm`). `/know-research:audit-claims` typically uses `mv` for the promotion itself; the gate-log row is the durable audit-trail record of the authorization decision regardless of which tool performed the move.

If you find yourself wanting to bypass the gate, you almost certainly want to re-run `/know-research:audit-claims` on the relevant draft instead. The gate exists to keep unaudited content out of the published outputs.
```

- Read `${CLAUDE_PLUGIN_ROOT}/reference/templates/cross-reference.md` → Write to `${CLAUDE_PROJECT_DIR}/research/cross-reference.md`

- Read `${CLAUDE_PLUGIN_ROOT}/reference/templates/canonical-figures.json` → Write to `${CLAUDE_PROJECT_DIR}/research/reference/canonical-figures.json`

- Write `${CLAUDE_PROJECT_DIR}/research/reference/evidence-standard.md` — the compiled, enforceable form of the user's audience, intended-use, and stakes answer. `/know-research:audit-claims` reads this file at every promotion gate. Derive the smallest sufficient set of concrete, testable rules from the user's stated use and stakes — each rule must be checkable against a draft and its source notes (a rule that can't fail a specific claim is not a rule). Structure:

```markdown
# Evidence Standard

Compiled by /know-research:init from the audience answer. Read by /know-research:audit-claims at every promotion gate — a claim that violates an enforceable rule fails the audit unless the commissioner grants a named waiver.

**Audience and intended use:** [user's answer, verbatim]
**Calibration:** [the matched audience category, or "custom"]

## Enforceable rules

- [Concrete, testable rules derived from this project's stated use and stakes — each must be able to pass or fail a specific claim. Non-binding anchor examples by audience: investment/due diligence — "Every quantitative financial claim requires 2+ independent sources; single-source financial claims are unacceptable." external publication — "No single-source finding may be presented as established; source qualifiers are mandatory in the draft." internal decision-making — "Single-source findings are acceptable only when flagged with 'single source suggests' language." Write the rules that fit THIS project's stated use — do not copy all the examples, and do not import a preset standard the stakes don't justify.]

## Waiver protocol

The commissioner may waive a specific violation with `waive: <claim> — <rationale>`. The waiver is recorded when it is granted — audit report, gate log, and verbatim in the output's Methodology & Limitations section — and the draft promotes on the next audit run. Waivers are per-claim, never blanket. Only audience-standard violations are waivable; evidence-accuracy findings (unsupported claims, misrepresented sources, figures that don't match their notes) have no waiver exit.
```

- Write `${CLAUDE_PROJECT_DIR}/research/reference/backstage-tasks.md` — the agent's private prep queue, distinct from the user-facing Next Action and from `notes-to-self.md` (user capture). Initial content:

```markdown
# Backstage Tasks

The agent's own prep queue — items the agent flagged for its own future attention ("the 18% figure looked shaky — re-verify against the original when Phase 4 touches financials"). Written at phase close by /know-research:audit-claims and whenever the agent spots something worth its own follow-up. Read and worked through silently by /know-research:start-phase at the next phase start; completed items are checked off with a one-line outcome.

Not a user-facing to-do list, not part of any gate. If an item needs the user's attention, it belongs in the debrief or notes-to-self.md instead.

---
```

- Write `${CLAUDE_PROJECT_DIR}/research/reference/completion-criteria.md` — the
  **canonical** completion-criteria file the corpus-review gate binds to. Read
  `${CLAUDE_PLUGIN_ROOT}/reference/templates/completion-criteria.md` for the header and
  rules, then replace the placeholder criterion lines with the exact criteria from the
  research plan's Success Criteria section — same `**SC-N**` IDs, same order, same text,
  unchecked boxes. The plan section was *generated from* this set; after writing both,
  confirm the ID sets agree exactly (the validator's `criteria-drift` check blocks the
  gate on any mismatch, in either direction).

- Read `${CLAUDE_PLUGIN_ROOT}/reference/templates/decision-ledger.md` → Write **verbatim** to `${CLAUDE_PROJECT_DIR}/research/reference/decision-ledger.md` — the append-only disposition record. Entries are appended later by the skills that own each decision class; init installs only the header and grammar. (On projects that predate this file, the writing skills create it from the same template on first use — absence is never an error.)

- Write `${CLAUDE_PROJECT_DIR}/research/reference/claim-graph.json` with initial content `{"claims": []}` — this is the claim graph registry, populated by `/know-research:audit-claims` during each phase's Verify step.

- Write `${CLAUDE_PROJECT_DIR}/research/reference/retrieval-log.json` with initial content `{"entries": []}` — this is the retrieval log registry, populated by `/know-research:discover` after each discovery run.

- Write `${CLAUDE_PROJECT_DIR}/research/commonplace.md` with the following initial content:

```markdown
# Commonplace Book

A running record of observations this agent made while working on the project that are worth preserving across context clears.

This file is NOT:
- A research output (those go in `research/outputs/`)
- A source note (those go in `research/notes/`)
- A draft (those go in `research/drafts/`)
- Part of any audit or gate (this file is never read by synthesis or audit skills)

This file IS:
- Strategic implications the agent derived from the research that aren't part of the research output itself
- Cross-cutting observations that connect current evidence to something outside the current phase's scope
- Mid-reasoning synthesis produced in chat but not committed to a draft or output
- Anything the user explicitly asked to remember or note

Entries are appended automatically by the agent when it produces an observation worth preserving. Each entry is dated and tagged with the phase it was produced during. The agent should append before ending a turn in which capture-worthy content was produced — including before recommending a context clear.

The file does not affect research outputs, audits, or synthesis. The one skill that reads it is `/know-research:start-phase`, which re-adopts recent Working Read entries at phase start so in-flight thinking survives a context clear. It also exists so the user can come back later and find what was observed in the moment.

---
```

## Step 6: Verify

Before reporting to the user, verify the scaffolding is complete:

1. **Run `ls ${CLAUDE_PROJECT_DIR}/research/`** — confirm all expected files and directories exist:
   - `research-plan.md`
   - `STATE.md`
   - `gaps.md`
   - `cross-reference.md`
   - `commonplace.md`
   - `sources/registry.md`
   - `drafts/` (directory exists)
   - `outputs/` (directory exists)
   - `outputs/.gate-policy.md`
   - `audits/gate-log.md`
   - `reference/source-standards.md`
   - `reference/writing-standards.md`
   - `reference/tools-guide.md`
   - `reference/canonical-figures.json`
   - `reference/claim-graph.json`
   - `reference/evidence-standard.md`
   - `reference/backstage-tasks.md`
   - `reference/retrieval-log.json`
   - `reference/completion-criteria.md`
   - `reference/decision-ledger.md`
   - `reference/review-protocol.json`
   - `bin/validate-corpus-review.py`
   - `reviews/` (directory exists, `.gitkeep` only)
   - `discovery/strategy.md`
   - `source-material-digest.md` (only required if `source-material/` contains non-dotfiles; skip otherwise)
2. **Read `${CLAUDE_PROJECT_DIR}/CLAUDE.md`** — confirm it references the twelve skills with `/research-*` qualified names and the correct finding tags for the inferred primary research type.
3. **Read `${CLAUDE_PROJECT_DIR}/research/STATE.md`** — confirm the phase checklist matches the research plan, the Phase 1 cycle checklist is present with all five steps unchecked, and the header block (before the first `##`) carries exactly one `Review protocol: v1` line.
3a. **Run the protocol gate sanity check:** `python3 research/bin/validate-corpus-review.py gate --root . --json --plugin-root "${CLAUDE_PLUGIN_ROOT}"` must exit **12** (`no-review`) — the correct state for a freshly adopted project (protocol intact, no review yet). Exit 10 means the kit install is partial (marker or STATE line missing); exit 24 means the plan and the canonical criteria file disagree on SC IDs — fix either before reporting.

   **Pass `--plugin-root` explicitly, and read exit 11 carefully — it has two causes that look identical and are not.** The flag defaults to `$CLAUDE_PLUGIN_ROOT`, so where that is unset the validator cannot reach the shipped contract and returns **11 `validator-mismatch`** — the same code it returns when the installed validator has genuinely drifted from the plugin's. Measured: with the variable set the check exits 12; with it unset, 11, on an install that is perfectly intact. So before treating an 11 as drift, read the failure reason: *"plugin contract unreachable: no --plugin-root and no $CLAUDE_PLUGIN_ROOT"* is an environment gap, and the fix is supplying the path — not reinstalling a healthy kit. Say which one you hit in the Step 7 report; a fresh project told its validator is mismatched will be distrusted for the rest of its life over a missing variable.
4. **Verify source material is reflected in the plan.** If `${CLAUDE_PROJECT_DIR}/research/source-material-digest.md` exists, invoke the research-integrity agent with both `${CLAUDE_PROJECT_DIR}/research/research-plan.md` and the digest and ask it to run the "Source Material Coverage" check (check 8 in the agent's documentation). If the agent reports any UNPROCESSED SOURCE MATERIAL FACT or PLAN-DIGEST CONTRADICTION findings, stop, present them to the user, and ask whether to (a) regenerate the plan with the missing facts included, (b) add the facts to the digest's Out of Scope section with a reason and re-run the check, or (c) accept the plan as-is and document the decision in `${CLAUDE_PROJECT_DIR}/research/notes-to-self.md`. Do not proceed to Step 7 until the user chooses. If no digest exists, skip this sub-step.
If anything is missing, create it before proceeding. If the CLAUDE.md references incorrect skill names or has mismatched finding tags, fix it.

## Step 7: Report

Tell the user what was created. Include:
- The inferred research profile: primary type, any secondary lenses, intended deliverable, and evidence calibration
- The finding tags from the inferred primary type
- **The phase table.** Render every phase from the research plan as a markdown table with these three columns: `#`, `Phase`, `Expected Outcome`. One row per phase — do not collapse, summarize as an arrow chain, or report only the count. Pull each phase's expected outcome from the synthesis line / output description in `research/research-plan.md` and condense it to one sentence that names what the phase will produce or settle. The synthesis phase is a row like every other phase. This table is mandatory — if you find yourself writing "Phases: N — A → B → C" instead of a table, stop and render the table.
- The twelve research skills available: `/know-research:init`, `/know-research:discover`, `/know-research:process-source`, `/know-research:cross-ref`, `/know-research:check-gaps`, `/know-research:summarize-section`, `/know-research:audit-claims`, `/know-research:start-phase`, `/know-research:phase-insight`, `/know-research:progress`, `/know-research:graph-analysis`, `/know-research:review-corpus`
- One line on the credibility gate: project completion now requires an independent adversarial corpus review — `/know-research:review-corpus final` at the end, with the validator owning the completion verdict.

Describe the plan as proposed, but do not add a separate approval question that blocks a user who
is ready to proceed. Give them two natural next moves: request a framing or phase change, or start
discovery. Starting `/know-research:discover` is acceptance of the proposed Phase 1 framing.

If the user's next turn requests a change before any source has been processed, treat it as a
continuation of initialization, not a new init attempt. Apply the correction and synchronize every
dependent scaffold artifact: `research-plan.md`, `discovery/strategy.md`, STATE phase lists and
Key Decisions, `gaps.md`, and `completion-criteria.md`; if the research profile or audience rules
changed, also update CLAUDE.md, `source-standards.md`, and `evidence-standard.md`. Re-run Step 6.
Do not tell the user to delete and reinitialize a project that has not begun solely to correct the
proposed plan.

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:discover` — Accept the proposed plan and find candidate sources for Phase 1 using the project discovery strategy.

**Also available:**
- `/know-research:start-phase` — Get the full Phase 1 briefing before starting discovery.
- `/know-research:process-source <url-or-file>` — Process a specific source you already have.

**What to expect:** Starting discovery accepts the proposed framing for Phase 1. Discovery will surface a prioritized candidate list using the project-specific strategy generated from the phase questions and relevant type-channel maps. After you approve, processing runs sequentially with a cross-reference checkpoint every 5 sources, signalled by `/know-research:process-source`'s pre-check counter.

───────────────────────────────────────────────────────────

Do NOT tell the user to `cd` anywhere — they are already in the correct directory. Do NOT initialize a git repo.
