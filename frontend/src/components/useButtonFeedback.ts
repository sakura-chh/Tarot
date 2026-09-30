import { useEffect } from 'react';

export function useButtonFeedback(){
  useEffect(()=>{
    let pressed:HTMLButtonElement|null=null;
    const rebounds=new WeakMap<HTMLButtonElement,Animation>();
    const running=new Set<Animation>();
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const find_button=(target:EventTarget|null)=>target instanceof Element?target.closest<HTMLButtonElement>('button:not(:disabled)'):null;
    const surface=(button:HTMLButtonElement)=>button.classList.contains('back-card')?button.querySelector('img')??button:button;
    const current_scale=(element:Element)=>parseFloat(getComputedStyle(element).scale)||1;
    function track(button:HTMLButtonElement,animation:Animation){
      rebounds.set(button,animation);running.add(animation);
      void animation.finished.then(()=>running.delete(animation)).catch(()=>running.delete(animation));
    }
    function reset(){if(pressed){delete pressed.dataset.pressed;rebounds.get(pressed)?.cancel();}pressed=null;}
    function press(button:HTMLButtonElement|null){
      if(!button)return;
      const target=surface(button),start=current_scale(target);
      reset();rebounds.get(button)?.cancel();pressed=button;button.dataset.pressed='true';
      if(!reduced.matches)track(button,target.animate([{scale:String(start)},{scale:'.96'}],{duration:110,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}));
    }
    function release(){
      const button=pressed,target=button?surface(button):null,start=target?current_scale(target):1;reset();
      if(!button?.isConnected||button.disabled||reduced.matches)return;
      // Sample a damped spring from the actual release scale, including rapid re-presses.
      const duration=560,damping=.48,frequency=24,angular=frequency*Math.sqrt(1-damping*damping);
      const frames=Array.from({length:49},(_,i)=>{
        const offset=i/48,time=offset*duration/1000;
        const decay=Math.exp(-damping*frequency*time)*(Math.cos(angular*time)+damping*frequency/angular*Math.sin(angular*time));
        return {scale:String(i===48?1:1+(start-1)*decay),offset};
      });
      track(button,target!.animate(frames,{duration,easing:'linear'}));
    }
    const pointer_down=(event:PointerEvent)=>{if(event.isPrimary&&event.button===0)press(find_button(event.target));};
    const key_down=(event:KeyboardEvent)=>{if(!event.repeat&&(event.key===' '||event.key==='Enter'))press(find_button(event.target));};
    const key_up=(event:KeyboardEvent)=>{if(event.key===' '||event.key==='Enter')release();};
    document.addEventListener('pointerdown',pointer_down,true);
    window.addEventListener('pointerup',release,true);
    window.addEventListener('pointercancel',reset,true);
    document.addEventListener('keydown',key_down,true);
    window.addEventListener('keyup',key_up,true);
    window.addEventListener('blur',reset);
    return()=>{
      reset();running.forEach(animation=>animation.cancel());
      document.removeEventListener('pointerdown',pointer_down,true);
      window.removeEventListener('pointerup',release,true);
      window.removeEventListener('pointercancel',reset,true);
      document.removeEventListener('keydown',key_down,true);
      window.removeEventListener('keyup',key_up,true);
      window.removeEventListener('blur',reset);
    };
  },[]);
}
