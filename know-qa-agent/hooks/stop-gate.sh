#!/bin/bash
# Stop gate for know-qa-agent: fires the QA suggestion at most once per session,
# and only when the session changed files that warrant QA. The fine-grained
# classification and the user prompt live in hooks/stop.md (model instructions);
# this script only enforces the cheap, deterministic preconditions from its
# Step 1 and Step 5 so sessions with no relevant changes stay silent.
set -uo pipefail

input=$(cat 2>/dev/null || true)
sid=$(printf '%s' "$input" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
marker="${TMPDIR:-/tmp}/know-qa-agent-stop-${sid:-unknown}"
[ -f "$marker" ] && exit 0

diff=$(git diff --stat HEAD 2>/dev/null || git diff --stat 2>/dev/null) || exit 0
[ -n "$diff" ] || exit 0

# Any changed file with a QA-relevant extension, after dropping lockfiles,
# test files, and planning artifacts (the "NOT relevant" classes in stop.md).
relevant=$(printf '%s\n' "$diff" \
  | grep -v -E 'package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.planning/|__tests__/|(^|/)tests?/|\.(test|spec)\.' \
  | grep -E '\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|php|html|vue|svelte|erb|jinja|css|scss|sass|less|json|ya?ml|toml)([^a-zA-Z]|$)' || true)
[ -n "$relevant" ] || exit 0

touch "$marker"
cat <<EOF
{"decision": "block", "reason": "Code changes that may affect user-facing behavior were made this session. Read ${CLAUDE_PLUGIN_ROOT}/hooks/stop.md and follow its instructions: classify the changes, check for QA specs, and offer the user a QA run. If those instructions conclude the changes are not relevant after all, say nothing about QA and end the turn."}
EOF
exit 0
