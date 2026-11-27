// Generates assets/logo.svg, a shopping bag carrying a puzzle-piece plugin.
// Run `npm run logo` to regenerate it; `node scripts/logo.js --check` fails if the committed asset is stale.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const background = "#1d2b3a";
const bag = "#f2643d";
const accent = "#fff4e3";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title">
  <title id="title">Agent Marketplace</title>
  <rect width="512" height="512" rx="104" fill="${background}"/>
  <path d="M196 206 V168 A60 60 0 0 1 316 168 V206" fill="none" stroke="${accent}" stroke-width="20" stroke-linecap="round"/>
  <path d="M140 196 H372 L396 424 H116 Z" fill="${bag}" stroke="${bag}" stroke-width="24" stroke-linejoin="round"/>
  <rect x="200" y="276" width="104" height="104" rx="10" fill="${accent}"/>
  <circle cx="252" cy="276" r="22" fill="${accent}"/>
  <circle cx="304" cy="328" r="22" fill="${accent}"/>
  <circle cx="200" cy="328" r="20" fill="${bag}"/>
</svg>
`;

const asset = fileURLToPath(new URL("../assets/logo.svg", import.meta.url));

if (process.argv.includes("--check")) {
  if (readFileSync(asset, "utf8") !== svg) {
    console.error("assets/logo.svg is out of date. Run npm run logo to regenerate it.");
    process.exit(1);
  }
} else {
  writeFileSync(asset, svg);
  console.log("Wrote assets/logo.svg.");
}
