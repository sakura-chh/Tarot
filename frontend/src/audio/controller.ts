import type { Dataset, Settings } from '../domain/types';

let music: HTMLAudioElement|undefined;
let settings: Settings;
let sounds: Dataset['audio'];
const playing=new Set<HTMLAudioElement>();
let unlocked=false;

export function configure_audio(data: Dataset, value: Settings){
  sounds=data.audio;settings=value;
  if(!music){music=new Audio(sounds.music);music.loop=true;music.volume=.28;music.preload='metadata';}
  else if(music.getAttribute('src')!==sounds.music){music.pause();music.src=sounds.music;music.load();}
  if(!settings.music_enabled)music.pause();
  else if(unlocked && !document.hidden)void music.play().catch(()=>{});
  if(!settings.effects_enabled){for(const sound of playing)sound.pause();playing.clear();}
}
export async function unlock_audio(){unlocked=true;if(settings?.music_enabled && music)await music.play();}
export function play_effect(name: 'shuffle'|'flip'){
  if(!settings?.effects_enabled || !sounds)return;
  const audio=new Audio(sounds[name]);audio.volume=.55;playing.add(audio);
  audio.onended=()=>playing.delete(audio);void audio.play().catch(()=>playing.delete(audio));
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)music?.pause();else if(unlocked&&settings?.music_enabled)void music?.play().catch(()=>{});
});
