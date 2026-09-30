import { useRef, useState } from 'react';
import { ArrowRight, Shuffle, Sparkles, Plus, Minus, Sun, Waves, Compass, Check, Layers } from 'lucide-react';
import type { Dataset, Mode, Settings } from '../domain/types';
import type { useTarot } from './useTarot';
import { ShuffleScene } from './ShuffleScene';
import type { DeckBounds } from '../components/DeckHandoff';
import { SelectionDeck } from './SelectionDeck';

const mode_icons={daily:Sun,past_present_future:Waves,situation_obstacle_advice:Compass,free:Sparkles};

export function ReversalControl({settings,on_change}:{settings:Settings;on_change:(s:Settings)=>void}){
  return <div className="reversal-control"><label className="switch-label"><input type="checkbox" role="switch" checked={settings.reversed_enabled} onChange={e=>on_change({...settings,reversed_enabled:e.target.checked})}/><span>开启逆位</span></label>
    <div className={`stepper ${settings.reversed_enabled?'':'disabled'}`}><button aria-label="降低逆位概率" disabled={!settings.reversed_enabled||settings.reversed_probability===0} onClick={()=>on_change({...settings,reversed_probability:Math.max(0,settings.reversed_probability-5)})}><Minus size={14}/></button>
      <label><input aria-label="逆位概率" type="number" min={0} max={100} disabled={!settings.reversed_enabled} value={settings.reversed_probability} onChange={e=>on_change({...settings,reversed_probability:Math.max(0,Math.min(100,Math.round(Number(e.target.value))))})}/>%</label>
      <button aria-label="提高逆位概率" disabled={!settings.reversed_enabled||settings.reversed_probability===100} onClick={()=>on_change({...settings,reversed_probability:Math.min(100,settings.reversed_probability+5)})}><Plus size={14}/></button></div>
  </div>;
}

export function Draw({data,mode,on_mode,settings,on_settings,tarot}:{data:Dataset;mode:Mode;on_mode:(mode:Mode)=>void;settings:Settings;on_settings:(s:Settings)=>void;tarot:ReturnType<typeof useTarot>}){
  const shuffle_origin=useRef<DeckBounds|null>(null);
  const [count,set_count]=useState(3),[question,set_question]=useState('');
  const spread=data.spreads.find(s=>s.id===mode)!;const total=mode==='free'?count:spread.min_count;
  const work=tarot.work;
  if(tarot.shuffling)return <ShuffleScene back={data.card_back_url} handoff={shuffle_origin}/>;
  if(tarot.busy&&!work)return <section className="shuffling-state"><span className="eyebrow">A QUIET MOMENT</span><h2>正在准备你的牌组…</h2></section>;
  if(work&&work.phase==='selecting'){
    const active_spread=data.spreads.find(s=>s.id===work.mode)!;
    return <section className="selection-section"><div className="page-intro"><span className="eyebrow">LET YOUR INTUITION LEAD</span><h1>选出与你共鸣的 {work.count} 张牌。</h1><p>{work.question||'不必寻找正确答案，跟随此刻的直觉。'}</p></div>
      <div className="selection-toolbar"><div className="selection-mode"><button className="button secondary change-mode-button" onClick={()=>{if(window.confirm('更换抽牌模式？当前未确认的选牌将被清除。'))void tarot.reset();}}><Layers size={15}/>更换模式</button><span>{active_spread.name} · 已选 <strong>{work.selected.length} / {work.count}</strong></span></div><span className="quiet">{work.source==='offline'?'离线 · ':''}完整 78 张牌组</span></div>
      <p className="selection-instruction">牌组已洗好。轻触选牌，再次轻触可放回。</p>
      <SelectionDeck key={work.session_id} handoff={shuffle_origin} work={work} back={data.card_back_url} on_select={id=>void tarot.select(id)}/>
      <div className="selection-summary">
      <div className="selection-summary-heading"><h2>你选择的牌</h2><span>{active_spread.name}</span></div>
      <div className={`selected-tray count-${work.count}`}>{Array.from({length:work.count},(_,i)=><div key={i} className={work.selected[i]?'filled':''}>
        <div className="tray-position"><span className="tray-number">{String(i+1).padStart(2,'0')}</span><span>{active_spread.positions[i]??`第 ${i+1} 张`}</span></div>
        {work.selected[i]?<><img src={data.card_back_url} alt="已选牌"/><button disabled={tarot.busy} onClick={()=>void tarot.select(work.selected[i])} aria-label={`取消第${i+1}张`}>放回牌组</button></>:<><span className="tray-placeholder" aria-hidden="true">✧</span><span className="tray-empty-label">等待选择</span></>}
      </div>)}</div>
      <div className="selection-summary-footer"><p className="selection-progress" role="status">已选 <strong>{work.selected.length} / {work.count}</strong><span>{work.selected.length===work.count?'牌已选齐，准备揭晓。':`再选择 ${work.count-work.selected.length} 张牌。`}</span></p>
        <div className="reading-actions"><button className="button secondary" disabled={tarot.busy} onClick={()=>void tarot.start(work.mode,work.count,{...settings,...work.settings_snapshot},work.question,false)}><Shuffle size={16}/>重新洗牌</button><button className="button" disabled={work.selected.length!==work.count||tarot.busy} onClick={()=>void tarot.commit()}>{tarot.busy?'正在保存…':'确认选牌'}<ArrowRight size={17}/></button></div>
      </div>
      {tarot.error&&<p className="error-message" role="alert">{tarot.error}</p>}
      </div>
    </section>;
  }
  return <section className="draw-setup"><div className="page-intro"><h1>今天，想探索什么？</h1><p>选择一种方式，再写下你此刻的问题。</p></div>
    <section className="draw-mode-picker" aria-labelledby="draw-mode-title"><h2 id="draw-mode-title">选择抽牌模式</h2>
      <div className="draw-mode-options" role="group" aria-label="抽牌模式">{data.spreads.map(option=>{const Icon=mode_icons[option.id];return <button key={option.id} className={`draw-mode-option ${mode===option.id?'active':''}`} aria-pressed={mode===option.id} onClick={()=>on_mode(option.id)}>
        <Icon size={21} strokeWidth={1.4}/><span><strong>{option.name}</strong><small>{option.id==='free'?'1–10 张 · 自定数量':`${option.min_count} 张 · ${option.description}`}</small></span><Check className="mode-check" size={16}/>
      </button>;})}</div>
    </section>
    <div className="setup-panel"><div className="setup-art"><img src={data.card_back_url} alt="塔罗牌背面"/><span>FOLLOW YOUR INTUITION</span></div><div className="setup-form">
      {mode==='free'&&<label className="field-label">抽取数量<select value={count} onChange={e=>set_count(Number(e.target.value))}>{Array.from({length:10},(_,i)=><option key={i} value={i+1}>{i+1} 张</option>)}</select></label>}
      <label className="field-label">此刻，你想探索什么？ <span className="quiet">（可选）</span><textarea value={question} onChange={e=>set_question(e.target.value)} maxLength={500} placeholder="例如：我该如何面对眼前的变化？"/></label>
      <ReversalControl settings={settings} on_change={on_settings}/><p className="quiet">{mode==='daily'?'每日结果在当前设备当天固定。':`${total} 张牌 · ${spread.positions.join(' / ')||'自由记录'}`}</p>
      <div className="setup-actions"><button className="button" disabled={tarot.busy} onClick={()=>void tarot.start(mode,total,settings,question,false)}><Shuffle size={17}/>开始洗牌<ArrowRight size={16}/></button><button className="button secondary" disabled={tarot.busy} onClick={()=>void tarot.start(mode,total,settings,question,true)}><Sparkles size={16}/>快速抽取</button></div>
      {tarot.error&&<p className="error-message" role="alert">{tarot.error}</p>}
    </div></div>
  </section>;
}
