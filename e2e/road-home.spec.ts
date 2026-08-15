import { expect, test } from '@playwright/test';

const SAVE_KEY = 'unwritten.prototype.save.v1';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    delete state.worldSeed;
    delete state.storyArc;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
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
  const playerBeforeBlockedInput = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  await page.keyboard.down('d');
  await page.waitForTimeout(650);
  await page.keyboard.up('d');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A clue returned' })).toBeVisible();
  const playerAfterBlockedInput = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(playerAfterBlockedInput).toEqual(playerBeforeBlockedInput);
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
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Memory recovered' })).toBeVisible();
  await expect(page.getByText(/walking through a storm/i)).toBeVisible();
  await expect(page.getByText(/kept burning/i)).toBeVisible();
  await page.getByRole('button', { name: 'Bring it home' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('2 / 2 CLUES');
});

test('lets the player decide what the memory means and keeps it in the journal', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'plant';
    state.anomalies.sign = 2;
    state.rewarded = ['sign'];
    state.seeds = ['waypost'];
    state.player = { x: 230, y: 300 };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.keyboard.press('e');

  await expect(page.getByRole('heading', { name: 'Who kept the light burning?' })).toBeVisible();
  await expect(page.getByText(/your answer becomes part of/i)).toBeVisible();
  await page.getByRole('button', { name: 'A family they chose' }).click();
  await expect(page.getByRole('heading', { name: 'Make them yours' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep exploring' }).click();
  await expect(page.getByText('1 / 6 memories planted')).toBeVisible();
  await page.getByTestId('journal-button').click();

  await expect(page.getByRole('heading', { name: 'Field journal' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Road Home' })).toBeVisible();
  await expect(page.getByText('A family they chose')).toBeVisible();
  await expect(page.locator('.journal-memory').getByText(/Lantern House/)).toBeVisible();
});

test('keeps authored and custom memory choices usable on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'remember';
    state.rewarded = ['sign'];
    state.plantings = { 'plot-1': 'waypost' };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  const choiceCard = page.locator('.memory-choice-card');
  expect(await choiceCard.evaluate((element) => element.clientHeight <= window.innerHeight - 24)).toBe(true);
  await page.getByRole('button', { name: 'Write my own answer' }).click();
  const input = page.getByRole('textbox', { name: 'Your answer' });
  await input.fill('A neighbor who never stopped believing the road would bring them back home again.');
  await expect(page.getByRole('button', { name: 'Keep this memory' })).toBeVisible();
  expect(await choiceCard.evaluate((element) => element.clientHeight <= window.innerHeight - 24)).toBe(true);
  await page.getByRole('button', { name: 'Keep this memory' }).click();
  await expect(page.getByRole('heading', { name: 'Make them yours' })).toBeVisible();
});
