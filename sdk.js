(function(global) {
    const sdkDiv = document.createElement('div');
    sdkDiv.style.position = 'fixed';
    sdkDiv.style.top = '0';
    sdkDiv.style.left = '0';
    sdkDiv.style.width = '100%';
    sdkDiv.style.height = '100%';
    sdkDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    sdkDiv.style.zIndex = '9999';
    sdkDiv.style.display = 'flex';
    sdkDiv.style.flexDirection = 'column';
    sdkDiv.style.justifyContent = 'center';
    sdkDiv.style.alignItems = 'center';

    const video = document.createElement('video');
    video.autoplay = true;
    video.style.width = '80%';
    video.style.maxWidth = '400px';
    sdkDiv.appendChild(video);

    const captureButton = document.createElement('button');
    captureButton.innerText = 'Capture Photo';
    captureButton.style.margin = '20px';
    sdkDiv.appendChild(captureButton);

    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close SDK';
    sdkDiv.appendChild(closeButton);

    let stream;

    global.MySimpleSDK = {
        open: async function() {
            document.body.appendChild(sdkDiv);
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        }
    };

    captureButton.onclick = function() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = dataURL;
        img.style.width = '80%';
        img.style.maxWidth = '400px';
        sdkDiv.innerHTML = '';
        sdkDiv.appendChild(img);
        sdkDiv.appendChild(closeButton);
    };

    closeButton.onclick = function() {
        alert('SDK Closed');
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        document.body.removeChild(sdkDiv);
    };
})(window);
