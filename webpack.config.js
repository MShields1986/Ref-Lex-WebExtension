const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const browser = env?.browser || 'chrome';

  return {
    mode: argv.mode || 'production',
    devtool: isDevelopment ? 'inline-source-map' : false,
    entry: {
      popup: './src/popup/index.tsx',
      background: './src/background/service-worker.ts',
      content: './src/content/inject.ts',
      options: './src/options/index.tsx'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode || 'production'),
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'src/popup/popup.html',
            to: 'popup.html'
          },
          {
            from: 'src/options/options.html',
            to: 'options.html'
          },
          {
            from: browser === 'firefox' ? 'manifest-firefox.json' : 'manifest-chrome.json',
            to: 'manifest.json'
          },
          {
            from: 'assets',
            to: 'assets',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    optimization: {
      minimize: !isDevelopment,
      splitChunks: {
        chunks(chunk) {
          // Don't split any extension scripts - they need to run in extension context
          return false;
        }
      }
    }
  };
};
