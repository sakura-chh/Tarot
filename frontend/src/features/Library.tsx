import { useMemo, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import type { Card, Dataset } from '../domain/types';
import { search_cards } from '../domain/rules';

export function CardDetail({card}:{card:Card}){
  const [reversed,set_reversed]=useState(false);
  return <div className="card-detail">
    <div className="detail-art"><img src={card.images.display_url} alt={card.name_zh} className={reversed?'reversed':''}/></div>
    <div className="detail-copy"><span className="eyebrow">{card.arcana==='major'?'MAJOR ARCANA':'MINOR ARCANA'}</span>
      <h2>{card.name_zh}</h2><p className="english-title">{card.name_en}</p>
      <div className="segmented"><button className={!reversed?'active':''} onClick={()=>set_reversed(false)}>正位牌义</button><button className={reversed?'active':''} onClick={()=>set_reversed(true)}>逆位牌义</button></div>
      <div className="tags">{(reversed?card.keywords_reversed:card.keywords_upright).map(key=><span key={key}>{key}</span>)}</div>
      <p className="meaning-text">{reversed?card.meaning_reversed:card.meaning_upright}</p><p className="quiet">基础牌义 · 内容待审核</p>
    </div>
  </div>;
}

export function Library({data,on_card,compact=false}:{data:Dataset;on_card:(card:Card)=>void;compact?:boolean}){
  const [query,set_query]=useState(''),[arcana,set_arcana]=useState(''),[suit,set_suit]=useState('');
  const cards=useMemo(()=>search_cards(data.cards,query,arcana,suit),[data,query,arcana,suit]);
  return <section className={compact?'library compact':'library'}>
    {!compact&&<div className="page-intro"><span className="eyebrow">THE CARD LIBRARY</span><h1>每一张牌，都有它的故事。</h1><p>浏览完整的 78 张塔罗牌，让符号成为理解自己的另一种语言。</p></div>}
    <div className="library-tools"><label className="search-input"><Search size={18}/><input value={query} onChange={e=>set_query(e.target.value)} placeholder="搜索中文、英文名称或关键词…" maxLength={100} aria-label="搜索卡牌"/></label>
      <select value={arcana} onChange={e=>set_arcana(e.target.value)} aria-label="卡牌类别"><option value="">全部类别</option><option value="major">大阿尔卡那</option><option value="minor">小阿尔卡那</option></select>
      <select value={suit} onChange={e=>set_suit(e.target.value)} aria-label="卡牌花色"><option value="">全部花色</option><option value="wands">权杖</option><option value="cups">圣杯</option><option value="swords">宝剑</option><option value="pentacles">星币</option></select>
    </div><div className="library-count"><span>{cards.length} 张卡牌</span><span>点击牌面查看正逆位解读 <ArrowUpRight size={13}/></span></div>
    <div className="library-grid">{cards.map(card=><button key={card.id} className="library-card" onClick={()=>on_card(card)}>
      <img src={card.images.display_url} alt={card.name_zh} loading="lazy" decoding="async"/><span>{card.name_zh}</span><small>{card.name_en}</small>
    </button>)}</div>
    {!cards.length&&<div className="empty-state"><h3>没有找到对应的卡牌</h3><p>换一个关键词，或调整分类条件。</p><button className="button secondary" onClick={()=>{set_query('');set_arcana('');set_suit('');}}>清除筛选</button></div>}
  </section>;
}
