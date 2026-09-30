import type { Dataset, Manifest, Mode, Session, Settings } from '../domain/types';
import { offline_session, validate_dataset, validate_session } from '../domain/rules';
import { get_dataset, save_dataset } from './storage';

export async function load_dataset(): Promise<Dataset> {
  const cached=await get_dataset();
  try {
    const response=await fetch('/api/v1/resources/manifest',{signal:AbortSignal.timeout(4000)});
    if(!response.ok) throw Error('数据服务暂时不可用');
    const manifest: Manifest=await response.json();
    if(cached?.dataset_version===manifest.dataset_version) return cached;
    const raw=await fetch(manifest.dataset_url,{signal:AbortSignal.timeout(4000)});
    if(!raw.ok) throw Error('无法加载卡牌数据');
    const data=validate_dataset(await raw.json());await save_dataset(data);return data;
  }catch(error){if(cached)return validate_dataset(cached);throw error;}
}

export async function create_session(data: Dataset,mode: Mode,count: number,settings: Settings): Promise<Session> {
  let response: Response;
  try { response=await fetch('/api/v1/draw-sessions',{method:'POST',headers:{'Content-Type':'application/json'},
    signal:AbortSignal.timeout(3500),body:JSON.stringify({request_id:crypto.randomUUID(),deck_id:data.deck_id,
      dataset_version:data.dataset_version,mode,count,reversed_enabled:settings.reversed_enabled,
      reversed_probability:settings.reversed_probability})});
  }catch{return offline_session(data,mode,count,settings);}
  if(response.status>=500)return offline_session(data,mode,count,settings);
  if(!response.ok){const body=await response.json();throw Error(body.error?.message??'抽牌请求失败');}
  return validate_session(await response.json(),data);
}
