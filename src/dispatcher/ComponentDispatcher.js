import { v1 as uuid } from 'uuid';

const APP_COMPONENTS = new Map();

export default class ComponentsDispatcher {
  get APP_COMPONENTS() {
    return APP_COMPONENTS;
  }

  set Selector(selector) {
    this.componentSelector = selector || "[data-component]";
  }

  get compAttribute() {
    return this.componentSelector
      .replace("data-", "")
      .replace("[", "")
      .replace("]", "");
  }

  constructor() {
    this.componentSelector = "[data-component]";
    this.domComponents = null;
    this.componentsNames = null;
    this.compsObj = null;
    this.importedComponents = new Map();
  }

  getDomComponents(parent) {
    let domComponents = [];
    const target = parent || document.body;
    try {
      domComponents = [...target.querySelectorAll(this.componentSelector)]
        .filter((el) => !el.UUID)
        .map((el) => {
          el.UUID = uuid();
          return el;
        })
        .reverse();
    } catch (e) {
      console.error(e);
    }
    return domComponents;
  }

  getNames(components) {
    let compNames;
    try {
      const names = components
        .filter((el) => el.dataset.component !== "")
        .map((comp) => comp.dataset.component.split(","));
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
        if (mutation.type === "childList") {
          if (mutation.target && [...mutation.addedNodes].length) {
            [...mutation.addedNodes]
              .filter((el) => typeof el.querySelectorAll === "function")
              .forEach((addedNode) => {
                if (this.async) {
                  this.importAsyncComponents(addedNode);
                } else {
                  this.importComponents(this.compsObj, addedNode);
                }
              });
          }

          if (mutation.target && [...mutation.removedNodes].length) {
            [...mutation.removedNodes]
              .filter((el) => typeof el.querySelectorAll === "function")
              .forEach((removedNodes) => {
                const components = removedNodes.querySelectorAll(
                  this.componentSelector
                );
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
        } else if (mutation.type === "attributes") {
          console.log(
            "The " + mutation.attributeName + " attribute was modified."
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
        const el = components.filter((elelemt) =>
          elelemt.dataset[this.compAttribute].split(",").includes(compName)
        );
        if (el.length > 0) {
          el.forEach((compEl) => {
            try {
              const DynamicComponent = comps[compName];
              const comp = new DynamicComponent(compEl);
              APP_COMPONENTS.set(compEl.UUID, comp);
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
      const components = this.getDomComponents(target);
      const names = this.getNames(components);

      if (components.length === 0) return;

      names.forEach((compName) => {
        components
          .filter((el) =>
            el.dataset[this.compAttribute].split(",").includes(compName.trim())
          )
          .forEach(async (el) => {
            try {
              let componentModule = this.importedComponents.get(compName);
              if (!componentModule) {
                const res = await import(
                  /* webpackChunkName: `component-[request]` */ `COMPONENTS/${compName}.js`
                );
                const DynamicComponent = res.default;
                this.importedComponents.set(compName, DynamicComponent);
                const comp = new DynamicComponent(el);
                APP_COMPONENTS.set(el.UUID, comp);
              } else {
                const comp = new componentModule(el);
                APP_COMPONENTS.set(el.UUID, comp);
              }
            } catch (e) {
              console.error(
                `[${compName}] initialization error on el =>`,
                el,
                "with error =>",
                e
              );
            }
          });
      });
    } catch (e) {
      console.error("async importAsyncComponents(target) => ", e);
      this.importEnded = false;
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
