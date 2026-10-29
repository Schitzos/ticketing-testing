#!/usr/bin/env node
// RBT-005 — CI audit gate (PIPELINE.md §4.5).
//
// Policy: FAIL the PR on any HIGH or CRITICAL vulnerability in the dependency
// graph, EXCEPT packages on the documented allowlist below. The allowlist is a
// §4.5 security exception for Expo SDK 52 build/CLI-toolchain advisories that
// cannot be cleared without a breaking Expo major bump (tracked: RBT-006).
//
// This gate is deliberately NOT `npm audit --audit-level=high` alone: that is
// all-or-nothing and would either red-X on un-fixable SDK advisories or be
// silenced entirely. Here, a NEW high/critical in any non-allowlisted package
// still fails the build — the gate stays live for issues we can act on.
//
// Rationale + review date: docs/security/SECURITY-EXCEPTIONS.md

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

// Documented, time-boxed exceptions. Keyed by the advisory's package `name`.
// Every entry MUST have a matching row in docs/security/SECURITY-EXCEPTIONS.md.
const ALLOWLIST = new Set([
  // Expo SDK 52 toolchain (build-time / CLI — not shipped in the app bundle):
  "expo",
  "@expo/cli",
  "@expo/config",
  "@expo/config-plugins",
  "@expo/metro-config",
  "@expo/prebuild-config",
  "@expo/plist",
  "@expo/bunyan",
  "@expo/rudder-sdk-node",
  "@xmldom/xmldom",
  "cacache",
  "tar",
  "postcss",
  "image-size",
  "xcode",
  "uuid",
  "expo-asset",
  "expo-constants",
  "expo-linking",
]);

// Resolve the npm CLI from Node's own install dir so the gate NEVER does a
// PATH lookup for the binary it runs (S4036: no mutable-PATH command resolution).
const nodeDir = dirname(process.execPath);
const npmCli =
  [join(nodeDir, "node_modules/npm/bin/npm-cli.js"),
   join(nodeDir, "../lib/node_modules/npm/bin/npm-cli.js")].find(existsSync);

if (!npmCli) {
  console.error("audit-gate: could not locate npm-cli.js next to the Node runtime");
  process.exit(1);
}

let report;
try {
  // `npm audit --json` exits non-zero when vulns exist; capture stdout anyway.
  // Invoked as `node <absolute npm-cli.js>` — a fixed, unwriteable path, no shell.
  const common = { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 };
  report = execFileSync(process.execPath, [npmCli, "audit", "--json"], common);
} catch (err) {
  report = err.stdout || "";
}

if (!report.trim()) {
  console.error("audit-gate: no audit output to parse");
  process.exit(1);
}

const data = JSON.parse(report);
const vulns = data.vulnerabilities || {};

const blocking = [];
const excepted = [];
for (const v of Object.values(vulns)) {
  if (v.severity !== "high" && v.severity !== "critical") continue;
  (ALLOWLIST.has(v.name) ? excepted : blocking).push(`${v.severity.toUpperCase()}  ${v.name}  [${v.range}]`);
}

if (excepted.length) {
  console.log(`audit-gate: ${excepted.length} allowlisted high/critical advisory(ies) (documented §4.5 exception — RBT-006):`);
  for (const line of excepted.toSorted((a, b) => a.localeCompare(b))) console.log("  (allowed) " + line);
}

if (blocking.length) {
  console.error(`\naudit-gate: FAIL — ${blocking.length} high/critical advisory(ies) NOT on the allowlist:`);
  for (const line of blocking.toSorted((a, b) => a.localeCompare(b))) console.error("  " + line);
  console.error("\nFix the dependency, or add a documented exception to docs/security/SECURITY-EXCEPTIONS.md + the allowlist.");
  process.exit(1);
}

console.log("\naudit-gate: PASS — no un-excepted high/critical production advisories.");
process.exit(0);
