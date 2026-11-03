export default class FailingBundlerComponent {
  constructor(_element: HTMLElement) {
    throw new Error('FailingBundlerComponent initialization error');
  }
}
