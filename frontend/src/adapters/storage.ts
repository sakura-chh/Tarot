import type { BundleState, Dataset, Reading, Settings, Work } from '../domain/types';
import { daily_key } from '../domain/rules';

let connection: Promise<IDBDatabase> | undefined;
export function open_db(): Promise<IDBDatabase> {
  if(!connection) connection = new Promise((resolve,reject)=>{
    const request=indexedDB.open('paper-tarot',1);
    request.onupgradeneeded=()=>{const db=request.result;
      for(const name of ['meta','readings','daily_results']) db.createObjectStore(name);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>{connection=undefined;reject(request.error);};
  });
  return connection;
}

export async function get_value<T>(store: string,key: string): Promise<T|undefined> {
  const db=await open_db();return new Promise((resolve,reject)=>{
    const request=db.transaction(store).objectStore(store).get(key);
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
export async function put_value<T>(store: string,key: string,value: T): Promise<void> {
  const db=await open_db();return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,key);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}
export const get_settings = ()=>get_value<Settings>('meta','settings');
export const save_settings = (value: Settings)=>put_value('meta','settings',value);
export const get_dataset = ()=>get_value<Dataset>('meta','dataset');
export const save_dataset = (value: Dataset)=>put_value('meta','dataset',value);
export const get_work = ()=>get_value<Work|null>('meta','work');
export const save_work = (value: Work|null)=>put_value('meta','work',value);
export const get_bundle = ()=>get_value<BundleState>('meta','bundle');
export const save_bundle = (value: BundleState)=>put_value('meta','bundle',value);
export const get_daily = (deck: string)=>get_value<Reading>('daily_results',daily_key(deck));
export const get_reading = (id: string)=>get_value<Reading>('readings',id);
export const save_reading = (r: Reading)=>put_value('readings',r.id,r);

export async function list_readings(): Promise<Reading[]> {
  const db=await open_db();return new Promise((resolve,reject)=>{
    const request=db.transaction('readings').objectStore('readings').getAll();
    request.onsuccess=()=>resolve((request.result as Reading[]).sort((a,b)=>b.created_at.localeCompare(a.created_at)));
    request.onerror=()=>reject(request.error);
  });
}

export async function commit_reading(record: Reading,work: Work): Promise<Reading> {
  const db=await open_db();return new Promise((resolve,reject)=>{
    // One write transaction serializes concurrent tabs and fixes the daily card before revealing.
    const tx=db.transaction(['readings','daily_results','meta'],'readwrite');let result=record;
    const finish=(chosen: Reading)=>{
      result=chosen;
      tx.objectStore('meta').put({...work,phase:'revealing',reading_id:chosen.id},'work');
    };
    if(record.mode==='daily'){
      const key=daily_key(record.deck_id,record.local_date), request=tx.objectStore('daily_results').get(key);
      request.onsuccess=()=>{
        if(request.result){finish(request.result);return;}
        tx.objectStore('daily_results').add(record,key);tx.objectStore('readings').add(record,record.id);finish(record);
      };
    }else{tx.objectStore('readings').add(record,record.id);finish(record);}
    tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}

export async function update_reading(record: Reading): Promise<void> {
  const db=await open_db();return new Promise((resolve,reject)=>{
    const tx=db.transaction(['readings','daily_results'],'readwrite');
    tx.objectStore('readings').put(record,record.id);
    if(record.mode==='daily') tx.objectStore('daily_results').put(record,daily_key(record.deck_id,record.local_date));
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}

export async function clear_data(kind: 'history'|'all',id?: string): Promise<void> {
  const db=await open_db();return new Promise((resolve,reject)=>{
    const stores=kind==='all'?['readings','daily_results','meta']:['readings'];
    const tx=db.transaction(stores,'readwrite');
    if(id) tx.objectStore('readings').delete(id);else for(const name of stores){
      if(name==='meta'){tx.objectStore(name).delete('work');tx.objectStore(name).delete('settings');}
      else tx.objectStore(name).clear();
    }
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
  });
}
