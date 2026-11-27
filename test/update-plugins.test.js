import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const updatePlugins = join(root, "scripts/update-plugins.sh");
const marketplacePath = ".claude-plugin/marketplace.json";

let dir;
let stub;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "agent-marketplace-"));
  stub = join(dir, "stub");
  mkdirSync(stub);
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const env = () => ({
  ...process.env,
  PATH: `${join(root, "test/bin")}:${process.env.PATH}`,
  GH_STUB: stub,
});

const run = (command, args, cwd) => spawnSync(command, args, { cwd, env: env(), encoding: "utf8" });

const releases = (map) => writeFileSync(join(stub, "releases.json"), JSON.stringify(map));
const calls = () => {
  try {
    return readFileSync(join(stub, "calls"), "utf8").trim().split("\n");
  } catch {
    return [];
  }
};

const plugin = (name, source) => ({ name, description: `The ${name} plugin.`, source });
const github = (repo, extra = {}) => ({ source: "github", repo, ...extra });
const serialize = (plugins) => `${JSON.stringify({ name: "dblock", owner: { name: "Test" }, plugins }, null, 2)}\n`;

const writeMarketplace = (cwd, plugins) => {
  mkdirSync(join(cwd, ".claude-plugin"), { recursive: true });
  writeFileSync(join(cwd, marketplacePath), serialize(plugins));
};

const readMarketplace = (cwd) => readFileSync(join(cwd, marketplacePath), "utf8");

describe("update-plugins.sh", () => {
  it("pins a plugin to its latest release and leaves one without releases unpinned", () => {
    releases({ "dblock/a": "v1.2.0", "dblock/b": null });
    writeMarketplace(dir, [plugin("a", github("dblock/a")), plugin("b", github("dblock/b"))]);
    const result = run(updatePlugins, [], dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "Pin a to v1.2.0.\n");
    assert.match(result.stderr, /Skipped b, dblock\/b has no release\./);
    assert.equal(readMarketplace(dir), serialize([
      plugin("a", github("dblock/a", { ref: "v1.2.0" })),
      plugin("b", github("dblock/b")),
    ]));
  });

  it("moves a stale ref to the latest release", () => {
    releases({ "dblock/a": "v2.0.0" });
    writeMarketplace(dir, [plugin("a", github("dblock/a", { ref: "v1.2.0" }))]);
    const result = run(updatePlugins, [], dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "Pin a to v2.0.0.\n");
    assert.equal(readMarketplace(dir), serialize([plugin("a", github("dblock/a", { ref: "v2.0.0" }))]));
  });

  it("prints nothing and changes nothing when every pin is current", () => {
    releases({ "dblock/a": "v1.2.0" });
    writeMarketplace(dir, [plugin("a", github("dblock/a", { ref: "v1.2.0" }))]);
    const before = readMarketplace(dir);
    const result = run(updatePlugins, [], dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Kept a at v1\.2\.0\./);
    assert.equal(readMarketplace(dir), before);
  });

  it("skips other source types and plugins pinned to a commit", () => {
    releases({ "dblock/c": "v1.0.0" });
    const sha = "0123456789abcdef0123456789abcdef01234567";
    writeMarketplace(dir, [
      plugin("local", "./plugins/local"),
      plugin("url", { source: "url", url: "https://example.com/plugin.git" }),
      plugin("c", github("dblock/c", { sha })),
    ]);
    const before = readMarketplace(dir);
    const result = run(updatePlugins, [], dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, new RegExp(`Skipped c, which is pinned to commit ${sha}\\.`));
    assert.equal(readMarketplace(dir), before);
    assert.deepEqual(calls(), []);
  });

  it("reads the marketplace path given as an argument", () => {
    releases({ "dblock/a": "v1.0.0" });
    writeFileSync(join(dir, "other.json"), serialize([plugin("a", github("dblock/a"))]));
    const result = run(updatePlugins, ["other.json"], dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "Pin a to v1.0.0.\n");
  });

  it("fails when the marketplace is missing", () => {
    const result = run(updatePlugins, [], dir);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, `Marketplace ${marketplacePath} not found.\n`);
  });

  it("fails when a plugin repository doesn't exist", () => {
    releases({});
    writeMarketplace(dir, [plugin("a", github("dblock/missing"))]);
    const before = readMarketplace(dir);
    const result = run(updatePlugins, [], dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Repository dblock\/missing not found\./);
    assert.equal(readMarketplace(dir), before);
  });

  it("fails on errors other than a missing release", () => {
    releases({ "dblock/a": "error" });
    writeMarketplace(dir, [plugin("a", github("dblock/a"))]);
    const result = run(updatePlugins, [], dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /HTTP 500/);
  });
});
