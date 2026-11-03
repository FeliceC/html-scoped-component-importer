import { events } from '../shared';

export default class NotificationCenter {
  private readonly unsubscribe: () => void;

  constructor(element: HTMLElement) {
    const list = document.createElement('ul');
    element.replaceChildren(list);
    this.unsubscribe = events.on<string>('notify', message => {
      const item = document.createElement('li');
      item.textContent = `🔔 ${message}`;
      list.prepend(item);
    });
  }

  _destroy() {
    this.unsubscribe();
  }
}
