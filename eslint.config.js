import markdown from "@eslint/markdown";
import links from "eslint-plugin-markdown-links";
import unlinked from "eslint-plugin-markdown-links-unlinked";
import preferences from "eslint-plugin-markdown-preferences";
import paragraph from "eslint-plugin-markdown-preferences-paragraph";
import proseSpellcheck from "eslint-plugin-prose-spellcheck";

export default [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["**/*.md"],
    plugins: {
      markdown,
      "markdown-links": links,
      "markdown-links-unlinked": unlinked,
      "markdown-preferences": preferences,
      paragraph,
      "prose-spellcheck": proseSpellcheck,
    },
    language: "markdown/gfm",
    rules: {
      ...markdown.configs.recommended[0].rules,
      ...preferences.configs.standard.rules,
      "markdown/no-duplicate-headings": "error",
      "markdown/no-bare-urls": "error",
      "markdown/no-html": ["error", { allowed: ["img"] }],
      "markdown-preferences/no-heading-trailing-punctuation": "error",
      "markdown-preferences/heading-casing": ["error", {
        style: "Title Case",
        preserveWords: ["Claude", "CLI", "Copilot", "ESLint", "GitHub"],
      }],
      "paragraph/wrap": ["error", { width: "nowrap" }],
      // Offline link checks only; no-dead-urls would need the network.
      "markdown-links/no-missing-path": "error",
      "markdown-links/no-missing-fragments": "error",
      "markdown-links/no-self-destination": "error",
      "markdown-links-unlinked/no-unlinked-pages": "error",
      "prose-spellcheck/spellcheck": ["error", {
        dictionaries: ["@cspell/dict-en_us", "@cspell/dict-software-terms", "./.spellcheck.txt"],
        baseDir: import.meta.dirname,
      }],
    },
  },
];
