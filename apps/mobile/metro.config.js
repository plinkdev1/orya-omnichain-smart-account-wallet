const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Get the workspace root
const root = path.resolve(__dirname, '../../');

config.projectRoot = __dirname;
config.watchFolders = [
  __dirname,
  path.resolve(root, 'node_modules'),
  path.resolve(root, 'packages'),
];

// Resolver configuration for monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(root, 'node_modules'),
];

module.exports = config;