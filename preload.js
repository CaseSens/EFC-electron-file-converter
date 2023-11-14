const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadFile: () => ipcRenderer.invoke('loadFile'),
  onFileLoaded: (callback) => ipcRenderer.on('file-loaded', callback),
});