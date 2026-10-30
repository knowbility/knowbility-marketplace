# Ground truth

Mechanically extracted from the repository by `dev/scripts/ground-truth.mjs`. Every
invocable name, version, and shipped path that actually exists, listed recursively.
Check the documentation against this, not against itself.

## Marketplace catalog

- marketplace name: `knowbility`  (so install syntax is `<plugin>@knowbility`)
- owner: Knowbility
- registered plugins: 6

  - `know-product-spec` from `./know-product-spec`
  - `know-qa-agent` from `./know-qa-agent`
  - `know-security` from `./know-security`
  - `know-photo-generator` from `./know-photo-generator`
  - `know-blueprint` from `./know-blueprint`
  - `know-researcher` from `./know-researcher`

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
- manifest description: `v0.1.0 — Get a professional-grade photo from a plain-language description, without knowing what a key light or an 85mm prime is. A guided workflow turns your scene into a physics-aware Nano Banana Pro prompt — camera body, lens, lighting setup, and color grade chosen from a curated reference library — then generates the image directly via the Gemini API at the right aspect ratio for print, social, or hero-banner use. /know-photo:setup handles the API key (pasted into a local keys.env, never the chat) and an optional default house style; batch and variations modes cover shot lists and multiple takes. Standalone; runs on its own.`
- catalog description: `v0.1.0 — Get a professional-grade photo from a plain-language description, without knowing what a key light or an 85mm prime is. A guided workflow turns your scene into a physics-aware Nano Banana Pro prompt — camera body, lens, lighting setup, and color grade chosen from a curated reference library — then generates the image directly via the Gemini API at the right aspect ratio for print, social, or hero-banner use. /know-photo:setup handles the API key (pasted into a local keys.env, never the chat) and an optional default house style; batch and variations modes cover shot lists and multiple takes. Standalone; runs on its own.`
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

## know-blueprint

- manifest name: `know-blueprint`
- version: `0.1.0`
- manifest description: `v0.1.0 — Turn how you actually work into a structured process model. A guided interview extracts what people forget to write down — triggers, data movement, decision criteria, exceptions, approval authority — then rates every step Automate, Monitor, or Human so you know where automation is safe and where a human must stay in the loop. The ratings are a reviewed draft, not a safety certification, until a stakeholder signs off, and any step that turns on accessibility judgment defaults to Human. Discover sweeps your recurring work into a process inventory when you can't yet name your processes; capture models a process you already run; design models a new one you don't yet, proposing an intended flow grounded in your real constraints and nearest analog, never invented. Standalone; runs on its own.`
- catalog description: `v0.1.0 — Turn how you actually work into a structured process model. A guided interview extracts what people forget to write down — triggers, data movement, decision criteria, exceptions, approval authority — then rates every step Automate, Monitor, or Human so you know where automation is safe and where a human must stay in the loop. The ratings are a reviewed draft, not a safety certification, until a stakeholder signs off, and any step that turns on accessibility judgment defaults to Human. Discover sweeps your recurring work into a process inventory when you can't yet name your processes; capture models a process you already run; design models a new one you don't yet, proposing an intended flow grounded in your real constraints and nearest analog, never invented. Standalone; runs on its own.`
- install command: `/plugin install know-blueprint@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/blueprint-capture/` → `name: blueprint-capture` → user types **`/know-blueprint:blueprint-capture`**
- `skills/blueprint-design/` → `name: blueprint-design` → user types **`/know-blueprint:blueprint-design`**
- `skills/blueprint-discover/` → `name: blueprint-discover` → user types **`/know-blueprint:blueprint-discover`**
- `skills/blueprint-guide/` → `name: blueprint-guide` → user types **`/know-blueprint:blueprint-guide`**

**Commands (path → how a user types it):**

- `commands/know-blueprint/capture.md` → user types **`/know-blueprint:capture`**
- `commands/know-blueprint/design.md` → user types **`/know-blueprint:design`**
- `commands/know-blueprint/discover.md` → user types **`/know-blueprint:discover`**
- `commands/know-blueprint/guide.md` → user types **`/know-blueprint:guide`**

**Every shipped file (19 files, recursive):**

- `.claude-plugin/plugin.json`
- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `commands/know-blueprint/capture.md`
- `commands/know-blueprint/design.md`
- `commands/know-blueprint/discover.md`
- `commands/know-blueprint/guide.md`
- `reference/README.md`
- `reference/blueprint-template.md`
- `reference/design-doctrine.md`
- `reference/discovery-sweep.md`
- `reference/example-blog-content-blueprint.md`
- `reference/process-inventory-template.md`
- `skills/blueprint-capture/SKILL.md`
- `skills/blueprint-design/SKILL.md`
- `skills/blueprint-discover/SKILL.md`
- `skills/blueprint-guide/SKILL.md`
- `templates/CLAUDE.md`

## know-researcher

- manifest name: `know-researcher`
- version: `1.18.0`
- manifest description: `v1.18.0 — Get research you can stand behind, not a confident summary that might be invented. Describe your research challenge and work through a phased plan grounded in it: collecting sources, finding patterns, mapping gaps, synthesizing findings, and auditing every claim back to its source note — and every note to a declared source. Decisions the project records — corrections, resolutions, accepted gaps, your own directives — are durable, and no later draft can quietly walk one back. Completion is gated by your stated success criteria and an independent adversarial review of the whole corpus. Confidence tiers rate how well the evidence supports a claim, nothing more: a sourced finding about an accessibility requirement is a reading of the standard, not a conformance determination about any product. A research partner, not a summarizer. Standalone; runs on its own.`
- catalog description: `v1.18.0 — Get research you can stand behind, not a confident summary that might be invented. Describe your research challenge and work through a phased plan grounded in it: collecting sources, finding patterns, mapping gaps, synthesizing findings, and auditing every claim back to its source note — and every note to a declared source. Decisions the project records — corrections, resolutions, accepted gaps, your own directives — are durable, and no later draft can quietly walk one back. Completion is gated by your stated success criteria and an independent adversarial review of the whole corpus. Confidence tiers rate how well the evidence supports a claim, nothing more: a sourced finding about an accessibility requirement is a reading of the standard, not a conformance determination about any product. A research partner, not a summarizer. Standalone; runs on its own.`
- install command: `/plugin install know-researcher@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/research-audit-claims/` → `name: research-audit-claims` → user types **`/know-researcher:research-audit-claims`**
- `skills/research-check-gaps/` → `name: research-check-gaps` → user types **`/know-researcher:research-check-gaps`**
- `skills/research-cross-ref/` → `name: research-cross-ref` → user types **`/know-researcher:research-cross-ref`**
- `skills/research-discover/` → `name: research-discover` → user types **`/know-researcher:research-discover`**
- `skills/research-graph-analysis/` → `name: research-graph-analysis` → user types **`/know-researcher:research-graph-analysis`**
- `skills/research-init/` → `name: research-init` → user types **`/know-researcher:research-init`**
- `skills/research-phase-insight/` → `name: research-phase-insight` → user types **`/know-researcher:research-phase-insight`**
- `skills/research-process-source/` → `name: research-process-source` → user types **`/know-researcher:research-process-source`**
- `skills/research-progress/` → `name: research-progress` → user types **`/know-researcher:research-progress`**
- `skills/research-review-corpus/` → `name: research-review-corpus` → user types **`/know-researcher:research-review-corpus`**
- `skills/research-start-phase/` → `name: research-start-phase` → user types **`/know-researcher:research-start-phase`**
- `skills/research-summarize-section/` → `name: research-summarize-section` → user types **`/know-researcher:research-summarize-section`**

**Commands (path → how a user types it):**

- `commands/know-research/audit-claims.md` → user types **`/know-research:audit-claims`**
- `commands/know-research/check-gaps.md` → user types **`/know-research:check-gaps`**
- `commands/know-research/cross-ref.md` → user types **`/know-research:cross-ref`**
- `commands/know-research/discover.md` → user types **`/know-research:discover`**
- `commands/know-research/graph-analysis.md` → user types **`/know-research:graph-analysis`**
- `commands/know-research/init.md` → user types **`/know-research:init`**
- `commands/know-research/phase-insight.md` → user types **`/know-research:phase-insight`**
- `commands/know-research/process-source.md` → user types **`/know-research:process-source`**
- `commands/know-research/progress.md` → user types **`/know-research:progress`**
- `commands/know-research/review-corpus.md` → user types **`/know-research:review-corpus`**
- `commands/know-research/start-phase.md` → user types **`/know-research:start-phase`**
- `commands/know-research/summarize-section.md` → user types **`/know-research:summarize-section`**

**Agents:**

- `agents/corpus-reviewer.md`
- `agents/research-integrity.md`

**Every shipped file (84 files, recursive):**

- `.claude-plugin/plugin.json`
- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `agents/corpus-reviewer.md`
- `agents/research-integrity.md`
- `commands/know-research/audit-claims.md`
- `commands/know-research/check-gaps.md`
- `commands/know-research/cross-ref.md`
- `commands/know-research/discover.md`
- `commands/know-research/graph-analysis.md`
- `commands/know-research/init.md`
- `commands/know-research/phase-insight.md`
- `commands/know-research/process-source.md`
- `commands/know-research/progress.md`
- `commands/know-research/review-corpus.md`
- `commands/know-research/start-phase.md`
- `commands/know-research/summarize-section.md`
- `hooks/gate-outputs.sh`
- `hooks/hooks.json`
- `hooks/setup-paths.sh`
- `hooks/state-staleness-check.sh`
- `reference/corpus-review-brief.md`
- `reference/corpus-review-protocol.md`
- `reference/coverage-assessment-guide.md`
- `reference/discovery/channel-playbooks/academic.md`
- `reference/discovery/channel-playbooks/domain-specific.md`
- `reference/discovery/channel-playbooks/financial.md`
- `reference/discovery/channel-playbooks/regulatory.md`
- `reference/discovery/channel-playbooks/social-signals.md`
- `reference/discovery/channel-playbooks/web-search.md`
- `reference/discovery/type-channel-maps/company-for-profit.md`
- `reference/discovery/type-channel-maps/company-non-profit.md`
- `reference/discovery/type-channel-maps/competitive-analysis.md`
- `reference/discovery/type-channel-maps/curriculum-research.md`
- `reference/discovery/type-channel-maps/customer-safari.md`
- `reference/discovery/type-channel-maps/exploratory-thesis.md`
- `reference/discovery/type-channel-maps/market-industry.md`
- `reference/discovery/type-channel-maps/opportunity-discovery.md`
- `reference/discovery/type-channel-maps/person-research.md`
- `reference/discovery/type-channel-maps/prd-validation.md`
- `reference/discovery/type-channel-maps/presentation-research.md`
- `reference/evidence-failure-modes.md`
- `reference/pattern-recognition-guide.md`
- `reference/posture-register.md`
- `reference/prompt-templates-guide.md`
- `reference/prompt-templates-runtime.md`
- `reference/review-protocol-contract.json`
- `reference/source-assessment-guide.md`
- `reference/templates/canonical-figures.json`
- `reference/templates/completion-criteria.md`
- `reference/templates/cross-reference.md`
- `reference/templates/decision-ledger.md`
- `reference/templates/registry.md`
- `reference/templates/review-protocol.json`
- `reference/templates/source-standards.md`
- `reference/templates/types/company-for-profit.md`
- `reference/templates/types/company-non-profit.md`
- `reference/templates/types/competitive-analysis.md`
- `reference/templates/types/curriculum-research.md`
- `reference/templates/types/customer-safari.md`
- `reference/templates/types/exploratory-thesis.md`
- `reference/templates/types/market-industry.md`
- `reference/templates/types/opportunity-discovery.md`
- `reference/templates/types/person-research.md`
- `reference/templates/types/prd-validation.md`
- `reference/templates/types/presentation-research.md`
- `reference/tools-guide.md`
- `reference/validate-corpus-review.py`
- `reference/where-am-i.py`
- `reference/workflow-ownership.md`
- `reference/writing-standards.md`
- `skills/research-audit-claims/SKILL.md`
- `skills/research-check-gaps/SKILL.md`
- `skills/research-cross-ref/SKILL.md`
- `skills/research-discover/SKILL.md`
- `skills/research-graph-analysis/SKILL.md`
- `skills/research-init/SKILL.md`
- `skills/research-phase-insight/SKILL.md`
- `skills/research-process-source/SKILL.md`
- `skills/research-progress/SKILL.md`
- `skills/research-review-corpus/SKILL.md`
- `skills/research-start-phase/SKILL.md`
- `skills/research-summarize-section/SKILL.md`

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
- `know-blueprint/`
- `know-photo-generator/`
- `know-product-spec/`
- `know-qa-agent/`
- `know-researcher/`
- `know-security/`

