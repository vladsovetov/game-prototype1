import { expect, test } from '@playwright/test';

const SAVE = 'unwritten.prototype.save.v1';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const raw = JSON.stringify({
      place: 'The Glass Orchard', role: 'keeper of small storms', disaster: 'the northern road disappeared in rain',
      vow: 'No traveler will be left without a light.', motif: 'copper leaves', truth: 'home was the promise they kept together',
    });
    class FakeStoryWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(message: { jobId: string }) {
        setTimeout(() => this.onmessage?.({ data: { type: 'progress', jobId: message.jobId, stage: 'download', progress: .42 } } as MessageEvent), 20);
        setTimeout(() => this.onmessage?.({ data: { type: 'complete', jobId: message.jobId, raw } } as MessageEvent), 350);
      }
      terminate() {}
    }
    Object.defineProperty(window, 'Worker', { value: FakeStoryWorker, configurable: true });
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('offers and applies the on-device writer only after the first memory', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Let this device write the tale' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'personalize';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE);
  await page.reload();

  const option = page.getByRole('button', { name: 'Let this device write the tale' });
  await expect(option).toContainText(/120–180 MB/i);
  await page.setViewportSize({ width: 390, height: 480 });
  await option.click();

  const loom = page.locator('.story-loom-card');
  await expect(page.getByRole('heading', { name: 'This device is weaving' })).toBeVisible();
  await expect(loom).toContainText('42%');
  expect(await loom.evaluate((element) => element.clientHeight <= window.innerHeight - 24)).toBe(true);
  await expect(page.getByRole('heading', { name: 'A new tale has taken root' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep this tale' }).click();

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.tutorial.step = 'done';
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE);
  await page.reload();
  await page.getByTestId('journal-button').click();
  await expect(page.getByTestId('tale-folio')).toContainText('Written on this device');
  await expect(page.getByTestId('tale-folio')).toContainText('Glass Orchard');
  expect(await page.evaluate((key) => localStorage.getItem(key), 'unwritten.prototype.local-writer.v1')).toBe('enabled');
});
