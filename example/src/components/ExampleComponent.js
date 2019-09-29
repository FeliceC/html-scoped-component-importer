import BaseComponent from "../abstracts/BaseComponent";

export default class ExampleComponent extends BaseComponent {
  constructor(element) {
    super(element);
    this.$el.innerHTML = 'example component 1';
  }
}
