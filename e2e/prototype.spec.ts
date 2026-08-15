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
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.keyboard.down('d');
  await page.waitForTimeout(240);
  await page.keyboard.up('d');
  await expect(page.getByTestId('tutorial-objective')).toContainText(/Посвітіть інструментом/);

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
  await expect(page.getByRole('heading', { name: 'Підказка повернулася' })).toBeVisible();
  await page.getByRole('button', { name: 'Завершити спогад' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('ремонтним набором');

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
  await expect(page.getByTestId('tutorial-objective')).toContainText('Поверніться й полагодьте покажчик');

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
  await expect(page.getByRole('heading', { name: 'Спогад відновлено' })).toBeVisible();
  await page.getByRole('button', { name: 'Віднести додому' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('Посадіть дороговказ');
  await page.keyboard.press('e');

  await expect(page.getByRole('heading', { name: 'Хто підтримував вогонь?' })).toBeVisible();
  await page.getByRole('button', { name: 'Терплячий друг' }).click();
  await expect(page.getByRole('heading', { name: 'Зробіть персонажа своїм' })).toBeVisible();
  await page.getByRole('button', { name: 'Досліджувати далі' }).click();
  await expect(page.getByTestId('journal-button')).toBeVisible();
  await page.getByTestId('journal-button').click();
  await expect(page.getByRole('heading', { name: 'Польовий щоденник' })).toBeVisible();
});

test('keeps an invalid AI result editable and accepts Morrow', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'personalize';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.getByRole('button', { name: 'Створити за допомогою ШІ' }).click();
  await page.getByRole('button', { name: 'Вставити результат' }).click();
  const box = page.getByRole('textbox', { name: 'JSON персонажа' });
  await box.fill('{}');
  await page.getByRole('button', { name: 'Зустріти персонажа' }).click();
  await expect(page.getByTestId('import-errors')).toBeVisible();
  await box.fill(JSON.stringify({ version: 1, name: 'Морроу', description: 'Порцелянова лисиця, що пам’ятає зниклі дороги.', appearance: { body: 'fox', material: 'porcelain', palette: 'dusk', mark: 'map-lines' }, gift: 'reveal', burden: 'fragile', quirk: 'moon-touched' }));
  await page.getByRole('button', { name: 'Зустріти персонажа' }).click();
  await expect(page.getByRole('heading', { name: 'Зробіть персонажа своїм' })).toBeVisible();
  await expect(page.getByText(/Морроу входить/)).toBeVisible();
});

test('persists the random character across reload', async ({ page }) => {
  const name = await page.getByTestId('tutorial-character-name').textContent();
  await page.reload();
  await expect(page.getByTestId('tutorial-character-name')).toHaveText(name ?? '');
});
