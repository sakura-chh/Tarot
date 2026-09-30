import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({title,on_close,children,wide=false}:{title:string;on_close:()=>void;children:ReactNode;wide?:boolean}){
  const panel=useRef<HTMLDivElement>(null),previous=useRef<Element|null>(null);
  useEffect(()=>{
    previous.current=document.activeElement;const scroll=document.body.style.overflow;document.body.style.overflow='hidden';
    const input=panel.current?.querySelector<HTMLElement>('input,button');input?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();on_close();}
      if(event.key==='Tab'){
        const elements=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href]')??[]);
        const first=elements[0],last=elements.at(-1);
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener('keydown',key);
    return ()=>{document.body.style.overflow=scroll;window.removeEventListener('keydown',key);(previous.current as HTMLElement)?.focus?.();};
  },[on_close]);
  return <div className="modal-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)on_close();}}>
    <div className={`modal ${wide?'wide':''}`} role="dialog" aria-modal="true" aria-label={title} ref={panel}>
      <header className="modal-header"><span className="eyebrow">TAROT ATELIER</span><h2>{title}</h2><button className="icon-button modal-close" onClick={on_close} aria-label="关闭"><X size={22}/></button></header>
      {children}
    </div>
  </div>;
}
