import uuid from 'uuid/v1';

const APP_COMPONENTS = new Map();

export default class ComponentsDispatcher {
  set Selector(selector) {
    this.componentSelector = selector || '[data-component]';
  }

  get compAttribute() {
    return this.componentSelector
      .replace('data-', '')
      .replace('[', '')
      .replace(']', '');
  }

  constructor() {
    this.componentSelector = '[data-component]';
    this.domComponents = null;
    this.componentsNames = null;
    this.compsObj = null;
    this.importedComponents = new Map();
  }

  getDomComponents(parent) {
    let domComponents = [];
    const target = parent || document.body;
    try {
      domComponents = [
        ...target.querySelectorAll(this.componentSelector)
      ].filter(el => !el.UUID);
    } catch (e) {
      console.error(e);
    }

    return domComponents.reverse();
  }

  getNamesFromDom(parent) {
    let compNames;
    try {
      const names = this.getDomComponents(parent)
        .filter(el => el.dataset.component !== '')
        .map(comp => comp.dataset.component.split(','));
      compNames = [...new Set(names.flat())];
    } catch (e) {
      console.error(e);
    }

    return compNames;
  }

  async observeDomChanges() {
    const target = document.body;
    const config = { attributes: false, childList: true, subtree: true };
    const observer = new MutationObserver((mutationsList, observer) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
          if (mutation.target && [...mutation.addedNodes].length) {
            [...mutation.addedNodes].filter(el => typeof el.querySelectorAll === 'function').forEach((addedNode) => {
              if (this.async) {
                this.importAsyncComponents(addedNode);
              } else {
                this.importComponents(this.compsObj, addedNode);
              }
            });
          }

          if (mutation.target && [...mutation.removedNodes].length) {
            [...mutation.removedNodes].filter(el => typeof el.querySelectorAll === 'function').forEach((removedNodes) => {
              const components = removedNodes.querySelectorAll(this.componentSelector);
              [...components].forEach((comp) => {
                const COMP_ID = comp.UUID;
                if (COMP_ID && APP_COMPONENTS.has(COMP_ID)) {
                  const removedComp = APP_COMPONENTS.get(COMP_ID);
                  APP_COMPONENTS.delete(COMP_ID);
                  removedComp._destroy();
                }
              });
            });
          }
          // const newNodes = mutation.addedNodes;
        } else if (mutation.type === 'attributes') {
          console.log(
            'The ' + mutation.attributeName + ' attribute was modified.'
          );
        }
      }
    });

    observer.observe(target, config);
  }

  async importComponents(comps, target) {
    this.async = false;
    try {
      const components = this.getDomComponents(target);
      for (const compName of Object.keys(comps)) {
        const el = components.filter(elelemt => elelemt.dataset[this.compAttribute].split(',').includes(compName));
        if (el.length > 0) {
          el.forEach((compEl) => {
            try {
              const DynamicComponent = comps[compName];
              const UNIQUE_ID = uuid();
              compEl.UUID = UNIQUE_ID;
              const comp = new DynamicComponent(compEl);
              APP_COMPONENTS.set(UNIQUE_ID, comp);
            } catch (e) {
              console.error(e);
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async importAsyncComponents(target) {
    this.async = true;
    this.importEnded = false;
    try {
      const comps = {};
      const names = this.getNamesFromDom(target);
      const components = this.getDomComponents(target);

      if (!components) return;

      names.forEach((compName) => {
        comps[compName.trim()] = components.filter(el => el.dataset[this.compAttribute].split(',').includes(compName.trim()));
      });

      for (const [name, elements] of Object.entries(comps)) {
        let componentModule = this.importedComponents.get(name);
        if (!componentModule) {
          import(
            /* webpackChunkName: `component-[request]` */ `COMPONENTS/${name}.js`
          ).then((res) => {
            const DynamicComponent = res.default;
            this.importedComponents.set(name, DynamicComponent);
            elements.forEach((el) => {
              const UNIQUE_ID = uuid();
              el.UUID = UNIQUE_ID;
              const comp = new DynamicComponent(el);
              APP_COMPONENTS.set(UNIQUE_ID, comp);
            });
          });
        } else {
          elements.forEach((el) => {
            const UNIQUE_ID = uuid();
            el.UUID = UNIQUE_ID;
            const comp = new componentModule(el);
            APP_COMPONENTS.set(UNIQUE_ID, comp);
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    this.importEnded = true;
  }

  async createComponents(comps) {
    try {
      await this.importComponents(comps);
    } catch (e) {
      console.error(e);
    }
  }

  async createAsyncComponents(names) {
    try {
      await this.importAsyncComponents();
    } catch (e) {
      console.error(e);
    }
  }
}
