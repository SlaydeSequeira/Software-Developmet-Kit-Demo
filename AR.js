(function(global) {
    // Create the SDK namespace
    const ARJS = {};
    
    // Main SDK container
    ARJS.createARExperience = function(modelURL = "https://sketchfab.com/models/890fdf41d5e14d7da6288cfa1aaaa084/embed") {
        // Create main container
        const container = document.createElement('div');
        container.id = 'ar-sdk-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        
        // Create video element for camera feed
        const video = document.createElement('video');
        video.id = 'ar-camera-feed';
        video.autoplay = true;
        video.playsInline = true; // Important for iOS
        video.style.position = 'absolute';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        container.appendChild(video);
        
        // Create model container that overlays the camera feed
        const modelContainer = document.createElement('div');
        modelContainer.id = 'ar-model-container';
        modelContainer.style.position = 'absolute';
        modelContainer.style.width = '100%';
        modelContainer.style.height = '100%';
        modelContainer.style.pointerEvents = 'none'; // Let interactions pass through to controls
        modelContainer.style.display = 'flex';
        modelContainer.style.justifyContent = 'center';
        modelContainer.style.alignItems = 'center';
        container.appendChild(modelContainer);
        
        // Create iframe for the 3D model
        const modelFrame = document.createElement('iframe');
        modelFrame.title = "AR 3D Model";
        modelFrame.frameBorder = "0";
        modelFrame.allowFullscreen = true;
        modelFrame.setAttribute("mozallowfullscreen", "true");
        modelFrame.setAttribute("webkitallowfullscreen", "true");
        modelFrame.allow = "autoplay; fullscreen; xr-spatial-tracking";
        modelFrame.setAttribute("xr-spatial-tracking", "");
        modelFrame.setAttribute("execution-while-out-of-viewport", "");
        modelFrame.setAttribute("execution-while-not-rendered", "");
        modelFrame.setAttribute("web-share", "");
        modelFrame.src = modelURL;
        modelFrame.style.width = '80%';
        modelFrame.style.height = '60%';
        modelFrame.style.pointerEvents = 'auto'; // Allow interaction with the model
        modelContainer.appendChild(modelFrame);
        
        // Create UI controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.style.position = 'absolute';
        controlsContainer.style.bottom = '20px';
        controlsContainer.style.left = '0';
        controlsContainer.style.width = '100%';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.justifyContent = 'center';
        controlsContainer.style.gap = '20px';
        controlsContainer.style.padding = '10px';
        container.appendChild(controlsContainer);
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close AR';
        closeButton.style.padding = '12px 24px';
        closeButton.style.backgroundColor = '#f44336';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        controlsContainer.appendChild(closeButton);
        
        // Create screenshot button
        const screenshotButton = document.createElement('button');
        screenshotButton.innerText = 'Take Screenshot';
        screenshotButton.style.padding = '12px 24px';
        screenshotButton.style.backgroundColor = '#4CAF50';
        screenshotButton.style.color = 'white';
        screenshotButton.style.border = 'none';
        screenshotButton.style.borderRadius = '4px';
        screenshotButton.style.cursor = 'pointer';
        controlsContainer.appendChild(screenshotButton);
        
        // Create status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'ar-status';
        statusIndicator.style.position = 'absolute';
        statusIndicator.style.top = '20px';
        statusIndicator.style.left = '50%';
        statusIndicator.style.transform = 'translateX(-50%)';
        statusIndicator.style.padding = '8px 16px';
        statusIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        statusIndicator.style.color = 'white';
        statusIndicator.style.borderRadius = '20px';
        statusIndicator.style.fontFamily = 'Arial, sans-serif';
        statusIndicator.innerText = 'Initializing camera...';
        container.appendChild(statusIndicator);
        
        // Stream variable to store camera stream
        let stream = null;
        
        // Function to initialize the camera
        async function initCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' }, // Use back camera if available
                    audio: false 
                });
                video.srcObject = stream;
                statusIndicator.innerText = 'AR Experience Ready';
                setTimeout(() => {
                    statusIndicator.style.opacity = '0';
                    statusIndicator.style.transition = 'opacity 0.5s ease-out';
                }, 2000);
            } catch (error) {
                console.error('Error accessing camera:', error);
                statusIndicator.innerText = 'Camera access denied';
                statusIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            }
        }
        
        // Function to take screenshot
        function takeScreenshot() {
            const canvas = document.createElement('canvas');
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            const ctx = canvas.getContext('2d');
            
            // Draw video first (background)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Create temporary image for download
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = 'ar-screenshot-' + new Date().getTime() + '.png';
            link.click();
            
            // Visual feedback
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'white';
            flash.style.opacity = '0.8';
            flash.style.transition = 'opacity 0.5s ease-out';
            container.appendChild(flash);
            
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => container.removeChild(flash), 500);
            }, 50);
        }
        
        // Function to close the AR experience
        function closeAR() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
        
        // Event listeners
        closeButton.addEventListener('click', closeAR);
        screenshotButton.addEventListener('click', takeScreenshot);
        
        // Expose the public API
        return {
            start: function() {
                document.body.appendChild(container);
                initCamera();
            },
            stop: closeAR,
            setModel: function(newModelURL) {
                modelFrame.src = newModelURL;
            }
        };
    };
    
    // Export the SDK to global scope
    global.ARJS = ARJS;
})(window);

// Usage:
// const arExperience = ARJS.createARExperience();
// arExperience.start();
