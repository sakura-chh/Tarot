import type { Dataset, Reading } from './types';

type Theme = 'exploration' | 'direction' | 'balance' | 'care' | 'connection' | 'change' | 'clarity' | 'burden' | 'recovery' | 'completion' | 'security';
type Motif = [Theme, string];
type CardMotifs = [Motif, Motif];

// 这里整理牌间联系，完整牌义仍由图鉴维护，避免出现两套正文。
// 逆位使用独立主题，不能简单换算成负面结果。
const motifs: Record<string, CardMotifs> = {
  major_fool: [['exploration','带着好奇迈出第一步'],['clarity','行动前补足准备与风险判断']],
  major_magician: [['direction','把已有能力变成具体行动'],['clarity','核对承诺与实际能力的差距']],
  major_high_priestess: [['clarity','安静观察尚未明朗的信息'],['clarity','分清直觉与未经核实的猜测']],
  major_empress: [['care','滋养关系并让想法成长'],['care','照顾自己并调整过度付出']],
  major_emperor: [['security','建立秩序与清晰边界'],['balance','调整过度控制或松散的规则']],
  major_hierophant: [['security','借助经验、规范与可靠指导'],['exploration','重新检视惯例是否适合自己']],
  major_lovers: [['connection','让选择与真实价值保持一致'],['connection','面对关系或价值上的分歧']],
  major_chariot: [['direction','集中意志朝目标推进'],['balance','先协调方向再恢复推进']],
  major_justice: [['clarity','依据事实作出公平选择'],['clarity','正视偏差并承担选择的责任']],
  major_hermit: [['clarity','通过独处整理自己的答案'],['connection','调整退缩与求助之间的距离']],
  major_wheel_of_fortune: [['change','顺应变化并把握新的时机'],['balance','在不顺的周期中调整节奏']],
  major_strength: [['balance','用耐心与温柔驾驭冲动'],['care','接纳脆弱并找回内在信心']],
  major_hanged_man: [['clarity','暂停用力并换一个角度'],['balance','检视停滞与无效牺牲']],
  major_death: [['change','结束旧阶段，为转变腾出空间'],['change','面对迟迟不愿放下的旧模式']],
  major_temperance: [['balance','协调差异并保持适当节奏'],['balance','修复过量投入与失衡的生活']],
  major_devil: [['burden','看清依赖、诱惑与束缚'],['recovery','逐步松开不健康的依附']],
  major_tower: [['change','面对旧结构被打破后的重建'],['change','处理被拖延的改变与隐患']],
  major_star: [['recovery','重拾希望并耐心修复'],['care','在失落中重新建立自我信任']],
  major_moon: [['clarity','辨认不确定中的情绪与事实'],['clarity','让模糊的信息逐渐得到澄清']],
  major_sun: [['completion','坦诚表达并分享成长的喜悦'],['care','调整期待，重拾被遮住的活力']],
  major_judgement: [['change','回应内心召唤并作出新选择'],['clarity','停止苛责，认真回顾未完成的事']],
  major_world: [['completion','整合经验并完成一个阶段'],['completion','补上尚未收尾的关键环节']],
  wands_ace: [['exploration','点燃一个值得尝试的新想法'],['care','为暂时不足的热情补充能量']],
  wands_02: [['direction','把愿景转为下一步规划'],['clarity','处理犹豫与准备不足']],
  wands_03: [['direction','拓展视野并等待投入的回应'],['balance','调整延期或受阻的计划']],
  wands_04: [['connection','在稳定支持中庆祝阶段成果'],['connection','修复归属感与共同基础']],
  wands_05: [['burden','在竞争与不同意见中找准立场'],['balance','减少无效争执，寻找合作方式']],
  wands_06: [['completion','接住努力带来的认可'],['care','减少对外界评价的依赖']],
  wands_07: [['direction','守住值得坚持的立场'],['care','辨别疲惫时仍需守住的边界']],
  wands_08: [['direction','把握加快的沟通与行动节奏'],['balance','处理延误或过快推进的问题']],
  wands_09: [['security','带着经验谨慎守护成果'],['care','放松过度戒备并照顾疲惫']],
  wands_10: [['burden','看见承担过多带来的压力'],['recovery','卸下不必独自承担的责任']],
  wands_page: [['exploration','用好奇心探索新机会'],['direction','把零散热情变成持续尝试']],
  wands_knight: [['direction','勇敢投入并推动变化'],['balance','为冲动与忽冷忽热踩下刹车']],
  wands_queen: [['direction','以自信与热情带动身边的人'],['care','缓解不安，减少比较与控制']],
  wands_king: [['direction','用长远眼光统筹行动'],['balance','调整急躁或强势的推动方式']],
  cups_ace: [['connection','允许情感与新的连接流动'],['care','照顾被压抑或耗尽的情绪']],
  cups_02: [['connection','建立互相尊重的情感交流'],['connection','面对关系中不对等的回应']],
  cups_03: [['connection','从朋友与合作中获得支持'],['balance','调整社交过度或群体分歧']],
  cups_04: [['clarity','停下来辨认真正需要的机会'],['exploration','重新留意被忽略的可能']],
  cups_05: [['recovery','承认失落并看见仍在的支持'],['recovery','逐步走出遗憾，接受新的连接']],
  cups_06: [['care','从熟悉的记忆中获得温暖'],['change','放下对过去的依赖，回到当下']],
  cups_07: [['clarity','在众多想象中辨认真实选择'],['direction','筛选幻想并作出可行决定']],
  cups_08: [['change','离开已无法满足内心的处境'],['clarity','辨别留下与离开的真实原因']],
  cups_09: [['completion','珍惜已经得到的满足'],['clarity','检查外在满足与内心需求的落差']],
  cups_10: [['connection','共同经营和谐与长久归属'],['connection','协调理想关系与实际分歧']],
  cups_page: [['connection','温柔表达新生的感受'],['care','照顾敏感并让表达更成熟']],
  cups_knight: [['connection','带着诚意向心动之事靠近'],['clarity','核对浪漫承诺与实际行动']],
  cups_queen: [['care','用共情理解自己与他人'],['balance','调整过度共情与情感依赖']],
  cups_king: [['balance','以成熟与稳定承接情绪'],['balance','处理情绪反复与边界失衡']],
  swords_ace: [['clarity','用清晰判断打开问题的切口'],['clarity','先澄清误解与混乱的思路']],
  swords_02: [['clarity','面对僵持中被回避的选择'],['clarity','整理冲突信息，停止拖延决定']],
  swords_03: [['recovery','正视伤痛并诚实沟通'],['recovery','给伤口修复与释怀的时间']],
  swords_04: [['recovery','暂停消耗，让身心恢复'],['care','辨别是否已经休息充分']],
  swords_05: [['burden','衡量争执与取胜的真实代价'],['recovery','为和解与止损留出空间']],
  swords_06: [['change','逐渐离开混乱，走向平稳'],['change','面对阻碍过渡的旧问题']],
  swords_07: [['clarity','审视策略、隐瞒与信任边界'],['clarity','坦诚面对回避的事实']],
  swords_08: [['burden','识别让自己受限的想法'],['recovery','松动自我限制，尝试新的出口']],
  swords_09: [['care','分清忧虑与实际发生的事'],['recovery','为焦虑寻找支持与缓解方式']],
  swords_10: [['change','承认一个耗尽的阶段已经结束'],['recovery','在低谷之后缓慢重建']],
  swords_page: [['clarity','保持好奇并核实信息'],['clarity','减少猜测与未经核实的表达']],
  swords_knight: [['direction','以果断推动关键决定'],['balance','放慢争辩与仓促行动的速度']],
  swords_queen: [['clarity','诚实表达并守住清晰边界'],['care','缓和苛刻，听见情绪的需要']],
  swords_king: [['clarity','用理性与原则统筹判断'],['balance','检视冷硬控制与判断偏差']],
  pentacles_ace: [['security','把现实机会扎根为具体投入'],['clarity','核对资源与机会是否可靠']],
  pentacles_02: [['balance','灵活协调多项现实安排'],['balance','减少失衡，重新安排优先级']],
  pentacles_03: [['connection','通过分工与技能共同建设'],['connection','校准合作中的标准与职责']],
  pentacles_04: [['security','稳住资源并守护已有基础'],['balance','调整过度紧握或不当花费']],
  pentacles_05: [['care','在匮乏与孤立中主动寻找支持'],['recovery','接纳帮助，逐步改善困境']],
  pentacles_06: [['connection','建立公平的给予与接受'],['balance','检查付出、资源与权力是否对等']],
  pentacles_07: [['balance','评估长期投入并耐心等待'],['clarity','检视投入回报，调整无效坚持']],
  pentacles_08: [['direction','以持续练习打磨能力'],['balance','修正敷衍或过度追求完美']],
  pentacles_09: [['security','享受自立与累积的成果'],['care','检视独立背后的代价与不安']],
  pentacles_10: [['security','经营长久稳定的共同基础'],['security','处理长期资源或家庭基础的裂缝']],
  pentacles_page: [['exploration','从学习与小计划开始落实'],['direction','把空想与拖延转为实际练习']],
  pentacles_knight: [['security','依靠稳定节奏持续积累'],['balance','调整停滞或僵化的日常']],
  pentacles_queen: [['care','兼顾现实生活与温柔照料'],['balance','照顾自身需求，减少过度操心']],
  pentacles_king: [['security','以务实管理稳住长期成果'],['balance','检视物质执着与控制倾向']],
};

const themes: Record<Theme, { name: string; bridge: string }> = {
  exploration: {name:'新的可能',bridge:'先给尝试留出空间，再用小规模的实践确认哪些可能值得继续。'},
  direction: {name:'行动与方向',bridge:'把热情集中到一个明确目标上，并让后续行动跟得上最初的决定。'},
  balance: {name:'节奏与边界',bridge:'保持投入也需要留有余地，先调整失衡的部分，才能让已有力量持续发挥。'},
  care: {name:'照料与内在需要',bridge:'先承认自己的真实需要，再考虑能够给予多少，照料才有持续的基础。'},
  connection: {name:'关系与相互回应',bridge:'把期待说清楚，并观察彼此是否愿意用实际行动回应，而不是由一方独自维持。'},
  change: {name:'转变与取舍',bridge:'辨认哪些经验可以保留、哪些模式已经走到尽头，让结束成为下一步的空间。'},
  clarity: {name:'看清事实与选择',bridge:'区分事实、感受与猜测，补足关键信息后再作出决定。'},
  burden: {name:'压力与消耗',bridge:'先找到消耗来自哪里，再分清必须承担的责任与可以停止的争执。'},
  recovery: {name:'修复与重新开始',bridge:'不必急着恢复到原来的状态，先接受支持，再以能承受的步幅重新开始。'},
  completion: {name:'成果与阶段收尾',bridge:'确认哪些成果已经落地、哪些环节还需完成，然后决定下一阶段要延续什么。'},
  security: {name:'基础与长期积累',bridge:'把安全感落实到资源、规则与日常安排中，同时为必要的调整保留弹性。'},
};

const obstacle_lenses: Record<Theme,string> = {
  exploration:'可能性很多时，迟迟不落地或准备不足也会分散精力',
  direction:'目标与推进方式若没有协调，越急于行动越容易忽略实际限制',
  balance:'一味维持平衡或压住感受，也可能让真正的需求难以被表达',
  care:'照顾他人时若忽略自身需要，支持就容易变成消耗',
  connection:'把决定过多交给他人的回应，可能让自己的立场变得模糊',
  change:'对失去与未知的顾虑，可能让必要的转变迟迟无法展开',
  clarity:'信息不足、反复权衡或过度理性，都可能拖慢真实的选择',
  burden:'压力与争执会占用原本可以用于解决问题的精力',
  recovery:'尚未消化的疲惫或伤痛，可能影响重新投入的能力',
  completion:'对既有成果或理想结果的期待，可能让未完成的环节被忽视',
  security:'对稳定的依赖若变成紧握不放，就会减少调整与合作的空间',
};

export interface ReadingInterpretation { sections: { title: string; text: string; paragraphs?:string[]; items?:string[] }[] }

export interface CardInterpretation {
  slot_id:string; position:string; name:string; orientation:string; keywords:string[];
  focus:string; general:string; context:string; advice:string; reflection:string;
  overview?:string; symbolism?:string; love?:string; career?:string;
}

const reflections:Record<Theme,string>={
  exploration:'哪一个小尝试既让我好奇，又在目前的时间与资源范围内？',
  direction:'我真正想推进的目标是什么？今天能完成哪一个具体步骤？',
  balance:'哪里投入过多，哪里照顾不足？我可以先调整哪一条边界？',
  care:'我正在忽略什么需要？谁或什么安排能够提供实际的支持？',
  connection:'我希望得到怎样的回应？这份期待是否已经清楚地表达出来？',
  change:'哪些经验值得保留，哪些做法已经不再适合现在的处境？',
  clarity:'哪些是已经发生的事实，哪些只是猜测？还缺少什么信息？',
  burden:'哪些责任确实属于我，哪些可以协商、分担或停止？',
  recovery:'我现在能承受多大的步幅？什么能帮助我恢复一点力量？',
  completion:'哪些成果已经落实，哪些环节仍需要收尾？',
  security:'我的稳定感来自哪些实际条件？哪些安排需要留出调整空间？',
};

// 只解读已翻开的牌；牌位改变观察角度，不改写卡牌本身的含义。
export function interpret_cards(record:Reading,catalog:Dataset['cards']):CardInterpretation[]{
  return record.cards.filter(picked=>record.revealed.includes(picked.slot_id)).map(picked=>{
    const card=catalog.find(current=>current.id===picked.card.id)??picked.card;
    const orientation=picked.is_reversed?'逆位':'正位',motif=motifs[card.id]?.[picked.is_reversed?1:0];
    const focus=motif?.[1]??(picked.is_reversed?card.meaning_reversed:card.meaning_upright);
    const topics=card.meaning_details?.[picked.is_reversed?'reversed':'upright'];
    let context:string;
    const index=record.cards.indexOf(picked);
    if(record.mode==='past_present_future'&&record.cards.length===3){
      context=[
        `在过去的位置，关注「${focus}」如何成为这件事的背景。回顾相关经历、形成的习惯与当时的选择，辨认哪些影响仍延续到现在。`,
        `在现在的位置，先对照眼前的事实与感受，看看「${focus}」体现在哪一个具体环节。这张牌帮助你确认当下可以回应的部分。`,
        `在未来的位置，「${focus}」是一个值得观察的发展方向。可以留意当下的做法是否支持这个方向，并随实际反馈调整下一步。`,
      ][index];
    }else if(record.mode==='situation_obstacle_advice'&&record.cards.length===3){
      context=[
        `在现状的位置，用「${focus}」梳理当前最主要的需要、可用力量或正在发生的变化，再与阻碍位置的提示一起看。`,
        `在阻碍的位置，${picked.is_reversed?`「${focus}」是需要先处理的卡点`:motif?obstacle_lenses[motif[0]]:`需要留意「${focus}」在当前处境中的限制`}。对照实际情况，判断问题出在投入的程度、时机还是使用方式。`,
        `在建议的位置，把「${focus}」转成可执行的回应。先选一个与当前阻碍直接相关、自己能够掌握的小步骤，观察效果再继续。`,
      ][index];
    }else if(record.mode==='daily'){
      context=`作为今日提示，可以从今天的一次对话、一项任务或一个日常选择中观察「${focus}」。把注意力放在能够实践和回顾的小事上。`;
    }else{
      context=`自由探索中的这张牌提供「${focus}」这个观察角度。它没有预设的时间或因果牌位，可以先对照同一个问题，再与其他已翻开的牌比较相互补充或需要权衡的地方。`;
    }
    return {
      slot_id:picked.slot_id,position:picked.position,name:card.name_zh,orientation,
      keywords:picked.is_reversed?card.keywords_reversed:card.keywords_upright,focus,
      general:topics?.general??(picked.is_reversed?card.meaning_reversed:card.meaning_upright),context,
      advice:topics?.advice??`${focus}。${motif?themes[motif[0]].bridge:'选择一个能够落实的小步骤，并根据实际反馈调整。'}`,
      reflection:motif?reflections[motif[0]]:'这张牌的哪个提示最贴近眼前的实际情况？我可以如何回应？',
      overview:card.meaning_details?.overview,symbolism:card.meaning_details?.symbolism,love:topics?.love,career:topics?.career,
    };
  });
}

export function interpret_reading(record: Reading, catalog: Dataset['cards']): ReadingInterpretation | null {
  // 综合解读必须等全部翻开，避免文字提前泄露尚未揭晓的牌。
  if(record.cards.length<2||!record.cards.every(picked=>record.revealed.includes(picked.slot_id)))return null;
  const cards=record.cards.map(picked=>{
    const card=catalog.find(current=>current.id===picked.card.id)??picked.card;
    const reversed=picked.is_reversed;
    const motif=motifs[card.id]?.[reversed?1:0];
    const focus=motif?.[1]??(reversed?card.meaning_reversed:card.meaning_upright);
    return {picked,card,theme:motif?.[0],focus,ref:`${card.name_zh}（${reversed?'逆位':'正位'}）`};
  });
  const [first,second,third]=cards;
  let storyline:string;
  if(record.mode==='past_present_future'&&cards.length===3){
    storyline=`过去的${first.ref}以「${first.focus}」作为这件事的背景；现在的${second.ref}把关注点移到「${second.focus}」。把这两张牌连起来看，当前的选择需要回应之前留下的经验。未来位置的${third.ref}提示可以关注「${third.focus}」这一发展方向，具体如何展开，还需要结合当下的行动与现实变化。`;
  }else if(record.mode==='situation_obstacle_advice'&&cards.length===3){
    const obstacle=second.picked.is_reversed?`「${second.focus}」是需要先处理的卡点`:second.theme?`${obstacle_lenses[second.theme]}`:`需要留意「${second.focus}」在当前处境中的限制`;
    storyline=`现状位置的${first.ref}指出目前的核心是「${first.focus}」；阻碍位置的${second.ref}提醒你，${obstacle}。建议位置的${third.ref}将回应放在「${third.focus}」上，可以用这个方向调整阻碍对现状的影响。`;
  }else{
    storyline=`这 ${cards.length} 张牌可以并读为一组提醒：${cards.map(card=>`${card.ref}关注「${card.focus}」`).join('；')}。自由抽取没有预设的时间或因果牌位，可以把这些角度对照同一件事来理解。`;
  }

  const groups=new Map<Theme,typeof cards>();
  for(const card of cards){if(card.theme){const group=groups.get(card.theme)??[];group.push(card);groups.set(card.theme,group);}}
  const shared=[...groups].filter(([,group])=>group.length>1).sort((a,b)=>b[1].length-a[1].length);
  let connection:string;
  if(shared.length){
    const [theme,group]=shared[0];
    const complement=cards.find(card=>card.theme!==theme);
    connection=`${group.map(card=>card.ref).join('、')}共同指向「${themes[theme].name}」。${themes[theme].bridge}${complement?`同时，${complement.ref}带来的「${complement.focus}」补充了另一个角度，需要与这一共同主题一起考虑。`:''}`;
  }else{
    const last=cards[cards.length-1];
    connection=`${first.ref}的「${first.focus}」与${second.ref}的「${second.focus}」提出了不同侧面的需要，适合一起权衡，而不是让其中一张替另一张作决定。${cards.length>2?`${last.ref}进一步加入「${last.focus}」，提醒你在处理前面的需要时，也为这一点留出空间。`:'可以先看哪一个角度更贴近眼前的实际情况，再用另一个角度补足盲点。'}`;
  }
  const reversed=cards.filter(card=>card.picked.is_reversed);
  if(reversed.length&&reversed.length<cards.length){
    connection+=`其中${reversed.map(card=>card.ref).join('、')}的逆位提示有需要调整的环节，可借助其他牌呈现的视角寻找回应。`;
  }else if(reversed.length===cards.length){
    connection+='这一组全部为逆位，可以先观察内在感受、推进受阻或需要重新调整的部分，再决定行动节奏。';
  }

  // 仅明确的建议牌位优先提供行动；自由抽取不能被赋予不存在的牌位。
  const action=record.mode==='situation_obstacle_advice'&&cards.length===3?third:
    cards.find(card=>card.theme==='burden'||card.theme==='care')??cards[cards.length-1];
  const topics=action.card.meaning_details?.[action.picked.is_reversed?'reversed':'upright'];
  const advice=topics?.advice??`${action.focus}。${action.theme?themes[action.theme].bridge:'结合这张牌的提示，选一个能够落实的小步骤。'}`;
  const next_step=`可以先从${action.ref}的提示着手：${advice}${record.question.trim()?'再回到你写下的问题，检查这一步是否回应了你最在意的部分。':'选一件眼下能够落实的事，并观察它如何影响整组牌共同关注的问题。'}`;
  const positioned=(record.mode==='past_present_future'||record.mode==='situation_obstacle_advice')&&cards.length===3;
  return {sections:[
    {title:'整体脉络',text:storyline,
      paragraphs:positioned?storyline.split('；'):[`这 ${cards.length} 张牌可以并读为一组提醒：`,'自由抽取没有预设的时间或因果牌位，可以把这些角度对照同一件事来理解。'],
      items:positioned?undefined:cards.map(card=>`${card.ref}：${card.focus}`)},
    {title:'牌与牌的联系',text:connection},
    {title:'可以尝试的一步',text:next_step},
  ]};
}
