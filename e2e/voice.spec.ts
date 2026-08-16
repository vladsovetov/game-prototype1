import { expect, test } from '@playwright/test';

test('offers a muted field voice on the opening and remembers the choice', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-voice-state', 'off');
  const offer = page.getByTestId('voice-offer');
  await expect(offer).toBeVisible();
  await expect(offer).not.toBeChecked();
  await expect(page.getByText('Увімкнути голос поля')).toBeVisible();
  await expect(page.getByText('Читає картки історії, спогади й навушник')).toBeVisible();

  await offer.check();
  expect(await page.evaluate(() => localStorage.getItem('unwritten.prototype.voice.v1'))).toBe('on');
  await expect(page.locator('html')).not.toHaveAttribute('data-voice-state', 'off');

  await page.reload();
  await expect(page.getByTestId('voice-offer')).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('unwritten.prototype.voice.v1'))).toBe('on');
});

test('starts reading the opening in the current language without a model download', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByTestId('voice-offer').check();
  await expect(page.locator('html')).toHaveAttribute('data-voice-state', /speaking|ready/);
  await expect(page.locator('html')).not.toHaveAttribute('data-voice-state', 'error');
  await expect(page.getByTestId('voice-status')).toContainText(/Читає історію|Голос поля готовий/);
});
