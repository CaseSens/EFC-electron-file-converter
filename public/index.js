let mediaFilepath = "";
const convertBtn = document.getElementById("convert");

document.addEventListener("DOMContentLoaded", () => {
  const btnLoadFile = document.getElementById("loadFile");
  const mediaContainer = document.getElementById("mediaContainer");

  const api = window.electronAPI;

  btnLoadFile.onclick = async () => {
    await api.loadFile();
  };

  mediaContainer.addEventListener("dragover", (event) => {
    event.preventDefault();
    mediaContainer.classList.add("dragover");
  });

  mediaContainer.addEventListener("dragleave", () => {
    mediaContainer.classList.remove("dragover");
  });

  mediaContainer.addEventListener("drop", async (event) => {
    event.preventDefault();
    mediaContainer.classList.replace(
      "mediaContainerEmpty",
      "mediaContainerLoaded"
    );
    mediaContainer.classList.remove("dragover");

    const file = event.dataTransfer.files[0];
    if (file) {
      const filepath = file.path;
      await api.loadFile(filepath);
    }
  });

  api.onFileLoaded((event, filepath) => {
    console.log("File path received", filepath);
    mediaFilepath = filepath;
    const fileExtension = filepath.split(".").pop();
    displayMedia(filepath, fileExtension);
  });
});

function displayMedia(filepath, extension) {
  const type = determineMediaType(extension);
  const src = `file://${filepath}`;

  let element;
  switch (type) {
    case "image":
      {
        element = new Image();
        element.id = "imageView";
        element.src = src;
      }
      break;
    case "video":
      {
        element = document.createElement("video");
        element.id = "videoView";
        element.src = src;
        element.controls = true;
        element.volume = 0.7;
      }
      break;
    case "audio":
      {
        element = document.createElement("audio");
        element.id = "audioView";
        element.src = src;
        element.controls = true;
      }
      break;
    default:
      {
        console.log("fileType not supported", extension);
        element = document.createElement("h1");
        element.innerHTML = "file type not supported";
      }
      break;
  }

  element.onerror = (err) => {
    console.error(err);
  };

  if (element instanceof HTMLImageElement) {
    element.onload = () => {
      mediaContainer.innerHTML = "";
      mediaContainer.appendChild(element);
      loadElementsAfterFileLoad(type, extension);
      convertBtn.classList.remove("d-none");
    };
  } else if (element instanceof HTMLVideoElement) {
    element.oncanplay = () => {
      mediaContainer.innerHTML = "";
      mediaContainer.appendChild(element);
      loadElementsAfterFileLoad(type, extension);
      convertBtn.classList.remove("d-none");
      const mediaContainerContainer = document.getElementById(
        "mediaContainerContainer"
      );
    };
  } else if (element instanceof HTMLAudioElement) {
  }
}

function determineMediaType(extension) {
  switch (extension) {
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
      return "image";
    case "mp4":
    case "mkv":
    case "avi":
    case "webm":
    case "ogv":
      return "video";
    case "mp3":
    case "wav":
    case "aac":
      return "audio";
    default:
      return "unknown";
  }
}

function loadElementsAfterFileLoad(filetype, extension) {
  console.log(filetype);
  loadSelectMenu(filetype, extension);

  switch (filetype) {
    case "image":
      {
        loadImageFfmpegOptions();
      }
      break;
    case "video":
      {
        loadVideoFfmpegOptions();
      }
      break;
  }
}

function loadSelectMenu(filetype, extension) {
  const originalFileExtension = document.getElementById("ogFileType");
  originalFileExtension.innerHTML = extension;
  const loadedOptions = document.getElementById("loadedOptions");
  loadedOptions.classList.remove("d-none");
  const dropdownFileTypes = document.getElementById("optionsSelect");

  const imgPossibilities = ["png", "jpg", "jpeg", "gif"];
  const vidPossibilities = ["mp4", "mkv", "avi", "webm", "ogv"];
  const audioPossibilities = ["mp3", "wav", "aac"];

  let options = [];

  if (filetype === "image") {
    options.push(extension);
    imgPossibilities.forEach((type) => {
      if (type !== extension) {
        options.push(type);
      }
    });
  } else if (filetype === "video") {
    options.push(extension);
    vidPossibilities.forEach((type) => {
      if (type !== extension) {
        options.push(type);
      }
    });
  } else if (filetype === "audio") {
    options.push(extension);
    audioPossibilities.forEach((type) => {
      if (type !== extension) {
        options.push(type);
      }
    });
  }

  dropdownFileTypes.innerHTML = "";

  options.forEach((option) => {
    const newOption = document.createElement("option");
    newOption.innerHTML = option;
    dropdownFileTypes.appendChild(newOption);
  });
}

function loadImageFfmpegOptions() {
  const loadedFfmpegOptions = document.getElementById("loadedFfmpegOptions");
  const image = document.getElementById("imageView");
  const imageWidth = image.width;
  const imageHeight = image.height;

  loadedFfmpegOptions.innerHTML = "";

  renderDefaultVisualFfmpegOptions(
    imageWidth,
    imageHeight,
    image,
    loadedFfmpegOptions
  );
}

function loadVideoFfmpegOptions() {
  const loadedFfmpegOptions = document.getElementById("loadedFfmpegOptions");
  const video = document.getElementById("videoView");
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  loadedFfmpegOptions.innerHTML = "";

  renderDefaultVisualFfmpegOptions(
    videoWidth,
    videoHeight,
    video,
    loadedFfmpegOptions
  );

  const audioInput = createLabeledInput({
    type: "number",
    id: "videoAudio",
    value: 100,
    label: "Audio Volume",
    maximum: 100,
    minimum: 0,
  });

  createMenuOption({
    parentContainer: loadedFfmpegOptions,
    header: "Audio",
    children: [audioInput],
  });
}

function renderDefaultVisualFfmpegOptions(width, height, media, container) {
  const widthInput = createLabeledInput({
    type: "number",
    id: "imageWidthInput",
    value: width,
    label: "Width",
  });

  const heightInput = createLabeledInput({
    type: "number",
    id: "imageHeightInput",
    value: height,
    label: "Height",
  });

  const flipXInput = createLabeledInput({
    type: "checkbox",
    id: "flipX",
    value: false,
    label: "Flip X axis?",
    callback: {
      eventType: "change",
      callbackFunc: (event) => {
        if (event.target.checked) {
          media.style.transform = "scaleX(-1)";
        } else {
          media.style.transform = "scaleX(1)";
        }
      },
    },
  });

  const flipYInput = createLabeledInput({
    type: "checkbox",
    id: "flipY",
    value: false,
    label: "Flip Y axis?",
  });

  const aspectRatioInput = createLabeledInput({
    type: "checkbox",
    id: "aspectRatioMaintained",
    value: true,
    label: "Maintain Aspect Ratio?",
  });

  createMenuOption({
    parentContainer: container,
    header: "Scaling",
    children: [
      widthInput,
      heightInput,
      flipXInput,
      flipYInput,
      aspectRatioInput,
    ],
  });

  const croppingInput = createLabeledInput({
    type: "checkbox",
    id: "cropImage",
    value: false,
    label: "Crop Image?",
  });

  const croppingWidthInput = createLabeledInput({
    type: "text",
    id: "cropWidth",
    value: "0",
    label: "Crop Width",
  });

  const croppingHeightInput = createLabeledInput({
    type: "text",
    id: "cropHeight",
    value: "0",
    label: "Crop Height",
  });

  const cropOffsetXInput = createLabeledInput({
    type: "text",
    id: "cropOffsetX",
    value: "0",
    label: "X Offset",
  });

  const cropOffsetYInput = createLabeledInput({
    type: "text",
    id: "cropOffsetY",
    value: "0",
    label: "Y Offset",
  });

  createMenuOption({
    parentContainer: container,
    header: "Cropping",
    children: [
      croppingInput,
      croppingWidthInput,
      croppingHeightInput,
      cropOffsetXInput,
      cropOffsetYInput,
    ],
  });
}

function createMenuOption(details) {
  const parentContainer = details.parentContainer;
  const menuOptionContainer = document.createElement("div");
  const header = document.createElement("h1");
  header.innerHTML = details.header;
  header.className = "menuOptionHeader";
  menuOptionContainer.appendChild(header);

  details.children.forEach((child) => {
    menuOptionContainer.appendChild(child);
  });

  parentContainer.className = "menuOption";
  parentContainer.appendChild(menuOptionContainer);
}

function createLabeledInput(details) {
  const inputElement = document.createElement("input");

  inputElement.type = details.type;
  inputElement.id = details.id;

  if (details.type === "text" || details.type === "number") {
    inputElement.value = details.value;
  } else if (details.type === "checkbox") {
    inputElement.checked = details.value;
  }

  if (details.maximum !== undefined) {
    inputElement.max = details.maximum;

    inputElement.addEventListener("input", function () {
      const max = parseFloat(this.max);

      if (this.valueAsNumber > max) {
        this.value = max;
      }
    });
  }

  if (details.minimum !== undefined) {
    inputElement.min = details.minimum;

    inputElement.addEventListener("input", function () {
      const min = parseFloat(this.min);

      if (this.valueAsNumber < min) {
        this.value = min;
      }
    });
  }

  if (details.callback !== undefined) {
    console.log("event callback found for element", inputElement);
    const eventType = details.callback.eventType;
    const callbackFunc = details.callback.callbackFunc;
    inputElement.addEventListener(eventType, callbackFunc);
  }

  const labeledInput = document.createElement("div");
  const label = document.createElement("p");
  label.innerHTML = details.label;
  labeledInput.className = "labeledInput";
  labeledInput.appendChild(label);
  labeledInput.appendChild(inputElement);

  return labeledInput;
}

function createVideoControls(container) {
  const videoControls = document.createElement("div");
  videoControls.id = "videoControls";
  videoControls.className = "videoControls";

  const startOver = document.createElement('button');
  const playButton = document.createElement('button');
  const audioSlider = document.createElement('input');
}


document.getElementById("playbackSlider").oninput = function() {
  var value = (this.value-this.min)/(this.max-this.min)*100
  this.style.background = 'linear-gradient(to right, #ad3a48 0%, #ad3a48 ' + value + '%, #fff ' + value + '%, white 100%)'
};