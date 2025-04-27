(function(global) {
    // Create the SDK namespace
    const ARJS = {};
    
    // Main SDK container
    ARJS.createARExperience = function(glbPath = "fast-food.glb") {
        // Create main container
        const container = document.createElement('div');
        container.id = 'ar-sdk-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '9999';
        
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
        
        // Create canvas for 3D model that overlays the camera feed
        const canvas = document.createElement('canvas');
        canvas.id = 'ar-model-canvas';
        canvas.style.position = 'absolute';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);
        
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
        
        // Variables
        let stream = null;
        let THREE = null;
        let scene, camera, renderer, model, mixer, clock;
        let isModelLoaded = false;

        // Function to load a script
        function loadScript(url) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.async = true;
                script.onload = resolve;
                script.onerror = (e) => {
                    console.error(`Failed to load script: ${url}`, e);
                    reject(new Error(`Failed to load script: ${url}`));
                };
                document.head.appendChild(script);
            });
        }

        // Load required scripts
        async function loadDependencies() {
            statusIndicator.innerText = 'Loading 3D engine...';
            
            try {
                // Load Three.js core from cdnjs (more reliable)
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
                THREE = window.THREE; // Capture THREE object
                
                // Load GLTFLoader
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/GLTFLoader.js');
                
                // Setup Three.js scene
                setupThreeScene();
                
                // Load the model
                loadModel(glbPath);
                
            } catch (error) {
                console.error('Failed to load dependencies:', error);
                statusIndicator.innerText = 'Failed to load 3D engine. Please try again.';
                statusIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            }
        }

        // Setup Three.js scene
        function setupThreeScene() {
            scene = new THREE.Scene();
            
            // Camera setup
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 5;
            
            // Renderer setup
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas,
                alpha: true // Important for transparency
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 0); // Transparent background
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);
            
            // Initialize clock for animations
            clock = new THREE.Clock();
            
            // Handle window resize
            window.addEventListener('resize', function() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
            // Start animation loop
            animate();
        }
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            if (model) {
                model.rotation.y += 0.005; // Slow rotation for effect
            }
            
            if (mixer) {
                mixer.update(clock.getDelta());
            }
            
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }
        
        // Load 3D model
        function loadModel(modelPath) {
            statusIndicator.innerText = 'Loading 3D model...';
            
            const loader = new THREE.GLTFLoader();
            
            loader.load(
                modelPath,
                function(gltf) {
                    model = gltf.scene;
                    
                    // Center the model
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.x = -center.x;
                    model.position.y = -center.y;
                    model.position.z = -center.z;
                    
                    // Scale model to reasonable size
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2 / maxDim; // Adjust as needed
                    model.scale.set(scale, scale, scale);
                    
                    // Add model to scene
                    scene.add(model);
                    
                    // Setup animation if available
                    if (gltf.animations && gltf.animations.length) {
                        mixer = new THREE.AnimationMixer(model);
                        const action = mixer.clipAction(gltf.animations[0]);
                        action.play();
                    }
                    
                    isModelLoaded = true;
                    statusIndicator.innerText = 'Model loaded successfully';
                    setTimeout(() => {
                        statusIndicator.style.opacity = '0';
                        statusIndicator.style.transition = 'opacity 0.5s ease-out';
                    }, 2000);
                },
                function(xhr) {
                    if (xhr.lengthComputable) {
                        const percent = xhr.loaded / xhr.total * 100;
                        statusIndicator.innerText = `Loading model: ${Math.round(percent)}%`;
                    }
                },
                function(error) {
                    console.error('Error loading GLB model:', error);
                    statusIndicator.innerText = 'Failed to load 3D model';
                    statusIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                }
            );
        }
        
        // Function to initialize the camera
        async function initCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' }, // Use back camera if available
                    audio: false 
                });
                video.srcObject = stream;
                statusIndicator.innerText = 'Camera ready';
                
                // Now load Three.js and other dependencies
                await loadDependencies();
                
            } catch (error) {
                console.error('Error accessing camera:', error);
                statusIndicator.innerText = 'Camera access denied';
                statusIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            }
        }
        
        // Function to take screenshot
        function takeScreenshot() {
            if (!isModelLoaded) {
                statusIndicator.innerText = 'Wait for model to load';
                statusIndicator.style.opacity = '1';
                setTimeout(() => {
                    statusIndicator.style.opacity = '0';
                }, 2000);
                return;
            }
            
            // Create a canvas that combines video and THREE.js canvas
            const screenshotCanvas = document.createElement('canvas');
            screenshotCanvas.width = container.clientWidth;
            screenshotCanvas.height = container.clientHeight;
            const ctx = screenshotCanvas.getContext('2d');
            
            // Draw video first (background)
            ctx.drawImage(video, 0, 0, screenshotCanvas.width, screenshotCanvas.height);
            
            // Draw the Three.js canvas on top
            ctx.drawImage(canvas, 0, 0, screenshotCanvas.width, screenshotCanvas.height);
            
            // Create temporary image for download
            const image = screenshotCanvas.toDataURL('image/png');
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
            
            // Stop animation loop and release resources
            if (renderer) {
                renderer.dispose();
                if (renderer.domElement && renderer.domElement.parentElement) {
                    renderer.domElement.parentElement.removeChild(renderer.domElement);
                }
            }
            
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
        
        // Event listeners
        closeButton.addEventListener('click', closeAR);
        screenshotButton.addEventListener('click', takeScreenshot);
        
        // Add interactive model controls
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        canvas.addEventListener('mousedown', function(event) {
            isDragging = true;
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        });
        
        canvas.addEventListener('mouseup', function() {
            isDragging = false;
        });
        
        canvas.addEventListener('mousemove', function(event) {
            if (isDragging && model) {
                const deltaMove = {
                    x: event.clientX - previousMousePosition.x,
                    y: event.clientY - previousMousePosition.y
                };
                
                model.rotation.y += deltaMove.x * 0.01;
                model.rotation.x += deltaMove.y * 0.01;
                
                previousMousePosition = {
                    x: event.clientX,
                    y: event.clientY
                };
            }
        });
        
        // Touch controls for mobile
        canvas.addEventListener('touchstart', function(event) {
            isDragging = true;
            previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            event.preventDefault();
        });
        
        canvas.addEventListener('touchend', function() {
            isDragging = false;
        });
        
        canvas.addEventListener('touchmove', function(event) {
            if (isDragging && model) {
                const deltaMove = {
                    x: event.touches[0].clientX - previousMousePosition.x,
                    y: event.touches[0].clientY - previousMousePosition.y
                };
                
                model.rotation.y += deltaMove.x * 0.01;
                model.rotation.x += deltaMove.y * 0.01;
                
                previousMousePosition = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY
                };
            }
            event.preventDefault();
        });
        
        // Enable pointer events on canvas for interaction
        canvas.style.pointerEvents = 'auto';
        
        // Expose the public API
        return {
            start: function() {
                document.body.appendChild(container);
                initCamera();
            },
            stop: closeAR,
            setModel: function(newModelPath) {
                // Remove current model if exists
                if (model && scene) {
                    scene.remove(model);
                }
                
                // Load new model
                if (THREE && THREE.GLTFLoader) {
                    loadModel(newModelPath);
                } else {
                    console.error('THREE.js not loaded yet');
                    statusIndicator.innerText = 'Error: 3D engine not ready';
                    statusIndicator.style.opacity = '1';
                    statusIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                }
            }
        };
    };
    
    // Export the SDK to global scope
    global.ARJS = ARJS;
})(window);
