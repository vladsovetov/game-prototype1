import { expect, test } from '@playwright/test';

test('opens directly in the world with AI and instant-start choices', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page).toHaveTitle('Ненаписане');
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Прокинутися' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Створити новий світ локально з ШІ' })).toBeVisible();
  await expect(page.locator('.wake-card button')).toHaveCount(2);
  await expect(page.getByTestId('language-switcher')).toBeVisible();
  await expect(page.getByTestId('game-version')).toBeVisible();
  await expect(page.getByTestId('game-version')).toHaveText(/v\d+\.\d+\.\d+ · /);
});

test('keeps a generated opening usable on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const card = page.locator('.wake-card');
  expect(await card.evaluate((element) => element.clientHeight <= window.innerHeight - 20)).toBe(true);
  await expect(page.getByRole('button', { name: 'Прокинутися' })).toBeVisible();
});
