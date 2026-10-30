# Is this marketplace end-user ready?

Four Claude Code / Claude Desktop plugins have been migrated into a new private marketplace owned
by Knowbility, a digital accessibility nonprofit. The code is done and tested. **What is under
review is whether the documentation gets a real person from zero to a working first run without
confusion or a wrong turn.**

## Who the reader is

Assume an accessibility practitioner or a web developer at a small nonprofit. Competent with a
browser, a terminal, and a text editor. **Has never installed a Claude plugin and does not know
what a plugin marketplace is.** They are not an AI power user, they will not read the source, and
they will not infer a missing step. If a step is implied rather than stated, assume they stop and
ask a colleague, which is the failure this review exists to prevent.

Some readers will use the desktop app and never touch a command line. Some will use the CLI. The
docs must work for both.

## What you are given

- `00-root-README.md` — the marketplace front door. This is the file most readers see first and
  the main thing under review.
- `know-*-README.md` — the four per-plugin guides the front door links to.
- `ground-truth.md` — **mechanically extracted from the repository**: the real marketplace name,
  every plugin's real manifest name and version, every skill and command with the exact string a
  user types to invoke it, and every shipped path. This is authoritative. The documentation is not.

This is the complete user-facing documentation set, not a sample. Nothing was withheld.

## Report these, in this order

1. **Factual errors.** Anything the documentation states that `ground-truth.md` contradicts: a
   command that does not exist, a wrong invocation string, a wrong version, a wrong install name, a
   wrong file path, a referenced file that is not in the shipped paths. Cite the doc line and the
   ground-truth line that disproves it. This is the highest-value category because it is
   objectively checkable and it is what makes a reader abandon a tool.

2. **Where a first-time reader gets stuck.** Walk the install-to-first-run path as that person,
   start to finish, for at least two of the four plugins. Name the exact point where they would
   stop, and say what they would be missing. Order by how early in the journey it happens, because
   an early blocker makes every later refinement irrelevant.

3. **Missing prerequisites and steps.** Something required that the docs do not mention, or mention
   only in a per-plugin guide when the reader needs it before choosing. Include things that cost
   money or need an account.

4. **Wrong or dangerous expectations.** Anywhere a reader could reasonably conclude the tool does
   something it does not. Pay particular attention to the accessibility claims, because this
   organization's credibility depends on how automated accessibility output is described, and
   overclaiming there is worse than any other error in this set.

5. **Readability and structure.** Where the writing is too dense, assumes vocabulary, buries the
   thing the reader needs, or puts something in the wrong order. Be specific and quote the passage;
   do not give general advice about documentation.

Also answer plainly: **what is the single thing most likely to make this reader give up, and is
this set ready to hand to Knowbility as it stands?** Answer that second question yes or no, with
your reason, and do not soften it.

## Out of scope

Do not review the plugins' behavior, architecture, or code quality, and do not propose new
features, new plugins, or a different set of tools. Do not suggest reorganizing the marketplace.
The question is only whether the documentation works for that reader.

Ground every finding in a quoted passage. Where you would change wording, give the replacement.
