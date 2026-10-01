import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import type { Locator } from '@playwright/test';
import type { Card, Dataset, Reading, Work } from '../src/domain/types';

declare global{interface Window{test_audio:HTMLAudioElement[]}}
declare global{interface Window{share_texts:string[];share_rotations:number[]}}

async function choose_option(control:Locator,label:string){
  await control.click();
  await control.page().getByRole('option',{name:label,exact:true}).click();
}

test('oil painting share composer exports one, three and ten cards with selectable ordered components',async({page,request,context},info)=>{
  const catalog:{items:Card[]}=await (await request.get('/api/v1/cards')).json();
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/cards');await expect(page.locator('.library-card')).toHaveCount(78);
  for(const count of [1,3,10]){
    const now=new Date().toISOString(),record:Reading={
      id:`share-${count}`,session_id:`session-${count}`,source:'offline',mode:count===3?'situation_obstacle_advice':'free',
      deck_id:'provided-deck-v1',dataset_version:'2026.09.30.4',created_at:now,local_date:now.slice(0,10),timezone:'Asia/Shanghai',
      question:'PRIVATE_QUESTION_MARKER：我如何回应当前的变化？',notes:'PRIVATE_NOTE_MARKER：保留给自己的想法。\n'+'把时间留给需要的事。'.repeat(70),
      settings_snapshot:{reversed_enabled:true,reversed_probability:50},
      cards:catalog.items.slice(0,count).map((card,index)=>({card,slot_id:`share-slot-${index}`,position:count===3?['现状','阻碍','建议'][index]:`第 ${index+1} 张`,is_reversed:index%2===1})),
      revealed:Array.from({length:count},(_,index)=>`share-slot-${index}`),
    };
    await page.evaluate(async record=>new Promise<void>((resolve,reject)=>{
      const request=indexedDB.open('paper-tarot',1);request.onsuccess=()=>{
        const db=request.result,tx=db.transaction('readings','readwrite'),store=tx.objectStore('readings');store.clear();store.put(record,record.id);
        tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
      };request.onerror=()=>reject(request.error);
    }),record);
    await page.goto('/history');await page.locator('.history-main').click();
    await page.getByRole('button',{name:'导出分享图',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'带走这次相遇'});
    await expect(dialog.getByRole('checkbox',{name:/^包含我的问题/})).not.toBeChecked();
    await expect(dialog.getByRole('checkbox',{name:/^包含笔记/})).not.toBeChecked();
    if(count===1)await expect(dialog.getByRole('checkbox',{name:/^牌阵综合解读/})).toBeDisabled();
    await page.evaluate(()=>{
      window.share_texts=[];window.share_rotations=[];
      const fill=CanvasRenderingContext2D.prototype.fillText,rotate=CanvasRenderingContext2D.prototype.rotate;
      CanvasRenderingContext2D.prototype.fillText=function(value,x,y,width){window.share_texts.push(value);if(width===undefined)fill.call(this,value,x,y);else fill.call(this,value,x,y,width);};
      CanvasRenderingContext2D.prototype.rotate=function(angle){window.share_rotations.push(angle);rotate.call(this,angle);};
    });
    await dialog.getByRole('button',{name:'生成预览',exact:true}).click();
    const preview=dialog.getByRole('img',{name:'分享图预览'});await expect(preview).toBeVisible();
    const dimensions=await preview.evaluate((el:HTMLImageElement)=>({width:el.naturalWidth,height:el.naturalHeight}));
    expect(dimensions.width).toBe(1200);expect(dimensions.height).toBeGreaterThan(900);expect(dimensions.height).toBeLessThan(13000);
    const rendered=await page.evaluate(()=>window.share_texts.join('\n'));
    expect(rendered).not.toContain('PRIVATE_QUESTION_MARKER');expect(rendered).not.toContain('PRIVATE_NOTE_MARKER');
    expect(rendered).toContain('牌中的提醒');
    for(const picked of record.cards)expect(rendered).toContain(picked.card.name_zh);
    expect(await page.evaluate(()=>window.share_rotations.filter(angle=>angle===Math.PI).length)).toBe(Math.floor(count/2));
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBeTruthy();
    const download=page.waitForEvent('download');await dialog.getByRole('link',{name:'下载 PNG'}).click();
    await (await download).saveAs(`test-results/share-oil-${count}-${info.project.name}.png`);
    if(count===3){
      await dialog.getByRole('textbox',{name:'分享图标题'}).fill('此刻的内在旅程');
      await dialog.getByRole('textbox',{name:'分享图落款'}).fill('秋日 · 私人手记');
      await choose_option(dialog.getByRole('combobox',{name:'分享图色调'}),'勃艮第红 · 油画');
      await choose_option(dialog.getByRole('combobox',{name:'分享图排布'}),'手稿长卷');
      for(const name of ['包含我的问题','包含笔记','牌位解读','牌阵综合解读','行动建议'])await dialog.getByRole('checkbox',{name:new RegExp(`^${name}`)}).check();
      await dialog.getByRole('checkbox',{name:/^核心牌义/}).uncheck();await dialog.getByRole('checkbox',{name:'显示日期',exact:true}).uncheck();
      for(let i=0;i<5;i++)await dialog.getByRole('button',{name:'上移包含我的问题',exact:true}).click();
      await expect(dialog.locator('.share-module.enabled').first()).toHaveAttribute('data-module','question');
      await expect(dialog.getByRole('link',{name:'下载 PNG'})).toHaveCount(0);
      await page.evaluate(()=>{window.share_texts=[];window.share_rotations=[];});
      await dialog.getByRole('button',{name:'生成预览',exact:true}).click();await expect(preview).toBeVisible();
      const changed=await page.evaluate(()=>window.share_texts.join('\n'));
      expect(changed).toContain('此刻的内在旅程');expect(changed).toContain('秋日 · 私人手记');
      expect(changed).toContain('PRIVATE_QUESTION_MARKER');expect(changed).toContain('PRIVATE_NOTE_MARKER');
      expect(changed).toContain('牌阵综合解读');expect(changed).toContain('可以实践的一步');expect(changed).not.toContain('牌中的提醒');expect(changed).not.toContain(record.local_date);
      expect(changed.indexOf('我此刻的问题')).toBeLessThan(changed.indexOf('本次相遇的牌'));
      const custom=page.waitForEvent('download');await dialog.getByRole('link',{name:'下载 PNG'}).click();await (await custom).saveAs(`test-results/share-custom-${info.project.name}.png`);
      await dialog.getByRole('button',{name:'关闭',exact:true}).focus();await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('link',{name:'下载 PNG'})).toBeFocused();
      await page.screenshot({path:`test-results/share-composer-${info.project.name}.png`,animations:'disabled'});
    }
    if(count===10){
      await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
      await dialog.getByRole('checkbox',{name:/^卡牌画廊/}).uncheck();await dialog.getByRole('checkbox',{name:/^核心牌义/}).uncheck();
      await expect(dialog.getByRole('button',{name:'生成预览',exact:true})).toBeDisabled();
      await dialog.getByRole('checkbox',{name:/^包含笔记/}).check();
      await context.setOffline(true);await dialog.getByRole('button',{name:'生成预览',exact:true}).click();await expect(preview).toBeVisible();await context.setOffline(false);
    }
    await dialog.getByRole('button',{name:'关闭',exact:true}).click();
    await page.getByRole('button',{name:'导出分享图',exact:true}).click();
    await expect(page.getByRole('checkbox',{name:/^包含我的问题/})).not.toBeChecked();await expect(page.getByRole('checkbox',{name:/^包含笔记/})).not.toBeChecked();
    await page.getByRole('button',{name:'关闭',exact:true}).click();
  }
  expect(errors).toEqual([]);
});

test('glass dropdowns filter cards, preserve modal focus and apply setup and history choices',async({page},info)=>{
  await page.goto('/cards');
  const category=page.getByRole('combobox',{name:'卡牌类别'}),suit=page.getByRole('combobox',{name:'卡牌花色'});
  await category.focus();await category.press('ArrowDown');
  await expect(page.getByRole('option',{name:'全部类别'})).toHaveAttribute('aria-selected','true');
  await category.press('End');await category.press('Enter');
  await expect(category).toHaveText('小阿尔卡那');
  await expect(page.locator('.library-card')).toHaveCount(56);
  await choose_option(suit,'星币');await expect(page.locator('.library-card')).toHaveCount(14);
  await suit.click();await expect(page.getByRole('listbox',{name:'卡牌花色'})).toBeVisible();
  await page.getByRole('textbox',{name:'搜索卡牌'}).click();
  await expect(suit).toHaveAttribute('aria-expanded','false');
  await page.getByRole('button',{name:'全站卡牌查询'}).click();
  const dialog=page.getByRole('dialog',{name:'寻找一张牌'}),filter=dialog.getByRole('combobox',{name:'卡牌类别'});
  await filter.click();
  const menu=page.getByRole('listbox',{name:'卡牌类别'});
  await expect(menu).toBeInViewport({ratio:1});
  expect(await menu.evaluate(el=>getComputedStyle(el).backdropFilter)).not.toBe('none');
  await page.screenshot({path:`test-results/glass-dropdown-${info.project.name}.png`,animations:'disabled'});
  await filter.press('Escape');await expect(menu).not.toBeVisible();await expect(dialog).toBeVisible();
  await filter.press('Enter');await filter.press('ArrowDown');await filter.press('Enter');
  await expect(dialog.locator('.library-card')).toHaveCount(22);await expect(filter).toBeFocused();
  await filter.press('Tab');await expect(dialog.getByRole('combobox',{name:'卡牌花色'})).toBeFocused();
  await filter.focus();await filter.press('Escape');await expect(dialog).not.toBeVisible();

  await page.goto('/draw');await page.getByRole('button',{name:/自由探索/}).click();
  const count=page.getByRole('combobox',{name:'抽取数量'});
  await count.focus();await count.press('End');
  await expect(page.getByRole('option',{name:'10 张',exact:true})).toBeInViewport({ratio:1});
  await count.press('Home');await count.press('ArrowDown');await count.press('Enter');
  await expect(count).toHaveText('2 张');
  await expect(page.locator('.setup-form')).toContainText('2 张牌');
  await page.goto('/history');
  const history=page.getByRole('combobox',{name:'历史模式'});
  await choose_option(history,'每日一牌');await expect(history).toHaveText('每日一牌');
  await choose_option(history,'自由探索');await expect(history).toHaveText('自由探索');
  await choose_option(history,'所有记录');await expect(history).toHaveText('所有记录');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});

async function click_fan_card(card:Locator){
  // Pick the exposed outer corner in the card's rotated coordinate system.
  await card.evaluate(el=>el.closest('.selection-deck')?.scrollIntoView({block:'center'}));
  const position=await card.evaluate(button=>{
    const style=getComputedStyle(button),origin=style.transformOrigin.split(' ').map(parseFloat);
    const point=new DOMPoint(2-origin[0],3-origin[1]).matrixTransform(new DOMMatrix(style.transform));
    const parent=button.parentElement!.getBoundingClientRect();
    return {x:parent.left+origin[0]+point.x,y:parent.top+origin[1]+point.y};
  });
  await card.page().mouse.click(position.x,position.y);
}

test('card library switches meaning detail independently and opens every card in concise mode',async({page,request},info)=>{
  const card:Card=await (await request.get('/api/v1/cards/major_fool')).json();
  expect(card.meaning_details).toBeDefined();
  expect(card.meaning_source).toBeDefined();
  const details=card.meaning_details!;
  await page.goto('/cards');
  await page.locator('.library-card').first().click();
  const modal=page.getByRole('dialog',{name:'愚者',exact:true});
  const detail=modal.locator('.card-detail');
  const modes=detail.getByRole('group',{name:'释义详细程度'});
  const directions=detail.getByRole('group',{name:'牌面方向'});
  await expect(modes.getByRole('button',{name:'精简释义'})).toHaveAttribute('aria-pressed','true');
  await expect(detail.locator('.meaning-text')).toHaveText(card.meaning_upright);
  await expect(detail.locator('.meaning-sections')).toHaveCount(0);
  await directions.getByRole('button',{name:'逆位牌义'}).click();
  await expect(detail.locator('.meaning-text')).toHaveText(card.meaning_reversed);
  await modes.getByRole('button',{name:'完整释义'}).click();
  await expect(modes.getByRole('button',{name:'完整释义'})).toHaveAttribute('aria-pressed','true');
  await expect(directions.getByRole('button',{name:'逆位牌义'})).toHaveAttribute('aria-pressed','true');
  await expect(detail.locator('.detail-art img')).toHaveClass('reversed');
  await expect(detail.locator('.meaning-sections section')).toHaveCount(6);
  await expect(detail.getByRole('heading',{name:'传统牌面象征',exact:true})).toBeVisible();
  await expect(detail.locator('.meaning-sections section').nth(2).locator('p')).toHaveText(details.reversed.general);
  await directions.getByRole('button',{name:'正位牌义'}).click();
  await expect(modes.getByRole('button',{name:'完整释义'})).toHaveAttribute('aria-pressed','true');
  await expect(detail.locator('.meaning-sections section').nth(2).locator('p')).toHaveText(details.upright.general);
  expect(await modal.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBeTruthy();
  await modal.screenshot({path:`test-results/full-meaning-${info.project.name}.png`,animations:'disabled'});
  const artwork=detail.locator('.detail-art');
  const artwork_before=(await artwork.boundingBox())!;
  const header_before=(await modal.locator('.modal-header').boundingBox())!;
  const source=detail.locator('.meaning-source a');
  await source.scrollIntoViewIfNeeded();
  await expect(source).toBeVisible();
  await expect(source).toHaveAttribute('href',card.meaning_source!.url);
  await expect(source).toHaveAttribute('rel','noopener noreferrer');
  await expect(modal.getByRole('button',{name:'关闭',exact:true})).toBeInViewport({ratio:1});
  if(info.project.name==='desktop'){
    expect(await detail.locator('.detail-copy').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    expect(await modal.evaluate(el=>el.scrollTop)).toBe(0);
    expect((await artwork.boundingBox())!.y).toBeCloseTo(artwork_before.y,1);
    expect((await modal.locator('.modal-header').boundingBox())!.y).toBeCloseTo(header_before.y,1);
    await expect(artwork).toBeInViewport({ratio:1});
  }
  await modal.screenshot({path:`test-results/full-meaning-bottom-${info.project.name}.png`,animations:'disabled'});
  await modes.getByRole('button',{name:'精简释义'}).click();
  await expect(directions.getByRole('button',{name:'正位牌义'})).toHaveAttribute('aria-pressed','true');
  await expect(detail.locator('.meaning-sections')).toHaveCount(0);
  await modes.getByRole('button',{name:'完整释义'}).click();
  await modal.getByRole('button',{name:'关闭',exact:true}).click();
  await page.locator('.library-card').nth(1).click();
  await expect(page.locator('.card-detail h2')).toHaveText('魔术师');
  await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'完整释义',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'完整释义',exact:true}).click();
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await page.locator('.library-card').nth(1).click();
  await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.meaning-sections')).toHaveCount(0);
});

test('desktop card details fit a short window and return to the searchable library',async({page},info)=>{
  test.skip(info.project.name==='mobile','Desktop has a fixed artwork column.');
  await page.setViewportSize({width:1440,height:500});
  await page.goto('/');
  await page.getByRole('button',{name:'全站卡牌查询',exact:true}).click();
  await page.getByRole('textbox',{name:'搜索卡牌',exact:true}).fill('星币十');
  await page.locator('.modal .library-card').click();
  const modal=page.getByRole('dialog',{name:'星币十',exact:true});
  await modal.getByRole('button',{name:'完整释义',exact:true}).click();
  const artwork=modal.locator('.detail-art');
  const before=(await artwork.boundingBox())!;
  await modal.locator('.meaning-source a').scrollIntoViewIfNeeded();
  await expect(modal.locator('.meaning-source a')).toBeVisible();
  const after=(await artwork.boundingBox())!;
  const panel=(await modal.boundingBox())!;
  expect(after.y).toBeCloseTo(before.y,1);
  expect(after.y+after.height).toBeLessThan(panel.y+panel.height);
  await expect(artwork).toBeInViewport({ratio:1});
  await modal.screenshot({path:`test-results/fixed-artwork-short-${info.project.name}.png`,animations:'disabled'});
  await modal.getByRole('button',{name:'返回搜索',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'寻找一张牌',exact:true})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'搜索卡牌',exact:true})).toHaveValue('星币十');
  await page.getByRole('textbox',{name:'搜索卡牌',exact:true}).fill('');
  await expect(page.locator('.modal .library-card')).toHaveCount(78);
  await page.getByRole('textbox',{name:'搜索卡牌',exact:true}).fill('星币十');
  await expect(page.locator('.modal .library-card')).toHaveCount(1);
  await page.locator('.modal .library-card').click();
  await expect(page.getByRole('dialog',{name:'星币十',exact:true})).toBeVisible();
});

test('older card data falls back to concise meanings when full details or browser storage are unavailable',async({page,request})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage is blocked','SecurityError');}}));
  const manifest=await (await request.get('/api/v1/resources/manifest')).json();
  const dataset:Dataset=await (await request.get(manifest.dataset_url)).json();
  for(const card of dataset.cards){delete card.meaning_details;delete card.meaning_source;}
  const body=JSON.stringify(dataset),item=manifest.items.find((item:{url:string})=>item.url===manifest.dataset_url);
  manifest.total_bytes+=Buffer.byteLength(body)-item.bytes;
  item.bytes=Buffer.byteLength(body);item.sha256=createHash('sha256').update(body).digest('hex');
  // An older published bundle still needs its matching integrity manifest.
  await page.route('**/api/v1/resources/manifest',route=>route.fulfill({json:manifest}));
  await page.route('**/media/**/dataset-*.json',route=>route.fulfill({body,contentType:'application/json'}));
  await page.goto('/cards');
  await page.locator('.library-card').first().click();
  await page.getByRole('button',{name:'完整释义',exact:true}).click();
  await expect(page.getByText('此卡暂无完整释义，先查看精简牌义。', {exact:true})).toBeVisible();
  await expect(page.locator('.meaning-text')).not.toBeEmpty();
  await page.getByRole('button',{name:'逆位牌义',exact:true}).click();
  await expect(page.getByRole('button',{name:'完整释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await page.locator('.library-card').nth(1).click();
  await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'完整释义',exact:true}).click();
  await expect(page.getByText('此卡暂无完整释义，先查看精简牌义。', {exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('confirmed readings keep all cards and flip controls on the first screen before and after reveal',async({page,request},info)=>{
  const catalog:{items:Card[]}=await (await request.get('/api/v1/cards')).json();
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/cards');await expect(page.locator('.library-card')).toHaveCount(78);
  if(info.project.name==='desktop')await page.setViewportSize({width:1440,height:650});
  for(const count of [1,3,6,10]){
    const now=new Date().toISOString();
    const record:Reading={
      id:`screen-reading-${count}`,session_id:`screen-session-${count}`,source:'offline',mode:'free',
      deck_id:'provided-deck-v1',dataset_version:'2026.09.30.4',created_at:now,local_date:now.slice(0,10),timezone:'Asia/Shanghai',
      question:count===6?'想从这次探索中获得什么提醒？'.repeat(12):'',notes:'',
      settings_snapshot:{reversed_enabled:true,reversed_probability:50},
      cards:catalog.items.slice(0,count).map((card,index)=>({card,slot_id:`screen-${index}`,position:`第 ${index+1} 张`,is_reversed:index%2===1})),revealed:[],
    };
    const work:Work={
      session_id:record.session_id,request_id:`screen-request-${count}`,source:record.source,dataset_version:record.dataset_version,
      deck_id:record.deck_id,mode:record.mode,count,settings_snapshot:record.settings_snapshot,created_at:now,
      slots:catalog.items.map((card,index)=>({slot_id:`screen-${index}`,card_id:card.id,is_reversed:index%2===1})),
      selected:record.cards.map(card=>card.slot_id),phase:'revealing',question:record.question,reading_id:record.id,group:0,
    };
    await page.evaluate(async({record,work})=>new Promise<void>((resolve,reject)=>{
      const request=indexedDB.open('paper-tarot',1);
      request.onsuccess=()=>{
        const db=request.result,tx=db.transaction(['readings','meta'],'readwrite');
        tx.objectStore('readings').put(record,record.id);tx.objectStore('meta').put(work,'work');
        tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
      };request.onerror=()=>reject(request.error);
    }),{record,work});
    await page.goto('/draw');await expect(page.locator('.reading-card')).toHaveCount(count);
    await expect(page.locator('.reading-guidance')).toHaveCount(0);
    await expect(page.locator('.reading-stage')).toBeInViewport({ratio:1});
    await expect(page.getByRole('button',{name:'选择抽牌模式',exact:true})).toBeInViewport({ratio:1});
    await expect(page.getByRole('button',{name:'全部翻开',exact:true})).toBeInViewport({ratio:1});
    expect(await page.evaluate(()=>scrollY)).toBeLessThan(2);
    await page.screenshot({path:`test-results/reading-first-screen-${count}-${info.project.name}.png`,animations:'disabled'});
    if(count===3){
      await page.getByRole('button',{name:'翻开第 1 张',exact:true}).click();
      await expect(page.locator('.card-guidance')).toHaveCount(1);
      await expect(page.locator('.reading-guidance')).toContainText(record.cards[0].card.name_zh);
      await expect(page.locator('.reading-guidance')).not.toContainText(record.cards[1].card.name_zh);
      await expect(page.getByRole('region',{name:'牌阵综合解读'})).toHaveCount(0);
    }
    await page.getByRole('button',{name:'全部翻开',exact:true}).click();
    await expect(page.locator('.flip-card.is-flipped')).toHaveCount(count);
    await expect(page.locator('.reading-stage')).toBeInViewport({ratio:1});
    for(const card of await page.locator('.flip-card').all())await expect(card).toBeInViewport({ratio:1});
    for(const button of await page.getByRole('button',{name:'查看牌义',exact:true}).all())await expect(button).toBeInViewport({ratio:1});
    expect(await page.evaluate(()=>scrollY)).toBeLessThan(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    if(info.project.name==='mobile'){
      const bottom=await page.locator('.reading-stage').evaluate(el=>el.getBoundingClientRect().bottom);
      const nav=await page.locator('.mobile-nav').boundingBox();expect(bottom).toBeLessThan(nav!.y);
    }
    await page.screenshot({path:`test-results/reading-revealed-${count}-${info.project.name}.png`,animations:'disabled'});
    if(count===10&&info.project.name==='desktop'){
      await page.setViewportSize({width:1000,height:700});
      await expect(page.locator('.reading-stage')).toBeInViewport({ratio:1});
      for(const card of await page.locator('.flip-card').all())await expect(card).toBeInViewport({ratio:1});
      expect(await page.evaluate(()=>scrollY)).toBeLessThan(2);
      await page.setViewportSize({width:1440,height:650});
      await expect(page.locator('.reading-stage')).toBeInViewport({ratio:1});
    }
    await page.getByRole('button',{name:'查看牌义',exact:true}).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'关闭',exact:true}).click();
    await expect(page.locator('.card-guidance')).toHaveCount(count);
    const first=page.locator('.card-guidance').first();
    await expect(first).toContainText(record.cards[0].card.meaning_details!.upright.general);
    await expect(first).toContainText(record.cards[0].card.meaning_details!.upright.advice);
    await first.locator('summary').click();
    await expect(first.getByText(record.cards[0].card.meaning_details!.symbolism,{exact:true})).toBeVisible();
    await expect(first.getByText(record.cards[0].card.meaning_details!.upright.love,{exact:true})).toBeVisible();
    if(count>1)await expect(page.locator('.card-guidance').nth(1)).toContainText(record.cards[1].card.meaning_details!.reversed.general);
    if(count===3){
      await first.evaluate(el=>el.scrollIntoView({block:'start'}));
      await page.screenshot({path:`test-results/detailed-guidance-${info.project.name}.png`,animations:'disabled'});
    }
  }
  expect(errors).toEqual([]);
});

test('old drawn and historic cards open current full meanings without changing their saved results',async({page,request},info)=>{
  const catalog:{items:Card[]}=await (await request.get('/api/v1/cards')).json();
  const ids=['major_strength','cups_king','major_empress'];
  const current=ids.map(id=>catalog.items.find(card=>card.id===id)!);
  const now=new Date().toISOString();
  const record:Reading={
    id:'legacy-reading',session_id:'legacy-session',source:'offline',
    mode:'situation_obstacle_advice',deck_id:'provided-deck-v1',dataset_version:'2026.09.30.4',
    created_at:now,local_date:now.slice(0,10),timezone:'Asia/Shanghai',question:'旧记录的问题',notes:'旧记录的笔记',
    settings_snapshot:{reversed_enabled:true,reversed_probability:50},
    cards:current.map((card,index)=>{
      const legacy={...card,meaning_upright:`旧版正位摘要 ${card.name_zh}`,meaning_reversed:`旧版逆位摘要 ${card.name_zh}`,meaning_version:'1'};
      delete legacy.meaning_details;delete legacy.meaning_source;
      return {card:legacy,slot_id:`picked-${index}`,position:['现状','阻碍','建议'][index],is_reversed:index===1};
    }),revealed:['picked-0','picked-1','picked-2'],
  };
  const work:Work={
    session_id:record.session_id,request_id:'legacy-request',source:record.source,
    dataset_version:record.dataset_version,deck_id:record.deck_id,mode:record.mode,count:3,
    settings_snapshot:record.settings_snapshot,created_at:record.created_at,
    slots:[...current,...catalog.items.filter(card=>!ids.includes(card.id))].map((card,index)=>({slot_id:`picked-${index}`,card_id:card.id,is_reversed:index===1})),
    selected:record.revealed,phase:'revealing',question:record.question,reading_id:record.id,group:0,
  };
  await page.goto('/cards');
  await expect(page.locator('.library-card')).toHaveCount(78);
  await page.evaluate(async({record,work})=>{
    await new Promise<void>((resolve,reject)=>{
      const request=indexedDB.open('paper-tarot',1);
      request.onsuccess=()=>{
        const db=request.result,tx=db.transaction(['readings','meta'],'readwrite');
        tx.objectStore('readings').put(record,record.id);tx.objectStore('meta').put(work,'work');
        tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
      };
      request.onerror=()=>reject(request.error);
    });
  },{record,work});
  await page.goto('/draw');
  await expect(page.locator('.reading-card')).toHaveCount(3);
  const interpretation=page.getByRole('region',{name:'牌阵综合解读'});
  await expect(interpretation).toContainText('现状位置的力量（正位）');
  await expect(interpretation).toContainText('阻碍位置的圣杯国王（逆位）');
  await expect(interpretation).toContainText('建议位置的女皇（正位）');
  await expect(interpretation).toContainText(current[2].meaning_details!.upright.advice);
  for(const card of current){
    await page.getByRole('button',{name:`查看${card.name_zh}`,exact:true}).click();
    await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.meaning-text')).toHaveText(card.meaning_upright);
    await page.getByRole('button',{name:'完整释义',exact:true}).click();
    await expect(page.locator('.meaning-sections section')).toHaveCount(6);
    await expect(page.locator('.meaning-sections section').nth(2).locator('p')).toHaveText(card.meaning_details!.upright.general);
    await page.getByRole('button',{name:'逆位牌义',exact:true}).click();
    await expect(page.locator('.meaning-sections section').nth(2).locator('p')).toHaveText(card.meaning_details!.reversed.general);
    if(card.id==='major_strength')await page.getByRole('dialog').screenshot({path:`test-results/drawn-full-meaning-${info.project.name}.png`,animations:'disabled'});
    await page.getByRole('button',{name:'关闭',exact:true}).click();
  }
  await expect(page.locator('.reading-copy').first()).toContainText('旧版正位摘要 力量');
  await expect(page.getByRole('textbox',{name:'我的笔记'})).toHaveValue(record.notes);
  await page.getByRole('button',{name:'查看牌义',exact:true}).first().click();
  await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'完整释义',exact:true}).click();
  await expect(page.locator('.meaning-sections section')).toHaveCount(6);
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  const nav=page.locator('.site-header nav:visible, .mobile-nav:visible');
  await nav.getByRole('button',{name:/记录/}).click();
  await page.locator('.history-main').click();
  await expect(interpretation).toBeVisible();
  await page.getByRole('button',{name:'查看力量',exact:true}).click();
  await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'完整释义',exact:true}).click();
  await expect(page.locator('.meaning-sections section')).toHaveCount(6);
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  expect(await page.evaluate(async()=>new Promise(resolve=>{
    const request=indexedDB.open('paper-tarot',1);
    request.onsuccess=()=>{
      const db=request.result,get=db.transaction('readings').objectStore('readings').get('legacy-reading');
      get.onsuccess=()=>{db.close();resolve(get.result);};
    };
  }))).toEqual(record);
});

test('navigation compresses on pointer and keyboard press, rebounds on release and respects reduced motion',async({page},info)=>{
  await page.goto('/');
  const nav=page.locator('.site-header nav:visible, .mobile-nav:visible');
  const home=nav.getByRole('button',{name:'首页',exact:true});
  await expect(home).toHaveAttribute('aria-current','page');
  const box=(await home.boundingBox())!;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await expect(home).toHaveAttribute('data-pressed','true');
  await expect.poll(()=>home.evaluate(el=>parseFloat(getComputedStyle(el).scale))).toBeLessThan(.98);
  await nav.screenshot({path:`test-results/glass-pressed-${info.project.name}.png`});
  await page.mouse.up();
  await expect(home).not.toHaveAttribute('data-pressed','true');
  await expect.poll(()=>home.evaluate(el=>parseFloat(getComputedStyle(el).scale)),{intervals:[16,32,32,32]}).toBeGreaterThan(1.005);
  await expect.poll(()=>home.evaluate(el=>Math.abs(parseFloat(getComputedStyle(el).scale)-1))).toBeLessThan(.001);
  await home.focus();
  await page.keyboard.down('Space');
  await expect(home).toHaveAttribute('data-pressed','true');
  await page.keyboard.up('Space');
  await expect(home).not.toHaveAttribute('data-pressed','true');
  await expect.poll(()=>home.evaluate(el=>Math.abs(parseFloat(getComputedStyle(el).scale)-1))).toBeLessThan(.001);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.keyboard.down('Space');
  await expect(home).toHaveAttribute('data-pressed','true');
  await page.keyboard.up('Space');
  await expect(home).not.toHaveAttribute('data-pressed','true');
  expect(await home.evaluate(el=>el.getAnimations().length)).toBe(0);
  await expect(nav.getByRole('button',{name:/图鉴/})).toBeVisible();
  await nav.getByRole('button',{name:/图鉴/}).click();
  await expect(page.locator('.library-card')).toHaveCount(78);
  await expect(nav.getByRole('button',{name:/图鉴/})).toHaveAttribute('aria-current','page');
  await nav.getByRole('button',{name:'首页',exact:true}).click();
  await page.screenshot({path:`test-results/glass-home-${info.project.name}.png`,animations:'disabled'});
});

test('home cards flip independently to different artwork and the mobile invitation fits above the dock',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const original=window.Audio,list:HTMLAudioElement[]=[];
    Object.defineProperty(window,'test_audio',{value:list});
    window.Audio=class extends original{constructor(src?:string){super(src);list.push(this);}};
  });
  const flip_count=()=>page.evaluate(()=>window.test_audio.filter(audio=>audio.src.endsWith('/flip.wav')).length);
  await page.goto('/');
  const cards=page.locator('.hero-card');
  await expect(cards).toHaveCount(3);
  await expect(page.locator('.hero-card-name, .hero-card-hint')).toHaveCount(0);
  const star=page.locator('.sky-star').first();
  const old_position=await star.evaluate(el=>{
    const animation=el.getAnimations()[0],timing=animation.effect!.getTiming();
    const duration=Number(timing.duration),time=Number(animation.currentTime),delay=timing.delay??0;
    const cycle=Math.ceil((Math.max(0,time)-delay)/duration)+1;
    animation.currentTime=delay+duration*cycle-120;
    return (el as HTMLElement).style.left;
  });
  await expect.poll(()=>star.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeLessThan(.01);
  await expect.poll(()=>star.evaluate(el=>(el as HTMLElement).style.left)).not.toBe(old_position);
  for(let i=0;i<3;i++){
    const card=cards.nth(i),old=await card.locator('.hero-card-face img').getAttribute('src');
    const others=await cards.locator('.hero-card-face img').evaluateAll(images=>images.map(img=>(img as HTMLImageElement).getAttribute('src')));
    await card.click();
    await expect(card).toHaveAttribute('aria-busy','true');
    await expect(card).toBeDisabled();
    await expect(card).toHaveAttribute('aria-busy','false');
    await expect.poll(flip_count).toBe(i+1);
    const next=await card.locator('.hero-card-face img').getAttribute('src');
    expect(next).not.toBe(old);expect(others).not.toContain(next);
    expect(await card.locator('.hero-card-rotor').evaluate(el=>el.getAnimations().length)).toBe(0);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  const first=cards.first(),old=await first.getAttribute('aria-label');
  await first.focus();await page.keyboard.press('Enter');
  await expect(first).not.toHaveAttribute('aria-label',old!);
  await expect.poll(flip_count).toBe(4);
  await expect.poll(()=>page.evaluate(()=>window.test_audio.find(audio=>audio.src.endsWith('/flip.wav'))?.readyState??0)).toBeGreaterThanOrEqual(2);
  expect(await first.locator('.hero-card-rotor').evaluate(el=>el.getAnimations().length)).toBe(0);
  expect(await page.locator('.sky-meteor').first().evaluate(el=>getComputedStyle(el).display)).toBe('none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.screenshot({path:`test-results/night-home-${info.project.name}.png`,animations:'disabled'});
  if(info.project.name==='mobile'){
    for(const viewport of [{width:390,height:844},{width:375,height:667},{width:320,height:568}]){
      await page.setViewportSize(viewport);
      const visual=(await page.locator('.hero-visual').boundingBox())!,copy=(await page.locator('.hero-copy').boundingBox())!;
      expect(visual.y+visual.height).toBeLessThanOrEqual(copy.y);
      const dock=(await page.locator('.mobile-nav').boundingBox())!;
      const action=page.getByRole('button',{name:'开始今日探索',exact:true});
      await expect(action).toBeInViewport({ratio:1});
      const box=(await action.boundingBox())!;
      expect(box.y+box.height).toBeLessThan(dock.y);
      for(const card of await cards.all())await expect(card.locator('.hero-card-face img')).toBeInViewport({ratio:1});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`test-results/night-home-${viewport.width}.png`,animations:'disabled'});
    }
  }
  expect(errors).toEqual([]);
  const nav=page.locator('.site-header nav:visible, .mobile-nav:visible');
  await nav.getByRole('button',{name:'设置',exact:true}).click();
  await page.getByRole('switch',{name:'洗牌与翻牌音效',exact:true}).uncheck();
  await nav.getByRole('button',{name:'首页',exact:true}).click();
  await cards.first().click();
  await expect(cards.first()).toHaveAttribute('aria-busy','false');
  expect(await flip_count()).toBe(4);
  await page.getByRole('button',{name:'开始今日探索',exact:true}).click();
  await expect(page).toHaveURL(/\/draw/);
});

test('compact home entries and visible mode buttons support switching before, during and after a draw',async({page},info)=>{
  await page.goto('/');
  const entries=page.locator('.mode-card');await expect(entries).toHaveCount(4);
  for(const entry of await entries.all())expect((await entry.boundingBox())!.height).toBeLessThan(135);
  await page.locator('.mode-grid').screenshot({path:`test-results/compact-modes-${info.project.name}.png`});
  await page.goto('/draw');
  const modes=page.getByRole('group',{name:'抽牌模式',exact:true});
  await expect(modes.getByRole('button')).toHaveCount(4);
  for(const name of ['每日一牌','时间之流','内在指引','自由探索']){
    const option=modes.getByRole('button',{name:new RegExp(name)});
    await expect(option).toBeInViewport({ratio:1});await option.click();
    await expect(option).toHaveAttribute('aria-pressed','true');
    await expect(modes.locator('[aria-pressed="true"]')).toHaveCount(1);
  }
  await choose_option(page.getByRole('combobox',{name:'抽取数量'}),'2 张');
  await page.getByRole('textbox').fill('这周可以关注什么？');
  await page.locator('.draw-setup').screenshot({path:`test-results/draw-mode-picker-${info.project.name}.png`});
  await page.getByRole('button',{name:'开始洗牌',exact:true}).click();
  await expect(page.locator('.selection-deck')).toBeVisible();
  await expect(page.getByRole('heading',{name:'选出与你共鸣的 2 张牌。'})).toBeVisible();
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'更换模式',exact:true}).click();
  await expect(page.locator('.selection-deck')).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'更换模式',exact:true}).click();
  await expect(modes).toBeVisible();
  await modes.getByRole('button',{name:/时间之流/}).click();
  await page.getByRole('button',{name:'快速抽取',exact:true}).click();
  await expect(page.locator('.reading-card')).toHaveCount(3);
  await page.getByRole('button',{name:'选择抽牌模式',exact:true}).click();
  await expect(modes).toBeVisible();
  await modes.getByRole('button',{name:/自由探索/}).click();
  await choose_option(page.getByRole('combobox',{name:'抽取数量'}),'2 张');
  await page.getByRole('button',{name:'快速抽取',exact:true}).click();
  await expect(page.locator('.reading-card')).toHaveCount(2);
});

test('supplied background music loops, follows the music toggle and stays a single player across navigation',async({page})=>{
  await page.addInitScript(()=>{
    const original=window.Audio,list:HTMLAudioElement[]=[];
    Object.defineProperty(window,'test_audio',{value:list});
    window.Audio=class extends original{constructor(src?:string){super(src);list.push(this);}};
  });
  await page.goto('/');
  const music=()=>page.evaluate(()=>{
    const list=window.test_audio;
    const player=list.find(audio=>audio.src.includes('/music-'));
    return player?{loop:player.loop,paused:player.paused,duration:player.duration,time:player.currentTime,count:list.filter(audio=>audio.src.includes('/music-')).length}:null;
  });
  const nav=page.locator('.site-header nav:visible, .mobile-nav:visible');
  await nav.getByRole('button',{name:/图鉴/}).click();
  await expect.poll(async()=>(await music())?.duration).toBeGreaterThan(350);
  await expect.poll(async()=>(await music())?.paused).toBe(false);
  expect((await music())?.loop).toBe(true);
  await page.getByRole('button',{name:'关闭背景音乐',exact:true}).click();
  await expect.poll(async()=>(await music())?.paused).toBe(true);
  await page.getByRole('button',{name:'开启背景音乐',exact:true}).click();
  await expect.poll(async()=>(await music())?.paused).toBe(false);
  await page.evaluate(()=>{
    const player=window.test_audio.find(audio=>audio.src.includes('/music-'))!;
    player.volume=0;player.currentTime=player.duration-.15;
  });
  await expect.poll(async()=>(await music())?.time,{timeout:10000}).toBeLessThan(2);
  await nav.getByRole('button',{name:'设置',exact:true}).click();
  expect((await music())?.count).toBe(1);
  await page.getByRole('button',{name:'关闭背景音乐',exact:true}).click();
});

test('music and effect volume sliders apply immediately and persist after reopening',async({page},info)=>{
  await page.addInitScript(()=>{
    const original=window.Audio,list:HTMLAudioElement[]=[];
    Object.defineProperty(window,'test_audio',{value:list});
    window.Audio=class extends original{constructor(src?:string){super(src);list.push(this);}};
  });
  await page.goto('/settings');
  const music_volume=page.getByRole('slider',{name:'背景音乐音量',exact:true});
  const effects_volume=page.getByRole('slider',{name:'音效音量',exact:true});
  await expect(music_volume).toHaveValue('28');
  await expect(effects_volume).toHaveValue('55');
  await music_volume.focus();await music_volume.press('Home');
  await expect.poll(()=>page.evaluate(()=>window.test_audio.find(audio=>audio.src.includes('/music-'))?.volume)).toBe(0);
  await music_volume.press('End');await music_volume.press('ArrowLeft');
  await expect(music_volume).toHaveValue('99');
  await expect.poll(()=>page.evaluate(()=>window.test_audio.find(audio=>audio.src.includes('/music-'))?.volume)).toBe(.99);
  await effects_volume.focus();await effects_volume.press('Home');await effects_volume.press('ArrowRight');
  await expect(effects_volume).toHaveValue('1');
  await expect(effects_volume).toHaveAttribute('aria-valuetext','1%');
  const nav=page.locator('.site-header nav:visible, .mobile-nav:visible');
  await nav.getByRole('button',{name:'首页',exact:true}).click();
  await page.locator('.hero-card').first().click();
  await expect.poll(()=>page.evaluate(()=>window.test_audio.find(audio=>audio.src.endsWith('/flip.wav'))?.volume)).toBe(.01);
  await nav.getByRole('button',{name:'设置',exact:true}).click();
  await page.reload();
  await expect(music_volume).toHaveValue('99');
  await expect(effects_volume).toHaveValue('1');
  await expect.poll(()=>page.evaluate(()=>window.test_audio.find(audio=>audio.src.includes('/music-'))?.volume)).toBe(.99);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.settings-panel').filter({has:music_volume}).screenshot({path:`test-results/volume-settings-${info.project.name}.png`,animations:'disabled'});
});

test('manual selection survives global search and refresh; reveal and export', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /在纸间/ })).toBeVisible();
  await page.screenshot({ path: `test-results/home-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  await page.locator('.mode-card').nth(1).click();
  await page.getByRole('button', { name: '开始洗牌' }).click();
  await expect(page.getByRole('status')).toHaveText('将牌组分成两叠');
  await expect(page.locator('.back-card')).toHaveCount(78);
  const bridge=page.locator('.deck-handoff');
  await expect(bridge).toBeVisible();
  const arrival=await bridge.evaluate(el=>{
    const animation=el.getAnimations()[0];animation.pause();
    animation.currentTime=Number(animation.effect!.getTiming().duration)-1;
    const rect=el.getBoundingClientRect();return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};
  });
  const stack=await page.locator('.back-card').last().evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  for(const key of ['x','y','width','height'] as const)expect(Math.abs(arrival[key]-stack[key])).toBeLessThan(1);
  await page.screenshot({path:`test-results/shuffle-handoff-${info.project.name}.png`});
  await bridge.evaluate(el=>el.getAnimations()[0].play());
  await expect(bridge).toHaveCount(0);
  await expect(page.locator('.selection-deck.is-opening:not(.is-arriving)')).toBeVisible();
  expect(await page.locator('.fan-position').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('fan-open');
  await page.locator('.selection-deck').screenshot({path:`test-results/poker-opening-${info.project.name}.png`});
  await expect(page.getByRole('group',{name:'完整 78 张洗好的塔罗牌'})).toHaveAttribute('aria-busy','false');
  await expect(page.locator('.selection-deck')).toBeInViewport({ratio:1});
  await expect(page.getByRole('button',{name:'更换模式',exact:true})).toBeInViewport({ratio:1});
  await expect(page.getByRole('button',{name:'重新抽牌',exact:true})).toBeInViewport({ratio:1});
  expect(await page.evaluate(()=>scrollY)).toBeLessThan(2);
  await page.screenshot({path:`test-results/selection-first-screen-${info.project.name}.png`,animations:'disabled'});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  await click_fan_card(page.getByRole('button', { name: '牌位 1', exact: true }));
  await click_fan_card(page.getByRole('button', { name: '牌位 78', exact: true }));
  await page.screenshot({ path: `test-results/selection-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: '全站卡牌查询' }).click();
  await page.getByRole('textbox', { name: '搜索卡牌' }).fill('ＴＨＥ ＦＯＯＬ');
  await expect(page.locator('.modal .library-card')).toHaveCount(1);
  await expect.poll(()=>page.locator('.modal .library-card img').evaluate((el:HTMLImageElement)=>el.naturalHeight)).toBe(1200);
  await page.locator('.modal .library-card').click();
  await expect(page.locator('.card-detail h2')).toHaveText('愚者');
  await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'完整释义',exact:true}).click();
  await expect(page.locator('.meaning-sections section')).toHaveCount(6);
  await page.getByRole('button', { name: '返回搜索' }).click();
  await expect(page.getByRole('textbox', { name: '搜索卡牌' })).toHaveValue('ＴＨＥ ＦＯＯＬ');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('.back-card.chosen')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.back-card.chosen')).toHaveCount(2);
  await click_fan_card(page.getByRole('button', { name: '牌位 3', exact: true }));
  await page.locator('.selection-summary').evaluate(el=>el.scrollIntoView({block:'start'}));
  await page.locator('.selection-summary').screenshot({path:`test-results/selected-tray-${info.project.name}.png`,animations:'disabled'});
  await page.getByRole('button', { name: '确认选牌' }).click();
  await expect(page.locator('.reading-card')).toHaveCount(3);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(2);
  await expect(page.locator('.reading-intro h1')).toBeFocused();
  if(info.project.name==='mobile'){
    const boxes=await page.locator('.flip-card').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {y:r.y,height:r.height};}));
    expect(Math.max(...boxes.map(box=>box.y))-Math.min(...boxes.map(box=>box.y))).toBeLessThan(1);
    for(const card of await page.locator('.flip-card').all())await expect(card).toBeInViewport({ratio:1});
    await expect(page.getByRole('button',{name:'全部翻开',exact:true})).toBeInViewport({ratio:1});
  }
  await page.screenshot({path:`test-results/compact-reading-${info.project.name}.png`});
  await expect(page.getByRole('region',{name:'牌阵综合解读'})).toHaveCount(0);
  await page.getByRole('button', { name: '翻开过去' }).click();
  await expect(page.locator('.flip-card.is-flipped')).toHaveCount(1);
  await expect(page.getByRole('region',{name:'牌阵综合解读'})).toHaveCount(0);
  await page.getByRole('button', { name: '全部翻开' }).click();
  await expect(page.locator('.flip-card.is-flipped')).toHaveCount(3);
  const interpretation=page.getByRole('region',{name:'牌阵综合解读'});
  await expect(interpretation).toBeVisible();
  await expect(interpretation.getByRole('heading',{name:'牌与牌的联系'})).toBeVisible();
  const interpretation_text=await interpretation.innerText();
  await interpretation.screenshot({path:`test-results/combined-interpretation-${info.project.name}.png`,animations:'disabled'});
  await page.reload();
  await expect(interpretation).toHaveText(interpretation_text,{useInnerText:true});
  for(const face of await page.locator('.flip-front img').all()){
    await expect(face).toHaveAttribute('src', /-display-.*\.webp$/);
    await expect.poll(()=>face.evaluate((el:HTMLImageElement)=>el.naturalHeight)).toBeGreaterThanOrEqual(1200);
  }
  await page.getByRole('textbox', { name: '我的笔记' }).fill('测试：这次记录只保存在本设备。');
  await page.getByRole('button', { name: '保存笔记' }).click();
  await expect(page.getByText('笔记已保存')).toBeVisible();
  await page.getByRole('button', { name: '导出分享图' }).click();
  await expect(page.getByRole('checkbox', { name: '包含我的问题' })).not.toBeChecked();
  await page.getByRole('button', { name: '生成预览' }).click();
  await expect(page.getByRole('img', { name: '分享图预览' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载 PNG' }).click();
  await (await download).saveAs(`test-results/share-${info.project.name}.png`);
  expect(errors).toEqual([]);
});

test('daily result remains fixed after settings, history deletion and reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('.mode-card').first().click();
  await page.getByRole('button', { name: '快速抽取' }).click();
  await page.getByRole('button', { name: '全部翻开' }).click();
  await expect(page.getByRole('region',{name:'牌阵综合解读'})).toHaveCount(0);
  await expect(page.locator('.flip-card.is-flipped')).toHaveCount(1);
  const first = await page.locator('.reading-copy h3').textContent();
  const orientation = await page.locator('.reading-grid .orientation').textContent();
  const nav = page.locator('.site-header nav:visible, .mobile-nav:visible');
  await nav.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('spinbutton', { name: '逆位概率' }).fill('100');
  await nav.getByRole('button', { name: /记录/ }).click();
  await expect.poll(()=>page.locator('.history-thumbnails img').evaluate((el:HTMLImageElement)=>el.naturalHeight)).toBe(1200);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '删除记录' }).click();
  await nav.getByRole('button', { name: '抽牌', exact: true }).click();
  await expect(page.locator('.reading-copy h3')).toHaveText(first!);
  await page.reload();
  await expect(page.locator('.reading-copy h3')).toHaveText(first!);
  await expect(page.locator('.reading-grid .orientation')).toHaveText(orientation!);
  await page.clock.setSystemTime(new Date(Date.now()+86400000));
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('group',{name:'抽牌模式',exact:true})).toBeVisible();
  await nav.getByRole('button', { name: /图鉴/ }).click();
  await expect(page.locator('.library-card')).toHaveCount(78);
  await expect.poll(()=>page.locator('.library-card img').first().evaluate((el:HTMLImageElement)=>el.naturalHeight)).toBe(1200);
});

test('verified offline pack allows reopening, lookup, quick draw and export offline', async ({ page, context },info) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: '下载离线资源' }).click();
  await expect(page.getByText('核心资源已就绪 · 音频已就绪')).toBeVisible({ timeout: 45000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: '按自己的节奏，探索。' })).toBeVisible();
  await page.getByRole('button', { name: '全站卡牌查询' }).click();
  await page.getByRole('textbox', { name: '搜索卡牌' }).fill('权杖八');
  await expect(page.locator('.modal .library-card')).toHaveCount(1);
  await page.locator('.modal .library-card').click();
  await expect(page.locator('.detail-art img')).toBeVisible();
  expect(await page.locator('.detail-art img').evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('button',{name:'精简释义',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'完整释义',exact:true}).click();
  await expect(page.locator('.meaning-sections section')).toHaveCount(6);
  await expect(page.locator('.meaning-sections section').nth(2).locator('p')).not.toBeEmpty();
  await page.getByRole('button',{name:'逆位牌义',exact:true}).click();
  await expect(page.getByRole('heading',{name:'逆位解读',exact:true})).toBeVisible();
  await expect(page.locator('.meaning-source a')).toHaveAttribute('href',/^https:\/\/www\.shenpowang\.com\/taluopai\//);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  const nav = page.locator('.site-header nav:visible, .mobile-nav:visible');
  await nav.getByRole('button', { name: '首页', exact: true }).click();
  await page.locator('.mode-card').last().click();
  await choose_option(page.getByRole('combobox',{name:'抽取数量'}),'10 张');
  await page.getByRole('spinbutton', { name: '逆位概率' }).fill('100');
  await page.getByRole('button', { name: '快速抽取' }).click();
  await expect(page.locator('.reading-card')).toHaveCount(10);
  if(info.project.name==='mobile')expect((await page.locator('.reading-grid').boundingBox())!.height).toBeLessThan(1000);
  await expect(page.getByText('离线抽牌 · 已保存到本设备 · 逆位概率 100%')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  await page.getByRole('button', { name: '全部翻开' }).scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/offline-reading.png'});
  await page.getByRole('button', { name: '全部翻开' }).click();
  await expect(page.locator('.reading-grid .orientation')).toHaveText(Array(10).fill('逆位'));
  if(info.project.name==='mobile')expect((await page.locator('.reading-grid').boundingBox())!.height).toBeLessThan(1350);
  const interpretation=page.getByRole('region',{name:'牌阵综合解读'});
  await expect(interpretation).toBeVisible();
  await expect(interpretation).toContainText('没有预设的时间或因果牌位');
  await expect(interpretation).toContainText('这一组全部为逆位');
  for(const name of await page.locator('.reading-copy h3').allTextContents())await expect(interpretation).toContainText(`${name}（逆位）`);
  const combined_text=await interpretation.innerText();
  await interpretation.screenshot({path:`test-results/combined-offline-ten-${info.project.name}.png`,animations:'disabled'});
  await page.reload();
  await expect(interpretation).toHaveText(combined_text,{useInnerText:true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  await page.getByRole('button', { name: '导出分享图' }).click();
  await page.getByRole('button', { name: '生成预览' }).click();
  await expect(page.getByRole('img', { name: '分享图预览' })).toBeVisible();
  await context.setOffline(false);
});

test('two free cards show a combined explanation only after the last individual flip',async({page})=>{
  await page.goto('/');
  await page.locator('.mode-card').last().click();
  await choose_option(page.getByRole('combobox',{name:'抽取数量'}),'2 张');
  await page.getByRole('spinbutton',{name:'逆位概率'}).fill('0');
  await page.getByRole('button',{name:'快速抽取'}).click();
  await expect(page.locator('.reading-card')).toHaveCount(2);
  const interpretation=page.getByRole('region',{name:'牌阵综合解读'});
  await expect(interpretation).toHaveCount(0);
  await page.getByRole('button',{name:'翻开第 1 张',exact:true}).click();
  await expect(interpretation).toHaveCount(0);
  await page.getByRole('button',{name:'翻开第 2 张',exact:true}).click();
  await expect(interpretation).toBeVisible();
  await expect(interpretation).toContainText('这 2 张牌可以并读');
  for(const name of await page.locator('.reading-copy h3').allTextContents())await expect(interpretation).toContainText(`${name}（正位）`);
  await expect(interpretation).not.toContainText('未来位置');
  await page.getByRole('button',{name:'再次抽牌'}).click();
  await choose_option(page.getByRole('combobox',{name:'抽取数量'}),'1 张');
  await page.getByRole('button',{name:'快速抽取'}).click();
  await page.getByRole('button',{name:'全部翻开'}).click();
  await expect(page.locator('.reading-card')).toHaveCount(1);
  await expect(interpretation).toHaveCount(0);
});

test('all 78 arc cards fit in view, are reachable, lift on selection and support keyboard and reduced motion',async({page},info)=>{
  if(info.project.name==='desktop')await page.setViewportSize({width:1440,height:650});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.locator('.mode-card').nth(1).click();
  await page.getByRole('button',{name:'开始洗牌'}).click();
  const deck=page.getByRole('group',{name:'完整 78 张洗好的塔罗牌'});
  await expect(deck).toHaveAttribute('aria-busy','false');
  await expect(page.locator('.selection-deck')).toBeInViewport({ratio:1});
  expect(await page.evaluate(()=>scrollY)).toBeLessThan(2);
  await expect(page.locator('.back-card')).toHaveCount(78);
  expect(await deck.locator('.fan-position').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await deck.evaluate(el=>el.scrollIntoView({block:'center'}));
  expect(await page.locator('.fan-viewport').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBeTruthy();
  await expect(page.getByRole('button',{name:'向右浏览牌组'})).toHaveCount(0);
  const exposed=await deck.locator('.back-card').evaluateAll(buttons=>buttons.map(button=>{
    const style=getComputedStyle(button),origin=style.transformOrigin.split(' ').map(parseFloat);
    const point=new DOMPoint(2-origin[0],3-origin[1]).matrixTransform(new DOMMatrix(style.transform));
    const parent=button.parentElement!.getBoundingClientRect();
    const x=parent.left+origin[0]+point.x,y=parent.top+origin[1]+point.y;
    return {name:button.getAttribute('aria-label'),visible:x>=0&&x<innerWidth&&y>=0&&y<innerHeight,
      reachable:button.contains(document.elementFromPoint(x,y))};
  }));
  expect(exposed.filter(card=>!card.visible||!card.reachable)).toEqual([]);
  const first=page.getByRole('button',{name:'牌位 1',exact:true});
  await page.mouse.move(0,0);
  const before_box=(await first.boundingBox())!;
  const before={...before_box,y:before_box.y+await page.evaluate(()=>scrollY)};
  await click_fan_card(first);
  const picked=page.getByRole('button',{name:'牌位 1，已选',exact:true});
  await expect(picked).toHaveAttribute('aria-pressed','true');
  await page.mouse.move(0,0);
  const after_box=(await picked.boundingBox())!;
  const after={...after_box,y:after_box.y+await page.evaluate(()=>scrollY)};
  expect(Math.hypot(after.x-before.x,after.y-before.y)).toBeGreaterThan(15);
  await expect(picked.locator('.selection-number')).toHaveText('1');
  await click_fan_card(picked);
  await expect(first).toHaveAttribute('aria-pressed','false');
  await page.mouse.move(0,0);
  expect((await first.boundingBox())!.y+await page.evaluate(()=>scrollY)).toBeCloseTo(before.y,0);
  await first.focus();
  await first.press('End');
  const last=page.getByRole('button',{name:'牌位 78',exact:true});
  await expect(last).toBeFocused();
  await last.press('Enter');
  await expect(page.getByRole('button',{name:'牌位 78，已选',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'牌位 78，已选',exact:true}).press('Home');
  await expect(first).toBeFocused();
  await first.press('ArrowRight');
  await expect(page.getByRole('button',{name:'牌位 2',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'牌位 2',exact:true}).press('Enter');
  await expect(page.locator('.back-card.chosen')).toHaveCount(2);
  await click_fan_card(page.getByRole('button',{name:'牌位 3',exact:true}));
  await expect(page.locator('.back-card.chosen')).toHaveCount(3);
  await page.getByRole('button',{name:'取消第3张',exact:true}).getByRole('img',{name:'已选牌'}).click();
  await expect(page.getByRole('button',{name:'牌位 3',exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('.selected-tray .filled')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  await page.locator('.selection-deck').screenshot({path:`test-results/arc-deck-${info.project.name}.png`,animations:'disabled'});
  await page.reload();
  await expect(page.locator('.back-card.chosen')).toHaveCount(2);
  await expect(deck).toHaveAttribute('aria-busy','false');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'重新抽牌',exact:true}).click();
  await expect(page.locator('.back-card.chosen')).toHaveCount(2);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'重新抽牌',exact:true}).click();
  await expect(deck).toHaveAttribute('aria-busy','false');
  await expect(page.locator('.back-card.chosen')).toHaveCount(0);
  await expect(page.locator('.selection-mode-status')).toContainText('时间之流 · 已选 0 / 3');
  await expect(page.locator('.selection-deck')).toBeInViewport({ratio:1});
  expect(await page.evaluate(()=>scrollY)).toBeLessThan(2);
});
