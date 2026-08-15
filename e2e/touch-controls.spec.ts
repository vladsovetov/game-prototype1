import { expect, test } from '@playwright/test';

const SAVE_KEY = 'unwritten.prototype.save.v1';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('moves the character by dragging the phone joystick', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.getByRole('button', { name: 'Wake up' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('DRAG');

  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  const joystick = page.getByTestId('touch-joystick');
  await expect(joystick).toBeVisible();
  const box = await joystick.boundingBox();
  if (!box) throw new Error('Touch joystick has no bounds.');
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await joystick.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: center.x, clientY: center.y, isPrimary: true });
  await joystick.dispatchEvent('pointermove', { pointerId: 7, pointerType: 'touch', clientX: center.x + 48, clientY: center.y, isPrimary: true });
  await page.waitForTimeout(280);
  await page.locator('body').dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', clientX: center.x + 48, clientY: center.y, isPrimary: true });

  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(after.x).toBeGreaterThan(before.x + 25);
  expect(pageErrors).toEqual([]);
});

test('uses the contextual touch action during the first discovery', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const positions: Record<string, { x: number; y: number }> = {
      stone: { x: 1120, y: 390 }, sign: { x: 1700, y: 280 }, pool: { x: 2300, y: 450 }, root: { x: 2790, y: 720 },
    };
    state.tutorial.step = 'gift';
    state.player = positions[state.tutorial.targetAnomalyId];
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  const action = page.getByTestId('touch-primary-action');
  await expect(action).toContainText(/Use /);
  await action.click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('Follow the');
});

test('shows both touch actions after the meadow opens', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByTestId('touch-joystick')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use Gift' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explore nearby' })).toBeVisible();
  await page.getByTestId('help-button').click();
  await expect(page.getByText('Drag the golden ember')).toBeVisible();
});
