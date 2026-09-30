import { useState } from 'react';
import { ArrowRight, Shuffle, Sparkles, Plus, Minus } from 'lucide-react';
import type { Dataset, Mode, Settings } from '../domain/types';
import type { useTarot } from './useTarot';
import { ShuffleScene } from './ShuffleScene';

export function ReversalControl({settings,on_change}:{settings:Settings;on_change:(s:Settings)=>void}){
  return <div className="reversal-control"><label className="switch-label"><input type="checkbox" role="switch" checked={settings.reversed_enabled} onChange={e=>on_change({...settings,reversed_enabled:e.target.checked})}/><span>开启逆位</span></label>
    <div className={`stepper ${settings.reversed_enabled?'':'disabled'}`}><button aria-label="降低逆位概率" disabled={!settings.reversed_enabled||settings.reversed_probability===0} onClick={()=>on_change({...settings,reversed_probability:Math.max(0,settings.reversed_probability-5)})}><Minus size={14}/></button>
      <label><input aria-label="逆位概率" type="number" min={0} max={100} disabled={!settings.reversed_enabled} value={settings.reversed_probability} onChange={e=>on_change({...settings,reversed_probability:Math.max(0,Math.min(100,Math.round(Number(e.target.value))))})}/>%</label>
      <button aria-label="提高逆位概率" disabled={!settings.reversed_enabled||settings.reversed_probability===100} onClick={()=>on_change({...settings,reversed_probability:Math.min(100,settings.reversed_probability+5)})}><Plus size={14}/></button></div>
  </div>;
}

export function Draw({data,mode,on_mode,settings,on_settings,tarot}:{data:Dataset;mode:Mode;on_mode:(mode:Mode)=>void;settings:Settings;on_settings:(s:Settings)=>void;tarot:ReturnType<typeof useTarot>}){
  const [count,set_count]=useState(3),[question,set_question]=useState('');
  const spread=data.spreads.find(s=>s.id===mode)!;const total=mode==='free'?count:spread.min_count;
  const work=tarot.work;
  if(tarot.shuffling)return <ShuffleScene back={data.card_back_url}/>;
  if(tarot.busy&&!work)return <section className="shuffling-state"><span className="eyebrow">A QUIET MOMENT</span><h2>正在准备你的牌组…</h2></section>;
  if(work&&work.phase==='selecting'){
    const active_spread=data.spreads.find(s=>s.id===work.mode)!;const cards=work.slots;
    return <section className="selection-section"><div className="page-intro"><span className="eyebrow">LET YOUR INTUITION LEAD</span><h1>选出与你共鸣的 {work.count} 张牌。</h1><p>{work.question||'不必寻找正确答案，跟随此刻的直觉。'}</p></div>
      <div className="selection-toolbar"><span>{active_spread.name} · 已选 <strong>{work.selected.length} / {work.count}</strong></span><span className="quiet">{work.source==='offline'?'离线 · ':''}完整 78 张牌组</span></div>
      <p className="selection-instruction">所有的牌都在这里。轻触选牌，再次轻触可取消。</p>
      <div className="card-spread full-deck" aria-label="完整 78 张洗好的塔罗牌">{cards.map(slot=>{const index=work.selected.indexOf(slot.slot_id);return <button key={slot.slot_id} className={`back-card ${index>=0?'chosen':''}`} onClick={()=>void tarot.select(slot.slot_id)} aria-label={`牌位 ${Number(slot.slot_id.slice(5))+1}${index>=0?'，已选':''}`} aria-pressed={index>=0} disabled={index<0&&work.selected.length>=work.count}>
        <img src={data.card_back_url} alt=""/>{index>=0&&<span className="selection-number">{index+1}</span>}</button>;})}</div>
      <div className="selection-summary">
      <div className="selected-tray">{Array.from({length:work.count},(_,i)=><div key={i} className={work.selected[i]?'filled':''}><span>{active_spread.positions[i]??`第 ${i+1} 张`}</span>{work.selected[i]?<><img src={data.card_back_url} alt="已选牌"/><button onClick={()=>void tarot.select(work.selected[i])} aria-label={`取消第${i+1}张`}>取消</button></>:<span className="tray-placeholder">✧</span>}</div>)}</div>
      <div className="reading-actions"><button className="button secondary" disabled={tarot.busy} onClick={()=>void tarot.start(work.mode,work.count,{...settings,...work.settings_snapshot},work.question,false)}><Shuffle size={16}/>重新洗牌</button><button className="button" disabled={work.selected.length!==work.count||tarot.busy} onClick={()=>void tarot.commit()}>{tarot.busy?'正在保存…':'确认选牌'}<ArrowRight size={17}/></button></div>
      {tarot.error&&<p className="error-message" role="alert">{tarot.error}</p>}
      </div>
    </section>;
  }
  return <section className="draw-setup"><div className="page-intro"><span className="eyebrow">BEFORE THE CARDS</span><h1>给自己，一段安静的时间。</h1><p>想一想你关心的事，再让牌面为你打开一个新的角度。</p></div>
    <div className="setup-panel"><div className="setup-art"><img src={data.card_back_url} alt="塔罗牌背面"/><span>FOLLOW YOUR INTUITION</span></div><div className="setup-form">
      <label className="field-label">选择你的牌阵<select value={mode} onChange={e=>on_mode(e.target.value as Mode)}>{data.spreads.map(s=><option key={s.id} value={s.id}>{s.name} · {s.description}</option>)}</select></label>
      {mode==='free'&&<label className="field-label">抽取数量<select value={count} onChange={e=>set_count(Number(e.target.value))}>{Array.from({length:10},(_,i)=><option key={i} value={i+1}>{i+1} 张</option>)}</select></label>}
      <label className="field-label">此刻，你想探索什么？ <span className="quiet">（可选）</span><textarea value={question} onChange={e=>set_question(e.target.value)} maxLength={500} placeholder="例如：我该如何面对眼前的变化？"/></label>
      <ReversalControl settings={settings} on_change={on_settings}/><p className="quiet">{mode==='daily'?'每日结果在当前设备当天固定。':`${total} 张牌 · ${spread.positions.join(' / ')||'自由记录'}`}</p>
      <div className="setup-actions"><button className="button" disabled={tarot.busy} onClick={()=>void tarot.start(mode,total,settings,question,false)}><Shuffle size={17}/>开始洗牌<ArrowRight size={16}/></button><button className="button secondary" disabled={tarot.busy} onClick={()=>void tarot.start(mode,total,settings,question,true)}><Sparkles size={16}/>快速抽取</button></div>
      {tarot.error&&<p className="error-message" role="alert">{tarot.error}</p>}
    </div></div>
  </section>;
}
