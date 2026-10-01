import { get_bundle, save_bundle } from '../adapters/storage';
import type { BundleState } from '../domain/types';
import { validate_manifest } from '../domain/validation';

export const cache_name=(version: string)=>`paper-tarot-media-${version}`;
const hex=(buffer: ArrayBuffer)=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');

export async function check_bundle(expected_dataset_version: string): Promise<BundleState|undefined> {
  const state=await get_bundle();if(!state)return undefined;
  validate_manifest(state.manifest);
  if(state.bundle_version!==state.manifest.bundle_version)throw Error('离线资源版本不一致。');
  const cache=await caches.open(cache_name(state.bundle_version));
  const exists=await Promise.all(state.manifest.items.map(item=>cache.match(item.url).then(Boolean)));
  // 保留旧素材供历史使用，但不能把旧包标记为当前数据集已离线就绪。
  const current=state.manifest.dataset_version===expected_dataset_version;
  state.ready=current&&state.manifest.items.every((item,i)=>!item.required || exists[i]);
  state.audio_ready=current&&state.manifest.items.every((item,i)=>item.group!=='audio'||exists[i]);
  await save_bundle(state);return state;
}

export async function download_bundle(progress: (bytes: number,total: number)=>void,signal: AbortSignal): Promise<BundleState> {
  if(!('serviceWorker' in navigator))throw Error('当前浏览器不支持离线缓存。');
  await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('离线服务尚未就绪，请在正式网站地址刷新后重试。')),15000))]);
  const estimate=await navigator.storage?.estimate?.();
  await navigator.storage?.persist?.();
  const response=await fetch('/api/v1/resources/manifest',{cache:'reload',signal});
  if(!response.ok)throw Error('无法读取离线清单。');
  const manifest=validate_manifest(await response.json()), cache=await caches.open(cache_name(manifest.bundle_version));
  if(estimate?.quota && estimate.quota-(estimate.usage??0)<manifest.total_bytes)throw Error('本地空间不足，请释放空间后重试。');
  let complete=0;const failed: string[]=[];
  for(const item of manifest.items){
    signal.throwIfAborted();
    try{
      let result=await cache.match(item.url);
      let bytes=result?await result.clone().arrayBuffer():null;
      // 续传时也重新校验已有缓存；只有长度和哈希都正确的内容才计入进度。
      if(!bytes || bytes.byteLength!==item.bytes || hex(await crypto.subtle.digest('SHA-256',bytes))!==item.sha256){
        result=await fetch(item.url,{cache:'reload',signal,redirect:'error'});
        if(!result.ok)throw Error('资源下载失败');
        bytes=await result.clone().arrayBuffer();
        if(bytes.byteLength!==item.bytes || hex(await crypto.subtle.digest('SHA-256',bytes))!==item.sha256)throw Error('资源校验失败');
        await cache.put(item.url,result);
      }
      complete+=item.bytes;progress(complete,manifest.total_bytes);
    }catch(error){if(signal.aborted)throw error;failed.push(item.url);await cache.delete(item.url);}
  }
  const state={bundle_version:manifest.bundle_version,manifest,
    ready:manifest.items.every(item=>!item.required || !failed.includes(item.url)),
    audio_ready:manifest.items.every(item=>item.group!=='audio'||!failed.includes(item.url))};
  await save_bundle(state);
  if(!state.ready)throw Error(`${failed.length} 项资源未完成，可继续下载修复。`);
  return state;
}

export async function clear_offline(){
  for(const name of await caches.keys())if(name.startsWith('paper-tarot-media-'))await caches.delete(name);
  const state=await get_bundle();if(state)await save_bundle({...state,ready:false,audio_ready:false});
}
