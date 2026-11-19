#!/usr/bin/env bash
# Local quality check for this static site. Nothing in tools/ is part of the live site.
# From the repo root, type:
#   ./tools/check.sh
# or, after the first install:
#   npm run check
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d node_modules/playwright || ! -d node_modules/lighthouse || ! -d node_modules/@axe-core ]]; then
  echo "Installing local dev dependencies (first run only)..."
  npm install
fi

has_chrome=0
for c in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$c" >/dev/null 2>&1; then
    has_chrome=1
    break
  fi
done
if [[ "$has_chrome" -eq 0 ]]; then
  echo "No system Chrome found; installing Playwright's Chromium (one-time)..."
  npx playwright install chromium
fi

exec node tools/check.mjs "$@"
