const $=s=>document.querySelector(s);
const canvas=$('#canvas'),ctx=canvas.getContext('2d');

let image=null,compareImage=null,sourcePath=null,compareSourcePath=null;
let currentPreset='xhs34',currentTheme='mint',currentMode='promo',currentTemplate='launch',lastExport=null;

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

const TEMPLATES={
  launch:{
    preset:'xhs34',theme:'mint',
    product:'ShotCat 截图上镜猫',
    kicker:'喵造实验室 012 · WINDOWS',
    title:'截图太素？让猫给它化个妆。',
    subtitle:'拖进截图，一键生成能直接发的小红书宣传图',
    chips:['一键美化','小红书 3:4','本地处理'],
    badge:'NEW · v0.3'
  },
  update:{
    preset:'xhs34',theme:'lavender',
    product:'ShotCat v0.3',
    kicker:'PRODUCT UPDATE · NEW VERSION',
    title:'这次更新，真的更会做宣传图了。',
    subtitle:'新增海报模板库：首发、更新、对比、免费、开源一键套版',
    chips:['模板库','一键套版','完整像素导出'],
    badge:'UPDATE'
  },
  compare:{
    preset:'xhs34',theme:'cream',
    product:'Before & After',
    kicker:'SHOTCAT · VISUAL COMPARISON',
    title:'改之前 vs 改之后，一张图看懂。',
    subtitle:'适合界面改版、截图美化、设计优化和产品升级对比',
    chips:['双图对比','自动排版','一键导出'],
    badge:'BEFORE → AFTER'
  },
  free:{
    preset:'xhs34',theme:'sunset',
    product:'ShotCat 截图上镜猫',
    kicker:'FREE TOOL · WINDOWS',
    title:'这个小工具，免费。',
    subtitle:'不注册、不上传，把普通截图直接变成能发的宣传图',
    chips:['免费使用','本地处理','无需登录'],
    badge:'FREE'
  },
  opensource:{
    preset:'readme',theme:'dark',
    product:'ShotCat · Open Source',
    kicker:'GITHUB · MEOWBUILD LAB',
    title:'我把这只截图猫开源了。',
    subtitle:'Windows 本地截图美化与宣传图制作工具',
    chips:['GitHub 开源','MIT','Local-first'],
    badge:'OPEN SOURCE'
  }
};

function toast(msg){
  const t=$('#toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2100);
}

function rr(x,y,w,h,r){
  const q=Math.max(0,Math.min(r,w/2,h/2));
  ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);
  ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath();
}

function wrap(text,maxW,font,maxLines=3){
  ctx.font=font;const out=[];let line='';
  for(const ch of [...String(text||'')]){
    const test=line+ch;
    if(ctx.measureText(test).width>maxW&&line){out.push(line);line=ch}else line=test;
  }
  if(line)out.push(line);
  return out.slice(0,maxLines);
}

function drawBackground(w,h,t){
  const g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,t.a);g.addColorStop(1,t.b);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(currentTheme!=='minimal'){
    const rg=ctx.createRadialGradient(w*.83,h*.12,0,w*.83,h*.12,Math.min(w,h)*.58);
    rg.addColorStop(0,'rgba(255,255,255,.42)');rg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.1;ctx.fillStyle=t.accent;
    ctx.beginPath();ctx.arc(w*.08,h*.9,Math.min(w,h)*.16,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }
}

function chrome(x,y,w,scale,label='ShotCat Preview'){
  const bar=Math.max(28,44*scale);
  ctx.fillStyle='rgba(247,248,249,.98)';rr(x,y,w,bar,Math.max(10,16*scale));ctx.fill();
  const r=5.5*scale,gap=18*scale,start=x+20*scale,cy=y+bar/2;
  ['#ff605c','#ffbd44','#00ca4e'].forEach((c,i)=>{
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(start+i*gap,cy,r,0,Math.PI*2);ctx.fill();
  });
  ctx.fillStyle='rgba(30,34,38,.5)';
  ctx.font=`600 ${Math.max(10,12*scale)}px sans-serif`;
  ctx.textBaseline='middle';
  const tw=ctx.measureText(label).width;
  ctx.fillText(label,x+w/2-tw/2,cy);
  ctx.textBaseline='top';
  return bar;
}

function drawScreenshotBox(img,x,y,maxW,maxH,radius,shadow,label='ShotCat Preview'){
  if(!img)return null;
  const extra=$('#windowFrame').checked?Math.max(26,canvas.width*.028):0;
  const scaleControl=Number($('#scale').value)/100;
  const s=Math.min(maxW/img.naturalWidth,(maxH-extra)/img.naturalHeight)*scaleControl;
  const dw=img.naturalWidth*s,dh=img.naturalHeight*s,total=dh+extra;
  const xx=x+(maxW-dw)/2,yy=y+(maxH-total)/2;

  ctx.save();
  ctx.shadowColor=`rgba(0,0,0,${shadow/100*.34})`;
  ctx.shadowBlur=shadow*.72;ctx.shadowOffsetY=shadow*.25;
  ctx.fillStyle='rgba(255,255,255,.98)';rr(xx,yy,dw,total,radius+6);ctx.fill();
  ctx.restore();

  let iy=yy;
  if($('#windowFrame').checked)iy+=chrome(xx,yy,dw,Math.max(.75,canvas.width/1080),label);

  ctx.save();rr(xx,iy,dw,dh,radius);ctx.clip();ctx.drawImage(img,xx,iy,dw,dh);ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=Math.max(1,canvas.width/1080*2);
  rr(xx,iy,dw,dh,radius);ctx.stroke();

  return {x:xx,y:yy,w:dw,h:total};
}

function pill(text,x,y,style,size){
  if(!String(text||'').trim())return 0;
  ctx.font=`800 ${size}px "Microsoft YaHei","PingFang SC",sans-serif`;
  const padX=size*.72,padY=size*.46,w=ctx.measureText(text).width+padX*2,h=size+padY*2;
  ctx.fillStyle=style.bg;rr(x,y,w,h,h/2);ctx.fill();
  ctx.fillStyle=style.fg;ctx.textBaseline='middle';ctx.fillText(text,x+padX,y+h/2);ctx.textBaseline='top';
  return w;
}

function drawCatMark(x,y,size,t){
  ctx.save();ctx.translate(x,y);ctx.fillStyle=t.ink;ctx.beginPath();
  ctx.moveTo(size*.1,size*.38);ctx.lineTo(size*.2,size*.03);ctx.lineTo(size*.42,size*.23);
  ctx.quadraticCurveTo(size*.5,size*.18,size*.58,size*.23);
  ctx.lineTo(size*.8,size*.03);ctx.lineTo(size*.9,size*.38);
  ctx.quadraticCurveTo(size*.98,size*.54,size*.84,size*.72);
  ctx.quadraticCurveTo(size*.5,size*.94,size*.16,size*.72);
  ctx.quadraticCurveTo(size*.02,size*.54,size*.1,size*.38);ctx.fill();
  ctx.fillStyle='#f4cb58';ctx.beginPath();
  ctx.arc(size*.34,size*.5,size*.075,0,Math.PI*2);ctx.arc(size*.66,size*.5,size*.075,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawBrand(x,y,t,scale){
  if(!$('#showBrand').checked)return;
  const icon=42*scale;drawCatMark(x,y,icon,t);
  ctx.fillStyle=t.ink;
  ctx.font=`900 ${17*scale}px "Microsoft YaHei","PingFang SC",sans-serif`;
  ctx.textBaseline='top';ctx.fillText('喵造实验室',x+icon+12*scale,y+2*scale);
  ctx.globalAlpha=.58;ctx.font=`700 ${9*scale}px sans-serif`;
  ctx.fillText('MEOWBUILD LAB · 012',x+icon+12*scale,y+25*scale);ctx.globalAlpha=1;
}

function drawPromoHeader(w,t,pad,unit){
  const ink=t.ink;
  const muted=currentTheme==='dark'?'rgba(255,255,255,.67)':'rgba(23,27,34,.62)';
  const badge=$('#badgeText').value.trim();

  ctx.fillStyle=muted;
  ctx.font=`800 ${15*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;
  ctx.textBaseline='top';
  ctx.fillText($('#kicker').value.toUpperCase(),pad,pad*.8);

  if(badge){
    ctx.font=`900 ${13*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;
    const bw=ctx.measureText(badge).width+28*unit,bh=32*unit;
    ctx.fillStyle=t.accent;rr(w-pad-bw,pad*.68,bw,bh,bh/2);ctx.fill();
    ctx.fillStyle=currentTheme==='dark'?'#11161d':'#fff';
    ctx.textBaseline='middle';ctx.fillText(badge,w-pad-bw+14*unit,pad*.68+bh/2);ctx.textBaseline='top';
  }

  return {ink,muted};
}

function renderCompare(w,h,t){
  const portrait=h>=w*.95;
  const unit=Math.min(w,h)/1080;
  const pad=Math.max(54,Number($('#padding').value))*unit;
  const radius=Number($('#radius').value)*unit,shadow=Number($('#shadow').value);
  const {ink,muted}=drawPromoHeader(w,t,pad,unit);

  const productY=pad*1.45;
  ctx.fillStyle=ink;ctx.font=`900 ${24*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;
  ctx.fillText($('#productName').value,pad,productY);

  const titleY=productY+48*unit,titleSize=(portrait?58:52)*unit;
  const titleFont=`950 ${titleSize}px "Microsoft YaHei","PingFang SC",sans-serif`;
  const titleLines=wrap($('#promoTitle').value,w-pad*2,titleFont,2);
  ctx.font=titleFont;ctx.fillStyle=ink;
  titleLines.forEach((line,i)=>ctx.fillText(line,pad,titleY+i*titleSize*1.08));
  const titleH=titleLines.length*titleSize*1.08;

  const subY=titleY+titleH+16*unit;
  ctx.font=`600 ${19*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;ctx.fillStyle=muted;
  wrap($('#promoSubtitle').value,w-pad*2,ctx.font,2).forEach((line,i)=>ctx.fillText(line,pad,subY+i*27*unit));

  const cardsTop=subY+78*unit;
  const brandSpace=70*unit;

  if(portrait){
    const gap=24*unit;
    const cardW=(w-pad*2-gap)/2;
    const cardH=Math.max(250*unit,h-cardsTop-pad-brandSpace);

    pill('BEFORE',pad,cardsTop-42*unit,{bg:'rgba(23,27,34,.13)',fg:ink},13*unit);
    pill('AFTER',pad+cardW+gap,cardsTop-42*unit,{bg:t.accent,fg:currentTheme==='dark'?'#11161d':'#fff'},13*unit);

    drawScreenshotBox(image,pad,cardsTop,cardW,cardH,radius,shadow,'Before');
    if(compareImage){
      drawScreenshotBox(compareImage,pad+cardW+gap,cardsTop,cardW,cardH,radius,shadow,'After');
    }else{
      ctx.save();ctx.setLineDash([12*unit,10*unit]);ctx.strokeStyle=muted;ctx.lineWidth=2*unit;
      rr(pad+cardW+gap,cardsTop,cardW,cardH,24*unit);ctx.stroke();ctx.restore();
      ctx.fillStyle=muted;ctx.font=`700 ${18*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;
      ctx.textAlign='center';ctx.fillText('选择第二张截图',pad+cardW+gap+cardW/2,cardsTop+cardH/2);ctx.textAlign='left';
    }
  }else{
    const gap=30*unit;
    const cardW=(w-pad*2-gap)/2,cardH=h-cardsTop-pad;
    pill('BEFORE',pad,cardsTop-40*unit,{bg:'rgba(23,27,34,.13)',fg:ink},12*unit);
    pill('AFTER',pad+cardW+gap,cardsTop-40*unit,{bg:t.accent,fg:currentTheme==='dark'?'#11161d':'#fff'},12*unit);
    drawScreenshotBox(image,pad,cardsTop,cardW,cardH,radius,shadow,'Before');
    if(compareImage)drawScreenshotBox(compareImage,pad+cardW+gap,cardsTop,cardW,cardH,radius,shadow,'After');
  }

  drawBrand(pad,h-pad-brandSpace*.45,t,unit);
}

function renderPromo(w,h,t){
  if(currentTemplate==='compare'){renderCompare(w,h,t);return;}

  const portrait=h>=w*.95;
  const unit=Math.min(w,h)/1080;
  const pad=Math.max(54,Number($('#padding').value))*unit;
  const radius=Number($('#radius').value)*unit,shadow=Number($('#shadow').value);
  const {ink,muted}=drawPromoHeader(w,t,pad,unit);

  if(portrait){
    const productY=pad*1.5;
    ctx.fillStyle=ink;ctx.font=`900 ${24*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;
    ctx.fillText($('#productName').value,pad,productY);

    const titleY=productY+48*unit,titleSize=66*unit,titleFont=`950 ${titleSize}px "Microsoft YaHei","PingFang SC",sans-serif`;
    const titleLines=wrap($('#promoTitle').value,w-pad*2,titleFont,3);
    ctx.font=titleFont;ctx.fillStyle=ink;
    titleLines.forEach((line,i)=>ctx.fillText(line,pad,titleY+i*titleSize*1.1));
    const titleH=titleLines.length*titleSize*1.1;

    const subY=titleY+titleH+20*unit;
    ctx.font=`600 ${22*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;ctx.fillStyle=muted;
    const subs=wrap($('#promoSubtitle').value,w-pad*2,ctx.font,2);
    subs.forEach((line,i)=>ctx.fillText(line,pad,subY+i*30*unit));

    const chipsY=subY+subs.length*30*unit+30*unit;
    let cx=pad;
    const chipStyle={bg:currentTheme==='dark'?'rgba(255,255,255,.12)':'rgba(255,255,255,.72)',fg:ink};
    [$('#chip1').value,$('#chip2').value,$('#chip3').value].forEach(text=>{
      if(!text.trim())return;
      const pw=pill(text,cx,chipsY,chipStyle,15*unit);
      cx+=pw+12*unit;
    });

    const shotTop=chipsY+62*unit,brandH=70*unit;
    const shotH=Math.max(250*unit,h-shotTop-pad-brandH);
    drawScreenshotBox(image,pad,shotTop,w-pad*2,shotH,radius,shadow,$('#productName').value);
    drawBrand(pad,h-pad-brandH*.55,t,unit);
  }else{
    const leftW=w*.39;
    ctx.fillStyle=ink;ctx.font=`900 ${22*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;
    ctx.fillText($('#productName').value,pad,pad*1.45);

    const titleY=pad*2.15,titleSize=57*unit,titleFont=`950 ${titleSize}px "Microsoft YaHei","PingFang SC",sans-serif`;
    const lines=wrap($('#promoTitle').value,leftW-pad,titleFont,4);
    ctx.font=titleFont;ctx.fillStyle=ink;
    lines.forEach((line,i)=>ctx.fillText(line,pad,titleY+i*titleSize*1.08));
    const titleH=lines.length*titleSize*1.08;

    ctx.font=`600 ${19*unit}px "Microsoft YaHei","PingFang SC",sans-serif`;ctx.fillStyle=muted;
    wrap($('#promoSubtitle').value,leftW-pad,ctx.font,3)
      .forEach((line,i)=>ctx.fillText(line,pad,titleY+titleH+20*unit+i*28*unit));

    let py=titleY+titleH+115*unit;
    const chipStyle={bg:currentTheme==='dark'?'rgba(255,255,255,.12)':'rgba(255,255,255,.72)',fg:ink};
    [$('#chip1').value,$('#chip2').value,$('#chip3').value].forEach(text=>{
      if(text.trim()){pill(text,pad,py,chipStyle,14*unit);py+=47*unit;}
    });

    drawBrand(pad,h-pad-45*unit,t,unit);
    const rightX=leftW+pad*.3,rightPad=pad*.8;
    drawScreenshotBox(image,rightX,pad,w-rightX-rightPad,h-pad*2,radius,shadow,$('#productName').value);
  }
}

function titleArea(w,h,t,pad){
  if(!$('#showTitle').checked)return 0;
  const portrait=h>w,size=Math.round(Math.min(w,h)*(portrait?.052:.055)),sub=Math.round(size*.36),maxW=w-pad*2;
  const font=`900 ${size}px "Microsoft YaHei","PingFang SC",sans-serif`;
  const lines=wrap($('#mainTitle').value,maxW,font,3),y=pad*.82;
  ctx.textBaseline='top';ctx.fillStyle=t.ink;ctx.font=font;
  lines.forEach((x,i)=>ctx.fillText(x,pad,y+i*size*1.18));
  const th=lines.length*size*1.18;
  ctx.font=`600 ${sub}px "Microsoft YaHei","PingFang SC",sans-serif`;ctx.globalAlpha=.67;
  ctx.fillText($('#subtitle').value,pad,y+th+sub*.35);ctx.globalAlpha=1;
  ctx.fillStyle=t.accent;rr(pad,y+th+sub*1.65,Math.min(maxW*.22,220),Math.max(7,size*.1),99);ctx.fill();
  return th+sub*2.5;
}

function renderBeautify(w,h,t){
  const unit=Math.min(w,h)/1080;
  const pad=Number($('#padding').value)*unit,radius=Number($('#radius').value)*unit,shadow=Number($('#shadow').value);
  const th=titleArea(w,h,t,pad),top=pad+th,aw=w-pad*2,ah=h-top-pad;
  drawScreenshotBox(image,pad,top,aw,ah,radius,shadow,'ShotCat Preview');
}

function render(){
  const p=PRESETS[currentPreset],t=THEMES[currentTheme];
  canvas.width=p.w;canvas.height=p.h;
  $('#stageSize').textContent=`${p.w} × ${p.h}`;
  drawBackground(p.w,p.h,t);
  if(!image)return;
  currentMode==='promo'?renderPromo(p.w,p.h,t):renderBeautify(p.w,p.h,t);
}

async function choosePrimary(){
  try{
    const r=await window.shotcat.chooseImage();if(!r)return;
    const img=new Image();
    img.onload=()=>{
      image=img;sourcePath=r.path;$('#sourceName').textContent=r.name;
      $('#empty').hidden=true;$('#exportBtn').disabled=false;render();
    };
    img.src=r.dataUrl;
  }catch(e){toast(e.message||'读取图片失败')}
}

async function chooseCompare(){
  try{
    const r=await window.shotcat.chooseImage();if(!r)return;
    const img=new Image();
    img.onload=()=>{
      compareImage=img;compareSourcePath=r.path;$('#compareName').textContent=r.name;
      render();toast('第二张截图已加入');
    };
    img.src=r.dataUrl;
  }catch(e){toast(e.message||'读取第二张截图失败')}
}

function activatePreset(id){
  currentPreset=id;
  document.querySelectorAll('[data-preset]').forEach(x=>x.classList.toggle('active',x.dataset.preset===id));
}

function activateTheme(id){
  currentTheme=id;
  document.querySelectorAll('[data-theme]').forEach(x=>x.classList.toggle('active',x.dataset.theme===id));
}

function applyTemplate(id){
  const t=TEMPLATES[id];if(!t)return;
  currentTemplate=id;currentMode='promo';
  activatePreset(t.preset);activateTheme(t.theme);

  $('#productName').value=t.product;
  $('#kicker').value=t.kicker;
  $('#promoTitle').value=t.title;
  $('#promoSubtitle').value=t.subtitle;
  $('#chip1').value=t.chips[0];
  $('#chip2').value=t.chips[1];
  $('#chip3').value=t.chips[2];
  $('#badgeText').value=t.badge;

  document.querySelectorAll('[data-template]').forEach(x=>x.classList.toggle('active',x.dataset.template===id));
  $('#compareTools').classList.toggle('hidden',id!=='compare');
  syncMode();
  toast('已套用「'+document.querySelector('[data-template="'+id+'"] strong').textContent+'」');
}

function syncMode(){
  const promo=currentMode==='promo';
  $('#promoCard').classList.toggle('hidden',!promo);
  $('#templateCard').classList.toggle('hidden',!promo);
  $('#beautifyCard').classList.toggle('hidden',promo);
  $('#previewMode').textContent=promo?'宣传图实时预览':'自由美化实时预览';
  document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===currentMode));
  if(promo)$('#compareTools').classList.toggle('hidden',currentTemplate!=='compare');
  render();
}

$('#chooseBtn').addEventListener('click',choosePrimary);
$('#emptyChooseBtn').addEventListener('click',choosePrimary);
$('#chooseCompareBtn').addEventListener('click',chooseCompare);

$('#modeSwitch').addEventListener('click',e=>{
  const b=e.target.closest('[data-mode]');if(!b)return;
  currentMode=b.dataset.mode;syncMode();
});

$('#templateGrid').addEventListener('click',e=>{
  const b=e.target.closest('[data-template]');if(!b)return;
  applyTemplate(b.dataset.template);
});

document.querySelector('.presets').addEventListener('click',e=>{
  const b=e.target.closest('[data-preset]');if(!b)return;
  activatePreset(b.dataset.preset);render();
});

document.querySelector('.themes').addEventListener('click',e=>{
  const b=e.target.closest('[data-theme]');if(!b)return;
  activateTheme(b.dataset.theme);render();
});

['productName','kicker','promoTitle','promoSubtitle','chip1','chip2','chip3','badgeText','showBrand','mainTitle','subtitle','showTitle','windowFrame','padding','radius','shadow','scale'].forEach(id=>{
  $('#'+id).addEventListener('input',()=>{
    $('#paddingValue').textContent=$('#padding').value;
    $('#radiusValue').textContent=$('#radius').value;
    $('#shadowValue').textContent=$('#shadow').value;
    $('#scaleValue').textContent=$('#scale').value+'%';
    render();
  });
});

$('#exportBtn').addEventListener('click',async()=>{
  if(!image||!sourcePath)return;
  render();
  try{
    const saved=await window.shotcat.savePng({
      dataUrl:canvas.toDataURL('image/png'),
      sourcePath,
      preset:currentPreset
    });
    if(saved){lastExport=saved;$('#openBtn').hidden=false;toast('海报导出成功 😼')}
  }catch(e){toast(e.message||'导出失败')}
});

$('#openBtn').addEventListener('click',()=>{if(lastExport)window.shotcat.revealFile(lastExport)});

applyTemplate('launch');
