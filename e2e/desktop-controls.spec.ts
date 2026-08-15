import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unwritten.prototype.save.v1';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    state.player = { x: 1600, y: 700 };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
});

async function savedPlayer(page: Page) {
  return page.evaluate((key: string) => JSON.parse(localStorage.getItem(key)!).player as { x: number; y: number }, SAVE_KEY);
}

test('moves with arrow keys on a laptop', async ({ page }) => {
  const before = await savedPlayer(page);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(650);
  await page.keyboard.up('ArrowRight');

  const after = await savedPlayer(page);
  expect(after.x).toBeGreaterThan(before.x + 20);
});

test('uses the physical WASD keys when the Ukrainian keyboard layout is active', async ({ page }) => {
  const before = await savedPlayer(page);

  await page.locator('body').dispatchEvent('keydown', { key: 'в', code: 'KeyD', bubbles: true });
  await page.waitForTimeout(650);
  await page.locator('body').dispatchEvent('keyup', { key: 'в', code: 'KeyD', bubbles: true });

  const after = await savedPlayer(page);
  expect(after.x).toBeGreaterThan(before.x + 20);
});
