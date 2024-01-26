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
  convertImage: (filepath, args) => {
    return ipcRenderer.invoke('convertImage', filepath, args);
  },
  convertVideo: (filepath, args) => {
    return ipcRenderer.invoke('convertVideo', filepath, args);
  }
});
