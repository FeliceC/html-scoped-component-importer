[![Build Status](https://travis-ci.org/FeliceC/html-scoped-component-importer.svg?branch=master)](https://travis-ci.org/FeliceC/html-scoped-component-importer)

#html-scoped-component-importer

This is a simple tool to let you create and dynamically import scoped components. All you need is a html element with the *data-component* attribute and it 
will be imported and initialized.

# Index

- [Installation](#installation)
- [Usage](#usage)
- [Example](/example)
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

## webpack config
```js
module.exports = {
  ...
  resolve: {
    alias: {
      COMPONENTS: path.resolve(__dirname, '{your components folder}'),
    }
  }
  ...
}
```

## main.js
```js
import { ComponentDispatcher } from 'html-scoped-component-importer';

const compDispatcher = new ComponentDispatcher();
compDispatcher.createAsyncComponents();
```

## ExampleComponent.js
```js
export default class ExampleComponent {
  constructor(element) {
    super(element);
    element.innerHTML = element.dataset.component;
  }
}
```

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Title</title>
  <script async="async" defer="defer" src="main.js"></script>
</head>

<body>
  <div data-component="ExampleComponent"></div>
</body>
```
