import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const checkInstall = join(root, "scripts/check-install.sh");

let dir;
let stub;

beforeEach(() => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), "agent-marketplace-")));
  stub = join(dir, "stub");
  mkdirSync(stub);
  mkdirSync(join(dir, "marketplace/.claude-plugin"), { recursive: true });
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = (args = ["marketplace"], cwd = dir) =>
  spawnSync(checkInstall, args, {
    cwd,
    env: { ...process.env, PATH: `${join(root, "test/bin")}:${process.env.PATH}`, CLI_STUB: stub },
    encoding: "utf8",
  });

const writeMarketplace = (...names) => {
  const plugins = names.map((name) => ({ name, source: { source: "github", repo: `dblock/${name}` } }));
  writeFileSync(join(dir, "marketplace/.claude-plugin/marketplace.json"), JSON.stringify({ name: "dblock", plugins }));
};

const calls = () =>
  readFileSync(join(stub, "calls"), "utf8")
    .trim()
    .split("\n")
    .map((line) => line.split("\t"));

describe("check-install.sh", () => {
  it("installs every plugin with both CLIs, each in its own temporary configuration", () => {
    writeMarketplace("a", "b");
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const marketplace = join(dir, "marketplace");
    const log = calls();
    assert.deepEqual(
      log.map(([cli, , args]) => `${cli} ${args}`),
      ["claude", "copilot"].flatMap((cli) => [
        `${cli} plugin marketplace add ${marketplace}`,
        `${cli} plugin install a@dblock`,
        `${cli} plugin install b@dblock`,
      ]),
    );
    const configs = [...new Set(log.map(([cli, config]) => `${cli} ${config}`))];
    assert.equal(configs.length, 2);
    assert.notEqual(log[0][1], log[3][1]);
    for (const [, config] of log) assert.equal(existsSync(config), false);
    assert.match(result.stderr, /Installed a@dblock with Claude Code\.\nInstalled b@dblock with Claude Code\./);
    assert.match(result.stderr, /Installed b@dblock with Copilot CLI\.\n$/);
  });

  it("reports a failed install and keeps checking the other plugins", () => {
    writeMarketplace("a", "b");
    writeFileSync(join(stub, "fail"), "a@dblock\n");
    const result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Plugin a@dblock not found\.\nClaude Code could not install a@dblock\./);
    assert.match(result.stderr, /Copilot CLI could not install a@dblock\./);
    assert.match(result.stderr, /Installed b@dblock with Copilot CLI\./);
  });

  for (const [cli, label, other] of [
    ["claude", "Claude Code", "Copilot CLI"],
    ["copilot", "Copilot CLI", "Claude Code"],
  ]) {
    it(`reports when ${label} can't add the marketplace and still checks ${other}`, () => {
      writeMarketplace("a");
      writeFileSync(join(stub, `fail-${cli}`), "");
      const result = run();
      assert.equal(result.status, 1);
      assert.match(result.stderr, new RegExp(`${cli} failed\\.\\n${label} could not add the dblock marketplace\\.`));
      assert.match(result.stderr, new RegExp(`Installed a@dblock with ${other}\\.`));
      assert.equal(calls().filter(([name]) => name === cli).length, 1);
    });
  }

  it("checks the current directory by default", () => {
    writeMarketplace("a");
    const result = run([], join(dir, "marketplace"));
    assert.equal(result.status, 0, result.stderr);
    assert.equal(calls()[0][2], `plugin marketplace add ${join(dir, "marketplace")}`);
  });

  it("fails without a marketplace", () => {
    assert.equal(run(["missing"]).stderr, "Directory missing not found.\n");
    const result = run([stub]);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, `Marketplace ${stub}/.claude-plugin/marketplace.json not found.\n`);
  });
});
