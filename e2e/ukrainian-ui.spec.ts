import { expect, test } from '@playwright/test';

const SAVE = 'unwritten.prototype.save.v1';

test('presents the complete opening and generated tale in Ukrainian', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page).toHaveTitle('Ненаписане');
  await expect(page.getByTestId('game-canvas')).toHaveAttribute('aria-label', 'Світ гри «Ненаписане»');
  await expect(page.getByRole('button', { name: 'Прокинутися' })).toBeVisible();

  const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE);
  expect(JSON.stringify(state.storyArc)).toMatch(/[А-ЯІЇЄҐа-яіїєґ]/);
  expect(state.character.description).toMatch(/[А-ЯІЇЄҐа-яіїєґ]/);

  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('Знайдіть залитий дощем дороговказ');
});

test('keeps the Ukrainian opening usable on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const card = page.locator('.wake-card');
  expect(await card.evaluate((element) => element.clientHeight <= window.innerHeight - 20)).toBe(true);
  await expect(page.getByRole('button', { name: 'Прокинутися' })).toBeVisible();
});
