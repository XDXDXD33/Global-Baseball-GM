import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("every page registered by the app has a renderer declaration", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const registry = source.match(/const pages\s*=\s*\{([^}]+)\}/s);
  assert.ok(registry, "render() must define a page registry");
  const names = registry[1].split(",").map(entry => {
    const parts = entry.trim().split(":");
    return (parts[1] || parts[0]).trim();
  }).filter(Boolean);
  assert.equal(names.length, 13, "all navigation pages should be registered");
  for (const name of names) {
    assert.match(source, new RegExp(`(?:function|const|let|var)\\s+${name}\\b`), `Missing page renderer: ${name}`);
  }
});
