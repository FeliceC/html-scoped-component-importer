const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: `${path.resolve(__dirname, 'example/src')}/index.js`
  },
  devtool: 'inline-source-map',
  stats: 'minimal',
  watch: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          }
        ]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: {minimize: true}
          }
        ]
      }
    ]
  },
  resolve: {
    alias: {
      COMPONENTS: path.resolve(__dirname, 'example/src/components'),
    }
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    hot: true,
    port: 3003,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: `[name].js`,
    chunkFilename: `[name].chunks.js`
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./example/src/index.html",
      filename: "./index.html"
    })
  ]
};
