import { expect, test } from '@playwright/test';

const SAVE = 'unwritten.prototype.save.v1';
const LOCALE = 'unwritten.prototype.locale.v1';

function progressFromSave(raw: string | null) {
  const state = JSON.parse(raw!);
  return {
    appearance: state.character.appearance,
    gift: state.character.gift.id,
    worldSeed: state.worldSeed,
    player: state.player,
    tutorial: state.tutorial?.step,
    anomalies: state.anomalies,
    rewarded: state.rewarded,
    seeds: state.seeds,
  };
}

test.describe('language selection', () => {
  test.use({ locale: 'de-DE' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('falls back to English and keeps game progress when another language is chosen', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Your random companion')).toBeVisible();
    await expect(page.getByTestId('language-switcher')).toBeVisible();

    const progressBefore = progressFromSave(await page.evaluate((key) => localStorage.getItem(key), SAVE));
    await page.getByRole('button', { name: 'Українська' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page.getByText('Ваш випадковий супутник')).toBeVisible();
    expect(progressFromSave(await page.evaluate((key) => localStorage.getItem(key), SAVE))).toEqual(progressBefore);
    expect(await page.evaluate((key) => localStorage.getItem(key), LOCALE)).toBe('uk');
  });

  test('persists Russian after reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Русский' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.getByText('Ваш случайный спутник')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Русский' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Ваш случайный спутник')).toBeVisible();
  });
});

