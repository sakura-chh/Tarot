import { useEffect, useRef, useState } from 'react';
import type { Dataset, Mode, Reading, Settings, Work } from '../domain/types';
import { local_date } from '../domain/rules';
import { create_session } from '../adapters/api';
import { commit_reading, get_daily, get_reading, get_work, save_work, update_reading } from '../adapters/storage';
import { play_effect } from '../audio/controller';

export function useTarot(data: Dataset){
  const [work,set_work]=useState<Work|null>(null),[reading,set_reading]=useState<Reading|null>(null);
  const [reading_entry,set_reading_entry]=useState(0);
  const [busy,set_busy]=useState(false),[shuffling,set_shuffling]=useState(false),[error,set_error]=useState('');
  const work_ref=useRef<Work|null>(null),busy_ref=useRef(false);
  const assign_work=(value:Work|null)=>{work_ref.current=value;set_work(value);};
  useEffect(()=>{let live=true;void (async()=>{
    try{const saved=await get_work();if(!live)return;
      if(!saved || (saved.mode==='daily'&&saved.reading_id)){
        const today=await get_daily(data.deck_id);if(live&&today){assign_work(saved??null);set_reading(today);}return;
      }
      assign_work(saved);
      if(saved.reading_id){const record=await get_reading(saved.reading_id);if(live&&record)set_reading(record);}
    }catch{if(live)set_error('本地记录暂时无法读取。');}
  })();return ()=>{live=false;};},[data.deck_id]);
  useEffect(()=>{
    if(reading?.mode!=='daily')return;
    // A page left open over midnight must not continue treating yesterday as today's result.
    const check_day=()=>{if(reading.local_date!==local_date()){
      work_ref.current=null;set_work(null);set_reading(null);
      void save_work(null).catch(()=>set_error('每日状态未保存，请重试。'));
    }};
    const midnight=new Date();midnight.setHours(24,0,0,0);
    const timer=setTimeout(check_day,midnight.getTime()-Date.now()+100);
    window.addEventListener('focus',check_day);document.addEventListener('visibilitychange',check_day);
    check_day();return()=>{clearTimeout(timer);window.removeEventListener('focus',check_day);document.removeEventListener('visibilitychange',check_day);};
  },[reading]);

  async function confirm(current: Work){
    const spread=data.spreads.find(s=>s.id===current.mode)!;
    const cards=await Promise.all(current.selected.map(async(id,index)=>{
      const slot=current.slots.find(s=>s.slot_id===id)!,card=data.cards.find(c=>c.id===slot.card_id)!;
      let display_blob:Blob|undefined;
      try{const response=await fetch(card.images.display_url,{signal:AbortSignal.timeout(3000)});if(response.ok)display_blob=await response.blob();}catch{/* Save the fixed result even if its full-size image is temporarily unavailable. */}
      return {card,slot_id:id,is_reversed:slot.is_reversed,position:spread.positions[index]??`第 ${index+1} 张`,display_blob};
    }));
    const record:Reading={id:crypto.randomUUID(),session_id:current.session_id,mode:current.mode,deck_id:data.deck_id,
      dataset_version:current.dataset_version,source:current.source,question:current.question,notes:'',
      created_at:new Date().toISOString(),local_date:local_date(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
      settings_snapshot:current.settings_snapshot,cards,revealed:[]};
    const accepted=await commit_reading(record,current);set_reading(accepted);
    assign_work({...current,phase:'revealing',reading_id:accepted.id});
    set_reading_entry(value=>value+1);
  }

  async function start(mode:Mode,count:number,settings:Settings,question:string,quick:boolean){
    if(busy_ref.current)return;busy_ref.current=true;set_busy(true);set_error('');
    try{
      if(mode==='daily'){
        const today=await get_daily(data.deck_id);
        if(today){set_reading(today);assign_work(null);await save_work(null);set_reading_entry(value=>value+1);return;}
      }
      play_effect('shuffle');set_reading(null);set_shuffling(!quick);
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const [session]=await Promise.all([create_session(data,mode,count,settings),new Promise(resolve=>setTimeout(resolve,quick?220:reduced?500:3200))]);
      const current:Work={...session,selected:quick?session.slots.slice(0,count).map(s=>s.slot_id):[],phase:'selecting',question,group:0};
      await save_work(current);assign_work(current);
      if(quick)await confirm(current);
    }catch(error){set_error(error instanceof Error?error.message:'无法开始抽牌，请重试。');}
    finally{busy_ref.current=false;set_busy(false);set_shuffling(false);}
  }

  async function select(slot_id:string){
    const current=work_ref.current;if(!current||current.phase!=='selecting')return;
    const selected=current.selected.includes(slot_id)?current.selected.filter(s=>s!==slot_id):current.selected.length<current.count?[...current.selected,slot_id]:current.selected;
    const next={...current,selected};assign_work(next);
    try{await save_work(next);}catch{set_error('选牌进度未保存，请检查浏览器存储空间。');}
  }
  async function set_group(group:number){const current=work_ref.current;if(!current)return;const next={...current,group};assign_work(next);await save_work(next);}
  async function commit(){
    const current=work_ref.current;if(!current||current.selected.length!==current.count||busy_ref.current)return;
    busy_ref.current=true;set_busy(true);set_error('');
    try{await confirm(current);}catch{set_error('结果未保存，请重试；本轮卡牌保持不变。');}finally{busy_ref.current=false;set_busy(false);}
  }
  async function update(record:Reading){await update_reading(record);set_reading(record);}
  async function resume_daily(){const today=await get_daily(data.deck_id);if(!today)return false;set_reading(today);assign_work(null);await save_work(null);return true;}
  async function reset(){assign_work(null);set_reading(null);set_error('');await save_work(null);}
  return {work,reading,reading_entry,busy,shuffling,error,start,select,set_group,commit,update,reset,resume_daily};
}
