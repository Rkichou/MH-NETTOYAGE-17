import { expect, test } from "@playwright/test";

for (const [width, height] of [[1920,1080], [1440,1000], [1024,768], [768,1024], [540,900], [390,844], [360,800], [320,740]]) {
  test(`editorial hero photo and layout ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    const modelRequests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/\.glb|meshopt|car-wash-scene/.test(request.url())) modelRequests.push(request.url()); });
    await page.goto('/');
    const hero = page.locator('.hero-editorial');
    const photo = hero.locator('img');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Redonnez tout son éclat à votre voiture.');
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(hero.locator('canvas')).toHaveCount(0);
    await expect(hero.locator('.hero-primary')).toBeInViewport();
    await expect(hero.locator('.hero-primary')).toHaveAttribute('href', '#rendez-vous');
    await expect(hero.locator('.editorial-secondary')).toHaveAttribute('href', '#services');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const bounds = await hero.boundingBox();
    expect(bounds!.height).toBeLessThan(height);
    const word = hero.locator('.editorial-word');
    expect(await word.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const imageBounds = await photo.boundingBox();
    const bottom = await hero.locator('.editorial-bottom').boundingBox();
    // The visible car ends before the action row, even allowing for transparent margins.
    expect(imageBounds!.y + imageBounds!.height * .93).toBeLessThan(bottom!.y + 1);
    if (width <= 900) {
      const ending = await hero.locator('.editorial-ending').boundingBox();
      expect(imageBounds!.y + imageBounds!.height * .93).toBeLessThan(ending!.y + 1);
    }
    await page.screenshot({ path: `test-results/hero-photo-${width}.png` });
    expect(errors).toEqual([]);
    expect(modelRequests).toEqual([]);
  });
}

test('hero CTAs reach existing services and appointment form', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.editorial-secondary').click();
  await expect(page.locator('#services')).toBeInViewport();
  await page.locator('header a[href="#accueil"]').click();
  await page.locator('.hero-editorial .hero-primary').click();
  await expect(page.locator('#rendez-vous')).toBeInViewport();
});

test('intro animations finish and respect the motion preference', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  const photo = page.locator('.editorial-car img');
  await expect.poll(() => photo.evaluate(el => el.getAnimations().every(animation => animation.playState === 'finished'))).toBe(true);
  await expect.poll(() => photo.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  expect(await photo.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await expect(page.locator('.hero-editorial .hero-primary')).toBeVisible();
});
