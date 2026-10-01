import { Download, CheckCircle2, Music2, Volume2, WifiOff, Trash2, Pause } from 'lucide-react';
import type { BundleState, Settings as SettingValues } from '../domain/types';
import { ReversalControl } from './Draw';

function VolumeControl({id,label,value,on_change}:{id:string;label:string;value:number;on_change:(value:number)=>void}){
  return <div className="volume-control"><label htmlFor={id}>{label}</label><output htmlFor={id}>{value}%</output>
    <input id={id} type="range" min="0" max="100" step="1" value={value} aria-valuetext={`${value}%`} onChange={event=>on_change(Number(event.target.value))}/>
  </div>;
}

export function Settings({settings,on_change,bundle,progress,downloading,on_download,on_cancel,on_clear_cache,on_clear_personal,error}:{
  settings:SettingValues;on_change:(s:SettingValues)=>void;bundle?:BundleState;progress:number;downloading:boolean;
  on_download:()=>void;on_cancel:()=>void;on_clear_cache:()=>void;on_clear_personal:()=>void;error:string;
}){
  return <section className="settings-section"><div className="page-intro"><span className="eyebrow">MAKE THIS SPACE YOURS</span><h1>按自己的节奏，探索。</h1><p>这些偏好只保存在当前设备。</p></div>
    <div className="settings-grid"><article className="settings-panel"><span className="eyebrow">01 / READING</span><h3>正位与逆位</h3><p>调整下一次探索的逆位概率。已抽出的结果不会改变。</p><ReversalControl settings={settings} on_change={on_change}/></article>
      <article className="settings-panel"><span className="eyebrow">02 / SOUND</span><h3>为安静，加一点声音。</h3>
        <label className="setting-row"><span><Music2 size={18}/>背景音乐</span><input role="switch" type="checkbox" checked={settings.music_enabled} onChange={e=>on_change({...settings,music_enabled:e.target.checked})}/></label>
        <VolumeControl id="music-volume" label="背景音乐音量" value={settings.music_volume} on_change={value=>on_change({...settings,music_volume:value})}/>
        <label className="setting-row"><span><Volume2 size={18}/>洗牌与翻牌音效</span><input role="switch" type="checkbox" checked={settings.effects_enabled} onChange={e=>on_change({...settings,effects_enabled:e.target.checked})}/></label>
        <VolumeControl id="effects-volume" label="音效音量" value={settings.effects_volume} on_change={value=>on_change({...settings,effects_volume:value})}/>
        <p className="quiet">音量调整即时生效 · 页面后台自动暂停音乐</p>
      </article>
      <article className="settings-panel offline-panel"><span className="eyebrow">03 / TAKE IT OFFLINE</span><h3><WifiOff size={22}/>把这片安静，随身带走。</h3><p>下载完整卡牌与音频后，断网也能抽牌、查牌义、记笔记和导出分享图。</p>
        <div className={`offline-status ${bundle?.ready?'ready':''}`}>{bundle?.ready?<><CheckCircle2 size={17}/>核心资源已就绪{bundle.audio_ready?' · 音频已就绪':' · 音频待下载'}</>:<><Download size={17}/>尚未完成离线资源下载</>}</div>
        {downloading&&<div className="download-progress"><div style={{width:`${progress}%`}}/><span>{progress}%</span></div>}
        <div className="settings-actions"><button className="button" disabled={downloading} onClick={on_download}><Download size={16}/>{bundle?.ready?'检查并修复资源':'下载离线资源'}</button>{downloading&&<button className="button secondary" onClick={on_cancel}><Pause size={16}/>暂停</button>}<button className="text-button" disabled={downloading} onClick={on_clear_cache}>清除离线资源</button></div>
        <p className="quiet">首次下载需要联网；本地空间不足时会提示。清除资源不会删除历史。</p></article>
      <article className="settings-panel"><span className="eyebrow">04 / LOCAL DATA</span><h3>你的记录，留在你的设备。</h3><p>无账号，无跨设备同步。清除个人数据会删除历史、笔记、偏好与每日结果，保留离线资源。</p><button className="text-button danger" onClick={on_clear_personal}><Trash2 size={15}/>清空个人数据</button></article>
    </div>{error&&<p className="error-message" role="alert">{error}</p>}
  </section>;
}
