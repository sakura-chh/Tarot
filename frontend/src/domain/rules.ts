import type { Card, Dataset, Mode, Session, Settings } from './types';

// 每日结果按设备当地日历日期分组；UTC 日期会在时区边界提前或延后换日。
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
  // 丢弃不能均分到目标区间的尾部随机值，避免直接取模产生概率偏差。
  const limit = Math.floor(0x100000000/max)*max, value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while(value[0]>=limit);
  return value[0]%max;
}

export function offline_session(data: Dataset, mode: Mode, count: number, settings: Settings,
  rand: (max: number)=>number = random_int): Session {
  // 与 Python 使用相同洗牌规则；方向随完整牌组生成，并绑定本轮设置快照。
  const ids = data.cards.map(c=>c.id);
  for(let i=ids.length-1;i>0;i--){const j=rand(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  return {session_id:`offline-${crypto.randomUUID()}`,request_id:crypto.randomUUID(),source:'offline',
    dataset_version:data.dataset_version,deck_id:data.deck_id,mode,count,created_at:new Date().toISOString(),
    settings_snapshot:{reversed_enabled:settings.reversed_enabled,reversed_probability:settings.reversed_probability},
    slots:ids.map((id,i)=>({slot_id:`slot-${String(i).padStart(2,'0')}`,card_id:id,
      is_reversed:settings.reversed_enabled && rand(100)<settings.reversed_probability}))};
}

export { validate_dataset, validate_session } from './validation';
