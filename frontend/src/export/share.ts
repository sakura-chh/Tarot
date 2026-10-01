import type { Card, Reading } from '../domain/types';
import { share_sections } from './share-content';
import type { ShareOptions, ShareSection } from './share-content';
import oil_background from './assets/medieval-oil-v1.png';

const WIDTH=1200,INSET=104,TEXT_WIDTH=WIDTH-INSET*2;
const SERIF='"Songti SC", "Noto Serif SC", serif';
const palettes={
  umber:{base:'#261b12',shade:'#0f0b08',gold:'#d2b57b',light:'#f0e2c4',text:'#dfd3bc',muted:'#b69b76'},
  burgundy:{base:'#29141b',shade:'#10090d',gold:'#d8b47b',light:'#f4e1c3',text:'#e4d1bf',muted:'#be9b83'},
};

function lines(ctx:CanvasRenderingContext2D,text:string,width:number):string[]{
  const output:string[]=[];let current='';
  for(const character of Array.from(text)){
    if(character==='\n'){output.push(current);current='';continue;}
    if(current&&ctx.measureText(current+character).width>width){output.push(current);current=character;}
    else current+=character;
  }
  if(current)output.push(current);
  return output;
}
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,width:number,line_height:number){
  for(const line of lines(ctx,value,width)){ctx.fillText(line,x,y);y+=line_height;}return y;
}
async function image(url:string){const value=new Image();value.src=url;await value.decode();return value;}
async function card_image(picked:Reading['cards'][number]){
  try{return await image(picked.card.images.display_url);}catch(error){
    if(!picked.display_blob)throw error;
    const url=URL.createObjectURL(picked.display_blob);
    try{return await image(url);}finally{URL.revokeObjectURL(url);}
  }
}
function rule(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,gold:string){
  const gradient=ctx.createLinearGradient(x,y,x+width,y);
  gradient.addColorStop(0,`${gold}00`);gradient.addColorStop(.25,`${gold}80`);gradient.addColorStop(.5,gold);gradient.addColorStop(.75,`${gold}80`);gradient.addColorStop(1,`${gold}00`);
  ctx.strokeStyle=gradient;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y);ctx.stroke();
}
function diamond(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,gold:string){
  ctx.fillStyle=gold;ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size,y);ctx.lineTo(x,y+size);ctx.lineTo(x-size,y);ctx.closePath();ctx.fill();
}
function sun(ctx:CanvasRenderingContext2D,x:number,y:number,gold:string){
  ctx.strokeStyle=gold;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<12;i++){const angle=i*Math.PI/6;ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*20,y+Math.sin(angle)*20);ctx.lineTo(x+Math.cos(angle)*28,y+Math.sin(angle)*28);ctx.stroke();}
}

interface MeasuredSection {section:ShareSection;height:number;entries:{title:string;text:string;height:number}[]}

export async function export_reading(record:Reading,spread_title:string,options:ShareOptions,catalog:Card[]):Promise<Blob>{
  const sections=share_sections(record,options,catalog);
  if(!sections.length)throw Error('请至少选择一个有内容的组件。');
  // 等字体加载后按实际字宽测量，避免导出时字体变化导致长文截断。
  await document.fonts.ready;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('当前浏览器无法生成分享图。');
  const palette=palettes[options.palette],title=options.title.trim()||spread_title;
  ctx.font=`56px ${SERIF}`;const title_lines=lines(ctx,title,TEXT_WIDTH);
  const header_height=220+title_lines.length*68+(options.show_date?38:0);
  const columns=options.layout==='folio'?1:Math.min(3,record.cards.length),rows=Math.ceil(record.cards.length/columns);
  const card_height=columns===1?500:columns===2?430:390,row_height=card_height+112;
  const measured:MeasuredSection[]=sections.map(section=>{
    const entries=section.entries.map(entry=>{
      ctx.font=`28px ${SERIF}`;const heading=entry.title?lines(ctx,entry.title,TEXT_WIDTH-48).length*42+12:0;
      ctx.font=`26px ${SERIF}`;return {...entry,height:heading+lines(ctx,entry.text,TEXT_WIDTH-48).length*42+30};
    });
    return {section,entries,height:section.id==='cards'?126+rows*row_height:126+entries.reduce((sum,entry)=>sum+entry.height,0)};
  });
  const height=header_height+measured.reduce((sum,section)=>sum+section.height+30,0)+164;
  // 分配大画布前限制高度，防止过多组件造成内存激增或浏览器生成失败。
  if(height>13000)throw Error('内容过长，请减少分享组件后重试。');
  canvas.width=WIDTH;canvas.height=height;
  ctx.fillStyle=palette.base;ctx.fillRect(0,0,WIDTH,canvas.height);
  const background=await image(oil_background);
  ctx.drawImage(background,0,0,WIDTH,canvas.height);
  ctx.fillStyle=options.palette==='burgundy'?'#260c2280':'#140e0a3d';ctx.fillRect(0,0,WIDTH,canvas.height);
  const vignette=ctx.createLinearGradient(0,0,WIDTH,0);
  vignette.addColorStop(0,'#00000070');vignette.addColorStop(.2,'#0000000d');vignette.addColorStop(.8,'#0000000d');vignette.addColorStop(1,'#00000070');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,WIDTH,canvas.height);
  if(options.ornaments){
    ctx.strokeStyle=`${palette.gold}90`;ctx.lineWidth=2;ctx.strokeRect(36,36,WIDTH-72,canvas.height-72);
    ctx.strokeStyle=`${palette.gold}45`;ctx.lineWidth=1;ctx.strokeRect(46,46,WIDTH-92,canvas.height-92);
    for(const x of [36,WIDTH-36])for(const y of [36,canvas.height-36])diamond(ctx,x,y,6,palette.gold);
    sun(ctx,WIDTH/2,80,palette.gold);
  }
  ctx.textAlign='center';ctx.fillStyle=palette.muted;ctx.font='17px Georgia,serif';ctx.fillText('A QUIET MOMENT · AN INNER JOURNEY',WIDTH/2,132);
  ctx.fillStyle=palette.light;ctx.font=`56px ${SERIF}`;let title_y=204;
  for(const line of title_lines){ctx.fillText(line,WIDTH/2,title_y);title_y+=68;}
  if(options.show_date){ctx.fillStyle=palette.muted;ctx.font='22px Georgia,serif';ctx.fillText(record.local_date,WIDTH/2,title_y-20);}
  rule(ctx,INSET,header_height-24,TEXT_WIDTH,palette.gold);
  if(options.ornaments)diamond(ctx,WIDTH/2,header_height-24,5,palette.gold);
  const faces=sections.some(section=>section.id==='cards')?await Promise.all(record.cards.map(card_image)):[];
  let y=header_height;
  for(const block of measured){
    const {section}=block;
    ctx.fillStyle=`${palette.shade}a8`;ctx.fillRect(INSET-24,y,TEXT_WIDTH+48,block.height);
    ctx.strokeStyle=`${palette.gold}24`;ctx.lineWidth=1;ctx.strokeRect(INSET-24,y,TEXT_WIDTH+48,block.height);
    ctx.textAlign='left';ctx.fillStyle=palette.muted;ctx.font='15px Georgia,serif';ctx.fillText(section.eyebrow,INSET,y+34);
    ctx.fillStyle=palette.light;ctx.font=`32px ${SERIF}`;ctx.fillText(section.title,INSET,y+77);
    rule(ctx,INSET,y+96,TEXT_WIDTH,palette.gold);
    const cursor_start=y+128;let cursor=cursor_start;
    if(section.id==='cards'){
      const cell=TEXT_WIDTH/columns;
      for(let i=0;i<record.cards.length;i++){
        const row=Math.floor(i/columns),row_count=Math.min(columns,record.cards.length-row*columns);
        const picked=record.cards[i],face=faces[i],center=INSET+(TEXT_WIDTH-cell*row_count)/2+cell*(i%columns+.5),top=cursor_start+row*row_height;
        const width=card_height*face.naturalWidth/face.naturalHeight;
        ctx.save();ctx.shadowColor='#00000090';ctx.shadowBlur=22;ctx.shadowOffsetY=9;
        ctx.fillStyle='#160e09';ctx.fillRect(center-width/2-8,top-8,width+16,card_height+16);ctx.restore();
        if(options.ornaments){ctx.strokeStyle=palette.gold;ctx.lineWidth=2;ctx.strokeRect(center-width/2-7,top-7,width+14,card_height+14);}
        ctx.save();ctx.translate(center,top+card_height/2);if(picked.is_reversed)ctx.rotate(Math.PI);
        ctx.drawImage(face,-width/2,-card_height/2,width,card_height);ctx.restore();
        ctx.textAlign='center';ctx.fillStyle=palette.light;ctx.font=`28px ${SERIF}`;ctx.fillText(picked.card.name_zh,center,top+card_height+46);
        ctx.fillStyle=palette.muted;ctx.font=`19px ${SERIF}`;
        ctx.fillText(`${options.show_positions?`${picked.position} · `:''}${picked.is_reversed?'逆位':'正位'}`,center,top+card_height+78);
      }
    }else{
      ctx.textAlign='left';
      for(const entry of block.entries){
        if(entry.title){ctx.fillStyle=palette.gold;ctx.font=`28px ${SERIF}`;cursor=text(ctx,entry.title,INSET+24,cursor,TEXT_WIDTH-48,42)+12;}
        ctx.fillStyle=palette.text;ctx.font=`26px ${SERIF}`;cursor=text(ctx,entry.text,INSET+24,cursor,TEXT_WIDTH-48,42)+30;
      }
    }
    y+=block.height+30;
  }
  rule(ctx,INSET,y+14,TEXT_WIDTH,palette.gold);ctx.textAlign='center';ctx.fillStyle=palette.muted;ctx.font=`21px ${SERIF}`;
  if(options.signature.trim())ctx.fillText(options.signature.trim(),WIDTH/2,y+62);
  ctx.font=`18px ${SERIF}`;ctx.fillText('留一点时间，听见自己。',WIDTH/2,y+96);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('图片生成失败，请减少分享组件后重试。')),'image/png'));
}
