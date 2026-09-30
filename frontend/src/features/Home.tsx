import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Sun, Waves, Compass, Sparkles, BookOpen } from 'lucide-react';
import type { Card, Dataset, Mode } from '../domain/types';

const mode_icons=[Sun,Waves,Compass,Sparkles];
const mode_descriptions:Record<Mode,string>={daily:'给今天一个提醒',past_present_future:'过去 · 现在 · 未来',situation_obstacle_advice:'现状 · 阻碍 · 建议',free:'按直觉选 1–10 张'};
const initial_cards=['major_moon','major_star','major_hermit'];

function HeroCard({initial,back,on_next,index}:{initial:Card;back:string;on_next:()=>Card;index:number}){
  const [card,set_card]=useState(initial),[flipping,set_flipping]=useState(false);
  const rotor=useRef<HTMLSpanElement>(null),animation=useRef<Animation|null>(null),busy=useRef(false);
  useEffect(()=>()=>{animation.current?.cancel();},[]);
  async function flip(){
    if(busy.current||!rotor.current)return;
    const next=on_next();
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){set_card(next);return;}
    busy.current=true;set_flipping(true);
    const image=new Image();image.src=next.images.display_url;
    try{
      const first=rotor.current.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:360,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
      animation.current=first;
      // Swap the face only while its back is showing, after the next artwork is decoded.
      await Promise.all([first.finished,image.decode().catch(()=>{})]);
      set_card(next);
      const second=rotor.current.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(360deg)'}],{duration:400,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'});
      animation.current=second;first.cancel();
      await second.finished;
      second.cancel();animation.current=null;
      busy.current=false;set_flipping(false);
    }catch{busy.current=false;}
  }
  return <button className={`hero-card hero-card-${index}`} onClick={()=>void flip()} disabled={flipping} aria-busy={flipping} aria-label={`${card.name_zh}，点击翻牌换一张`}>
    <span className="hero-card-rotor" ref={rotor}>
      <span className="hero-card-face"><img src={card.images.display_url} alt={card.name_zh}/></span>
      <span className="hero-card-back"><img src={back} alt=""/></span>
    </span>
  </button>;
}

export function Home({data,on_mode,on_library,has_work}:{data:Dataset;on_mode:(mode:Mode)=>void;on_library:()=>void;has_work:boolean}){
  const shown=useRef(initial_cards.slice());
  const hero_cards=initial_cards.map(id=>data.cards.find(c=>c.id===id)!);
  function next_card(index:number){
    const pool=data.cards.filter(card=>!shown.current.includes(card.id));
    const value=new Uint32Array(1);crypto.getRandomValues(value);
    const card=pool[Math.floor(value[0]/2**32*pool.length)];
    shown.current[index]=card.id;return card;
  }
  return <>
    <section className="hero">
      <div className="hero-copy"><div className="hero-kicker">留一点时间给自己</div>
        <h1>在纸间，<br/>与自己相遇。</h1>
        <p className="hero-description">翻一张牌，换一个看待此刻的角度。</p>
        <div className="hero-actions"><button className="button" onClick={()=>on_mode('daily')}>开始今日探索 <ArrowRight size={18}/></button><button className="text-button" onClick={on_library}>浏览卡牌 <ArrowUpRight size={15}/></button></div>
      </div>
      <div className="hero-visual" role="group" aria-label="点击塔罗牌，翻转换一张">
        <div className="hero-cards">{hero_cards.map((card,i)=><HeroCard key={i} initial={card} back={data.card_back_url} index={i} on_next={()=>next_card(i)}/>)}</div>
      </div>
    </section>
    <section className="modes-section"><div className="section-heading"><div><h2>今天，想从哪里开始？</h2></div><p>选一种适合此刻的方式。</p></div>
      <div className="mode-grid">{data.spreads.map((spread,i)=>{const Icon=mode_icons[i];return <button className="mode-card" key={spread.id} onClick={()=>on_mode(spread.id)}>
        <Icon className="mode-icon" size={23} strokeWidth={1.3}/><div className="mode-content"><h3>{spread.name}</h3><p>{mode_descriptions[spread.id]}</p></div><div className="mode-meta"><span>{spread.id==='free'?'1–10 张':`${spread.min_count} 张`}</span><ArrowUpRight size={16}/></div>
      </button>;})}</div>
      {has_work&&<p className="resume-note">你有一段未结束的探索。通过顶部“抽牌”入口继续。</p>}
    </section>
    <section className="library-prompt"><BookOpen size={25} strokeWidth={1.2}/><div><h3>认识这 78 张牌。</h3><p>从牌面、象征到正逆位含义，慢慢建立自己的理解。</p></div><button className="button secondary" onClick={on_library}>走进卡牌图鉴 <ArrowRight size={16}/></button></section>
  </>;
}
