const SHELL='paper-tarot-shell-__BUILD_VERSION__';
const MEDIA='/media/';
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const response=await fetch('/app-shell.json',{cache:'reload',redirect:'error'});
  if(!response.ok)throw Error('Cannot load app shell');
  const paths=await response.json();
  if(!Array.isArray(paths)||paths.length>128||!paths.includes('/index.html')||paths.some(path=>
    typeof path!=='string'||!(['/', '/index.html','/icon.svg','/manifest.webmanifest'].includes(path)||/^\/assets\/[A-Za-z0-9_-]+\.(js|css|png|webp|woff2?)$/.test(path))))throw Error('Invalid app shell');
  const cache=await caches.open(SHELL);
  await cache.addAll(paths.map(path=>new Request(path,{redirect:'error'})));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('paper-tarot-shell-')&&name!==SHELL)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||request.cache==='reload')return;
  if(url.pathname.startsWith('/api/'))return;
  event.respondWith((async()=>{
    if(request.mode==='navigate'){
      try{return await fetch(request);}catch{const shell=await caches.open(SHELL);return await shell.match('/index.html')||Response.error();}
    }
    let cached;
    if(url.pathname.startsWith(MEDIA)){
      // 媒体缓存与应用壳隔离，不能从媒体包或其他站点缓存中读取脚本和样式。
      for(const name of (await caches.keys()).filter(name=>name.startsWith('paper-tarot-media-')).reverse()){
        cached=await (await caches.open(name)).match(request);if(cached)break;
      }
    }else cached=await (await caches.open(SHELL)).match(request);
    // 离线音频仍需支持字节范围请求；非法区间返回 416，不能默默回传整文件。
    if(cached&&request.headers.has('range')){
      const bytes=await cached.arrayBuffer(),range=request.headers.get('range');
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      let start,end;
      if(match&&(match[1]||match[2])){
        start=match[1]?Number(match[1]):Math.max(0,bytes.byteLength-Number(match[2]));
        end=match[1]?(match[2]?Math.min(Number(match[2]),bytes.byteLength-1):bytes.byteLength-1):bytes.byteLength-1;
      }
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=bytes.byteLength)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.byteLength}`}});
      return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':cached.headers.get('Content-Type')||'application/octet-stream',
        'Content-Range':`bytes ${start}-${end}/${bytes.byteLength}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
    }
    return cached||fetch(request);
  })());
});
