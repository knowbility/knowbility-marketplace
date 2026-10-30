# know-photo-generator

Get a professional-grade photo from a plain-language description — without knowing what a key light or an 85mm prime is.

`/know-photo:generate` walks you from a scene description to a complete, physics-aware Nano Banana Pro prompt: camera body, lens, lighting setup, semantic cleanup, and color grade, each chosen from a curated reference library. Add `--generate` and it renders the image directly via the Gemini API at the right aspect ratio and resolution for print, social, or hero-banner use.

## Install

```
/plugin marketplace add knowbility/knowbility-marketplace
/plugin install know-photo-generator@knowbility
```

### Setup

Run `/know-photo:setup` once. It creates `~/.know-photo-generator/keys.env`, opens it so you can paste your Gemini API key directly into the file (the key never passes through the chat), verifies the key against the API, checks the `google-genai` dependency, and optionally captures a **default style** — the brand look applied whenever you run `/know-photo:generate` without `--style`.

Manual alternative: `export GEMINI_API_KEY='...'` in `~/.zshrc`, or paste the key into `~/.know-photo-generator/keys.env` yourself (get one at https://aistudio.google.com/apikey), plus `pip3 install google-genai`. Resolution order: environment > cwd `.env` > project `.know-photo-generator/keys.env` > `~/.know-photo-generator/keys.env`.

Prompt-only use (no `--generate`) needs no key at all.

## Usage

| Command | What you get |
|---------|--------------|
| `/know-photo:setup` | One-time setup — API key, dependency, optional default style |
| `/know-photo:generate` | Quick mode — your default style if set, minimal questions |
| `/know-photo:generate --full` | Full walkthrough — every option, with explanations |
| `/know-photo:generate --style "Design-Ready Headshot"` | Quick mode with a named brand style's defaults (`--style none` for generic) |
| `/know-photo:generate --generate` | Build the prompt, then render the image (1:1, 2K) |
| `/know-photo:generate --generate --platform hero-banner --size 4K` | Render a 16:9 4K image |
| `/know-photo:generate --generate --ref face.jpg --ref light.jpg` | Render with reference images |
| `/know-photo:generate --generate --grounded` | Ground the image in real-time Google Search data |
| `/know-photo:generate --generate --variations 4` | Four distinct takes of the same prompt |
| `/know-photo:generate --batch shots.md --platform social-square` | One image per entry in a shot-list file |
| `/know-photo:generate --generate --output "shot.png"` | Custom output filename |

Generated images land in `output/` under your current directory, timestamped unless you pass `--output`. After a render, the workflow offers a refinement pass — describe what to change and it re-renders using the previous image as the base.

**Batch mode:** put one scene per line (or bullet, or heading) in a file; each entry optionally takes a name and platform override. The workflow confirms the parsed shot list, asks the essential questions once for the whole set, and renders each shot, ending with a summary table. `--variations N` combines with batch for N takes per shot; runs over 3 images confirm the count first.

### Platforms

| Platform | Aspect Ratio | Use Case |
|----------|--------------|----------|
| `print-standard` | 4:5 | Standard print sizes (8x10, 16x20) |
| `print-panoramic` | 16:9 | Wide prints, banner displays |
| `social-square` | 1:1 | Instagram feed, portfolio thumbnails |
| `social-portrait` | 4:5 | Instagram portrait posts |
| `social-story` | 9:16 | Instagram/TikTok stories, reels |
| `hero-banner` | 16:9 | Website headers, billboard ads |
| `editorial` | 4:5 | Magazine layouts, editorial spreads |

## Brand styles

**Design-Ready Headshot** ships configured and is brand-neutral. A **Knowbility** section is
present as a template: the organization's photographic style, including its disability
representation guidance, is not yet documented, and this plugin does not guess it. Three ways to
fill it or add more, searched in this order (first match wins):

**In a project (for client work):** drop a `photo-styles.md` in the project root, following the template in the bundled `reference/brand-styles.md`.

**Your own styles:** `/know-photo:setup` can interview you for a personal style — no photography vocabulary needed — and writes it to `~/.know-photo-generator/photo-styles.md`, optionally as your default.

**In the plugin:** add to `reference/brand-styles.md` and bump the plugin version.

To derive a brand's settings from real photos, upload 5–10 representative shots to Gemini with the analysis prompt at the top of `reference/brand-styles.md` — it returns camera, lens, lighting, and grade settings in the format the template expects.

## Structure

- `commands/know-photo/generate.md`, `commands/know-photo/setup.md` — entry points (thin wrappers)
- `skills/photo-generate/SKILL.md` — the guided workflow engine
- `skills/photo-setup/SKILL.md` — one-time setup (keys.env, dependency, default style)
- `reference/` — the photography knowledge library (7 files)
- `scripts/generate_image.py` — Gemini API generation script (`google-genai` SDK); also `--check-keys`

Part of the [Knowbility marketplace](https://github.com/knowbility/knowbility-marketplace).
