export default class SecondComponent {
  constructor(public element: HTMLElement) {
    element.dataset.secondInitialized = 'true';
  }
}
