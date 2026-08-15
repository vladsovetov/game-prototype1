import { expect, test } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 820, height: 1180 } });

test('keeps touch controls visible on a wide coarse-pointer device', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Прокинутися' }).click();

  await expect(page.getByTestId('tutorial-objective')).toContainText('ТЯГНІТЬ');
  await expect(page.getByTestId('touch-joystick')).toBeVisible();
});
