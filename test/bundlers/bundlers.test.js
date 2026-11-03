const express = require('express');
const path = require('path');

const BUNDLER_NAMES = ['webpack', 'vite', 'esbuild', 'rollup'];

const servers = {};

beforeAll(async () => {
  for (let bundlerName of BUNDLER_NAMES) {
    let app = express();
    app.use(express.static(path.resolve(__dirname, `dist/${bundlerName}`)));
    await new Promise(resolve => {
      servers[bundlerName] = app.listen(0, resolve);
    });
  }
});

afterAll(async () => {
  await Promise.all(
    Object.values(servers).map(server => new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections();
    }))
  );
});

for (let bundlerName of BUNDLER_NAMES) {
  describe(`${bundlerName} bundler`, () => {
    let pageErrors;

    beforeEach(async () => {
      pageErrors = [];
      page.removeAllListeners('pageerror');
      page.on('pageerror', pageError => pageErrors.push(pageError.message));
      await page.goto(`http://localhost:${servers[bundlerName].address().port}/`, { waitUntil: 'networkidle0' });
    });

    test('initializes BundlerTestComponent via sync registry', async () => {
      await page.waitForFunction(
        () => document.querySelector('[data-component="BundlerTestComponent"]')?.dataset.initialized === 'true',
        { timeout: 5000 }
      );

      const result = await page.evaluate(() => {
        const element = document.querySelector('[data-component="BundlerTestComponent"]');
        return { initialized: element?.dataset.initialized, hasUuid: Boolean(element?.dataset.uuid) };
      });

      expect(result.initialized).toBe('true');
      expect(result.hasUuid).toBe(true);
    });

    test('initializes AsyncBundlerComponent through the bundler-specific loader', async () => {
      await page.waitForFunction(
        () => document.querySelector('[data-async-component="AsyncBundlerComponent"]')?.dataset.initialized === 'true',
        { timeout: 5000 }
      );
    });

    test('handles a throwing component without uncaught page errors', async () => {
      expect(pageErrors).toEqual([]);
    });
  });
}
