import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Image as ImageIcon, Palette } from 'lucide-react';
import type { Card, Reading } from '../domain/types';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { export_reading } from '../export/share';
import { default_share_options, SHARE_MODULES } from '../export/share-content';
import type { ShareModule, ShareOptions } from '../export/share-content';

export function ShareComposer({record,title,catalog,on_close}:{record:Reading;title:string;catalog:Card[];on_close:()=>void}){
  const [options,set_options]=useState(()=>default_share_options(title));
  const [order,set_order]=useState(()=>SHARE_MODULES.map(module=>module.id));
  const [preview,set_preview]=useState(''),[busy,set_busy]=useState(false),[error,set_error]=useState('');
  const [size,set_size]=useState({width:0,height:0});
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  // 预览替换或弹窗关闭时释放 Blob URL，避免反复生成累积内存。
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  function update(change:Partial<ShareOptions>){set_options(previous=>({...previous,...change}));set_preview('');set_error('');}
  function toggle(id:ShareModule){update({modules:order.filter(module=>module===id?!options.modules.includes(id):options.modules.includes(module))});}
  function move(id:ShareModule,offset:number){
    const next=[...order],index=next.indexOf(id);[next[index],next[index+offset]]=[next[index+offset],next[index]];
    set_order(next);update({modules:next.filter(module=>options.modules.includes(module))});
  }
  function available(id:ShareModule){return id==='interpretation'?record.cards.length>1:id==='question'?!!record.question.trim():id==='notes'?!!record.notes.trim():true;}
  async function generate(){
    set_busy(true);set_error('');
    try{const blob=await export_reading(record,title,options,catalog);if(alive.current)set_preview(URL.createObjectURL(blob));}
    catch(value){if(alive.current)set_error(value instanceof Error?value.message:'分享图生成失败，请重试。');}
    finally{if(alive.current)set_busy(false);}
  }
  return <Modal title="带走这次相遇" on_close={on_close} wide>
    <div className="share-composer"><div className="share-composer-intro"><Palette size={18}/><div><p>把这次探索，装裱成一幅画。</p><span className="quiet">勾选内容组件，用箭头调整顺序。问题与笔记默认不包含。</span></div></div>
      <div className="share-workspace"><fieldset className="share-controls" disabled={busy}><legend className="sr-only">分享图自定义</legend>
        <label className="share-field">分享图标题<input aria-label="分享图标题" value={options.title} maxLength={40} onChange={event=>update({title:event.target.value})}/></label>
        <div className="share-design-fields"><div><span className="share-field-label">色调</span><Select label="分享图色调" value={options.palette} options={[{value:'umber',label:'古金棕 · 油画'},{value:'burgundy',label:'勃艮第红 · 油画'}]} on_change={value=>update({palette:value as ShareOptions['palette']})}/></div>
          <div><span className="share-field-label">排布</span><Select label="分享图排布" value={options.layout} options={[{value:'gallery',label:'卡牌画廊'},{value:'folio',label:'手稿长卷'}]} on_change={value=>update({layout:value as ShareOptions['layout']})}/></div></div>
        <div className="share-module-heading"><h3>内容组件</h3><span className="quiet">{options.modules.length} 项已选</span></div>
        <div className="share-modules">{order.map((id,index)=>{
          const module=SHARE_MODULES.find(module=>module.id===id)!,enabled=options.modules.includes(id),usable=available(id);
          return <div className={`share-module ${enabled?'enabled':''} ${usable?'':'unavailable'}`} key={id} data-module={id}>
            <label><input type="checkbox" checked={enabled} disabled={!usable} onChange={()=>toggle(id)}/><span><strong>{module.name}</strong><small>{usable?module.description:id==='interpretation'?'单张牌无需综合解读':id==='question'?'本次记录没有填写问题':'本次记录没有已保存的笔记'}</small></span></label>
            <div className="share-module-order"><button type="button" className="icon-button" aria-label={`上移${module.name}`} disabled={!enabled||index===0} onClick={()=>move(id,-1)}><ArrowUp size={14}/></button>
              <button type="button" className="icon-button" aria-label={`下移${module.name}`} disabled={!enabled||index===order.length-1} onClick={()=>move(id,1)}><ArrowDown size={14}/></button></div>
          </div>;
        })}</div>
        <div className="share-finish-options"><label><input type="checkbox" checked={options.show_date} onChange={event=>update({show_date:event.target.checked})}/>显示日期</label><label><input type="checkbox" checked={options.show_positions} onChange={event=>update({show_positions:event.target.checked})}/>显示牌位</label><label><input type="checkbox" checked={options.ornaments} onChange={event=>update({ornaments:event.target.checked})}/>金线边框</label></div>
        <label className="share-field">落款<input aria-label="分享图落款" value={options.signature} maxLength={36} placeholder="可留空" onChange={event=>update({signature:event.target.value})}/></label>
      </fieldset>
      <div className="share-preview-panel"><div className="share-preview-heading"><span className="eyebrow">YOUR READING, FRAMED</span><span className="quiet">{preview?`${size.width} × ${size.height} px`:'1200 px 高清 PNG'}</span></div>
        <div className="share-preview-scroll">{preview?<img className="share-preview" src={preview} alt="分享图预览" onLoad={event=>set_size({width:event.currentTarget.naturalWidth,height:event.currentTarget.naturalHeight})}/>:<div className="share-preview-empty"><ImageIcon size={28}/><h3>{busy?'正在装裱这次相遇…':'你的分享图将在这里展开'}</h3><p>中世纪油画质感 · 古金装饰<br/>内容按你的选择排版</p></div>}</div>
        <div className="share-export-actions"><button className="button secondary" disabled={busy||!options.modules.length} onClick={()=>void generate()}>{busy?'正在生成…':preview?'重新生成':'生成预览'}</button>
          {preview&&<a className="button" href={preview} download={`纸境-${record.local_date}.png`}><Download size={16}/>下载 PNG</a>}</div>
        {!options.modules.length&&<p className="quiet">请至少选择一个内容组件。</p>}{error&&<p role="alert" className="error-message">{error}</p>}
      </div></div>
    </div>
  </Modal>;
}
