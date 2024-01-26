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

let isMouseDown = false;
let startX, startY, scrollLeft, scrollY;

mediaContainerContainer.addEventListener("mousedown", (e) => {
  if (hasParentWithClass(e.target, "video-controls-container")) {
    // If the click is on the video controls, don't initiate drag-to-scroll
    return;
  }

  isMouseDown = true;
  startX = e.pageX - mediaContainerContainer.offsetLeft;
  startY = e.pageY - mediaContainerContainer.offsetTop;
  scrollLeft = mediaContainerContainer.scrollLeft;
  scrollTop = mediaContainerContainer.scrollTop;
});

mediaContainerContainer.addEventListener("mouseup", () => {
  isMouseDown = false;
});

mediaContainerContainer.addEventListener("mousemove", (e) => {
  if (!isMouseDown) return;

  const scrollSpeed = 2;

  // e.preventDefault();
  const x = e.pageX - mediaContainerContainer.offsetLeft;
  const y = e.pageY - mediaContainerContainer.offsetTop;
  const walkX = (x - startX) * scrollSpeed;
  const walkY = (y - startY) * scrollSpeed;
  mediaContainerContainer.scrollLeft = scrollLeft - walkX;
  mediaContainerContainer.scrollTop = scrollTop - walkY;
});

mediaContainer.addEventListener("mousedown", (e) => {
  e.preventDefault();
});

mediaContainerContainer.addEventListener("wheel", function (event) {
  if (event.ctrlKey) {
    event.preventDefault;

    const delta = event.deltaY;

    const zoomSpeed = 0.05;

    if (delta < 0) {
      scale += zoomSpeed;
    } else {
      scale -= zoomSpeed;
    }

    // Set the new scale, with limits if needed
    scale = Math.min(Math.max(0.125, scale), 1.5); // Limits scale between 0.125 and 4

    // Apply the scale transformation
    document.getElementById("testDiv").style.transform = `scale(${scale})`;
  }
});

function calcOtherDimWithRatio(
  newDimension,
  aspectRatio,
  isCalculatedValueHeight
) {
  if (isCalculatedValueHeight) {
    // Calculate the new height based on the new width
    return Math.round(newDimension / aspectRatio);
  } else {
    // Calculate the new width based on the new height
    return Math.round(newDimension * aspectRatio);
  }
}

function hasParentWithClass(element, classname) {
  if (element.classList && element.classList.contains(classname)) {
    return true;
  }
  return (
    element.parentNode && hasParentWithClass(element.parentNode, classname)
  );
}

function getSupportedCodecs(ext) {
  const supportedCodecs = [];

  switch (ext) {
    case "mp4":
      {
        supportedCodecs.push("AAC");
        supportedCodecs.push("MP3");
        supportedCodecs.push("ALAC");
      }
      break;
    case "avi":
      {
        supportedCodecs.push("MP3");
        supportedCodecs.push("AC3");
        supportedCodecs.push("AAC");
        supportedCodecs.push("DTS");
        supportedCodecs.push("VORBIS");
      }
      break;
    case "webm":
      {
        supportedCodecs.push("VORBIS");
        supportedCodecs.push("OPUS");
      }
      break;
    case "mkv": {
      supportedCodecs.push("MP3");
      supportedCodecs.push("AAC");
      supportedCodecs.push("AC3");
      supportedCodecs.push("DTS");
      supportedCodecs.push("FLAC");
      supportedCodecs.push("ALAC");
      supportedCodecs.push("TrueHD");
    }
    case "ogv":
      {
        supportedCodecs.push("VORBIS");
        supportedCodecs.push("OGG");
        supportedCodecs.push("OPUS");
        supportedCodecs.push("FLAC");
      }
      break;
  }

  return supportedCodecs;
}
