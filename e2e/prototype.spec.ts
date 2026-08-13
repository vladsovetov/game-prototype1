import { expect,test } from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload()});
test('generates a character and opens the journal',async({page})=>{await page.getByRole('button',{name:'Surprise Me'}).click();await expect(page.getByTestId('player-name')).toBeVisible();await page.getByTestId('journal-button').click();await expect(page.getByRole('heading',{name:'Field journal'})).toBeVisible()});
test('keeps invalid import editable and accepts Morrow',async({page})=>{await page.getByRole('button',{name:'Import Character'}).click();const box=page.getByRole('textbox');await box.fill('{}');await page.getByRole('button',{name:'Bring character into the world'}).click();await expect(page.getByTestId('import-errors')).toBeVisible();await box.fill(JSON.stringify({version:1,name:'Morrow',description:'A porcelain fox that remembers vanished roads.',appearance:{body:'fox',material:'porcelain',palette:'dusk',mark:'map-lines'},gift:'reveal',burden:'fragile',quirk:'moon-touched'}));await page.getByRole('button',{name:'Bring character into the world'}).click();await expect(page.getByTestId('player-name')).toHaveText('Morrow')});
test('persists a generated character across reload',async({page})=>{await page.getByRole('button',{name:'Surprise Me'}).click();const name=await page.getByTestId('player-name').textContent();await page.reload();await expect(page.getByTestId('player-name')).toHaveText(name??'')});
test('completes a compound reaction and plants its memory',async({page})=>{
 await page.getByRole('button',{name:'Import Character'}).click();
 await page.getByRole('textbox').fill(JSON.stringify({version:1,name:'Morrow',description:'A porcelain fox that remembers vanished roads.',appearance:{body:'fox',material:'porcelain',palette:'dusk',mark:'map-lines'},gift:'reveal',burden:'fragile',quirk:'moon-touched'}));
 await page.getByRole('button',{name:'Bring character into the world'}).click();
 await page.evaluate(()=>{const key='unwritten.prototype.save.v1',s=JSON.parse(localStorage.getItem(key)!);s.player={x:1700,y:280};localStorage.setItem(key,JSON.stringify(s))});await page.reload();await page.keyboard.press('f');
 await page.evaluate(()=>{const key='unwritten.prototype.save.v1',s=JSON.parse(localStorage.getItem(key)!);s.borrowedGift='mend';localStorage.setItem(key,JSON.stringify(s))});await page.reload();await page.keyboard.press('f');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('unwritten.prototype.save.v1')!).seeds)).toContain('waypost');
 await page.evaluate(()=>{const key='unwritten.prototype.save.v1',s=JSON.parse(localStorage.getItem(key)!);s.player={x:230,y:300};localStorage.setItem(key,JSON.stringify(s))});await page.reload();await page.keyboard.press('e');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('unwritten.prototype.save.v1')!).plantings['plot-1'])).toBe('waypost');
});
