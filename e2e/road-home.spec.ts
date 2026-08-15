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
  await expect(page.getByText(/допоможіть .* повернути втрачений спогад/i)).toBeVisible();
  await expect(page.getByText('Дорога додому')).toBeVisible();
  await expect(page.getByText(/аномалія|зернина пам’яті|резонанс/i)).toHaveCount(0);

  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('ДОРОГА ДОДОМУ');
  await expect(page.getByTestId('tutorial-objective')).toContainText('0 / 2 ПІДКАЗКИ');
  await expect(page.getByTestId('tutorial-objective')).toContainText('Знайдіть залитий дощем дороговказ');
});

test('explains what Reveal changed and gives the first story clue', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'gift';
    state.player = { x: 1700, y: 280 };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.keyboard.press('f');

  await expect(page.getByRole('heading', { name: 'Підказка повернулася' })).toBeVisible();
  const playerBeforeBlockedInput = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  await page.keyboard.down('d');
  await page.waitForTimeout(650);
  await page.keyboard.up('d');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Підказка повернулася' })).toBeVisible();
  const playerAfterBlockedInput = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(playerAfterBlockedInput).toEqual(playerBeforeBlockedInput);
  const beat = page.locator('.memory-beat');
  await expect(beat).toContainText('Дім Ліхтарів');
  await expect(beat).toContainText(/ця дорога вже вела вперед/i);
  await page.getByRole('button', { name: 'Завершити спогад' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('1 / 2 ПІДКАЗКИ');
  await expect(page.getByTestId('tutorial-objective')).toContainText('ремонтним набором');
});

test('explains why restoring the sign completes the memory', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
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

  await expect(page.getByRole('heading', { name: 'Спогад відновлено' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Спогад відновлено' })).toBeVisible();
  await expect(page.getByText(/шлях крізь бурю/i)).toBeVisible();
  await expect(page.getByText(/підтримував його/i)).toBeVisible();
  await page.getByRole('button', { name: 'Віднести додому' }).click();
  await expect(page.getByTestId('tutorial-objective')).toContainText('2 / 2 ПІДКАЗКИ');
});

test('lets the player decide what the memory means and keeps it in the journal', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
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

  await expect(page.getByRole('heading', { name: 'Хто підтримував вогонь?' })).toBeVisible();
  await expect(page.getByText(/ваша відповідь стане частиною історії/i)).toBeVisible();
  await page.getByRole('button', { name: 'Обрана родина' }).click();
  await expect(page.getByRole('heading', { name: 'Зробіть персонажа своїм' })).toBeVisible();
  await page.getByRole('button', { name: 'Досліджувати далі' }).click();
  await expect(page.getByText('1 / 6 спогадів посаджено')).toBeVisible();
  await page.getByTestId('journal-button').click();

  await expect(page.getByRole('heading', { name: 'Польовий щоденник' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Дорога додому' })).toBeVisible();
  await expect(page.getByText('Обрана родина')).toBeVisible();
  await expect(page.locator('.journal-memory').getByText(/Дому Ліхтарів/)).toBeVisible();
});

test('keeps authored and custom memory choices usable on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.getByRole('button', { name: 'Прокинутися' }).click();
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
  await page.getByRole('button', { name: 'Написати власну відповідь' }).click();
  const input = page.getByRole('textbox', { name: 'Ваша відповідь' });
  await input.fill('Сусідка, яка ніколи не переставала вірити, що дорога знову приведе їх додому.');
  await expect(page.getByRole('button', { name: 'Зберегти цей спогад' })).toBeVisible();
  expect(await choiceCard.evaluate((element) => element.clientHeight <= window.innerHeight - 24)).toBe(true);
  await page.getByRole('button', { name: 'Зберегти цей спогад' }).click();
  await expect(page.getByRole('heading', { name: 'Зробіть персонажа своїм' })).toBeVisible();
});
