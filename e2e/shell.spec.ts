import { expect, test } from '@playwright/test';

test('opens directly in the world with a single invitation', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page).toHaveTitle('The Unwritten');
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wake up' })).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(1);
});
