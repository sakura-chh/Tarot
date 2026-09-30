import { useLayoutEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export function GlassNavigation<T extends string>({items,active,on_change,mobile=false}:{items:[T,string,LucideIcon][];active:T;on_change:(key:T)=>void;mobile?:boolean}){
  const container=useRef<HTMLElement>(null);
  useLayoutEffect(()=>{
    const nav=container.current;if(!nav)return;
    const position=()=>{
      const button=nav.querySelector<HTMLButtonElement>('[aria-current="page"]');
      if(!button||!nav.offsetWidth)return;
      nav.style.setProperty('--nav-left',`${button.offsetLeft}px`);
      nav.style.setProperty('--nav-top',`${button.offsetTop}px`);
      nav.style.setProperty('--nav-width',`${button.offsetWidth}px`);
      nav.style.setProperty('--nav-height',`${button.offsetHeight}px`);
    };
    position();const observer=new ResizeObserver(position);observer.observe(nav);
    return()=>observer.disconnect();
  },[active]);
  return <nav ref={container} className={mobile?'mobile-nav':'desktop-nav'} aria-label={mobile?'手机导航':'主导航'}>
    <span className="nav-indicator" aria-hidden="true"/>
    {items.map(([key,label,Icon])=><button key={key} className={active===key?'active':''} aria-current={active===key?'page':undefined} onClick={()=>on_change(key)}>
      <Icon size={mobile?20:16} strokeWidth={1.6}/><span>{mobile?(label==='卡牌图鉴'?'图鉴':label==='我的记录'?'记录':label):label}</span>
    </button>)}
  </nav>;
}
