import type { Card, Reading } from '../domain/types';
import { interpret_cards, interpret_reading } from '../domain/interpretation';

export type ShareModule='cards'|'meanings'|'positions'|'interpretation'|'advice'|'question'|'notes';
export interface ShareOptions {
  modules:ShareModule[]; layout:'gallery'|'folio'; palette:'umber'|'burgundy';
  title:string; signature:string; show_date:boolean; show_positions:boolean; ornaments:boolean;
}
export const SHARE_MODULES:{id:ShareModule;name:string;description:string}[]=[
  {id:'cards',name:'卡牌画廊',description:'原始牌面、牌名与正逆位'},
  {id:'meanings',name:'核心牌义',description:'每张牌对应方向的简明解读'},
  {id:'positions',name:'牌位解读',description:'这张牌在本次探索中的作用'},
  {id:'interpretation',name:'牌阵综合解读',description:'整体脉络、牌间联系与下一步'},
  {id:'advice',name:'行动建议',description:'每张牌可以实践的具体行动'},
  {id:'question',name:'包含我的问题',description:'展示本次记录中的问题'},
  {id:'notes',name:'包含笔记',description:'展示已保存的笔记，最多 700 字'},
];
// 每次打开重置公开内容；个人问题与笔记必须由用户主动勾选。
export function default_share_options(title:string):ShareOptions{
  return {modules:['cards','meanings'],layout:'gallery',palette:'umber',title,signature:'纸境 · TAROT ATELIER',show_date:true,show_positions:true,ornaments:true};
}
export interface ShareSection {id:ShareModule;title:string;eyebrow:string;entries:{title:string;text:string}[]}

export function share_sections(record:Reading,options:ShareOptions,catalog:Card[]):ShareSection[]{
  // 导出和页面解读遵循相同揭晓边界，不能通过分享绕过未翻牌状态。
  if(!record.cards.length||!record.cards.every(card=>record.revealed.includes(card.slot_id)))throw Error('请先翻开全部卡牌。');
  const cards=interpret_cards(record,catalog),combined=interpret_reading(record,catalog);
  const entries=(field:'general'|'context'|'advice')=>cards.map(card=>({
    title:`${options.show_positions?`${card.position} · `:''}${card.name}（${card.orientation}）`,text:card[field],
  }));
  const sections:Record<ShareModule,ShareSection|null>={
    cards:{id:'cards',title:'本次相遇的牌',eyebrow:'THE CARD GALLERY',entries:[]},
    meanings:{id:'meanings',title:'牌中的提醒',eyebrow:'WORDS FROM THE CARDS',entries:entries('general')},
    positions:{id:'positions',title:'在这个牌位中',eyebrow:'THE PLACE OF EACH CARD',entries:entries('context')},
    interpretation:combined?{id:'interpretation',title:'牌阵综合解读',eyebrow:'THE CARDS TOGETHER',entries:combined.sections.map(section=>({title:section.title,text:section.text}))}:null,
    advice:{id:'advice',title:'可以实践的一步',eyebrow:'A SMALL STEP FORWARD',entries:entries('advice')},
    question:record.question.trim()?{id:'question',title:'我此刻的问题',eyebrow:'A QUESTION WITHIN',entries:[{title:'',text:record.question}]}:null,
    notes:record.notes.trim()?{id:'notes',title:'留给自己的话',eyebrow:'A NOTE TO MYSELF',entries:[{title:'',text:Array.from(record.notes).slice(0,700).join('')}]}:null,
  };
  return [...new Set(options.modules)].flatMap(id=>sections[id]?[sections[id]!]:[]);
}
