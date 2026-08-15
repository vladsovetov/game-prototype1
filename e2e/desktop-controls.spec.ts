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
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-facing', 'right');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-walking', 'true');
  await page.waitForTimeout(650);
  await page.keyboard.up('ArrowRight');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-facing', 'right');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-walking', 'false');

  const after = await savedPlayer(page);
  expect(after.x).toBeGreaterThan(before.x + 20);
});

test('equips visible clothing and persists it', async ({ page }) => {
  await page.getByTestId('character-button').click();
  const item = page.locator('[data-testid^="equipment-"]').first();
  const id = (await item.getAttribute('data-testid'))!.replace('equipment-', '');
  const wasEquipped = await item.getAttribute('aria-pressed') === 'true';

  await item.click();
  await expect(page.locator(`[data-testid="equipment-${id}"]`)).toHaveAttribute('aria-pressed', String(!wasEquipped));
  await page.getByRole('button', { name: 'Закрити' }).click();
  const equipment = await page.locator('#game-canvas').getAttribute('data-equipment');
  expect(equipment?.includes(id)).toBe(!wasEquipped);

  await page.reload();
  const canvas = page.locator('#game-canvas');
  await expect(canvas).toHaveAttribute('data-equipment', /.+/);
  const persisted = await canvas.getAttribute('data-equipment');
  expect(persisted?.includes(id)).toBe(!wasEquipped);
});

test('uses the physical WASD keys when the Ukrainian keyboard layout is active', async ({ page }) => {
  const before = await savedPlayer(page);

  await page.locator('body').dispatchEvent('keydown', { key: 'в', code: 'KeyD', bubbles: true });
  await page.waitForTimeout(650);
  await page.locator('body').dispatchEvent('keyup', { key: 'в', code: 'KeyD', bubbles: true });

  const after = await savedPlayer(page);
  expect(after.x).toBeGreaterThan(before.x + 20);
});

test('keeps every body type and equipped item present through all four turns',async({page})=>{
  const bodies=['fox','moth','bird','wisp'] as const;
  const directions=[['ArrowUp','up'],['ArrowDown','down'],['ArrowLeft','left'],['ArrowRight','right']] as const;
  for(const body of bodies){
    await page.evaluate(({key,body})=>{const state=JSON.parse(localStorage.getItem(key)!);state.character.appearance.body=body;state.effects.fadingUntil=0;state.wardrobe=['rain-hat','wool-scarf','canvas-pack','rubber-boots'];state.equipped={head:'rain-hat',neck:'wool-scarf',back:'canvas-pack',feet:'rubber-boots'};localStorage.setItem(key,JSON.stringify(state))},{key:SAVE_KEY,body});
    await page.reload();
    for(const [key,facing] of directions){
      await page.keyboard.down(key);await expect(page.locator('#game-canvas')).toHaveAttribute('data-facing',facing);await page.waitForTimeout(70);
      if(process.env.AVATAR_SCREENSHOTS==='1')await page.screenshot({path:`/private/tmp/avatar-${body}-${facing}.png`,clip:{x:565,y:245,width:150,height:165}});
      await page.keyboard.up(key);
      const parts=(await page.locator('#game-canvas').getAttribute('data-avatar-parts'))?.split(',')??[];
      expect(parts).toEqual(expect.arrayContaining(['head','torso','hands','feet',`signature-${body}`,'wearable-rain-hat','wearable-wool-scarf','wearable-canvas-pack','wearable-rubber-boots',facing==='up'?'back-of-head':'face']));
    }
  }
});
