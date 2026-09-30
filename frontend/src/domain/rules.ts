import type { Card, Dataset, Mode, Session, Settings } from './types';

export const local_date = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const daily_key = (deck_id: string, date = local_date()) => `${deck_id}:${date}`;
export const normalize = (text: string) => text.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');

export function search_cards(cards: Card[], q: string, arcana = '', suit = ''): Card[] {
  const query = normalize(q), words = query.split(' ').filter(Boolean);
  return cards.filter(c => (!arcana || c.arcana===arcana) && (!suit || c.suit===suit))
    .map(card => {
      const names = [card.name_zh,card.name_en].map(normalize), aliases = card.aliases.map(normalize);
      const keys = [...card.keywords_upright,...card.keywords_reversed].map(normalize);
      const fields = [...names,...aliases,...keys,normalize(card.meaning_upright),normalize(card.meaning_reversed)];
      const score = names.includes(query)?0:aliases.includes(query)?1:names.some(n=>n.startsWith(query))?2:keys.some(k=>k.includes(query))?3:4;
      return {card,score,match:words.every(word=>fields.some(f=>f.includes(word)))};
    }).filter(r=>r.match).sort((a,b)=>a.score-b.score || a.card.sort_order-b.card.sort_order || a.card.id.localeCompare(b.card.id))
    .map(r=>r.card);
}

export function random_int(max: number): number {
  const limit = Math.floor(0x100000000/max)*max, value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while(value[0]>=limit);
  return value[0]%max;
}

export function offline_session(data: Dataset, mode: Mode, count: number, settings: Settings,
  rand: (max: number)=>number = random_int): Session {
  const ids = data.cards.map(c=>c.id);
  for(let i=ids.length-1;i>0;i--){const j=rand(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  return {session_id:`offline-${crypto.randomUUID()}`,request_id:crypto.randomUUID(),source:'offline',
    dataset_version:data.dataset_version,deck_id:data.deck_id,mode,count,created_at:new Date().toISOString(),
    settings_snapshot:{reversed_enabled:settings.reversed_enabled,reversed_probability:settings.reversed_probability},
    slots:ids.map((id,i)=>({slot_id:`slot-${String(i).padStart(2,'0')}`,card_id:id,
      is_reversed:settings.reversed_enabled && rand(100)<settings.reversed_probability}))};
}

export function validate_dataset(data: Dataset) {
  if(data.schema_version!=='1' || data.cards?.length!==78 || new Set(data.cards.map(c=>c.id)).size!==78 ||
    data.cards.filter(c=>c.arcana==='major').length!==22 ||
    ['swords','wands','pentacles','cups'].some(s=>data.cards.filter(c=>c.suit===s).length!==14)) throw Error('卡牌数据不完整，请重新下载。');
  return data;
}

export function validate_session(session: Session, data: Dataset) {
  const ids = new Set(data.cards.map(c=>c.id));
  if(session.dataset_version!==data.dataset_version || session.slots?.length!==78 ||
    new Set(session.slots.map(s=>s.card_id)).size!==78 || new Set(session.slots.map(s=>s.slot_id)).size!==78 ||
    session.slots.some(s=>!ids.has(s.card_id) || typeof s.is_reversed!=='boolean')) throw Error('抽牌结果格式不完整。');
  return session;
}
