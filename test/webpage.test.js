describe("web page", () => {
  beforeEach(async () => {
    await page.goto(PATH, { waitUntil: "load" });
  });
  test("should render dynamic component", async () => {
    await page.waitForSelector('[data-component]');
    const dynamicComponent = await page.evaluate(() => {
      return {
        innerHTML: document.querySelector('[data-component="HelloWorldComponent"]').innerHTML,
        compName: document.querySelector('[data-component="HelloWorldComponent"]').dataset.component
      }
    });

    expect(dynamicComponent).toBeDefined();
    expect(dynamicComponent.innerHTML).toBe(dynamicComponent.compName);
    console.table(dynamicComponent);
  });
  test("should render typescript dynamic component", async () => {
    await page.waitForSelector('[data-component]');
    const dynamicComponent = await page.evaluate(() => {
      return {
        innerHTML: document.querySelector('[data-component="HelloWorldTSComponent"]').innerHTML,
        compName: document.querySelector('[data-component="HelloWorldTSComponent"]').dataset.component
      };
    });

    expect(dynamicComponent).toBeDefined();
    expect(dynamicComponent.innerHTML).toBe(dynamicComponent.compName);
    console.table(dynamicComponent);
  });

  test("should initialize component injected dynamically after page load", async () => {
    // Wrap in container: MutationObserver passes the added node to importAsyncComponents,
    // which calls querySelectorAll on it (descendants only, not the node itself).
    await page.evaluate(() => {
      const container = document.createElement('div');
      const el = document.createElement('div');
      el.setAttribute('data-component', 'HelloWorldComponent');
      container.appendChild(el);
      document.body.appendChild(container);
    });

    await page.waitForFunction(() => {
      const all = document.querySelectorAll('[data-component="HelloWorldComponent"]');
      return Array.from(all).filter(el => el.dataset.uuid).length >= 2;
    }, { timeout: 5000 });

    const initializedCount = await page.evaluate(() => {
      const all = document.querySelectorAll('[data-component="HelloWorldComponent"]');
      return Array.from(all).filter(el => el.dataset.uuid).length;
    });

    expect(initializedCount).toBeGreaterThanOrEqual(2);
  });

  test("should assign data-uuid to all initialized components", async () => {
    await page.waitForSelector('[data-component]');

    const allHaveUuid = await page.evaluate(() => {
      const all = document.querySelectorAll('[data-component]');
      return Array.from(all).every(el => el.dataset.uuid);
    });

    expect(allHaveUuid).toBe(true);
  });
});
