// RBT-002 — apps/client-local ESLint flat config (AC2 enforcement).
/* global __dirname */
//
// AC2: `apps/client/app` must contain ROUTING ONLY — no API/fetch/storage/business
// logic. AC2 says "lint rule enforces", so the constraint is MACHINE-CHECKED here.
//
// Why a local config (not the root one): the root `eslint.config.js` is owned by
// RBT-005 (CI skeleton) and is out of this story's file scope. ESLint 9 flat config
// does not auto-cascade nested configs under a bare `eslint .`, so this file is run
// explicitly via `npm run lint:ac2 --workspace apps/client` (see package.json) and is
// intended to be folded into the root `eslint .` sweep by RBT-005's owner (one line:
// spread this file's app-scoped object). It extends — does not fork — the root config,
// so the dependency-rule zones and style rules still apply.
//
// The rule: inside `apps/client/app/**` (the route tree), importing the data layers
// (`@rbt/api-client`, `@rbt/state`) or calling raw `fetch` is an ERROR. Route files
// must delegate to feature containers / use cases (ARCHITECTURE §3, RULES.md D2.2).

const path = require('node:path');
const rootConfig = require('../../eslint.config.js');

const APP_GLOB = 'app/**/*.{ts,tsx}';

module.exports = [
  // Inherit every root config object (ignores, expo preset, dependency-rule zones,
  // prettier) so this config is a strict superset of the root sweep.
  ...rootConfig,
  {
    // Resolve @rbt/* aliases from the repo-root tsconfig so no-restricted-imports can
    // match them by package name regardless of how they are written.
    settings: {
      'import/resolver': {
        typescript: {
          project: path.join(__dirname, '..', '..', 'tsconfig.json'),
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    // ---- AC2: apps/client/app is ROUTING ONLY ----
    files: [APP_GLOB],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@rbt/api-client',
              message:
                'AC2: the route tree (apps/client/app) is routing-only. Do not import the API client from a route — delegate to a feature container / use case. RULES.md D2.2.',
            },
            {
              name: '@rbt/state',
              message:
                'AC2: the route tree (apps/client/app) is routing-only. Do not import the state store from a route — delegate to a feature container / use case. RULES.md D2.2.',
            },
          ],
          patterns: [
            {
              group: ['@rbt/api-client/*', '@rbt/state/*'],
              message:
                'AC2: the route tree (apps/client/app) is routing-only — no direct data-layer access. RULES.md D2.2.',
            },
          ],
        },
      ],
      // No raw network/storage from the routing layer (ARCHITECTURE §3: "src/app …
      // should not contain API calls"). Features call use cases; use cases own transport.
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'AC2: no direct fetch from the route tree — data access belongs in the api-client layer behind a use case. RULES.md D2.2.',
        },
        {
          name: 'localStorage',
          message:
            'AC2: no direct storage from the route tree — use a platform adapter via a use case. RULES.md D2.2.',
        },
        {
          name: 'sessionStorage',
          message:
            'AC2: no direct storage from the route tree — use a platform adapter via a use case. RULES.md D2.2.',
        },
      ],
    },
  },
];
