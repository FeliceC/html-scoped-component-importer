export default class FailingWidget {
  constructor(_element: HTMLElement) {
    throw new Error('FailingWidget could not reach its API');
  }
}
