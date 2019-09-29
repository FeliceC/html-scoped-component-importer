export default class ComponentsDispatcher {
  static domComponents: Array<HTMLElement>;
  private componentSelector: string = '[data-component]';
  static componentsNames: Array<string>;
  static importedComponents: Map<String, any> = new Map();

  set Selector(selector: string) {
    this.componentSelector = selector;
  }

  private get compAttribute(): string {
    return this.componentSelector.replace('data-', '');
  }

  constructor() {
    // this.domComponents = this.getDomComponents();
    // this.observeDomChanges();
  }

  private getDomComponents(): Array<HTMLElement> {
    const domComponents = Array.prototype.slice.call(document.querySelectorAll(this.componentSelector)).filter(el => !el.componentActive);

    return domComponents;
  }

  private async observeDomChanges() {
    const target = document.body;
    const config = { attributes: false, childList: true, subtree: true };
    const observer = new MutationObserver((mutationsList, observer) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
          this.importComponents(ComponentsDispatcher.componentsNames);
          // const newNodes = mutation.addedNodes;
        }
        else if (mutation.type === 'attributes') {
          console.log('The ' + mutation.attributeName + ' attribute was modified.');
        }
      }
    });

    observer.observe(target, config);
  }

  private async importComponents(names: Array<string>) {
    let comps = new Map();
    for (const compName of names) {
      comps.set(compName, ComponentsDispatcher.domComponents.filter(el => {
        return el.dataset[this.compAttribute].includes(compName)
      }));

      if (comps.get(compName) && comps.get(compName).length > 0) {
        let componentModule = ComponentsDispatcher.importedComponents.get(compName);
        if (!componentModule) { componentModule = await import(/* webpackChunkName: `[request]` */ `COMPONENTS/${compName}.js`); }

        const DynamicComponent = componentModule.default;
        comps.get(compName).forEach(el => {
          const comp = new DynamicComponent(el);
          el.componentActive = true;
        });
      }
    }
  }

  public async createAsyncComponents(names: Array<string>) {
    try {
      ComponentsDispatcher.domComponents = this.getDomComponents();
      ComponentsDispatcher.componentsNames = names;
      await this.importComponents(names);
    } catch (e) {
      console.error(e);
    }

  }

}
