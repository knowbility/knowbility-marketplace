---
name: know-qa:help
description: Explain what each QA skill does and all of its options — list every skill, or drill into one skill's full arguments and usage
argument-hint: "[skill-name]"
allowed-tools: Read, Bash, Grep, Glob
---

# /know-qa:help

The reference manual for this plugin. Answers "**what is this skill and what are its flags?**" — for the whole skill set or one skill.

This is the read-only twin of `/know-qa:guide`. Keep the two distinct:
- **`/know-qa:help`** — *what is X and what are its options.* State-independent. Reads only the plugin's own files; never touches a project's `.know-qa/`.
- **`/know-qa:guide`** — *given your project's state, what should you do next.* Reads `.know-qa/` and recommends one command.
- **`/know-qa:start`** — *I have a goal in plain English; set it up.* Dispatches to the right skill.

When the user wants "what's next," send them to `/know-qa:guide`; "where do I begin," `/know-qa:start`.

## Source of truth (why this never drifts)

`/know-qa:help` never carries its own hardcoded list of skills. It **discovers** them by globbing the plugin's `skills/` directory at run time, exactly the auto-discovery contract the plugin uses to register skills. Add `skills/foo/SKILL.md` and `/know-qa:help` lists it on the next run with zero edits here.

- The **list** of skills and their one-liners comes from each `${CLAUDE_PLUGIN_ROOT}/skills/*/SKILL.md` **frontmatter** (`name`, `description`, `argument-hint`) — the un-driftable source, since a skill can't exist without it.
- The **per-skill detail** comes from that skill's own SKILL.md body (its Arguments and Usage), which is edited in the same change that alters behavior.
- The **"when to use" narrative** comes from `${CLAUDE_PLUGIN_ROOT}/docs/ORCHESTRATION.md`. Treat ORCHESTRATION as *commentary*, not the list — it is the driftable source (it has lagged the real skill count before), so never derive the roster from it.

## Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `[skill-name]` | No | — | A skill to drill into. Accept bare (`run`) or namespaced (`know-qa:run`). Omit to list every skill. |

## Execution Flow

### Step 1: Parse the argument

Optional `[skill-name]`. Normalize `know-qa:run` → `run`. No other flags.

### Step 2: No argument → enumerate every skill

Glob the plugin's skills and read each one's frontmatter:

```bash
ls -1 "${CLAUDE_PLUGIN_ROOT}/skills/"*/SKILL.md
```

For each file, extract `name`, `description`, and `argument-hint` from the YAML frontmatter. Render a table:

```
QA skills — run /know-qa:help <skill> for full options on any one.

| Skill | What it does | Key args |
|-------|--------------|----------|
| /know-qa:init   | … (from description) | (from argument-hint) |
| /know-qa:start  | … | <intent> |
| …          | … | … |
```

Order by the lifecycle sequence in ORCHESTRATION.md's Quick Reference when it's available (init → start → seed → gen → run → check → monitor → report → guide → help → pair); fall back to alphabetical. Do **not** spawn agents and do **not** read any project's `.know-qa/`. End with a one-line footer pointing to `/know-qa:guide` (state) and `/know-qa:start` (intent).

### Step 3: Argument present → drill into one skill

Read that one file in full:

```bash
cat "${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md"
```

Emit, for that skill:
1. **Purpose** — the frontmatter `description` plus the opening prose.
2. **Arguments** — the skill's own Arguments table where it has one. For skills that document arguments in prose rather than a table (e.g. `gen`, `init`), synthesize a clean table from the body and `argument-hint`.
3. **Usage** — its Usage/Examples block, verbatim or lightly condensed.
4. **When to use / how it composes** — the matching subsection from `docs/ORCHESTRATION.md` ("When to Use"), labeled as guidance.

If `<name>` doesn't match any globbed skill, say so and list the valid names from the glob, then stop.

### Step 4: Stop

Output and stop. No state inspection, no recommendations, no test runs, no file writes. This skill only reads plugin files and explains them.

## Cross-Session Capability

`/know-qa:help` needs no prior conversation and no project state. It reads only the plugin's own files, so it returns the same answer in any session, in any project, even before `/know-qa:init`.
