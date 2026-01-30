const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    background: './src/app/background/index.ts',
    'content-script': './src/app/content/index.ts',
    popup: './src/app/popup/index.tsx',
    sidepanel: './src/app/sidepanel/index.tsx',
    offscreen: './src/app/offscreen/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/, /\.test\.tsx?$/, /__tests__/, /\/test\//],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [require('@tailwindcss/postcss'), require('autoprefixer')],
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/app/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './src/app/sidepanel/sidepanel.html',
      filename: 'sidepanel.html',
      chunks: ['sidepanel'],
    }),
    new HtmlWebpackPlugin({
      template: './src/app/offscreen/offscreen.html',
      filename: 'offscreen.html',
      chunks: ['offscreen'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/icons', to: 'icons' },
        { from: 'lib/tesseract', to: 'tesseract' },
        { from: 'public/tesseract', to: 'tesseract' },
      ],
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: (chunk) => !['background', 'content-script'].includes(chunk.name),
      cacheGroups: {
        webllm: {
          test: /[\\/]node_modules[\\/]@mlc-ai[\\/]web-llm/,
          name: 'webllm',
          priority: 20,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },
  devtool: 'cheap-module-source-map',
};
