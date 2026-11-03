import type { ComponentDispatcher } from '../../../src/index';

export default class Greeting {
  constructor(element: HTMLElement, dispatcher: ComponentDispatcher) {
    const loadedAt = new Date().toLocaleTimeString();
    element.innerHTML = `<strong>Hello!</strong> This component's chunk was fetched on demand at <time>${loadedAt}</time>.`;
    dispatcher.logger.info('Greeting chunk loaded and mounted');
  }
}
