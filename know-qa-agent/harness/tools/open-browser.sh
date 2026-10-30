#!/usr/bin/env bash
# Opens a visible, logged-in Chrome with a remote-debugging port so the QA
# scripts (drive.mjs, nav-timing.mjs, capture-loading.mjs, load-timing.mjs) can
# attach to the same window you are watching. Leave this running in its own
# terminal tab for the whole session.
#
# Usage:
#   bash open-browser.sh <url> [--env <name>]
#   PORT=9222 CHROME_BIN="/path/to/chrome" bash open-browser.sh <url> [--env <name>]
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="${1:?Usage: bash open-browser.sh <url>  (the deployment to test; no default)}"
shift
ENV_NAME=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --env) ENV_NAME="${2:?--env requires a name}"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done
PORT="${PORT:-9222}"
if [ -n "$ENV_NAME" ]; then
  ENV_KEY="$(node "$HERE/auth-key.mjs" "$URL" --env "$ENV_NAME")"
else
  ENV_KEY="$(node "$HERE/auth-key.mjs" "$URL")"
fi
PROFILE="$HERE/.auth/$ENV_KEY/profile"

# macOS default. Override with CHROME_BIN on Linux/Windows.
#   Linux:   CHROME_BIN=google-chrome
#   Windows: CHROME_BIN="/c/Program Files/Google/Chrome/Application/chrome.exe"
CHROME_BIN="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

if [ ! -x "$CHROME_BIN" ] && ! command -v "$CHROME_BIN" >/dev/null 2>&1; then
  echo "Chrome not found at: $CHROME_BIN"
  echo "Install Google Chrome, or set CHROME_BIN to your Chrome/Chromium binary."
  exit 1
fi
if [ ! -d "$PROFILE" ]; then
  echo "No logged-in profile at: $PROFILE"
  echo "Run the one-time login first:   node login.mjs"
  exit 1
fi

echo "Opening Chrome (port $PORT) at $URL"
echo "Auth environment: $ENV_KEY"
echo "Keep this terminal open. Press Ctrl+C here to close the browser when done."
# Record which session this Chrome belongs to, for debugging and for any future
# tool that needs to verify it is attached to the Chrome it was told about.
# Nothing reads this today. $$ becomes Chrome's pid after exec.
cat > "$HERE/.auth/$ENV_KEY/cdp.json" <<EOF
{ "key": "$ENV_KEY", "port": $PORT, "pid": $$, "startedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "url": "$URL" }
EOF
exec "$CHROME_BIN" \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$PROFILE" \
  --no-first-run --no-default-browser-check \
  "$URL"
