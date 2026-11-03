const fs = require('fs');
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

const demoDirectory = path.resolve(__dirname, 'example/src');

const DEMO_PAGES = [
  { name: 'overview', fileName: 'index.html', label: '🏠 Overview', title: 'Scoped Component Importer', description: 'Bind TypeScript classes to HTML with a data-component attribute: async loading, events with a queue, shared state and a friendly logger.' },
  { name: 'loading', fileName: 'loading.html', label: '⚡ Loading', title: 'Loading Components', description: 'Async chunks, sync registries, options, several components per element, DOM observation and the error overlay.' },
  { name: 'events', fileName: 'events.html', label: '📬 Event bus', title: 'Event Bus', description: 'Components talk through named events; a visible queue keeps events for listeners that arrive later.' },
  { name: 'state', fileName: 'state.html', label: '🛒 Shared state', title: 'Shared State', description: 'One immutable object shared by many components, with subscribers notified on every change.' },
  { name: 'logger', fileName: 'logger.html', label: '📜 Logger', title: 'Logger', description: 'Colourful scoped logs in development, silent in production, with a listener API.' }
];

const readLayoutPartial = fileName => fs.readFileSync(path.join(demoDirectory, 'layout', fileName), 'utf8');

const renderNavigation = currentPage => `  <nav class="site-nav" aria-label="Demo pages">
    <a class="site-nav__brand" href="./index.html">🧩 scoped-component-importer</a>
${DEMO_PAGES.map(page => `    <a class="site-nav__link" href="./${page.fileName}"${page === currentPage ? ' aria-current="page"' : ''}>${page.label}</a>`).join('\n')}
  </nav>`;

module.exports = {
  entry: Object.fromEntries(DEMO_PAGES.map(page => [page.name, path.join(demoDirectory, 'pages', `${page.name}.ts`)])),
  devtool: 'inline-source-map',
  stats: 'minimal',
  watch: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      COMPONENTS: path.join(demoDirectory, 'components'),
    }
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    hot: true,
    port: 3004,
    watchFiles: [path.join(demoDirectory, '**/*.html'), path.join(demoDirectory, 'layout/*.css')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: `[name].js`,
    chunkFilename: `[name].chunks.js`
  },
  plugins: DEMO_PAGES.map(page => new HtmlWebPackPlugin({
    template: path.join(demoDirectory, 'pages', `${page.name}.html`),
    filename: page.fileName,
    chunks: [page.name],
    templateParameters: () => ({
      pageTitle: page.title,
      pageDescription: page.description,
      styles: readLayoutPartial('styles.css'),
      activityPanel: readLayoutPartial('activity.html'),
      navigation: renderNavigation(page)
    })
  }))
};
