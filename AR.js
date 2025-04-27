(function(global) {
    // Create the SDK namespace
    const ARJS = {};
    
    // Main SDK container
    ARJS.createARExperience = function(modelId = "890fdf41d5e14d7da6288cfa1aaaa084") {
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
        
        // Create iframe for the 3D model with transparent background
        const modelFrame = document.createElement('iframe');
        modelFrame.id = "sketchfab-frame";
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
        // Use API parameters for transparent background
        modelFrame.src = `https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&transparent=1&ui_watermark=0&ui_help=0&ui_settings=0&ui_inspector=0&ui_annotations=0`;
        modelFrame.style.width = '80%';
        modelFrame.style.height = '60%';
        modelFrame.style.backgroundColor = 'transparent';
        modelFrame.style.pointerEvents = 'auto'; // Allow interaction with the model
        modelContainer.appendChild(modelFrame);
        
        // Load Sketchfab API script
        const sketchfabApiScript = document.createElement('script');
        sketchfabApiScript.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
        sketchfabApiScript.async = true;
        document.head.appendChild(sketchfabApiScript);
        
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
                
                // Initialize Sketchfab API when camera is ready
                initSketchfabAPI();
            } catch (error) {
                console.error('Error accessing camera:', error);
                statusIndicator.innerText = 'Camera access denied';
                statusIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            }
        }
        
        // Function to initialize Sketchfab API
        function initSketchfabAPI() {
            // Wait for API to load
            if (typeof window.Sketchfab !== 'function') {
                setTimeout(initSketchfabAPI, 100);
                return;
            }
            
            const iframe = document.getElementById('sketchfab-frame');
            const client = new window.Sketchfab(iframe);
            
            client.init(modelFrame.src, {
                success: function onSuccess(api) {
                    api.start();
                    api.addEventListener('viewerready', function() {
                        // Set transparent background when viewer is ready
                        api.setBackground({
                            color: [0, 0, 0, 0] // RGBA with 0 alpha for transparency
                        });
                    });
                },
                error: function onError() {
                    console.error('Sketchfab API initialization failed');
                    statusIndicator.innerText = 'Failed to load 3D model';
                    statusIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                    statusIndicator.style.opacity = '1';
                }
            });
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
            // Remove the Sketchfab API script
            const apiScript = document.querySelector('script[src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"]');
            if (apiScript && apiScript.parentNode) {
                apiScript.parentNode.removeChild(apiScript);
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
            setModel: function(newModelId) {
                modelFrame.src = `https://sketchfab.com/models/${newModelId}/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&transparent=1&ui_watermark=0&ui_help=0&ui_settings=0&ui_inspector=0&ui_annotations=0`;
                // Re-initialize the Sketchfab API with the new model
                initSketchfabAPI();
            }
        };
    };
    
    // Export the SDK to global scope
    global.ARJS = ARJS;
})(window);

// Usage:
// const arExperience = ARJS.createARExperience();
// arExperience.start();
