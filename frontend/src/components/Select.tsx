import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type Option={value:string;label:string};

export function Select({label,value,options,on_change}:{label:string;value:string;options:Option[];on_change:(value:string)=>void}){
  const id=useId(),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);
  const selected=Math.max(0,options.findIndex(option=>option.value===value));
  const [open,set_open]=useState(false),[active,set_active]=useState(selected);
  const search=useRef({text:'',time:0});

  useLayoutEffect(()=>{
    if(!open)return;
    const panel=menu.current!;
    // 使用浏览器顶层显示菜单，避免被毛玻璃面板的层级或滚动容器裁剪。
    panel.showPopover();
    const place=()=>{
      const rect=root.current!.getBoundingClientRect(),gap=8,edge=12;
      const below=window.innerHeight-rect.bottom-gap-edge,above=rect.top-gap-edge;
      const upwards=below<Math.min(320,options.length*44+12)&&above>below;
      const height=Math.min(320,Math.max(44,upwards?above:below));
      const width=Math.min(rect.width,window.innerWidth-edge*2);
      panel.style.width=`${width}px`;panel.style.maxHeight=`${height}px`;
      panel.style.left=`${Math.max(edge,Math.min(rect.left,window.innerWidth-width-edge))}px`;
      panel.style.top=upwards?'auto':`${rect.bottom+gap}px`;
      panel.style.bottom=upwards?`${window.innerHeight-rect.top+gap}px`:'auto';
    };
    place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
    return ()=>{panel.hidePopover();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
  },[open,options.length]);

  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))set_open(false);};
    document.addEventListener('pointerdown',outside);
    return ()=>document.removeEventListener('pointerdown',outside);
  },[open]);

  useLayoutEffect(()=>{
    if(!open)return;
    const panel=menu.current!,option=panel.children[active] as HTMLElement;
    if(option.offsetTop<panel.scrollTop)panel.scrollTop=option.offsetTop;
    else if(option.offsetTop+option.offsetHeight>panel.scrollTop+panel.clientHeight)panel.scrollTop=option.offsetTop+option.offsetHeight-panel.clientHeight;
  },[open,active]);

  function choose(index:number){on_change(options[index].value);set_open(false);trigger.current?.focus();}
  function key(event:KeyboardEvent<HTMLButtonElement>){
    const {key}=event;
    if(key==='Escape'&&open){event.preventDefault();event.stopPropagation();set_open(false);return;}
    if(key==='Tab'){set_open(false);return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(key)){
      event.preventDefault();
      set_active(key==='Home'?0:key==='End'?options.length-1:!open?selected:Math.max(0,Math.min(options.length-1,active+(key==='ArrowDown'?1:-1))));
      set_open(true);return;
    }
    if(key==='Enter'||key===' '){event.preventDefault();if(open)choose(active);else{set_active(selected);set_open(true);}return;}
    if(key.length===1&&!event.metaKey&&!event.ctrlKey&&!event.altKey){
      const now=Date.now(),text=(now-search.current.time<700?search.current.text:'')+key.toLocaleLowerCase();
      search.current={text,time:now};
      const index=options.findIndex(option=>option.label.toLocaleLowerCase().startsWith(text));
      if(index>=0){event.preventDefault();set_active(index);set_open(true);}
    }
  }

  return <div className="glass-select" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))set_open(false);}}>
    <button ref={trigger} type="button" tabIndex={0} className="select-trigger" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} aria-activedescendant={open?`${id}-${active}`:undefined} onKeyDown={key} onClick={()=>{set_active(selected);set_open(!open);}}>
      <span>{options[selected]?.label}</span><ChevronDown size={16} aria-hidden="true"/>
    </button>
    <div ref={menu} id={id} className="select-menu" role="listbox" aria-label={label} popover="manual">
      {options.map((option,index)=><div key={option.value} id={`${id}-${index}`} role="option" aria-selected={value===option.value} className={`select-option ${index===active?'highlighted':''}`} onPointerMove={()=>set_active(index)} onPointerDown={event=>event.preventDefault()} onClick={()=>choose(index)}>
        <span>{option.label}</span><Check size={15} aria-hidden="true"/>
      </div>)}
    </div>
  </div>;
}
