import { ComponentDispatcher } from '../src/index';

const INITIAL_ELEMENT_COUNT = 10_000;
const OBSERVED_ELEMENT_COUNT = 5_000;

function createComponentRegistry(componentTypeCount: number): Record<string, new (element: HTMLElement) => object> {
  const registry: Record<string, new (element: HTMLElement) => object> = {};
  for (let typeIndex = 0; typeIndex < componentTypeCount; typeIndex++) {
    registry[`Component${typeIndex}`] = class {
      constructor(element: HTMLElement) {
        element.dataset.initialized = 'true';
      }

      _destroy() {}
    };
  }
  return registry;
}

let componentRegistry = createComponentRegistry(20);
let componentNames = Object.keys(componentRegistry);

function useComponentTypeCount(componentTypeCount: number): void {
  componentRegistry = createComponentRegistry(componentTypeCount);
  componentNames = Object.keys(componentRegistry);
}

function createComponentElement(elementIndex: number): HTMLElement {
  const element = document.createElement('div');
  const primaryName = componentNames[elementIndex % componentNames.length];
  const isMultiComponent = elementIndex % 10 === 0;
  element.dataset.component = isMultiComponent
    ? `${primaryName},${componentNames[(elementIndex + 1) % componentNames.length]}`
    : primaryName;
  return element;
}

function fillStage(stage: HTMLElement, elementCount: number): void {
  const fragment = document.createDocumentFragment();
  for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
    fragment.append(createComponentElement(elementIndex));
  }
  stage.replaceChildren(fragment);
}

function nextMacrotask(): Promise<void> {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(null);
  });
}

function waitForInstanceCount(dispatcher: ComponentDispatcher, expectedCount: number, comparison: 'atLeast' | 'atMost'): Promise<void> {
  return new Promise(resolve => {
    const check = () => {
      const instanceCount = dispatcher.APP_COMPONENTS.size;
      const isReached = comparison === 'atLeast' ? instanceCount >= expectedCount : instanceCount <= expectedCount;
      if (isReached) resolve();
      else nextMacrotask().then(check);
    };
    check();
  });
}

const scenarios: Record<string, () => Promise<number>> = {
  async initialScan() {
    useComponentTypeCount(20);
    const stage = document.getElementById('stage')!;
    fillStage(stage, INITIAL_ELEMENT_COUNT);
    const dispatcher = new ComponentDispatcher();
    const startTime = performance.now();
    await dispatcher.importComponents(componentRegistry);
    return performance.now() - startTime;
  },

  async initialScanManyTypes() {
    useComponentTypeCount(100);
    const stage = document.getElementById('stage')!;
    fillStage(stage, INITIAL_ELEMENT_COUNT);
    const dispatcher = new ComponentDispatcher();
    const startTime = performance.now();
    await dispatcher.importComponents(componentRegistry);
    return performance.now() - startTime;
  },

  async observedAppend() {
    useComponentTypeCount(20);
    const stage = document.getElementById('stage')!;
    stage.replaceChildren();
    const dispatcher = new ComponentDispatcher();
    await dispatcher.importComponents(componentRegistry);
    const stopObserving = dispatcher.observeDomChanges();
    const startTime = performance.now();
    for (let elementIndex = 0; elementIndex < OBSERVED_ELEMENT_COUNT; elementIndex++) {
      const wrapper = document.createElement('div');
      wrapper.append(createComponentElement(elementIndex));
      stage.append(wrapper);
    }
    await waitForInstanceCount(dispatcher, OBSERVED_ELEMENT_COUNT, 'atLeast');
    const elapsed = performance.now() - startTime;
    stopObserving();
    return elapsed;
  },

  async observedRemove() {
    useComponentTypeCount(20);
    const stage = document.getElementById('stage')!;
    const wrappers = Array.from({ length: OBSERVED_ELEMENT_COUNT }, (_, elementIndex) => {
      const wrapper = document.createElement('div');
      wrapper.append(createComponentElement(elementIndex));
      return wrapper;
    });
    stage.replaceChildren(...wrappers);
    const dispatcher = new ComponentDispatcher();
    await dispatcher.importComponents(componentRegistry);
    const stopObserving = dispatcher.observeDomChanges();
    const startTime = performance.now();
    for (let wrapper of wrappers) wrapper.remove();
    await waitForInstanceCount(dispatcher, 0, 'atMost');
    const elapsed = performance.now() - startTime;
    stopObserving();
    return elapsed;
  }
};

declare global {
  interface Window {
    runBenchmarkScenario: (scenarioName: string) => Promise<number>;
  }
}

window.runBenchmarkScenario = scenarioName => scenarios[scenarioName]();
