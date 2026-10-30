# Knowbility marketplace

**Five tools for building, documenting, and checking software, set up to run inside Claude.**
Owned and maintained by Knowbility.

## What this actually is

Claude can be extended with **plugins**: bundles of instructions that teach it a specific job, so
instead of explaining what you want from scratch every time, you run one command and Claude
already knows the method.

This repository is a **marketplace**, which is just a catalog of plugins plus the plugins
themselves. You add the marketplace once, then install whichever tools you want. It works in both
places Claude runs:

- **Claude Desktop (Cowork)** — the desktop app, with a Plugins screen you click through.
- **Claude Code** — the command-line version, where you type `/plugin` commands.

Once a plugin is installed, it shows up as **slash commands** you type into Claude. For example,
after installing `know-qa-agent`, typing `/know-qa:run` starts a QA run. You do not need to read
the plugin's code or understand how it works to use it.

Each of the five is independent. Install one or all five, in any order. None of them needs
another one to work.

## Step 1: get Claude itself

These are plugins *for* Claude, so you need Claude first. Pick whichever suits you. The commands
are the same in both, with one exception worth knowing up front: `know-qa-agent`'s scheduled
monitoring rides a Claude Code feature and so needs Claude Code. Everything else works either
way, and `know-blueprint` needs nothing installed at all, so it behaves identically in both.

**Claude Desktop** is the app with a window and buttons. Download it from
[claude.ai/download](https://claude.ai/download), install it, and sign in. If you would rather not
use a terminal at all, choose this one — but read the table in "The five tools" first, because
`know-qa-agent` needs Node.js and Chrome on your machine before it will run, and only you can
install those.

**Claude Code** is the command-line version. It needs [Node.js](https://nodejs.org) 18 or newer,
then:

```bash
npm install -g @anthropic-ai/claude-code
```

Run `claude` in a terminal to start it.

**Both need a Claude account you are signed in to.** Which plan you need, and whether Knowbility
already has one you should be added to, is a question for whoever administers Knowbility's Claude
account. Do not buy anything before asking.

> **The single thing most people get wrong:** every command in this file that starts with a `/`,
> like `/plugin install ...` or `/know-qa:run`, is typed **inside Claude**, not at your terminal's
> shell prompt. In Claude Code that means after you have run `claude` and see its prompt. In Claude
> Desktop it means in the message box. Typed into a plain terminal, they fail with "command not
> found," and that error means you are in the wrong place rather than that anything is broken.

## Step 2: repository access

This repository is **private**. To install anything from it you need:

1. **Read access to the `knowbility` GitHub organization.** If you cannot open
   `github.com/knowbility/knowbility-marketplace` in a browser while signed in, you do not have it
   yet. Ask whoever administers the organization.
2. **Git on your machine, signed in to GitHub.** Installing from a private repository uses your
   machine's own git credentials underneath, so this applies in Claude Desktop too, even if you
   have never opened a terminal.

**How to check, and how to fix it if the check fails.** Open a terminal and run:

```bash
git clone --depth 1 https://github.com/knowbility/knowbility-marketplace.git /tmp/kb-access-test
```

If that succeeds, you have what you need; delete the folder it made and carry on. If it asks for a
password or fails with "repository not found," your git is not signed in. The shortest fix is the
[GitHub CLI](https://cli.github.com): install it, then

```bash
gh auth login
```

choosing **HTTPS** and answering yes when it offers to authenticate git with your GitHub
credentials. Run the clone again to confirm. Requirement 1 is separate and nobody can self-serve
it: if the repository will not open in a browser while you are signed in, you have not been added
to the organization yet, and only an organization administrator can do that.

If installation later fails with "not found" or "permission denied," it is almost always one of
those two things rather than anything wrong with the plugin.

## The five tools

Read this and the next two sections to decide what you want, then continue with
[Step 3](#step-3-install-the-tools). **If you already know which tool you want, go straight
there** — the only thing you need from this section is that tool's row in the table, so you install
its prerequisites before, rather than after, you hit them.

| Tool | Version | What you get | What it needs |
|---|---|---|---|
| [**know-qa-agent**](./know-qa-agent) | 0.1.0 | Point it at a web page and it tests like a skeptical engineer, then tells you what broke, why, and shows the evidence. Baseline accessibility checks run in every test; a deeper tier you turn on per test adds the full axe-core ruleset and computed WCAG AA contrast ratios, with accessibility findings labelled by the success criteria they map to where the rule has one. Not a conformance evaluation, and the caveat below matters. | [Node 18+](https://nodejs.org) and [Google Chrome](https://www.google.com/chrome/), both installed by you. Also one global browser driver (`npm install -g @playwright/cli`), which `/know-qa:init` installs for you if it is missing. |
| [**know-product-spec**](./know-product-spec) | 0.1.0 | Interviews you and writes a product spec an engineer can build from. Starts by testing whether the thing is worth building at all, and will tell you when it isn't. | Nothing extra to write or grade a spec. Filing and grooming need a tracker connected to Claude plus a `tracker_connection` block in your project profile (see [`know-product-spec/reference/profile.md`](./know-product-spec/reference/profile.md)); the UI review needs browser tools and somewhere your designs live. |
| [**know-security**](./know-security) | 0.1.0 | Reads your code the way someone trying to get at the data would read it, and reports what they would find. It never probes the system under review, holds no credentials, and runs no exploit. Its dependency check does contact your package registry, the same way `npm audit` does. | Node 18+ |
| [**know-photo-generator**](./know-photo-generator) | 0.1.0 | Describe a photo in plain language and get a professional-grade image, without knowing what a key light or an 85mm prime is. | [Python 3](https://www.python.org/downloads/) with `pip3` on your PATH, and a Google Gemini API key you get from [AI Studio](https://aistudio.google.com/apikey). Rendering images is billed per image ([pricing](https://ai.google.dev/pricing)); building a prompt without rendering needs no key. |
| [**know-blueprint**](./know-blueprint) | 0.1.0 | Interviews you into a written process. Ask someone how they do a thing they do every week and you get the idealized version; this gets the real one, including the exceptions and the judgment calls, and marks each step for whether automation is safe there. | **Nothing.** No key, no account, no installed tool. It reads and writes Markdown files and nothing else. |

Each version matches that plugin's `plugin.json`, which is the source of truth.

## Which one should I start with?

- **You want to see what this is good for in ten minutes** → `know-security`, if you already have
  Node.js 18+ and a code repository on your machine. It reads code you already have without
  changing it, and writes a findings file you can judge for yourself. (Setup and reporting do
  create local config and findings files; your source is never modified.)
- **You test or audit websites** → `know-qa-agent`. It is the one closest to Knowbility's own work
  and has the longest setup of the five: install Node.js 18+ and Google Chrome yourself first, then
  `/know-qa:init` handles the rest.
- **You are scoping a piece of work before anyone builds it** → `know-product-spec`.
- **You need images for a page, a deck, or a campaign** → `know-photo-generator`.
- **Nobody has written down how your team actually does something** → `know-blueprint`. This is
  also the one to start with if you want to try a tool with no setup at all: it needs nothing
  installed, so you can go from installing the plugin to a real result in one sitting.

## What each one does, in more detail

### know-qa-agent

**Tests a web app the way an engineer and a designer would, together.** Most automated testing
only sees what the markup says. Point an agent at a real page and it tends to swing the other way:
it looks at the screen and stops correlating the errors underneath. This does both at once, so a
finding arrives as the symptom, the cause, and the proof held together.

For accessibility it runs two tiers. **Baseline checks ride along in every test**: keyboard
reachability, visible focus, alt text, form labels, obvious contrast problems. **The deeper tier is
opt-in**, turned on per test with an `## Accessibility Focus` section in the spec or
`--a11y-depth deep` when generating one. It adds the full bundled axe-core ruleset — 105 rules in
the pinned 4.12.1 — and WCAG AA contrast ratios computed from the resolved colors of
solid-background text rather than estimated.

**Accessibility findings from that deeper tier carry the WCAG success criteria they map to, where
the rule has one**, read from axe's own rule metadata so the mapping cannot drift from the rules
actually running. Of those 105 rules, 75 carry a success criterion and 30 are axe's own
best-practice rules that map to none; a result from one of those 30 is reported with no criterion,
and must not be presented as a WCAG violation. The labelling applies to accessibility findings
only, not to the tool's other findings such as a hung request or a layout shift. Anything the tools
cannot resolve is reported as needs-review rather than guessed.

**Please read [`know-qa-agent/reference/wcag-mapping.md`](./know-qa-agent/reference/wcag-mapping.md)
before showing this output to anyone outside the team.** It is coverage, not conformance. Automated rules exist for only a subset of the
success criteria, so a criterion that does not appear is untested rather than satisfied, and the
tool cannot tell those apart. It does not produce a VPAT or an accessibility statement, and it does
not replace screen-reader or keyboard-only testing by a person.

Start with `/know-qa:init` in your project, then `/know-qa:start`.
→ [Full guide](./know-qa-agent/README.md)

### know-product-spec

**Interviews you and writes a product spec an engineer can build from.** It starts somewhere most
tools do not: by testing whether the thing is worth building. If nobody can describe what people do
about the problem today, or the shortest path turns out to be a process change rather than
software, it says so and writes no spec. That is a successful run, not a failure.

Once the case holds it asks how the thing behaves, drafts the document, then grades its own draft
by breaking it into workstreams and tasks and reporting every product decision it had to invent
along the way. Those inventions are the point: each one is a decision somebody will otherwise make
later, quietly, differently from how you would have made it.

Start with `/know-spec:start`.
→ [Full guide](./know-product-spec/README.md)

### know-security

**Reads the code the way someone trying to get at the data would read it.** It hunts the endpoint
nobody remembered, the helper everyone uses except in one place, the log line that seemed harmless,
and the personal data no deletion path reaches. Findings come with the attack path as read, the
input that exercises it, the blast radius, and the fix.

It is built to avoid crying wolf, because three false alarms get a security tool switched off. It
cannot claim something is exploitable without naming a concrete input, and it reports what it chose
to discard so you can audit the filter. It never contacts the system under review: no requests, no
credentials, no probing. The one exception is the dependency check, which runs your project's own
package auditor against your package registry, the same thing `npm audit` does by hand. That is
named in the plugin's safety reference rather than hidden.

It is advisory by default. It reports; it does not block your build unless you configure it to.

Start with `/know-security:init`.
→ [Full guide](./know-security/README.md)

### know-photo-generator

**Describe the photo you want in plain language and get a professional-grade image.** It walks you
from a scene description to a complete, physics-aware image prompt, choosing camera body, lens,
lighting setup, and color grade from a reference library, then optionally renders the image at the
right size for print, social, or a hero banner.

**One thing to know before using it for anything public:** a Knowbility house photo style is not
defined yet. The style section is a deliberately empty template, because a photographic style for
an accessibility organization, and disability representation guidance in particular, is not
something a tool should infer. Until someone at Knowbility fills it in, use the brand-neutral
headshot style or `--style none`, and the tool will refuse to invent the missing values rather than
guess them.

Start with `/know-photo:setup` to add your API key (it goes into a local file, never into the
chat).
→ [Full guide](./know-photo-generator/README.md)

### know-blueprint

**Interviews you into a written process.** Ask someone how they do a thing they do every week and
you get the idealized version; the micro-steps, the workarounds, and the judgment calls stay in
their head, because nobody can write those down from memory. This asks about the most recent real
run instead, including the parts that went sideways, and writes the result as a structured
document: trigger, steps, decision criteria, exception paths, who can approve, what "done" looks
like, and what a bad run costs.

Each step also gets marked **Automate**, **Monitor**, or **Human**, decided by one question: if
this step were done wrong with no review, what would happen? That is the part worth having when
somebody asks which of your work could be handed to a tool.

**Accessibility judgment is marked Human by default.** Whether an image is decorative, whether alt
text conveys the right thing, whether a reading order is correct, whether an accessible name means
anything to the person hearing it — a tool can find a missing attribute, but whether the thing it
describes is *right* is a judgment about what a person needs. You can overrule the default; the
document records that you did.

It needs nothing installed, and it is the only one of the five for which "works identically in
Claude Code and Claude Desktop" is true without qualification.

Start with `/know-blueprint:guide` if you are not sure which of its four jobs you want, or
`/know-blueprint:capture` if you already know which process to write down.
→ [Full guide](./know-blueprint/README.md)

## Step 3: install the tools

### Claude Desktop

1. Open the **Customize** menu in the left sidebar, then the **Plugins** tab.
2. Under **Personal plugins**, click **+** then **Add marketplace**.
3. Enter the repository: `knowbility/knowbility-marketplace`
4. Install the tools you want from the catalog that appears.

An organization owner can instead add the marketplace under **Organization settings → Plugins** and
set a plugin to **Auto-install**, so everyone gets it without doing this themselves.

> **Two names, and they are not interchangeable.** What you *add* is the repository,
> `knowbility/knowbility-marketplace`. What you *install from* is the marketplace it contains,
> which is named `knowbility` — that is the `@knowbility` on the end of each install command
> below. Use each where it is shown.

### Claude Code (command line)

```
/plugin marketplace add knowbility/knowbility-marketplace
/plugin install know-qa-agent@knowbility
/plugin install know-product-spec@knowbility
/plugin install know-security@knowbility
/plugin install know-photo-generator@knowbility
/plugin install know-blueprint@knowbility
```

Install only the lines you want; they are independent.

## Step 4: your first run

**First, pick a folder.** These tools save their files into a working folder on your machine, so
Claude needs one to work in. For `know-security` or `know-qa-agent` on a local app, that is the
folder holding that code. For a photo or a new product idea, an empty folder is fine; make one
wherever you keep work.

In **Claude Code**, `cd` into that folder in your terminal before running `claude`. In **Claude
Desktop**, open that folder when the app asks which folder to work in.

Then run the setup command, and the one after it that actually produces something. Two steps, not
one: the first configures, the second gives you output you can look at.

| Tool | Set up | Then, to get a result |
|---|---|---|
| know-security | `/know-security:init` — creates the findings file and scan config for this repo | `/know-security:sweep` — reviews the whole codebase and writes findings to `FINDINGS.md` |
| know-qa-agent | `/know-qa:init` — creates `.know-qa/` and installs the browser harness | `/know-qa:start` — asks what you want tested in plain language and sets it up. Or go straight at a page with `/know-qa:run --url <address> "check keyboard navigation and form labels"` |
| know-product-spec | nothing to set up | `/know-spec:start` — works out what exists and points you at the right step |
| know-photo-generator | `/know-photo:setup` — creates the file you paste your Gemini key into, checks it works | `/know-photo:generate --generate` — then describe the image you want. Without `--generate` it writes the prompt and renders nothing, which costs nothing |
| know-blueprint | nothing to set up | `/know-blueprint:capture` — pick a process you already run, answer questions for about fifteen minutes, and get a written process in `blueprints/`. If you can't decide which process, `/know-blueprint:discover` finds candidates first |

Replace `<address>` with the URL of a page you want tested. If it is an app running on your own
machine, start it the way that project's own instructions say and confirm the address opens in
Chrome first.

**If you lose your place**, `know-qa-agent` has `/know-qa:guide`, which looks at your project and
tells you what to run next, and `/know-qa:help` explains any single command. `know-product-spec`
has `/know-spec:start` and `know-blueprint` has `/know-blueprint:guide`, which do the same thing.

## Updates

Nothing changes under you. A new version only arrives when you ask for it.

**Claude Desktop:** Customize → Plugins → refresh the `knowbility` marketplace, then update the
tool.

**Claude Code:**

```
/plugin marketplace update knowbility
/plugin update know-qa-agent
/plugin update know-product-spec
/plugin update know-security
/plugin update know-photo-generator
/reload-plugins
```

If a version will not change, your local catalog is cached. Uninstall and reinstall that tool to
force a clean pull.

## A standing rule about accessibility claims

`know-qa-agent` produces accessibility findings, and this is the organization whose credibility
rests on how such findings are described. So: **no tool in this marketplace may imply that
automated output is a conformance evaluation.** Not a VPAT, not an accessibility statement, not a
substitute for assistive-technology or keyboard-only testing by a person. Automated passes shrink
the surface a person has to review. They do not stand in for the person. If you extend anything
here, that rule travels with it.

The rule can also be broken from a direction that is easy to miss, which is why
`know-blueprint` marks accessibility judgment **Human** by default. Rating a step "safe to
automate" makes the same claim as calling a scan a conformance evaluation — not that an artifact
is accessible, but that nobody needs to look at it. Finding a missing `alt` attribute is
mechanical and marking it automatable is correct. Deciding whether the alt text is *right* is not,
and a process document that says otherwise is the organization's own method making the claim its
reports refuse to make.

## For maintainers

[AGENTS.md](AGENTS.md) is the entry point for changing anything in this repository: the naming
convention, the version rule that CI enforces, what ships to users and what does not, and how
these five plugins arrived here.

Work in progress and open questions live in [dev/STATE.md](dev/STATE.md).

## License

MIT. See [LICENSE](LICENSE).
