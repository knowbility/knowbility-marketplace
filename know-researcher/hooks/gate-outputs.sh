#!/bin/bash
# PreToolUse gate for the researcher plugin.
#
# Blocks Write/Edit/MultiEdit operations targeting ${CLAUDE_PROJECT_DIR}/research/outputs/
# unless authorized by a recent (within 120s) "pass" entry in
# ${CLAUDE_PROJECT_DIR}/research/audits/gate-log.md. /know-research:audit-claims
# writes that entry immediately before promoting a draft, so legitimate
# promotions flow through; rogue writes (manual edits, other skills) bounce.
#
# Output contract: exit 0 always; emit JSON decision on stdout per Claude Code
# PreToolUse hook spec. {"decision":"block","reason":"..."} blocks the tool call
# and surfaces reason to the user; absence of decision allows the call.
#
# The gate requires jq. Without it this script used to read an empty file path and
# exit 0, which allowed the write — the plugin's central guarantee disappeared and
# the only trace was "jq: command not found" on stderr, where nobody reads it.
# A gate that cannot verify authorization must not grant it, so a missing jq now
# fails CLOSED for writes that name the outputs directory, and says why. The test
# is a substring match on the raw payload, which needs no JSON parsing; it is
# deliberately broad, because over-blocking announces itself and under-blocking
# does not. Nothing outside research/outputs/ is affected either way.
#
# jq ships with macOS 15 and later (/usr/bin/jq, com.apple.jq). On earlier macOS,
# on many Linux images, and in minimal containers it has to be installed.

set -u

INPUT="$(cat)"

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$PROJECT_DIR" ]; then
  exit 0
fi

OUTPUTS_PREFIX="${PROJECT_DIR%/}/research/outputs/"

if ! command -v jq >/dev/null 2>&1; then
  case "$INPUT" in
    *"$OUTPUTS_PREFIX"*)
      printf '%s' '{"decision":"block","reason":"The research/outputs/ gate needs jq and jq is not on PATH, so this write cannot be checked against the audit log. Install jq (macOS: brew install jq, or upgrade to macOS 15+ which ships it; Debian/Ubuntu: apt install jq) and retry. Refusing rather than allowing: an unverifiable promotion is exactly what this gate exists to stop."}'
      ;;
  esac
  exit 0
fi

TOOL_NAME="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')"
FILE_PATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')"

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

case "$TOOL_NAME" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

case "$FILE_PATH" in
  "$OUTPUTS_PREFIX"*) ;;
  *) exit 0 ;;
esac

case "$FILE_PATH" in
  "${OUTPUTS_PREFIX}.gate-policy.md") exit 0 ;;
esac

GATE_LOG="${PROJECT_DIR%/}/research/audits/gate-log.md"

block() {
  local reason="$1"
  jq -n --arg reason "$reason" '{decision: "block", reason: $reason}'
  exit 0
}

if [ ! -f "$GATE_LOG" ]; then
  block "Writes to research/outputs/ are restricted to /know-research:audit-claims promotions. No gate log found at $GATE_LOG. Run /know-research:audit-claims against the corresponding draft instead."
fi

LAST_ROW="$(grep -E '^\| [0-9]{4}-[0-9]{2}-[0-9]{2}T' "$GATE_LOG" | tail -n 1)"

if [ -z "$LAST_ROW" ]; then
  block "Writes to research/outputs/ are restricted to /know-research:audit-claims promotions. Gate log has no promotion entries yet. Run /know-research:audit-claims against the corresponding draft instead."
fi

LAST_TS="$(printf '%s' "$LAST_ROW" | awk -F '\\| *' '{print $2}' | awk '{print $1}')"
LAST_RESULT="$(printf '%s' "$LAST_ROW" | awk -F '\\| *' '{print $4}' | awk '{print $1}')"
LAST_FILE="$(printf '%s' "$LAST_ROW" | awk -F '\\| *' '{print $5}' | awk '{print $1}')"

if [ "$LAST_RESULT" != "pass" ]; then
  block "Most recent gate-log entry is not a pass result (got: '$LAST_RESULT'). Re-run /know-research:audit-claims."
fi

REL_TARGET="${FILE_PATH#${PROJECT_DIR%/}/}"
if [ "$LAST_FILE" != "$REL_TARGET" ] && [ "$LAST_FILE" != "$FILE_PATH" ]; then
  block "Gate-log entry authorizes a write to '$LAST_FILE' but the current tool call targets '$REL_TARGET'. Promotion paths must match. Re-run /know-research:audit-claims on the correct draft."
fi

NOW_EPOCH="$(date -u +%s)"
LAST_EPOCH="$(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$LAST_TS" +%s 2>/dev/null || date -u -d "$LAST_TS" +%s 2>/dev/null || echo 0)"

if [ "$LAST_EPOCH" -eq 0 ]; then
  block "Could not parse gate-log timestamp '$LAST_TS'. Re-run /know-research:audit-claims."
fi

AGE=$((NOW_EPOCH - LAST_EPOCH))
if [ "$AGE" -lt 0 ] || [ "$AGE" -gt 120 ]; then
  block "Gate-log authorization is stale (${AGE}s old, limit 120s). The audit-claims promotion window has expired. Re-run /know-research:audit-claims on the draft."
fi

exit 0
