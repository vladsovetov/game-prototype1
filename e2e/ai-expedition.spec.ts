import { expect, test } from '@playwright/test';
import { worldFor } from '../src/domain/world';

const SAVE='unwritten.prototype.save.v1';
const PREF='unwritten.prototype.local-writer.v1';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    class FakeDirectorWorker{
      onmessage:((event:MessageEvent)=>void)|null=null;
      postMessage(message:{type:string;jobId:string;siteIds?:string[]}){
        if(message.type!=='generate-expedition')return;
        const siteIds=message.siteIds??[];
        const raw=JSON.stringify({
          title:'Шепіт у водогоні',situation:'зникнення',mood:'тиха-тривога',palette:'мідь-мох',
          cause:'Хтось щоночі перенаправляє воду до старого саду.',
          siteNotes:siteIds.map((siteId,index)=>({siteId,observation:[
            'Помпа тепла, хоча давно не працює.','Під корінням чути рівний потік.','На покажчику з’явилася свіжа риска.','Одна грядка вкрита росою.',
          ][index]??'Тут є свіжий слід роботи.'})),
          optionalLead:'За садом видно відблиск прихованого бака.',warning:'Негода швидко наближається.',
          rareFind:'мідний жетон водника',visualTags:['мідь','мох','вода'],
        });
        const delay=Number(localStorage.getItem('test.director-delay')??(window as unknown as {__directorDelay?:number}).__directorDelay??40);
        setTimeout(()=>this.onmessage?.({data:{type:'complete-expedition',jobId:message.jobId,raw}} as MessageEvent),delay);
      }
      terminate(){}
    }
    Object.defineProperty(window,'Worker',{value:FakeDirectorWorker,configurable:true});
  });
  await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();
  await page.getByRole('button',{name:'Прокинутися'}).click();
  await page.evaluate(({save,pref})=>{const state=JSON.parse(localStorage.getItem(save)!);state.tutorial.step='done';state.storyArc.source='local-model';localStorage.setItem(save,JSON.stringify(state));localStorage.setItem(pref,'enabled')},{save:SAVE,pref:PREF});
  await page.reload();
});

test('weaves a local AI expedition into the HUD and field evidence without blocking play',async({page})=>{
  await page.getByTestId('contracts-button').click();
  await page.locator('[data-tool="mend"]').click();await page.locator('[data-tool="reveal"]').click();
  await page.getByRole('button',{name:/Вирушити/}).first().click();

  await expect(page.locator('[data-expedition-objective]')).toContainText('Шепіт у водогоні');
  const state=await page.evaluate((key)=>JSON.parse(localStorage.getItem(key)!),SAVE);
  expect(state.expedition.narrative.source).toBe('local-model');
  expect(state.expedition.narrative.siteNotes).toHaveLength(4);

  const siteId=state.expedition.siteIds[0];
  const target=worldFor(state).anomalies.find((site)=>site.id===siteId)!.position;
  await page.evaluate(({key,target})=>{const state=JSON.parse(localStorage.getItem(key)!);state.player=target;localStorage.setItem(key,JSON.stringify(state))},{key:SAVE,target});
  await page.reload();await page.keyboard.press('f');
  await expect(page.getByText(state.expedition.narrative.siteNotes[0].observation)).toBeVisible();
});

test('refreshes an open risk decision when the local AI answer arrives late',async({page})=>{
  await page.evaluate(()=>{(window as unknown as {__directorDelay?:number}).__directorDelay=2400});
  await page.getByTestId('contracts-button').click();
  await page.locator('[data-tool="mend"]').click();await page.locator('[data-tool="reveal"]').click();
  await page.getByRole('button',{name:/Вирушити/}).first().click();

  for(let step=0;step<3;step++){
    const state=await page.evaluate((key)=>JSON.parse(localStorage.getItem(key)!),SAVE);
    const siteId=state.expedition.siteIds[state.expedition.completed.length];
    const target=worldFor(state).anomalies.find((site)=>site.id===siteId)!.position;
    await page.evaluate(({key,target})=>{const state=JSON.parse(localStorage.getItem(key)!);state.player=target;localStorage.setItem(key,JSON.stringify(state))},{key:SAVE,target});
    await page.reload();await page.keyboard.press('f');await page.locator('.work-choice').first().click();
  }

  await expect(page.getByText('За садом видно відблиск прихованого бака.')).toBeVisible({timeout:5000});
  await expect(page.locator('.decision-warning')).toContainText('Негода швидко наближається.');
});

test('resumes local generation after a reload interrupts an expedition request',async({page})=>{
  await page.evaluate(()=>localStorage.setItem('test.director-delay','5000'));
  await page.getByTestId('contracts-button').click();
  await page.locator('[data-tool="mend"]').click();await page.locator('[data-tool="reveal"]').click();
  await page.getByRole('button',{name:/Вирушити/}).first().click();
  await expect(page.locator('[data-expedition-objective]')).not.toContainText('Шепіт у водогоні');

  await page.evaluate(()=>localStorage.setItem('test.director-delay','40'));
  await page.reload();

  await expect(page.locator('[data-expedition-objective]')).toContainText('Шепіт у водогоні');
  const state=await page.evaluate((key)=>JSON.parse(localStorage.getItem(key)!),SAVE);
  expect(state.expedition.narrative.source).toBe('local-model');
});
