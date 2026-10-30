# Tools Guide — Research Discovery and Processing

Reference guide for using tools in the research discovery and processing workflow.

## Tool Tiers

Tools are organized into three tiers. Skills try each tier in order — if a command returns "not found" or fails, the next tier runs automatically. The project works out of the box with zero CLIs installed (Tier 3 is built into Claude Code).

| Tier | Search | Extract | Notes |
|------|--------|---------|-------|
| **1 — Primary** | `tvly search` | `tvly extract` | Richest params: `--include-domains`, `--topic`, `--time-range`, `--depth` |
| **2 — Secondary** | `npx firecrawl-cli search` | `npx firecrawl-cli scrape` | Broader results, `--only-main-content` for clean extraction |
| **3 — Tertiary** | `WebSearch` | `WebFetch` | Built-in, always available, no API key needed. Label results as degraded. |

## Tool Reference

| Tool | Use For | Don't Use For |
|------|---------|---------------|
| `tvly search` | Finding sources, data, comparisons; systematic discovery by channel | Getting full content from a known URL |
| `tvly extract` | Pulling full content from a specific URL you already have | Discovery — use search first |
| `tvly map` | Understanding a site's structure before crawling or extracting | General research questions |
| `tvly crawl` | Systematically exploring a domain section by section | Quick lookups — too slow |
| `npx firecrawl-cli search` | Fallback discovery when tvly is unavailable | Primary search — tvly has richer params |
| `npx firecrawl-cli scrape` | Fallback extraction when tvly extract fails | Primary extraction — try tvly first |
| `npx playwright pdf` | Rendering JS-heavy pages when all other extraction fails | Primary extraction — too heavy for routine use |
| `WebSearch` | Floor fallback when no CLIs are installed | Primary or secondary search — less targeted |
| `WebFetch` | Floor fallback when no CLIs are installed | Primary or secondary extraction — less control |
| `Bash curl` | Direct API access for OpenAlex (academic) and EDGAR/ProPublica (regulatory) | Discovery channels that search tools handle well |
| `pdftotext` | Converting local PDFs to clean text before reading (less context than PDF reader) | URL sources — use extract tools instead |

## Search vs. Extract Workflow

**Search first, extract after.** Never extract a URL you haven't seen in search results or a candidates file — that's skipping evaluation.

| Step | Tool | Purpose |
|------|------|---------|
| Discovery | `tvly search` (or fallback chain) | Find candidate sources; produces DISCOVERED entries |
| Processing | `tvly extract` (or fallback chain) | Read a specific source you've already found and evaluated |

**Automated vs. manual discovery:**
- `/know-research:discover` — systematic channel-by-channel discovery via playbooks; use for projects with a defined research type and phases
- Manual `tvly search` — targeted follow-up queries, one-off lookups, projects not using the discover skill

**Status taxonomy:** Sources move through DISCOVERED → ACCESSIBLE → PROCESSED. See channel playbooks for full definitions.

## Channel-Tool Mapping

| Channel | Primary Tool | Fallback Chain | Key Param |
|---------|-------------|----------------|-----------|
| web-search | `tvly search` | firecrawl → WebSearch | `--include-domains`, `--depth` |
| academic | `Bash curl` (OpenAlex API) | `tvly search` → firecrawl → WebSearch | `mailto` param for polite pool |
| regulatory | `Bash curl` (EDGAR/ProPublica) | `tvly search` → firecrawl → WebSearch | `User-Agent` header required |
| financial | `tvly search` | firecrawl → WebSearch | `--topic finance` |
| social-signals | `tvly search` | firecrawl → WebSearch | `--include-domains` for reddit/HN/etc. |
| domain-specific | Varies (see playbook) | `tvly search` / firecrawl / WebSearch | Type hooks per research type |

For full query templates and parameters, see `${CLAUDE_PLUGIN_ROOT}/reference/discovery/channel-playbooks/`.

**Degradation:** Primary tool fails → next tier runs automatically; results are labeled with source method. If all tiers fail → empty candidates file with status report.

## CLI Invocation Patterns

```bash
# Tier 1: Tavily CLI
tvly search "query" --depth advanced --max-results 8 --topic general --json
tvly search "query" --topic news --time-range month --max-results 5 --json
tvly search "query" --include-domains "sec.gov,arxiv.org" --max-results 8 --json
tvly search "query" --topic finance --max-results 5 --json
tvly extract "https://example.com/article" --format markdown --json
tvly extract "https://example.com/article" --query "relevant topic" --format markdown

# Tier 2: Firecrawl CLI
npx firecrawl-cli search "query" --limit 8 --json
npx firecrawl-cli scrape "https://example.com" --format markdown --only-main-content

# Tier 3: Built-in (no CLI needed)
# WebSearch and WebFetch are Claude Code built-in tools — no Bash invocation

# Specialized
npx playwright pdf "https://example.com/spa" /tmp/extract-$(date +%s).pdf
tvly map "https://docs.example.com" --json
npx firecrawl-cli crawl "https://docs.example.com" --limit 50 --wait --json
```

## Codex CLI (the Tier-1 corpus reviewer)

`/know-research:review-corpus` uses the OpenAI Codex CLI as its Tier-1 reviewer — an
independent cross-family sampler for the completion credibility gate. It is optional:
with Codex absent, reviews run Tier-2 only (the plugin's own cold reviewer agent), and a
`final` run records the unavailable tier as a failed attempt so the set's composition
stays visible.

- **Install / auth:** `npm install -g @openai/codex` (or the vendor's current channel),
  then `codex login`. Verify with `codex --version` — the runner captures this string
  into the receipt.
- **Invocation contract (the runner owns this):** `codex exec -s read-only
  --skip-git-repo-check "<prompt>"`. The read-only sandbox is mandatory — reviewers
  never write. `--skip-git-repo-check` is required when the working directory is not a
  Codex-trusted root (the usual case for a scratch staging dir).
- **Budget:** measured runs take 11–25 minutes on a ~200-file corpus; the runner's
  timeout is 30 minutes. Run it in the background with stdout/stderr captured to files —
  and with stdin closed (`< /dev/null`): a detached `codex exec` with an open stdin can
  exit immediately with empty output.
- **Output contract:** the review is the *last fenced JSON block* in stdout, per the
  review brief. Anything unparseable or truncated is recorded as a failed attempt, never
  a receipt.

## Local PDF Processing

For files in `source-material/`, try `pdftotext` before the Read tool:

```bash
pdftotext "source-material/paper.pdf" "/tmp/paper.txt"
```

Then read `/tmp/paper.txt` as a plain text file. Falls back to Read tool directly on the PDF if `pdftotext` is not installed. `pdftotext` produces cleaner text with less context overhead.

## Search Patterns

Use `--depth advanced` for technical research, academic sources, and anything that needs more than surface results. Use `--depth basic` for quick fact checks and known-item lookups. Firecrawl search has no depth parameter — it always does a full search.

## Crawl Discipline

Crawling is powerful but slow. Use it deliberately. Map first (`tvly map` or `npx firecrawl-cli map`), then crawl specific sections. Do not crawl entire domains without purpose.

## PATH and Tool Visibility

The Bash tool runs in a non-interactive shell that does NOT source `~/.zshrc` or `~/.bashrc`. Tools installed via Volta, nvm, asdf, pyenv, or to user-local prefixes (`~/.local/bin`) may not be on the harness PATH even if they work in your terminal.

**CRITICAL: `settings.json` env values do NOT expand shell variables.** `$HOME`, `${HOME}`, `$PATH`, `${PATH}` all pass through as literal strings. Do NOT put variable references in `settings.json` env.PATH — they will appear as literal characters in the PATH and nothing will resolve.

### How PATH is configured in this project

A `SessionStart` hook (`hooks/setup-paths.sh`) runs at the beginning of every session and writes real, expanded PATH entries to `CLAUDE_ENV_FILE`. This persists for the entire session — every Bash call inherits the correct PATH automatically. The hook detects common tool locations (`~/.volta/bin`, `~/.local/bin`, `/opt/homebrew/bin`, nvm directories) and only adds directories that actually exist on disk.

Skill prose invokes CLI tools with bare names (`tvly search "..."`, `npx firecrawl-cli ...`). Bare names match the project `settings.json` pre-allow patterns (`Bash(tvly:*)`, `Bash(npx:*)`) and suppress per-call permission prompts in Claude Code. Do not prepend an inline `export PATH=...` — a compound `export ... && tvly ...` starts with `export`, doesn't match the pre-allow, and triggers a prompt every time. If the hook is missing or fails, the right response is to fix the hook, not to paper over it with inline exports.

### Diagnosing tool issues

If tools aren't found despite the hook:
1. Run `which tvly && which npx` — if these resolve, the hook is working
2. If not, run `ls "$HOME/.local/bin/tvly"` to confirm the binary exists on disk
3. Check that `.claude/hooks/setup-paths.sh` exists and is executable (`chmod +x`)
4. Check that the SessionStart hook is present in `.claude/settings.json`
5. If the binary is in a non-standard location, add its directory to the hook script

## Common Mistakes

- **Extracting before searching** — Running `tvly extract` on a URL you guessed or recalled, skipping search evaluation entirely. Always search first.
- **Skipping tiers** — Jumping to WebSearch when tvly is available. Always try Tier 1 first; the fallback chain handles unavailability automatically. This includes site-scoped queries — use `tvly search --include-domains "github.com"` instead of WebSearch with `site:github.com`. WebSearch is a last-resort fallback, never a parallel tool.
- **Crawling without mapping** — Crawling a domain without running `tvly map` or `npx firecrawl-cli map` first wastes time on irrelevant sections.
- **Manual search for systematic discovery** — Running `tvly search` manually for a full research project when `/know-research:discover` exists. Use the skill; it reads channel playbooks and handles degradation automatically.
- **Inline `export PATH=...` before CLI calls** — Don't. The `SessionStart` hook sets PATH for the whole session and bare-name commands match the project `settings.json` pre-allow patterns. An inline export breaks the pre-allow match and triggers a permission prompt on every call.
- **Assuming "command not found" means "not installed"** — The harness shell has a different PATH than your interactive terminal. A tool can exist on disk and still be invisible to the Bash tool. Always verify with `ls` before concluding a tool isn't installed.
