# SECURITY-EXCEPTIONS.md — CI audit gate exceptions

> Backs the allowlist in `scripts/ci/audit-gate.mjs` (RBT-005 CI gate).
> Policy source: `.genesis/docs/PIPELINE.md` §4.5 — fail PRs on high/critical
> production-dependency vulnerabilities **unless an approved exception exists**.

Every allowlisted package below is a **high/critical `npm audit` advisory that
cannot be cleared without a breaking Expo SDK major bump**. All are **build-time
/ CLI toolchain** dependencies pulled transitively by `expo` (declared as a
runtime dependency of the Expo app in `apps/client`) — they run on CI runners
and developer machines and are **not shipped in the React Native / RN-Web app
bundle delivered to end users**. Exposure is therefore limited to the build
toolchain, which is the case §4.5 exceptions exist for.

The one advisory in a package we **do** control — `decode-uri-component`
(pulled by `query-string`) — is **fixed**, not excepted, via a
`package.json` `overrides` pin to `^0.5.1`. `query-string` itself is held at
`^7` on purpose: `query-string@10` ships an ES2024 `/gv` regex that crashes
Hermes on native (prior finding), so it must not be bumped.

## Tracked remediation

- **RBT-006 (follow-up chore):** bump Expo SDK to the next line that ships
  patched `@expo/cli` / metro (`postcss`) / `@xmldom/xmldom` / `cacache`+`tar`
  toolchain, then **remove the corresponding rows here and from the allowlist**
  and re-run the gate. Re-evaluate at every Expo SDK upgrade.

## Allowlisted advisories

| Package | Severity | Origin | Why excepted |
|---------|----------|--------|--------------|
| `expo` | high | SDK 52 | meta-package; cleared only by SDK bump (RBT-006) |
| `@expo/cli` | high | SDK 52 CLI | build/CLI only, not in app bundle |
| `tar` | critical | `cacache` ← `@expo/cli` | build-time cache extraction; CLI only |
| `cacache` | high | `@expo/cli` | build-time cache; CLI only |
| `postcss` | high | `@expo/metro-config` | bundler transform; build-time only |
| `image-size` | high | Expo asset tooling | build-time asset probing |
| `@xmldom/xmldom` | high | `@expo/plist` | native prebuild config; build-time only |
| `@expo/config` / `-plugins` / `metro-config` / `prebuild-config` / `plist` | moderate | SDK 52 | build/prebuild tooling |
| `@expo/bunyan` / `@expo/rudder-sdk-node` / `uuid` / `xcode` | moderate | SDK 52 CLI telemetry/iOS tooling | CLI only |
| `expo-asset` / `expo-constants` / `expo-linking` | low | SDK 52 | transitive via `@expo/config` |

> Jest-toolchain advisories (`jest`, `@jest/core`, `jest-config`, `create-jest`,
> `deepmerge`) are **dev-only (low)** and below the high/critical gate threshold —
> they are not listed because the gate never blocks on them.

**Approved by:** {pending — FE Tech Lead / Security at Gate 3}
**Date opened:** 2026-10-29
**Review by:** next Expo SDK upgrade (RBT-006)
