// RBT-005 — Jest root config (monorepo). Multi-project:
//   • node   — framework-free layers (domain, api-client, state, config, platform,
//              test-fixtures) + root tests, plain Node env (dependency rule: these MUST
//              NOT import React/RN/Expo, so Node is architecturally correct).
//   • native — RN/Expo component layer (apps/client routes, packages/ui) via the Expo-standard
//              `jest-expo` preset + React Native Testing Library. Wired by RBT-002 (routes) —
//              react-native/react-test-renderer/jest-expo all resolve from the repo-root
//              node_modules in this workspace layout, so the preset loads from root.
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
  '^@rbt/design-tokens$': path.join(__dirname, 'packages/design-tokens/src'),
  '^@rbt/design-tokens/(.*)$': path.join(__dirname, 'packages/design-tokens/src/$1'),
  '^@rbt/ui$': path.join(__dirname, 'packages/ui/src'),
  '^@rbt/ui/(.*)$': path.join(__dirname, 'packages/ui/src/$1'),
};

const nodeProject = {
  displayName: 'node',
  testEnvironment: 'node',
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
};

const nativeProject = {
  displayName: 'native',
  preset: 'jest-expo',
  watchman: false,
  roots: ['<rootDir>/apps/client', '<rootDir>/packages/ui'],
  testMatch: ['**/*.(test|spec).[jt]s?(x)', '**/__tests__/**/*.(test|spec).[jt]s?(x)'],
  // The AC2 lint test (apps/client/__ac2_tests__/*.test.mjs) runs via its own `test:ac2`
  // script (Node test runner + ESLint API), not Jest — keep it out of the native project.
  testPathIgnorePatterns: ['/node_modules/', '/__ac2_tests__/'],
  moduleNameMapper,
};

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  projects: [nodeProject, nativeProject],
  // Coverage (CI runs npm run test:ci = jest --ci --coverage). lcov feeds SonarCloud.
  // D6.3 target ≥90% on shared domain/application is enforced by the SonarCloud new-code gate.
  coverageReporters: ['text-summary', 'lcov'],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'packages/domain/src/**/*.{ts,tsx}',
    'packages/api-client/src/**/*.{ts,tsx}',
    'packages/state/src/**/*.{ts,tsx}',
    'packages/config/src/**/*.{ts,tsx}',
    'packages/platform/src/**/*.{ts,tsx}',
    'packages/ui/src/**/*.{ts,tsx}',
    'apps/client/app/**/*.{ts,tsx}',
    'apps/client/components/**/*.{ts,tsx}',
    '!**/index.ts',
    '!**/*.d.ts',
    '!**/_layout.tsx',
  ],
};
