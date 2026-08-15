import { expect, test } from '@playwright/test';

const SAVE = 'unwritten.prototype.save.v1';

test('reloads one tale but begins another without replacing the companion', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const original = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE);
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE);
  await page.reload();

  await page.getByTestId('journal-button').click();
  await expect(page.getByTestId('tale-run-mark')).toHaveText(original.storyArc.runMark);
  await expect(page.getByTestId('tale-folio')).toContainText(original.storyArc.premise);
  await page.getByRole('button', { name: 'Close' }).click();
  await page.reload();
  expect((await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE)).worldSeed).toBe(original.worldSeed);

  await page.getByTestId('help-button').click();
  await expect(page.getByText(/companion stays/i)).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Begin another tale' }).click();

  await expect(page.getByRole('button', { name: 'Wake up' })).toBeVisible();
  const next = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE);
  expect(next.worldSeed).not.toBe(original.worldSeed);
  expect(next.character).toEqual(original.character);
  expect(next.discoveries).toEqual([]);
});
