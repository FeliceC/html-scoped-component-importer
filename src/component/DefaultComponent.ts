export default class DefaultComponent {
  private componentElement: Element
  get $el() {
    return this.componentElement;
  }

  constructor(element) {
    this.componentElement = element
  }
}
