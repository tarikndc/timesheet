#!/usr/bin/env bash
# Copies the LIVE Apps Script project into src/ and removes live IDs.
#
# Requirements: Node.js, clasp (npm install -g @google/clasp), and `clasp login` done once.
# Usage (from the repository root):
#   SCRIPT_ID=your_apps_script_project_id ./scripts/sync-from-live.sh
#
# The script ID is read from the environment and is never written to the repository.

set -euo pipefail

if [[ -z "${SCRIPT_ID:-}" ]]; then
  echo "Set SCRIPT_ID to your Apps Script project ID first." >&2
  exit 1
fi
if ! command -v clasp >/dev/null 2>&1; then
  echo "clasp is not installed. Run: npm install -g @google/clasp" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Pulling live project into a temporary folder..."
printf '{"scriptId":"%s","rootDir":""}\n' "$SCRIPT_ID" > "$TMP_DIR/.clasp.json"
(cd "$TMP_DIR" && clasp pull)

shopt -s nullglob
copied=0
for f in "$TMP_DIR"/*.gs "$TMP_DIR"/*.html "$TMP_DIR"/appsscript.json; do
  cp "$f" "$REPO_ROOT/src/"
  copied=$((copied + 1))
done
echo "Copied $copied file(s) into src/."

echo "Removing live identifiers..."
python3 "$REPO_ROOT/scripts/sanitize.py"

echo "Done. Check the output above for 'CHECK by hand' lines, then review with git diff before committing."
