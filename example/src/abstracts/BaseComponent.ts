import { cleanOptionKey, convertType } from '../utils/Utilities';

export default class BaseComponent {
  componentElement: HTMLElement;
  get $el() {
    return this.componentElement;
  }

  get $options(): Record<string, unknown> {
    const compOptions: Record<string, unknown> = {};
    const options = { ...this.$el.dataset };
    const optionsEntires = Object.keys(options).filter(entry => entry.includes('option'));
    optionsEntires.forEach(entry => {
      const cleanEntry = cleanOptionKey(entry);
      const rawValue = options[entry];
      if (typeof rawValue !== 'string') {
        return;
      }
      let optionValue;
      if (rawValue.includes('{') && rawValue.includes('}')) {
        optionValue = JSON.parse(rawValue.replace(/'/g, '"'));
      } else {
        optionValue = convertType(rawValue);
      }
      compOptions[cleanEntry] = optionValue;
    });
    return compOptions;
  }

  get COMPONENT_NAME() {
    return this.$el.dataset.component ?? '';
  }

  constructor(element: HTMLElement) {
    this.componentElement = element;
  }
}
