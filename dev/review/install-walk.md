# The cold-install walk — what has been verified about installing

Both readiness reviews landed on the same gap: no amount of document review establishes that
someone can go from nothing to a result through these instructions. This records what has actually
been exercised, so nobody re-derives it and nobody claims more than was tested.

First run 2026-10-30, on macOS 26, Claude Code CLI, from a machine with `gh` authenticated and git
credentials in `osxkeychain`.

## Verified

| Step | Result |
|---|---|
| `claude plugin marketplace add knowbility/knowbility-marketplace` | **Works against the private repository.** Cloned over HTTPS using the existing keychain credential. "SSH not configured, cloning via HTTPS" is informational. |
| The marketplace appears in `claude plugin marketplace list` | Yes, as `knowbility` |
| `claude plugin install know-blueprint@knowbility` | Works, user scope, reports enabled |
| `claude plugin install know-researcher@knowbility` | Works, user scope |
| `claude plugin marketplace update knowbility` picks up a plugin added *after* the marketplace was first added | **Yes** — the cached clone went from five plugins to six. A returning user needs the update to see new plugins. |
| Files land correctly | Yes, including `commands/<namespace>/` and a versioned copy under `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` |
| `know-researcher` components register | 12 skills, 2 agents, **3 hooks** (SessionStart, PreToolUse, PreCompact), reported as harness-only with no model context cost |
| The installed hooks carry the port's fixes | All three quote `"${CLAUDE_PLUGIN_ROOT}"`; `gate-outputs.sh` carries the fail-closed branch. Installed script byte-identical to the repository's by SHA-256. |
| A skill loads and runs from the installed copy | Yes — `know-blueprint:blueprint-guide` invoked in a real interactive session, returning its real content from the installed cache |
| **`know-researcher`'s output gate blocks an unaudited write, live** | **Yes.** A session told to write `research/outputs/final-report.md` into a project with no gate log was blocked by the hook, and the directory was still empty afterwards — confirmed on the filesystem, not from the session's own account. |

**The private-repository question is closed.** It was raised by both reviewers as the most likely
abandonment point. The repository is private, both the add and the install succeeded, and nothing
was done by hand beyond the two documented commands. The accurate residual is ordinary onboarding:
the installer's machine needs git credentials for the `knowbility` org once.

## Command-form resolution, settled

A fresh session lists each command as `<plugin>:<namespace>:<command>` and each skill as
`<plugin>:<skill-name>`. The leading plugin segment drops when unambiguous, so for `know-blueprint`:

| Registered | What a user types |
|---|---|
| `know-blueprint:know-blueprint:guide` | `/know-blueprint:guide` — the command |
| `know-blueprint:blueprint-guide` | `/know-blueprint:blueprint-guide` — the skill |

Both are real and both resolve. The README documents the first form, and the same reading covers
`/know-security:sweep`, `/know-photo:setup` and `/know-research:init`. `dev/scripts/ground-truth.mjs`
encodes this correctly.

## Not yet walked

**`/know-research:init`.** The real first-run path: four questions, roughly twenty minutes of live
preliminary web research, then a phased plan. It needs an actual research subject — a fake topic
exercises the mechanics while saying nothing about whether the plan it writes is any good, which is
the part worth judging. It also makes real external calls.

What that run would additionally prove, none of which the table above covers: the project scaffold,
the `.claude/settings.json` pre-allow merge, the validator landing in `research/bin/`, the `STATE.md`
handoff across a context clear, and discovery tier recording when no search CLIs are present.

**Claude Desktop's plugin UI.** Everything above is the Claude Code CLI path. The Desktop
instructions in the README (Customize → Plugins → + → Add marketplace) were taken from the source
marketplaces' READMEs and have never been observed in the app. The underlying clone-and-install
mechanism is the same one verified here, so the risk is label accuracy rather than function.

**The other four plugins' first-run paths.** `know-security:init`, `know-qa:init` (which installs a
browser harness and needs Node 18+ and Chrome), `know-photo:setup` (needs a Gemini key), and
`know-spec:start`. **None has been run from a cold install of the `know-` port.** An actual image
render through `know-photo-generator` bills a real generation and has not been done here either.

**That qualifier is the whole claim, and dropping it has already caused one wrong conclusion.**
Every plugin here is a port of something that was in use before the migration, and the ports
changed namespaces and branding rather than behavior. "Not run here" is a statement about this
repository's verification log. It is not evidence that a path is broken, untested in any absolute
sense, or risky — and a review that reads it that way will invent a precondition that does not
exist. What these runs would actually establish is that the *packaging* survived the port: the new
namespace resolves, the installers fetch what they should, and a run completes from a clean cache.

## Two methodology traps, recorded so nobody loses an hour to them

**`claude -p "/some:command"` does not invoke a slash command.** The string arrives as an ordinary
user message and the model reasons about it. Two consecutive runs gave contradictory answers about
which invocations existed; both were guessing. Do not use it to test command resolution.

**A tool call in `-p` mode reports its own permission-prompt title as an error.** The first attempts
to run a skill non-interactively came back as failures with "no error detail," which read exactly
like a broken plugin. Nothing was broken — non-interactive mode gates the tool behind a prompt that
cannot be answered, and the model surfaced the prompt title (`Execute skill: …`) as error text. With
`--allowedTools Skill` the same call succeeded immediately. **A tool failure in `-p` mode is a
permission gate until proven otherwise.**

More generally: establish tool, file and host facts by reading the file, hashing it, diffing it, or
running the thing and checking the filesystem. A session asked to report state generates plausible
text. In this walk a session asked to quote a hook's block message verbatim paraphrased
`/know-research:audit-claims` as `/research-audit-claims`, which looked like a missed rename in the
port; both copies were byte-identical and correct.

## Scratch fixtures, and how to rebuild them

All under the session scratchpad, which is ephemeral — assume gone.

- **Gate test with `jq` absent:** a directory of symlinks to every needed binary *except* `jq`, used
  as `PATH`, to prove the gate failed open. Rebuild: `mkdir nojqbin && for b in bash sh printf cat
  grep awk sed date tail head; do ln -sf /usr/bin/$b nojqbin/ 2>/dev/null || ln -sf /bin/$b
  nojqbin/; done`, then run the hook with `PATH=$PWD/nojqbin`.
- **Live gate fixture:** a project directory containing `research/outputs/` and `research/notes/`
  and no `research/audits/gate-log.md`. Any empty directory with those two paths reproduces it.
- **Hook payload:** `{"tool_name":"Write","tool_input":{"file_path":"<project>/research/outputs/x.md"}}`
  piped to the hook with `CLAUDE_PROJECT_DIR=<project>`.
