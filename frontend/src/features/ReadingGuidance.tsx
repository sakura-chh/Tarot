import { ArrowUpRight, ChevronDown } from 'lucide-react';
import type { CardInterpretation } from '../domain/interpretation';

export function ReadingGuidance({cards,question,total,on_card}:{cards:CardInterpretation[];question:string;total:number;on_card:(slot_id:string)=>void}){
  if(!cards.length)return null;
  return <section className="reading-guidance" aria-labelledby="reading-guidance-title">
    <div className="guidance-heading"><span className="eyebrow">READ THE DETAILS</span><h2 id="reading-guidance-title">{total===1?'这张牌的解读':'逐张解读'}</h2>
      <p>从核心牌义到牌位中的作用，再到可以实践的一步。</p><span className="quiet">已解读 {cards.length} / {total} 张{cards.length<total?' · 继续翻牌，查看其余提示':''}</span>
    </div>
    {question.trim()&&<div className="guidance-question"><span className="eyebrow">你关注的问题</span><p>{question}</p></div>}
    <div className="guidance-cards">{cards.map(card=><article className="card-guidance" key={card.slot_id}>
      <header><div><span className="guidance-position">{card.position}</span><h3>{card.name}<span className="orientation">{card.orientation}</span></h3><p className="guidance-focus">{card.focus}</p></div>
        <button className="text-button" onClick={()=>on_card(card.slot_id)}>查看牌面 <ArrowUpRight size={14}/></button></header>
      <div className="guidance-keywords">{card.keywords.map(keyword=><span key={keyword}>{keyword}</span>)}</div>
      <div className="guidance-main"><section><h4>核心牌义</h4><p>{card.general}</p></section><section><h4>在这个牌位中</h4><p>{card.context}</p></section></div>
      <section className="guidance-action"><h4>可以尝试的行动</h4><p>{card.advice}</p></section>
      <div className="guidance-reflection"><span>留给自己的问题</span><p>{card.reflection}</p></div>
      {(card.overview||card.symbolism||card.love||card.career)&&<details className="guidance-more"><summary>牌面象征与生活中的应用 <ChevronDown size={16}/></summary>
        <div>{card.overview&&<section><h4>理解这张牌</h4><p>{card.overview}</p></section>}{card.symbolism&&<section><h4>传统牌面象征</h4><p>{card.symbolism}</p></section>}
          {card.love&&<section><h4>感情与关系 · {card.orientation}</h4><p>{card.love}</p></section>}{card.career&&<section><h4>工作与学业 · {card.orientation}</h4><p>{card.career}</p></section>}</div>
      </details>}
    </article>)}</div>
    <p className="quiet guidance-note">{cards.some(card=>card.orientation==='逆位')?'逆位侧重观察受阻、失衡或需要调整的部分；可结合实际经历理解。':'可以将这些提示与实际经历对照，保留对你有帮助的部分。'}</p>
  </section>;
}
