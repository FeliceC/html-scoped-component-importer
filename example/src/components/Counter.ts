import BaseComponent from '../abstracts/BaseComponent';

export default class Counter extends BaseComponent {
  private value: number;

  constructor(element: HTMLElement) {
    super(element);
    const step = Number(this.$options.step ?? 1);
    this.value = Number(this.$options.start ?? 0);

    const output = document.createElement('output');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `+${step}`;
    button.addEventListener('click', () => {
      this.value += step;
      output.textContent = String(this.value);
    });
    output.textContent = String(this.value);
    this.$el.replaceChildren(output, button);
  }
}
