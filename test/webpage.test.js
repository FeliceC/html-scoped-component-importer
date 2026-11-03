const openDemoPage = fileName => page.goto(`${PATH}${fileName}`, { waitUntil: 'networkidle0' });

describe('demo overview', () => {
  test('loads an async component chunk on demand', async () => {
    await openDemoPage('index.html');
    const greeting = await page.$eval('[data-component="Greeting"]', element => element.textContent);
    expect(greeting).toContain('fetched on demand');
  });
});

describe('demo loading page', () => {
  beforeEach(() => openDemoPage('loading.html'));

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

  test('scans only the target subtree', async () => {
    await page.click('#inject-clocks');
    await page.waitForFunction(() => [...document.querySelectorAll('#scoped-box .clock')].every(clock => clock.textContent !== ''));
  });

  test('assigns a data-uuid to every component element', async () => {
    const everyElementHasUuid = await page.$$eval('[data-component], [data-sync-component]', elements => elements.every(element => element.dataset.uuid));
    expect(everyElementHasUuid).toBe(true);
  });
});

describe('demo event bus page', () => {
  beforeEach(() => openDemoPage('events.html'));

  test('queues events until the first listener connects, then delivers them', async () => {
    const productButtons = await page.$$('[data-component="ProductList"] button');
    await productButtons[0].click();
    await productButtons[1].click();
    expect(await page.$eval('#queue-count', element => element.textContent)).toBe('2');

    await page.click('#listener-toggle');
    await page.waitForFunction(() => document.querySelectorAll('.notifications li').length === 2);
    expect(await page.$eval('#queue-count', element => element.textContent)).toBe('0');
  });

  test('drops the oldest event beyond the queue limit', async () => {
    for (let clickIndex = 0; clickIndex < 4; clickIndex++) await page.click('#emit-tick');
    await page.waitForFunction(() => [...document.querySelectorAll('#limited-queue .queue-chip span')].map(chip => chip.textContent).join() === 'tick #2,tick #3,tick #4');
  });
});

describe('demo shared state page', () => {
  test('re-renders every subscriber with next and previous state', async () => {
    await openDemoPage('state.html');
    await page.click('[data-mood="party"]');
    const moodTexts = await page.$$eval('[data-component^="Mood"]', elements => elements.map(element => element.textContent));
    expect(moodTexts).toEqual(['🥳', 'Party time!', 'happy → party']);
  });
});
