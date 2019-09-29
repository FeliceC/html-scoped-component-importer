export default class BaseComponent {
  get $el() {
    return this.componentElement;
  }

  constructor(element) {
    this.componentElement = element;
  }
}
