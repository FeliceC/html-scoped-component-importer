import { cleanOptionKey, convertType } from '../utils/Utilities';

export default class BaseComponent {
  componentElement: HTMLElement
  get $el() {
    return this.componentElement;
  }

  get $options() {
    const compOptions = {};
    const options = { ...this.$el.dataset };
    const optionsEntires = Object.keys(options).filter(entry => entry.includes('option'));
    optionsEntires.forEach((entry) => {
      const cleanEntry = cleanOptionKey(entry);
      let optionValue;
      if (options[entry].includes('{') && options[entry].includes('{')) {
        optionValue = JSON.parse(options[entry].replace(/'/g, '"'));
      } else {
        optionValue = convertType(options[entry]);
      }
      compOptions[cleanEntry] = optionValue;
    });
    return compOptions;
  }

  get COMPONENT_NAME() {
    return this.$el.dataset.component;
  }

  constructor(element: HTMLElement) {
    this.componentElement = element;
  }
}
