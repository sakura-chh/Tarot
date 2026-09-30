import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search, Volume2, VolumeX, Sun, ArrowUpRight, House, Layers, BookOpen, NotebookPen, SlidersHorizontal } from 'lucide-react';
import type { BundleState, Card, Dataset, Mode, Reading, Settings as SettingsType } from './domain/types';
import { DEFAULT_SETTINGS } from './domain/types';
import { load_dataset } from './adapters/api';
import { clear_data, get_settings, save_settings, update_reading } from './adapters/storage';
import { configure_audio, unlock_audio } from './audio/controller';
import { check_bundle, clear_offline, download_bundle } from './pwa/offline';
import { Modal } from './components/Modal';
import { Home } from './features/Home';
import { Draw } from './features/Draw';
import { Library, CardDetail } from './features/Library';
import { ReadingView } from './features/ReadingView';
import { History } from './features/History';
import { Settings } from './features/Settings';
import { useTarot } from './features/useTarot';

type Page='home'|'draw'|'cards'|'history'|'settings';
const routes:Record<Page,string>={home:'/',draw:'/draw',cards:'/cards',history:'/history',settings:'/settings'};
const nav:[Page,string,typeof House][]=[['home','首页',House],['draw','抽牌',Layers],['cards','卡牌图鉴',BookOpen],['history','我的记录',NotebookPen],['settings','设置',SlidersHorizontal]];
const current_page=():Page=>Object.entries(routes).find(([,path])=>path!=='/'&&location.pathname.startsWith(path))?.[0] as Page||'home';

function Atelier({data}:{data:Dataset}){
  const [page,set_page]=useState<Page>(current_page),[mode,set_mode]=useState<Mode>('daily'),[settings,set_settings]=useState<SettingsType>(DEFAULT_SETTINGS);
  const [search,set_search]=useState(false),[detail,set_detail]=useState<Card|null>(null),[historic,set_historic]=useState<Reading|null>(null);
  const [bundle,set_bundle]=useState<BundleState>(),[progress,set_progress]=useState(0),[downloading,set_downloading]=useState(false),[error,set_error]=useState('');
  const [audio_blocked,set_audio_blocked]=useState(false);const attempted=useRef(false),download=useRef<AbortController|null>(null);
  const [waiting_worker,set_waiting_worker]=useState<ServiceWorker>();
  const tarot=useTarot(data);
  useEffect(()=>{void get_settings().then(value=>{if(value)set_settings(value);}).catch(()=>set_error('偏好未能读取。'));void check_bundle(data.dataset_version).then(set_bundle).catch(()=>{});},[data.dataset_version]);
  useEffect(()=>{configure_audio(data,settings);},[data,settings]);
  useEffect(()=>{
    if(!('serviceWorker' in navigator))return;
    const notify=(event:Event)=>set_waiting_worker((event as CustomEvent<ServiceWorker>).detail);
    window.addEventListener('tarot-update-ready',notify);
    void navigator.serviceWorker.getRegistration().then(registration=>{if(registration?.waiting)set_waiting_worker(registration.waiting);});
    return()=>window.removeEventListener('tarot-update-ready',notify);
  },[]);
  useEffect(()=>{
    const sync=()=>{set_page(current_page());const hash=location.hash;
      set_search(hash.startsWith('#search'));const id=hash.startsWith('#card=')?decodeURIComponent(hash.slice(6)):hash.startsWith('#search-card=')?decodeURIComponent(hash.slice(13)):null;
      set_detail(id?data.cards.find(c=>c.id===id)??null:null);};
    window.addEventListener('popstate',sync);sync();return()=>window.removeEventListener('popstate',sync);
  },[data]);
  const navigate=(next:Page)=>{history.pushState(null,'',routes[next]);set_page(next);set_historic(null);set_search(false);set_detail(null);window.scrollTo({top:0,behavior:'instant'});};
  const change_settings=(value:SettingsType)=>{set_settings(value);void save_settings(value).catch(()=>set_error('偏好未保存。'));};
  function activate_audio(){if(!attempted.current){attempted.current=true;void unlock_audio().catch(()=>set_audio_blocked(true));}}
  function open_search(){history.pushState(null,'',`${location.pathname}#search`);set_search(true);set_detail(null);}
  function open_card(card:Card){history.pushState(null,'',`${location.pathname}${search?'#search-card=':'#card='}${card.id}`);set_detail(card);}
  function close_overlay(){if(detail){set_detail(null);history.back();}else if(search){set_search(false);history.back();}}
  async function choose_mode(value:Mode){
    if(tarot.work?.phase==='selecting'&&!confirm('开始新的探索？当前未确认的选牌进度将被清除。'))return;
    if(value==='daily'&&await tarot.resume_daily()){set_mode(value);navigate('draw');return;}
    await tarot.reset();set_mode(value);navigate('draw');
  }
  async function download_resources(){set_error('');set_downloading(true);set_progress(0);download.current=new AbortController();
    try{set_bundle(await download_bundle((bytes,total)=>set_progress(Math.round(bytes/total*100)),download.current.signal));}
    catch(reason){set_error(download.current.signal.aborted?'下载已暂停，再次点击可继续。':reason instanceof Error?reason.message:'下载失败，请重试。');}
    finally{set_downloading(false);}
  }
  async function clear_cache(){if(!confirm('清除离线资源？历史和笔记会保留。'))return;await clear_offline();set_bundle(await check_bundle(data.dataset_version));}
  async function clear_personal(){if(!confirm('删除全部个人数据，包括历史、笔记、每日结果和偏好？离线资源会保留。'))return;await clear_data('all');await tarot.reset();change_settings(DEFAULT_SETTINGS);set_historic(null);navigate('home');}

  return <div className="site" onPointerDownCapture={activate_audio} onKeyDownCapture={activate_audio}>
    <header className="site-header"><button className="brand" onClick={()=>navigate('home')} aria-label="纸境首页"><span className="brand-symbol"><Sun size={28} strokeWidth={1.1}/></span><span><strong>纸境</strong><small>TAROT ATELIER</small></span></button>
      <nav aria-label="主导航">{nav.map(([key,label])=><button key={key} className={page===key?'active':''} onClick={()=>navigate(key)}>{label}</button>)}</nav>
      <div className="header-tools"><button className="icon-button" aria-label="全站卡牌查询" onClick={open_search}><Search size={19}/></button><span className="tool-divider"/><button className="icon-button" aria-label={settings.music_enabled?'关闭背景音乐':'开启背景音乐'} onClick={()=>{change_settings({...settings,music_enabled:!settings.music_enabled});if(!settings.music_enabled)void unlock_audio().then(()=>set_audio_blocked(false)).catch(()=>set_audio_blocked(true));}}>{settings.music_enabled?<Volume2 size={19}/>:<VolumeX size={19}/>}</button></div>
    </header>
    <main>
      {page==='home'&&<Home data={data} on_mode={value=>void choose_mode(value)} on_library={()=>navigate('cards')} has_work={!!tarot.work}/>}
      {page==='draw'&&(tarot.reading?<ReadingView record={tarot.reading} data={data} on_update={tarot.update} on_card={open_card} on_again={()=>void tarot.reset()}/>:<Draw data={data} mode={mode} on_mode={set_mode} settings={settings} on_settings={change_settings} tarot={tarot}/>)}
      {page==='cards'&&<Library data={data} on_card={open_card}/>}
      {page==='history'&&(historic?<><button className="text-button back-link" onClick={()=>set_historic(null)}><ArrowLeft size={16}/>返回我的记录</button><ReadingView record={historic} data={data} on_update={async value=>{await update_reading(value);set_historic(value);}} on_card={open_card}/></>:<History data={data} on_record={set_historic}/>)}
      {page==='settings'&&<Settings settings={settings} on_change={change_settings} bundle={bundle} progress={progress} downloading={downloading} on_download={()=>void download_resources()} on_cancel={()=>download.current?.abort()} on_clear_cache={()=>void clear_cache().catch(()=>set_error('清除资源失败。'))} on_clear_personal={()=>void clear_personal().catch(()=>set_error('清除数据失败。'))} error={error}/>}
    </main>
    <footer className="site-footer"><span>✧ 纸境 · TAROT ATELIER</span><p>留一点时间，听见自己。</p><span>78 张牌 · 一场内在探索 <ArrowUpRight size={13}/></span></footer>
    <nav className="mobile-nav" aria-label="手机导航">{nav.map(([key,label,Icon])=><button key={key} className={page===key?'active':''} onClick={()=>navigate(key)}><Icon size={19} strokeWidth={1.5}/><span>{label==='卡牌图鉴'?'图鉴':label==='我的记录'?'记录':label}</span></button>)}</nav>
    {audio_blocked&&settings.music_enabled&&<button className="audio-prompt" onClick={()=>void unlock_audio().then(()=>set_audio_blocked(false)).catch(()=>set_error('音乐暂时不能播放。'))}>♫ 点击播放背景音乐</button>}
    {waiting_worker&&page==='home'&&!search&&!detail&&<button className="update-prompt" onClick={()=>{
      navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
      waiting_worker.postMessage({type:'SKIP_WAITING'});
    }}>新版本已就绪 · 更新页面</button>}
    {(search||detail)&&<Modal title={detail?detail.name_zh:'寻找一张牌'} wide on_close={close_overlay}>
      {search&&<div hidden={!!detail}><Library data={data} compact on_card={open_card}/></div>}
      {detail&&<>{search&&<button className="text-button" onClick={close_overlay}><ArrowLeft size={16}/>返回搜索</button>}<CardDetail key={detail.id} card={detail}/></>}
    </Modal>}
  </div>;
}

export default function App(){
  const [data,set_data]=useState<Dataset>(),[error,set_error]=useState('');
  useEffect(()=>{void load_dataset().then(set_data).catch(()=>set_error('还没有可用的卡牌数据。请连接网络后重新打开。'));},[]);
  return data?<Atelier data={data}/>:<div className="boot-screen"><Sun size={40} strokeWidth={1}/><h1>纸境</h1><span className="eyebrow">TAROT ATELIER</span><p>{error||'正在打开这一页…'}</p>{error&&<button className="button" onClick={()=>location.reload()}>重新加载</button>}</div>;
}
