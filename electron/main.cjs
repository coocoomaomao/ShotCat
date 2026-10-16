const {app,BrowserWindow,dialog,ipcMain,shell}=require('electron');
const path=require('path'),fs=require('fs'),core=require('./shotcat-core.cjs');

function createWindow(){
  const w=new BrowserWindow({
    title:'ShotCat 截图上镜猫',width:1320,height:900,minWidth:1050,minHeight:720,
    backgroundColor:'#f6f2e9',icon:path.join(__dirname,'..','build','icon.ico'),autoHideMenuBar:true,show:false,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}
  });
  w.loadFile(path.join(__dirname,'..','index.html'));w.once('ready-to-show',()=>w.show());
  w.webContents.setWindowOpenHandler(({url})=>{if(/^https?:/i.test(url))shell.openExternal(url);return{action:'deny'}});
}

ipcMain.handle('shotcat:choose-image',async()=>{
  const r=await dialog.showOpenDialog({
    title:'选择要美化的截图',
    properties:['openFile'],
    filters:[{name:'截图',extensions:['png','jpg','jpeg','webp']}]
  });
  if(r.canceled||!r.filePaths[0])return null;
  const p=r.filePaths[0];
  if(!core.isSupported(p))throw new Error('暂不支持这个图片格式');
  const ext=path.extname(p).toLowerCase(),mime=ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg';
  return{path:p,name:path.basename(p),dataUrl:`data:${mime};base64,${fs.readFileSync(p).toString('base64')}`};
});

ipcMain.handle('shotcat:save-png',async(_e,p)=>{
  if(!p?.dataUrl||!p?.sourcePath)throw new Error('没有可导出的图片');
  const r=await dialog.showSaveDialog({
    title:'导出 ShotCat 图片',
    defaultPath:path.join(path.dirname(p.sourcePath),core.exportName(p.sourcePath,p.preset)),
    filters:[{name:'PNG 图片',extensions:['png']}]
  });
  if(r.canceled||!r.filePath)return null;
  fs.writeFileSync(r.filePath,Buffer.from(String(p.dataUrl).replace(/^data:image\/png;base64,/,''),'base64'));
  return r.filePath;
});

ipcMain.handle('shotcat:reveal-file',async(_e,p)=>{shell.showItemInFolder(p);return true});

const lock=app.requestSingleInstanceLock();
if(!lock)app.quit();
else{
  app.on('second-instance',()=>{const w=BrowserWindow.getAllWindows()[0];if(w){if(w.isMinimized())w.restore();w.focus()}});
  app.whenReady().then(()=>{app.setAppUserModelId('com.meowbuild.shotcat');createWindow();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow()})});
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
}
