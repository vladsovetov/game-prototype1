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

  await offer.check();
  expect(await page.evaluate(() => localStorage.getItem('unwritten.prototype.voice.v1'))).toBe('on');
  await expect(page.locator('html')).not.toHaveAttribute('data-voice-state', 'off');

  await page.reload();
  await expect(page.getByTestId('voice-offer')).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('unwritten.prototype.voice.v1'))).toBe('on');
});

test('synthesizes the opening with the Ukrainian Piper voice', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByTestId('voice-offer').check();
  await expect(page.locator('html')).toHaveAttribute('data-voice-state', /download|speaking|ready/, { timeout: 170_000 });
  await expect(page.locator('html')).toHaveAttribute('data-voice-state', /speaking|ready/, { timeout: 170_000 });
  await expect(page.locator('html')).not.toHaveAttribute('data-voice-state', 'error');
});
