import "regenerator-runtime/runtime";
describe("web page", () => {
  beforeEach(async () => {
    await page.goto(PATH, { waitUntil: "load" });
  });
  test("should render dynamic component", async () => {
    await page.waitForSelector('[data-component]');
    const dynamicComponent = await page.evaluate(() => {
      return {
        innerHTML: document.querySelector("[data-component]").innerHTML,
        compName: document.querySelector("[data-component]").dataset.component
      };
    });
    expect(dynamicComponent).toBeDefined();
    expect(dynamicComponent.innerHTML).toBe(dynamicComponent.compName);
  });
});
