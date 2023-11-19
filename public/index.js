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
      const filePath = file.path;
      await api.onFileDragged(filePath);
    }
  });

  api.onFileLoaded((event, dataUrl) => {
    console.log("dataUrl received", dataUrl);
    mediaContainer.classList.replace(
      "mediaContainerEmpty",
      "mediaContainerLoaded"
    );
    mediaContainer.innerHTML = "";

    const mimeType = dataUrl.split(";")[0];
    const type = mimeType.split(":")[1].split("/")[0];
    const ext = mimeType.split("/")[1];

    console.log("ext received", ext);
    console.log("type received", type);

    let element;
    if (type === "image") {
      element = new Image();
      element.src = dataUrl;
    } else if (type === "video") {
      element = document.createElement("video");
      element.src = dataUrl;
      element.controls = true;
    } else if (type === "audio") {
      element = document.createElement("audio");
      element.src = dataUrl;
      element.controls = true;
    }

    if (element) {
      mediaContainer.appendChild(element);
      loadElementsAfterFileLoad(type, ext);
    }
  });
});

function loadElementsAfterFileLoad(fileType, extension) {
  const dropdownFileTypes = document.getElementById("dropFileType");
  const loadedOptions = document.getElementById('loadedOptions');
  loadedOptions.classList.remove('hidden');

  const imgPossibilities = ["png", "jpg", "jpeg", "gif"];
  const vidPossibilities = ["mp4", "mkv", "avi", "webm", "ogv"];
  const audioPossibilities = ["mp3", "wav", "aac"];

  let options = [];

  if (fileType === "image") {
    options.push(extension);
    imgPossibilities.forEach((type) => {
      if (type !== extension) {
        options.push(type);
      }
    });
  } else if (fileType === "video") {
    options.push(extension);
    vidPossibilities.forEach((type) => {
      if (type !== extension) {
        options.push(type);
      }
    });
  } else if (fileType === "audio") {
    options.push(extension);
    audioPossibilities.forEach((type) => {
      if (type !== extension) {
        options.push(type);
      }
    });
  }

  options.forEach((option) => {
    const newOption = document.createElement('option');
    newOption.innerHTML = option
    dropdownFileTypes.appendChild(newOption);
  });
}