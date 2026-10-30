---
description: Set up photo-generator — API key via keys.env (never pasted in chat), dependency check, optional default style
allowed-tools: Read, Write, Glob, Bash, AskUserQuestion
---

Set up the photo-generator plugin.

Use the `photo-setup` skill and follow its steps exactly, passing through any
arguments the user invoked this command with: $ARGUMENTS

It scaffolds `~/.know-photo-generator/` (keys.env + config.json), walks the user through
pasting their Gemini API key into the file directly (the key never appears in the
conversation), verifies the key and the `google-genai` dependency, and optionally
captures a default brand style used whenever `/know-photo:generate` runs without `--style`.

Re-running is safe: it reports what's configured and only fills gaps.
