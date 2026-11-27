#!/usr/bin/env bash
# Pins each plugin with a github source to its repository's latest GitHub release tag.
# Usage: scripts/update-plugins.sh [marketplace.json]
# Prints one "Pin <plugin> to <tag>." line per changed plugin on stdout, and progress on stderr.
set -euo pipefail

marketplace=${1:-.claude-plugin/marketplace.json}
if [[ ! -f $marketplace ]]; then
  echo "Marketplace $marketplace not found." >&2
  exit 1
fi

# Prints the latest release tag of a repository, or nothing if it has no release.
latest_tag() {
  local repo=$1 out
  if ! gh api "repos/$repo" --jq .full_name </dev/null >/dev/null; then
    echo "Repository $repo not found." >&2
    return 1
  fi
  if out=$(gh api "repos/$repo/releases/latest" --jq .tag_name </dev/null 2>&1); then
    printf '%s\n' "$out"
  elif [[ $out != *"HTTP 404"* ]]; then
    printf '%s\n' "$out" >&2
    return 1
  fi
}

entries=$(jq -r '.plugins[]
  | select((.source | type) == "object" and .source.source == "github")
  | [.name, .source.repo, (.source.ref // ""), (.source.sha // "")]
  | join("\u001f")' "$marketplace")

# Fields are separated by a non-whitespace character so that read keeps empty ones.
while IFS=$'\x1f' read -r name repo ref sha; do
  [[ -n $name ]] || continue
  if [[ -n $sha ]]; then
    echo "Skipped $name, which is pinned to commit $sha." >&2
    continue
  fi
  tag=$(latest_tag "$repo")
  if [[ -z $tag ]]; then
    echo "Skipped $name, $repo has no release." >&2
  elif [[ $tag == "$ref" ]]; then
    echo "Kept $name at $tag." >&2
  else
    updated=$(jq --indent 2 --arg name "$name" --arg tag "$tag" \
      '(.plugins[] | select(.name == $name) | .source.ref) = $tag' "$marketplace")
    printf '%s\n' "$updated" >"$marketplace"
    echo "Pin $name to $tag."
  fi
done <<<"$entries"
