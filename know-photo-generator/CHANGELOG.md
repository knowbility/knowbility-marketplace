# Changelog — know-photo-generator

All notable changes to the know-photo-generator plugin. Per-plugin semver; tags are
plugin-scoped (`know-photo-generator-vX.Y.Z`).

## 0.1.0 — 2026-10-30

First release in the Knowbility marketplace.

Forked with the original author's clearance from an MIT-licensed plugin of the same design, then
de-branded for Knowbility's use. The prompt-building engine, the camera, lens, lighting, scene and
post-processing reference libraries, the Gemini generation path, and the key-hygiene rules are all
unchanged.

What changed in the port:

- **Renamed** to `know-photo-generator`. Commands moved from `/generate-photo` and `/photo-setup`
  to `/know-photo:generate` and `/know-photo:setup`, so they cannot collide with the plugin this
  was forked from. 42 references updated — and one missed, corrected on 2026-10-30 while the fifth
  plugin was being ported: the manifest and catalog descriptions still read "`/photo-setup` handles
  the API key," naming a command that no longer exists, in the one piece of text a user reads
  before installing anything. Two existing gates passed it, because one compares only the version
  prefix and the other compares the manifest description to the catalog description — which agreed,
  since both carried the same wrong name. `dev/scripts/check-described-commands.mjs` now resolves
  every command string inside every description against the real invocation list.
- **Brand-style library rebuilt**, 264 lines down to 143. Both source organizations' house styles
  were removed, along with an undefined placeholder style. **Design-Ready Headshot** stays: it is
  brand-neutral and immediately usable. The authoring guide for adding styles stays.
- **A Knowbility style section was added as a template, not a guess.** Knowbility's own visual
  identity document currently lists logo, colors, typography and photography as open items, and
  names disability representation guidelines among them. A photographic house style for a digital
  accessibility organization is not something to infer from a website, so the section ships with
  its fields unfilled, a note saying why, and a **Representation** rule that must come from
  Knowbility. `/know-photo:setup` interviews for it without requiring photography vocabulary.
- **`/know-photo:generate` now refuses to fill in a `[TBD]` style.** A style template is an
  unanswered question rather than a default, so the skill says so and offers either setup or
  `--style none`, instead of inventing values. This matters most where the unfilled field is
  Representation and the output would depict people.
- **Config directory** moved from `.photo-generator/` to `.know-photo-generator/`, 40 references,
  covering `keys.env`, `config.json`, and `photo-styles.md` in both the project-scoped and
  home-directory locations.
- Author, homepage, and repository set to Knowbility's. License was already MIT.

**If you already have a Gemini API key** in `~/.photo-generator/keys.env` from the original
plugin, this one looks in `~/.know-photo-generator/keys.env` instead. Copy the file, re-run
`/know-photo:setup`, or set `GEMINI_API_KEY` in your environment, which this plugin checks first
and which serves both.

Version reset to 0.1.0 from the original's 1.2.0 deliberately. This is an independently maintained
fork with a different brand-style library, not a continuation of the original's version line.
