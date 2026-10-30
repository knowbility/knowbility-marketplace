# Ground truth

Mechanically extracted from the repository by `dev/scripts/ground-truth.mjs`. Every
invocable name, version, and shipped path that actually exists, listed recursively.
Check the documentation against this, not against itself.

## Marketplace catalog

- marketplace name: `knowbility`  (so install syntax is `<plugin>@knowbility`)
- owner: Knowbility
- registered plugins: 4

  - `know-product-spec` from `./know-product-spec`
  - `know-qa-agent` from `./know-qa-agent`
  - `know-security` from `./know-security`
  - `know-photo-generator` from `./know-photo-generator`

## know-product-spec

- manifest name: `know-product-spec`
- version: `0.1.0`
- manifest description: `v0.1.0 — Interviews you and writes a product spec an engineer can build from. Starts by testing whether the thing is worth building at all, and will tell you when it isn't. Then asks how it behaves, drafts the document, and grades its own draft by breaking it into workstreams and tasks, reporting every decision it had to invent so you can close the gap before someone else guesses. Once the work is filed it keeps going: grooming works a list of tickets with you, resolving, sharpening, or routing each one to whoever owns the call, and a UI review opens every surface a story needs in a browser, exercises it, and returns a readiness verdict with every finding traced to a contract (it needs browser tools in the session). Built for software product teams, tracker-agnostic, with your local vocabulary and style in an optional profile. Standalone.`
- catalog description: `v0.1.0 — Interviews you and writes a product spec an engineer can build from. Starts by testing whether the thing is worth building at all, and will tell you when it isn't. Then asks how it behaves, drafts the document, and grades its own draft by breaking it into workstreams and tasks, reporting every decision it had to invent so you can close the gap before someone else guesses. Once the work is filed it keeps going: grooming works a list of tickets with you, resolving, sharpening, or routing each one to whoever owns the call, and a UI review opens every surface a story needs in a browser, exercises it, and returns a readiness verdict with every finding traced to a contract (it needs browser tools in the session). Built for software product teams, tracker-agnostic, with your local vocabulary and style in an optional profile. Standalone.`
- install command: `/plugin install know-product-spec@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/clarify/` → `name: know-spec:clarify` → user types **`/know-spec:clarify`**
- `skills/decompose/` → `name: know-spec:decompose` → user types **`/know-spec:decompose`**
- `skills/discovery/` → `name: know-spec:discovery` → user types **`/know-spec:discovery`**
- `skills/file/` → `name: know-spec:file` → user types **`/know-spec:file`**
- `skills/groom/` → `name: know-spec:groom` → user types **`/know-spec:groom`**
- `skills/help/` → `name: know-spec:help` → user types **`/know-spec:help`**
- `skills/interview/` → `name: know-spec:interview` → user types **`/know-spec:interview`**
- `skills/start/` → `name: know-spec:start` → user types **`/know-spec:start`**
- `skills/ui-review/` → `name: know-spec:ui-review` → user types **`/know-spec:ui-review`**
- `skills/write/` → `name: know-spec:write` → user types **`/know-spec:write`**

**Every shipped file (31 files, recursive):**

- `.claude-plugin/plugin.json`
- `CHANGELOG.md`
- `README.md`
- `reference/authoring-rules.md`
- `reference/browser-protocol.md`
- `reference/exemplar/adversarial-build-note.md`
- `reference/exemplar/adversarial.md`
- `reference/exemplar/fixtures/shift-swap-board.html`
- `reference/exemplar/fixtures/swap-request.json`
- `reference/exemplar/perfect-annotated.md`
- `reference/exemplar/perfect.md`
- `reference/exemplar/weak.md`
- `reference/filed-work.md`
- `reference/legibility.md`
- `reference/profile.md`
- `reference/rubric.md`
- `reference/shapes.md`
- `reference/skeleton.md`
- `reference/surface-review.md`
- `reference/tracker-syntax.md`
- `skills/clarify/SKILL.md`
- `skills/decompose/SKILL.md`
- `skills/discovery/SKILL.md`
- `skills/file/SKILL.md`
- `skills/groom/SKILL.md`
- `skills/help/SKILL.md`
- `skills/interview/SKILL.md`
- `skills/start/SKILL.md`
- `skills/ui-review/SKILL.md`
- `skills/write/SKILL.md`
- `tools/prd-lint.mjs`

## know-qa-agent

- manifest name: `know-qa-agent`
- version: `0.1.0`
- manifest description: `v0.1.0 — Point it at any web app and it tests like a skeptical engineer, then reports what broke and why, with the evidence. A deterministic engine tracks the full test matrix so requested coverage can't silently disappear. Accessibility is first-class: a full axe-core ruleset pass and exact WCAG AA contrast math, each finding carrying the success criteria it maps to, with anything the tools cannot resolve reported as needs-review rather than guessed. Findings come back triaged, deduplicated, and ready to file, and a team can split the app into owned areas with roll-ups posted to Slack. Standalone.`
- catalog description: `v0.1.0 — Point it at any web app and it tests like a skeptical engineer, then reports what broke and why, with the evidence. A deterministic engine tracks the full test matrix so requested coverage can't silently disappear. Accessibility is first-class: a full axe-core ruleset pass and exact WCAG AA contrast math, each finding carrying the success criteria it maps to, with anything the tools cannot resolve reported as needs-review rather than guessed. Findings come back triaged, deduplicated, and ready to file, and a team can split the app into owned areas with roll-ups posted to Slack. Standalone.`
- install command: `/plugin install know-qa-agent@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/check/` → `name: know-qa:check` → user types **`/know-qa:check`**
- `skills/gen/` → `name: know-qa:gen` → user types **`/know-qa:gen`**
- `skills/guide/` → `name: know-qa:guide` → user types **`/know-qa:guide`**
- `skills/help/` → `name: know-qa:help` → user types **`/know-qa:help`**
- `skills/init/` → `name: know-qa:init` → user types **`/know-qa:init`**
- `skills/monitor/` → `name: know-qa:monitor` → user types **`/know-qa:monitor`**
- `skills/pair/` → `name: know-qa:pair` → user types **`/know-qa:pair`**
- `skills/report/` → `name: know-qa:report` → user types **`/know-qa:report`**
- `skills/run/` → `name: know-qa:run` → user types **`/know-qa:run`**
- `skills/start/` → `name: know-qa:start` → user types **`/know-qa:start`**

**Agents:**

- `agents/qa-tester.md`

**Every shipped file (75 files, recursive):**

- `.claude-plugin/plugin.json`
- `CHANGELOG.md`
- `README.md`
- `agents/qa-tester.md`
- `docs/HARNESS-GUIDE.md`
- `docs/ORCHESTRATION.md`
- `engine/browser-preflight.mjs`
- `engine/capabilities.mjs`
- `engine/cell.mjs`
- `engine/cleanup.mjs`
- `engine/compile.mjs`
- `engine/lib/capabilities.mjs`
- `engine/lib/cleanup.mjs`
- `engine/lib/compile.mjs`
- `engine/lib/manifest.mjs`
- `engine/lib/monitor.mjs`
- `engine/lib/payload.mjs`
- `engine/lib/result.mjs`
- `engine/lib/sanitize.mjs`
- `engine/lib/spec-parser.mjs`
- `engine/lib/store.mjs`
- `engine/lib/util.mjs`
- `engine/manifest.mjs`
- `engine/monitor.mjs`
- `engine/package.json`
- `engine/payload.mjs`
- `engine/schemas/result.schema.json`
- `engine/schemas/run-manifest.schema.json`
- `examples/SPEC-FORMAT.md`
- `examples/consistency-diff-example.md`
- `examples/jira-ticket-guide-example.md`
- `examples/qa-session-state-template.md`
- `examples/sample-login-spec.md`
- `examples/visual-testing-spec.md`
- `harness/tools/.gitignore`
- `harness/tools/audit.mjs`
- `harness/tools/auth-key.mjs`
- `harness/tools/axe.mjs`
- `harness/tools/capture-loading.mjs`
- `harness/tools/capture.mjs`
- `harness/tools/contrast.mjs`
- `harness/tools/drive.mjs`
- `harness/tools/fingerprint.mjs`
- `harness/tools/inspect-chat.mjs`
- `harness/tools/inspect-labels.mjs`
- `harness/tools/lib/auth-profile.mjs`
- `harness/tools/lib/environment-policy.mjs`
- `harness/tools/lib/evidence.mjs`
- `harness/tools/load-timing.mjs`
- `harness/tools/login.mjs`
- `harness/tools/nav-timing.mjs`
- `harness/tools/open-browser.sh`
- `harness/tools/package.json`
- `harness/tools/record.mjs`
- `harness/tools/setup.sh`
- `harness/tools/watch.mjs`
- `hooks/hooks.json`
- `hooks/session-start.md`
- `hooks/stop-gate.sh`
- `hooks/stop.md`
- `reference/filing-procedure.md`
- `reference/finding-lifecycle.md`
- `reference/reporting-sinks.md`
- `reference/safety.md`
- `reference/wcag-mapping.md`
- `skills/check/SKILL.md`
- `skills/gen/SKILL.md`
- `skills/guide/SKILL.md`
- `skills/help/SKILL.md`
- `skills/init/SKILL.md`
- `skills/monitor/SKILL.md`
- `skills/pair/SKILL.md`
- `skills/report/SKILL.md`
- `skills/run/SKILL.md`
- `skills/start/SKILL.md`

## know-security

- manifest name: `know-security`
- version: `0.1.0`
- manifest description: `v0.1.0 — Read the code the way someone trying to get at the data would read it. An adversarial security and privacy reviewer that runs alongside development, hunting the endpoint nobody remembered, the helper everyone uses except here, the log line that seemed harmless, and the personal data no deletion path reaches. Reports findings — severity, the attack path as read, the input that exercises it, the blast radius, the fix — across authorization, PII data flow, injection, authentication, secrets, XSS, SSRF, crypto, config, audit trails and dependencies. Confidence is welded to evidence type so it cannot claim exploitability without naming an input, and seven known-benign classes plus a read-before-classify rule keep it from crying wolf. Scripts locate candidates and say what they could not read; the agent judges. Never probes the system under review and never holds its credentials; the only network access is the dependency check running your project's own package auditor against your package registry, the same thing `npm audit` does. Standalone.`
- catalog description: `v0.1.0 — Read the code the way someone trying to get at the data would read it. An adversarial security and privacy reviewer that runs alongside development, hunting the endpoint nobody remembered, the helper everyone uses except here, the log line that seemed harmless, and the personal data no deletion path reaches. Reports findings — severity, the attack path as read, the input that exercises it, the blast radius, the fix — across authorization, PII data flow, injection, authentication, secrets, XSS, SSRF, crypto, config, audit trails and dependencies. Confidence is welded to evidence type so it cannot claim exploitability without naming an input, and seven known-benign classes plus a read-before-classify rule keep it from crying wolf. Scripts locate candidates and say what they could not read; the agent judges. Never probes the system under review and never holds its credentials; the only network access is the dependency check running your project's own package auditor against your package registry, the same thing `npm audit` does. Standalone.`
- install command: `/plugin install know-security@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/security-audit/` → `name: security-audit` → user types **`/know-security:security-audit`**
- `skills/security-init/` → `name: security-init` → user types **`/know-security:security-init`**
- `skills/security-review/` → `name: security-review` → user types **`/know-security:security-review`**
- `skills/security-sweep/` → `name: security-sweep` → user types **`/know-security:security-sweep`**

**Commands (path → how a user types it):**

- `commands/know-security/audit.md` → user types **`/know-security:audit`**
- `commands/know-security/init.md` → user types **`/know-security:init`**
- `commands/know-security/review.md` → user types **`/know-security:review`**
- `commands/know-security/sweep.md` → user types **`/know-security:sweep`**

**Agents:**

- `agents/security-reviewer.md`

**Every shipped file (26 files, recursive):**

- `.claude-plugin/plugin.json`
- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `agents/security-reviewer.md`
- `commands/know-security/audit.md`
- `commands/know-security/init.md`
- `commands/know-security/review.md`
- `commands/know-security/sweep.md`
- `reference/adversarial-list.md`
- `reference/finding-contract.md`
- `reference/honest-limits.md`
- `reference/safety.md`
- `scaffold/DECISIONS.md.tmpl`
- `scaffold/FINDINGS.md.tmpl`
- `scaffold/config.json.tmpl`
- `scaffold/scripts/check-decisions.mjs`
- `scaffold/scripts/check.mjs`
- `scaffold/scripts/lib/scan.mjs`
- `scaffold/scripts/locate.mjs`
- `scaffold/scripts/secrets.mjs`
- `scaffold/scripts/staleness.mjs`
- `skills/security-audit/SKILL.md`
- `skills/security-init/SKILL.md`
- `skills/security-review/SKILL.md`
- `skills/security-sweep/SKILL.md`

## know-photo-generator

- manifest name: `know-photo-generator`
- version: `0.1.0`
- manifest description: `v0.1.0 — Get a professional-grade photo from a plain-language description, without knowing what a key light or an 85mm prime is. A guided workflow turns your scene into a physics-aware Nano Banana Pro prompt — camera body, lens, lighting setup, and color grade chosen from a curated reference library — then generates the image directly via the Gemini API at the right aspect ratio for print, social, or hero-banner use. /photo-setup handles the API key (pasted into a local keys.env, never the chat) and an optional default house style; batch and variations modes cover shot lists and multiple takes. Standalone; runs on its own.`
- catalog description: `v0.1.0 — Get a professional-grade photo from a plain-language description, without knowing what a key light or an 85mm prime is. A guided workflow turns your scene into a physics-aware Nano Banana Pro prompt — camera body, lens, lighting setup, and color grade chosen from a curated reference library — then generates the image directly via the Gemini API at the right aspect ratio for print, social, or hero-banner use. /photo-setup handles the API key (pasted into a local keys.env, never the chat) and an optional default house style; batch and variations modes cover shot lists and multiple takes. Standalone; runs on its own.`
- install command: `/plugin install know-photo-generator@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/photo-generate/` → `name: photo-generate` → user types **`/know-photo-generator:photo-generate`**
- `skills/photo-setup/` → `name: photo-setup` → user types **`/know-photo-generator:photo-setup`**

**Commands (path → how a user types it):**

- `commands/know-photo/generate.md` → user types **`/know-photo:generate`**
- `commands/know-photo/setup.md` → user types **`/know-photo:setup`**

**Every shipped file (16 files, recursive):**

- `.claude-plugin/plugin.json`
- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `commands/know-photo/generate.md`
- `commands/know-photo/setup.md`
- `reference/brand-styles.md`
- `reference/cameras.md`
- `reference/lenses.md`
- `reference/lighting.md`
- `reference/nano-banana-engine.md`
- `reference/post-processing.md`
- `reference/scene-presets.md`
- `scripts/generate_image.py`
- `skills/photo-generate/SKILL.md`
- `skills/photo-setup/SKILL.md`

## Repository root (not shipped to plugin users)

- `.ai/`
- `.claude-plugin/`
- `.github/`
- `.gitignore`
- `.team-runs/`
- `AGENTS.md`
- `CLAUDE.md`
- `LICENSE`
- `README.md`
- `dev/`
- `know-photo-generator/`
- `know-product-spec/`
- `know-qa-agent/`
- `know-security/`

