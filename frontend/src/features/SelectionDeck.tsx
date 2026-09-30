import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, RefObject } from 'react';
import type { Work } from '../domain/types';
import { DeckHandoff } from '../components/DeckHandoff';
import type { DeckBounds, DeckFlight } from '../components/DeckHandoff';

export function SelectionDeck({work,back,on_select,handoff}:{work:Work;back:string;on_select:(id:string)=>void;handoff?:RefObject<DeckBounds|null>}){
  const viewport=useRef<HTMLDivElement>(null);
  const [opening,set_opening]=useState(()=>!work.selected.length&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const [arriving,set_arriving]=useState(()=>!!handoff&&opening);
  const [flight,set_flight]=useState<DeckFlight|null>(null);
  const finish_handoff=useCallback(()=>{set_flight(null);set_arriving(false);},[]);

  useLayoutEffect(()=>{
    const element=viewport.current;if(!element)return;
    const measure=()=>{
      const width=element.clientWidth,pull=width<600?18:36;
      // Reserve room outside the arc so selected cards remain visible at either end.
      const radius=Math.min(420,width/2-pull-14);
      const card_width=Math.min(88,radius*.27),card_height=card_width*5/3;
      const center_y=radius+pull+14,height=center_y+card_width/2+22;
      const values={
        '--fan-center-x':width/2,'--fan-center-y':center_y,'--fan-inner':radius-card_height,
        '--fan-card-width':card_width,'--fan-card-height':card_height,'--fan-height':height,
        '--selected-pull':pull,'--stack-x':width/2,'--stack-y':center_y,
      };
      for(const [key,value] of Object.entries(values))element.style.setProperty(key,`${value}px`);
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(element);
    return()=>observer.disconnect();
  },[]);
  useLayoutEffect(()=>{
    const origin=handoff?.current;if(handoff)handoff.current=null;
    if(!opening||!origin||origin.width<=0||window.matchMedia('(prefers-reduced-motion: reduce)').matches){set_arriving(false);return;}
    // The final slot is the top of the collapsed stack; take its actual measured bounds.
    const cards=viewport.current?.querySelectorAll('.back-card');
    const bounds=cards?.[cards.length-1]?.getBoundingClientRect();
    if(bounds)set_flight({from:origin,to:bounds});else set_arriving(false);
  },[handoff,opening]);
  useEffect(()=>{
    if(!opening||arriving)return;
    // Match the final card's stagger and allow it to settle before selecting.
    const timer=setTimeout(()=>set_opening(false),3050);
    return()=>clearTimeout(timer);
  },[opening,arriving]);

  function keyboard(event:KeyboardEvent<HTMLButtonElement>,index:number){
    const buttons=viewport.current?.querySelectorAll<HTMLButtonElement>('.back-card');if(!buttons)return;
    const direction=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0;
    let next=event.key==='Home'?0:event.key==='End'?buttons.length-1:index+direction;
    if(!direction&&event.key!=='Home'&&event.key!=='End')return;
    event.preventDefault();
    const step=direction||(event.key==='Home'?1:-1);
    while(next>=0&&next<buttons.length&&buttons[next].disabled)next+=step;
    if(next>=0&&next<buttons.length)buttons[next].focus();
  }

  return <div className={`selection-deck ${opening?'is-opening':''} ${arriving?'is-arriving':''}`}>
    {flight&&<DeckHandoff flight={flight} back={back} on_done={finish_handoff}/>}
    <div className="fan-viewport" ref={viewport}>
      <div className="card-spread full-deck fan-track" role="group" aria-label="完整 78 张洗好的塔罗牌" aria-busy={opening}>
        {work.slots.map((slot,index)=>{
          const order=work.selected.indexOf(slot.slot_id),angle=index/(work.slots.length-1)*180-90,radians=angle*Math.PI/180;
          return <div className={`fan-position ${order>=0?'is-selected':''}`} key={slot.slot_id}
            style={{'--fan-angle':`${angle}deg`,'--ray-x':Math.sin(radians),'--ray-y':-Math.cos(radians),
              '--stack-layer':`${(work.slots.length-1-index)*.15}px`,'--deal-delay':`${index*18}ms`,zIndex:index} as CSSProperties}>
            <button className={`back-card ${order>=0?'chosen':''}`} onClick={()=>on_select(slot.slot_id)} onKeyDown={event=>keyboard(event,index)}
              aria-label={`牌位 ${Number(slot.slot_id.slice(5))+1}${order>=0?'，已选':''}`} aria-pressed={order>=0}
              disabled={opening||(order<0&&work.selected.length>=work.count)}>
              <img src={back} alt="" draggable={false}/>{order>=0&&<span className="selection-number">{order+1}</span>}
            </button>
          </div>;
        })}
        <div className="fan-caption" aria-hidden="true"><span>78</span><small>一副牌 · 一场探索</small></div>
      </div>
    </div>
    <p className="fan-status" role="status">{arriving?'正在放好牌组…':opening?'牌组正在展开…':'78 张牌已完整展开 · 轻触选牌，选中升起'}</p>
  </div>;
}
