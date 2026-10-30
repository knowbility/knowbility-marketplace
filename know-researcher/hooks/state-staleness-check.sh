#!/bin/bash
# PreCompact warning for the researcher plugin.
#
# Compares research/STATE.md mtime against the most recent file mtime in
# research/notes/ and research/drafts/. If STATE.md is older by more than
# 300 seconds (5 minutes), emit a warning to stderr. Always exit 0 —
# this hook never blocks compaction.

set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$PROJECT_DIR" ]; then
  exit 0
fi

STATE_FILE="${PROJECT_DIR%/}/research/STATE.md"
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

state_mtime() {
  if stat -f '%m' "$1" >/dev/null 2>&1; then
    stat -f '%m' "$1"
  else
    stat -c '%Y' "$1"
  fi
}

STATE_MTIME="$(state_mtime "$STATE_FILE" 2>/dev/null || echo 0)"
[ "$STATE_MTIME" -eq 0 ] && exit 0

NEWEST=0
NEWEST_FILE=""
for dir in "${PROJECT_DIR%/}/research/notes" "${PROJECT_DIR%/}/research/drafts"; do
  [ -d "$dir" ] || continue
  while IFS= read -r -d '' f; do
    [ -f "$f" ] || continue
    m="$(state_mtime "$f" 2>/dev/null || echo 0)"
    if [ "$m" -gt "$NEWEST" ]; then
      NEWEST="$m"
      NEWEST_FILE="$f"
    fi
  done < <(find "$dir" -type f -print0 2>/dev/null)
done

if [ "$NEWEST" -eq 0 ]; then
  exit 0
fi

LAG=$((NEWEST - STATE_MTIME))
if [ "$LAG" -gt 300 ]; then
  printf 'researcher: STATE.md may be stale — newer activity in %s (lag %ds). Update research/STATE.md before clearing context if anything important is unsaved.\n' "$NEWEST_FILE" "$LAG" >&2
fi

exit 0
