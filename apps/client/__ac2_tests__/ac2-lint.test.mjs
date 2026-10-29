// RBT-002 — AC2 enforcement test.
//
// Proves the apps/client-local ESLint config (./eslint.config.js) actually
// MACHINE-CHECKS "apps/client/app is routing-only": a forbidden data-layer
// import or a raw fetch from a route file is an ERROR, while a clean routing
// file is accepted. Uses the ESLint Node API + Node's built-in test runner —
// no RN runtime, no new dependency. Run: `npm run test:ac2 --workspace apps/client`.

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, "..");
const overrideConfigFile = path.join(appDir, "eslint.config.js");

function makeESLint() {
  return new ESLint({
    cwd: appDir,
    overrideConfigFile,
    // disable the upward lookup so only the AC2 config is applied
    flags: [],
  });
}

// A path INSIDE app/** so the `files: ['app/**']` AC2 zone applies.
const routeFilePath = path.join(appDir, "app", "__probe__.tsx");

async function lint(code) {
  const eslint = makeESLint();
  const [result] = await eslint.lintText(code, { filePath: routeFilePath });
  return result;
}

const ruleIdsOf = (result) => result.messages.map((m) => m.ruleId);

test("AC2: importing @rbt/api-client from a route is an error", async () => {
  const result = await lint(
    `import { x } from "@rbt/api-client";\nexport default function R() { return null as unknown; }\n`,
  );
  assert.ok(
    ruleIdsOf(result).includes("no-restricted-imports"),
    `expected no-restricted-imports to fire; got: ${JSON.stringify(result.messages)}`,
  );
});

test("AC2: importing @rbt/state from a route is an error", async () => {
  const result = await lint(
    `import { s } from "@rbt/state";\nexport default function R() { return null as unknown; }\n`,
  );
  assert.ok(ruleIdsOf(result).includes("no-restricted-imports"));
});

test("AC2: a raw fetch() from a route is an error", async () => {
  const result = await lint(
    `export default function R() { fetch("https://x"); return null as unknown; }\n`,
  );
  assert.ok(
    ruleIdsOf(result).includes("no-restricted-globals"),
    `expected no-restricted-globals to fire; got: ${JSON.stringify(result.messages)}`,
  );
});

test("AC2: a clean routing-only file has no AC2 violations", async () => {
  const result = await lint(
    `import { useLocalSearchParams } from "expo-router";\n` +
      `export default function R() {\n` +
      `  const { id } = useLocalSearchParams<{ id: string }>();\n` +
      `  return id as unknown;\n` +
      `}\n`,
  );
  const ac2 = result.messages.filter(
    (m) =>
      m.ruleId === "no-restricted-imports" ||
      m.ruleId === "no-restricted-globals",
  );
  assert.equal(
    ac2.length,
    0,
    `expected no AC2 violations on a clean file; got: ${JSON.stringify(ac2)}`,
  );
});
