import { expect, test } from '@playwright/test';

const SAVE_KEY = 'unwritten.prototype.save.v1';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
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

test('moves the character by dragging the phone joystick', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('ТЯГНІТЬ');

  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  const joystick = page.getByTestId('touch-joystick');
  await expect(joystick).toBeVisible();
  const box = await joystick.boundingBox();
  if (!box) throw new Error('Touch joystick has no bounds.');
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await joystick.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: center.x, clientY: center.y, isPrimary: true });
  await joystick.dispatchEvent('pointermove', { pointerId: 7, pointerType: 'touch', clientX: center.x + 48, clientY: center.y, isPrimary: true });
  await page.waitForTimeout(80);
  await page.locator('body').dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', clientX: center.x + 48, clientY: center.y, isPrimary: true });

  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(after.x).toBeGreaterThan(before.x + 5);
  expect(pageErrors).toEqual([]);
});

test('uses the contextual touch action during the first discovery', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
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
  await expect(action).toContainText(/Дар «/);
  await action.click();
  await expect(page.getByRole('heading', { name: 'Підказка повернулася' })).toBeVisible();
  await page.getByRole('button', { name: 'Завершити спогад' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('Знайдіть Дар «Відновлення»');
});

test('names the correct borrowed Gift for an older touch save', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.character.gift = { id: 'echo', name: 'Echo', description: 'Repeats a hidden sound.' };
    state.tutorial = { ...state.tutorial, step: 'resonate', targetAnomalyId: 'stone', borrowedGift: 'grow' };
    state.player = { x: 1030, y: 600 };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByRole('button', { name: 'Позичити «Зростання»' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Позичити «Відновлення»' })).toHaveCount(0);
});

test('keeps the first thumb in control when a second pointer touches the joystick', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  const joystick = page.getByTestId('touch-joystick');
  const box = await joystick.boundingBox();
  if (!box) throw new Error('Touch joystick has no bounds.');
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await joystick.dispatchEvent('pointerdown', { pointerId: 11, pointerType: 'touch', clientX: center.x, clientY: center.y, isPrimary: true });
  await joystick.dispatchEvent('pointermove', { pointerId: 11, pointerType: 'touch', clientX: center.x + 42, clientY: center.y, isPrimary: true });
  await joystick.dispatchEvent('pointerdown', { pointerId: 12, pointerType: 'touch', clientX: center.x, clientY: center.y, isPrimary: false });
  await joystick.dispatchEvent('pointermove', { pointerId: 12, pointerType: 'touch', clientX: center.x - 42, clientY: center.y, isPrimary: false });
  await page.waitForTimeout(80);
  await page.locator('body').dispatchEvent('pointerup', { pointerId: 11, pointerType: 'touch', clientX: center.x + 42, clientY: center.y, isPrimary: true });

  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(after.x).toBeGreaterThan(before.x + 5);
});

test('stops and saves joystick movement when the window is interrupted', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  const joystick = page.getByTestId('touch-joystick');
  const box = await joystick.boundingBox();
  if (!box) throw new Error('Touch joystick has no bounds.');
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await joystick.dispatchEvent('pointerdown', { pointerId: 21, pointerType: 'touch', clientX: center.x, clientY: center.y, isPrimary: true });
  await joystick.dispatchEvent('pointermove', { pointerId: 21, pointerType: 'touch', clientX: center.x + 42, clientY: center.y, isPrimary: true });
  await page.waitForTimeout(80);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));

  const interrupted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(interrupted.x).toBeGreaterThan(before.x + 5);
  await page.waitForTimeout(550);
  const settled = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(settled.x).toBeCloseTo(interrupted.x, 1);
});

test('does not drift when the player touches the visual joystick center', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  const joystick = page.getByTestId('touch-joystick');
  const ring = joystick.locator('.touch-ring');
  const box = await ring.boundingBox();
  if (!box) throw new Error('Touch joystick ring has no bounds.');
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await joystick.dispatchEvent('pointerdown', { pointerId: 31, pointerType: 'touch', clientX: center.x, clientY: center.y, isPrimary: true });
  await page.waitForTimeout(80);
  await page.locator('body').dispatchEvent('pointerup', { pointerId: 31, pointerType: 'touch', clientX: center.x, clientY: center.y, isPrimary: true });

  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(after.x).toBeCloseTo(before.x, 1);
  expect(after.y).toBeCloseTo(before.y, 1);
});

test('shows both touch actions after the meadow opens', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByTestId('touch-joystick')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Застосувати Дар' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Дослідити поруч' })).toBeVisible();
  await page.getByTestId('help-button').click();
  await expect(page.getByText('Тягніть золотий вогник')).toBeVisible();
});
