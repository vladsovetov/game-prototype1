import { expect, test } from '@playwright/test';

const SAVE = 'unwritten.prototype.save.v1';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const raw = JSON.stringify({
      place: 'Скляний сад', role: 'хранитель малих буревіїв', disaster: 'північна дорога зникла під дощем',
      vow: 'Жоден мандрівник не залишиться без світла.', motif: 'мідне листя', truth: 'домом була обіцянка, яку берегли разом',
    });
    class FakeStoryWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(message: { jobId: string }) {
        setTimeout(() => this.onmessage?.({ data: { type: 'progress', jobId: message.jobId, stage: 'download', progress: .42 } } as MessageEvent), 20);
        setTimeout(() => this.onmessage?.({ data: { type: 'complete', jobId: message.jobId, raw } } as MessageEvent), 900);
      }
      terminate() {}
    }
    Object.defineProperty(window, 'Worker', { value: FakeStoryWorker, configurable: true });
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('generates the story, world direction, palette, and equipment before play', async ({ page }) => {
  const option = page.getByRole('button', { name: 'Створити новий світ локально з ШІ' });
  await expect(option).toContainText(/120–180 МБ/i);
  await page.setViewportSize({ width: 390, height: 480 });
  await option.click();

  const loom = page.locator('.story-loom-card');
  const initialLoom = await loom.elementHandle();
  await expect(page.getByRole('heading', { name: 'Пристрій виткає оповідь' })).toBeVisible();
  await expect(loom).toContainText('42%');
  expect(await initialLoom?.evaluate((element) => element === document.querySelector('.story-loom-card'))).toBe(true);
  expect(await loom.evaluate((element) => element.clientHeight <= window.innerHeight - 24)).toBe(true);
  await expect(page.getByRole('heading', { name: 'Нова оповідь пустила коріння' })).toBeVisible();
  await page.getByRole('button', { name: 'Зберегти цю оповідь' }).click();

  await expect(page.getByText('Світ створено локально на цьому пристрої')).toBeVisible();
  const generated = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE);
  expect(generated.storyArc.source).toBe('local-model');
  expect(generated.storyArc.worldName).toBe('Скляний сад');
  expect(generated.storyArc.direction.colors).toHaveLength(5);
  expect(generated.wardrobe).toEqual(generated.storyArc.direction.starterWearables);
  await page.getByRole('button', { name: 'Увійти у створений світ' }).click();

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE);
  await page.reload();
  await page.getByTestId('journal-button').click();
  await expect(page.getByTestId('tale-folio')).toContainText('Написано на цьому пристрої');
  await expect(page.getByTestId('tale-folio')).toContainText(/сад|берег|болот|нагір/i);
  expect(await page.evaluate((key) => localStorage.getItem(key), 'unwritten.prototype.local-writer.v1')).toBe('enabled');
});
