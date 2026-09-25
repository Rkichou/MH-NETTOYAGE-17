import { test, expect } from "@playwright/test";

for (const width of [360, 768, 1440]) {
  test(`prestations layout and booking at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const section = page.locator("#services");
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator("article")).toHaveCount(5);
    for (const card of await section.locator("article").all()) {
      await card.scrollIntoViewIfNeeded();
      await expect.poll(() => card.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      const box = await card.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth + 2)).toBe(true);
    }
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: `test-results/prestations-${width}.png` });
    for (const link of await section.locator("h3 a").all()) {
      const name = await link.getAttribute("aria-label");
      await link.click();
      await expect(page.locator('#rendez-vous input[name="service"]')).toHaveValue(name!);
    }
    await expect(section.locator(".prestation-card").first()).toHaveCSS("transition-duration", "0s");
  });
}

test("prestations hover and keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const card = page.locator(".prestation-card").first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect.poll(() => card.locator("img").evaluate(el => getComputedStyle(el).transform)).not.toBe("none");
  await card.locator("a").focus();
  await expect(card).toHaveCSS("outline-style", "solid");
});
