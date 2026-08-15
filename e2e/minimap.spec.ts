import { expect, test } from '@playwright/test';

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

test('keeps a field map in the free desktop corner and sends the trail to a tapped mark', async ({ page }) => {
  const map = page.getByTestId('minimap');
  await expect(map).toBeVisible();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-field-kinds', 'tool,use,plot');

  const box = await map.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.x).toBeLessThan(80);
  expect(box!.y).toBeGreaterThan(500);

  const marks = await page.locator('#game-canvas').getAttribute('data-minimap-marks');
  const sign = (JSON.parse(marks!) as Array<{ id: string; x: number; y: number }>).find((mark) => mark.id === 'sign');
  if (!sign) throw new Error('Sign mark missing from the field map.');
  await page.mouse.click(sign.x, sign.y);
  await expect(page.locator('.toast')).toContainText(/покажчик|Покажчик|вогники/i);
});

test('keeps the phone map above the joystick and off the action buttons', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  const map = page.getByTestId('minimap');
  const joystick = page.getByTestId('touch-joystick');
  await expect(map).toBeVisible();
  await expect(joystick).toBeVisible();

  const mapBox = await map.boundingBox();
  const stickBox = await joystick.boundingBox();
  if (!mapBox || !stickBox) throw new Error('Map or joystick has no bounds.');
  expect(mapBox.y + mapBox.height).toBeLessThan(stickBox.y - 4);
  expect(mapBox.x).toBeLessThan(40);
  expect(mapBox.x + mapBox.width).toBeLessThan(220);
});
