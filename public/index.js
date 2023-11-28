let mediaFilepath = "";
const convertBtn = document.getElementById("convert");
const dropdownFileTypes = document.getElementById("optionsSelect");

let optionsMap = new Map();

let scale = 1;

const mediaContainerContainer = document.getElementById(
  "mediaContainerContainer"
);

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
        element.style.position = "absolute";
      }
      break;
    case "video":
      {
        element = document.createElement("video");
        element.id = "videoView";
        element.src = src;
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
    return;
  };

  mediaContainer.innerHTML = "";


  if (element instanceof HTMLImageElement) {
    element.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = element.naturalWidth;
      canvas.height = element.naturalHeight;
      canvas.id = 'canvas';

      const ctx = canvas.getContext('2d');
      ctx.drawImage(element, 0, 0);
      mediaContainer.appendChild(canvas);
      mediaContainer.style.width = `${element.naturalWidth}px`;
      mediaContainer.style.height = `${element.naturalHeight}px`;
      loadElementsAfterFileLoad(type, extension);
      convertBtn.classList.remove("d-none");
    };
  } else if (element instanceof HTMLVideoElement) {
    const testDiv = document.getElementById('testDiv');
    element.oncanplay = () => {
      if (controlsCreated) {
        deleteVideoControls(testDiv);
      }
      mediaContainer.appendChild(element);
      mediaContainer.style.width = `${element.videoWidth}px`;
      mediaContainer.style.height = `${element.videoHeight}px`;
      loadElementsAfterFileLoad(type, extension);
      convertBtn.classList.remove("d-none");
      createVideoControls(testDiv, element);
    };
  } else if (element instanceof HTMLAudioElement) {
  }

  convertBtn.onclick = () => {
    convertMedia(filepath, extension);
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

/* ------------------------------------------------- */

let aspectRatioMaintained = true;
let cropping = false;

function renderDefaultVisualFfmpegOptions(width, height, media, container) {
  optionsMap.clear();
  const mediaContainer = media.parentNode;
  const aspectRatio = width / height;

  const widthInput = createLabeledInput({
    type: "number",
    id: "mediaWidthInput",
    value: width,
    label: "Width",
    callback: {
      eventType: "input",
      callbackFunc: (event) => {
        resizeMediaAndContainer({
          width: event.target.value,
          media: media,
          mediaContainer: mediaContainer,
          maintainAspectRatio: aspectRatioMaintained,
          aspectRatio: aspectRatio,
        })
      }
    }
  });
  optionsMap.set('widthInput', widthInput);

  const heightInput = createLabeledInput({
    type: "number",
    id: "mediaHeightInput",
    value: height,
    label: "Height",
    callback: {
      eventType: "input",
      callbackFunc: (event) => {
        resizeMediaAndContainer({
          height: event.target.value,
          media: media,
          mediaContainer: mediaContainer,
          maintainAspectRatio: aspectRatioMaintained,
          aspectRatio: aspectRatio,
        })
      }
    }
  });
  optionsMap.set('heightInput', heightInput);

  const flipXInput = createLabeledInput({
    type: "checkbox",
    id: "flipX",
    value: false,
    label: "Flip X axis?",
    callback: {
      eventType: "change",
      callbackFunc: (event) => {
        const flipX = event.target.checked ? -1 : 1;
        const flipY = document.getElementById('flipY').checked ? -1 : 1;
        media.style.transform = `scaleX(${flipX}) scaleY(${flipY})`;
      },
    },
  });
  optionsMap.set('flipXInput', flipXInput);

  const flipYInput = createLabeledInput({
    type: "checkbox",
    id: "flipY",
    value: false,
    label: "Flip Y axis?",
    callback: {
      eventType: "change",
      callbackFunc: (event) => {
        const flipY = event.target.checked ? -1 : 1;
        const flipX = document.getElementById('flipX').checked ? -1 : 1;
        media.style.transform = `scaleX(${flipX}) scaleY(${flipY})`;
      }
    }
  });
  optionsMap.set('flipYInput', flipYInput);

  const aspectRatioInput = createLabeledInput({
    type: "checkbox",
    id: "aspectRatioMaintained",
    value: true,
    label: "Maintain Aspect Ratio?",
    callback: {
      eventType: "change",
      callbackFunc: () => {
        aspectRatioMaintained = !aspectRatioMaintained;
        if (aspectRatioMaintained) {
          resizeMediaAndContainer({
            width: document.getElementById('mediaWidthInput').value,
            media: media,
            mediaContainer: mediaContainer,
            maintainAspectRatio: aspectRatioMaintained,
            aspectRatio: aspectRatio,
          })
        }
      }
    }
  });
  optionsMap.set('aspectRatio', aspectRatioInput);

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
    callback: {
      eventType: "change",
      callbackFunc: (e) => {
        cropping = e.target.checked;
      }
    }
  });
  optionsMap.set('croppingInput', croppingInput);

  const croppingWidthInput = createLabeledInput({
    type: "text",
    id: "cropWidth",
    value: "0",
    label: "Crop Width",
    callback: {
      eventType: "input",
      callbackFunc: (e) => {
        cropMedia({
          media: media,
          width: e.target.value
        });
      }
    }
  });
  optionsMap.set('croppingWidth', croppingWidthInput);

  const croppingHeightInput = createLabeledInput({
    type: "text",
    id: "cropHeight",
    value: "0",
    label: "Crop Height",
  });
  optionsMap.set('croppingHeight', croppingHeightInput);

  const cropOffsetXInput = createLabeledInput({
    type: "text",
    id: "cropOffsetX",
    value: "0",
    label: "X Offset",
  });
  optionsMap.set('cropOffsetX', cropOffsetXInput);

  const cropOffsetYInput = createLabeledInput({
    type: "text",
    id: "cropOffsetY",
    value: "0",
    label: "Y Offset",
  });
  optionsMap.set('cropOffsetY', cropOffsetYInput);

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

function loadImageFfmpegOptions() {
  const loadedFfmpegOptions = document.getElementById("loadedFfmpegOptions");
  const image = document.getElementById("canvas");
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
    value: 75,
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

let controlsCreated = false;
let currentVideoTimeInSeconds = 0;
let videoWasPlayingOnChange = false;

function createVideoControls(container, video) {
  if (controlsCreated) {
    return;
  }

  video.addEventListener("timeupdate", function () {
    currentVideoTimeInSeconds = video.currentTime;
    playbackSlider.value = currentVideoTimeInSeconds;
    convertSliderValToVideoTime(playbackSlider.value, playbackTimeMarker);
    updateSlider(playbackSlider, "#ad3a48", "gray");
  });

  const videoDuration = video.duration;

  const videoControlsContainer = document.createElement("div");
  videoControlsContainer.id = "videoControlsContainer"
  videoControlsContainer.className = "video-controls-container";

  const playbackTimeAdjustmentContainer = createElement({
    element: "div",
    className: "playback-time-adjustment-container",
  });

  const playbackTimeMarker = createElement({
    element: "p",
    id: "playbackTimeMarker",
    innerHTML: "00:00:00",
  });

  const playbackSlider = createElement({
    element: "input",
    type: "range",
    id: "playbackSlider",
    min: 0,
    max: videoDuration,
    value: 0,
    callbacks: [
      {
        eventType: "input",
        callbackFunc: (event) => {
          videoWasPlayingOnChange = !video.paused;
          video.pause();
          convertSliderValToVideoTime(
            parseInt(event.target.value),
            playbackTimeMarker
          );
          updateSlider(playbackSlider, "#ad3a48", "gray");
          toggleButtonText(video, playButton);
        },
      },
      {
        eventType: "change",
        callbackFunc: (event) => {
          video.currentTime = parseInt(event.target.value);
          if (videoWasPlayingOnChange) {
            video.play();
          }
          videoWasPlayingOnChange = false; // Reset the boolean
          toggleButtonText(video, playButton);
        },
      },
    ],
  });

  updateSlider(playbackSlider, "#ad3a48", "gray");

  playbackTimeAdjustmentContainer.appendChild(playbackSlider);
  playbackTimeAdjustmentContainer.appendChild(playbackTimeMarker);

  const videoControls = createElement({
    element: "div",
    className: "video-controls",
  });

  const holderDiv = createElement({
    element: "div",
    styles: [{ display: "flex" }, { alignItems: "center" }, { gap: "8px" }],
  });

  const prevSecBtn = createElement({
    element: "button",
    className: "video-control-button",
    innerHTML: "<< Sec",
    callbacks: [
      {
        eventType: "click",
        callbackFunc: (event) => {
          prevSec(video);
          playbackSlider.value -= 1;
          updateSlider(playbackSlider, "#ad3a48", "gray");
          convertSliderValToVideoTime(playbackSlider.value, playbackTimeMarker);
          toggleButtonText(video, playButton);
        },
      },
    ],
  });

  const audioSlider = createElement({
    element: "input",
    type: "range",
    id: "audioSlider",
    min: 0,
    max: 100,
    value: 75,
    callbacks: [
      {
        eventType: "input",
        callbackFunc: (event) => {
          video.volume = event.target.value / 100;
          updateSlider(event.target, "#ad3a48", "gray");
        },
      },
    ],
  });

  updateSlider(audioSlider, "#ad3a48", "gray");

  const playButton = createElement({
    element: "button",
    className: "video-control-button",
    id: "playButton",
    innerHTML: "Play",
    callbacks: [
      {
        eventType: "click",
        callbackFunc: (event) => {
          toggleVideoFromSelectedSecond(video, event.target);
        },
      },
    ],
  });

  const nextSecBtn = createElement({
    element: "button",
    className: "video-control-button",
    innerHTML: ">> Sec",
    callbacks: [
      {
        eventType: "click",
        callbackFunc: (event) => {
          nextSec(video);
          playbackSlider.value += 1;
          updateSlider(playbackSlider, "#ad3a48", "gray");
          convertSliderValToVideoTime(playbackSlider.value, playbackTimeMarker);
          toggleButtonText(video, playButton);
        }
      }
    ]
  });

  holderDiv.appendChild(prevSecBtn);
  holderDiv.appendChild(audioSlider);

  videoControls.appendChild(holderDiv);
  videoControls.appendChild(playButton);
  videoControls.appendChild(nextSecBtn);

  videoControlsContainer.appendChild(playbackTimeAdjustmentContainer);
  videoControlsContainer.appendChild(videoControls);

  container.appendChild(videoControlsContainer);

  controlsCreated = true;
}

function deleteVideoControls(container) {
  const videoControls = document.getElementById('videoControlsContainer');
  container.removeChild(videoControls);
  controlsCreated = false;
  currentVideoTimeInSeconds = 0;
}

function prevSec(video) {
  video.pause();
  video.currentTime -= 1;
  currentVideoTimeInSeconds -= 1;
}

function nextSec(video) {
  video.pause();
  video.currentTime += 1;
  currentVideoTimeInSeconds += 1;
}

function convertSliderValToVideoTime(valInSeconds, elementToDisplayTime) {
  let videoSecondsIn = valInSeconds % 60;
  let videoMinutesIn = Math.floor((valInSeconds / 60) % 60);
  let videoHoursIn = Math.floor(valInSeconds / (60 * 60));

  let displayedSecondsIn =
    videoSecondsIn < 10 ? `0${videoSecondsIn}` : `${videoSecondsIn}`;
  let displayedMinutesIn =
    videoMinutesIn < 10 ? `0${videoMinutesIn}` : `${videoMinutesIn}`;
  let displayedHoursIn =
    videoHoursIn < 10 ? `0${videoHoursIn}` : `${videoHoursIn}`;

  let displayedHhMmSs = `${displayedHoursIn}:${displayedMinutesIn}:${displayedSecondsIn}`;

  elementToDisplayTime.innerHTML = displayedHhMmSs;
}

function toggleVideoFromSelectedSecond(video, button) {
  if (video.paused) {
    video.play();
    toggleButtonText(video, button);
  } else {
    video.pause();
    toggleButtonText(video, button);
  }
}

function toggleButtonText(video, button) {
  if (video.paused) {
    button.innerHTML = "Play";
  } else {
    button.innerHTML = "Pause";
  }
}

function updateSlider(track, color1, color2) {
  let value = ((track.value - track.min) / (track.max - track.min)) * 100;
  let gradientStyle = `linear-gradient(to right, ${color1} ${value}%, ${color2} ${value}%)`;

  track.style.background = gradientStyle;
}

function resizeMediaAndContainer(details) {
  const media = details.media;
  const mediaContainer = details.mediaContainer;
  const widthInput = document.getElementById('mediaWidthInput');
  const heightInput = document.getElementById('mediaHeightInput');
  const aspectRatio = details.aspectRatio;

  console.log(details.width);

  if (details.maintainAspectRatio) {
    if (details.width !== undefined) {
      media.style.width = `${details.width}px`;
      mediaContainer.style.width = `${details.width}px`;

      const newHeight = calcOtherDimWithRatio(parseInt(details.width), aspectRatio, true);
      media.style.height = `${newHeight}px`;
      mediaContainer.style.height = `${newHeight}px`;
      heightInput.value = newHeight;
    }

    if (details.height !== undefined) {
      media.style.height = `${details.height}px`;
      mediaContainer.style.height = `${details.height}px`;

      const newWidth = calcOtherDimWithRatio(parseInt(details.height), aspectRatio, false);
      media.style.width = `${newWidth}px`;
      mediaContainer.style.width = `${newWidth}px`;
      widthInput.value = newWidth;
    }
  } else {
    if (details.width !== undefined) {
      media.style.width = `${details.width}px`;
      mediaContainer.style.width = `${details.width}px`;
    }

    if (details.height !== undefined) {
      media.style.height = `${details.height}px`;
      mediaContainer.style.height = `${details.height}px`;
    }
  }
}

function cropMedia(details) {
  const media = details.media;

  if (details.width !== undefined) {
    console.log(media);
    const width = details.width;
    media.style.width = width;
  }

  if (details.height !== undefined) {
    media.style.height = details.height;
  }

  if (details.offX !== undefined) {
    media.style.left = `${details.offX}px`;
  }

  if (details.offY !== undefined) {
    media.style.top = `${details.offY}px`;
  }
}

function convertMedia(filepath, extension) {
  const type = determineMediaType(extension);


  switch (type) {
    case "image": {
      const widthInput = optionsMap.get('widthInput').querySelector('input');
      const heightInput = optionsMap.get('heightInput').querySelector('input');
      const flipXInput = optionsMap.get('flipXInput').querySelector('input[type="checkbox"]');
      console.log(flipXInput);
      const flipYInput = optionsMap.get('flipYInput').querySelector('input[type="checkbox"]');
      const aspectRatio = optionsMap.get('aspectRatio').querySelector('input');
      const croppingInput = optionsMap.get('croppingInput').querySelector('input[type="checkbox"]');
      const croppingWidthInput = optionsMap.get('croppingWidth').querySelector('input');
      const croppingHeightInput = optionsMap.get('croppingHeight').querySelector('input');
      const cropOffsetXInput = optionsMap.get('cropOffsetX').querySelector('input');
      const cropOffsetYInput = optionsMap.get('cropOffsetY').querySelector('input');

      api.convertFile(filepath, {
        extension: extension,
        newExtension: dropdownFileTypes.value || null,
        width: widthInput.value || null,
        height: heightInput.value || null,
        flipX: flipXInput.checked,
        flipY: flipYInput.checked,
        aspectRatioMaintained: aspectRatio.checked || null,
        cropping: croppingInput.checked,
        croppingWidth: croppingWidthInput.value || null,
        croppingHeight: croppingHeightInput.value || null,
        cropOffsetX: cropOffsetXInput.value || null,
        cropOffsetY: cropOffsetYInput.value || null,
      });
    }
  }
}