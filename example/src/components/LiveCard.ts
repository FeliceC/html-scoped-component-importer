import type { ComponentDispatcher } from '../../../src/index';

let createdCardCount = 0;

export default class LiveCard {
  private readonly dispatcher: ComponentDispatcher;
  private readonly cardNumber: number;

  constructor(element: HTMLElement, dispatcher: ComponentDispatcher) {
    this.dispatcher = dispatcher;
    this.cardNumber = ++createdCardCount;
    element.textContent = `#${this.cardNumber}`;
    dispatcher.logger.info(`LiveCard #${this.cardNumber} mounted by the observer`);
  }

  _destroy() {
    this.dispatcher.logger.warn(`LiveCard #${this.cardNumber} removed → _destroy() called`);
  }
}
