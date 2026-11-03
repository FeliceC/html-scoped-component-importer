# html-scoped-component-importer

A lightweight TypeScript library for declaratively binding JavaScript classes to HTML elements via `data-component` attributes. Supports both synchronous and dynamic (async) component loading, DOM observation for SPAs, and a built-in dev error overlay.

[![npm version](https://img.shields.io/npm/v/html-scoped-component-importer)](https://www.npmjs.com/package/html-scoped-component-importer)
[![npm downloads](https://img.shields.io/npm/dm/html-scoped-component-importer)](https://www.npmjs.com/package/html-scoped-component-importer)
[![CI](https://github.com/FeliceC/html-scoped-component-importer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/FeliceC/html-scoped-component-importer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

**[▶ Live demo](https://felicec.github.io/html-scoped-component-importer/)**: guided pages for every feature, with the event queue and the log visible in real time · **[📖 Technical reference](https://felicec.github.io/html-scoped-component-importer/reference.html)**: exact signatures, lifecycle, ordering and error semantics.

> **Upgrading from 1.x?** 3.0.0 is the first release after 1.2.0 (2.0.0 was never published). See the [changelog and migration guide](./CHANGELOG.md#migrating-from-1x).

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
- [Shared Events with a Queue](#shared-events-with-a-queue)
- [Shared State](#shared-state)
- [Development Logger](#development-logger)
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

Async mode loads each component file on demand, the first time an element needs it. The bundler turns every component into its own chunk.

Pass a `loadComponent` function that imports a component module by name. The `import()` lives in your code, so your bundler can see it and split the chunks:

```ts
import { ComponentDispatcher } from 'html-scoped-component-importer';

const dispatcher = new ComponentDispatcher({
  loadComponent: name => import(`./components/${name}.ts`),
});
await dispatcher.importAsyncComponents();
```

`data-component="HelloWorldComponent"` calls `loadComponent('HelloWorldComponent')`, which must resolve to a module whose **default export** is the component class. The class is cached: the loader runs once per component name, and a failed load is retried on the next scan.

### Bundler setup

Each setup below is built and tested in CI ([`test/bundlers`](./test/bundlers)).

#### Vite

```ts
import { ComponentDispatcher, type ComponentConstructor } from 'html-scoped-component-importer';

const componentModules = import.meta.glob<{ default: ComponentConstructor }>('./components/*.ts');

const dispatcher = new ComponentDispatcher({
  loadComponent: name => componentModules[`./components/${name}.ts`](),
});
```

No config needed.

#### webpack

```ts
const dispatcher = new ComponentDispatcher({
  loadComponent: name => import(`./components/${name}`),
});
```

```js
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      COMPONENTS: false,
    },
  },
};
```

The library still contains the [legacy `COMPONENTS` import](#legacy-webpack-alias) as a fallback, and webpack resolves it at build time even when you pass a loader: `COMPONENTS: false` tells webpack to skip it. Without it the build fails with `Can't resolve 'COMPONENTS'`.

#### esbuild

```ts
const dispatcher = new ComponentDispatcher({
  loadComponent: name => import(`./components/${name}.ts`),
});
```

Build with `bundle: true`, `format: 'esm'` and `splitting: true` to get one chunk per component. esbuild needs the file extension in the template.

#### Rollup (or any other bundler)

List the components in a map of static imports. This works with every bundler that supports `import()`:

```ts
import { ComponentDispatcher, type ComponentConstructor } from 'html-scoped-component-importer';

const componentLoaders: Record<string, () => Promise<{ default: ComponentConstructor }>> = {
  HelloWorldComponent: () => import('./components/HelloWorldComponent'),
  CounterComponent: () => import('./components/CounterComponent'),
};

const dispatcher = new ComponentDispatcher({
  loadComponent: name => componentLoaders[name](),
});
```

With Rollup, add `@rollup/plugin-node-resolve` so the library's extensionless imports resolve.

### Legacy webpack alias

Without `loadComponent`, the dispatcher imports `COMPONENTS/<name>` and needs a webpack alias pointing at your components folder. This is the 3.0 behaviour and still works:

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

Sync mode works with any bundler. With webpack, set `alias: { COMPONENTS: false }` (or the [legacy alias](#legacy-webpack-alias)) for the reason explained in [webpack setup](#webpack). Development features (error overlay, logger) turn on only when the bundler replaces `process.env.NODE_ENV` with `"development"`; webpack, Vite and esbuild do this by default. Without the replacement the library still works and simply stays in production behaviour.

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
- The error is reported through the dispatcher's [logger](#development-logger)

In production only `console.error` is called — no DOM mutation.

---

## Shared Events with a Queue

Every component receives the dispatcher as its second constructor argument, so components can talk through `dispatcher.events` without importing each other:

```ts
export default class AddToCartButton {
  constructor(element: HTMLElement, dispatcher: ComponentDispatcher) {
    element.addEventListener('click', () => dispatcher.events.emit('cart:add', { id: 3 }));
  }
}

export default class CartBadge {
  constructor(element: HTMLElement, dispatcher: ComponentDispatcher) {
    const unsubscribe = dispatcher.events.on<{ id: number }>('cart:add', item => { /* … */ });
  }
}
```

An event emitted while nobody listens is **queued** (up to 50 per event name, oldest dropped first) and replayed in order to the first subscriber, which is what a lazily loaded async component needs. The queue is observable:

```ts
events.queuedEvents;                                 // snapshot: { eventName, payload, queuedAt }[]
const stop = events.onQueueChange(queued => render(queued));
```

`EventBus` is a standalone class: use it outside components, or share one bus between dispatchers:

```ts
import { ComponentDispatcher, EventBus } from 'html-scoped-component-importer';

const events = new EventBus({ maximumQueuedPerEvent: 20 });
const asyncDispatcher = new ComponentDispatcher({ events });
const syncDispatcher = new ComponentDispatcher({ events });
```

A listener that throws is logged and does not stop the others.

---

## Shared State

`SharedState` holds an immutable object, shallow-merges updates and notifies subscribers with the next and previous state:

```ts
import { SharedState } from 'html-scoped-component-importer';

const cart = new SharedState({ items: [] as string[] });
const unsubscribe = cart.subscribe((next, previous) => render(next.items));

cart.set({ items: ['book'] });
cart.set(current => ({ items: [...current.items, 'pen'] }));
cart.get(); // → { items: ['book', 'pen'] } (frozen)
```

`dispatcher.createState('cart', initialState)` creates one whose changes are logged under the `state:cart` scope.

---

## Development Logger

A colourful console logger with one emoji per level, scoped labels and a listener API for building your own log panel. The dispatcher, the event bus and shared states report their activity through it: components set up, errors, `_destroy()` calls, queued and delivered events, state changes.

```ts
import { Logger, LogLevel } from 'html-scoped-component-importer';

const logger = new Logger({ scope: 'shop' });   // enabled only in development builds by default
logger.info('Cart ready');                     // 🧩 shop ✨ Cart ready
logger.withScope('checkout').warn('Slow API'); // shares listeners with the parent
logger.onEntry(entry => panel.append(entry.message)); // { level, scope, message, details, timestamp }

new ComponentDispatcher({ logger });
```

Pass `enabled: true` to keep it on in production, `enabled: false` to silence it.

---

## API Reference

### `new ComponentDispatcher(options?)`

Creates a new dispatcher instance. Each instance maintains its own component registry and `APP_COMPONENTS` map — you can run multiple dispatchers on the same page with different selectors.

| Option | Type | Description |
|--------|------|-------------|
| `events` | `EventBus` _(optional)_ | Bus exposed as `dispatcher.events`; a new one by default |
| `logger` | `Logger` _(optional)_ | Logger exposed as `dispatcher.logger`; enabled in development builds by default |
| `loadComponent` | `(name: string) => Promise<{ default: ComponentConstructor }>` _(optional)_ | Imports a component module in async mode; defaults to the [legacy webpack alias](#legacy-webpack-alias) |

Component classes are constructed as `new Component(element, dispatcher)`.

---

### `events`, `logger`, `createState(name, initialState)`

See [Shared Events](#shared-events-with-a-queue), [Shared State](#shared-state) and [Development Logger](#development-logger).

---

### `importComponents(comps, target?)`

```ts
await dispatcher.importComponents({ MyComponent, OtherComponent });
```

Queries the DOM (or `target` subtree) for matching elements and instantiates the provided classes. Elements already bearing a `data-uuid` are skipped.

| Parameter | Type | Description |
|-----------|------|-------------|
| `comps` | `Record<string, ComponentConstructor>` | Map of component name → class |
| `target` | `Element \| Element[]` _(optional)_ | Subtree root(s); defaults to `document.body` |

---

### `importAsyncComponents(target?)`

```ts
await dispatcher.importAsyncComponents();
```

Same as `importComponents` but resolves classes through the `loadComponent` option (see [Bundler setup](#bundler-setup)). Resolved classes are cached — the loader runs only once per component name.

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `Element \| Element[]` _(optional)_ | Subtree root(s); defaults to `document.body` |

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
dispatcher.APP_COMPONENTS // → Map<string, object[]>
```

A `Map` keyed by `data-uuid` (auto-assigned UUIDs) with the instances living on each element: one per component listed in its `data-component`. Entries are removed, and every instance gets `_destroy()`, when `observeDomChanges` detects element removal.

> **Changed in 3.0.0:** values are arrays. Before, an element hosting several components kept only the last instance, so the others never received `_destroy()`.

---

## Development

```sh
# Install dependencies
yarn install

# Run the demo page with live reload (http://localhost:3004)
yarn start

# Build the demo page published to GitHub Pages
yarn build:demo

# Headless performance benchmark (Chrome via Puppeteer)
yarn bench

# Check that the library bundles with Vite and esbuild
yarn test:bundlers

# Unit + integration tests (Vitest / happy-dom)
yarn test:unit

# E2E tests only (Jest + Puppeteer — builds first)
yarn test:e2e

# Full test suite
yarn test

# Production build
yarn build
```

### Releasing

1. On `develop`, bump the version: `npm version patch|minor|major --no-git-tag-version`, then commit.
2. Merge `develop` into `main` (only repository admins can update `main`).
3. Run **Actions → Publish to npm** on `main`: it type-checks, runs the unit tests and publishes with provenance.

## License

[MIT](./LICENSE)
