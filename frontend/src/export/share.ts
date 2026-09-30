import type { Reading } from '../domain/types';

function wrapped(ctx: CanvasRenderingContext2D,text: string,x: number,y: number,width: number,line: number): number {
  let current='';
  for(const character of text){
    if(character==='\n' || ctx.measureText(current+character).width>width){ctx.fillText(current,x,y);y+=line;current=character==='\n'?'':character;}
    else current+=character;
  }
  if(current)ctx.fillText(current,x,y);return y+line;
}
async function image(url: string){
  const value=new Image();value.src=url;await value.decode();return value;
}
export async function export_reading(record: Reading,title: string,include_question: boolean,include_notes: boolean): Promise<Blob> {
  await document.fonts.ready;
  const columns=record.cards.length===1?1:Math.min(3,record.cards.length),rows=Math.ceil(record.cards.length/columns);
  const note_height=include_notes?Math.min(800,Math.ceil(record.notes.length/34)*38+50):0;
  const question_height=include_question?Math.ceil(record.question.length/34)*38+40:0;
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=230+rows*640+question_height+note_height;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#eee2c9';ctx.fillRect(0,0,1200,canvas.height);
  ctx.strokeStyle='#a2865f';ctx.lineWidth=2;ctx.strokeRect(30,30,1140,canvas.height-60);
  ctx.textAlign='center';ctx.fillStyle='#443529';ctx.font='42px "Songti SC", serif';ctx.fillText(`纸境 · ${title}`,600,105);
  ctx.font='22px serif';ctx.fillText(`${record.local_date}  ·  TAROT ATELIER`,600,149);
  for(let i=0;i<record.cards.length;i++){
    const picked=record.cards[i], cell=1080/columns,x=60+(i%columns)*cell,y=195+Math.floor(i/columns)*640;
    let fallback_url='';
    try{
      let face:HTMLImageElement;
      try{face=await image(picked.card.images.display_url);}catch(error){
        if(!picked.display_blob)throw error;
        fallback_url=URL.createObjectURL(picked.display_blob);face=await image(fallback_url);
      }
      const height=415,width=height*face.width/face.height;
      ctx.save();ctx.translate(x+cell/2,y+height/2);
      if(picked.is_reversed)ctx.rotate(Math.PI);ctx.drawImage(face,-width/2,-height/2,width,height);ctx.restore();
    }finally{if(fallback_url)URL.revokeObjectURL(fallback_url);}
    ctx.textAlign='center';ctx.font='30px "Songti SC", serif';ctx.fillText(picked.card.name_zh,x+cell/2,y+460);
    ctx.font='20px serif';ctx.fillText(`${picked.position} · ${picked.is_reversed?'逆位':'正位'}`,x+cell/2,y+495);
    ctx.textAlign='left';ctx.font='22px "Songti SC", serif';
    wrapped(ctx,picked.is_reversed?picked.card.meaning_reversed:picked.card.meaning_upright,x+24,y+535,cell-48,31);
  }
  ctx.textAlign='left';ctx.font='26px "Songti SC", serif';let y=210+rows*640;
  if(include_question)y=wrapped(ctx,`我的问题：${record.question}`,80,y,1040,38)+12;
  if(include_notes)wrapped(ctx,`我的笔记：${record.notes.slice(0,700)}`,80,y,1040,38);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('图片生成失败')),'image/png'));
}
