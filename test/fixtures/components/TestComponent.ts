export default class TestComponent {
  constructor(public element: HTMLElement) {
    element.dataset.initialized = 'true';
  }
}
