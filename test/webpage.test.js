describe('demo page', () => {
  beforeEach(async () => {
    await page.goto(PATH, { waitUntil: 'networkidle0' });
  });

  test('loads an async component chunk on demand', async () => {
    const greeting = await page.$eval('[data-component="Greeting"]', element => element.textContent);
    expect(greeting).toContain('fetched on demand');
  });

  test('initializes a sync component bound to a custom multi-word attribute', async () => {
    await page.waitForFunction(() => document.querySelector('[data-sync-component="Clock"]').textContent !== '');
  });

  test('mounts and destroys components added and removed after page load', async () => {
    await page.click('#add-card');
    await page.click('#add-card');
    await page.waitForFunction(() => document.querySelectorAll('.live-card[data-uuid]').length === 2);
    await page.click('#remove-card');
    await page.waitForFunction(() => [...document.querySelectorAll('#log-list li')].some(item => item.textContent.includes('_destroy() called')));
  });

  test('queues events until the first listener mounts, then delivers them', async () => {
    const productButtons = await page.$$('[data-component="ProductList"] button');
    await productButtons[0].click();
    await productButtons[1].click();
    expect(await page.$eval('#queue-count', element => element.textContent)).toBe('2');
    expect(await page.$eval('[data-component="CartBadge"]', element => element.textContent)).toContain('2 item(s)');

    await page.click('#mount-notifications');
    await page.waitForFunction(() => document.querySelectorAll('.notifications li').length === 2);
    expect(await page.$eval('#queue-count', element => element.textContent)).toBe('0');
  });

  test('assigns a data-uuid to every component element', async () => {
    const everyElementHasUuid = await page.$$eval('[data-component], [data-sync-component]', elements => elements.every(element => element.dataset.uuid));
    expect(everyElementHasUuid).toBe(true);
  });
});
