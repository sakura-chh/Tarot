import type { Dataset, Mode, Session, Settings } from '../domain/types';
import { offline_session, validate_dataset, validate_session } from '../domain/rules';
import { validate_manifest } from '../domain/validation';
import { get_dataset, save_dataset } from './storage';

export async function load_dataset(): Promise<Dataset> {
  const cached=await get_dataset();
  try {
    const response=await fetch('/api/v1/resources/manifest',{signal:AbortSignal.timeout(4000)});
    if(!response.ok) throw Error('数据服务暂时不可用');
    const manifest=validate_manifest(await response.json());
    // 缓存也属于输入边界；版本相同不能替代结构和资源路径校验。
    if(cached?.dataset_version===manifest.dataset_version) return validate_dataset(cached);
    const raw=await fetch(manifest.dataset_url,{signal:AbortSignal.timeout(4000),redirect:'error'});
    if(!raw.ok) throw Error('无法加载卡牌数据');
    // 下载内容必须同时通过长度、哈希和数据版本校验，之后才能落盘。
    const bytes=await raw.arrayBuffer(),item=manifest.items.find(item=>item.url===manifest.dataset_url)!;
    if(bytes.byteLength!==item.bytes || hex(await crypto.subtle.digest('SHA-256',bytes))!==item.sha256)throw Error('卡牌数据校验失败。');
    const data=validate_dataset(JSON.parse(new TextDecoder().decode(bytes)));
    if(data.dataset_version!==manifest.dataset_version)throw Error('卡牌数据版本不一致。');
    await save_dataset(data);return data;
  }catch(error){if(cached)return validate_dataset(cached);throw error;}
}

export async function create_session(data: Dataset,mode: Mode,count: number,settings: Settings): Promise<Session> {
  let response: Response;
  const request_id=crypto.randomUUID();
  try { response=await fetch('/api/v1/draw-sessions',{method:'POST',headers:{'Content-Type':'application/json'},
    signal:AbortSignal.timeout(3500),body:JSON.stringify({request_id,deck_id:data.deck_id,
      dataset_version:data.dataset_version,mode,count,reversed_enabled:settings.reversed_enabled,
      reversed_probability:settings.reversed_probability})});
  }catch{return offline_session(data,mode,count,settings);}
  // 仅网络失败或服务端不可用自动转离线；参数错误和限流仍展示原错误。
  if(response.status>=500)return offline_session(data,mode,count,settings);
  if(!response.ok){const body=await response.json();throw Error(body.error?.message??'抽牌请求失败');}
  const session=validate_session(await response.json(),data);
  if(session.request_id!==request_id||session.mode!==mode||session.count!==count||session.source!=='server'||
    session.settings_snapshot.reversed_enabled!==settings.reversed_enabled||session.settings_snapshot.reversed_probability!==settings.reversed_probability)throw Error('抽牌结果与本轮请求不一致。');
  return session;
}
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
