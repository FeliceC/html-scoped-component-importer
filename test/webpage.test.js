import "regenerator-runtime/runtime";
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
});
