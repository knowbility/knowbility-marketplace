# Brand Styles Reference

This file defines brand-specific photography defaults. Use with the `--style` flag:
- `/know-photo:generate --style "Knowbility"` — Quick mode with brand defaults
- `/know-photo:generate --full --style "Knowbility"` — Full walkthrough with brand defaults as recommendations

`--style none` skips brand defaults entirely and runs generic.

---

## Design-Ready Headshot

**Aesthetic:** Clean, modern executive portrait optimized for marketing assets. Generous negative space for text overlay and graphic design. Professional but approachable — versatile enough for websites, social cards, presentations, and print collateral.

### Camera
- **Body:** Sony A7C II
- **Why:** Natural color rendering with clean skin tones. Lightweight body matches the approachable, modern feel — not overly clinical like medium format.

### Lens
- **Lens:** 50mm f/2
- **Aperture:** f/2
- **Why:** Moderate depth of field keeps the subject sharp while softening the solid-color backdrop. 50mm gives a natural perspective with room for generous framing — wider than 85mm to allow negative space without backing up too far.

### Lighting
- **Style:** Soft diffused studio
- **Key Light:** Large softbox or beauty dish from camera right, slightly above eye level — soft and even
- **Fill Light:** Gentle fill from camera left at 1.5 stops below key, opening shadows without going flat
- **Rim/Hair Light:** Subtle separation light from above/behind

### Post-Processing
- **Style:** Clean balanced
- **Contrast:** Moderate — professional and crisp without being dramatic
- **Saturation:** True-to-life, balanced tones
- **Shadows:** Open and clean
- **Overall:** Neutral color grading, accurate fabric and skin colors. No film emulation or heavy stylization.

### Brand Rules
- **Subject Treatment:** Mid-torso up framing with generous negative space on all sides — especially above the head and to the left and right. Subject looks directly at camera. Body facing camera. Calm, assured expression.
- **Composition:** Design-first — the portrait is an element in a larger layout. Leave room for text overlay, logos, and graphic elements. Subject does not fill the frame.
- **Environment:** Solid color studio backdrop. Default: `#B1CDCB` (muted sage). Can be specified per-shot with any hex color.
- **Always:** Generous negative space, direct eye contact, natural realistic skin texture, crisp fabric detail, solid uninterrupted background
- **Never:** Tight crops that fill the frame, busy or gradient backgrounds, heavy post-processing, ultra-shallow bokeh that loses clothing detail

### Master Prompt Template
```
[REASONING: Calculate true light paths and physically accurate shadows based on soft diffused studio lighting from camera right, slightly above eye level. Volumetric depth for natural background separation.]

A professional, high-resolution portrait photo. Maintain 100% subject identity fidelity — preserve exact facial structure, bone structure, eye shape, eye color, brow shape, skin tone, and hair. Only modify environment, clothing, lighting, and optical quality.

The subject is framed from mid-torso up with generous negative space on all sides, especially above the head and to the left and right, allowing room for text overlay or graphic design elements. The person looks directly at the camera with a calm, assured expression, body facing the camera.

GEAR: Shot on Sony A7C II, 50mm f/2 lens.

LIGHTING: Soft, diffused studio lighting, gently illuminating the face. Even, flattering light with subtle dimensionality. Solid studio backdrop — default #B1CDCB or as specified.

CLEANUP:
- Ensure clean, uninterrupted solid-color background
- Crisp detail on fabric texture
- Natural realistic skin texture — no plastic smoothing
- Remove all environmental distractions

POST: Clean color grading with balanced tones. Neutral, professional. True-to-life fabric and skin colors. No film emulation.

OUTPUT: 4K high-fidelity render.
```

---

## Knowbility

**Aesthetic:** [To be defined — not yet documented by Knowbility]

Knowbility's `organization/branding/visual-identity.md` currently lists logo, colors, typography,
and photography as open items, and names disability representation guidelines and alt-text
standards among them. This section is deliberately a template rather than a guess: a photographic
house style for a digital accessibility organization is not something to infer from a website, and
representation guidance in particular has to come from the organization.

Fill it by running `/know-photo:setup`, which interviews for a style without requiring photography
vocabulary, or by following **Adding New Brand Styles** below with 5 to 10 representative photos.

### Camera
- **Body:** [TBD]
- **Why:** [TBD]

### Lens
- **Lens:** [TBD]
- **Aperture:** [TBD]
- **Why:** [TBD]

### Lighting
- **Style:** [TBD]
- **Key Light:** [TBD]
- **Fill Light:** [TBD]
- **Rim/Hair Light:** [TBD]

### Post-Processing
- **Style:** [TBD]
- **Contrast:** [TBD]
- **Saturation:** [TBD]
- **Shadows:** [TBD]
- **Overall:** [TBD]

### Brand Rules
- **Subject Treatment:** [TBD]
- **Composition:** [TBD]
- **Environment:** [TBD]
- **Always:** [TBD]
- **Never:** [TBD]
- **Representation:** [TBD — must come from Knowbility, not inferred. Until it is filled in, do
  not use this style for anything public-facing that depicts people.]

### Master Prompt Template
```
[To be generated after style analysis]
```

---

## Adding New Brand Styles

To add a new brand style:

1. Upload 5-10 representative photos to Gemini/Nano Banana
2. Use this analysis prompt:

```
Analyze these images as a set and identify the consistent photographic style. For each of the following, tell me the specific settings that would recreate this look:

1. CAMERA BODY: Which camera sensor best matches the color science, dynamic range, and rendering characteristics? (e.g., Sony A7R V, Hasselblad X2D 100C, Leica M11, etc.)

2. LENS: What focal length and aperture best matches the depth of field, compression, and bokeh characteristics? (e.g., 35mm f/1.4, 85mm f/2.8, etc.)

3. LIGHTING: Describe the lighting setup — key light position, quality (hard/soft), fill ratio, any rim or accent lights, natural vs studio.

4. POST-PROCESSING: What color grade best describes this look? Include contrast level, saturation style, shadow treatment, highlight rolloff, and any film stock or aesthetic it resembles.

5. BRAND RULES: Any consistent patterns you notice — subject treatment, environment style, composition tendencies, things that are always/never present.

Format your response so I can use these settings directly in a Nano Banana Pro prompt.
```

3. Add the results to this file following the template above.
