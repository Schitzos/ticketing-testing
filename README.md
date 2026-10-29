# Rusuh Booking Tiket — Front-End (Expo Universal)

One codebase, three targets: **Web** (React Native Web), **Android**, and **iOS** — built with
Expo (Router), React Native, TypeScript (strict), in an npm-workspaces monorepo.

This README takes you from a fresh **clone → running Hello World** on all three platforms.

---

## 1. Prerequisites

| Tool | Version | Needed for |
|------|---------|-----------|
| **Node.js** | >= 20 | everything |
| **npm** | >= 10 (ships with Node 20) | workspaces |
| **Watchman** (macOS, optional) | latest | faster file watching |
| **Xcode** | 15+ (with an iOS Simulator runtime) | iOS |
| **Android Studio** | latest (SDK + an AVD + `platform-tools`) | Android |
| **CocoaPods** | 1.12+ (Ruby >= 2.7) | iOS **native dev build** only — not needed for Expo Go |

> You do **not** need Xcode/Android Studio to run **Web**. You do **not** need CocoaPods to run
> iOS/Android through **Expo Go** — only for a native `expo run:ios` / `expo run:android` build.

Verify your native toolchains:

```bash
xcrun simctl list devices     # iOS simulators exist
emulator -list-avds           # at least one Android AVD exists  (needs ANDROID_HOME on PATH)
```

If `emulator`/`adb` are "command not found", export the SDK path (add to your shell profile):

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

---

## 2. Clone & install

```bash
git clone https://github.com/tiket-sampai-nonton/rusuh-booking-mobile.git
cd rusuh-booking-mobile
git checkout develop        # base branch
npm install                 # installs the whole workspace (root + apps/* + packages/*)
```

## 3. Environment

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend base URL |
| `EXPO_PUBLIC_USE_MOCKS` | `true` binds mock adapters (payment + FE-NEED gaps); `false` hits the real BE |
| `EXPO_PUBLIC_ENV` | `development` / `production` |

> Only `EXPO_PUBLIC_*` keys are exposed to the client bundle. Never put secrets in them, and never commit `.env`.

---

## 4. Run

All commands run from the **repo root**.

### Web

```bash
npm run web
# → opens http://localhost:8081 (or the port Expo prints)
```

### Android (emulator)

1. Start an emulator (Android Studio → Device Manager → ▶, or `emulator -avd <name>`).
2. ```bash
   npm run start        # starts Metro
   # press  a  in the terminal  → installs Expo Go on the emulator and opens the app
   ```
   First launch downloads Expo Go to the emulator automatically.

### iOS (simulator)

1. Open the Simulator app: `open -a Simulator` (boot a device, e.g. iPhone 16 Pro).
2. ```bash
   npm run start        # starts Metro
   # press  i  in the terminal  → installs Expo Go on the simulator and opens the app
   ```

> `npm run android` / `npm run ios` run a **native dev build** (`expo run:*`) instead of Expo Go —
> heavier, and iOS requires CocoaPods. For day-to-day work, `npm run start` + `a`/`i` (Expo Go) is faster.

You should see **"Rusuh Booking 👋 — Hello World"** with `Running on <platform>` and `domain pkg: @rbt/domain`
(proving cross-package imports resolve). Evidence screenshots live in `docs/evidence/RBT-001/`.

---

## 5. Project layout

```
apps/client/           Expo app — Expo Router routes only (no business logic)
packages/
  domain/              entities, use cases, state machines (framework-free)
  api-client/          OpenAPI types, repositories, transport
  state/               Zustand stores
  ui/                  shared RN / RN-Web components
  design-tokens/       color / type / spacing / radius / motion
  platform/            native/web adapter interfaces + actuals
  config/              env, composition root
  test-fixtures/       contract-shaped mocks (incl. mock PaymentRepository)
```

Dependency direction points **inward**: `UI → use cases → domain → ports`. Outer adapters
(mock ↔ real BE) are swappable at the composition root.

---

## 6. Useful scripts (root)

```bash
npm run start       # Expo dev server (then a / i / w)
npm run web         # web only
npm run android     # native Android dev build
npm run ios         # native iOS dev build
npm run typecheck   # tsc -b (strict, project references)
npm run lint        # ESLint
npm test            # Jest
```

---

## 7. Troubleshooting

**`Invalid regular expression: Invalid flags` on Android/iOS (but web is fine).**
A dependency shipped an ES2024 regex (`/v` flag) that Hermes can't parse. This repo pins
`query-string@^7` to avoid it. If it reappears after adding a dep, find the offender with:
`curl -s '<metro-bundle-url>' | grep -n '/gv'` and pin that dep to a Hermes-safe version.

**`Unable to resolve expo/config` / `EXPO_ROUTER_APP_ROOT is not defined`.**
npm-workspaces hoisting quirk for Expo monorepos. This repo already handles it via
`apps/client/index.js` (explicit `require.context('./app')`), a root-level `expo` devDep, and
`apps/client/metro.config.js` (`watchFolders` + `nodeModulesPaths`). Run `npm run start -- --clear`
to drop a stale Metro cache.

**Metro port in use / stale cache.** `npm run start -- --clear` (or `--port 8083`).

**iOS native build fails on `pod install`.** Install CocoaPods on Ruby >= 2.7
(`brew install cocoapods`, or `sudo gem install cocoapods` with a modern Ruby). Not needed for Expo Go.

**Android `adb: command not found`.** Export `ANDROID_HOME` and add `platform-tools`/`emulator` to `PATH` (see §1).

---

## 8. More

Architecture, API contracts, flows, edge cases, security, and the task list live under `.genesis/docs/`.
See `AGENTS.md` at the repo root for the full project manifest and rules.
