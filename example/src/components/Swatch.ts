import { events } from '../shared';

export default class Swatch {
  private readonly unsubscribe: () => void;

  constructor(element: HTMLElement) {
    this.unsubscribe = events.on<string>('theme:accent', colour => {
      element.style.background = colour;
      element.classList.add('is-bumped');
      window.setTimeout(() => element.classList.remove('is-bumped'), 300);
    });
  }

  _destroy() {
    this.unsubscribe();
  }
}
