import { expect, test } from 'vitest';
import dataset from '../../../backend/content/cards.json';
import type { Dataset, Reading } from '../domain/types';
import { default_share_options, share_sections } from './share-content';

const catalog=(dataset as Dataset).cards;
function reading():Reading{
  return {id:'share',session_id:'session',source:'offline',mode:'situation_obstacle_advice',deck_id:dataset.deck_id,dataset_version:dataset.dataset_version,
    created_at:'2026-10-01T00:00:00Z',local_date:'2026-10-01',timezone:'Asia/Shanghai',question:'只有主动选择才可分享的问题',notes:'只有主动选择才可分享的笔记',
    settings_snapshot:{reversed_enabled:true,reversed_probability:50},
    cards:catalog.slice(0,3).map((card,index)=>({card,slot_id:`slot-${index}`,position:['现状','阻碍','建议'][index],is_reversed:index===1})),revealed:['slot-0','slot-1','slot-2']};
}
test('share defaults omit personal content and use ordered original cards and meanings',()=>{
  const record=reading(),options=default_share_options('内在指引'),sections=share_sections(record,options,catalog);
  expect(sections.map(section=>section.id)).toEqual(['cards','meanings']);
  expect(JSON.stringify(sections)).not.toContain(record.question);expect(JSON.stringify(sections)).not.toContain(record.notes);
  expect(sections[1].entries[1].title).toContain('逆位');
  expect(sections[1].entries[1].text).toBe(record.cards[1].card.meaning_details!.reversed.general);
  options.modules.reverse();expect(default_share_options('另一张').modules).toEqual(['cards','meanings']);
});
test('selected components follow the requested order and use the matching orientation',()=>{
  const record=reading(),before=structuredClone(record),options=default_share_options('内在指引');
  options.modules=['notes','question','advice','interpretation','positions','cards','notes'];
  const sections=share_sections(record,options,catalog);
  expect(sections.map(section=>section.id)).toEqual(['notes','question','advice','interpretation','positions','cards']);
  expect(sections[0].entries[0].text).toBe(record.notes);expect(sections[1].entries[0].text).toBe(record.question);
  expect(sections[2].entries[1].text).toBe(record.cards[1].card.meaning_details!.reversed.advice);
  expect(sections[4].entries[1].text).toContain('阻碍的位置');expect(record).toEqual(before);
});
test('sharing rejects unrevealed results and skips unavailable components',()=>{
  const record=reading(),options=default_share_options('探索');record.revealed=['slot-0','slot-0','stale'];
  expect(()=>share_sections(record,options,catalog)).toThrow('请先翻开全部卡牌');
  record.cards=record.cards.slice(0,1);record.question=' ';record.notes='';options.modules=['interpretation','question','notes','advice'];
  expect(share_sections(record,options,catalog).map(section=>section.id)).toEqual(['advice']);
});
test('note length limits preserve characters and optional position labels can be removed',()=>{
  const record=reading(),options=default_share_options('探索');record.notes='🌙'.repeat(701);options.modules=['notes','meanings'];options.show_positions=false;
  const sections=share_sections(record,options,catalog);
  expect(Array.from(sections[0].entries[0].text)).toHaveLength(700);
  expect(sections[1].entries[0].title).toBe('愚者（正位）');
});
