const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ipcMain.handle("loadFile", async () => {
    return loadFile();
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

async function loadFile() {
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
  fs.readFile(filepath, (err, data) => {
    if (err) {
      console.error("Failed to read file", err);
      return;
    }

    const extension = filepath.split(".");
    const fileExtension = extension[extension.length - 1];

    let mimeType;
    switch (fileExtension) {
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        mimeType = `image/${fileExtension}`;
        break;
      case "mp4":
      case "mkv":
      case "avi":
      case "webm":
      case "ogv":
        mimeType = `video/${fileExtension}`;
        break;
      case "mp3":
      case "wav":
      case "aac":
        mimeType = `audio/${fileExtension}`;
      default:
        mimeType = "application/octet-stream"; // Default or unknown file type
    }

    window.webContents.send('file-loaded', `data:${mimeType};base64,${data.toString('base64')}`);
  });
}
