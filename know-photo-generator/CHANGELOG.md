# Changelog — know-photo-generator

All notable changes to the know-photo-generator plugin. Per-plugin semver; tags are
plugin-scoped (`know-photo-generator--vX.Y.Z`).

## 0.2.0 — 2026-10-31

**The generator now hands you the alt text.**

An image generator shipped by a digital accessibility organization produced a PNG and nothing else.
Every one of those images needs a text alternative wherever it gets used, and the plugin was the
only thing in the room that already knew what was in the frame — it had just written a paragraph
specifying subject, framing, expression and environment.

- **A fourth essential question: the image's role.** Decorative, informative, functional, or not
  decided yet. It is asked with the other three (identity, cleanup, legible text), so batch mode
  asks it once for the whole shot list. The reason it is a question rather than an inference is
  the point of the feature: what decides an alternative is the job the image does on the page, not
  what is in the frame, and the plugin cannot see the page. An *informative* answer also bears on
  the prompt, since whatever the image must convey has to be legible in it.
- **A drafted alternative per kept file**, written to a `.alt.md` sidecar beside the image and
  shown in the conversation. Each variation and each refinement the user settles on gets its own.
  Drafting happens after the refinement loop finishes — a refined image is a different image, and
  an alternative written for the first render describes something nobody kept.
- **Role-specific output rather than one description.** Decorative returns `alt=""` and says why an
  empty alternative is correct here rather than missing, and explicitly does not write a
  description "just in case." Functional describes the destination or action, not the picture.
  Informative gets 10–25 words leading with what a reader would otherwise lose, with no "image
  of". An unresolved role is reported as the finding it is.
- **Prompt-only runs get a draft too**, written from the prompt rather than a render and labelled
  that way, since it describes the intended image and has to be checked against what is finally
  produced.
- **It is a draft and says so.** Adequacy depends on where the image lands, so the person placing
  it owns the final wording. No output claims an image is accessible — the marketplace house rule
  is that nothing may imply an automated pass substitutes for a person's judgment, and alt-text
  adequacy is rated Human by `know-blueprint`'s own doctrine for exactly this reason.
- **A rule about describing people.** The workflow will not state a person's race, ethnicity,
  apparent gender, body, age, or whether they appear disabled unless the user put it in the scene
  description or it is the point of the image, and then it uses their words. Rendering a person
  tells you nothing about how they would describe themselves.

Keywords gained `accessibility` and `alt-text`. No change to the prompt engine, the reference
library, the Gemini path, or the key-hygiene rules.

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
