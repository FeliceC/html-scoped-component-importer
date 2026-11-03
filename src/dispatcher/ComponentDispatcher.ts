import EventBus from '../events/EventBus';
import Logger from '../logger/Logger';
import SharedState from '../state/SharedState';
import isDevelopmentBuild from '../environment/isDevelopmentBuild';

let hasThankedDeveloper = false;

export type ComponentConstructor = new (element: HTMLElement, dispatcher: ComponentsDispatcher) => object;

export default class ComponentsDispatcher {
  readonly events: EventBus;
  readonly logger: Logger;
  private componentSelector: string;
  private componentAttribute: string;
  private importedComponents: Map<string, ComponentConstructor>;
  private pendingImports: Map<string, Promise<ComponentConstructor>>;
  private isAsyncMode: boolean;
  private lastSyncComps: Record<string, ComponentConstructor> | null;
  private readonly appComponents: Map<string, object[]>;

  get APP_COMPONENTS() {
    return this.appComponents;
  }

  set Selector(selector: string) {
    this.componentSelector = selector || '[data-component]';
    const match = this.componentSelector.match(/data-([^=\]]+)/);
    this.componentAttribute = match ? match[1] : 'component';
  }

  get compAttribute(): string {
    return this.componentAttribute;
  }

  /**
   * @param options.events share one event bus between dispatchers or with code outside components
   * @param options.logger defaults to a logger enabled only in development builds
   */
  constructor(options: { events?: EventBus; logger?: Logger } = {}) {
    this.logger = options.logger ?? new Logger({ scope: 'dispatcher' });
    this.events = options.events ?? new EventBus({ logger: this.logger.withScope('events') });
    if (!hasThankedDeveloper) {
      hasThankedDeveloper = true;
      this.logger.info('Thanks for using html-scoped-component-importer! ⭐ Star it on GitHub: https://github.com/FeliceC/html-scoped-component-importer');
    }
    this.componentSelector = '[data-component]';
    this.componentAttribute = 'component';
    this.importedComponents = new Map();
    this.pendingImports = new Map();
    this.isAsyncMode = false;
    this.lastSyncComps = null;
    this.appComponents = new Map();
  }

  private findComponentElements(root: Element): HTMLElement[] {
    const descendants = [...root.querySelectorAll<HTMLElement>(this.componentSelector)];
    return root.matches(this.componentSelector) ? [root as HTMLElement, ...descendants] : descendants;
  }

  private getDomComponents(target?: Element | Element[]): HTMLElement[] {
    const roots = Array.isArray(target) ? target : [target || document.body];
    const newElements = new Set<HTMLElement>();
    for (let root of roots) {
      for (let element of this.findComponentElements(root)) {
        if (!element.dataset.uuid) newElements.add(element);
      }
    }
    return [...newElements]
      .map(el => {
        el.dataset.uuid = crypto.randomUUID();
        return el;
      })
      .reverse();
  }

  private groupElementsByComponentName(elements: HTMLElement[]): Map<string, HTMLElement[]> {
    const elementsByComponentName = new Map<string, HTMLElement[]>();
    for (let element of elements) {
      for (let rawName of element.getAttribute(`data-${this.componentAttribute}`)?.split(',') ?? []) {
        let componentName = rawName.trim();
        let sameNameElements = elementsByComponentName.get(componentName);
        if (sameNameElements) sameNameElements.push(element);
        else elementsByComponentName.set(componentName, [element]);
      }
    }
    return elementsByComponentName;
  }

  private renderDevError(el: HTMLElement, compName: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error && error.stack ? error.stack : null;

    el.style.cssText = [
      'outline: 2px dashed #e53e3e',
      'padding: 12px',
      'background: #fff5f5',
      'font-family: monospace',
      'font-size: 12px',
      'color: #742a2a',
      'min-height: 48px'
    ].join(';');

    const header = document.createElement('div');
    header.style.cssText = 'font-weight:bold;margin-bottom:6px;';
    header.textContent = `⚠ ComponentDispatcher — failed to load: ${compName}`;

    const message = document.createElement('div');
    message.textContent = errorMessage;

    el.replaceChildren(header, message);

    if (stack) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Stack trace';
      const pre = document.createElement('pre');
      pre.style.cssText = 'overflow:auto;max-height:200px;margin-top:8px;font-size:10px;';
      pre.textContent = stack;
      details.append(summary, pre);
      el.append(details);
    }

    this.logger.error(`failed to load "${compName}"`, error);
  }

  private async resolveComponentClass(compName: string): Promise<ComponentConstructor> {
    const cached = this.importedComponents.get(compName);
    if (cached) return cached;

    const pending = this.pendingImports.get(compName);
    if (pending) return pending;

    const promise = import(/* webpackChunkName: `component-[request]` */ `COMPONENTS/${compName}`).then(mod => {
      const ComponentClass = mod.default as ComponentConstructor;
      this.importedComponents.set(compName, ComponentClass);
      this.pendingImports.delete(compName);
      return ComponentClass;
    });
    this.pendingImports.set(compName, promise);
    return promise;
  }

  observeDomChanges(): () => void {
    const observer = new MutationObserver(mutations => {
      const addedElements: Element[] = [];
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;

        for (const node of mutation.addedNodes) {
          if (node instanceof Element && node.isConnected) addedElements.push(node);
        }

        for (const node of mutation.removedNodes) {
          if (!(node instanceof Element) || node.isConnected) continue;
          for (const comp of this.findComponentElements(node)) {
            const componentId = comp.dataset.uuid;
            const instances = componentId ? this.appComponents.get(componentId) : undefined;
            if (!instances) continue;
            this.appComponents.delete(componentId!);
            for (let instance of instances as Record<string, unknown>[]) {
              if (typeof instance._destroy === 'function') (instance._destroy as () => void)();
            }
            this.logger.debug(`destroyed "${comp.getAttribute(`data-${this.componentAttribute}`)}"`);
          }
        }
      }

      if (addedElements.length === 0) return;
      if (this.isAsyncMode) {
        this.importAsyncComponents(addedElements);
      } else if (this.lastSyncComps) {
        this.importComponents(this.lastSyncComps, addedElements);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }

  private reportInitializationError(element: HTMLElement, componentName: string, error: unknown): void {
    if (isDevelopmentBuild()) {
      this.renderDevError(element, componentName, error);
    } else {
      console.error(`[${componentName}] initialization error on el =>`, element, 'with error =>', error);
    }
  }

  private instantiateComponent(element: HTMLElement, componentName: string, ComponentClass: ComponentConstructor): void {
    try {
      const instance = new ComponentClass(element, this);
      const elementInstances = this.appComponents.get(element.dataset.uuid!);
      if (elementInstances) elementInstances.push(instance);
      else this.appComponents.set(element.dataset.uuid!, [instance]);
    } catch (error) {
      this.reportInitializationError(element, componentName, error);
    }
  }

  async importComponents(comps: Record<string, ComponentConstructor>, target?: Element | Element[]): Promise<void> {
    this.isAsyncMode = false;
    this.lastSyncComps = comps;
    const elementsByComponentName = this.groupElementsByComponentName(this.getDomComponents(target));

    for (let [componentName, ComponentClass] of Object.entries(comps)) {
      for (let element of elementsByComponentName.get(componentName) ?? []) {
        this.instantiateComponent(element, componentName, ComponentClass);
      }
    }
    this.logInitializedComponents(elementsByComponentName);
  }

  async importAsyncComponents(target?: Element | Element[]): Promise<void> {
    this.isAsyncMode = true;
    const elementsByComponentName = this.groupElementsByComponentName(this.getDomComponents(target));

    await Promise.all(
      [...elementsByComponentName].map(async ([componentName, elements]) => {
        let ComponentClass: ComponentConstructor;
        try {
          ComponentClass = await this.resolveComponentClass(componentName);
        } catch (error) {
          elements.forEach(element => this.reportInitializationError(element, componentName, error));
          return;
        }
        elements.forEach(element => this.instantiateComponent(element, componentName, ComponentClass));
      })
    );
    this.logInitializedComponents(elementsByComponentName);
  }

  /** Creates a SharedState whose changes are logged under `state:<name>`. */
  createState<State extends object>(name: string, initialState: State): SharedState<State> {
    return new SharedState(initialState, { logger: this.logger.withScope(`state:${name}`) });
  }

  private logInitializedComponents(elementsByComponentName: Map<string, HTMLElement[]>): void {
    if (elementsByComponentName.size === 0) return;
    const countsByComponentName = Object.fromEntries(
      [...elementsByComponentName].map(([componentName, elements]) => [componentName, elements.length])
    );
    this.logger.info(`set up ${Object.keys(countsByComponentName).join(', ')}`, countsByComponentName);
  }

  async createComponents(comps: Record<string, ComponentConstructor>): Promise<void> {
    await this.importComponents(comps);
  }

  async createAsyncComponents(): Promise<void> {
    await this.importAsyncComponents();
  }
}
