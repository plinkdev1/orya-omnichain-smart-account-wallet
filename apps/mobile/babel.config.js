module.exports = function (api) {
  api.cache(true);
  const isTestEnv = api.env(['test', 'jest']);
  
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        useESModules: true,
      }],
      !isTestEnv && 'react-native-worklets-core/plugin',
    ].filter(Boolean),
  };
};