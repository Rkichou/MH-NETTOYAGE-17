import { expect, test } from '@playwright/test';
import { parisToday } from '../lib/appointments';

for (const [width, height] of [[1440,1000], [768,1024], [390,844], [320,740], [844,390]]) {
  test(`dropdown layout ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /hydrat/i.test(message.text())) errors.push(message.text()); });
    await page.goto('/');
    const field = page.getByRole('combobox', { name: 'Prestation', exact: true });
    await field.click();
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    const box = (await list.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    await expect(list).toHaveCSS('animation-name', 'none');
    await page.screenshot({ path: `test-results/dropdown-${width}x${height}.png` });
    await page.getByRole('option', { name: 'Solutions professionnelles', exact: true }).click();
    await expect(field).toHaveText('Solutions professionnelles');
    await expect(field).toBeFocused();
    await expect(page.locator('input[type="hidden"][name="service"]')).toHaveValue('Solutions professionnelles');
    await field.click();
    await expect(page.getByRole('option', { name: 'Solutions professionnelles', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('dropdown keyboard, validation, outside click and submission preserve values', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  const service = page.getByRole('combobox', { name: 'Prestation', exact: true });
  await expect(service).toBeFocused();
  await expect(service).toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(service).toHaveText('Besoin spécifique');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Home');
  await page.keyboard.press('Escape');
  await expect(service).toHaveText('Besoin spécifique');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(service).toHaveText('Nettoyage intérieur');
  await service.click();
  await page.keyboard.press('Tab');
  const vehicle = page.getByRole('combobox', { name: 'Type de véhicule', exact: true });
  await expect(vehicle).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.keyboard.press('b');
  await page.keyboard.press('Enter');
  await expect(vehicle).toHaveText('Berline');
  await service.click();
  await page.mouse.click(12, 200);
  await expect(service).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.locator('input[name="date"]').fill(parisToday());
  await page.getByRole('combobox', { name: 'Créneau souhaité' }).click();
  await page.getByRole('option', { name: 'Matin', exact: true }).click();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.locator('input[name="name"]').fill('Client Test');
  await page.locator('input[name="phone"]').fill('0612345678');
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="consent"]').check();
  await page.getByRole('button', { name: 'Retour', exact: true }).click();
  await page.getByRole('button', { name: 'Retour', exact: true }).click();
  await expect(service).toHaveText('Nettoyage intérieur');
  await expect(vehicle).toHaveText('Berline');
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.waitForTimeout(2600);
  await page.getByRole('button', { name: 'Envoyer la demande' }).click();
  await expect(page.getByText('La prise de rendez-vous est momentanement indisponible.', { exact: true })).toBeVisible();
});

test('dropdown supports touch selection and motion preferences', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto(process.env.TEST_URL || 'http://localhost:3107');
    const service = page.getByRole('combobox', { name: 'Prestation', exact: true });
    await service.tap();
    await expect(page.getByRole('listbox')).toHaveCSS('animation-name', 'select-reveal');
    await page.getByRole('option', { name: 'Lavage extérieur', exact: true }).tap();
    await expect(service).toHaveText('Lavage extérieur');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await service.tap();
    await expect(page.getByRole('listbox')).toHaveCSS('animation-name', 'none');
    await page.keyboard.press('Escape');
  } finally { await context.close(); }
});
