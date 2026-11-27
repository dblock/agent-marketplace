# Design

## Marketplace

The marketplace is named `dblock` and lives in `.claude-plugin/marketplace.json`, which both Claude Code and GitHub Copilot CLI read. It holds no plugin code: each entry points at a plugin's own repository with a `github` source.

Each entry's `source.ref` is the tag of its repository's latest GitHub release, so users install released versions only, and the plugin's own `version` always matches the code they get. Claude Code caches a plugin by that version and updates it only when the version changes, so a branch whose version lags behind its commits would leave users on stale copies. A plugin that has no release yet has no `ref` and installs from its default branch.

## Plugin Updates

The Update Plugins workflow (`.github/workflows/update.yml`) keeps the pins current. It runs daily and on demand:

- `scripts/update-plugins.sh` asks GitHub for each plugin's latest release, which excludes drafts and prereleases, and sets `source.ref` to its tag. It leaves alone plugins without a release, entries with other source types, and entries pinned to a commit with `sha`, and it fails if a repository doesn't exist or GitHub returns another error.
- When a pin changed, the workflow validates the marketplace and commits the change directly to `master` as `github-actions[bot]`, with a message such as "Pin agent-baby-names to v0.1.0". When nothing changed, it does nothing.

The marketplace pulls releases instead of plugin repositories pushing to it, so the workflow needs only this repository's `GITHUB_TOKEN` with `contents: write`, and no cross-repository token. The Protect master ruleset blocks deleting and force-pushing `master` but doesn't require pull requests, so the workflow can push; people still change `master` through pull requests by convention. Pushes made with `GITHUB_TOKEN` don't trigger other workflows, so Lint, Test and Validate don't run on these commits; the workflow validates the marketplace before it pushes instead.

## Logo

The logo is a coral shopping bag with a cream handle, carrying a cream puzzle piece, on a dark navy rounded square: a place to pick up plugins. It was chosen from five concepts (a market stall, a shopping bag, a price tag, a crate of plugs and a chat bubble with an awning) and drawn for this project by Claude, an AI, for @dblock; it is released under the project's MIT license.

`scripts/logo.js` is the editable source and writes `assets/logo.svg`. It needs only Node, with no other dependencies. To change the logo, edit the script, then regenerate and check it:

```sh
npm run logo
npm run lint
```

`npm run lint` fails when `assets/logo.svg` doesn't match the script. Keep the logo legible at 32 pixels, and look at it full size and in the README, where it's shown 160 pixels wide.
