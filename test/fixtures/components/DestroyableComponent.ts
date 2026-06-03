export default class DestroyableComponent {
  constructor(public element: HTMLElement) {
    element.dataset.initialized = 'true';
  }

  _destroy() {
    this.element.dataset.destroyed = 'true';
  }
}
