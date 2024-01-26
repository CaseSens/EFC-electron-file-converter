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

  ipcMain.handle("convertImage", async (event, filepath, options) => {
    try {
      if (!filepath || filepath.length === 0) throw new Error("Error in filepath, not received or empty");
      if (!options) throw new Error("Error in media options, not found");

      const convertedFfmpegOptions = convertFfmpegImageOptions(options);

      const result = await convertMedia(filepath, options, convertedFfmpegOptions);
      console.log("result", result);
      return result;
    } catch (err) {
      console.error("Error in file conversion", err);
      throw err;
    }
  });

  ipcMain.handle("convertVideo", async (event, filepath, options) => {
    try {
      if (!filepath || filepath.length === 0) throw new Error("Error in filepath, not received or empty");
      if (!options) throw new Error("Error in media options, not found");

      const convertedFfmpegOptions = convertFfmpegVideoOptions(options);

      const result = await convertMedia(filepath, options, convertedFfmpegOptions);
      console.log("result", result);
      return result;
    } catch (err) {
      console.error("Error in file conversion", err);
      throw err;
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

async function convertMedia(filepath, options, convertedFfmpegOptions) {
  const parentPath = path.dirname(filepath);
  let newNameWithNewExtension = filepath.split(".")[0].split("\\").pop();
  newNameWithNewExtension += `.${options.newExtension}`;
  const outputPath = path.join(parentPath, newNameWithNewExtension);

  console.log('finalized ffmpeg command:', ("ffmpeg -i " + filepath + " " + convertedFfmpegOptions + " -y " + outputPath));

  return new Promise((resolve, reject) => {
    ffmpeg.ffmpeg(filepath, [
      convertedFfmpegOptions
    ], outputPath, function(progress) {
      console.log(progress);
    }).success(function (json) {
      console.log(json);
      resolve(json);
    }).error(function (error) {
      console.error('conversion error:', error);
      reject(new Error("FFMPEG conversion failed: " + error.message));
    })
  });
}

function convertFfmpegImageOptions(options) {
  let ffmpegOptions = "-vf ";

  // Optionals
  const width = options.width || null;
  const height = options.height || null;
  const flipX = options.flipX || null;
  const flipY = options.flipY || null;
  const aspectRatioMaintained = options.aspectRatioMaintained || null;
  const cropping = options.cropping || null;
  const cropWidth = options.croppingWidth || null;
  const cropHeight = options.croppingHeight || null;
  const cropOffsetX = options.cropOffsetX || null;
  const cropOffsetY = options.cropOffsetY || null;
  
  console.log('options:', options);

  if (width && height) {
    ffmpegOptions = addCommaIfNecessary(ffmpegOptions, "-vf ");
    ffmpegOptions += `scale=${width}:${height}`;
  } 

  if (flipX === true){
    ffmpegOptions = addCommaIfNecessary(ffmpegOptions, "-vf ");
    ffmpegOptions += `hflip`;
  }

  if (flipY === true){
    ffmpegOptions = addCommaIfNecessary(ffmpegOptions, "-vf ");
    ffmpegOptions += `vflip`;
  }

  if (cropping === true) {
    if (cropWidth && cropHeight && cropOffsetX && cropOffsetY) {
      addCommaIfNecessary(ffmpegOptions, "-vf ");
      ffmpegOptions += `crop=${cropWidth}:${cropHeight}:${cropOffsetX}:${cropOffsetY}`;
    }
  }

  return ffmpegOptions;
}

function convertFfmpegVideoOptions(options) {
  let ffmpegOptions = "-vf ";

  // Optionals
  const width = options.width || null;
  const height = options.height || null;
  const flipX = options.flipX || null;
  const flipY = options.flipY || null;
  const aspectRatioMaintained = options.aspectRatioMaintained || null;
  const cropping = options.cropping || null;
  const cropWidth = options.croppingWidth || null;
  const cropHeight = options.croppingHeight || null;
  const cropOffsetX = options.cropOffsetX || null;
  const cropOffsetY = options.cropOffsetY || null;
  const volume = options.volume;
  const removeAudio = options.removeAudio;
  const audioFormat = options.audioFormat;

  console.log('options:', options);

  if (width && height) {
    ffmpegOptions = addCommaIfNecessary(ffmpegOptions, "-vf ");
    ffmpegOptions += `scale=${width}:${height}`;
  } 

  if (flipX === true){
    ffmpegOptions = addCommaIfNecessary(ffmpegOptions, "-vf ");
    ffmpegOptions += `hflip`;
  }

  if (flipY === true){
    ffmpegOptions = addCommaIfNecessary(ffmpegOptions, "-vf ");
    ffmpegOptions += `vflip`;
  }

  if (cropping === true) {
    if (cropWidth && cropHeight && cropOffsetX && cropOffsetY) {
      addCommaIfNecessary(ffmpegOptions, "-vf ");
      ffmpegOptions += `crop=${cropWidth}:${cropHeight}:${cropOffsetX}:${cropOffsetY}`;
    }
  }

  // Audio
  if (removeAudio !== true) {
    ffmpegOptions += ` -af volume=${volume}`;
    const audioCodec = determineAudioCodec(audioFormat);
    ffmpegOptions += ` -c:a ${audioCodec} -q:a 2`;

  } else {
    ffmpegOptions += ` -an`;
  }


  return ffmpegOptions;
}

/**
 * Adds "," if string doesn't end with target
 */
function addCommaIfNecessary(str, target) {
  if (!str.endsWith(target)) {
    return str + ",";
  }
  return str;
}

function determineAudioCodec(audioFormat) {
  switch (audioFormat) {
    case "MP3": return "libmp3lame"
    case "WAV": return "pcm_s16le"
    case "AAC": return "aac"
    case "FLAC": return "flac"
    case "OGG": return "libvorbis"
    case "AC3": return "ac3"
    case "WMA": return "wmav2"
    case "DTS": return "dts"
    case "TrueHD": return "truehd"
    case "ALAC": return "alac"
    case "VORBIS": return "libvorbis"
    case "OPUS": return "libopus"
    default: return "libmp3lame"
  }
}