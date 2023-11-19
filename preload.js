const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadFile: () => ipcRenderer.invoke('loadFile'),
  onFileDragged: (filePath) => ipcRenderer.invoke('file-dragged', filePath),
  onFileLoaded: (callback) => ipcRenderer.on('file-loaded', callback),
});