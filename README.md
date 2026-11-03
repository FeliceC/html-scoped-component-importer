# html-scoped-component-importer

A lightweight TypeScript library for declaratively binding JavaScript classes to HTML elements via `data-component` attributes. Supports both synchronous and dynamic (async) component loading, DOM observation for SPAs, and a built-in dev error overlay.

[![npm version](https://badge.fury.io/js/html-scoped-component-importer.svg)](https://www.npmjs.com/package/html-scoped-component-importer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Async Mode (Dynamic Import)](#async-mode-dynamic-import)
- [Sync Mode (Explicit Registry)](#sync-mode-explicit-registry)
- [Multiple Components on One Element](#multiple-components-on-one-element)
- [Observing DOM Changes](#observing-dom-changes)
- [Custom Selector](#custom-selector)
- [BaseComponent Helper](#basecomponent-helper)
- [Component Options via Data Attributes](#component-options-via-data-attributes)
- [Dev Error Overlay](#dev-error-overlay)
- [API Reference](#api-reference)
- [Development](#development)

---

## Installation

```sh
npm install html-scoped-component-importer
# or
yarn add html-scoped-component-importer
```

---

## Quick Start

### 1. HTML

Mark any element with `data-component` pointing to the class name:

```html
<div data-component="HelloWorldComponent"></div>
```

### 2. Component class

Any class with an `HTMLElement` constructor argument works:

```ts
export default class HelloWorldComponent {
  constructor(element: HTMLElement) {
    element.textContent = 'Hello, world!';
  }
}
```

### 3. Dispatcher

```ts
import { ComponentDispatcher } from 'html-scoped-component-importer';

const dispatcher = new ComponentDispatcher();
dispatcher.importAsyncComponents();
```

Each element gets initialized exactly once — subsequent calls skip elements that already have a `data-uuid`.

---

## Async Mode (Dynamic Import)

Async mode uses dynamic `import()` to load component files on demand. It requires **webpack** and a `COMPONENTS` alias pointing to the folder where your component files live:

```js
// webpack.config.js
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      COMPONENTS: path.resolve(__dirname, 'src/components'),
    },
  },
};
```

### Usage

```ts
import { ComponentDispatcher } from 'html-scoped-component-importer';

const dispatcher = new ComponentDispatcher();
await dispatcher.importAsyncComponents();
```

The dispatcher resolves `data-component="HelloWorldComponent"` to `COMPONENTS/HelloWorldComponent` and caches the class after the first import — subsequent calls for the same component name skip the network round-trip.

> **Bundler compatibility note:** the import path is built at runtime (`` import(`COMPONENTS/${name}`) ``). webpack splits every file in the `COMPONENTS` folder into its own chunk. **Vite, Rollup and esbuild** leave a fully dynamic path unresolved, so the alias has no effect and the components never load; Parcel is untested. With those bundlers, use [`importComponents`](#importcomponentscomps-target) (sync mode).

---

## Sync Mode (Explicit Registry)

Pass a map of `{ name: Class }` to register components without dynamic imports. Useful when you want full control over the bundle or need server-side rendering compatibility.

```ts
import { ComponentDispatcher } from 'html-scoped-component-importer';
import HelloWorldComponent from './components/HelloWorldComponent';
import CounterComponent from './components/CounterComponent';

const dispatcher = new ComponentDispatcher();

await dispatcher.importComponents({
  HelloWorldComponent,
  CounterComponent,
});
```

Sync mode works with any bundler and needs no alias. The library reads `process.env.NODE_ENV` to decide between the dev error overlay and `console.error`, so your bundler must replace it at build time: webpack, Vite (app mode) and esbuild (with `bundle: true`) do this by default.

---

## Multiple Components on One Element

Assign more than one component to an element by comma-separating the names:

```html
<div data-component="TrackingComponent,TooltipComponent"></div>
```

Both classes are instantiated with the same element. Order is not guaranteed.

---

## Observing DOM Changes

Use `observeDomChanges()` to automatically initialize components added to the DOM after the initial page load (e.g. content injected by a SPA router or infinite scroll).

```ts
const dispatcher = new ComponentDispatcher();
await dispatcher.importAsyncComponents(); // or importComponents(...)

const stopObserving = dispatcher.observeDomChanges();

// Later, to stop:
stopObserving();
```

**Lifecycle — `_destroy()`**

When an element is removed from the DOM, the dispatcher calls `_destroy()` on its instance if the method exists:

```ts
export default class VideoPlayerComponent {
  private player: SomePlayer;

  constructor(element: HTMLElement) {
    this.player = new SomePlayer(element);
  }

  _destroy() {
    this.player.dispose();
  }
}
```

All initialized instances are accessible via `dispatcher.APP_COMPONENTS` (a `Map<uuid, instance>`), keyed by the `data-uuid` automatically assigned to each element.

---

## Custom Selector

By default the dispatcher queries `[data-component]`. Override with any CSS attribute selector:

```ts
dispatcher.Selector = '[data-widget]';
```

```html
<div data-widget="MyWidget"></div>
```

`compAttribute` always reflects the attribute name extracted from the current selector:

```ts
dispatcher.Selector = '[data-widget]';
console.log(dispatcher.compAttribute); // 'widget'

dispatcher.Selector = '[data-my-component=value]';
console.log(dispatcher.compAttribute); // 'my-component'
```

Passing an empty string resets to `[data-component]`.

---

## BaseComponent Helper

`BaseComponent` is an optional base class (not part of the published package — copy it into your project) that provides convenient accessors:

```ts
// example/src/abstracts/BaseComponent.ts
export default class BaseComponent {
  constructor(protected componentElement: HTMLElement) {}

  get $el() {
    return this.componentElement;
  }

  get COMPONENT_NAME() {
    return this.$el.dataset.component ?? '';
  }

  get $options(): Record<string, unknown> {
    // parses all data-option-* attributes (see below)
  }
}
```

Extend it in your components:

```ts
import BaseComponent from '../abstracts/BaseComponent';

export default class HelloWorldComponent extends BaseComponent {
  constructor(element: HTMLElement) {
    super(element);
    this.$el.innerHTML = this.COMPONENT_NAME;
  }
}
```

---

## Component Options via Data Attributes

`BaseComponent.$options` automatically parses `data-option-*` attributes on the element and makes them available as a typed object.

```html
<div
  data-component="GalleryComponent"
  data-option-autoplay="true"
  data-option-speed="300"
  data-option-label="Featured"
  data-option-config="{'loop': true, 'arrows': false}"
></div>
```

```ts
// Inside GalleryComponent constructor:
console.log(this.$options);
// {
//   autoplay: true,       ← boolean
//   speed: '300',         ← string (no numeric coercion)
//   label: 'Featured',    ← string
//   config: { loop: true, arrows: false }  ← parsed JSON object
// }
```

Type coercion rules:
- `"true"` → `true`, `"false"` → `false`, `"null"` → `null`
- Strings containing `{` and `}` → parsed as JSON (single quotes are normalized to double quotes)
- Everything else stays as a string

---

## Dev Error Overlay

When `NODE_ENV=development` and a component throws during initialization, the dispatcher renders an inline error overlay directly on the failing element instead of crashing the page:

- Red dashed outline with the component name and error message
- Expandable stack trace via a `<details>` element
- `console.error` is always called regardless of environment

In production (`NODE_ENV=production`) only `console.error` is called — no DOM mutation.

---

## API Reference

### `new ComponentDispatcher()`

Creates a new dispatcher instance. Each instance maintains its own component registry and `APP_COMPONENTS` map — you can run multiple dispatchers on the same page with different selectors.

---

### `importComponents(comps, target?)`

```ts
await dispatcher.importComponents({ MyComponent, OtherComponent });
```

Queries the DOM (or `target` subtree) for matching elements and instantiates the provided classes. Elements already bearing a `data-uuid` are skipped.

| Parameter | Type | Description |
|-----------|------|-------------|
| `comps` | `Record<string, ComponentConstructor>` | Map of component name → class |
| `target` | `Element` _(optional)_ | Subtree root; defaults to `document.body` |

---

### `importAsyncComponents(target?)`

```ts
await dispatcher.importAsyncComponents();
```

Same as `importComponents` but resolves classes via dynamic `import('COMPONENTS/<name>')`. Requires the `COMPONENTS` alias in your bundler. Resolved classes are cached — the dynamic import runs only once per component name.

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `Element` _(optional)_ | Subtree root; defaults to `document.body` |

---

### `observeDomChanges()`

```ts
const cleanup = dispatcher.observeDomChanges();
// stop observing:
cleanup();
```

Attaches a `MutationObserver` to `document.body`. New elements matching the selector are initialized automatically. Removed elements have `_destroy()` called on their instance (if defined).

Returns a `() => void` cleanup function that disconnects the observer.

---

### `Selector` _(setter)_

```ts
dispatcher.Selector = '[data-widget]';
```

Overrides the CSS attribute selector used for `querySelectorAll`. Empty string resets to `[data-component]`.

---

### `compAttribute` _(getter)_

```ts
dispatcher.compAttribute // → 'component' | 'widget' | ...
```

Returns the data attribute name extracted from the current selector.

---

### `APP_COMPONENTS` _(getter)_

```ts
dispatcher.APP_COMPONENTS // → Map<string, object>
```

A `Map` keyed by `data-uuid` (auto-assigned UUIDs) containing every initialized component instance. Entries are removed automatically when `observeDomChanges` detects element removal.

---

## Development

```sh
# Install dependencies
yarn install

# Run the example app
yarn start

# Unit + integration tests (Vitest / happy-dom)
yarn test:unit

# E2E tests only (Jest + Puppeteer — builds first)
yarn test:e2e

# Full test suite
yarn test

# Production build
yarn build
```

## License

[MIT](./LICENSE)
