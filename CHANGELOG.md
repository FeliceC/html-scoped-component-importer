# Changelog

## 3.0.0

> **2.0.0 was never released.** It only existed on the development branch, so 3.0.0 is the first release after **1.2.0**. Everything below is relative to 1.2.0.

### Added

- `EventBus`: named events between components, with a queue that keeps events emitted before anyone listens and replays them to the first subscriber (`queuedEvents`, `onQueueChange`).
- `SharedState`: an immutable shared object with `get`, `set` (partial or updater function) and `subscribe` (next and previous state).
- `Logger`: scoped, colourful console logger with `debug`, `info`, `warn`, `error`, `celebrate`, `withScope` and `onEntry`. Enabled only in development builds by default.
- `new ComponentDispatcher({ events, logger })`, plus `dispatcher.events`, `dispatcher.logger` and `dispatcher.createState(name, initialState)`.
- Components receive the dispatcher as second constructor argument: `new Component(element, dispatcher)`.
- `importComponents` and `importAsyncComponents` accept an array of roots as `target`.
- Development error overlay: in development builds a component that throws is replaced by a panel with the message and stack trace.
- Type declarations (`lib/*.d.ts`).
- [Live demo and technical reference](https://felicec.github.io/html-scoped-component-importer/).

### Changed

- The package ships compiled ES2020 modules (`lib/`) instead of `src/index.js`, and declares `sideEffects: false`.
- Scanning is linear in the number of elements (one pass instead of elements × component names), sync mode allocates no promise per element, and the DOM observer handles each mutation batch with a single scan: about 8× faster with 100 component types on 10,000 elements.
- `importAsyncComponents()` resolves after every component has been constructed (1.2.0 resolved before).
- No runtime dependencies (`uuid`, `http-server` and `@babel/runtime` removed).

### Fixed

- `data-component="A, B"` with spaces now works in sync mode.
- Custom selectors with multi-word attributes (`[data-sync-component]`) now work.
- A component element added or removed directly (not inside a container) is now set up or destroyed.
- Moving an element in the DOM no longer destroys its components.
- A missing `_destroy()` method no longer throws on removal.
- A chunk import that failed is retried on the next scan instead of failing forever.

### Breaking changes

- `APP_COMPONENTS` belongs to each dispatcher (it was one global map shared by all dispatchers) and its values are **arrays**, one instance per component on the element.
- Elements are marked with a `data-uuid` **attribute**; the `el.UUID` property no longer exists.
- When `target` is itself a component element, it is now set up too.
- Development builds print logger output and a one-time thank-you message, and show the error overlay. Production builds behave as before (`console.error` only).

## Migrating from 1.x

Most projects only need to upgrade: `data-component`, the `COMPONENTS` alias and the import methods work as before. Check the points below if they apply to you.

### You read `APP_COMPONENTS`

```ts
// 1.2.0: one instance per element, shared across dispatchers
const counter = dispatcher.APP_COMPONENTS.get(element.UUID);

// 3.0.0: per dispatcher, an array per element
const [counter] = dispatcher.APP_COMPONENTS.get(element.dataset.uuid) ?? [];
```

If you created several dispatchers and looked up instances through any of them, look them up through the dispatcher that created them.

### You read `element.UUID`

```ts
element.UUID          // 1.2.0
element.dataset.uuid  // 3.0.0
```

The id is now visible in the HTML as `data-uuid="…"`: update DOM snapshot tests and CSS that should not match it.

### You relied on `importAsyncComponents()` resolving early

It now resolves after construction, so code awaiting it can safely use the instances. If you started work in parallel on purpose, do not `await` it.

### You want the old console output in development

Pass a disabled logger:

```ts
import { ComponentDispatcher, Logger } from 'html-scoped-component-importer';

const dispatcher = new ComponentDispatcher({ logger: new Logger({ enabled: false }) });
```

The error overlay depends on the build mode, not on the logger: it only appears when your bundler sets `process.env.NODE_ENV` to `"development"`.

### Your build did not compile TypeScript

Nothing to do: 3.0.0 ships JavaScript, like 1.2.0.
