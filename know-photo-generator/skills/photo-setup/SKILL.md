---
name: photo-setup
description: This skill should be used when the user asks to set up the know-photo-generator plugin, configure their Gemini API key for photo generation, set a default photo style, or invokes /know-photo:setup (e.g. "set up photo generation", "configure my Gemini key", "make the headshot style my default"). Creates the keys.env file the user pastes their key into (the key never passes through the conversation), verifies it, and optionally captures a default brand style.
allowed-tools: Read, Write, Glob, Bash, AskUserQuestion
---

# photo-setup — One-Time Plugin Setup

Get the user from freshly-installed to generating: API key in place (without the key
ever appearing in the conversation), dependency confirmed, and optionally a default
style so plain `/know-photo:generate` already looks like them.

**Idempotent.** Re-running reports what's already configured and only fills gaps.
**Never clobber** an existing `keys.env` or `photo-styles.md` — they may hold a real
key or hand-tuned styles. Config files are created with the Write tool, not shell.

## Key hygiene (hard rules)

- Never read, print, echo, or copy the **value** of any API key — not from `keys.env`,
  not from a `.env`, not from the environment, not between files. Only the user ever
  writes a key value, and only directly into the file.
- Key presence is checked exclusively via the script's `--check-keys` (it reports the
  source, never the value).
- If a legacy key file is discovered anywhere (an old repo's `.env`, a stray export),
  tell the user its **path** and let them migrate the value themselves. Do not do it
  for them.

## Presentation

Separate each step's output with a `---` horizontal rule, and put every choice with
enumerable options through the AskUserQuestion tool — never a prose list ending in
"let me know". Free-form input (describing a new style) stays conversational.

## Step 1: Scaffold `~/.know-photo-generator/`

Check what exists. Create anything missing:

**`~/.know-photo-generator/keys.env`** (only if absent) — the one place to paste the key,
no shell profile required:

```
# photo-generator API key — LOCAL ONLY. Never commit or share this file.
# Paste your key after the = (no quotes needed), then save. That's it.
#
# The generation script loads this file automatically. If GEMINI_API_KEY is
# already set in your real environment, that wins. A project-scoped file at
# .know-photo-generator/keys.env in your working directory wins over this one.

# Gemini — https://aistudio.google.com/apikey
GEMINI_API_KEY=
```

**`~/.know-photo-generator/config.json`** (only if absent):

```json
{
  "_note": "photo-generator configuration. API keys are read from keys.env or the environment at run time and are NEVER stored here.",
  "default_style": null
}
```

## Step 2: Key entry

Check whether a key already resolves:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/generate_image.py" --check-keys
```

- **Already found and valid** → announce it **explicitly and loudly**, naming the
  source: "A working key already resolves from `<source>`. **Setup did not create,
  read, or modify it.** If you didn't put a key there yourself, stop and check that
  file." Then AskUserQuestion: "Keep using this key?" — "Yes, keep it" /
  "I'll replace it — open the file for me". Skip to Step 3 on keep.
- **Not found** → open the file for the user: `open -t ~/.know-photo-generator/keys.env`
  (fall back to `${EDITOR:-nano}` if `open` is unavailable). Tell them: get a key at
  https://aistudio.google.com/apikey, paste it after `GEMINI_API_KEY=`, save.
  **Never ask them to paste the key into the chat.** Then gate on AskUserQuestion:
  "Pasted and saved?" — "Done — verify the key" / "Skip for now (prompt-only use)".
  On done, re-run `--check-keys` and report the result.
- **Found but validation failed** → show the script's error; likely a bad or revoked
  key. Point them back at the file to fix, then re-offer the same verify/skip gate.

A missing key is not fatal — prompt-only use (`/know-photo:generate` without `--generate`)
needs no key. Say so and continue.

## Step 3: Dependency check

```bash
python3 -c "import google.genai" 2>&1
```

If the import fails, AskUserQuestion: "The `google-genai` package isn't installed —
it's only needed for `--generate`." — "Install it now (pip3)" / "Skip (prompt-only use)".

## Step 4: Default style (optional)

AskUserQuestion — "Want a default style? It's the brand look `/know-photo:generate` applies
automatically when no `--style` flag is given." Options: "Pick an existing brand" /
"Describe a new style (no photography vocabulary needed)" / "No default". The three
paths:

**a. Pick an existing brand.** List the brands found in
`${CLAUDE_PLUGIN_ROOT}/reference/brand-styles.md` plus any `photo-styles.md` in the
working directory or `~/.know-photo-generator/`. Write the chosen name to `default_style`
in `~/.know-photo-generator/config.json`.

**b. Describe a new style.** Interview them loosely — they should not need photography
vocabulary. Ask about: the overall feel (bright/moody, polished/candid), what they
photograph most, any brands or photographers whose look they admire, colors they
gravitate to. Map the answers to library terms by reading
`${CLAUDE_PLUGIN_ROOT}/reference/cameras.md`, `lenses.md`, `lighting.md`, and
`post-processing.md`, then write a complete brand section (camera, lens, lighting,
post-processing, brand rules, master prompt template — follow the structure of an
existing brand in `brand-styles.md`) to `~/.know-photo-generator/photo-styles.md`
(create the file if absent, append if it exists). Set the new brand's name as
`default_style` in `config.json`. Show them the section and remind them the file is
theirs to edit.

**c. No default.** Leave `default_style: null`.

## Step 5: Project mode (only if asked, or if they say keys/styles should be per-project)

When the user wants project-scoped setup in the current directory:

- `.know-photo-generator/keys.env` — same template as Step 1, same never-clobber rule.
- `.know-photo-generator/.gitignore` containing:
  ```
  # Local API-key file — must never be committed
  keys.env
  ```
- A project `photo-styles.md` can hold project-local brands (wins over user-level
  and bundled on a name collision).

## Step 6: Report

Summarize in a few lines: key status (resolved from where, or "not set — prompt-only
until you paste one into ~/.know-photo-generator/keys.env"), dependency status, default
style (name or none). Then the single next move: `/know-photo:generate` (or
`/know-photo:generate --generate` once the key is in).
