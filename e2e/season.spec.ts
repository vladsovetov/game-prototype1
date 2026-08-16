import { expect, test, type Page } from '@playwright/test';
import type { GameState } from '../src/domain/types';
import { worldFor } from '../src/domain/world';

const SAVE_KEY = 'unwritten.prototype.save.v1';

async function saved(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!) as GameState, SAVE_KEY);
}

async function placeAtExpeditionTarget(page: Page) {
  const state = await saved(page);
  const run = state.expedition!;
  const siteId = run.status === 'returning' ? undefined : (run.siteIds[run.completed.length] ?? run.optionalSiteId);
  const world = worldFor(state);
  const target = siteId ? world.anomalies.find((item) => item.id === siteId)!.position : world.gate;
  await page.evaluate(({ key, target }) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.player = target;
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, target });
  await page.reload();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Прокинутися' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();
});

test('starts a hidden season, speaks on the radio, and packs a trusted relic', async ({ page }) => {
  await page.getByTestId('contracts-button').click();
  await page.locator('[data-tool="mend"]').click();
  await page.locator('[data-tool="reveal"]').click();
  await page.getByRole('button', { name: /Вирушити/ }).first().click();
  await expect(page.locator('[data-expedition-objective]')).toBeVisible();

  const begun = await saved(page);
  expect(begun.season?.beats[0]?.id).toBe('strange-signal');
  expect(begun.season?.beats[0]?.expeditionId).toBe(begun.expedition?.id);
  expect(begun.expedition?.contractId).toBeTruthy();

  await page.keyboard.down('KeyD');
  await expect(page.getByTestId('radio-remark')).toBeVisible({ timeout: 8000 });
  await page.keyboard.up('KeyD');
  expect((await page.getByTestId('radio-remark').textContent())?.length).toBeGreaterThan(8);

  for (let step = 1; step <= 3; step++) {
    await placeAtExpeditionTarget(page);
    await page.keyboard.press('f');
    await expect(page.getByText('Як виконати роботу?')).toBeVisible();
    await page.locator('.work-choice').first().click();
  }
  await page.getByRole('button', { name: 'Повернутися зараз' }).click();
  await placeAtExpeditionTarget(page);
  await page.keyboard.press('e');
  await expect(page.getByText('ЗВІТ ЗБЕРЕЖЕНО У ЩОДЕННИКУ')).toBeVisible();
  await page.getByRole('button', { name: 'Повернутися до Притулку' }).click();

  const finished = await saved(page);
  expect(finished.season?.beats[0]?.resolved).toBe(true);
  expect(finished.relics?.length).toBeGreaterThan(0);
  expect(finished.wardrobe).toContain(finished.relics![0]!.wearableId);

  await page.getByTestId('journal-button').click();
  await expect(page.getByTestId('season-thread')).toContainText('Польовий сезон');
  await expect(page.getByTestId('season-thread')).toContainText('з');
  await page.getByRole('button', { name: 'Закрити' }).click();
  await page.getByTestId('character-button').click();
  await expect(page.getByTestId('relic-list')).toContainText(finished.relics![0]!.name);
});

function aboveControl(notice: { y: number; height: number }, control: { y: number }) {
  return notice.y + notice.height < control.y - 4;
}

test('keeps the earpiece and toasts off the phone joystick, map, and actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByTestId('contracts-button').click();
  await page.locator('[data-tool="mend"]').click();
  await page.locator('[data-tool="reveal"]').click();
  await page.getByRole('button', { name: /Вирушити/ }).first().click();

  const toast = page.locator('.toast');
  const joystick = page.getByTestId('touch-joystick');
  const map = page.getByTestId('minimap');
  const actions = page.locator('.touch-actions');
  await expect(toast).toBeVisible();
  await expect(joystick).toBeVisible();

  const toastBox = await toast.boundingBox();
  const stickBox = await joystick.boundingBox();
  const mapBox = await map.boundingBox();
  const actionBox = await actions.boundingBox();
  if (!toastBox || !stickBox || !mapBox || !actionBox) throw new Error('Phone notice or controls have no bounds.');
  expect(aboveControl(toastBox, stickBox)).toBe(true);
  expect(aboveControl(toastBox, mapBox)).toBe(true);
  expect(aboveControl(toastBox, actionBox)).toBe(true);
  await expect(page.getByTestId('notice-root')).toHaveCSS('pointer-events', 'none');

  await page.keyboard.down('KeyD');
  const radio = page.getByTestId('radio-remark');
  await expect(radio).toBeVisible({ timeout: 8000 });
  await page.keyboard.up('KeyD');
  await expect(radio).toContainText('У навушнику');

  const radioBox = await radio.boundingBox();
  const liveStick = await joystick.boundingBox();
  const liveMap = await map.boundingBox();
  const liveActions = await actions.boundingBox();
  if (!radioBox || !liveStick || !liveMap || !liveActions) throw new Error('Earpiece or controls have no bounds.');
  expect(aboveControl(radioBox, liveStick)).toBe(true);
  expect(aboveControl(radioBox, liveMap)).toBe(true);
  expect(aboveControl(radioBox, liveActions)).toBe(true);
});
