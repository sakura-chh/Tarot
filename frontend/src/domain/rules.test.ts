import { expect, test } from 'vitest';
import vector from '../../../shared-contracts/draw-vectors.json';
import dataset from '../../../backend/content/cards.json';
import type { Dataset } from './types';
import { DEFAULT_SETTINGS } from './types';
import { daily_key, local_date, offline_session, search_cards, validate_session } from './rules';

const data=dataset as Dataset;
test('shared shuffle and orientation vector',()=>{
  let index=0;
  const short={...data,cards:vector.cards.map(id=>({...data.cards[0],id}))};
  const session=offline_session(short,'free',3,DEFAULT_SETTINGS,()=>vector.random_values[index++]);
  expect(session.slots.map(s=>s.card_id)).toEqual(vector.expected_ids);
  expect(session.slots.map(s=>s.is_reversed)).toEqual(vector.expected_reversed);
});
test('complete unique deck, boundary probabilities',()=>{
  for(const [enabled,probability,expected] of [[false,100,false],[true,0,false],[true,100,true]] as const){
    const session=offline_session(data,'free',10,{...DEFAULT_SETTINGS,reversed_enabled:enabled,reversed_probability:probability});
    expect(new Set(session.slots.map(s=>s.card_id)).size).toBe(78);
    expect(session.slots.every(s=>s.is_reversed===expected)).toBe(true);
    expect(validate_session(session,data)).toBe(session);
  }
});
test('name normalization, aliases, AND categories',()=>{
  expect(search_cards(data.cards,'ＴＨＥ ＦＯＯＬ')[0].id).toBe('major_fool');
  expect(search_cards(data.cards,'女教皇')[0].id).toBe('major_high_priestess');
  expect(search_cards(data.cards,'','major','cups')).toHaveLength(0);
  expect(search_cards(data.cards,'')).toHaveLength(78);
  expect(search_cards(data.cards,'不存在')).toHaveLength(0);
});
test('daily date uses local calendar components',()=>{
  const date=new Date(2026,8,30,23,59);
  expect(local_date(date)).toBe('2026-09-30');
  expect(daily_key(data.deck_id,local_date(date))).toBe('provided-deck-v1:2026-09-30');
});
