# Design

## Marketplace

The marketplace is named `dblock` and lives in `.claude-plugin/marketplace.json`, which both Claude Code and GitHub Copilot CLI read. It holds no plugin code: each entry points at a plugin's own repository with a `github` source and no `ref`, so installs come from that repository's default branch.

## Logo

The logo is a coral shopping bag with a cream handle, carrying a cream puzzle piece, on a dark navy rounded square: a place to pick up plugins. It was chosen from five concepts (a market stall, a shopping bag, a price tag, a crate of plugs and a chat bubble with an awning) and drawn for this project by Claude, an AI, for @dblock; it is released under the project's MIT license.

`scripts/logo.js` is the editable source and writes `assets/logo.svg`. It needs only Node, with no other dependencies. To change the logo, edit the script, then regenerate and check it:

```sh
npm run logo
npm run lint
```

`npm run lint` fails when `assets/logo.svg` doesn't match the script. Keep the logo legible at 32 pixels, and look at it full size and in the README, where it's shown 160 pixels wide.
