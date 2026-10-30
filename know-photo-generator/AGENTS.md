# AGENTS.md — know-photo-generator

Maintainer/agent guidance for working **on** the know-photo-generator plugin. Standalone,
self-contained photo prompt-and-generation system. (Current version lives in
`plugin.json` and `CHANGELOG.md`.)

## What it is

Turns Claude Code into a photography director: a guided workflow (quick or `--full`)
that converts a plain-language scene into a physics-aware Nano Banana Pro prompt —
camera, lens, lighting, semantic cleanup, color grade — then optionally renders it via
the Gemini image API (`--generate`). Brand presets apply a house style in one flag.

## Structure

- `commands/know-photo:generate.md`, `commands/know-photo:setup.md` — thin wrappers.
- `skills/photo-generate/SKILL.md` — the workflow engine (quick mode, full mode, style
  resolution, batch/variations orchestration, refinement loop, generation dispatch).
  Commands stay thin; behavior changes go here.
- `skills/know-photo:setup/SKILL.md` — one-time setup (beacon-pattern): scaffolds
  `~/.know-photo-generator/` (keys.env + config.json), walks key entry via the file (never
  the chat), verifies via the script's `--check-keys`, optional default style.
- `reference/` — read-only photography library, loaded via `${CLAUDE_PLUGIN_ROOT}`:
  `cameras.md`, `lenses.md`, `lighting.md`, `post-processing.md`, `scene-presets.md`,
  `nano-banana-engine.md` (engine mechanics, 14-slot system, physics triggers), and
  `brand-styles.md` (brand defaults + the analysis prompt for deriving new brands).
- `scripts/generate_image.py` — the only script, single-image by design (batch and
  variations loop in the skill, one call per image). `google-genai` SDK; argparse flags
  `--aspect-ratio`, `--image-size`, `--output`, `--ref` (repeatable), `--grounded`,
  `--model`, `--check-keys`. Model overridable via `GEMINI_IMAGE_MODEL`. Carries
  PEP 723 inline metadata so `uv run --script` also works.

## Key mechanics

- **Key resolution** (mirrors beacon `harness/run-panel.mjs`): real environment >
  cwd `.env` (legacy) > `.know-photo-generator/keys.env` in cwd > `~/.know-photo-generator/keys.env`.
  `--check-keys` reports the resolved source and live-validates with `client.models.get()`
  — it is the single source of truth `/know-photo:setup` calls. Setup **never clobbers** an
  existing `keys.env` or `photo-styles.md`, and keys are never stored in `config.json`
  or asked for in conversation.
- **Key hygiene binds maintainers too, not just the runtime skills:** no agent working
  on this plugin ever reads, prints, or copies an API-key *value* — not between files,
  not into tests, not "to migrate" it. (v1.1.0's build agent copied the user's key from
  a legacy `.env` into `~/.know-photo-generator/keys.env`; that prompted this rule.) Testing
  `--generate` uses whatever key already resolves via `--check-keys`, with the user's
  go-ahead. If a legacy key file turns up, report its path and stop.
- **Decision-point UX is deliberate (v1.2.0):** enumerable choices go through
  AskUserQuestion, output sections are separated with `---` rules, and the assembled
  prompt is always a fenced code block. Don't regress these to prose bullets when
  editing the skills.
- **Style resolution:** project `photo-styles.md` > `~/.know-photo-generator/photo-styles.md`
  > bundled `reference/brand-styles.md`; no `--style` flag falls back to
  `default_style` in `~/.know-photo-generator/config.json` (`--style none` bypasses).
- **Deployment-directory state**, per the composition principle in the marketplace
  `AGENTS.md` (plugins own only what they write, state lives in the user's directory):
  generated images go to
  `output/` under the user's cwd; project/user style files live outside the plugin.
  The plugin itself stays read-only at runtime.
- **Aspect ratio is passed via `image_config`** (`types.ImageConfig(aspect_ratio=...,
  image_size=...)`). The pre-plugin scripts validated but never sent it — don't
  regress this.
- **Model id** is pinned to `gemini-3-pro-image-preview` as the default in the script;
  when Google renames it, update `DEFAULT_MODEL` there (users can bridge with
  `GEMINI_IMAGE_MODEL` meanwhile).

## History

Ported 2026-07 from the standalone `photo-generator` repo (which also carried a Gemini
CLI command surface — dropped; Claude Code is the only runtime, Gemini is the API
backend). See CHANGELOG 1.0.0 for what changed in the port.
