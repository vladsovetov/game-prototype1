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

test('can back out of a personalization detail without getting stuck', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate(() => {
    const key = 'unwritten.prototype.save.v1';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'personalize';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();

  await page.getByRole('button', { name: 'Add personality' }).click();
  await expect(page.getByRole('heading', { name: 'Tell us one true thing' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading', { name: 'Make them yours' })).toBeVisible();
});

test('introduces the E key when the player reaches a Resonance Shrine', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate(() => {
    const key = 'unwritten.prototype.save.v1';
    const state = JSON.parse(localStorage.getItem(key)!);
    const positions: Record<string, { x: number; y: number }> = {
      grow: { x: 1030, y: 600 }, echo: { x: 2150, y: 650 }, mend: { x: 1840, y: 500 }, reveal: { x: 2630, y: 920 },
    };
    state.tutorial.step = 'resonate';
    state.player = positions[state.tutorial.borrowedGift];
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();

  await expect(page.getByTestId('tutorial-objective')).toContainText('Borrow its Resonance');
  await expect(page.getByTestId('tutorial-objective')).toContainText('E');
});

test('does not advance the tutorial after changing an off-route anomaly', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate(() => {
    const key = 'unwritten.prototype.save.v1';
    const state = JSON.parse(localStorage.getItem(key)!);
    const positions: Record<string, { x: number; y: number }> = {
      echo: { x: 1350, y: 1050 }, reveal: { x: 2550, y: 1350 }, mend: { x: 1950, y: 1280 }, grow: { x: 1120, y: 1460 },
    };
    state.tutorial.step = 'gift';
    state.player = positions[state.character.gift.id];
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await page.keyboard.press('f');

  await expect(page.getByTestId('tutorial-objective')).toContainText(/Use /);
});

test('preserves a save from a newer build instead of overwriting it', async ({ page }) => {
  const raw = JSON.stringify({ version: 2, memories: ['from the future'] });
  await page.evaluate(({ key, rawValue }) => localStorage.setItem(key, rawValue), { key: 'unwritten.prototype.save.v1', rawValue: raw });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'This meadow is from a newer version' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('unwritten.prototype.save.v1'))).toBe(raw);
});

test('keeps personalization scrollable on a short phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate(() => {
    const key = 'unwritten.prototype.save.v1';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'personalize';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();

  const card = page.locator('.personalize-card');
  expect(await card.evaluate((element) => element.clientHeight <= window.innerHeight - 30)).toBe(true);
  await page.getByRole('button', { name: 'Keep exploring' }).click();
  await expect(page.getByTestId('journal-button')).toBeVisible();
});
