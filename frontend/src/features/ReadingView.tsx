import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Download, ArrowUpRight, Check, PenLine, RotateCcw, Layers } from 'lucide-react';
import type { Card, Dataset, Reading } from '../domain/types';
import { play_effect } from '../audio/controller';
import { interpret_cards, interpret_reading } from '../domain/interpretation';
import { ReadingGuidance } from './ReadingGuidance';
import { ShareComposer } from './ShareComposer';

function useCardImage(card:Reading['cards'][number]){
  const [fallback,set_fallback]=useState('');
  useEffect(()=>{
    if(!card.display_blob)return;const value=URL.createObjectURL(card.display_blob);set_fallback(value);return()=>URL.revokeObjectURL(value);
  },[card]);
  // 在线图片与本地快照都保持高清尺寸，回退时不降级为缩略图。
  return {url:card.card.images.display_url,fallback};
}
function RevealingCard({picked,revealed,back,on_flip,on_card}:{picked:Reading['cards'][number];revealed:boolean;back:string;on_flip:()=>void;on_card:(card:Card)=>void}){
  const {url,fallback}=useCardImage(picked);
  return <article className="reading-card"><span className="position-label">{picked.position}</span>
    <button className={`flip-card ${revealed?'is-flipped':''}`} onClick={()=>revealed?on_card(picked.card):on_flip()} aria-label={revealed?`查看${picked.card.name_zh}`:`翻开${picked.position}`}>
      <span className="flip-inner"><span className="flip-back"><img src={back} alt=""/><span className="flip-hint">轻触翻牌</span></span>
        <span className="flip-front"><img src={url} alt={revealed?picked.card.name_zh:''} className={picked.is_reversed?'reversed':''}
          onError={event=>{if(fallback&&event.currentTarget.src!==fallback)event.currentTarget.src=fallback;}}/></span></span>
    </button>
    <div className={`reading-copy ${revealed?'visible':''}`} aria-hidden={!revealed}><h3>{revealed?picked.card.name_zh:'等待揭晓'}</h3>
      <p className="english-title">{revealed?picked.card.name_en:'A MOMENT OF DISCOVERY'}</p>
      {revealed&&<><span className="orientation">{picked.is_reversed?'逆位':'正位'}</span><div className="tags">{(picked.is_reversed?picked.card.keywords_reversed:picked.card.keywords_upright).map(key=><span key={key}>{key}</span>)}</div>
        <p>{picked.is_reversed?picked.card.meaning_reversed:picked.card.meaning_upright}</p><button className="text-button" onClick={()=>on_card(picked.card)}>查看牌义 <ArrowUpRight size={14}/></button></>}
    </div>
  </article>;
}

export function ReadingView({record,data,on_update,on_card,on_again}:{record:Reading;data:Dataset;on_update:(r:Reading)=>Promise<void>;on_card:(c:Card)=>void;on_again?:()=>void}){
  const stage=useRef<HTMLDivElement>(null),grid=useRef<HTMLDivElement>(null);
  const count=record.cards.length;
  const [notes,set_notes]=useState(record.notes),[message,set_message]=useState(''),[saving,set_saving]=useState(false);
  const [share,set_share]=useState(false),[error,set_error]=useState('');
  const title=data.spreads.find(s=>s.id===record.mode)?.name??'塔罗记录';
  const interpretation=interpret_reading(record,data.cards);
  const guidance=interpret_cards(record,data.cards);
  const fully_revealed=record.cards.every(card=>record.revealed.includes(card.slot_id));
  useLayoutEffect(()=>{
    const element=grid.current;if(!element)return;
    const measure=()=>{
      const mobile=window.innerWidth<=800;
      const columns=Math.min(count,mobile?(count>6?5:3):window.innerWidth>=1200?10:5),rows=Math.ceil(count/columns),dense=rows>1;
      const gap=mobile?8:count>6?12:20,top=element.getBoundingClientRect().top+window.scrollY;
      const available=window.innerHeight-top-(mobile?110:18);
      const copy_space=dense?56:78,position_space=dense?20:26;
      const row_height=(available-gap*(rows-1))/rows;
      const cell_width=(element.clientWidth-gap*(columns-1))/columns;
      const max_width=mobile?(count===1?170:count===2?146:count<=3?108:count<=6?88:62):215;
      const width=Math.min(max_width,cell_width,Math.max(40,(row_height-position_space-copy_space)*2538/4208));
      element.style.setProperty('--reading-columns',String(columns));
      element.style.setProperty('--reading-gap',`${gap}px`);
      element.style.setProperty('--reading-card-width',`${width}px`);
      element.dataset.dense=String(dense);
    };
    measure();const observer=new ResizeObserver(measure);if(stage.current)observer.observe(stage.current);
    window.addEventListener('resize',measure);
    return()=>{observer.disconnect();window.removeEventListener('resize',measure);};
  },[record.id,count]);
  useEffect(()=>{set_notes(record.notes);},[record.id,record.notes]);
  async function flip(id?:string){
    set_error('');try{const revealed=id?[...new Set([...record.revealed,id])]:record.cards.map(c=>c.slot_id);
      await on_update({...record,revealed});play_effect('flip');}catch{set_error('翻牌进度没有保存，请重试。');}
  }
  async function save_notes(){set_saving(true);try{await on_update({...record,notes});set_message('笔记已保存');}catch{set_error('笔记未保存，请重试。');}finally{set_saving(false);}}
  return <section className={`reading-section ${count>1?'multi-reading':''}`}><div className="reading-stage" ref={stage}><div className="reading-intro"><span className="eyebrow">YOUR READING · {record.local_date}</span><h1 tabIndex={-1}>{title}</h1>
    <p>{record.question||'深呼吸，留意此刻最先浮现的感受。'}</p><span className="quiet">{record.source==='offline'?'离线抽牌 · ':''}已保存到本设备 · {record.settings_snapshot.reversed_enabled?`逆位概率 ${record.settings_snapshot.reversed_probability}%`:'仅正位'}</span></div>
    <div className="reveal-toolbar"><div className="reveal-context">{on_again&&<button className="button secondary change-mode-button" onClick={on_again}><Layers size={15}/>选择抽牌模式</button>}<span role="status">已翻 <strong>{record.cards.filter(card=>record.revealed.includes(card.slot_id)).length} / {count}</strong></span></div>
      {!fully_revealed?<button className="button secondary" onClick={()=>void flip()}>全部翻开</button>:<span className="quiet">点击牌面查看牌义</span>}
    </div>
    <div className={`reading-grid count-${count}`} ref={grid}>{record.cards.map(picked=><RevealingCard key={picked.slot_id} picked={picked} back={data.card_back_url}
      revealed={record.revealed.includes(picked.slot_id)} on_flip={()=>void flip(picked.slot_id)} on_card={on_card}/>)}</div></div>
    {interpretation&&<section className="reading-interpretation" aria-labelledby="reading-interpretation-title">
      <div className="interpretation-heading"><span className="eyebrow">THE CARDS TOGETHER</span><h2 id="reading-interpretation-title">牌阵综合解读</h2><p>把这 {record.cards.length} 张牌放在一起，看看它们如何相互回应。</p></div>
      <div className="interpretation-sections">{interpretation.sections.map(section=><div key={section.title}><h3>{section.title}</h3>
        {section.paragraphs?<><p>{section.paragraphs[0]}</p>{section.items&&<ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul>}{section.paragraphs.slice(1).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</>:<p>{section.text}</p>}
      </div>)}</div>
      <p className="quiet interpretation-note">结合牌位、正逆位与传统牌义整理，可对照你的实际情境理解。</p>
    </section>}
    <ReadingGuidance cards={guidance} question={record.question} total={count} on_card={slot_id=>{const picked=record.cards.find(card=>card.slot_id===slot_id);if(picked)on_card(picked.card);}}/>
    {fully_revealed&&<div className="reading-actions"><button className="button" onClick={()=>set_share(true)}><Download size={17}/>导出分享图</button>{on_again&&record.mode!=='daily'&&<button className="button secondary" onClick={on_again}><RotateCcw size={16}/>再次抽牌</button>}</div>}
    <div className="notes-panel"><div><span className="eyebrow"><PenLine size={13}/> A NOTE TO MYSELF</span><h3>把此刻的想法，留在这里。</h3></div>
      <textarea value={notes} maxLength={5000} onChange={e=>{set_notes(e.target.value);set_message('');}} placeholder="这张牌让我想到了什么？我想尝试怎样的一小步？" aria-label="我的笔记"/>
      <div className="notes-footer"><span className="quiet">{message||'仅保存在当前设备'}</span><button className="button secondary" disabled={saving||notes===record.notes} onClick={()=>void save_notes()}><Check size={16}/>保存笔记</button></div></div>
    {error&&<p className="error-message" role="alert">{error}</p>}
    {share&&<ShareComposer record={record} title={title} catalog={data.cards} on_close={()=>set_share(false)}/>}
  </section>;
}
