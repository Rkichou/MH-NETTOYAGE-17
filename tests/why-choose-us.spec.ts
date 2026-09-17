import { expect, test } from "@playwright/test";

for (const width of [1440, 1024, 768, 390, 320]) {
  test(`benefits comparison layout ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const section = page.locator('#pourquoi-nous');
    await section.locator('.comparison-frame').scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(4);
    await expect(section.getByRole('slider')).toHaveValue('50');
    for (const img of await section.locator('img').all()) await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const compare = await section.locator('figure').boundingBox();
    for (const item of await section.locator('.benefit-item').all()) {
      const box = await item.boundingBox();
      expect(box!.x + box!.width <= compare!.x + 1 || box!.x >= compare!.x + compare!.width - 1 || box!.y >= compare!.y + compare!.height).toBe(true);
      expect(await item.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
    await section.screenshot({ path: `test-results/why-${width}.png`, style: '.header, .scroll-progress, .skip-link, .mobile-fab, nextjs-portal { visibility: hidden !important; }' });
    expect(errors).toEqual([]);
  });
}

test('real before/after images, keyboard control and pair selection', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.locator('#pourquoi-nous');
  await section.scrollIntoViewIfNeeded();
  const slider = section.getByRole('slider');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('51');
  await page.keyboard.press('Home');
  await expect(slider).toHaveValue('0');
  await expect(section.locator('.comparison-after')).toHaveCSS('clip-path', 'inset(0px 0px 0px 0%)');
  await page.keyboard.press('End');
  await expect(slider).toHaveValue('100');
  await expect(section.locator('.comparison-after')).toHaveCSS('clip-path', 'inset(0px 0px 0px 100%)');
  const before = await section.locator('.comparison-frame').screenshot({ path: 'test-results/why-before.png' });
  await section.getByRole('button', { name: 'Après', exact: true }).click();
  await expect(slider).toHaveValue('0');
  const after = await section.locator('.comparison-frame').screenshot({ path: 'test-results/why-after.png' });
  expect(Buffer.compare(before, after)).not.toBe(0);
  await section.getByRole('button', { name: 'Comparer', exact: true }).click();
  await expect(slider).toHaveValue('50');
  await section.getByRole('tab', { name: 'Habitacle Audi' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(section.getByRole('tab', { name: 'Coffre BMW' })).toBeFocused();
  await expect(section.getByRole('tab', { name: 'Coffre BMW' })).toHaveAttribute('aria-selected', 'true');
  await expect(section.locator('img').first()).toHaveAttribute('src', /bmw-coffre-avant-nettoyage/);
  await expect(section.locator('.comparison-after img')).toHaveAttribute('src', /bmw-coffre-apres-nettoyage/);
  await expect(slider).toHaveValue('50');
  for (const image of await section.locator('img').all()) await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await section.locator('.why-booking a').click();
  await expect(page.locator('#rendez-vous')).toBeInViewport();
});

test('scroll reveals the clean photo, manual control takes priority and reduced motion stops automation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const frame = page.locator('.comparison-frame');
  const scroll = async (fraction: number) => {
    await frame.evaluate((element, value) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - window.innerHeight * value), fraction);
  };
  await scroll(.8);
  await expect.poll(async () => Number(await frame.getAttribute('data-position'))).toBeGreaterThan(70);
  await scroll(.1);
  await expect.poll(async () => Number(await frame.getAttribute('data-position'))).toBeLessThan(40);
  const slider = page.locator('#pourquoi-nous').getByRole('slider');
  await slider.fill('62');
  await scroll(.7);
  await page.waitForTimeout(900);
  await expect(slider).toHaveValue('62');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await scroll(.15);
  await expect(slider).toHaveValue('62');
});

test('touch-sized controls allow mobile before/after selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.locator('#pourquoi-nous');
  await section.getByRole('button', { name: 'Après', exact: true }).click();
  await expect(section.getByRole('slider')).toHaveValue('0');
  await section.getByRole('button', { name: 'Avant', exact: true }).click();
  await expect(section.getByRole('slider')).toHaveValue('100');
  await section.getByRole('slider').fill('45');
  await expect(section.locator('.comparison-divider')).toHaveCSS('left', '157.5px');
});

test('comparison responds to a horizontal touch gesture', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(process.env.TEST_URL || 'http://localhost:3107');
    const slider = page.locator('#pourquoi-nous').getByRole('slider');
    await slider.scrollIntoViewIfNeeded();
    const rect = await slider.boundingBox();
    const client = await context.newCDPSession(page);
    const y = rect!.y + rect!.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect!.x + rect!.width * .2, y }] });
    for (const progress of [.3, .4, .5, .6, .7, .8]) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: rect!.x + rect!.width * progress, y }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(65);
  } finally { await context.close(); }
});
