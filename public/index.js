document.addEventListener('DOMContentLoaded', () => {
  const btnLoadFile = document.getElementById("loadFile");
	const mediaContainer = document.getElementById('mediaContainer');
	
	const api = window.electronAPI;

  btnLoadFile.onclick = async () => {
		await api.loadFile();
  };

	api.onFileLoaded((event, dataUrl) => {
		console.log('dataUrl received', dataUrl);
		mediaContainer.innerHTML = '';

		const mimeType = dataUrl.split(';')[0];
		const type = mimeType.split(':')[1].split('/')[0];

		console.log('type received', type);


		let element;
		if (type === 'image') {
			element = new Image();
			element.src = dataUrl;
		} else if (type === 'video') {
			element = document.createElement('video');
			element.src = dataUrl;
			element.controls = true;
		} else if (type === 'audio') {
			element = document.createElement('audio');
			element.src = dataUrl;
			element.controls = true;
		}

		if (element) {
			mediaContainer.appendChild(element);
		}
	});
});