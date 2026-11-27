#!/usr/bin/env bash
# Installs every plugin in the marketplace with Claude Code and with Copilot CLI, each in its own empty, temporary configuration.
# Usage: scripts/check-install.sh [marketplace directory]
# Prints progress on stderr, and exits with 1 when any install failed.
set -euo pipefail
if [[ ! -d ${1:-.} ]]; then echo "Directory ${1:-.} not found." >&2; exit 1; fi
dir=$(cd "${1:-.}" && pwd)
marketplace=$dir/.claude-plugin/marketplace.json
if [[ ! -f $marketplace ]]; then echo "Marketplace $marketplace not found." >&2; exit 1; fi
name=$(jq -r .name "$marketplace")
plugins=$(jq -r '.plugins[].name' "$marketplace")
temp=$(mktemp -d)
trap 'rm -rf "$temp"' EXIT
failed=0

# Runs a CLI command with its configuration in $temp/<cli>, showing the output only when the command fails.
run() {
  local cli=$1 variable=$2
  shift 2
  if ! env "$variable=$temp/$cli" "$cli" "$@" </dev/null >"$temp/output" 2>&1; then
    cat "$temp/output" >&2
    return 1
  fi
}

check() {
  local cli=$1 variable=$2 label=$3 plugin
  if ! command -v "$cli" >/dev/null; then echo "$label ($cli) is not installed." >&2; failed=1; return; fi
  mkdir -p "$temp/$cli"
  if ! run "$cli" "$variable" plugin marketplace add "$dir"; then echo "$label could not add the $name marketplace." >&2; failed=1; return; fi
  while read -r plugin; do
    [[ -n $plugin ]] || continue
    if run "$cli" "$variable" plugin install "$plugin@$name"; then echo "Installed $plugin@$name with $label." >&2
    else echo "$label could not install $plugin@$name." >&2; failed=1; fi
  done <<<"$plugins"
}

check claude CLAUDE_CONFIG_DIR "Claude Code"
check copilot COPILOT_HOME "Copilot CLI"
exit "$failed"
