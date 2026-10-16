const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('shotcat',{
  chooseImage:()=>ipcRenderer.invoke('shotcat:choose-image'),
  savePng:p=>ipcRenderer.invoke('shotcat:save-png',p),
  revealFile:p=>ipcRenderer.invoke('shotcat:reveal-file',p)
});
