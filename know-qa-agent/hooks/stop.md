---
name: stop-qa-check
description: Suggest QA verification when significant code changes are detected
---

# Stop Hook: QA Check on Session End

When this hook fires (at the end of a Claude Code session), follow these steps exactly.

## Step 1: Detect Relevant Code Changes

Run the following to see what changed in this session:

```bash
git diff --stat HEAD 2>/dev/null || git diff --stat 2>/dev/null
```

If git is not available or this is not a git repository, skip to Step 4 and exit silently.

### Classify Changed Files

From the `git diff --stat` output, categorize files:

**Relevant changes (warrant QA):**
- Source code: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`, `*.cjs`
- Backend/scripts: `*.py`, `*.rb`, `*.go`, `*.rs`, `*.php`
- Templates/views: `*.html`, `*.vue`, `*.svelte`, `*.erb`, `*.jinja`
- Styles: `*.css`, `*.scss`, `*.sass`, `*.less`
- API routes and config: files in `api/`, `routes/`, `controllers/`, `middleware/`
- Runtime config: `*.json` (excluding `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`), `*.yaml`, `*.yml`, `*.toml`, `*.env*`

**NOT relevant (skip QA):**
- Documentation only: `*.md`, `*.txt`, `*.rst`
- Test files only: `*.test.*`, `*.spec.*`, `__tests__/`, `tests/`, `test/`
- Planning artifacts only: `.planning/` directory
- Lock files only: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`

**Decision rule:**
- If ALL changed files fall into "not relevant" categories → exit silently, no prompt
- If ANY changed files are in "relevant" categories → continue to Step 2

## Step 2: Check for Existing QA Specs

Check whether this project has QA specs configured:

```bash
ls .know-qa/ 2>/dev/null
```

- If `.know-qa/` directory does not exist → note "no QA specs configured"
- If `.know-qa/` exists → note "QA specs available"

If QA specs exist, also check which spec files exist:

```bash
ls .know-qa/*.md 2>/dev/null
```

## Step 3: Prompt the User

Build and display the QA prompt directly (do not make it passive — show it clearly):

**Format:**

```
Changes detected in [N files including: file1.ts, file2.tsx, ...].
These changes may affect user-facing behavior.

Run QA? [yes / skip]
```

Where:
- N = count of relevant changed files
- List up to 3 file names; if more than 3, say "file1.ts, file2.ts, and N more"

If `.know-qa/` directory exists with specs, append which specs are most relevant based on changed file paths (e.g., if `src/auth/` files changed, look for auth-related specs).

Wait for the user's response:

- If **yes** → remind user to run: `/know-qa:run` (or `/know-qa:run --project .` if specs exist)
- If **skip** → acknowledge and exit

## Step 4: GSD Awareness (Soft, One-Time)

This section is optional and non-intrusive. Only trigger if:
- `.planning/` directory does NOT exist in the project root
- There were 5 or more relevant file changes in this session
- The file `.know-qa/memory/gsd-suggested` does NOT exist

If all three conditions are met:
1. Append this message after the QA prompt:

   ```
   Tip: For structured development workflow, consider GSD (get-shit-done) for Claude Code.
   ```

2. Create the marker file to prevent showing this again:

   ```bash
   mkdir -p .know-qa/memory
   echo "suggested: $(date -u +%Y-%m-%d)" > .know-qa/memory/gsd-suggested
   ```

If `.know-qa/memory/gsd-suggested` already exists, skip this step entirely.

## Step 5: Silent Exit Conditions

Exit without any output if:
- Not a git repository
- No relevant code changes detected (only docs, tests, or planning files changed)
- The session made zero changes (empty `git diff --stat`)

The goal is zero noise for sessions where QA is not relevant.
