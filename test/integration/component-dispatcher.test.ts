import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ComponentsDispatcher from '../../src/dispatcher/ComponentDispatcher';

class MockComponent {
  constructor(public element: HTMLElement) {
    element.dataset.initialized = 'true';
  }
}

class FailingMockComponent {
  constructor(_element: HTMLElement) {
    throw new Error('init failed');
  }
}

class SecondMockComponent {
  constructor(public element: HTMLElement) {
    element.dataset.secondInitialized = 'true';
  }
}

describe('ComponentsDispatcher', () => {
  let dispatcher: ComponentsDispatcher;

  beforeEach(() => {
    document.body.innerHTML = '';
    dispatcher = new ComponentsDispatcher();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('importComponents', () => {
    it('instantiates the matching component class for an element', async () => {
      const el = document.createElement('div');
      el.dataset.component = 'MockComponent';
      document.body.appendChild(el);

      await dispatcher.importComponents({ MockComponent });

      expect(el.dataset.initialized).toBe('true');
    });

    it('stores the instance in APP_COMPONENTS keyed by uuid', async () => {
      const el = document.createElement('div');
      el.dataset.component = 'MockComponent';
      document.body.appendChild(el);

      await dispatcher.importComponents({ MockComponent });

      const uuid = el.dataset.uuid!;
      expect(uuid).toBeDefined();
      expect(dispatcher.APP_COMPONENTS.get(uuid)).toBeInstanceOf(MockComponent);
    });

    it('skips elements that already have a data-uuid', async () => {
      const el = document.createElement('div');
      el.dataset.component = 'MockComponent';
      el.dataset.uuid = 'already-set';
      document.body.appendChild(el);

      const constructorSpy = vi.fn();
      class SpyComponent {
        constructor(element: HTMLElement) { constructorSpy(); element.dataset.initialized = 'true'; }
      }

      await dispatcher.importComponents({ MockComponent: SpyComponent as unknown as typeof MockComponent });

      expect(constructorSpy).not.toHaveBeenCalled();
    });

    it('initializes both classes when element lists two component names', async () => {
      const el = document.createElement('div');
      el.dataset.component = 'MockComponent,SecondMockComponent';
      document.body.appendChild(el);

      await dispatcher.importComponents({ MockComponent, SecondMockComponent });

      expect(el.dataset.initialized).toBe('true');
      expect(el.dataset.secondInitialized).toBe('true');
    });

    it('logs via console.error when constructor throws (production)', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const el = document.createElement('div');
      el.dataset.component = 'FailingMockComponent';
      document.body.appendChild(el);

      await dispatcher.importComponents({ FailingMockComponent });

      expect(consoleSpy).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });

    it('renders dev error overlay on element when constructor throws (development)', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const el = document.createElement('div');
      el.dataset.component = 'FailingMockComponent';
      document.body.appendChild(el);

      await dispatcher.importComponents({ FailingMockComponent });

      expect(el.style.cssText).toContain('#fff5f5');
      expect(el.children.length).toBeGreaterThan(0);
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('importAsyncComponents', () => {
    it('dynamically imports and instantiates a component', async () => {
      const el = document.createElement('div');
      el.dataset.component = 'TestComponent';
      document.body.appendChild(el);

      await dispatcher.importAsyncComponents();

      expect(el.dataset.initialized).toBe('true');
      expect(dispatcher.APP_COMPONENTS.size).toBe(1);
    });

    it('returns early without error when no matching elements exist', async () => {
      await expect(dispatcher.importAsyncComponents()).resolves.toBeUndefined();
      expect(dispatcher.APP_COMPONENTS.size).toBe(0);
    });

    it('initializes all elements sharing the same component name', async () => {
      const el1 = document.createElement('div');
      el1.dataset.component = 'TestComponent';
      document.body.appendChild(el1);

      const el2 = document.createElement('div');
      el2.dataset.component = 'TestComponent';
      document.body.appendChild(el2);

      await dispatcher.importAsyncComponents();

      expect(el1.dataset.initialized).toBe('true');
      expect(el2.dataset.initialized).toBe('true');
      expect(dispatcher.APP_COMPONENTS.size).toBe(2);
    });

    it('caches the resolved class — second call skips dynamic import', async () => {
      const el1 = document.createElement('div');
      el1.dataset.component = 'TestComponent';
      document.body.appendChild(el1);

      await dispatcher.importAsyncComponents();

      const el2 = document.createElement('div');
      el2.dataset.component = 'TestComponent';
      document.body.appendChild(el2);

      await dispatcher.importAsyncComponents();

      expect(el2.dataset.initialized).toBe('true');
      expect(dispatcher.APP_COMPONENTS.size).toBe(2);
    });
  });

  describe('observeDomChanges', () => {
    let observerCleanup: (() => void) | null = null;

    afterEach(() => {
      observerCleanup?.();
      observerCleanup = null;
    });

    it('returns a cleanup function', () => {
      observerCleanup = dispatcher.observeDomChanges();
      expect(typeof observerCleanup).toBe('function');
    });

    it('initializes a newly appended component in async mode', async () => {
      await dispatcher.importAsyncComponents();
      observerCleanup = dispatcher.observeDomChanges();

      const container = document.createElement('div');
      const el = document.createElement('div');
      el.dataset.component = 'TestComponent';
      container.appendChild(el);
      document.body.appendChild(container);

      await vi.waitFor(() => expect(el.dataset.initialized).toBe('true'), { timeout: 2000 });
    });

    it('initializes a newly appended component using sync registry', async () => {
      const existing = document.createElement('div');
      existing.dataset.component = 'MockComponent';
      document.body.appendChild(existing);

      await dispatcher.importComponents({ MockComponent });
      observerCleanup = dispatcher.observeDomChanges();

      const container = document.createElement('div');
      const newEl = document.createElement('div');
      newEl.dataset.component = 'MockComponent';
      container.appendChild(newEl);
      document.body.appendChild(container);

      await vi.waitFor(() => expect(newEl.dataset.initialized).toBe('true'), { timeout: 2000 });
    });

    it('initializes a component element appended directly, without a container', async () => {
      await dispatcher.importComponents({ MockComponent });
      observerCleanup = dispatcher.observeDomChanges();

      const el = document.createElement('div');
      el.dataset.component = 'MockComponent';
      document.body.appendChild(el);

      await vi.waitFor(() => expect(el.dataset.initialized).toBe('true'), { timeout: 2000 });
    });

    it('calls _destroy when the component element itself is removed', async () => {
      const el = document.createElement('div');
      el.dataset.component = 'DestroyableComponent';
      document.body.appendChild(el);

      await dispatcher.importAsyncComponents();
      observerCleanup = dispatcher.observeDomChanges();

      document.body.removeChild(el);

      await vi.waitFor(() => expect(el.dataset.destroyed).toBe('true'), { timeout: 2000 });
    });

    it('calls _destroy on instance when containing element is removed', async () => {
      const container = document.createElement('div');
      const el = document.createElement('div');
      el.dataset.component = 'DestroyableComponent';
      container.appendChild(el);
      document.body.appendChild(container);

      await dispatcher.importAsyncComponents();
      observerCleanup = dispatcher.observeDomChanges();

      document.body.removeChild(container);

      await vi.waitFor(() => expect(el.dataset.destroyed).toBe('true'), { timeout: 2000 });
    });

    it('does not throw when removed element has no _destroy method', async () => {
      const container = document.createElement('div');
      const el = document.createElement('div');
      el.dataset.component = 'TestComponent';
      container.appendChild(el);
      document.body.appendChild(container);

      await dispatcher.importAsyncComponents();
      observerCleanup = dispatcher.observeDomChanges();

      expect(() => document.body.removeChild(container)).not.toThrow();
    });

    it('cleanup disconnects observer — new elements no longer initialized', async () => {
      await dispatcher.importAsyncComponents();
      const cleanup = dispatcher.observeDomChanges();
      cleanup();

      const container = document.createElement('div');
      const el = document.createElement('div');
      el.dataset.component = 'TestComponent';
      container.appendChild(el);
      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(el.dataset.initialized).toBeUndefined();
    });
  });

  describe('Selector setter', () => {
    it('uses a custom selector for querySelectorAll', async () => {
      dispatcher.Selector = '[data-widget]';

      const widgetEl = document.createElement('div');
      widgetEl.dataset.widget = 'MockComponent';
      document.body.appendChild(widgetEl);

      const defaultEl = document.createElement('div');
      defaultEl.dataset.component = 'MockComponent';
      document.body.appendChild(defaultEl);

      await dispatcher.importComponents({ MockComponent });

      expect(widgetEl.dataset.initialized).toBe('true');
      expect(defaultEl.dataset.initialized).toBeUndefined();
    });

    it('falls back to [data-component] when set to empty string', async () => {
      dispatcher.Selector = '';

      const el = document.createElement('div');
      el.dataset.component = 'MockComponent';
      document.body.appendChild(el);

      await dispatcher.importComponents({ MockComponent });

      expect(el.dataset.initialized).toBe('true');
    });
  });

  describe('compAttribute getter', () => {
    it("returns 'component' for the default selector", () => {
      expect(dispatcher.compAttribute).toBe('component');
    });

    it("returns 'widget' for [data-widget] selector", () => {
      dispatcher.Selector = '[data-widget]';
      expect(dispatcher.compAttribute).toBe('widget');
    });

    it("returns 'my-component' for [data-my-component=value] selector", () => {
      dispatcher.Selector = '[data-my-component=value]';
      expect(dispatcher.compAttribute).toBe('my-component');
    });
  });

  describe('APP_COMPONENTS', () => {
    it('is empty before any import', () => {
      expect(dispatcher.APP_COMPONENTS.size).toBe(0);
    });

    it('maps element uuid to its instance after importComponents', async () => {
      const el = document.createElement('div');
      el.dataset.component = 'MockComponent';
      document.body.appendChild(el);

      await dispatcher.importComponents({ MockComponent });

      const uuid = el.dataset.uuid!;
      expect(dispatcher.APP_COMPONENTS.get(uuid)).toBeInstanceOf(MockComponent);
    });

    it('accumulates instances across multiple importComponents calls', async () => {
      const el1 = document.createElement('div');
      el1.dataset.component = 'MockComponent';
      document.body.appendChild(el1);

      await dispatcher.importComponents({ MockComponent });

      const el2 = document.createElement('div');
      el2.dataset.component = 'SecondMockComponent';
      document.body.appendChild(el2);

      await dispatcher.importComponents({ SecondMockComponent });

      expect(dispatcher.APP_COMPONENTS.size).toBe(2);
    });
  });
});
