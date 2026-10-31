# STATE — Knowbility marketplace

*Last updated: 2026-10-30*

## Where things stand

**Six plugins are ported, and the documentation has been through two independent readiness
reviews.** Phases 0-1 committed as `6914684`, Phase 2 as `be8d1cd`, Phase 3 as `768a815`,
documentation as `b6f8d9a` and `32ea127`, Phase 6 (`know-blueprint`) as `ced4316`, Phase 7
(`know-researcher`) in this round. Five plugins registered at 0.1.0: `know-product-spec`,
`know-security`, `know-photo-generator`, `know-qa-agent`, `know-blueprint`; `know-researcher`
registered at **1.18.0**, the version it arrived with (see Phase 7 notes).

Gates pass: version-prefix parity 6 plugins and 6 catalog entries, marketplace manifest, six plugin
manifests with no warnings, `dev/scripts/check-described-commands.mjs` at 64 real invocations and 0
unresolved references, `know-security`'s 66-case suite, `know-photo-generator`'s key check, and for
`know-qa-agent` module resolution across all ten harness tools plus a real engine spec compile.
`know-researcher` adds the first *executable* gate in this repository: its corpus-review validator's
self-test runs 74/74 green, and the validator's own SHA-256 matches the hash pinned in
`reference/review-protocol-contract.json`, which independently proves the port did not corrupt it.

**Pushed.** All six commits are on `main` at `knowbility/knowbility-marketplace` (private,
default branch `main`, HEAD `ced4316`), pushed 2026-10-30 by Kelsey's instruction as board chair of
Knowbility. The repository had been created empty earlier the same day. The first five went up
together; `ced4316` (Phase 6) followed on its own once he gave the word. Verified after each push:
remote HEAD matches local, and `.claude-plugin/marketplace.json` reads back over the API with all
five plugins listed and each `source` path resolving to a directory that exists on the remote. The
`know-photo-generator` description fix is confirmed on the remote too — the served manifest now
names `/know-photo:setup` and nothing else. `.team-runs/` is absent from the whole history
(rechecked before the second push) and no credential file is tracked
(`know-security/scaffold/scripts/secrets.mjs` is the scanner, not a secret).

**The push order was corrected, and the reason is worth keeping.** The plan had been to walk a cold
install and then push. That is impossible: `/plugin marketplace add knowbility/knowbility-marketplace`
has nothing to fetch from an empty repository, so the push is a precondition of the install walk
rather than its reward.

**The adversarial de-branding sweep is done.** Two gates remain before handoff: a **live browser
run** of `know-qa-agent` from a cold install, and a verified answer for **Claude Desktop private-
repository authentication** (see Open questions).

## The work

Migrating four plugins in from two other marketplaces, de-branded so Knowbility can configure them
for their own use. The plan is `review/migration-plan.md`; the independent planning review that
revised it is in `.team-runs/20261030T135852Z-8b0bac54/`.

| Phase | Work | State |
|---|---|---|
| 0 | Scaffold | **Done, pushed** |
| 1 | `know-product-spec` + `know-security` | **Done, pushed** |
| 2 | `know-photo-generator` | **Done, pushed** |
| 3 | `know-qa-agent` | **Done, pushed; sweep passed; live run outstanding** |
| Docs | Two readiness reviews, every finding verified and acted on | **Done, pushed** |
| 4 | Accessibility report presentation and conformance verdicts | Deferred, needs auditor input |
| 5 | Conformance-reporting plugin | Unscoped, requirements first |
| 6 | `know-blueprint` | **Done, pushed** |
| 7 | `know-researcher` | **Done, committed, unpushed** |

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

## Phase 6 notes — `know-blueprint`

**Why it was added after the plan closed.** The four-plugin scope was Kelsey's and was complete.
Blueprint and researcher came up afterwards, and the case for blueprint was Kelsey's, not mine: ask
someone at Knowbility how they do PDF remediation and there is no document that answers. For a
consultancy whose product is judgment applied consistently, an unwritten procedure is not an
efficiency problem, it is the thing itself. My first read sorted blueprint as generic ops tooling
because I categorized it by what it mechanically does rather than what it does for this
organization. Recording that because it is a repeatable misread: a tool's fit here is about the
work the organization is accountable for, not the tool's category.

**The port was light, as the sweep predicted.** 21 files, 1,622 lines, four skills, no scripts, no
API keys, no external dependencies, no network. The identifier sweep returned 6 candidates on
arrival and all 6 are benign (three Knowbility URLs we wrote, two fictional roles in the worked
example, one apostrophe false positive). `scenarios.jsonl` is skipped by the sweep as an unknown
type and was read by hand.

**One behavior change, written in five places on purpose.** A step whose output is an accessibility
judgment is rated **Human** by default. The reasoning: the root `AGENTS.md` house rule forbids
implying automated output is a conformance evaluation, and it was written about tools that describe
an artifact. Rating a step Automate makes the same claim from the other side — not that an artifact
conforms, but that nobody needs to look at it. The line the rule turns on is **finding versus
judging**: locating a missing `alt` attribute is mechanical and Automate is correct there, while
deciding whether the alt text is right is a judgment about human need. It is written into the
capture skill's Step 3, the design skill's Step 5, `reference/design-doctrine.md`,
`reference/blueprint-template.md` (step-block comment and the §14 roll-up), and the guide skill,
with the root `AGENTS.md` rule extended to generalize it to any future plugin that assigns autonomy
or confidence levels. Five places because the last review round established that a claim corrected
only on the front page is a claim still standing everywhere else.

**Two defects in already-shipped work surfaced while doing this, and both are the same class.**

1. **`know-photo-generator`'s manifest and catalog named a command that does not exist.** Both said
   "`/photo-setup` handles the API key." The real command is `/know-photo:setup`; the plugin's own
   changelog records that commands *moved from* `/photo-setup` during the rename, and the
   description kept the old name. This is the text shown in the install UI, so it was a first-run
   failure for a reader who had seen no other file. Two gates passed it:
   `check-version-prefix.mjs` only compares the `v<X.Y.Z> — ` prefix, and the review ground truth
   compared the manifest description to the catalog description and found them identical — which
   they were, because both carried the same wrong name. **Neither gate looked inside the prose.**
   `dev/scripts/check-described-commands.mjs` now resolves every command string in every
   description against the real invocation list; it found exactly this one, in two files, and
   nothing else.
2. **The root `AGENTS.md` plugin table still read "Never probes, never touches a network"** for
   `know-security` — a fourth location of the claim I corrected in the manifest and catalog last
   round. Fixed. Round 2's lesson has now cost three separate passes, so state it as a rule
   instead: **when a claim is wrong, grep the claim, not the file you found it in.**

**The worked example stays a blog content workflow, deliberately.** It is brand-neutral,
illustrative, and its job is to set the specificity bar a finished Blueprint should hit, not to
teach a domain. Replacing it with a PDF remediation example would mean writing a fictional
remediation procedure that would read as authoritative about work I do not know how Knowbility
does — the exact fabrication the plugin exists to prevent. The right replacement is a real captured
process, which is a natural first use of the tool rather than a porting task.

**What the eval material is, and is not.** The source marketplace's eval target came across as
specifications only: six definition files in `dev/know-blueprint/eval/` (gates, rubric, scenarios,
coverage, adapter, principles). The runner did not, so the gate names cited throughout
`know-blueprint/AGENTS.md` are readable specifications and not an executable suite; that
directory's README says so. Left behind deliberately: 565 files and ~37,000 lines of per-run
transcripts and scorecards, twenty times the size of the plugin, recording runs against a harness
nobody here can reproduce. The findings worth keeping from those runs were already written into
`AGENTS.md` as the reasons specific rules exist.

## Phase 7 notes — `know-researcher`

**The biggest port, and the one that found the most.** 84 shipped files, 15,894 lines, 12 skills,
12 command wrappers, 2 agents, 3 hooks, a 2,649-line Python validator, and 11 research types with
their own discovery playbooks. Agreed with Kelsey after Phase 6; he chose it over walking the cold
install first.

**The version was kept at 1.18.0 rather than reset to 0.1.0.** The convention in `AGENTS.md` says
reset, and `know-photo-generator` did. The argument for the exception: nothing about the research
system was rebuilt, and `0.1.0` on a twelve-skill system with eighteen releases of sharpening and an
adversarial corpus-review protocol would tell a first-time reader the opposite of the truth about
what they are installing. Kelsey chose this when he picked the work. Recorded in the plugin's
`CHANGELOG.md`, its `AGENTS.md` arrival locks, and `dev/know-researcher/README.md`.

### Three defects found, all of them invisible failures

**1. The output gate stopped gating without `jq`, silently.** This is the one worth remembering.
`hooks/gate-outputs.sh` is the hard backstop for the plugin's central guarantee — nothing reaches
`research/outputs/` except through an audit. It parses its hook payload with `jq`. With `jq` absent,
both parses returned empty, the empty-path guard exited 0, and **the write was allowed.** The only
trace was `jq: command not found` on stderr, where nobody looks. Tested rather than reasoned about:
built a PATH with every needed binary except `jq`, and the gate allowed a write to `outputs/` with
no gate log at all. Now fails closed for writes naming the outputs directory, with a message naming
the install command, verified across four cases (gate blocking normally, unrelated paths
unaffected, no-`jq` blocked, legitimate promotion with a fresh pass row still allowed).

Worth noting why it survived eighteen releases: `jq` ships with macOS 15 and later as
`/usr/bin/jq` (`com.apple.jq`, confirmed on this machine). On the author's Mac the gate always
worked. It is older macOS, minimal Linux images, and containers where it quietly did not.

**2. `claude plugin validate` reported three real warnings, same failure class.** All three hook
commands used `bash ${CLAUDE_PLUGIN_ROOT}/hooks/x.sh` unquoted, so a plugin root containing a space
would split the command and the hook would not run at all — which, for the gate hook, means the
gate is gone again, by a different route. Quoted. Validation now passes clean.

**3. `hooks/setup-paths.sh` promised a directory its loop did not add.** The header comment listed
`/usr/local/bin` among the locations it detects (Homebrew on Intel Macs and on Linux); the loop had
`/opt/homebrew/{bin,sbin}` and `$HOME/.local/bin` and `$HOME/.volta/bin` but not `/usr/local/bin`.
The skills' own `npx` probes check `/usr/local/bin/npx`, so the comment was describing intended
behavior. Code now matches.

### The namespace, and a convention gap this port exposed

The command namespace moved `/research:` → `/know-research:`, 402 references rewritten. The source
carried **two forms for the same twelve commands** — a hyphen form (`/research-audit-claims`, 366
references) and a colon form (36) — and its own v1.5.0 changelog entry argues the hyphen is the one
that resolves and the colon form "could never resolve." The repository's own `ground-truth.mjs`
records the opposite empirically, and the regenerated ground truth confirms `/know-research:init`
for all twelve. The port uses one form rather than carrying the ambiguity across; the colon form is
the one whose resolution follows from the file layout.

**I raised a skill-name collision as a gap, and it is not one. Closed on evidence, same day.**
Four of six plugins here carry skill `name:` values byte-identical to the plugins they were forked
from (`blueprint-capture`, `security-audit`, `photo-setup`, `research-init`), and convention 1 in
the root `AGENTS.md` used to claim the skill layer was the load-bearing one — that a duplicate short
name made the typed form ambiguous. Kelsey asked what the relevance was, which was the right
question, because checking the machine answers it:

- Anthropic's own official marketplace ships `telegram`, `imessage`, and `discord`, and **all three
  declare `name: access` and `name: configure`.** A three-way collision, shipped by the vendor.
- Two plugins in another installed marketplace both declare a bare `name: run`; the host lists them
  as `advisor-evaluation:run` and `aia-queue:run`. Both reachable, each qualified by its plugin,
  with no bare `run` offered.

Skills are addressed `<plugin>:<name>`, so the plugin name already disambiguates and a duplicate
short name costs nothing. **No renaming needed, in any plugin.** Convention 1 was rewritten to state
what the host actually does, with the evidence inline so it does not get reopened, and to say the
rule plainly: prefix the directory, the manifest `name`, and whatever a user actually types — the
`commands/` subdirectory where there are command wrappers, the skill `name:` where there are not.
Both shapes in this repository are correct, and which one a plugin uses follows from whether it
ships command wrappers.

The lesson worth keeping: I built an "open decision" out of an untested assumption about host
behavior, and it would have cost a four-plugin rename. The check was two greps.

### The house rule, reached from a third direction

`know-researcher` assigns confidence tiers from sourcing. The scale cannot express "no human
needed," so it passes the `know-blueprint` test. It breaks the rule another way: a well-sourced,
High-confidence finding about *what an accessibility criterion requires* is one claim, and that a
product *meets* it is a different claim on different evidence. Step 8a of `research-audit-claims`
now says so where the tier is assigned and flags a draft that slides from the first to the second
as an unsupported claim. Three places, not five — the rule is narrower here than blueprint's, and
the one that matters is where the tier gets written. The root `AGENTS.md` now names the pattern
behind all three directions rather than listing examples: **the rule is violated whenever a
plugin's output could be mistaken for a person having exercised the thing.**

### Data egress, which the README had not disclosed

The corpus review runs two independent reviewers. Tier 2 is the plugin's own agent on Claude. **Tier
1 is the OpenAI Codex CLI, and it is pointed at the project root and reads the whole corpus** —
notes, drafts, state, plan. That independence is the point of it, and it also means a research
corpus reaches a second model provider. It is opt-in by installation, and with Codex absent the
review runs Tier 2 only and records the missing tier as a failed attempt so the composition stays
visible. Found while reading the identifier sweep's `vendor_key` class, which surfaced
`codex exec --skip-git-repo-check`. Now disclosed in the plugin README's setup table and egress
section, the root README's detail section and tools table, and the root `AGENTS.md` row, with the
guidance that a corpus holding client material is a reason to leave Codex uninstalled.

### A gate I wrote and then deleted

A repo-wide documented-path checker is not achievable cheaply here, and the attempt is worth
recording so nobody repeats it. The plugins deliberately use the same directory names for files
they **ship** and files they **create in a user's project at runtime** — `reference/`,
`research/`, `FINDINGS.md`, `areas.json`, `report.md`. A naive check reported 184 unresolved paths,
almost all of them runtime artifacts that correctly do not exist in the repository. A gate that
cries wolf 184 times is worse than no gate, which is what
`dev/scripts/check-described-commands.mjs`'s own docstring warns about, so the script was deleted
rather than shipped. It did earn its keep once: it caught
`reference/corpus-review-protocol.md` still pointing at `dev/researcher/W7-corpus-review-design.md`
after the directory became `dev/know-researcher/`. Paths this port introduced or renamed were
checked by hand instead, and resolve.

### What was verified, and how

- `claude plugin validate` on the marketplace and all six plugins — clean, no warnings.
- Version-prefix parity: 6 plugins, 6 catalog entries. Catalog description asserted byte-identical
  to the manifest's at write time.
- `check-described-commands.mjs`: 64 real invocations, 0 unresolved.
- Validator `self-test`: **74/74**. Its `hash-self` output matches `validator_sha256` pinned in
  `reference/review-protocol-contract.json` — independent proof the rename passes never touched the
  Python. Both `.py` files and the contract JSON confirmed byte-identical to source.
- **A full diff against source**, with the namespace rename normalized out on both sides: the only
  file with changes beyond the rename is `skills/research-audit-claims/SKILL.md`, which is the one
  deliberate behavior addition. Nothing else drifted.
- Hook gate: four behavioral cases, with and without `jq`.
- `know-security` 66-case suite as a regression: all 66 pass.
- Root README links: 17 checked, 0 broken.
- Identifier sweep over the plugin and its dev docs: 241 candidates, read by class. All benign —
  public research hosts (`sec.gov`, `openalex.org`, paywalled-domain lists), `$EXA_API_KEY`
  environment references with no literal keys, standards names (SHA-256, ISO-8601), internal check
  IDs (`SC-1`, `XREF-02`), placeholder company data (`Acme Corp`, CIK `0001234567`), and standard
  tool paths. One real nonprofit EIN appears twice in ProPublica API examples; 990 data is public
  record by law and ProPublica publishes it, so it is a public identifier in API documentation, not
  a leaked internal one. Left as written.

### Documentation brought across

`dev/know-researcher/` holds `ARCHITECTURE.md` (the explanation, 670 lines) and `MAINTAINERS.md`
(the ownership and seam ledger, 545), plus the nine per-workstream design notes `MAINTAINERS.md`
cites by name at nine points — a seam register pointing at missing files is worse than no pointer.
Left in the source repository: `constraint-audit.md` (612 lines) and the corpus-review `spike/`
(534), neither cited by anything that came across. `dev/know-researcher/README.md` records both
lists and explains why the design notes' dated author attributions were left as written: rewriting a
decision record to remove who decided makes the record false.

### What has not been exercised

No research project has been run end to end here. No live discovery call, no corpus reviewed. The
plugin's README says so in its own "what hasn't been exercised here" section.

## Settled 2026-10-30

Kelsey ruled on everything that was open except two items, which he delegated. Recorded here rather
than deleted, because "we decided not to decide this" and "nobody ever asked" look identical six
months later.

- **Maintenance model: it does not matter.** Kelsey is on Knowbility's board and can support the
  plugins either way. **The instruction that follows from it: the documentation is written to be
  solid regardless of who maintains them.** So the depth question is closed in the direction of
  more, not less — nothing gets trimmed on the assumption that the original author will be around
  to answer questions. This was raised five times across the project; it is closed.
- **Repository visibility: private.** Installing therefore requires `knowbility` org read access
  plus git credentials per installer, which is what the README already documents. No change needed;
  the open question is closed, and the `know-` prefix stays a legibility choice rather than a
  public-namespace one.
- **Provenance record: keep it, under `dev/`.** Delegated to me on maintainability grounds and
  decided that way. Six plugins from two sources, two different version decisions, one plugin
  carrying verbatim pre-fork history — without the table those answers live only in one person's
  memory, which is the wrong place for a repository being handed to an organization. It never
  reaches a plugin user's cache. `dev/PROVENANCE.md` is updated to six rows with current status and
  now also carries the licensing reasoning.
- **MIT attribution line: a single Knowbility copyright, no retained third-party notice.**
  Delegated to me and decided. MIT requires its notice to travel with copies, so the question is
  real for the four plugins that were MIT — but Kelsey holds the copyright on those four, and a
  holder relicensing their own work is not a licensee retaining someone else's notice. The other
  two were proprietary, so there was no MIT notice to retain. Adding a courtesy line would imply an
  obligation that does not exist. The reasoning is written into `dev/PROVENANCE.md` so it is settled
  once rather than re-litigated; it is a drafting judgment, not legal advice, and it rests on the
  one fact Kelsey has confirmed.

## Also settled 2026-10-30, on evidence rather than opinion

Both of these were on my "still open" list. Kelsey pushed back on one and asked what the other was
for, and checking the machine closed both.

- **Claude Desktop private-repository install: not an issue, and I should not have raised it.**
  Kelsey's objection was that he almost never uses a terminal and the migration did not change the
  installation path, so the concern looked invented. It was. The `hello-alice` marketplace installed
  on this machine points at `thecircularboard/helloalice-plugin-marketplace`, which is **private**
  (created 2026-06-08, 3.8 MB), and he installs from it. Private-repo install via the Desktop app
  demonstrably works; I had turned "nobody verified this" into "this might not work," which are not
  the same claim.

  The accurate residual, and it is small: the install needs git credentials for the org on the
  installer's machine. This one has `osxkeychain` and an authenticated `gh`. A new Knowbility
  employee's machine would need that once, which is ordinary onboarding rather than an abandonment
  risk. The README already covers it and does not need rewriting.

- **Skill-name prefix: nothing to fix.** Closed on evidence; see the Phase 7 notes for the two
  observations and the rewritten convention 1. Short version: Anthropic's own marketplace ships
  three plugins that all declare `name: access`, skills are addressed `<plugin>:<name>`, and a
  duplicate short name costs nothing. No renaming, in any plugin.

## Accepted into scope

- **Phase 4 — per-criterion conformance presentation inside `know-qa-agent`.** Kelsey wants it.
  `know-qa-agent` already annotates every finding with the WCAG success criteria it maps to; Phase 4
  turns that into auditor-shaped presentation and per-criterion verdicts. **What it needs to start:**
  one of Knowbility's own auditors looking at real output from a live run, because how auditors
  structure findings is knowable by asking and much worse when guessed. That makes it dependent on
  the cold-install walk producing real output first. The boundary statement already in the README
  stays either way: these passes catch a deterministic subset, do not produce a formal conformance
  report, and do not replace screen-reader or keyboard-only testing.
- **Phase 5 — a separate conformance/VPAT reporting plugin.** Kelsey wants it, and he flagged it
  himself early as the one genuinely missing piece. It is separate from Phase 4 on purpose: criterion
  mapping annotates output `know-qa-agent` already produces, while a conformance document must merge
  manual and assistive-technology evidence that plugin cannot produce, and its output is
  quasi-legal. **What it needs to start:** its own requirements pass — what document, to which
  standard, for whose signature, carrying what evidence. Nothing about it has been scoped. This is
  the one piece of remaining work that is a project rather than a task, and it does not depend on
  the walk.

## The cold-install walk — first run, 2026-10-30

Run at Kelsey's instruction, before pushing, which bounded it: **only the five plugins on the
remote were installable.** `know-researcher` is in three local commits, so its first-run path is
still unwalked. Everything below is `know-blueprint`, chosen because it needs nothing installed.

### What worked, verified rather than assumed

| Step | Result |
|---|---|
| `claude plugin marketplace add knowbility/knowbility-marketplace` | **Works.** Cloned over HTTPS using the existing `osxkeychain` credential. "SSH not configured, cloning via HTTPS" is informational, not a warning. |
| The marketplace appears in the catalog listing | **Yes**, as `knowbility`, source `knowbility/knowbility-marketplace` |
| `claude plugin install know-blueprint@knowbility` | **Works.** Installed at user scope, reports enabled |
| Files land correctly in the cache | **Yes** — `commands/know-blueprint/{capture,design,discover,guide}.md`, `skills/`, `reference/`, `templates/` all present |
| The skill loads and executes | **Yes.** `know-blueprint:blueprint-guide` loaded clean and returned its real first line, "Someone has asked how Blueprint works or where to begin." |

**This independently confirms the private-repository question is closed.** The repo is private, the
add and install both succeeded, and nothing was done by hand beyond the two documented commands.

### Closed: the command strings are right, and I had misread the listing

Kelsey ran `/know-blueprint:blueprint-guide` in a normal interactive session. It resolved and
executed, from `~/.claude/plugins/cache/knowbility/know-blueprint/0.1.0/`, a directory created at
18:52:47 by the install above — the cold install's own copy, byte-identical to the repository. The
walk is therefore complete through the step that matters most: a user typing an invocation and
getting the real thing.

**My doubt about the README's command strings was a misreading, now corrected.** A fresh session
lists the command as `know-blueprint:know-blueprint:guide`, and I read that as the typed form,
concluding the documented `/know-blueprint:guide` was missing. It is not missing. The first segment
is the **plugin** prefix, which drops when unambiguous; the remainder is the command's own
`<namespace>:<name>`. So:

| Registered name | What a user types |
|---|---|
| `know-blueprint:know-blueprint:guide` | `/know-blueprint:guide` — the command |
| `know-blueprint:blueprint-guide` | `/know-blueprint:blueprint-guide` — the skill |

Both are real, both resolve, and the README documents the first. `dev/scripts/ground-truth.mjs` had
it right all along; I second-guessed a correct gate against a listing I had parsed wrong. The same
reading applies to the other three command-shipping plugins, so `/know-security:sweep`,
`/know-photo:setup`, and `/know-research:init` are correct as documented. **No documentation change
was needed and none was made.**

**The pattern across this session, worth one line.** Three times I turned an untested assumption
about host behavior into an open issue: Desktop private-repo install, skill-name collisions, and
this. Each dissolved on contact with the machine, and each check cost under a minute. The lesson is
not "be less cautious" — the gate findings were real. It is that *unverified* and *broken* are
different claims, and writing the second when I had only established the first created work that did
not exist.

### Why I could not test it myself, recorded so nobody repeats the attempt

`claude -p "/some:command"` does **not** invoke a slash command. The string arrives as an ordinary
user message and the model reasons about it, so two runs gave two contradictory answers about which
forms exist — one session said `/know-blueprint:guide` was unavailable and suggested
`/blueprint:guide`; the next said the reverse. Neither was reporting; both were guessing. Discard
both.

Separately, the first skill-execution attempts reported as failures with "no error detail," which
looked like the plugin being broken. It was not. Non-interactive mode gates the `Skill` tool behind
a permission prompt that cannot be answered, and the model surfaced the prompt title
(`Execute skill: know-blueprint:blueprint-guide`) as an error string. With `--allowedTools Skill`
the same call succeeded immediately. **A tool failure in `-p` mode is a permission gate until
proven otherwise.**

### Left installed

The `knowbility` marketplace is now added on this machine and `know-blueprint@knowbility` is
installed and enabled, at user scope. Left in place deliberately — Kelsey wants these installed —
but it does mean this machine is no longer a cold environment for a second walk. The next walk of
`know-researcher`, after the push, starts from a machine that already has the marketplace added,
which is the normal state for a returning user and a reasonable thing to test.

## Next step

**Push the four local commits.** Nothing is blocked, nothing waits on Kelsey, and the migration's
own gates are all closed: six plugins validated, the install path verified end to end against the
private repository, and a skill from a cold install running in a real session.

Pushing also makes `know-researcher` installable, which is the one remaining walk. It matters more
than `know-blueprint`'s did, because it is the long path — a research project runs over days, and
resumability and the `STATE.md` handoff either work or don't. That walk starts from a machine that
already has the marketplace added, which is the normal state for a returning user.

**Then Phase 4**, which needs real output from a live run in front of one of Knowbility's auditors
before any of it can be designed. **Phase 5** depends on nothing and needs a requirements pass
first: what document, to which standard, for whose signature, carrying what evidence. It is the one
remaining piece that is a project rather than a task.

**Kelsey's call, no action taken:** two Knowbility marketplace repositories exist —
`knowbility/knowbility-marketplace` (this one, everything is here) and
`knowbility/knowbility-plugin-marketplace` (private, created 2026-08-14, 2 KB, effectively empty).
Near-identical names are a way for someone to add the wrong one.
