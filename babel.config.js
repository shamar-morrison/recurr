module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // Remove console statements in production
  if (process.env.NODE_ENV === 'production') {
    plugins.push([
      'transform-remove-console',
      {
        // exclude: ['error', 'warn'],
      },
    ]);
  }

  return {
    presets: ['babel-preset-expo'],

    plugins: [
      ...plugins,
      [
        'module-resolver',
        {
          root: ['./'],

          alias: {
            '@': './',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
