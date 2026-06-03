// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { convertType, cleanOptionKey } from '../../example/src/utils/Utilities';

describe('convertType', () => {
  it("converts 'true' to boolean true", () => {
    expect(convertType('true')).toBe(true);
  });

  it("converts 'false' to boolean false", () => {
    expect(convertType('false')).toBe(false);
  });

  it("converts 'null' to null", () => {
    expect(convertType('null')).toBe(null);
  });

  it('returns string passthrough for unrecognized values', () => {
    expect(convertType('hello')).toBe('hello');
  });

  it("does not coerce numeric strings to numbers", () => {
    expect(convertType('0')).toBe('0');
    expect(convertType('42')).toBe('42');
  });
});

describe('cleanOptionKey', () => {
  it("strips 'option' prefix and lowercases first character", () => {
    expect(cleanOptionKey('optionFoo')).toBe('foo');
  });

  it('preserves camelCase after the first character', () => {
    expect(cleanOptionKey('optionMyKey')).toBe('myKey');
  });

  it('handles single-character suffix', () => {
    expect(cleanOptionKey('optionA')).toBe('a');
  });
});
