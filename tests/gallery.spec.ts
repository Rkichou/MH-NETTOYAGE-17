import { expect, test } from "@playwright/test";

test('gallery hydrates consistently on initial load and reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat|server rendered|server-rendered|didn.t match|Minified React error #(418|419|421|422|423|425)/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  for (const reload of [false, true]) {
    if (reload) await page.reload(); else await page.goto('/');
    const gallery = page.locator('#galerie');
    await expect(gallery.locator('.gallery-photo').first()).toHaveAttribute('data-photo-index', '0');
    await expect(gallery.locator('.gallery-photo img').first()).toHaveAttribute('src', /volkswagen-golf-apres-lavage-vue-avant/);
    await gallery.getByRole('button', { name: 'Finitions', exact: true }).click();
    await expect(gallery.locator('.gallery-photo')).toHaveCount(2);
    expect(errors).toEqual([]);
  }
});

for (const [width, height] of [[1920,1080], [1440,1000], [1024,768], [768,1024], [390,844], [320,740], [844,390]]) {
  test(`gallery layout ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    const gallery = page.locator('#galerie');
    await gallery.scrollIntoViewIfNeeded();
    await expect(gallery.getByRole('heading', { name: 'Nos réalisations' })).toBeVisible();
    const center = gallery.locator('[data-active="true"]');
    await expect.poll(() => center.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const bounds = await center.boundingBox();
    expect(Math.abs(bounds!.x + bounds!.width / 2 - width / 2)).toBeLessThan(2);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const fan = await gallery.locator('.gallery-fan').boundingBox();
    const caption = await gallery.locator('.gallery-caption').boundingBox();
    expect(caption!.y).toBeGreaterThanOrEqual(fan!.y + fan!.height);
    for (const filter of await gallery.locator('.gallery-filters button').all()) {
      expect(await filter.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    }
    await gallery.screenshot({ path: `test-results/gallery-${width}x${height}.png`, style: '.header,.scroll-progress,.skip-link,.mobile-fab,nextjs-portal{visibility:hidden!important}' });
    expect(errors).toEqual([]);
  });
}

test('gallery filters, carousel keyboard, lightbox and focus restoration', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const gallery = page.locator('#galerie');
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery.locator('.gallery-photo')).toHaveCount(8);
  await gallery.getByRole('button', { name: 'Photo suivante', exact: true }).click();
  await expect(gallery.locator('.gallery-caption h3')).toContainText('Audi A5');
  await gallery.locator('[data-active="true"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(gallery.locator('[data-active="true"]')).toBeFocused();
  await expect(gallery.locator('.gallery-caption h3')).toContainText('jantes');
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toContainText('mousse');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(gallery.locator('[data-active="true"]')).toBeFocused();
  for (const [category, count] of [['Lavage extérieur',3], ['Nettoyage intérieur',3], ['Finitions',2]] as const) {
    await gallery.getByRole('button', { name: category, exact: true }).click();
    await expect(gallery.locator('.gallery-photo')).toHaveCount(count);
    await expect(gallery.locator('.gallery-caption p')).toHaveText(category);
    await expect(gallery.locator('.gallery-dots button').first()).toHaveAttribute('aria-current', 'true');
  }
  await gallery.getByRole('button', { name: 'Photo précédente', exact: true }).click();
  await expect(gallery.locator('.gallery-caption h3')).toContainText('finitions');
  await gallery.getByRole('link', { name: 'Voir les avant / après' }).click();
  await expect(page.locator('#pourquoi-nous')).toBeInViewport();
});

test('gallery scroll reveal, hover and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const fan = page.locator('.gallery-fan');
  await page.evaluate(() => {
    const el = document.querySelector('.gallery-deck')!;
    window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .85, behavior: 'instant' });
  });
  await expect.poll(() => fan.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.7);
  await page.evaluate(() => {
    const el = document.querySelector('.gallery-deck')!;
    window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .3, behavior: 'instant' });
  });
  await expect.poll(() => fan.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  const center = fan.locator('[data-active="true"]');
  await center.hover();
  await expect.poll(() => center.locator('.gallery-photo-overlay').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await expect.poll(() => center.locator('img').evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect.poll(() => fan.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  expect(await center.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  expect(await center.locator('img').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});

test('gallery swipes horizontally on touch and opens the full image', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(process.env.TEST_URL || 'http://localhost:3107');
    const photo = page.locator('.gallery-photo[data-active="true"]');
    await photo.scrollIntoViewIfNeeded();
    const bounds = (await photo.boundingBox())!;
    const client = await context.newCDPSession(page);
    const y = bounds.y + bounds.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 270, y }] });
    for (const x of [250,220,190,160,130]) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('.gallery-caption h3')).toContainText('Audi A5');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await photo.tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Fermer', exact: true }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  } finally { await context.close(); }
});
