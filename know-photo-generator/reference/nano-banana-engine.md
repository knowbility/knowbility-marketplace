# Nano Banana Pro Engine Reference

This file documents how the Nano Banana Pro imaging engine (Gemini 3) works and how to write prompts that leverage its full capabilities.

---

## How Nano Banana Pro Differs

Unlike standard AI image generators that "guess" at pixels, Nano Banana Pro uses **multimodal reasoning**—it calculates:
- **Depth** - Understanding 3D space
- **Light physics** - How light actually bounces and reflects
- **Factual consistency** - Maintaining logical coherence

This means your prompts should speak to its reasoning capabilities, not just describe desired outcomes.

---

## Gemini 3 Pro Capabilities (current as of mid-2026)

What the `gemini-3-pro-image-preview` model exposes beyond the base engine:

- **Resolution control** — 1K, 2K, or 4K output (up to 4096×4096), set via the API's
  `image_config.image_size`. 4K is real pixel budget, not upscaling; use it for print
  and hero work.
- **Aspect ratio control** — 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9, set
  via `image_config.aspect_ratio` (not via prompt text — the API setting is authoritative).
- **14 reference images** — up to 5 humans and 6 objects among them. This is the hard
  limit behind the slot system below.
- **Default "thinking" pass** — the model refines composition internally before
  rendering. Physics triggers (below) feed this reasoning; that's why they work.
- **High-fidelity text rendering** — legible typography, logos, and labels. Always
  quote the exact text in the prompt (see Text Grounding).
- **Google Search grounding** — the API can ground generation in real-time search
  results (current events, live subjects). Exposed as the `--grounded` flag.
- **Multi-turn editing** — pass a generated image back as a reference with change
  instructions to iterate on it ("keep everything identical except…"). This powers
  the refinement loop.

---

## The 14-Slot Reference System

Nano Banana Pro can handle **up to 14 reference images simultaneously**. Using only your phone photo means you're using 1/14th of its contextual power.

### Slot Strategy

| Slot | Purpose | What to Upload |
|------|---------|----------------|
| 1 | Composition/Structure | Your phone photo (the "before") |
| 2-4 | Lighting Style | Examples of lighting you want to achieve |
| 5 | Texture Reference | High-quality texture samples |
| 6-8 | Mood/Aesthetic | Images with the overall feel you want |
| 9-11 | Subject Consistency | Multiple angles of your subject (if preserving identity) |
| 12-14 | Gear Reference | Sample photos from the camera you're simulating |

### Prompt Syntax for Slots

```
Use Slot 1 for composition, Slots 2-4 for lighting style, and Slot 5 for texture reference.
```

### When to Use Multiple Slots

- **Preserving a specific person/product**: Upload 3-5 angles (front, side, 3/4 view)
- **Matching a specific aesthetic**: Upload 2-3 mood reference images
- **Complex lighting**: Upload examples of the lighting style you want
- **Texture-heavy scenes**: Upload high-res texture samples

---

## Physical Reasoning Triggers

The reasoning engine is essentially a **physics simulator**. Without explicit triggers, it may just apply filters instead of truly recalculating the scene.

### Keywords That Trigger Physics Calculation

| Trigger Phrase | What It Does |
|----------------|--------------|
| `Calculate true light paths` | Forces ray-tracing logic for realistic lighting |
| `Physically accurate shadows` | Computes shadow direction, softness, and falloff |
| `Ray-traced reflections` | Calculates how surfaces actually reflect light |
| `Volumetric depth` | Adds atmospheric perspective and depth haze |
| `Mathematically correct bokeh` | Computes Circle of Confusion for realistic blur |

### Example Usage

```
[REASONING: Calculate true light paths and physically accurate shadows based on a 45-degree key light from camera left]
```

### Why This Matters

When you specify "calculate true light paths," the engine:
1. Analyzes where light sources are in your phone shot (windows, lamps, etc.)
2. Mathematically re-calculates how virtual studio lights would bounce off those surfaces
3. Renders physically plausible shadows and highlights

Without this trigger, it may just "paint" shadows that look approximately right.

---

## Gear Simulation (The Metadata Hack)

Nano Banana has been trained on **specific camera metadata**. Vague terms like "professional camera" don't help. Specific sensor + lens combinations change the mathematical rendering.

### Sensor Selection

| Sensor | Training Data Strength | Best For |
|--------|----------------------|----------|
| Sony A7R V | High resolution, detail | Products, landscapes, architecture |
| Hasselblad H6D | Color depth, medium format look | Portraits, fashion, luxury |
| Arri Alexa | Cinematic film grain, highlight rolloff | Video stills, cinematic look |
| Leica M11 | Classic rendering, "Leica glow" | Street, fine art |

### Lens Math

Specifying aperture and focal length forces the engine to calculate:
- **Circle of Confusion** - Mathematically correct bokeh shape
- **Depth of Field** - Accurate focus falloff
- **Lens Compression** - Proper perspective for the focal length

```
85mm f/1.2
```

This produces bokeh that looks like it came from real glass, not AI blur.

### The Gear Reference Slot

For maximum accuracy, upload a sample photo from the actual camera you're simulating into one of your reference slots. The engine will match the color science and rendering characteristics.

---

## Semantic Masking (Natural Language Editing)

Nano Banana understands **semantic labels**—you don't need to brush or mask areas manually.

### How It Works

The engine identifies:
- **Objects** as distinct entities (cables, cans, people, furniture)
- **Textures** as surface properties (wood grain, fabric, metal)
- **Regions** by description (background, foreground, table surface)

### Effective vs. Vague Commands

| Vague (Less Effective) | Specific (More Effective) |
|------------------------|---------------------------|
| "Clean up the background" | "Identify the power cables and soda can on the table and replace them with clean mahogany wood grain matching the existing table texture" |
| "Remove clutter" | "Remove the three magazines on the left side of the couch and the phone charger on the floor" |
| "Fix the lighting" | "Add a rim light from behind the subject at camera right, 2 stops brighter than the key light" |

### Object Identification Syntax

```
Identify [OBJECT] and [ACTION]:
- "Identify the coffee mug and increase its specular highlights"
- "Identify all visible cables and remove them"
- "Identify the product label and ensure text remains crisp at 4K"
```

---

## Text & Graphic Grounding

Nano Banana Pro can render **perfect, legible text**—rare for AI. But you must be explicit.

### The Rule

Always state:
1. The exact text content
2. The font style
3. The placement context

### Prompt Syntax

```
Render the text '[EXACT TEXT]' on [SURFACE] in a [FONT STYLE] font, ensuring it follows the 3D perspective and lighting of [CONTEXT].
```

### Examples

```
Render the text 'ARCADIA COFFEE' on the storefront sign in a minimalist sans-serif font, ensuring it follows the 3D perspective and lighting of the building.
```

```
Ensure the product label reading 'ORGANIC HONEY - 500g' remains crisp and legible, maintaining the curved perspective of the jar surface.
```

---

## Pro-Level Prompt Checklist

Before finalizing any prompt, verify you've included:

### 1. Direct the "Gaffer" (Lighting Direction)
- [ ] Specify light position (e.g., "45-degree key light from camera left")
- [ ] Specify light quality (e.g., "soft," "hard," "diffused")
- [ ] Specify any rim/fill/back lights

### 2. Assign the "Lens" (Optics)
- [ ] State focal length (e.g., "85mm")
- [ ] State aperture (e.g., "f/1.2")
- [ ] Optionally specify camera body for color science

### 3. Command the "Cleanup" (Semantic Edits)
- [ ] List specific objects to remove (not vague "clutter")
- [ ] Specify replacement textures if needed
- [ ] Note any areas requiring upscaling

### 4. Define the "Output" (Resolution)
- [ ] Explicitly request "4K high-fidelity render"
- [ ] This triggers maximum resolution mode

### 5. Trigger the Reasoning Engine
- [ ] Include `[REASONING: Calculate true light paths]`
- [ ] Add physics triggers as needed (shadows, reflections, depth)

---

## Common Pitfalls

### Using the "Fast" Model
- Caps at 1K resolution
- Will look "AI-soft" on large screens
- Always specify Pro model for final renders

### Forgetting Subject Fidelity
- Without explicit instruction, the engine may "improve" your specific subject into a generic version
- Always add: `Maintain 100% subject identity fidelity` when preserving specific people/products

### Vague Cleanup Commands
- "Remove clutter" gives the AI too much discretion
- Be specific: name objects, describe replacement textures

### Skipping Physics Triggers
- Without `[REASONING: Calculate true light paths]`, you may get filter-style results
- The reasoning engine needs explicit activation

### Architecture and Straight Lines
- Spatial logic can struggle with complex architecture
- Always verify straightness of walls, windows, bay windows in final render
- May need multiple generations for architectural shots

---

## Advanced Techniques

### Multi-Pass Rendering

For complex scenes, consider breaking into passes:
1. First pass: Composition and lighting
2. Second pass: Detail enhancement on specific areas
3. Third pass: Final color grade and polish

### Style Transfer with Physics

Combine mood references with physics triggers:
```
Using Slots 2-4 as lighting reference, calculate how this light setup would physically interact with the surfaces in Slot 1. Apply ray-traced reflections on all metallic and glass surfaces.
```

### Hybrid Real/Generated Scenes

Keep your subject real, generate the environment:
```
Maintain the subject from Slot 1 with 100% identity fidelity. Generate a new environment matching the aesthetic of Slots 2-4, ensuring physically accurate integration of subject shadows and reflections.
```
