import { expect, test } from "@playwright/test";
import sharp from "sharp";

for (const width of [1440, 390, 360]) {
  test(`3D is framed, nonblank and static with reduced motion at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator('.car-wash-visual')).toHaveAttribute('data-ready', 'true');
    const canvas = page.locator('.car-wash-canvas canvas');
    await expect(page.locator('.car-wash-canvas')).toHaveAttribute('data-phase', 'clean');
    const buffer = await canvas.screenshot({ path: `test-results/car-${width}.png` });
    const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let dark = 0;
    for (let i = 0; i < data.length; i += info.channels) if (data[i] < 120 && data[i + 1] < 120 && data[i + 2] < 120) dark++;
    expect(dark / (info.width * info.height)).toBeGreaterThan(.015);
    const frame = await canvas.getAttribute('data-frame');
    await page.waitForTimeout(400);
    expect(await canvas.getAttribute('data-frame')).toBe(frame);
    await page.screenshot({ path: `test-results/hero-3d-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const copy = await page.locator('.detailing-copy').boundingBox();
    const visual = await page.locator('.car-wash-visual').boundingBox();
    if (width < 800) expect(visual!.y).toBeGreaterThan(copy!.y + copy!.height - 3);
    else expect(visual!.x).toBeGreaterThan(copy!.x + copy!.width - 40);
    expect(errors).toEqual([]);
  });
}

test('wash cycle, cursor, pause and offscreen suspension', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('.car-wash-visual')).toHaveAttribute('data-ready', 'true');
  const host = page.locator('.car-wash-canvas');
  const canvas = host.locator('canvas');
  const clean = await canvas.screenshot();
  const rect = await host.boundingBox();
  await page.mouse.move(rect!.x + rect!.width * .8, rect!.y + rect!.height * .5);
  await expect.poll(async () => Number(await canvas.getAttribute('data-rotation'))).toBeGreaterThan(.01);
  await expect(host).toHaveAttribute('data-phase', 'foam', { timeout: 20000 });
  await page.waitForTimeout(3000);
  const foam = await canvas.screenshot({ path: 'test-results/car-foam.png' });
  expect(Buffer.compare(clean, foam)).not.toBe(0);
  const cleanStats = await sharp(clean).stats();
  const foamStats = await sharp(foam).stats();
  expect(foamStats.channels[0].mean - cleanStats.channels[0].mean).toBeGreaterThan(3);
  await page.getByRole('button', { name: /en pause/ }).click();
  await expect(host).toHaveAttribute('data-motion-state', 'paused');
  await page.waitForTimeout(100);
  const paused = await canvas.getAttribute('data-frame');
  await page.waitForTimeout(400);
  expect(await canvas.getAttribute('data-frame')).toBe(paused);
  await page.getByRole('button', { name: /Reprendre/ }).click();
  await expect(host).toHaveAttribute('data-phase', 'rinse', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await canvas.screenshot({ path: 'test-results/car-rinse.png' });
  await expect(host).toHaveAttribute('data-phase', 'shine', { timeout: 20000 });
  await canvas.screenshot({ path: 'test-results/car-shine.png' });
  await expect(host).toHaveAttribute('data-phase', 'clean', { timeout: 20000 });
  await page.locator('#services').scrollIntoViewIfNeeded();
  await expect(host).toHaveAttribute('data-motion-state', 'paused');
  const hidden = await canvas.getAttribute('data-frame');
  await page.waitForTimeout(400);
  expect(await canvas.getAttribute('data-frame')).toBe(hidden);
  await page.locator('header a[href="#accueil"]').click();
  await expect(host).toHaveAttribute('data-motion-state', 'running');
});

for (const failure of ['webgl', 'asset', 'context']) {
  test(`photo fallback when ${failure} fails`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    if (failure === 'webgl') await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
        if (String(args[0]) === 'webgl2') return null;
        return original.apply(this, args);
      } as typeof original;
    });
    if (failure === 'asset') await page.route('**/models/detailing-car.glb', route => route.abort());
    await page.goto('/');
    if (failure === 'context') {
      await expect(page.locator('.car-wash-visual')).toHaveAttribute('data-ready', 'true');
      await page.locator('.car-wash-canvas canvas').evaluate((element: HTMLCanvasElement) => element.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
    }
    await expect(page.locator('.car-wash-visual')).toHaveAttribute('data-ready', 'false');
    await expect(page.locator('.car-wash-visual')).toHaveAttribute('data-state', 'fallback');
    await expect(page.locator('.car-wash-fallback img')).toBeVisible();
    await expect.poll(() => page.locator('.car-wash-fallback img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(page.locator('.hero-primary')).toHaveAttribute('href', '#rendez-vous');
    await expect(page.locator('.detailing-secondary')).toHaveAttribute('href', '#services');
  });
}
