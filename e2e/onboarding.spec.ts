import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('starts with a random creature and one clear action', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Wake up' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import Character' })).toHaveCount(0);
  await expect(page.getByText(/Gift|Burden|Quirk/)).toHaveCount(0);
  await expect(page.getByTestId('tutorial-character-name')).toBeVisible();
});

test('reveals movement only after waking', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('Move toward the light');
  await expect(page.getByText('WASD')).toBeVisible();
  await expect(page.getByTestId('journal-button')).toHaveCount(0);
});

test('offers optional personalization only after the first memory', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate(() => {
    const key = 'unwritten.prototype.save.v1';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'personalize';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Make them yours' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add personality' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Shape their look' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create with your AI' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep exploring' })).toBeVisible();
});
