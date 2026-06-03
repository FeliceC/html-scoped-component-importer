export default class FailingComponent {
  constructor(_element: HTMLElement) {
    throw new Error('FailingComponent initialization error');
  }
}
