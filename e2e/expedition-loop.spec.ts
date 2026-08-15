import { expect, test, type Page } from '@playwright/test';
import type { GameState } from '../src/domain/types';
import { worldFor } from '../src/domain/world';

const SAVE_KEY='unwritten.prototype.save.v1';

async function saved(page:Page){return page.evaluate((key)=>JSON.parse(localStorage.getItem(key)!) as GameState,SAVE_KEY)}
async function placeAtExpeditionTarget(page:Page){
  const state=await saved(page);const run=state.expedition!;const siteId=run.status==='returning'?undefined:(run.siteIds[run.completed.length]??run.optionalSiteId);const world=worldFor(state);const target=siteId?world.anomalies.find((item)=>item.id===siteId)!.position:world.gate;
  await page.evaluate(({key,target})=>{const state=JSON.parse(localStorage.getItem(key)!);state.player=target;localStorage.setItem(key,JSON.stringify(state))},{key:SAVE_KEY,target});await page.reload();
}

test.beforeEach(async({page})=>{
  await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await page.getByRole('button',{name:'Прокинутися'}).click();
  await page.evaluate((key)=>{const state=JSON.parse(localStorage.getItem(key)!);state.tutorial.step='done';localStorage.setItem(key,JSON.stringify(state))},SAVE_KEY);await page.reload();
});

test('plays a complete repeatable contract and saves its authored report',async({page})=>{
  await page.getByTestId('contracts-button').click();
  const start=page.getByRole('button',{name:/Вирушити/}).first();
  await expect(start).toBeDisabled();
  await page.locator('[data-tool="mend"]').click();await page.locator('[data-tool="reveal"]').click();
  await expect(start).toBeEnabled();await start.click();
  await expect(page.locator('[data-expedition-objective]')).toContainText('0/3');

  for(let step=1;step<=3;step++){
    await placeAtExpeditionTarget(page);await page.keyboard.press('f');
    await expect(page.getByText('Як виконати роботу?')).toBeVisible();
    await page.locator('.work-choice').first().click();
    if(step<3)await expect(page.locator('[data-expedition-objective]')).toContainText(`${step}/3`);
  }
  await expect(page.getByText('Повертатися чи піти за слабким сигналом?')).toBeVisible();
  await page.getByRole('button',{name:'Повернутися зараз'}).click();
  await expect(page.locator('[data-expedition-objective]')).toContainText('Поверніться до воріт');
  await placeAtExpeditionTarget(page);await page.keyboard.press('e');
  await expect(page.getByText('ЗВІТ ЗБЕРЕЖЕНО У ЩОДЕННИКУ')).toBeVisible();
  await page.getByRole('button',{name:'Повернутися до Притулку'}).click();
  await page.getByTestId('journal-button').click();
  await expect(page.getByText('Звіти експедицій')).toBeVisible();
  expect((await saved(page)).expeditionMeta?.completedContracts).toBe(1);
});
