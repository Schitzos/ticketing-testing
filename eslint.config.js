// RBT-005 — ESLint flat config (ESLint 9).
// Built on the Expo-standard `eslint-config-expo/flat`, which already registers
// eslint-plugin-import, typescript-eslint, React, and Expo rule sets + import resolution.
// This file ADDS only project rules; it does not re-declare those plugins (that would collide).
//
// PIPELINE.md §4.2: ESLint for .ts/.tsx + config files, reject unused imports / unsafe `any`,
// and "forbidden direct infrastructure access from UI layers" — the dependency rule.
// RULES.md (Architecture & layering, D2.1): domain/application point inward — must NOT import
// outer packages. Enforced here as a SKELETON via eslint-plugin-import `no-restricted-paths`.

const expoFlat = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.expo/**',
      'android/**',
      'ios/**',
      '.jesttmp/**',
      '.jestcache/**',
      '.jest.*.js',
      '.genesis/**',
      'packages/**/dist/**',
      '**/*.tsbuildinfo',
    ],
  },
  ...expoFlat,
  {
    // Resolve @rbt/* path aliases (tsconfig paths) so eslint-plugin-import can follow them —
    // required for `no-restricted-paths` to match cross-package imports by their real path.
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json', alwaysTryTypes: true },
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // §4.2 — reject unused imports / unsafe any.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // ---- Dependency rule (Clean Architecture; RULES.md D2.1 / RBT-004) ----
      // `no-restricted-paths` zones: importing <from> inside <target> is rejected.
      // Each forbidden package is listed BOTH as its real path (`./packages/<name>`, hit by
      // relative imports) AND as its npm-workspaces symlink (`./node_modules/@rbt/<name>`, hit
      // when the `@rbt/*` alias resolves through the symlink) — so the rule fires either way.
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // domain is the core — it must not import ANY other workspace package.
            {
              target: './packages/domain',
              from: [
                './packages/api-client',
                './packages/state',
                './packages/ui',
                './packages/platform',
                './packages/config',
                './node_modules/@rbt/api-client',
                './node_modules/@rbt/state',
                './node_modules/@rbt/ui',
                './node_modules/@rbt/platform',
                './node_modules/@rbt/config',
              ],
              message:
                'domain is the innermost layer: it must not import any other package (dependency rule points inward). RULES.md D2.1.',
            },
            // application layers (api-client/state) may use domain, never UI/platform.
            {
              target: ['./packages/api-client', './packages/state'],
              from: [
                './packages/ui',
                './packages/platform',
                './node_modules/@rbt/ui',
                './node_modules/@rbt/platform',
              ],
              message:
                'application layer (api-client/state) must not depend on ui or platform adapters. RULES.md D2.1.',
            },
          ],
        },
      ],
    },
  },
  {
    // Tests may use dev globals + looser typing.
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Root tooling/config files are CommonJS Node scripts (require, __dirname, module).
    files: ['*.config.js', '*.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-commonjs': 'off',
    },
  },
  // Prettier last — disables formatting rules that conflict with `prettier --check`.
  prettier,
];
