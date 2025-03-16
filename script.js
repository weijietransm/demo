document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const loginSection = document.getElementById('login-section');
    const mainContent = document.getElementById('main-content');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const loggedUser = document.getElementById('logged-user');
    const loginButton = document.getElementById('login-button');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const uploadArea = document.getElementById('upload-area');
    const dropMessage = document.getElementById('drop-message');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const changeImageBtn = document.getElementById('change-image-btn');
    const processBtn = document.getElementById('process-btn');
    const loading = document.getElementById('loading');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    
    // API endpoint - replace with your actual API endpoint
    const API_ENDPOINT = 'http://4.194.176.58:9292/api/open/api/algorithm/inferenceImage';
    const AUTH_ENDPOINT = 'http://4.194.176.58:9292/api/login';
    
    let API_TOKEN = null;
    let selectedFile = null;
    
    // Check if user is already logged in
    checkLoginStatus();
    
    // Login button click
    loginButton.addEventListener('click', () => {
        loginSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
    });
    
    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const account = usernameInput.value.trim();
        const password = passwordInput.value;
        
        try {
            loginError.classList.add('hidden');
            
            // Encode username and password to Base64
            const encodedUsername = btoa(account);
            const encodedPassword = btoa(password);
            
            const response = await fetch(AUTH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    account: encodedUsername, 
                    password: encodedPassword 
                })
            });
            
            if (!response.ok) {
                throw new Error('Invalid credentials. Please try again.');
            }
            
            const data = await response.json();
            
            // Save the token
            API_TOKEN = data.data;
            
            // Save user session
            const userData = {
                account: account,
                token: API_TOKEN,
                expires: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 hours expiry
            };
            
            localStorage.setItem('userSession', JSON.stringify(userData));
            
            // Show main content
            showLoggedInUI(account);
            
        } catch (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
            passwordInput.value = '';
        }
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userSession');
        showLoginUI();
    });
    
    // Check if user is logged in
    function checkLoginStatus() {
        const userSession = localStorage.getItem('userSession');
        
        if (userSession) {
            const userData = JSON.parse(userSession);
            
            // Check if session is expired
            if (userData.expires > new Date().getTime()) {
                API_TOKEN = userData.token;
                showLoggedInUI(userData.account);
                return;
            } else {
                // Session expired
                localStorage.removeItem('userSession');
            }
        }
        
        showLoginUI();
    }
    
    // Show logged in UI
    function showLoggedInUI(username) {
        loginSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loggedUser.textContent = username;
        loginButton.classList.add('hidden');
        userInfo.classList.remove('hidden');
        
        // Reset form
        loginForm.reset();
    }
    
    // Show login UI
    function showLoginUI() {
        mainContent.classList.add('hidden');
        loginSection.classList.remove('hidden');
        loginButton.classList.remove('hidden');
        userInfo.classList.add('hidden');
        API_TOKEN = null;
    }
    
    // Handle drag and drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('active');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('active');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    // Handle file selection via button
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Change image button
    changeImageBtn.addEventListener('click', () => {
        resetUI();
    });
    
    // Process image button
    processBtn.addEventListener('click', () => {
        if (selectedFile) {
            processImage(selectedFile);
            // Hide the process button after clicking
            processBtn.style.display = 'none';
        }
    });
    
    // Handle the selected file
    function handleFile(file) {
        // Check if the file is an image
        if (!file.type.startsWith('image/')) {
            showError('Please select an image file (JPEG, PNG, etc.)');
            return;
        }
        
        selectedFile = file;
        
        // Display image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            dropMessage.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            
            // Show the process button when a new image is uploaded
            processBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
        
        // Hide any previous results or errors
        errorSection.classList.add('hidden');
        
        // Remove any previous detection overlays
        const existingContainer = previewContainer.querySelector('.detection-container');
        if (existingContainer) {
            previewContainer.removeChild(existingContainer);
        }
    }
    
    // Process the image and send to API
    async function processImage(file) {
        try {
            if (!API_TOKEN) {
                throw new Error('Authentication token not available. Please log in again.');
            }
            
            // Show loading state
            loading.classList.remove('hidden');
            errorSection.classList.add('hidden');
            
            // Create form data to send the file
            const formData = new FormData();
            formData.append('algorithmNumber', '5Dh3ah');
            formData.append('images', file);
            
            // Make the API request with Bearer token authorization
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`
                }
            });
            
            // Hide loading
            loading.classList.add('hidden');
            
            if (!response.ok) {
                // Check if unauthorized (token expired)
                if (response.status === 401) {
                    localStorage.removeItem('userSession');
                    showLoginUI();
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            // Parse the API response
            const data = await response.json();
            
            // Draw detection boxes on the image
            drawDetectionBoxes(data.data[0]);
            
        } catch (error) {
            // Hide loading and show error
            loading.classList.add('hidden');
            showError(error.message || 'An error occurred while processing the image');
        }
    }
    
    // Function to draw detection boxes on the image
    function drawDetectionBoxes(data) {
        try {
            // Parse the labelResult if it's a string
            let labelData;
            if (typeof data.labelResult === 'string') {
                labelData = JSON.parse(data.labelResult);
            } else {
                labelData = data.labelResult;
            }
            
            // Check if results array exists and contains detection data
            if (!labelData.results || !labelData.results.length || !labelData.results[0].detection) {
                console.warn('No detection results found');
                return;
            }
            
            // Get the current image preview
            const img = imagePreview;
            const imgWidth = img.clientWidth;
            const imgHeight = img.clientHeight;
            
            // Create a canvas element to overlay on the image
            const canvas = document.createElement('canvas');
            canvas.width = imgWidth;
            canvas.height = imgHeight;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            
            // Create a container that preserves the original image dimensions
            const container = document.createElement('div');
            container.className = 'detection-container';
            container.style.position = 'relative';
            container.style.display = 'inline-block';
            container.style.width = `${imgWidth}px`;
            container.style.height = `${imgHeight}px`;
            
            // Get the detection results
            const detections = labelData.results[0].detection.result;
            
            // Define class colors (can be expanded with more colors)
            const classColors = [
                '#FF0000', // Red for class 0
                '#00FF00', // Green for class 1
                '#00FFFF', // Cyan for class 2
                '#0000FF', // Blue for class 3
                '#FF00FF', // Magenta for class 4
                '#FFFF00', // Yellow for class 5
            ];
            
            // Create a new image to get natural dimensions
            const naturalImg = new Image();
            naturalImg.src = img.src;
            
            naturalImg.onload = () => {
                // Get the context for drawing
                const ctx = canvas.getContext('2d');
                ctx.lineWidth = 3;
                ctx.font = 'bold 14px Arial';
                
                // Define class names
                const classNames = ['Crack', 'Protruding Nails', 'Foreign Objects', 'Dent', 'Rust', 'Others'];
                
                // Calculate scaling factors between original image dimensions and displayed size
                const scaleX = imgWidth / naturalImg.naturalWidth;
                const scaleY = imgHeight / naturalImg.naturalHeight;
                
                // Draw each detection box
                detections.forEach(detection => {
                    const { box, classId, prob } = detection;
                    
                    // Scale coordinates and dimensions to match displayed image size
                    const x = box.x * scaleX;
                    const y = box.y * scaleY;
                    const width = box.width * scaleX;
                    const height = box.height * scaleY;
                    
                    // Get color for this class (use modulo to handle more classes than colors)
                    const color = classColors[classId % classColors.length];
                    
                    // Draw rectangle
                    ctx.strokeStyle = color;
                    ctx.strokeRect(x, y, width, height);
                    
                    // Draw background for text
                    ctx.fillStyle = color;
                    const textWidth = ctx.measureText(`${classNames[classId] || `Class ${classId}`}: ${(prob * 100).toFixed(2)}%`).width + 10;
                    const textHeight = 20;
                    ctx.fillRect(x, y - textHeight, textWidth, textHeight);
                    
                    // Draw text (class name + probability)
                    ctx.fillStyle = '#FFFFFF';
                    const className = classNames[classId] || `Class ${classId}`;
                    const probability = (prob * 100).toFixed(2);
                    ctx.fillText(`${className}: ${probability}%`, x + 5, y - 5);
                });
                
                // Remove previous detection overlay if exists
                const existingContainer = previewContainer.querySelector('.detection-container');
                if (existingContainer) {
                    previewContainer.removeChild(existingContainer);
                }
                
                // Add the original image to the container (clone the current image)
                const displayedImg = document.createElement('img');
                displayedImg.src = img.src;
                displayedImg.style.width = `${imgWidth}px`;
                displayedImg.style.height = `${imgHeight}px`;
                container.appendChild(displayedImg);
                container.appendChild(canvas);
                
                // Add the container to the preview area
                previewContainer.insertBefore(container, previewContainer.querySelector('.preview-actions'));
                
                // Hide the original image preview
                img.style.display = 'none';
            };
        } catch (error) {
            console.error('Error drawing detection boxes:', error);
            showError('Failed to visualize detection results');
        }
    }
    
    // Reset UI to initial state
    function resetUI() {
        dropMessage.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        fileInput.value = '';
        selectedFile = null;
        errorSection.classList.add('hidden');
        
        // Reset the original image preview display
        const imagePreview = document.getElementById('image-preview');
        imagePreview.style.display = '';
        imagePreview.src = '#'; // Clear the image source
        
        // Remove any detection overlays
        const existingContainer = previewContainer.querySelector('.detection-container');
        if (existingContainer) {
            previewContainer.removeChild(existingContainer);
        }
        
        // Show the process button for next image
        processBtn.style.display = 'inline-block';
    }
});
