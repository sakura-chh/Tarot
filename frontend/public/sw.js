const SHELL='paper-tarot-shell-__BUILD_VERSION__';
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const response=await fetch('/app-shell.json',{cache:'reload'});
  const paths=await response.json(),cache=await caches.open(SHELL);
  await cache.addAll(paths);
})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||request.cache==='reload')return;
  // API failures belong to the application adapter, never return an HTML shell for an API.
  if(url.pathname.startsWith('/api/'))return;
  event.respondWith((async()=>{
    if(request.mode==='navigate'){
      try{return await fetch(request);}catch{const shell=await caches.open(SHELL);return await shell.match('/index.html')||Response.error();}
    }
    const cached=await caches.match(url.pathname);
    if(cached && request.headers.has('range')){
      const bytes=await cached.arrayBuffer(),match=/bytes=(\d+)-(\d*)/.exec(request.headers.get('range'));
      if(match){const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),bytes.byteLength-1):bytes.byteLength-1;
        if(start>=bytes.byteLength)return new Response(null,{status:416});
        return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':cached.headers.get('Content-Type')||'audio/wav',
          'Content-Range':`bytes ${start}-${end}/${bytes.byteLength}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});}
    }
    return cached||fetch(request);
  })());
});
