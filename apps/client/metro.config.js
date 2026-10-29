// Expo monorepo Metro config.
// Teaches Metro to resolve modules from BOTH the app and the repo-root
// node_modules, and to watch the whole workspace. Fixes hoisting mismatches
// (e.g. babel-preset-expo at root requiring expo/config from the app).
// Ref: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
