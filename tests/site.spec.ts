import { expect, test } from "@playwright/test";
import { emptyAppointment, parisToday, validateAppointment } from "../lib/appointments";

test("validation: professional service, impossible dates, malformed inputs", () => {
  const valid = { ...emptyAppointment, service: "Solutions professionnelles", vehicle: "Berline", date: parisToday(), time: "Matin", name: "Client Test", phone: "0612345678", email: "test@example.com", consent: true };
  expect(validateAppointment(valid)).toEqual({});
  expect(validateAppointment({ ...valid, date: "2027-02-30" })).toHaveProperty("date");
  expect(validateAppointment({ ...valid, date: "2001-01-01" })).toHaveProperty("date");
  expect(validateAppointment({ ...valid, phone: "........" })).toHaveProperty("phone");
  expect(validateAppointment({ ...valid, consent: false })).toHaveProperty("consent");
});

for (const [width, height] of [[1440,1000], [1024,768], [768,1024], [390,844], [360,800]]) {
  test(`layout and images ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".hero-primary").first()).toBeVisible();
    await page.screenshot({ path: `test-results/hero-${width}.png` });
    for (const id of ["studio", "services", "methode", "details", "rendez-vous", "contact"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    expect(await page.locator('a[href^="#"]').evaluateAll((links) => links.every((link) => !!document.getElementById(link.getAttribute("href")!.slice(1))))).toBe(true);
    for (const img of await page.locator("main img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    }
    expect(errors).toEqual([]);
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: `test-results/page-${width}.png`, fullPage: true });
    }
  });
}

test("desktop pinning reverses, motion switch restores normal flow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".hero")).toHaveClass(/scene-pinned/);
  await page.evaluate(() => window.scrollTo(0, 1400));
  await expect.poll(() => page.locator(".hero-second").evaluate((e) => Number(getComputedStyle(e).opacity))).toBeGreaterThan(.9);
  await page.screenshot({ path: "test-results/hero-second.png" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.locator(".hero-copy-v2").evaluate((e) => Number(getComputedStyle(e).opacity))).toBeGreaterThan(.9);
  await page.locator(".expansion").scrollIntoViewIfNeeded();
  await page.evaluate(() => { const el = document.querySelector('.expansion')!; window.scrollBy(0, el.getBoundingClientRect().top + 1200); });
  await expect.poll(() => page.locator(".expansion-quote").evaluate((e) => Number(getComputedStyle(e).opacity))).toBeGreaterThan(.8);
  await page.screenshot({ path: "test-results/expansion.png" });
  await page.getByRole("switch", { name: "Activer les animations" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator(".hero-second")).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page.getByRole("switch").click();
  await expect(page.locator(".hero")).toHaveClass(/scene-pinned/);
});

test("desktop navigation reaches anchors across pinned scenes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".hero")).toHaveClass(/scene-pinned/);
  for (const id of ["studio", "services", "methode", "contact", "rendez-vous", "accueil"]) {
    await page.locator(`header a[href="#${id}"]`).click();
    await expect.poll(() => page.locator(`#${id}`).evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(160);
  }
});

test("reduced motion, mobile menu, anchors, modal keyboard and loupe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toBeFocused();
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.getByRole("navigation", { name: "Navigation mobile" }).getByRole("link", { name: "Services", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".spotlight-photo").focus();
  await page.keyboard.press("Enter"); await page.keyboard.press("ArrowRight");
  await expect(page.locator(".detail-lens")).toBeVisible();
  await page.screenshot({ path: "test-results/loupe.png" });
  await page.keyboard.press("Escape"); await expect(page.locator(".detail-lens")).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Mentions légales", exact: true });
  await trigger.click();
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
  await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
});

test("appointment steps, error handling, success and floating CTA", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#rendez-vous").scrollIntoViewIfNeeded();
  await expect(page.locator(".mobile-fab")).toHaveCount(0);
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByText("Choisissez une prestation.", { exact: true })).toBeVisible();
  await page.locator('select[name="service"]').selectOption("Solutions professionnelles");
  await page.locator('select[name="vehicle"]').selectOption("Berline");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.locator('input[name="date"]').fill("2001-01-01");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByText("Choisissez une date valide, aujourd’hui ou plus tard.", { exact: true })).toBeVisible();
  await page.locator('input[name="date"]').fill(parisToday());
  await page.locator('select[name="time"]').selectOption("Matin");
  await page.getByRole("button", { name: "Retour", exact: true }).click();
  await expect(page.locator('select[name="service"]')).toHaveValue("Solutions professionnelles");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.locator('input[name="name"]').fill("Client Test");
  await page.locator('input[name="phone"]').fill("0612345678");
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.locator('input[name="consent"]').check();
  await page.route("**/api/appointments", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Envoi indisponible" }) }));
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(page.getByText("Envoi indisponible", { exact: true })).toBeVisible();
  await page.unroute("**/api/appointments");
  await page.route("**/api/appointments", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(page.getByText("Votre demande est transmise.", { exact: true })).toBeVisible();
});

test("API refuses invalid origins, null payload, bot, past date and bursts", async ({ request }) => {
  expect((await request.post('/api/appointments', { headers: { origin: 'https://invalid.example' }, data: {} })).status()).toBe(403);
  expect((await request.post('/api/appointments', { headers: { 'content-type': 'application/json' }, data: 'null' })).status()).toBe(400);
  const valid = { ...emptyAppointment, service: "Solutions professionnelles", vehicle: "Berline", date: parisToday(), time: "Matin", name: "Client Test", phone: "0612345678", email: "test@example.com", consent: true };
  expect((await request.post('/api/appointments', { data: { ...valid, website: 'spam' } })).status()).toBe(400);
  expect((await request.post('/api/appointments', { data: { ...valid, date: '2000-01-01' } })).status()).toBe(400);
  // No valid request is sent: these checks cannot deliver an email.
  await request.post('/api/appointments', { data: {} });
  await request.post('/api/appointments', { data: {} });
  expect((await request.post('/api/appointments', { data: {} })).status()).toBe(429);
});
