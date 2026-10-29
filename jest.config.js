// RBT-005 — Jest root config (monorepo skeleton).
// PIPELINE.md §4.3: Jest + React Native Testing Library, lcov coverage for SonarCloud.
//
// SCOPE NOTE (honest, read before extending):
//   This skeleton tests the FRAMEWORK-FREE layers (domain, api-client, state, config,
//   test-fixtures) + root tests in a plain Node environment. Per the dependency rule
//   (RULES.md D2.1 / ARCHITECTURE), those layers MUST NOT import React/RN/Expo, so a Node
//   environment is architecturally correct for them.
//
//   The Expo-standard `jest-expo` preset + RNTL (for apps/* and packages/ui component tests)
//   is INSTALLED and ready, but is NOT wired as a Jest project here yet: in this npm-workspaces
//   layout `react-native` resolves only under `apps/client/node_modules`, so `jest-expo`'s
//   `require('react-native/jest-preset')` cannot resolve from the repo root. The RN/RNTL test
//   project is added by the stories that introduce RN component code (RBT-002 app routes,
//   RBT-003 ui/theme) — they own those packages and can root the jest-expo project where RN
//   resolves (or hoist RN). See PR description "What is stubbed / deferred".
//
// Transform: babel-preset-expo (hoisted at root) handles TS/JSX for the Node project.
const path = require('node:path');

const moduleNameMapper = {
  '^@rbt/domain$': path.join(__dirname, 'packages/domain/src'),
  '^@rbt/domain/(.*)$': path.join(__dirname, 'packages/domain/src/$1'),
  '^@rbt/api-client$': path.join(__dirname, 'packages/api-client/src'),
  '^@rbt/api-client/(.*)$': path.join(__dirname, 'packages/api-client/src/$1'),
  '^@rbt/state$': path.join(__dirname, 'packages/state/src'),
  '^@rbt/state/(.*)$': path.join(__dirname, 'packages/state/src/$1'),
  '^@rbt/config$': path.join(__dirname, 'packages/config/src'),
  '^@rbt/config/(.*)$': path.join(__dirname, 'packages/config/src/$1'),
  '^@rbt/test-fixtures$': path.join(__dirname, 'packages/test-fixtures/src'),
  '^@rbt/test-fixtures/(.*)$': path.join(__dirname, 'packages/test-fixtures/src/$1'),
};

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  // watchman is a local dev convenience; disabling it keeps the run deterministic on CI
  // runners (watchman not installed) and in restricted sandboxes.
  watchman: false,
  roots: [
    '<rootDir>/__tests__',
    '<rootDir>/packages/domain',
    '<rootDir>/packages/api-client',
    '<rootDir>/packages/state',
    '<rootDir>/packages/config',
    '<rootDir>/packages/platform',
    '<rootDir>/packages/test-fixtures',
  ],
  testMatch: ['**/*.(test|spec).[jt]s?(x)', '**/__tests__/**/*.(test|spec).[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  moduleNameMapper,
  // Coverage (CI runs npm run test:ci = jest --ci --coverage). lcov feeds SonarCloud.
  // D6.3 target ≥90% on shared domain/application is enforced by the SonarCloud new-code gate,
  // not a hard local threshold — a thin skeleton must not block the first PR.
  coverageReporters: ['text-summary', 'lcov'],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'packages/domain/src/**/*.{ts,tsx}',
    'packages/api-client/src/**/*.{ts,tsx}',
    'packages/state/src/**/*.{ts,tsx}',
    'packages/config/src/**/*.{ts,tsx}',
    'packages/platform/src/**/*.{ts,tsx}',
    '!**/index.ts',
    '!**/*.d.ts',
  ],
};
