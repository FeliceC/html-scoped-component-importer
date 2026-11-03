import { describe, it, expect, afterEach } from 'vitest';
import isDevelopmentBuild from '../../src/environment/isDevelopmentBuild';

describe('isDevelopmentBuild', () => {
  const originalNodeEnvironment = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnvironment;
  });

  it('is true only for the development build', () => {
    process.env.NODE_ENV = 'development';
    expect(isDevelopmentBuild()).toBe(true);

    process.env.NODE_ENV = 'production';
    expect(isDevelopmentBuild()).toBe(false);
  });

  it('fails closed when process is not defined', () => {
    const originalProcess = globalThis.process;
    // @ts-expect-error simulates a browser bundle where process.env.NODE_ENV was not replaced
    delete globalThis.process;
    try {
      expect(isDevelopmentBuild()).toBe(false);
    } finally {
      globalThis.process = originalProcess;
    }
  });
});
