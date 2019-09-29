export default class ComponentsDispatcher {
  private relativePath: string;
  private componentName: string;
  private domComponents: NodeList;
  private componentSelector: string = '[data-component]';

  constructor(relativePath: string) {
    this.relativePath = relativePath;

    this.domComponents = this.getDomComponents();

    this.observeDomChanges();
  }

  private getDomComponents(): NodeList {
    return document.querySelectorAll(this.componentSelector);
  }

  private async observeDomChanges() {
    const target = document.body;
    const config = { attributes: false, childList: true, subtree: true };
    const observer = new MutationObserver((mutationsList, observer) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const newNodes = mutation.addedNodes;
          console.log(newNodes);
        }
        else if (mutation.type === 'attributes') {
          console.log('The ' + mutation.attributeName + ' attribute was modified.');
        }
      }
    });

    observer.observe(target, config);
  }

  public async createAsyncComponent(names: Array<string>) {
    try {
      let comps = new Map();
      for (const compName of names) {
        console.log(compName);
        comps.set(compName, Array.prototype.slice.call(this.domComponents).filter(el => {
          return el.dataset.component.includes(compName)
        }));

        if (comps.get(compName) && comps.get(compName).length > 0) {
          const res = await import(/* webpackChunkName: `[request]` */ `COMPONENTS/${compName}.ts`);
          const DynamicComponent = res.default;
          comps.get(compName).forEach(el => {
            const comp = new DynamicComponent(el);
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

  }

}
