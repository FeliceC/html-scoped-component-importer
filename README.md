[![Build Status](https://travis-ci.org/FeliceC/form-serialize.svg?branch=master)](https://travis-ci.org/FeliceC/form-serialize)
# Index

- [Installation](#installation)
- [Usage](#usage)
- [License](/LICENSE)

# Installation

**yarn**

```sh
yarn add html-scoped-component-importer
```

**npm**

```sh
npm install --save html-scoped-component-importer
```

# Usage

# webpack config

```js
module.exports = {
  ...
  module: {
    rules: [
      ...
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
      ...
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      COMPONENTS: path.resolve(__dirname, 'example/src/components'),
    }
  }
  ...
}
```

```js
import { ComponentDispatcher } from 'html-scoped-component-importer';

const compDispatcher = new ComponentDispatcher();
compDispatcher.createAsyncComponents(['ExampleComponent']);
```

```html
<div data-component="ExampleComponent"></div>
```
