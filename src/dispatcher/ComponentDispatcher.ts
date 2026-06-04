declare const process: { env: { NODE_ENV: string } };

type ComponentConstructor = new (element: HTMLElement) => object;

export default class ComponentsDispatcher {
  private componentSelector: string;
  private importedComponents: Map<string, ComponentConstructor>;
  private pendingImports: Map<string, Promise<ComponentConstructor>>;
  private isAsyncMode: boolean;
  private lastSyncComps: Record<string, ComponentConstructor> | null;
  private readonly appComponents: Map<string, object>;

  get APP_COMPONENTS() {
    return this.appComponents;
  }

  set Selector(selector: string) {
    this.componentSelector = selector || '[data-component]';
  }

  get compAttribute(): string {
    const match = this.componentSelector.match(/data-([^=\]]+)/);
    return match ? match[1] : 'component';
  }

  constructor() {
    this.componentSelector = '[data-component]';
    this.importedComponents = new Map();
    this.pendingImports = new Map();
    this.isAsyncMode = false;
    this.lastSyncComps = null;
    this.appComponents = new Map();
  }

  private getDomComponents(parent?: Element): HTMLElement[] {
    const target = parent || document.body;
    return [...target.querySelectorAll<HTMLElement>(this.componentSelector)]
      .filter(el => !el.dataset.uuid)
      .map(el => {
        el.dataset.uuid = crypto.randomUUID();
        return el;
      })
      .reverse();
  }

  private getNames(components: HTMLElement[]): string[] {
    const names = components
      .filter(el => el.dataset[this.compAttribute])
      .flatMap(el => el.dataset[this.compAttribute]!.split(',').map(n => n.trim()));
    return [...new Set(names)];
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

    console.error(`[ComponentDispatcher] Failed to load "${compName}":`, error);
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
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;

        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (this.isAsyncMode) {
            this.importAsyncComponents(node);
          } else if (this.lastSyncComps) {
            this.importComponents(this.lastSyncComps, node);
          }
        }

        for (const node of mutation.removedNodes) {
          if (!(node instanceof Element)) continue;
          for (const comp of node.querySelectorAll<HTMLElement>(this.componentSelector)) {
            const componentId = comp.dataset.uuid;
            if (componentId && this.appComponents.has(componentId)) {
              const instance = this.appComponents.get(componentId) as Record<string, unknown>;
              this.appComponents.delete(componentId);
              if (typeof instance._destroy === 'function') {
                (instance._destroy as () => void)();
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }

  async importComponents(comps: Record<string, ComponentConstructor>, target?: Element): Promise<void> {
    this.isAsyncMode = false;
    this.lastSyncComps = comps;
    const components = this.getDomComponents(target);

    await Promise.all(
      Object.entries(comps).flatMap(([compName, ComponentClass]) =>
        components
          .filter(el => el.dataset[this.compAttribute]?.split(',').includes(compName))
          .map(async el => {
            try {
              const instance = new ComponentClass(el);
              this.appComponents.set(el.dataset.uuid!, instance);
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                this.renderDevError(el, compName, e);
              } else {
                console.error(`[${compName}] initialization error on el =>`, el, 'with error =>', e);
              }
            }
          })
      )
    );
  }

  async importAsyncComponents(target?: Element): Promise<void> {
    this.isAsyncMode = true;
    const components = this.getDomComponents(target);
    const names = this.getNames(components);

    if (components.length === 0) return;

    await Promise.all(
      names.flatMap(compName =>
        components
          .filter(el => el.dataset[this.compAttribute]?.split(',').includes(compName))
          .map(async el => {
            try {
              const ComponentClass = await this.resolveComponentClass(compName);
              const instance = new ComponentClass(el);
              this.appComponents.set(el.dataset.uuid!, instance);
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                this.renderDevError(el, compName, e);
              } else {
                console.error(`[${compName}] initialization error on el =>`, el, 'with error =>', e);
              }
            }
          })
      )
    );
  }

  async createComponents(comps: Record<string, ComponentConstructor>): Promise<void> {
    await this.importComponents(comps);
  }

  async createAsyncComponents(): Promise<void> {
    await this.importAsyncComponents();
  }
}
