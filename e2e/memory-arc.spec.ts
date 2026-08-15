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

test('reveals and preserves a story chapter when a later memory is recovered', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    state.character.gift = { id: 'echo', name: 'Echo', description: 'Repeats a hidden sound.' };
    state.borrowedGift = 'grow';
    state.anomalies.stone = 1;
    state.player = { x: 1120, y: 390 };
    state.rewarded = [];
    state.seeds = [];
    state.plantings = {};
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
  await page.keyboard.press('f');

  await expect(page.getByRole('heading', { name: 'Пісня під каменем' })).toBeVisible();
  await expect(page.locator('.toast')).toHaveCount(0, { timeout: 250 });
  await expect(page.getByText(/наляканих мандрівників/i)).toBeVisible();
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  await page.keyboard.down('d');
  await page.waitForTimeout(650);
  await page.keyboard.up('d');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Пісня під каменем' })).toBeVisible();
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(after).toEqual(before);

  await page.getByRole('button', { name: 'Зберегти цей спогад' }).click();
  await page.getByTestId('journal-button').click();
  await expect(page.getByRole('heading', { name: 'Польовий щоденник' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Пісня під каменем' })).toBeVisible();
  await expect(page.getByText(/грім не став тихим/i)).toBeVisible();
});

test('keeps a recovered chapter usable on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    state.pendingChapter = 'bell';
    state.rewarded = ['bell'];
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  const chapter = page.locator('.memory-chapter-card');
  await expect(page.getByRole('heading', { name: 'Дзвін бурі' })).toBeVisible();
  expect(await chapter.evaluate((element) => element.clientHeight <= window.innerHeight - 24)).toBe(true);
  await expect(page.getByRole('button', { name: 'Зберегти цей спогад' })).toBeVisible();
});

test('turns the sixth planted memory into a persistent story ending', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    state.plantings = {
      'plot-1': 'waypost',
      'plot-2': 'singing-tree',
      'plot-3': 'whisper-pool',
      'plot-4': 'hidden-door',
      'plot-5': 'rain-bell',
    };
    state.seeds = ['paper-flock'];
    state.rewarded = ['sign', 'stone', 'pool', 'root', 'bell', 'moth'];
    state.player = { x: 610, y: 490 };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByText('5 / 6 спогадів посаджено')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'Хранитель Дому Ліхтарів' })).toBeVisible();
  await expect(page.locator('.toast')).toHaveCount(0, { timeout: 250 });
  await expect(page.getByText(/дім, створений для всіх, хто ще в дорозі/i)).toBeVisible();
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  await page.keyboard.down('d');
  await page.waitForTimeout(650);
  await page.keyboard.up('d');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Хранитель Дому Ліхтарів' })).toBeVisible();
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).player, SAVE_KEY);
  expect(after).toEqual(before);

  await page.getByRole('button', { name: 'Нести світло далі' }).click();
  await expect(page.getByText('Історію завершено')).toBeVisible();
  await page.getByTestId('journal-button').click();
  await expect(page.getByRole('heading', { name: 'Хранитель Дому Ліхтарів' })).toBeVisible();
});

test('gives an already-full older sanctuary its ending without losing saved choices', async ({ page }) => {
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    state.character.name = 'Morrow';
    state.memoryDetails = { 'road-home': 'A family they chose' };
    state.plantings = {
      'plot-1': 'waypost',
      'plot-2': 'singing-tree',
      'plot-3': 'whisper-pool',
      'plot-4': 'hidden-door',
      'plot-5': 'rain-bell',
      'plot-6': 'paper-flock',
    };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Хранитель Дому Ліхтарів' })).toBeVisible();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.character.name).toBe('Morrow');
  expect(saved.memoryDetails['road-home']).toBe('Обрана родина');
  expect(Object.keys(saved.plantings)).toHaveLength(6);
});
