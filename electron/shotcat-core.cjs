const path=require('path');
const SUPPORTED=new Set(['.png','.jpg','.jpeg','.webp']);
const PRESETS={
  xhs34:{width:1080,height:1440,label:'小红书 3:4'},
  square:{width:1080,height:1080,label:'方图 1:1'},
  video169:{width:1920,height:1080,label:'横版 16:9'},
  story916:{width:1080,height:1920,label:'竖版 9:16'},
  readme:{width:1600,height:900,label:'README 16:9'}
};
function isSupported(p){return SUPPORTED.has(path.extname(p).toLowerCase())}
function safeBaseName(p){return path.basename(p,path.extname(p)).replace(/[<>:"/\\|?*\x00-\x1F]/g,'_').slice(0,100)||'ShotCat'}
function getPreset(id){return PRESETS[id]||PRESETS.xhs34}
function exportName(p,id='xhs34'){const x=getPreset(id);return `${safeBaseName(p)}_ShotCat_${x.width}x${x.height}.png`}
module.exports={SUPPORTED,PRESETS,isSupported,safeBaseName,getPreset,exportName};
