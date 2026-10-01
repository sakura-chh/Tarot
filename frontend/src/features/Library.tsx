import { useMemo, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import type { Card, Dataset } from '../domain/types';
import { search_cards } from '../domain/rules';
import { source_url } from '../domain/validation';
import { Select } from '../components/Select';

export function CardDetail({card}:{card:Card}){
  const [reversed,set_reversed]=useState(false);
  const [meaning_mode,set_meaning_mode]=useState<'concise'|'full'>('concise');
  const details=card.meaning_details, topics=details?.[reversed?'reversed':'upright'];
  const sections=details&&topics?[
    ['牌义概览',details.overview],['传统牌面象征',details.symbolism],
    [reversed?'逆位解读':'正位解读',topics.general],['感情与关系',topics.love],
    ['工作与学业',topics.career],['行动建议',topics.advice],
  ]:[];
  return <div className="card-detail">
    <div className="detail-art"><img src={card.images.display_url} alt={card.name_zh} className={reversed?'reversed':''}/></div>
    <div className="detail-copy"><span className="eyebrow">{card.arcana==='major'?'MAJOR ARCANA':'MINOR ARCANA'}</span>
      <h2>{card.name_zh}</h2><p className="english-title">{card.name_en}</p>
      <div className="meaning-mode" role="group" aria-label="释义详细程度"><button className={meaning_mode==='concise'?'active':''} aria-pressed={meaning_mode==='concise'} onClick={()=>set_meaning_mode('concise')}>精简释义</button><button className={meaning_mode==='full'?'active':''} aria-pressed={meaning_mode==='full'} onClick={()=>set_meaning_mode('full')}>完整释义</button></div>
      <div className="segmented" role="group" aria-label="牌面方向"><button className={!reversed?'active':''} aria-pressed={!reversed} onClick={()=>set_reversed(false)}>正位牌义</button><button className={reversed?'active':''} aria-pressed={reversed} onClick={()=>set_reversed(true)}>逆位牌义</button></div>
      <div className="tags">{(reversed?card.keywords_reversed:card.keywords_upright).map(key=><span key={key}>{key}</span>)}</div>
      {meaning_mode==='full'&&sections.length?<div className="meaning-sections">{sections.map(([title,body])=><section key={title}><h3>{title}</h3><p>{body}</p></section>)}</div>:<p className="meaning-text">{reversed?card.meaning_reversed:card.meaning_upright}</p>}
      <p className="quiet meaning-note">{meaning_mode==='full'&&!sections.length?'此卡暂无完整释义，先查看精简牌义。':details?meaning_mode==='concise'?'精简释义 · 切换完整释义查看牌面与分主题解读。':'牌义根据参考资料重新整理，可结合实际情境理解。':'基础牌义 · 内容待审核'}</p>
      {card.meaning_source&&source_url(card.meaning_source.url)&&<p className="quiet meaning-source">参考资料：<a href={card.meaning_source.url} target="_blank" rel="noopener noreferrer">{card.meaning_source.name}<ArrowUpRight size={12}/></a></p>}
    </div>
  </div>;
}

export function Library({data,on_card,compact=false}:{data:Dataset;on_card:(card:Card)=>void;compact?:boolean}){
  const [query,set_query]=useState(''),[arcana,set_arcana]=useState(''),[suit,set_suit]=useState('');
  const cards=useMemo(()=>search_cards(data.cards,query,arcana,suit),[data,query,arcana,suit]);
  return <section className={compact?'library compact':'library'}>
    {!compact&&<div className="page-intro"><span className="eyebrow">THE CARD LIBRARY</span><h1>每一张牌，都有它的故事。</h1><p>浏览完整的 78 张塔罗牌，让符号成为理解自己的另一种语言。</p></div>}
    <div className="library-tools"><label className="search-input"><Search size={18}/><input value={query} onChange={e=>set_query(e.target.value)} placeholder="搜索中文、英文名称或关键词…" maxLength={100} aria-label="搜索卡牌"/></label>
      <Select label="卡牌类别" value={arcana} on_change={set_arcana} options={[{value:'',label:'全部类别'},{value:'major',label:'大阿尔卡那'},{value:'minor',label:'小阿尔卡那'}]}/>
      <Select label="卡牌花色" value={suit} on_change={set_suit} options={[{value:'',label:'全部花色'},{value:'wands',label:'权杖'},{value:'cups',label:'圣杯'},{value:'swords',label:'宝剑'},{value:'pentacles',label:'星币'}]}/>
    </div><div className="library-count"><span>{cards.length} 张卡牌</span><span>点击牌面查看正逆位解读 <ArrowUpRight size={13}/></span></div>
    <div className="library-grid">{cards.map(card=><button key={card.id} className="library-card" onClick={()=>on_card(card)}>
      <img src={card.images.display_url} alt={card.name_zh} loading="lazy" decoding="async"/><span>{card.name_zh}</span><small>{card.name_en}</small>
    </button>)}</div>
    {!cards.length&&<div className="empty-state"><h3>没有找到对应的卡牌</h3><p>换一个关键词，或调整分类条件。</p><button className="button secondary" onClick={()=>{set_query('');set_arcana('');set_suit('');}}>清除筛选</button></div>}
  </section>;
}
