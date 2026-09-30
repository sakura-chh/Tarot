import { useEffect, useState } from 'react';
import { Download, ArrowUpRight, Check, PenLine, RotateCcw, Layers } from 'lucide-react';
import type { Card, Dataset, Reading } from '../domain/types';
import { play_effect } from '../audio/controller';
import { export_reading } from '../export/share';
import { Modal } from '../components/Modal';
import { interpret_reading } from '../domain/interpretation';

function useCardImage(card:Reading['cards'][number]){
  const [fallback,set_fallback]=useState('');
  useEffect(()=>{
    if(!card.display_blob)return;const value=URL.createObjectURL(card.display_blob);set_fallback(value);return()=>URL.revokeObjectURL(value);
  },[card]);
  // Both the primary image and the local fallback keep the same full-size resolution.
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
  const [notes,set_notes]=useState(record.notes),[message,set_message]=useState(''),[saving,set_saving]=useState(false);
  const [share,set_share]=useState(false),[include_question,set_question]=useState(false),[include_notes,set_include_notes]=useState(false);
  const [preview,set_preview]=useState(''),[exporting,set_exporting]=useState(false),[error,set_error]=useState('');
  const title=data.spreads.find(s=>s.id===record.mode)?.name??'塔罗记录';
  const interpretation=interpret_reading(record,data.cards);
  const fully_revealed=record.cards.every(card=>record.revealed.includes(card.slot_id));
  useEffect(()=>{set_notes(record.notes);},[record.id,record.notes]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  async function flip(id?:string){
    set_error('');try{const revealed=id?[...new Set([...record.revealed,id])]:record.cards.map(c=>c.slot_id);
      await on_update({...record,revealed});play_effect('flip');}catch{set_error('翻牌进度没有保存，请重试。');}
  }
  async function save_notes(){set_saving(true);try{await on_update({...record,notes});set_message('笔记已保存');}catch{set_error('笔记未保存，请重试。');}finally{set_saving(false);}}
  async function make_image(){set_exporting(true);set_error('');try{const blob=await export_reading(record,title,include_question,include_notes);set_preview(URL.createObjectURL(blob));}catch{set_error('分享图生成失败，请重试。');}finally{set_exporting(false);}}
  return <section className={`reading-section ${record.cards.length>1?'multi-reading':''}`}><div className="reading-intro"><span className="eyebrow">YOUR READING · {record.local_date}</span><h1 tabIndex={-1}>{title}</h1>
    <p>{record.question||'深呼吸，留意此刻最先浮现的感受。'}</p><span className="quiet">{record.source==='offline'?'离线抽牌 · ':''}已保存到本设备 · {record.settings_snapshot.reversed_enabled?`逆位概率 ${record.settings_snapshot.reversed_probability}%`:'仅正位'}</span>{on_again&&record.cards.length===1&&<button className="button secondary change-mode-button reading-mode-button" onClick={on_again}><Layers size={15}/>选择抽牌模式</button>}</div>
    {record.cards.length>1&&<div className="reveal-toolbar"><div className="reveal-context">{on_again&&<button className="button secondary change-mode-button" onClick={on_again}><Layers size={15}/>选择抽牌模式</button>}<span role="status">已翻 <strong>{record.cards.filter(card=>record.revealed.includes(card.slot_id)).length} / {record.cards.length}</strong></span></div>
      {!fully_revealed?<button className="button secondary" onClick={()=>void flip()}>全部翻开</button>:<span className="quiet">点击牌面查看牌义</span>}
    </div>}
    <div className={`reading-grid count-${record.cards.length}`}>{record.cards.map(picked=><RevealingCard key={picked.slot_id} picked={picked} back={data.card_back_url}
      revealed={record.revealed.includes(picked.slot_id)} on_flip={()=>void flip(picked.slot_id)} on_card={on_card}/>)}</div>
    {interpretation&&<section className="reading-interpretation" aria-labelledby="reading-interpretation-title">
      <div className="interpretation-heading"><span className="eyebrow">THE CARDS TOGETHER</span><h2 id="reading-interpretation-title">牌阵综合解读</h2><p>把这 {record.cards.length} 张牌放在一起，看看它们如何相互回应。</p></div>
      <div className="interpretation-sections">{interpretation.sections.map(section=><div key={section.title}><h3>{section.title}</h3><p>{section.text}</p></div>)}</div>
      <p className="quiet interpretation-note">结合牌位、正逆位与传统牌义整理，可对照你的实际情境理解。</p>
    </section>}
    {record.cards.length===1&&!fully_revealed&&<div className="reading-actions"><button className="button secondary" onClick={()=>void flip()}>全部翻开</button></div>}
    {fully_revealed&&<div className="reading-actions"><button className="button" onClick={()=>set_share(true)}><Download size={17}/>导出分享图</button>{on_again&&record.mode!=='daily'&&<button className="button secondary" onClick={on_again}><RotateCcw size={16}/>再次抽牌</button>}</div>}
    <div className="notes-panel"><div><span className="eyebrow"><PenLine size={13}/> A NOTE TO MYSELF</span><h3>把此刻的想法，留在这里。</h3></div>
      <textarea value={notes} maxLength={5000} onChange={e=>{set_notes(e.target.value);set_message('');}} placeholder="这张牌让我想到了什么？我想尝试怎样的一小步？" aria-label="我的笔记"/>
      <div className="notes-footer"><span className="quiet">{message||'仅保存在当前设备'}</span><button className="button secondary" disabled={saving||notes===record.notes} onClick={()=>void save_notes()}><Check size={16}/>保存笔记</button></div></div>
    {error&&<p className="error-message" role="alert">{error}</p>}
    {share&&<Modal title="带走这次相遇" on_close={()=>{set_share(false);set_preview('');}}>
      <p className="quiet">分享图默认不包含个人问题或笔记。</p><div className="share-options"><label><input type="checkbox" checked={include_question} onChange={e=>{set_question(e.target.checked);set_preview('');}}/>包含我的问题</label><label><input type="checkbox" checked={include_notes} onChange={e=>{set_include_notes(e.target.checked);set_preview('');}}/>包含笔记（最多 700 字）</label></div>
      {preview&&<img className="share-preview" src={preview} alt="分享图预览"/>}
      <div className="modal-actions"><button className="button secondary" disabled={exporting} onClick={()=>void make_image()}>{exporting?'正在生成…':preview?'重新生成':'生成预览'}</button>{preview&&<a className="button" href={preview} download={`纸境-${record.local_date}.png`}><Download size={16}/>下载 PNG</a>}</div>
      {error&&<p role="alert" className="error-message">{error}</p>}
    </Modal>}
  </section>;
}
