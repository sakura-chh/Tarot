import { ArrowRight, ArrowUpRight, Sun, Waves, Compass, Sparkles, BookOpen, Feather } from 'lucide-react';
import type { Dataset, Mode } from '../domain/types';

const mode_icons=[Sun,Waves,Compass,Sparkles];
export function Home({data,on_mode,on_library,has_work}:{data:Dataset;on_mode:(mode:Mode)=>void;on_library:()=>void;has_work:boolean}){
  const hero_cards=['major_moon','major_star','major_hermit'].map(id=>data.cards.find(c=>c.id===id)!);
  return <>
    <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="small-star">✧</span> A LITTLE SPACE FOR YOURSELF</div>
      <h1>在纸间，<br/>与自己<span className="hero-emphasis">相遇。</span></h1>
      <p className="hero-description">轻轻洗牌，听见内心的声音。<br/>让古老的符号，为此刻的你带来新的视角。</p>
      <div className="hero-actions"><button className="button" onClick={()=>on_mode('daily')}>开始今日探索 <ArrowRight size={18}/></button><button className="text-button" onClick={on_library}>浏览卡牌 <ArrowUpRight size={15}/></button></div>
      <div className="hero-note"><Feather size={15}/><span>不急于找到答案，先给自己一点时间。</span></div>
    </div><div className="hero-visual" aria-label="星星、月亮与隐者塔罗牌"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="orbit-star star-one">✦</span><span className="orbit-star star-two">✧</span><span className="orbit-star star-three">✦</span>
      <div className="hero-cards">{hero_cards.map((card,i)=><div className={`hero-card hero-card-${i}`} key={card.id}><img src={card.images.display_url} alt={card.name_zh}/></div>)}</div>
      <span className="visual-caption">THE ANSWERS BEGIN WITHIN</span><div className="stamp"><span>78</span><small>STORIES<br/>TO EXPLORE</small></div>
    </div></section>
    <section className="modes-section"><div className="section-heading"><div><span className="eyebrow">01 / CHOOSE YOUR JOURNEY</span><h2>今天，想从哪里开始？</h2></div><p>四种方式，一段属于你的探索。</p></div>
      <div className="mode-grid">{data.spreads.map((spread,i)=>{const Icon=mode_icons[i];return <button className="mode-card" key={spread.id} onClick={()=>on_mode(spread.id)}>
        <div className="mode-top"><Icon size={27} strokeWidth={1.2}/><span>0{i+1}</span></div><h3>{spread.name}</h3><p>{spread.description}</p><div className="mode-bottom"><span>{spread.id==='free'?'1–10 张牌':`${spread.min_count} 张牌`}</span><ArrowUpRight size={17}/></div>
      </button>;})}</div>
      {has_work&&<p className="resume-note">你有一段未结束的探索。通过顶部“抽牌”入口继续。</p>}
    </section>
    <section className="quiet-banner"><span className="banner-symbol">✧</span><blockquote>“牌面是一面镜子，映照你已经拥有的感受与可能。”</blockquote><span className="eyebrow">A PRACTICE OF SELF-REFLECTION</span></section>
    <section className="library-prompt"><BookOpen size={25} strokeWidth={1.2}/><div><span className="eyebrow">GET TO KNOW THE CARDS</span><h3>从一张牌，读懂一个新的角度。</h3><p>浏览 78 张卡牌的正逆位含义，慢慢建立自己的理解。</p></div><button className="button secondary" onClick={on_library}>走进卡牌图鉴 <ArrowRight size={16}/></button></section>
  </>;
}
