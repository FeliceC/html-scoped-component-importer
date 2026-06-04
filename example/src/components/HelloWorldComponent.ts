import BaseComponent from '../abstracts/BaseComponent';

export default class HelloWorldComponent extends BaseComponent {
  constructor(element: HTMLElement) {
    super(element);
    this.$el.innerHTML = this.COMPONENT_NAME;
  }
}
