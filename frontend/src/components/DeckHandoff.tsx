import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type DeckBounds=Pick<DOMRect,'x'|'y'|'width'|'height'>;
export interface DeckFlight { from:DeckBounds; to:DeckBounds }

export function DeckHandoff({flight,back,on_done}:{flight:DeckFlight;back:string;on_done:()=>void}){
  const image=useRef<HTMLImageElement>(null);
  useLayoutEffect(()=>{
    const element=image.current;if(!element)return;
    const {from,to}=flight;
    const motion=element.animate([
      {transform:'translate(0,0) scale(1,1)'},
      {transform:`translate(${to.x-from.x}px,${to.y-from.y}px) scale(${to.width/from.width},${to.height/from.height})`},
    ],{duration:620,easing:'cubic-bezier(.38,0,.22,1)',fill:'forwards'});
    let live=true;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish=()=>{if(reduced.matches)motion.finish();};
    reduced.addEventListener('change',finish);finish();
    void motion.finished.then(()=>{if(live)on_done();}).catch(()=>{});
    return()=>{live=false;reduced.removeEventListener('change',finish);motion.cancel();};
  },[flight,on_done]);
  return createPortal(<img className="deck-handoff" ref={image} src={back} alt="" aria-hidden="true" style={{left:flight.from.x,top:flight.from.y,width:flight.from.width,height:flight.from.height}}/>,document.body);
}
