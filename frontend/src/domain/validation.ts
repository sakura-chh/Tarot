import type { Card, Dataset, Manifest, Mode, Session } from './types';

const modes:Mode[]=['daily','past_present_future','situation_obstacle_advice','free'];
const id=(value:unknown)=>typeof value==='string'&&/^[A-Za-z0-9_.-]{1,64}$/.test(value);
const text=(value:unknown,max=10000)=>typeof value==='string'&&value.length<=max;
const strings=(value:unknown,max=30)=>Array.isArray(value)&&value.length<=max&&value.every(item=>text(item,160));
const integer=(value:unknown,min:number,max:number)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=max;
const object=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);

// 仅接受规范的同站媒体路径，下载清单不能指向可执行的应用壳资源。
export function media_url(value:unknown):value is string {
  return typeof value==='string'&&/^\/media\/v\d+\/[A-Za-z0-9_-][A-Za-z0-9_.-]{0,180}$/.test(value);
}
export function source_url(value:unknown):value is string {
  if(typeof value!=='string'||value.length>2048)return false;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
function topics(value:unknown){return object(value)&&['general','love','career','advice'].every(key=>text(value[key]));}
function valid_card(value:unknown):value is Card {
  if(!object(value))return false;
  return id(value.id)&&id(value.deck_id)&&text(value.name_zh,160)&&text(value.name_en,160)&&strings(value.aliases)&&
    ['major','minor'].includes(String(value.arcana))&&(value.suit===null||['swords','wands','pentacles','cups'].includes(String(value.suit)))&&
    strings(value.keywords_upright)&&strings(value.keywords_reversed)&&text(value.meaning_upright)&&text(value.meaning_reversed)&&
    integer(value.sort_order,0,77)&&object(value.images)&&media_url(value.images.display_url)&&media_url(value.images.thumbnail_url)&&
    (value.meaning_source===undefined||(object(value.meaning_source)&&text(value.meaning_source.name,160)&&source_url(value.meaning_source.url)))&&
    (value.meaning_details===undefined||(object(value.meaning_details)&&text(value.meaning_details.overview)&&text(value.meaning_details.symbolism)&&topics(value.meaning_details.upright)&&topics(value.meaning_details.reversed)));
}
// TypeScript 类型不校验运行时 JSON；网络与本地缓存都必须经过这些检查。
export function validate_dataset(value:unknown):Dataset {
  const audio=object(value)&&object(value.audio)?value.audio:null;
  const cards=object(value)&&Array.isArray(value.cards)&&value.cards.every(valid_card)?value.cards:null;
  if(!object(value)||value.schema_version!=='1'||value.rules_version!=='1'||!id(value.dataset_version)||!id(value.deck_id)||
    !media_url(value.card_back_url)||!audio||!['music','shuffle','flip'].every(key=>media_url(audio[key]))||
    !cards||cards.length!==78||
    new Set(cards.map(c=>c.id)).size!==78||new Set(cards.map(c=>c.sort_order)).size!==78||cards.some(c=>c.deck_id!==value.deck_id)||
    cards.filter(c=>c.arcana==='major'&&c.suit===null).length!==22||
    ['swords','wands','pentacles','cups'].some(s=>cards.filter(c=>c.arcana==='minor'&&c.suit===s).length!==14)||
    !Array.isArray(value.spreads)||value.spreads.length!==4||new Set(value.spreads.map(s=>s?.id)).size!==4||
    !value.spreads.every(s=>object(s)&&modes.includes(s.id as Mode)&&text(s.name,160)&&text(s.description,500)&&strings(s.positions,10)&&
      s.min_count===(s.id==='free'||s.id==='daily'?1:3)&&s.max_count===(s.id==='free'?10:s.id==='daily'?1:3)))throw Error('卡牌数据格式或资源地址不安全，请重新下载。');
  return value as unknown as Dataset;
}
// 同时约束条目数量、单项与总大小，防止异常清单占满浏览器存储。
export function validate_manifest(value:unknown):Manifest {
  if(!object(value)||!id(value.bundle_version)||!id(value.dataset_version)||!media_url(value.dataset_url)||
    !integer(value.total_bytes,1,256*1024*1024)||!Array.isArray(value.items)||value.items.length<1||value.items.length>256||
    !value.items.every(item=>object(item)&&media_url(item.url)&&integer(item.bytes,1,32*1024*1024)&&typeof item.sha256==='string'&&/^[a-f0-9]{64}$/.test(item.sha256)&&
      ['core','audio'].includes(String(item.group))&&typeof item.required==='boolean')||
    new Set(value.items.map(item=>item.url)).size!==value.items.length||value.items.reduce((sum,item)=>sum+item.bytes,0)!==value.total_bytes||
    !value.items.some(item=>item.url===value.dataset_url&&item.required&&item.group==='core'))throw Error('离线资源清单不安全或不完整。');
  return value as unknown as Manifest;
}
export function validate_session(value:unknown,data:Dataset):Session {
  const ids=new Set(data.cards.map(c=>c.id));
  const settings=object(value)&&object(value.settings_snapshot)?value.settings_snapshot:null;
  if(!object(value)||value.dataset_version!==data.dataset_version||value.deck_id!==data.deck_id||!modes.includes(value.mode as Mode)||
    !integer(value.count,1,10)||(value.mode==='daily'&&value.count!==1)||(['past_present_future','situation_obstacle_advice'].includes(String(value.mode))&&value.count!==3)||
    !text(value.session_id,128)||!value.session_id||!text(value.request_id,128)||!value.request_id||!['server','offline'].includes(String(value.source))||
    !text(value.created_at,64)||!Number.isFinite(Date.parse(value.created_at as string))||
    !settings||typeof settings.reversed_enabled!=='boolean'||!integer(settings.reversed_probability,0,100)||
    !Array.isArray(value.slots)||value.slots.length!==78||value.slots.some(s=>!object(s)||typeof s.slot_id!=='string'||!/^slot-\d{2}$/.test(s.slot_id)||
      !ids.has(s.card_id as string)||typeof s.is_reversed!=='boolean'||(!settings.reversed_enabled&&s.is_reversed))||
    new Set(value.slots.map(s=>s.card_id)).size!==78||new Set(value.slots.map(s=>s.slot_id)).size!==78)throw Error('抽牌结果格式不完整。');
  return value as unknown as Session;
}
