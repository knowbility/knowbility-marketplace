# STATE — Knowbility marketplace

*Last updated: 2026-10-30*

## Where things stand

**All four plugins are ported, and the documentation has been through two independent readiness
reviews.** Phases 0-1 committed as `6914684`, Phase 2 as `be8d1cd`, Phase 3 as `768a815`,
documentation as `b6f8d9a` and this round. Four plugins registered at 0.1.0: `know-product-spec`, `know-security`,
`know-photo-generator`, `know-qa-agent`. Gates pass: version-prefix parity 8/8, marketplace
manifest, four plugin manifests, `know-security`'s 66-case suite, `know-photo-generator`'s key
check, and for `know-qa-agent` module resolution across all ten harness tools plus a real engine
spec compile. **Nothing has been pushed** to `knowbility/knowbility-marketplace`.

**The adversarial de-branding sweep is done.** Two gates remain before a push: a **live browser
run** of `know-qa-agent` from a cold install, and a verified answer for **Claude Desktop private-
repository authentication** (see Open questions).

## The work

Migrating four plugins in from two other marketplaces, de-branded so Knowbility can configure them
for their own use. The plan is `review/migration-plan.md`; the independent planning review that
revised it is in `.team-runs/20261030T135852Z-8b0bac54/`.

| Phase | Work | State |
|---|---|---|
| 0 | Scaffold | **Done, unpushed** |
| 1 | `know-product-spec` + `know-security` | **Done, committed** |
| 2 | `know-photo-generator` | **Done, committed** |
| 3 | `know-qa-agent` | **Done; sweep passed; live run outstanding** |
| Docs | Two readiness reviews, every finding verified and acted on | **Done, committed** |
| 4 | Accessibility report presentation and conformance verdicts | Deferred, needs auditor input |
| 5 | Conformance-reporting plugin | Unscoped, requirements first |

## Decisions made

- **`know-` prefix at two layers**, install name and invocation namespace. Verified: installed
  plugins are keyed `<plugin>@<marketplace>` so install names never truly collide, but the typed
  short command comes from a skill's `name:` frontmatter, so that layer is the one preventing a
  real collision. Rationale is in `AGENTS.md`.
- **No shared-state contract adopted.** The planning review flagged the candidate convention for
  missing locking and contradictory row ownership. On inspection none of the four migrating
  plugins uses shared files at all, so the convention was dropped rather than fixed. `AGENTS.md`
  keeps the principle in four lines and no schema.
- **Baseline WCAG criterion mapping moves into Phase 3, not Phase 4.** `axe-core@4.12.1` already
  carries the success criteria in each violation's `tags` array, and the current `axe.mjs` drops
  them. Adding the mapping is a passthrough plus a formatter, not a judgment call. Only report
  presentation and per-criterion conformance verdicts stay deferred, because a verdict needs a
  declared untested scope.
- **Versions reset to 0.1.0** for all four on arrival, with changelog entries naming the fork
  origin and what was removed.
- **Phase 3 gate strengthened** beyond manifest validation: scaffold run on a throwaway repo, spec
  compile, a run that exercises deduplication, both deterministic accessibility passes, and a grep
  for dynamic references (import-graph analysis only catches static imports).

## Phase 1 notes

- **The effort estimate for `product-spec` was wrong, and the reason matters.** It was scoped at
  two references and thirty minutes from a grep for source-organization *brand names*. The port
  actually carried six internal wiki page identifiers in provenance footers across five reference
  files, a 300-line changelog describing releases and cross-plugin dependencies that do not exist
  here, and a user-facing output directory to rename. **Grep for identifiers, not just names:**
  long digit runs, commit shas, hostnames, ticket and page IDs. Both later ports should be scoped
  that way before they are estimated.
- **`.product-spec/` became `.know-product-spec/`.** That is the directory the plugin writes into
  a user's own project (state, notes, decomposition, history). Renaming it means state never mixes
  with the source plugin's if both are installed, at the cost of a longer directory name in a
  user's repo. Flagged because it is user-facing.
- **`know-security` needed two passes.** The first sweep found one dated acceptance example with a
  real owner name and commit sha; a broader sweep found a second instance of the same sha in a
  different shape in `staleness.mjs`. The narrow pattern missed it. A plugin's own `AGENTS.md`
  also carried a stale test path and a stale case count.
- **The `know-security` test suite and blind reviews came along**, into
  `dev/know-security/tests/` and `dev/know-security/blind-reviews/`. The changelog and README both
  cite them, so the alternative was stripping the references. The suite is the plugin's functional
  gate and it passes 66 of 66 against the ported scripts, which is also what confirms the schema
  namespace rename did not break the scanners.
- **`S-YYYYMMDD-NN` strings stay.** Those are the security plugin's own finding-ID format
  examples in docs and one regex comment. They carry no organization content.

## Phase 2 notes

- **The identifier scan found nothing in `photo-generator`.** No shas, no internal IDs, no
  hostnames beyond public ones. So this one genuinely was the light port the original estimate
  claimed, and the revised scanning method is what establishes that rather than asserting it.
- **No Knowbility brand style was written.** Their `visual-identity.md` lists logo, colors,
  typography and photography as open items and names disability representation guidelines among
  them. A photographic house style for an accessibility organization is not inferable from a
  website, so the section ships as a template with its fields unfilled, a note saying why, and a
  **Representation** rule marked as having to come from Knowbility. `/know-photo:generate` was
  also changed to refuse to fill in a `[TBD]` style, on the reasoning that a template is an
  unanswered question rather than a default; it offers setup or `--style none` instead.
- **The brand-style library went 264 lines to 143.** Both source house styles and an undefined
  placeholder removed; the brand-neutral Design-Ready Headshot and the style-authoring guide kept.
- **The config directory was renamed, and this is inconsistent with a judgment worth recording.**
  `.photo-generator/` became `.know-photo-generator/` across all 40 references, which covers
  `keys.env` alongside `config.json` and `photo-styles.md`. The key file is a shareable
  third-party credential and sharing it would have been a convenience; the other two are state
  that would diverge between the two plugins. Splitting the resolution path was rejected as
  disproportionate complexity in a plugin whose key-hygiene rules are deliberately simple, so
  everything moved. The cost falls only on someone running both plugins, and
  `GEMINI_API_KEY` in the environment is checked first and serves both.
- **Image generation itself is unverified.** The `--check-keys` path runs and validated against
  the live API, but no image was rendered, because that bills a real generation.

## Phase 3 notes

- **4,787 lines removed across 11 files**, slightly more than the 4,748 estimated, because
  `session-binding.mjs` had not been counted. The cut was clean as predicted: the drivers' helper
  modules had no importers outside the drivers, the engine never referenced any of it, and
  `seedAllowedForConfig` came out while `writeAllowedForConfig` (the one `drive.mjs` uses) stayed.
- **I was wrong about deleting the two computed-style inspectors.** `inspect-chat.mjs` and
  `inspect-labels.mjs` were on the delete list from the original survey. They are generic tools
  whose project-specific values had already been lifted to flags upstream, and `skills/pair/SKILL.md`
  depends on them. They stayed, with their default labels relabelled as worked-example values.
- **The state-directory rename needed more than a slash pattern.** Code refers to it both as
  `.qa/` and as a bare quoted `'.qa'` (`resolve(project, '.qa')`, `[ -d ".qa" ]`). A slash-only
  rename would have left the code on the old path while every document described the new one, with
  nothing failing loudly. 416 references, matched on `.qa` as a complete path segment. Verified in
  behavior, not just text: the engine compiled a real spec and wrote its run manifest into
  `.know-qa/runs/`.
- **The identifier scan paid for itself a third time.** It found a real personal email address in
  an example reporting-sink config and a real ticket key in a reference document, neither of which
  a scan for organization names would have surfaced.
- **Two worked examples were rewritten, not deleted.** The tracker filing guide carried a live
  Atlassian cloudId, a site host, two ticket keys, a board number, a sprint id and a component
  list. Its teaching structure is the valuable part (one project's contract, then a counter-instance
  on the same site that inverts the contract's most important field, then "what the two share is
  the procedure, not the values"), so it was rebuilt intact on two fictional projects.
- **WCAG criterion annotation landed here, as the planning review argued it should.** `axe.mjs` was
  discarding each rule's `tags` array, which is where axe-core records the success criteria the
  rule tests. Violations and needs-review results now carry their criteria and conformance level,
  derived from that metadata rather than a hand-maintained table, so the mapping cannot drift from
  the pinned axe-core. Unit-tested on five tag shapes including `wcag2410` -> 2.4.10.
- **Deliberately no per-criterion pass/fail verdict.** A criterion axe has no rule for is untested,
  not satisfied, and the script cannot tell those apart. A verdict needs declared untested scope,
  which is the Phase 5 boundary. `reference/wcag-mapping.md` is new and states the four reasons
  this is coverage rather than conformance.
- **I misread a truncated sweep output once.** A README line matched on `/qa:` and I read the
  truncation as being about a stale version number, missing that the same line ended with a
  source-marketplace credit. Read sweep output at full width.

## The adversarial de-branding sweep (`.team-runs/20261030T144100Z-fade2e44/`)

Codex reviewed a 77 KB packet: a machine-extracted candidate digest (355 lines from 66 files
across all four plugins, with the extraction patterns themselves listed), the full 148-file
inventory, and the criteria. The trees are 1.26 MB against a 160 KB budget, so a hand-picked file
sample would have biased the review toward what was already suspected; sending the complete
extraction plus the patterns that produced it put the method under review instead.

**Verdict: no confirmed leftover in any of the five finding classes.** The report is explicit that
this is not a clean bill of health, because it never saw the trees, and it declines to approve the
migration. That is the correct posture and the reason the packet was built that way.

**It found three real blind spots in the extraction**, and closing them surfaced **zero new
findings**, which is the useful result:

| Gap | What the patterns could not catch | Outcome after closing |
|---|---|---|
| General secrets | Only vendor-prefixed keys were detected. A bare `password = "..."` or a private-key header matched nothing. | 34 hits, every one a visible placeholder (`password123`, `hunter2`, `{password}`) or the word "pass" in prose. |
| Plain-language identity and process | Lowercase name fields and process rules expressed in ordinary words, with no proper noun, digit or `@`. | 24 name-field and 7 process-rule hits, all fictional exemplar personas and ordinary prose. |
| Bare internal hosts and paths | Hosts outside a URL, Linux paths, repo slugs, short tracker keys. | 2 internal-host hits, both truncation artifacts of `env.local`. Zero path or repo hits. |

**Two real findings came out of it and are fixed:**

1. **Non-reserved example domains.** `staging.my-app.com` and `staging.store.com` appeared in five
   example commands across three files. Not organization identifiers, but not reserved either, so
   a copy-pasted command would have sent a request to a host neither we nor Knowbility own. Now
   `example.com` variants.
2. **Three bare old-namespace references the rename missed.** `/know-qa:help` was documented as
   normalizing `qa:run` to `run`, and the orchestration doc said the same. The rename pattern
   required a leading slash, so bare `qa:` escaped it. This one was functional, not cosmetic: the
   help skill would have normalized a prefix the plugin no longer uses. Found by reading the sweep
   output at full width, which is the lesson from the Phase 3 note above.

**It also named the right unresolved candidate and the right question.** The rewritten tracker
filing guide is full of concrete operational detail (a board number, an epic, a label, custom
field IDs) and the digest alone cannot show whether those are real or deliberately fictional. The
question it asked is the one that matters: does anything *import* those values as defaults?
Checked: nothing does. `reference/filing-procedure.md` learns the shape per project by asking the
human and caching a `filing-contract.md`, and it treats both "active board" and "backlog" as
correct answers. Spot-checked two more of its named class-5 files: `login.mjs` has no hardcoded
selectors at all (a human signs in and the session persists), and the photo scene presets are
generic photography categories.

**The patterns are now a tool, not a lesson.** `dev/scripts/identifier-sweep.mjs` carries the full
reviewed pattern set with the history of why each class exists, a benign-value allowlist, and a
docstring stating plainly what it cannot find. Run it on anything forked in here before estimating
the work.

Current state across all four plugins: **292 candidate lines, all reviewed, none a finding.** The
count is dominated by 166 `tracker_key` hits, which are document section markers (`P-1`, `F-012`,
`S-1`) and finding-ID format examples rather than tracker references, plus 34 placeholder
credentials and 24 fictional exemplar personas. That ratio is the tool working as intended: the
classes that would catch a real leak are also the noisiest, so the output is a reading list, never
a verdict. A low number here would mean the patterns are too narrow, which is exactly the failure
the adversarial review found in the first version.

**What the sweep could not assess, in its own words:** whether an operational assumption is spread
across several files, which needs a person reading whole files; and credential provenance, since
shape alone is not proof. Both remain open by nature rather than by omission.

## Documentation readiness: two review rounds

Both rounds ran `cli-team run review --lead claude` against the complete user-facing documentation
set, with a mechanically generated ground truth so the reviewers checked the docs against the
repository rather than against themselves. Round 1 is `.team-runs/20261030T145615Z-d6eb4518/`,
round 2 `.team-runs/20261030T161529Z-dcdefa5d/`. Both reviewers answered **No** both times.

**Round 1's blocker was the front door**: the docs never said what Claude is, where to get it, or
that a `/`-command is typed inside Claude rather than at a shell prompt. Fixed in `b6f8d9a`, along
with four overclaims and a command that did not exist (`/know-qa-agent:run`).

**Round 2 found that the fixes had not reached the per-plugin guides.** The pattern worth
remembering: fixing the front door while leaving the same claim standing in the plugin's own README
is not fixing it, and the second review existed to catch exactly that.

What round 2 established, in order of how much it mattered:

- **The accessibility numbers were wrong, measured against the pinned axe-core 4.12.1.** Both
  READMEs said "~90 deterministic WCAG rules" and "every finding carries its success criteria."
  The real figures: **105 rules, of which 75 carry a WCAG success criterion and 30 are axe's own
  best-practice rules that map to none** (`heading-order`, `empty-heading`, `focus-order-semantics`
  among them). A finding from one of those 30 carries no criterion. `reference/wcag-mapping.md:15`
  had this right all along — the canon was correct and the README copy overclaimed past it. For an
  accessibility nonprofit this was the most important finding in either round.
- **A contradiction created by round 1's own fix.** The README was corrected to say the dependency
  check contacts the package registry, but `know-security`'s plugin manifest and the marketplace
  catalog still read "Never probes, never touches a network" — the text shown in the install UI.
  Only findable because round 2's ground truth included the manifest and catalog descriptions.
- **`docs/ORCHESTRATION.md` told you to install a deprecated package.** It said
  `npm install -g playwright-cli`; the npm registry confirms that package is a deprecated stub
  shipping no binary, whose own description says to use `@playwright/cli` instead. The READMEs were
  right and this one file was wrong.
- **Platform parity was overstated.** "The plugins work the same in both" is false for
  `/know-qa:monitor`, which rides Claude Code's native `/loop`. Now carved out in the first
  paragraph a reader sees.
- Plus: the QA quick start never said to have something to test; repository access ended in "ask a
  colleague" where `gh auth login` is a real self-service path; the photo guide put key acquisition
  after the setup command that needs it; prerequisites were split between the root and plugin
  guides; and `wcag-mapping.md` was named rather than linked.

**One correction I made to my own fix.** I first wrote that `know-qa-agent` needs a terminal
whichever Claude you use. That trades one overclaim for another: `/know-qa:init` installs the
browser driver itself. The accurate split is Node and Chrome are yours to install, the driver is
init's.

**Where the reviewers were wrong, and how it was settled.** Gemini asserted `@playwright/cli` does
not exist on npm and that the correct package is `playwright`. The registry says otherwise:
`@playwright/cli` 0.1.22 exists and ships the `playwright-cli` binary. This is the third confidently
wrong factual claim from that reviewer across the two rounds (round 1 offered `@claude/cli` as the
Claude Code package and `example.com` as a download link). **Check every cited fact; the reports
mix good findings with invented ones.** Codex's findings held up on verification both rounds.

**`dev/scripts/ground-truth.mjs`** now generates the inventory, recursively, including every
manifest and catalog description. Round 1's inventory was top-level only, which Codex correctly
flagged as unable to confirm nested paths. Re-run it before any future documentation review.

## Open questions

- **Provenance record.** `dev/PROVENANCE.md` names the two source marketplaces. It lives under
  `dev/`, so it never ships to a plugin user, but it does put source-organization names in the
  repository. Needs Kelsey's confirmation that this is the right read of the de-branding
  requirement.
- **Claude Desktop private-repository authentication.** Raised by both reviewers in round 2 as the
  most likely abandonment point. The README now gives a terminal self-check and `gh auth login` as
  the fix, which closes it for anyone willing to open a terminal once. What is still unverified is
  whether a Desktop-only user who never touches a terminal can install from a private repository at
  all. This needs someone who has actually done it, not a documentation edit.
- **Repo visibility.** Private today. Installing requires `knowbility` org read access plus git
  credentials per installer. Whether this eventually goes public is undecided, and it affects how
  much the `know-` prefix reads as a vendor prefix.
- **Maintenance model.** Who owns these after handoff: Knowbility outright, a fork Kelsey keeps
  syncing, or a seeded start they inherit later. Raised twice, including independently by the
  planning review, and still open. It affects documentation depth.
- **Attribution line** in the MIT header. Clearance to migrate is settled; what notice the license
  carries is a separate drafting detail.

## Next step

**Walk the cold install.** Both reviewers, both rounds, landed on the same thing no amount of
document review can replace: nobody has gone from nothing to a result through these instructions.
The two specific unknowns are the Claude Desktop plugin UI labels (taken from the Kenzie and
Hello Alice READMEs, never observed) and whether a Desktop-only user can authenticate to a private
repository at all. Then push.
