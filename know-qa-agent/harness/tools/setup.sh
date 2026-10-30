#!/usr/bin/env bash
# One-time setup for the QA harness. Run once per machine.
#   bash setup.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

echo "Installing Playwright (using your system Chrome, skipping the bundled-browser download)..."
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install

# Confirm Chrome is present (we drive your real Chrome so sign-ins work).
CHROME_BIN="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
if [ -x "$CHROME_BIN" ] || command -v "$CHROME_BIN" >/dev/null 2>&1; then
  echo "Chrome: found."
else
  echo "Chrome: NOT found at $CHROME_BIN."
  echo "  Install Google Chrome, or set CHROME_BIN to your Chrome/Chromium binary."
fi

# ffmpeg/ffprobe are only needed for video capture (record.mjs). Optional: the rest
# of the harness works without them; record.mjs prints a clear error if they're missing.
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  echo "ffmpeg: found (video capture available)."
else
  echo "ffmpeg: NOT found — video capture (record.mjs) is unavailable until you install it."
  echo "  macOS: brew install ffmpeg   ·   Debian/Ubuntu: apt-get install ffmpeg"
fi

echo
echo "Setup complete."
echo "Next, sign in once to the site you are testing:"
echo "   node login.mjs --url \"<the URL of the page you want to test>\""
