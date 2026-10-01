import { expect, test } from 'vitest';
import dataset from '../../../backend/content/cards.json';
import type { Card, Dataset, Mode, Reading } from './types';
import { interpret_cards, interpret_reading } from './interpretation';

const catalog=(dataset as Dataset).cards;
function reading(ids=['major_strength','cups_king','major_empress'],mode:Mode='situation_obstacle_advice'):Reading{
  return {id:'test',session_id:'session',mode,deck_id:dataset.deck_id,dataset_version:dataset.dataset_version,
    source:'offline',question:'怎样面对变化？',notes:'保留笔记',created_at:'2026-09-30T00:00:00Z',local_date:'2026-09-30',timezone:'Asia/Shanghai',
    settings_snapshot:{reversed_enabled:true,reversed_probability:50},
    cards:ids.map((id,index)=>({card:catalog.find(card=>card.id===id)!,slot_id:`slot_${index}`,position:['现状','阻碍','建议'][index]??`第 ${index+1} 张`,is_reversed:index===1})),
    revealed:ids.map((_,index)=>`slot_${index}`)};
}
function text(record:Reading,cards=catalog){return interpret_reading(record,cards)!.sections.map(section=>section.text).join('\n');}

test('combined interpretation never discloses unrevealed cards, even with stale or duplicate reveal ids',()=>{
  const record=reading();
  record.revealed=['slot_0','slot_0','stale-slot'];
  expect(interpret_reading(record,catalog)).toBeNull();
  record.revealed.push('slot_1');expect(interpret_reading(record,catalog)).toBeNull();
  record.revealed.push('slot_2');expect(interpret_reading(record,catalog)).not.toBeNull();
  expect(interpret_reading(reading(['major_strength'],'free'),catalog)).toBeNull();
});

test('three-card synthesis respects positions and reversed meanings, using the advice card for the next step',()=>{
  const record=reading();
  const result=interpret_reading(record,catalog)!;
  expect(result.sections[0].text).toContain('现状位置的力量（正位）');
  expect(result.sections[0].text).toContain('阻碍位置的圣杯国王（逆位）');
  expect(result.sections[0].text).toContain('情绪反复与边界失衡');
  expect(result.sections[0].text).toContain('建议位置的女皇（正位）');
  expect(result.sections[1].text).toContain('共同指向「节奏与边界」');
  expect(result.sections[2].text).toContain(record.cards[2].card.meaning_details!.upright.advice);
  record.cards[2].is_reversed=true;
  expect(text(record)).toContain(record.cards[2].card.meaning_details!.reversed.advice);
});

test('chronological spread keeps draw order and treats future as a direction to consider',()=>{
  const record=reading(['major_fool','major_death','major_star'],'past_present_future');
  const narrative=interpret_reading(record,catalog)!.sections[0].text;
  expect(narrative).toContain('过去的愚者（正位）');
  expect(narrative).toContain('现在的死神（逆位）');
  expect(narrative).toContain('未来位置的星星（正位）');
  expect(narrative).toContain('当下的行动与现实变化');
  record.cards.reverse();expect(text(record)).toContain('过去的星星（正位）');
});

test('free draws cover two to ten cards without inventing time or advice positions',()=>{
  for(const count of [2,10]){
    const record=reading(catalog.slice(0,count).map(card=>card.id),'free');
    record.cards.forEach(card=>{card.is_reversed=true;});
    const result=text(record);
    for(const card of record.cards)expect(result).toContain(`${card.card.name_zh}（逆位）`);
    expect(result).toContain('没有预设的时间或因果牌位');
    expect(result).not.toContain('建议位置');expect(result).not.toContain('未来位置');
    expect(result).toContain('这一组全部为逆位');
  }
});

test('legacy history can use current advice without mutating snapshots, and absent details degrade gracefully',()=>{
  const record=reading();
  record.cards=record.cards.map(picked=>({...picked,card:{...picked.card,meaning_details:undefined,meaning_upright:'旧摘要'}}));
  const before=structuredClone(record);
  expect(text(record)).toContain(catalog.find(card=>card.id==='major_empress')!.meaning_details!.upright.advice);
  expect(record).toEqual(before);
  const unknown:Card={...record.cards[0].card,id:'other-deck-card',name_zh:'新牌',meaning_reversed:'暂缓行动，重新观察。'};
  record.cards[1].card=unknown;
  const result=text(record,[]);
  expect(result).toContain('新牌（逆位）');expect(result).toContain(unknown.meaning_reversed);
  expect(result).not.toMatch(/undefined|NaN/);
  expect(interpret_reading(record,[])).toEqual(interpret_reading(record,[]));
});

test('all 78 catalog cards have concise connecting motifs in both orientations',()=>{
  for(const card of catalog){
    for(const reversed of [false,true]){
      const record=reading([card.id,card.id==='major_fool'?'major_world':'major_fool'],'free');
      record.cards[0].is_reversed=reversed;
      const narrative=interpret_reading(record,catalog)!.sections[0].text;
      expect(narrative).toContain(`${card.name_zh}（${reversed?'逆位':'正位'}）关注「`);
      // A missing bridge would dump the whole individual summary into this sentence.
      expect(narrative).not.toContain(reversed?card.meaning_reversed:card.meaning_upright);
    }
  }
});

test('individual guidance reveals only flipped slots and follows their saved orientation',()=>{
  const record=reading();record.revealed=['slot_1','slot_1','stale-slot'];
  const cards=interpret_cards(record,catalog);
  expect(cards).toHaveLength(1);
  expect(cards[0].name).toBe('圣杯国王');expect(cards[0].orientation).toBe('逆位');
  expect(cards[0].general).toBe(record.cards[1].card.meaning_details!.reversed.general);
  expect(cards[0].love).toBe(record.cards[1].card.meaning_details!.reversed.love);
  expect(cards[0].career).toBe(record.cards[1].card.meaning_details!.reversed.career);
  expect(cards[0].advice).toBe(record.cards[1].card.meaning_details!.reversed.advice);
  record.revealed=[];expect(interpret_cards(record,catalog)).toEqual([]);
});

test('individual guidance distinguishes an upright obstacle from advice without changing its meaning',()=>{
  const record=reading(['major_strength','major_strength','major_strength']);
  record.cards.forEach(card=>{card.is_reversed=false;});
  const cards=interpret_cards(record,catalog);
  expect(cards[0].context).toContain('现状的位置');
  expect(cards[1].context).toContain('阻碍的位置');
  expect(cards[1].context).toContain('一味维持平衡或压住感受');
  expect(cards[2].context).toContain('建议的位置');
  expect(new Set(cards.map(card=>card.general)).size).toBe(1);
});

test('single daily guidance and free guidance do not invent future or advice positions',()=>{
  const daily=reading(['major_fool'],'daily');
  expect(interpret_cards(daily,catalog)[0].context).toContain('作为今日提示');
  const free=reading(['major_fool'],'free');
  const guidance=interpret_cards(free,catalog)[0];
  expect(guidance.context).toContain('没有预设的时间或因果牌位');
  expect(guidance.context).not.toMatch(/未来的位置|建议的位置/);
  const chronological=reading(['major_fool','major_death','major_star'],'past_present_future');
  expect(interpret_cards(chronological,catalog)[2].context).toContain('随实际反馈调整');
});

test('detailed guidance refreshes legacy text without modifying saved readings and falls back for unknown cards',()=>{
  const record=reading();
  record.cards=record.cards.map(picked=>({...picked,card:{...picked.card,meaning_details:undefined,meaning_upright:'旧摘要'}}));
  const before=structuredClone(record);
  expect(interpret_cards(record,catalog)[0].general).toBe(catalog.find(card=>card.id==='major_strength')!.meaning_details!.upright.general);
  expect(record).toEqual(before);
  record.cards[0].card={...record.cards[0].card,id:'unknown',name_zh:'另一副牌',meaning_upright:'已有的正位摘要'};
  const guidance=interpret_cards(record,[])[0];
  expect(guidance.general).toBe('已有的正位摘要');expect(guidance.overview).toBeUndefined();
  expect(guidance.advice).toBeTruthy();expect(guidance.reflection).toBeTruthy();
  expect(Object.values(guidance).filter(value=>typeof value==='string').join(' ')).not.toMatch(/undefined|NaN/);
});
