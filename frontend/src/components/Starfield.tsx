import type { AnimationEvent, CSSProperties } from 'react';

type SkyStyle=CSSProperties & Record<`--${string}`,string>;

// Stars change position only at the invisible end of each fading cycle.
let seed=8317;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const stars=Array.from({length:260},()=>{
  const brightness=random(),bright=brightness>.95;
  return {
    left:`${random()*100}%`,top:`${random()*100}%`,
    '--star-size':`${bright?1.8:brightness>.7?1.2:.65}px`,
    '--star-opacity':`${.12+brightness*.65}`,
    '--star-color':random()>.83?'#f3e4cf':'#e0e7f2',
    '--star-delay':`${-random()*20}s`,'--star-duration':`${4+random()*9}s`,
  } as SkyStyle;
});
const meteors=[
  {left:'8%',top:'12%','--meteor-delay':'4s','--meteor-duration':'19s'},
  {left:'51%',top:'5%','--meteor-delay':'12s','--meteor-duration':'27s'},
  {left:'30%',top:'27%','--meteor-delay':'24s','--meteor-duration':'37s'},
] satisfies SkyStyle[];

function relocate_star(event:AnimationEvent<HTMLSpanElement>){
  if(event.animationName!=='star-glimmer')return;
  const style=event.currentTarget.style,brightness=Math.random();
  style.left=`${Math.random()*100}%`;style.top=`${Math.random()*100}%`;
  style.setProperty('--star-size',`${brightness>.95?1.8:brightness>.7?1.2:.65}px`);
  style.setProperty('--star-opacity',`${.12+brightness*.65}`);
  style.setProperty('--star-color',Math.random()>.83?'#f3e4cf':'#e0e7f2');
}

export function Starfield(){
  return <div className="starfield" aria-hidden="true">
    {stars.map((style,i)=><span key={i} className="sky-star" style={style} onAnimationIteration={relocate_star}/>)}
    {meteors.map((style,i)=><span key={`meteor-${i}`} className="sky-meteor" style={style}/>)}
  </div>;
}
