import { describe, it, expect, beforeEach } from 'vitest';
import BaseComponent from '../../example/src/abstracts/BaseComponent';

describe('BaseComponent', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    element.dataset.component = 'TestComponent';
  });

  describe('$el', () => {
    it('returns the element passed to constructor', () => {
      const component = new BaseComponent(element);
      expect(component.$el).toBe(element);
    });
  });

  describe('COMPONENT_NAME', () => {
    it('returns the data-component attribute value', () => {
      const component = new BaseComponent(element);
      expect(component.COMPONENT_NAME).toBe('TestComponent');
    });

    it("returns empty string when data-component is absent", () => {
      const bare = document.createElement('div');
      const component = new BaseComponent(bare);
      expect(component.COMPONENT_NAME).toBe('');
    });
  });

  describe('$options', () => {
    it('returns an empty object when no option attributes are set', () => {
      const component = new BaseComponent(element);
      expect(component.$options).toEqual({});
    });

    it('returns string value for a plain string option', () => {
      element.dataset.optionColor = 'red';
      const component = new BaseComponent(element);
      expect(component.$options).toEqual({ color: 'red' });
    });

    it("converts option value 'true' to boolean true", () => {
      element.dataset.optionEnabled = 'true';
      const component = new BaseComponent(element);
      expect(component.$options.enabled).toBe(true);
    });

    it("converts option value 'false' to boolean false", () => {
      element.dataset.optionEnabled = 'false';
      const component = new BaseComponent(element);
      expect(component.$options.enabled).toBe(false);
    });

    it("converts option value 'null' to null", () => {
      element.dataset.optionValue = 'null';
      const component = new BaseComponent(element);
      expect(component.$options.value).toBe(null);
    });

    it("parses JSON-like object string using single-quote notation", () => {
      element.dataset.optionConfig = "{'key': 'val'}";
      const component = new BaseComponent(element);
      expect(component.$options.config).toEqual({ key: 'val' });
    });

    it('ignores dataset keys that do not include "option"', () => {
      element.dataset.component = 'MyComponent';
      element.dataset.uuid = 'some-uuid';
      element.dataset.optionFoo = 'bar';
      const component = new BaseComponent(element);
      expect(Object.keys(component.$options)).toEqual(['foo']);
    });

    it('returns all option keys when multiple options are set', () => {
      element.dataset.optionFoo = 'bar';
      element.dataset.optionBaz = 'qux';
      const component = new BaseComponent(element);
      expect(component.$options).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('throws SyntaxError for a malformed JSON-like string', () => {
      element.dataset.optionConfig = '{broken json}';
      const component = new BaseComponent(element);
      expect(() => component.$options).toThrow(SyntaxError);
    });
  });
});
