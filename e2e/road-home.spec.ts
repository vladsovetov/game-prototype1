import { expect, test } from '@playwright/test';

const SAVE_KEY = 'unwritten.prototype.save.v1';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('opens with a purpose and introduces The Road Home without game jargon', async ({ page }) => {
  await expect(page.getByText(/help .* recover a lost memory/i)).toBeVisible();
  await expect(page.getByText('The Road Home')).toBeVisible();
  await expect(page.getByText(/anomaly|memory seed|resonance/i)).toHaveCount(0);

  await page.getByRole('button', { name: 'Wake up' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('THE ROAD HOME');
  await expect(page.getByTestId('tutorial-objective')).toContainText('0 / 2 CLUES');
  await expect(page.getByTestId('tutorial-objective')).toContainText('Find the rain-covered sign');
});

test('explains what Reveal changed and gives the first story clue', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'gift';
    state.player = { x: 1700, y: 280 };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.keyboard.press('f');

  await expect(page.getByRole('heading', { name: 'A clue returned' })).toBeVisible();
  const beat = page.locator('.memory-beat');
  await expect(beat).toContainText('Lantern House');
  await expect(beat).toContainText(/road they once followed/i);
  await page.getByRole('button', { name: 'Finish the memory' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('1 / 2 CLUES');
  await expect(page.getByTestId('tutorial-objective')).toContainText('Find Mend');
});

test('explains why restoring the sign completes the memory', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'combine';
    state.anomalies.sign = 1;
    state.borrowedGift = 'mend';
    state.player = { x: 1700, y: 280 };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.keyboard.press('f');

  await expect(page.getByRole('heading', { name: 'Memory recovered' })).toBeVisible();
  await expect(page.getByText(/walking through a storm/i)).toBeVisible();
  await expect(page.getByText(/kept burning/i)).toBeVisible();
  await page.getByRole('button', { name: 'Bring it home' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('2 / 2 CLUES');
});
