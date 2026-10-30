---
description: Generate professional photos using the Nano Banana Pro engine — guided prompt build, optional direct image generation
allowed-tools: Read, Write, Glob, Bash, AskUserQuestion
---

Generate a professional photo.

Use the `photo-generate` skill and follow its steps exactly, passing through the
arguments the user invoked this command with: $ARGUMENTS

Flag summary (the skill documents the full behavior):

- (no flags) — quick mode; uses the configured default style if set (via `/know-photo:setup`)
- `--full` — full guided walkthrough (camera, lens, lighting, cleanup, post)
- `--style "Brand Name"` — apply brand defaults (e.g. `--style "Design-Ready Headshot"`); `--style none` for generic
- `--generate` — render the image via the Gemini API after building the prompt
- `--platform <name>` — aspect ratio by use case (`social-square`, `hero-banner`,
  `print-standard`, `print-panoramic`, `social-portrait`, `social-story`, `editorial`)
- `--size <1K|2K|4K>` — output resolution (default 2K)
- `--output <filename>` — custom output filename
- `--ref <path>` — reference/source image (repeatable, up to 14)
- `--grounded` — ground generation with Google Search (real-time data imagery)
- `--batch <file>` — shot-list mode: one image per entry in the file
- `--variations <N>` — N distinct takes of the final prompt (max 8 per run)
