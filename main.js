const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const ffmpeg = require('js-ffmpeg');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ipcMain.handle("loadFile", async (event, filepath) => {
    console.log(filepath);
    if (!filepath) {
      return openExplorerForResults();
    } else {
      const window = BrowserWindow.getFocusedWindow();
      window.webContents.send('file-loaded', filepath);
      return;
    }
  });

  win.loadFile("./public/index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

async function openExplorerForResults() {
  const window = BrowserWindow.getFocusedWindow();
  const filters = [
    { name: "Images", extensions: ["jpg", "png", "gif", "bmp"] },
    { name: "Videos", extensions: ["mkv", "avi", "mp4", "webm", "ogv"] },
    { name: "Audio", extensions: ["mp3", "wav", "aac"] },
  ];
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    title: "Select a file",
    properties: ["openFile"],
    filters: filters,
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const filepath = filePaths[0];
  window.webContents.send("file-loaded", filepath);
}
