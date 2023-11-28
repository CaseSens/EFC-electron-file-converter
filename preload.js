const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadFile: (filepath) => {
    if (filepath) {
      return ipcRenderer.invoke("loadFile", filepath);
    } else {
      return ipcRenderer.invoke("loadFile");
    }
  },
  onFileLoaded: (callback) => ipcRenderer.on("file-loaded", callback),
  convertFile: (filepath, args) => {
    return ipcRenderer.invoke('convertFile', filepath, args);
  }
});
