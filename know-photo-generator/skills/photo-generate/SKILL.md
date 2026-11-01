---
name: photo-generate
description: This skill should be used when the user asks to generate a professional photo, create a Nano Banana Pro prompt, or invokes /know-photo:generate (e.g. "generate a headshot in the house style", "create a hero image for the site", "make a product photo"). Guides scene, camera, lens, lighting, and post-processing choices from the bundled reference library, assembles a physics-aware prompt, and optionally generates the image via the Gemini API.
allowed-tools: Read, Write, Glob, Bash, AskUserQuestion
---

# photo-generate — Guided Professional Photo Generation

Turn a plain-language scene description into a complete Nano Banana Pro prompt, and
optionally render it via the Gemini API. The invoking command passes flags; parse them
from the arguments before starting.

## Presentation & decision points (apply throughout)

- **Every decision with enumerable choices goes through the AskUserQuestion tool** —
  never a prose bullet list ending in "let me know". This covers: the essential
  questions, scene type, full-mode gear/lighting/post picks, render-or-not, batch
  confirmation, the cost guard, and the refinement offer. Free-form input (the scene
  description, refinement change requests, exact text to keep legible) stays
  conversational — do not force it into options.
- **Separate output sections with a `---` horizontal rule**: style banner · preset
  summary · the assembled prompt · what happens next. Each is its own visual block.
- **The assembled prompt always goes in a fenced code block** — copyable and visually
  distinct from the conversation around it. Never inline it in prose.
- One sentence of framing beats a paragraph. The reference-library reasoning (why this
  camera, why this light) is one line per choice unless the user asks for more.

## Key hygiene (hard rules)

Never read, print, echo, or copy the **value** of any API key — not from `keys.env`,
not from a `.env`, not from the environment, not between files. Key presence is checked
only via the script's `--check-keys` (it reports the source, never the value). On a
key error, point at `/know-photo:setup`; do not open or inspect key files yourself.

## Flags

| Flag | Behavior |
|------|----------|
| (none) | Quick mode; uses the configured default style if one is set, else generic presets |
| `--full` | Full walkthrough through all options |
| `--style "Brand"` | Use brand defaults (quick) or brand recommendations (full) |
| `--style none` | Bypass the configured default style; generic presets |
| `--generate` | Call the Gemini API to create the image after the prompt |
| `--platform <name>` | Aspect ratio by use case (see table below); default `social-square` |
| `--size <1K\|2K\|4K>` | Output resolution when generating; default `2K` |
| `--output <filename>` | Custom output filename (with `--generate`) |
| `--ref <path>` | Reference/source image to send with the prompt (repeatable, up to 14) |
| `--grounded` | Ground generation with Google Search — for imagery informed by real-time data |
| `--batch <file>` | Shot-list mode: one image per entry in the file (see Batch Mode) |
| `--variations <N>` | Render the final prompt N times as distinct takes (max 8 per run) |

## Reference library

All reference files live in the plugin:

- `${CLAUDE_PLUGIN_ROOT}/reference/brand-styles.md` — brand defaults and rules
- `${CLAUDE_PLUGIN_ROOT}/reference/nano-banana-engine.md` — engine mechanics, 14-slot system, physics triggers
- `${CLAUDE_PLUGIN_ROOT}/reference/cameras.md` — camera bodies and recommendations
- `${CLAUDE_PLUGIN_ROOT}/reference/lenses.md` — lenses, focal lengths, apertures
- `${CLAUDE_PLUGIN_ROOT}/reference/lighting.md` — lighting setups and moods
- `${CLAUDE_PLUGIN_ROOT}/reference/post-processing.md` — color grades and aesthetics
- `${CLAUDE_PLUGIN_ROOT}/reference/scene-presets.md` — quick-start combinations

**Brand style sources**, searched in order (first match wins on a name collision):

1. `photo-styles.md` in the working directory — project-local brands (client work)
2. `~/.know-photo-generator/photo-styles.md` — the user's own styles (written by `/know-photo:setup`)
3. `${CLAUDE_PLUGIN_ROOT}/reference/brand-styles.md` — bundled brands

---

## Step 0: Resolve Style

1. **`--style "Brand"` given** → search the three brand sources in order, load all
   defaults from the matching section (camera, lens, lighting, post-processing, brand
   rules). If the brand is not found, list the available brands from all sources and stop.
2. **`--style none` given** → generic presets; skip the default-style check.
3. **No `--style` flag** → read `~/.know-photo-generator/config.json` (if it exists). If
   `default_style` is set, resolve that brand as in (1) and tell the user:
   "Using your default style: <name> — pass `--style` to override, or `--style none`
   for generic." If no config or `default_style` is null, proceed generic.

---

## Quick Mode (default)

Fast generation using brand defaults or scene presets.

### With `--style`:

1. **Scene description.** Ask: "Describe the scene you want to create." Get specifics —
   what the subject is doing, the environment, any required elements. (Free-form —
   conversational, not AskUserQuestion.)
2. **Essential questions** — one AskUserQuestion call, three questions:
   - *Identity* — "Preserve a specific subject's identity (face, product)?"
     Options: "No — generic subject" / "Yes — I'll provide reference photo(s)".
     If yes, collect the file paths conversationally afterward.
   - *Cleanup* — "Anything to remove or avoid in the frame?"
     Options: "Nothing specific" / "Yes — I'll list them".
   - *Text* — "Any text/labels that must stay legible?"
     Options: "No text in scene" / "Yes — I'll give the exact text".
   - *Role* — "Where this image gets used, what job will it do?"
     Options: "Decorative — nearby text already says it" / "Informative — it carries
     something the text doesn't" / "Functional — it's a link or a button" / "Not decided
     yet". This is the question that decides the image's text alternative, so it is asked
     here rather than guessed later — see **Alt text** below. An *informative* answer also
     bears on the prompt: whatever the image has to convey needs to be legible in the frame.
3. **Generate the prompt.** Combine the scene with the brand's Master Prompt Template
   from the brand styles file. Apply that style's Brand Rules automatically, including its
   subject treatment, rather than asking again. Output the complete prompt.

   **If the chosen style's fields are still `[TBD]`**, say so and stop rather than filling them
   in: a style template is an unanswered question, not a default. Offer `/know-photo:setup` to
   capture it, or `--style none` to run generic. This matters most for a style whose
   **Representation** rule is unfilled and whose output would depict people.

### Without `--style` (generic):

1. **Scene type** — AskUserQuestion: "What type of photo are you working with?"
   Options: Portrait / Product / Food / Interior or Lifestyle (the built-in "Other"
   covers everything else).
2. **Find a preset.** Read `${CLAUDE_PLUGIN_ROOT}/reference/scene-presets.md` and find
   the best match. Present it with a brief explanation; ask if they want adjustments.
3. **Essential questions.** Same four as above.
4. **Generate the prompt.** Read `${CLAUDE_PLUGIN_ROOT}/reference/nano-banana-engine.md`
   for physics triggers. Output the prompt using preset values + reasoning triggers.

---

## Full Mode (`--full`)

Complete guided workflow. If `--style` is also provided, brand defaults become the
**recommended option** at each step, but the user can override.

1. **Understand the scene.** Photo type, subject, mood, use case, and whether a specific
   subject's identity must be preserved.
2. **Reference slot strategy.** Read `${CLAUDE_PLUGIN_ROOT}/reference/nano-banana-engine.md`
   for the 14-slot system. Ask about additional reference images — lighting references,
   mood references, subject angles (for identity preservation), gear samples. If they
   have references, build a slot assignment and collect the file paths for `--ref`.
3. **Camera selection.** Read `${CLAUDE_PLUGIN_ROOT}/reference/cameras.md`. Offer the
   pick via AskUserQuestion: the recommendation first (labeled "(Recommended)") plus
   2–3 alternatives fitting the scene, one line each on the look they trigger.
4. **Lens selection.** Read `${CLAUDE_PLUGIN_ROOT}/reference/lenses.md`. Same
   AskUserQuestion pattern — recommended lens first, alternatives by depth of field
   and subject isolation.
5. **Lighting setup.** Read `${CLAUDE_PLUGIN_ROOT}/reference/lighting.md`. Same
   AskUserQuestion pattern, options keyed to mood. The chosen setup is then written
   specifically: light position, quality (soft/hard/diffused), additional lights
   (rim, fill, back).
6. **Semantic cleanup.** Get SPECIFIC — not "remove clutter" but "remove the three
   magazines and phone charger"; not "clean background" but "replace visible power cables
   with matching wall texture". If `--style`, remind the user of the brand's cleanup rules.
7. **Post-processing.** Read `${CLAUDE_PLUGIN_ROOT}/reference/post-processing.md`.
   AskUserQuestion — recommended grade first, alternatives matched to the aesthetic goals.
8. **Assemble the prompt** using this structure:

```
[REASONING: Calculate true light paths and physics-accurate shadows]

[SLOT ASSIGNMENT - if using multiple references]
Use Slot 1 for subject identity...

GEAR: Shot on [CAMERA], [LENS] lens.

LIGHTING: [LIGHTING SETUP with specific positions and qualities]

CLEANUP:
- [Specific object removals]
- Remove all digital noise and environmental clutter
- Straighten all architectural lines

POST: Apply a [POST-PROCESSING STYLE] grade.

OUTPUT: 4K high-fidelity render.

[SUBJECT FIDELITY - if preserving specific subject]
Maintain 100% subject identity fidelity. Only modify environment, lighting, and optical quality.

[TEXT GROUNDING - if scene contains text/labels]
Ensure text '[EXACT TEXT]' remains crisp and legible, following 3D perspective and lighting.
```

9. **Apply brand rules** (if `--style`): subject treatment, environment, composition
   all match the brand; nothing from the brand's "Never" list is present.
10. **Final checklist** before delivering:
    - [ ] Gaffer directed: light position and quality specified
    - [ ] Lens assigned: focal length and aperture stated
    - [ ] Cleanup commanded: specific objects named
    - [ ] Output defined: 4K high-fidelity render
    - [ ] Reasoning triggered: physics keywords included
    - [ ] Subject fidelity: added if preserving identity
    - [ ] Text grounded: exact text specified if labels present
    - [ ] Brand rules: all followed (if `--style`)

---

## Delivering the prompt (quick and full mode)

1. One line of context (style used, key choices), then `---`, then **the complete
   prompt in a fenced code block**, then `---` again.
2. **If `--generate` was passed**, go straight to Image Generation below.
3. **If not**, close with one AskUserQuestion — "The prompt is ready. What next?":
   - "Render it now (Recommended)" — current platform/size defaults, stated in the description
   - "Render with different platform/size" — then ask which, from the platform table
   - "Tweak the prompt first" — take changes conversationally, re-deliver
   - "Done — prompt only"

   On "Done — prompt only", still deliver the alt-text draft described below: a
   prompt-only run ends with an image somewhere, rendered by something else. On the two
   render options, Image Generation's last step handles it.

---

## Batch Mode (`--batch <file>`)

Shot-list mode: many images in one run, minimal ceremony. Implies `--generate`.

1. **Parse the shot list.** Read the file; entries may be markdown bullets, headings,
   or plain lines — each entry is one scene description, optionally prefixed with a
   shot name and optionally carrying an inline platform override (e.g.
   `hero shot (hero-banner): founder at a whiteboard...`). Show the parsed list —
   name, platform, scene — then confirm via AskUserQuestion:
   "Proceed with these N shots" / "Let me correct the list" / "Cancel".
2. **Ask the four essential questions ONCE** for the whole batch (identity
   preservation, objects to remove, text to keep legible, the role the images will
   play). Apply the answers to every shot.
3. **Build one prompt per entry** using quick mode with the shared settings: style
   (flag or default), platform (per-entry override, else `--platform`, else
   `social-square`), size. No per-entry interviewing.
4. **Cost guard:** if the run is more than 3 images (entries × variations), confirm
   via AskUserQuestion — "Render all N images" / "Cancel" — with the total count in
   the question text.
5. **Render sequentially**, one script call per image. Output names: `output/<slug>.png`
   from the shot name (or a slug of the scene's first words). A failed shot does not
   stop the batch — record the error and continue.
6. **Summary table** at the end: shot, output file, status (saved / failed + reason),
   and `alt` — written, or "none needed (decorative)".

## Variations (`--variations N`)

Render the final prompt N times — the model is non-deterministic, so each call is a
distinct take. Cap N at 8 per run (API cost); tell the user they can re-run for more.
Output names: `<name>-v1.png` … `<name>-vN.png` (from `--output` or the default
timestamp name). Combines with `--batch`: N takes per shot. The cost guard above
applies to the total count.

---

## Image Generation (`--generate`)

After producing the prompt:

1. Map `--platform` to an aspect ratio (default `social-square`):

| Platform | Aspect Ratio | Use Case |
|----------|--------------|----------|
| `print-standard` | 4:5 | Standard print sizes (8x10, 16x20) |
| `print-panoramic` | 16:9 | Wide prints, banner displays |
| `social-square` | 1:1 | Instagram feed, portfolio thumbnails |
| `social-portrait` | 4:5 | Instagram portrait posts |
| `social-story` | 9:16 | Instagram/TikTok stories, reels |
| `hero-banner` | 16:9 | Website headers, billboard ads |
| `editorial` | 4:5 | Magazine layouts, editorial spreads |

2. Determine the output path: `output/<filename>` if `--output` was given, otherwise
   `output/photo-YYYYMMDD-HHMMSS.png` (in the working directory).
3. Run the generation script, passing any reference images collected during the workflow:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/generate_image.py" "<prompt>" \
  --aspect-ratio <ratio> --image-size <size> --output <path> \
  [--ref <image> ...] [--grounded]
```

   Pass `--grounded` when the user asked for real-time-data imagery (current events,
   live subjects, "last night's game").

4. Report the saved file path. On an API-key error, point the user at `/know-photo:setup`
   (and relay the script's manual options). On a missing-dependency error, relay
   `pip3 install google-genai`.

5. **Offer one refinement.** After showing the result, AskUserQuestion:
   "Happy with this render?" — "Yes, done" / "Refine it" / "Re-render as-is (new take)".
   On "Refine it", take the change description conversationally, then re-run the script
   with the just-generated file passed as `--ref` and a prompt of the form: "Using the
   reference image as the base, keep everything identical except: <requested changes>."
   Save as the same name with a `-r1` (then `-r2`, …) suffix. Repeat while they keep
   requesting changes; skip this offer in batch mode.

6. **Write the alt text** for whichever file the user settles on, per **Alt text** below.
   Do this once the refinement loop is finished — a refined image is a different image, and
   an alternative written for the first render would describe something nobody kept.

---

## Alt text

Every image this plugin produces gets placed somewhere, and wherever that is, somebody has to
decide its text alternative. Make that decision part of delivery instead of something the user
discovers afterwards. Every run does this; there is no flag for it and no run skips it.

**What this plugin can and cannot settle.** It knows what is in the frame — it wrote the prompt.
It does not know what job the image does on the page it lands on, and that is what decides the
alternative: one photograph is decorative beside a paragraph that already says it, informative
when it carries something the text does not, and a destination when it is the content of a link.
So the role comes from the user, and the wording you produce is **a draft the person placing the
image approves in context**. Never present it as finished, and never say the image is accessible —
a drafted alternative is a starting point for the person who knows the page.

### What to produce, by role

| Role (essential question 4) | What to deliver |
|---|---|
| **Decorative** | `alt=""`, plus one line on why an empty alternative is the correct answer here rather than a missing one. Do not write a description "just in case" — a decorative image carrying a description is a worse result, not a safer one. |
| **Informative** | A draft of roughly 10–25 words naming what a reader would otherwise lose. Lead with that, never with the photographic treatment. No "image of" or "photo of" — the context already says it is an image. If the point genuinely needs more room, draft a short alternative *and* a longer description for nearby prose or a `figcaption`, and say which is which. |
| **Functional** | A draft describing the destination or the action, not the picture. A logo that links home is "Home", not a description of the logo. |
| **Not decided yet** | Draft the informative version, and say plainly that the role is unresolved and has to be answered before the image is published. The unanswered role is the finding, not the wording. |

### Where it goes

Write a sidecar beside the image — the image's path with `.alt.md` replacing the extension, so
`output/photo-20261031-143022.png` pairs with `output/photo-20261031-143022.alt.md` — and also
show the draft in the conversation, where it can be used immediately. The file holds three things:

- the drafted alternative, or the empty-alt recommendation
- the role it was written for, in the user's own words
- one line recording that adequacy depends on where the image lands, so the person placing it owns
  the final wording

One sidecar per file the user keeps: each variation, and each `-rN` refinement they settle on.

**Prompt-only runs** (no `--generate`) still get a draft, written from the prompt rather than from
a render and labelled that way: it describes the *intended* image and has to be checked against
whatever is finally produced.

**Batch mode** writes one sidecar per shot from the role answered once for the whole batch.

### Describing people

Do not state a person's race, ethnicity, apparent gender, body, age, or whether they appear
disabled unless the user put it in the scene description or it is the point of the image. Rendering
a person does not tell you how they would describe themselves, and an alternative that guesses is
worse than one that omits. Where such a detail is the point and the user supplied it, use their
words rather than substituting your own.
