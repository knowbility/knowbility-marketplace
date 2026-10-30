#!/bin/bash
# Ensures CLI tools (tvly, npx, node) are on PATH for all Bash tool calls.
#
# Claude Code's settings.json env values do NOT expand shell variables —
# $HOME and $PATH become literal strings. This hook runs at session start
# and writes real PATH entries to CLAUDE_ENV_FILE, which persists for the
# entire session.
#
# Common tool locations detected:
#   ~/.local/bin      — tvly (Tavily CLI)
#   ~/.volta/bin      — node, npm, npx (Volta-managed)
#   /opt/homebrew/bin — Homebrew on Apple Silicon
#   /usr/local/bin    — Homebrew on Intel Mac / Linux

if [ -z "$CLAUDE_ENV_FILE" ]; then
  exit 0
fi

EXTRA_PATH=""

for dir in \
  "$HOME/.volta/bin" \
  "$HOME/.local/bin" \
  "$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node/" 2>/dev/null | tail -1)/bin" \
  "/opt/homebrew/bin" \
  "/opt/homebrew/sbin" \
  "/usr/local/bin" \
  ; do
  if [ -d "$dir" ]; then
    EXTRA_PATH="${EXTRA_PATH:+$EXTRA_PATH:}$dir"
  fi
done

if [ -n "$EXTRA_PATH" ]; then
  echo "export PATH=\"$EXTRA_PATH:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

exit 0
