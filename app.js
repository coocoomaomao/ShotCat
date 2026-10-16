const $=s=>document.querySelector(s);
const canvas=$('#canvas'),ctx=canvas.getContext('2d');
let image=null,sourcePath=null,currentPreset='xhs34',currentTheme='mint',lastExport=null;

const PRESETS={
  xhs34:{w:1080,h:1440},
  square:{w:1080,h:1080},
  video169:{w:1920,h:1080},
  story916:{w:1080,h:1920},
  readme:{w:1600,h:900}
};
const THEMES={
  mint:{a:'#d7f7e8',b:'#f8df85',ink:'#152019',accent:'#42b985'},
  dark:{a:'#11161d',b:'#264d40',ink:'#ffffff',accent:'#71e0b2'},
  sunset:{a:'#ffcab4',b:'#f5d15e',ink:'#2c211d',accent:'#e87659'},
  lavender:{a:'#eadfff',b:'#cceaff',ink:'#27213a',accent:'#8e72d6'},
  cream:{a:'#fff8e8',b:'#ead5a8',ink:'#26231e',accent:'#b8893a'},
  minimal:{a:'#f5f5f5',b:'#ffffff',ink:'#171b22',accent:'#3a3d40'}
};

function toast(msg){
  const t=$('#toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2100);
}
function rr(x,y,w,h,r){
  const q=Math.max(0,Math.min(r,w/2,h/2));
  ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath();
}
function wrap(text,maxW,font){
  ctx.font=font;const out=[];let line='';
  for(const ch of [...String(text||'')]){
    const t=line+ch;
    if(ctx.measureText(t).width>maxW&&line){out.push(line);line=ch}else line=t;
  }
  if(line)out.push(line);
  return out.slice(0,3);
}

function bg(w,h,t){
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,t.a);g.addColorStop(1,t.b);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(currentTheme!=='minimal'){
    const rg=ctx.createRadialGradient(w*.82,h*.13,0,w*.82,h*.13,Math.min(w,h)*.55);
    rg.addColorStop(0,'rgba(255,255,255,.4)');rg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.12;ctx.fillStyle=t.accent;ctx.beginPath();ctx.arc(w*.1,h*.9,Math.min(w,h)*.16,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
}

function titleArea(w,h,t,pad){
  if(!$('#showTitle').checked)return 0;
  const portrait=h>w,size=Math.round(Math.min(w,h)*(portrait?.052:.055)),sub=Math.round(size*.36),maxW=w-pad*2;
  const font=`900 ${size}px "Microsoft YaHei","PingFang SC",sans-serif`;
  const lines=wrap($('#mainTitle').value,maxW,font),y=pad*.82;
  ctx.textBaseline='top';ctx.fillStyle=t.ink;ctx.font=font;
  lines.forEach((x,i)=>ctx.fillText(x,pad,y+i*size*1.18));
  const th=lines.length*size*1.18;
  ctx.font=`600 ${sub}px "Microsoft YaHei","PingFang SC",sans-serif`;
  ctx.globalAlpha=.67;ctx.fillText($('#subtitle').value,pad,y+th+sub*.35);ctx.globalAlpha=1;
  ctx.fillStyle=t.accent;rr(pad,y+th+sub*1.65,Math.min(maxW*.22,220),Math.max(7,size*.1),99);ctx.fill();
  return th+sub*2.5;
}

function chrome(x,y,w,scale){
  const bar=Math.max(28,44*scale);
  ctx.fillStyle='rgba(247,248,249,.98)';rr(x,y,w,bar,Math.max(10,16*scale));ctx.fill();
  const r=5.5*scale,gap=18*scale,start=x+20*scale,cy=y+bar/2;
  ['#ff605c','#ffbd44','#00ca4e'].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(start+i*gap,cy,r,0,Math.PI*2);ctx.fill()});
  ctx.fillStyle='rgba(30,34,38,.5)';ctx.font=`600 ${Math.max(10,12*scale)}px sans-serif`;ctx.textBaseline='middle';ctx.fillText('ShotCat Preview',x+w/2-42*scale,cy);
  return bar;
}

function render(){
  const p=PRESETS[currentPreset],t=THEMES[currentTheme];
  canvas.width=p.w;canvas.height=p.h;$('#stageSize').textContent=`${p.w} × ${p.h}`;
  bg(p.w,p.h,t);
  if(!image)return;

  const pad=Number($('#padding').value),radius=Number($('#radius').value),shadow=Number($('#shadow').value),scale=Number($('#scale').value)/100,th=titleArea(p.w,p.h,t,pad);
  const top=pad+th,aw=p.w-pad*2,ah=p.h-top-pad,extra=$('#windowFrame').checked?Math.max(26,p.w*.028):0;
  const s=Math.min(aw/image.naturalWidth,(ah-extra)/image.naturalHeight)*scale;
  const dw=image.naturalWidth*s,dh=image.naturalHeight*s,total=dh+extra,x=(p.w-dw)/2,y=top+(ah-total)/2;

  ctx.save();
  ctx.shadowColor=`rgba(0,0,0,${shadow/100*.34})`;ctx.shadowBlur=shadow*.72;ctx.shadowOffsetY=shadow*.25;
  ctx.fillStyle='rgba(255,255,255,.98)';rr(x,y,dw,total,radius+6);ctx.fill();
  ctx.restore();

  let iy=y;
  if($('#windowFrame').checked)iy+=chrome(x,y,dw,Math.max(.75,p.w/1080));

  ctx.save();rr(x,iy,dw,dh,radius);ctx.clip();ctx.drawImage(image,x,iy,dw,dh);ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=Math.max(1,p.w/1080*2);rr(x,iy,dw,dh,radius);ctx.stroke();
}

async function choose(){
  try{
    const r=await window.shotcat.chooseImage();
    if(!r)return;
    const img=new Image();
    img.onload=()=>{
      image=img;sourcePath=r.path;$('#sourceName').textContent=r.name;$('#empty').hidden=true;$('#exportBtn').disabled=false;render();
    };
    img.src=r.dataUrl;
  }catch(e){toast(e.message||'读取图片失败')}
}

$('#chooseBtn').addEventListener('click',choose);
$('#emptyChooseBtn').addEventListener('click',choose);

document.querySelector('.presets').addEventListener('click',e=>{
  const b=e.target.closest('[data-preset]');if(!b)return;
  currentPreset=b.dataset.preset;
  document.querySelectorAll('[data-preset]').forEach(x=>x.classList.toggle('active',x===b));
  render();
});

document.querySelector('.themes').addEventListener('click',e=>{
  const b=e.target.closest('[data-theme]');if(!b)return;
  currentTheme=b.dataset.theme;
  document.querySelectorAll('[data-theme]').forEach(x=>x.classList.toggle('active',x===b));
  render();
});

['mainTitle','subtitle','showTitle','windowFrame','padding','radius','shadow','scale'].forEach(id=>$('#'+id).addEventListener('input',()=>{
  $('#paddingValue').textContent=$('#padding').value;
  $('#radiusValue').textContent=$('#radius').value;
  $('#shadowValue').textContent=$('#shadow').value;
  $('#scaleValue').textContent=$('#scale').value+'%';
  render();
}));

$('#exportBtn').addEventListener('click',async()=>{
  if(!image||!sourcePath)return;
  render();
  try{
    const saved=await window.shotcat.savePng({dataUrl:canvas.toDataURL('image/png'),sourcePath,preset:currentPreset});
    if(saved){lastExport=saved;$('#openBtn').hidden=false;toast('导出成功 😼')}
  }catch(e){toast(e.message||'导出失败')}
});

$('#openBtn').addEventListener('click',()=>{if(lastExport)window.shotcat.revealFile(lastExport)});
render();
