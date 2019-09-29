[![Build Status](https://travis-ci.org/FeliceC/html-scoped-component-importer.svg?branch=master)](https://travis-ci.org/FeliceC/html-scoped-component-importer)

#html-scoped-component-importer

This is a simple tool to let you create and dynamically import scoped components. All you need is a html element with the *data-component* attribute and it 
will be imported and initialized.

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

If you need, is possible ti change the default html element selector ('data-component'), keep in mind that the name inside the data-component attribute is used for the lazy import, so in order to keep the lazy import working you need however a 'data-${yourDataName}' structure

```js
import { ComponentDispatcher } from 'html-scoped-component-importer';

const compDispatcher = new ComponentDispatcher();
compDispatcher.Selector('data-myFantasticAttributeName');
compDispatcher.createAsyncComponents(['ExampleComponent']);
```

```html
<div data-component="ExampleComponent"></div>
```
