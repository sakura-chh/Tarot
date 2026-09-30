import { useEffect, useState } from 'react';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import type { Dataset, Reading } from '../domain/types';
import { clear_data, list_readings } from '../adapters/storage';

export function History({data,on_record}:{data:Dataset;on_record:(r:Reading)=>void}){
  const [records,set_records]=useState<Reading[]>([]),[mode,set_mode]=useState(''),[error,set_error]=useState('');
  const reload=()=>list_readings().then(set_records).catch(()=>set_error('历史记录暂时无法读取。'));
  useEffect(()=>{void reload();},[]);
  async function remove(id?:string){if(!confirm(id?'删除这条历史记录？当天每日一牌仍会保留。':'清空全部历史？当天每日一牌仍会保留。'))return;
    try{await clear_data('history',id);await reload();}catch{set_error('删除失败，请重试。');}}
  return <section className="history-section"><div className="page-intro"><span className="eyebrow">YOUR QUIET MOMENTS</span><h1>把每一次相遇，慢慢收藏。</h1><p>问题、牌面与笔记，只留在你当前的设备里。</p></div>
    <div className="history-toolbar"><select aria-label="历史模式" value={mode} onChange={e=>set_mode(e.target.value)}><option value="">所有记录</option>{data.spreads.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="text-button" onClick={()=>void remove()} disabled={!records.length}><Trash2 size={15}/>清空历史</button></div>
    <div className="history-list">{records.filter(r=>!mode||r.mode===mode).map(record=><article className="history-item" key={record.id}><button className="history-main" onClick={()=>on_record(record)}><div className="history-thumbnails">{record.cards.slice(0,3).map(c=><img key={c.slot_id} src={c.card.images.display_url} alt={c.card.name_zh} className={c.is_reversed?'reversed':''} loading="lazy" decoding="async"/>)}</div><div><span className="eyebrow">{record.local_date} · {data.spreads.find(s=>s.id===record.mode)?.name}</span><h3>{record.question||record.cards.map(c=>c.card.name_zh).join(' · ')}</h3><p>{record.notes?record.notes.slice(0,65):'留下一点此刻的想法…'}</p></div><ArrowUpRight size={19}/></button><button className="icon-button" aria-label="删除记录" onClick={()=>void remove(record.id)}><Trash2 size={17}/></button></article>)}</div>
    {!records.filter(r=>!mode||r.mode===mode).length&&<div className="empty-state"><span>✧</span><h3>这里，等待你的第一段故事。</h3><p>确认抽牌后，记录会自动保存到这里。</p></div>}{error&&<p className="error-message">{error}</p>}
  </section>;
}
