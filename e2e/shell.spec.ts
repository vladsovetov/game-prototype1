import { expect, test } from '@playwright/test';

test('shows the canvas and three character creation paths', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('The Unwritten');
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create with your AI' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import Character' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Surprise Me' })).toBeVisible();
});
