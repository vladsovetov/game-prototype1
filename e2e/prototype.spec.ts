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

test('completes the guided first memory and opens the free meadow', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.keyboard.down('d');
  await page.waitForTimeout(240);
  await page.keyboard.up('d');
  await expect(page.getByTestId('tutorial-objective')).toContainText(/Use /);

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const positions: Record<string, { x: number; y: number }> = {
      stone: { x: 1120, y: 390 }, sign: { x: 1700, y: 280 }, pool: { x: 2300, y: 450 }, root: { x: 2790, y: 720 },
    };
    state.player = positions[state.tutorial.targetAnomalyId];
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.keyboard.press('f');
  await expect(page.getByRole('heading', { name: 'A clue returned' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish the memory' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('Find Mend');

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const positions: Record<string, { x: number; y: number }> = {
      grow: { x: 1030, y: 600 }, echo: { x: 2150, y: 650 }, mend: { x: 1840, y: 500 }, reveal: { x: 2630, y: 920 },
    };
    state.player = positions[state.tutorial.borrowedGift];
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.keyboard.press('e');
  await expect(page.getByTestId('tutorial-objective')).toContainText('Return and restore the sign');

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const positions: Record<string, { x: number; y: number }> = {
      stone: { x: 1120, y: 390 }, sign: { x: 1700, y: 280 }, pool: { x: 2300, y: 450 }, root: { x: 2790, y: 720 },
    };
    state.player = positions[state.tutorial.targetAnomalyId];
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.keyboard.press('f');
  await expect(page.getByRole('heading', { name: 'Memory recovered' })).toBeVisible();
  await page.getByRole('button', { name: 'Bring it home' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('Plant the Waypost');
  await page.keyboard.press('e');

  await expect(page.getByRole('heading', { name: 'Who kept the light burning?' })).toBeVisible();
  await page.getByRole('button', { name: 'A patient friend' }).click();
  await expect(page.getByRole('heading', { name: 'Make them yours' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep exploring' }).click();
  await expect(page.getByTestId('journal-button')).toBeVisible();
  await page.getByTestId('journal-button').click();
  await expect(page.getByRole('heading', { name: 'Field journal' })).toBeVisible();
});

test('keeps an invalid AI result editable and accepts Morrow', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'personalize';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.getByRole('button', { name: 'Create with your AI' }).click();
  await page.getByRole('button', { name: 'Paste the result' }).click();
  const box = page.getByRole('textbox', { name: 'Character JSON' });
  await box.fill('{}');
  await page.getByRole('button', { name: 'Meet this character' }).click();
  await expect(page.getByTestId('import-errors')).toBeVisible();
  await box.fill(JSON.stringify({ version: 1, name: 'Morrow', description: 'A porcelain fox that remembers vanished roads.', appearance: { body: 'fox', material: 'porcelain', palette: 'dusk', mark: 'map-lines' }, gift: 'reveal', burden: 'fragile', quirk: 'moon-touched' }));
  await page.getByRole('button', { name: 'Meet this character' }).click();
  await expect(page.getByRole('heading', { name: 'Make them yours' })).toBeVisible();
  await expect(page.getByText(/met Morrow/)).toBeVisible();
});

test('persists the random character across reload', async ({ page }) => {
  const name = await page.getByTestId('tutorial-character-name').textContent();
  await page.reload();
  await expect(page.getByTestId('tutorial-character-name')).toHaveText(name ?? '');
});
