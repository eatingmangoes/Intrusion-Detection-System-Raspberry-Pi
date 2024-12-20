document.addEventListener('DOMContentLoaded', () => {
    const pi1Api = 'php/get1.php';
    const pi2Api = 'php/get2.php';
//    const pi1Video = 'http://10.30.97.81:8000/stream.mjpg';
    const pi1Video = 'http://10.30.97.81:8000/stream.mjpg';
    const pi2Video = 'somethingsomething';
    let currentPi = 'pi1';
    let notificationsMuted = false;

    // Create notification container
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'fixed bottom-4 right-4 z-50 space-y-2 max-w-md w-full';
    document.body.appendChild(notificationContainer);

    // Create mute toggle button
    const muteButton = document.createElement('button');
    muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
    muteButton.className = 'fixed bottom-4 left-4 z-50 bg-gray-200 p-2 rounded-full hover:bg-gray-300';
    document.body.appendChild(muteButton);

    // Notification sound - increased volume
    const notificationSound = new Audio('data:audio/wav;base64,//uQRAAAAWMOM+CDBKdDeukafHKS1mY2LDIkeH69l2WLEWqY+SIy7q+P0v8otb41PYxUJM3XqxWOmw9yCRyRIA7Vy0DGsI2T5/u9bsdVxKg4vYjQHSxEH0lM0m8dA1yl9R21hzIvH8r6xfxOX7P18dz8u87gDE0pezf4sTcAyAGTgL+CAgBA//+O+//HyM4tL9qRmPh2Mh//uQRCSAAiMz4EwAcT////89mlXqVghCYD8Lf//fK/v/v9/j/9AAAAAAAAAAAAAAAAAAj7vf/4PF//9//+P2//9//+//9/v//+///+/v/vf/7zX//v/r/9//9X/9//98f//vf/vf/vf/9//9X/+/P//v/X///7///9X//uQRCSAAqVD4EwAcKf/+Z2f6n9x+v9P2P6fgd0/Q7p+R3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O+Tgdvofofofofofofofofofofofofofofofofofofofofofofofofv//uQRCSAEKl3oS4A8Kf//EwXtL0+6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O6fod0/Q7p+h3T9Dun6HdP0O+Pgdof//');
    notificationSound.volume = 0.5; // Increased volume

    // Notification management
    const MAX_NOTIFICATIONS = 4;
    const activeNotifications = [];

    // Function to create and display notifications
    function showNotification(message, type = 'info', source = '') {
        // Remove oldest notification if max is reached
        while (activeNotifications.length >= MAX_NOTIFICATIONS) {
            const oldestNotification = activeNotifications.shift();
            notificationContainer.removeChild(oldestNotification.element);
        }

        const notification = document.createElement('div');
        notification.className = `
            p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out 
            ${type === 'alert' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' : 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'}
            transform translate-x-full opacity-0
        `;
        
        // Add source information
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'font-bold mr-2';
        sourceSpan.textContent = source ? `[${source}]` : '';
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        notification.appendChild(sourceSpan);
        notification.appendChild(messageSpan);

        // Add notification to container
        notificationContainer.appendChild(notification);

        // Track the notification
        const notificationObj = { element: notification };
        activeNotifications.push(notificationObj);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        });

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                notificationContainer.removeChild(notification);
                const index = activeNotifications.indexOf(notificationObj);
                if (index > -1) {
                    activeNotifications.splice(index, 1);
                }
            }, 300);
        }, 5000);

        // Play sound if not muted
        if (!notificationsMuted && type === 'alert') {
            try {
                notificationSound.currentTime = 0; // Reset sound to start
                notificationSound.play().catch(error => {
                    console.warn('Could not play notification sound:', error);
                });
            } catch (error) {
                console.warn('Audio playback failed:', error);
            }
        }
    }

    // Mute toggle functionality
    muteButton.addEventListener('click', () => {
        notificationsMuted = !notificationsMuted;
        muteButton.innerHTML = notificationsMuted 
            ? '<i class="fas fa-volume-mute"></i>' 
            : '<i class="fas fa-volume-up"></i>';
        muteButton.classList.toggle('bg-red-200', notificationsMuted);
    });

    // Function to fetch and display data for both PIs
    function fetchAllData() {
        Promise.all([
            fetch(pi1Api).then(response => response.json()),
            fetch(pi2Api).then(response => response.json())
        ])
        .then(([pi1Data, pi2Data]) => {
            // Update sensor cards based on current PI
            const sensorCards = document.getElementById('sensorCards');
            const currentData = currentPi === 'pi1' ? pi1Data : pi2Data;
            sensorCards.innerHTML = `
                <div class="bg-white border rounded shadow p-4">
                    <h3 class="text-lg font-medium">Intrusion Status</h3>
                    <p class="text-2xl font-bold">${currentData.motionDetected ? 'Detected' : 'No Motion'}</p>
                    <p class="text-gray-500">Last updated: ${currentData.timestamp || 'N/A'}</p>
                </div>
                <div class="bg-white border rounded shadow p-4">
                    <h3 class="text-lg font-medium">Temperature</h3>
                    <p class="text-2xl font-bold">${currentData.temperature}°C</p>
                    <p class="text-gray-500">Threshold: 30°C</p>
                </div>
               
            `;

            // Check and handle alert conditions for both PIs
            checkAlertConditions(pi1Data, 'PI 1');
            checkAlertConditions(pi2Data, 'PI 2');
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            showNotification('Failed to fetch sensor data', 'alert');
        });
    }

    // Function to check and handle alert conditions
    function checkAlertConditions(data, source) {
        const alerts = [];
        
        if (data.motionDetected) {
            alerts.push('Motion Detected!');
        }
        
        if (data.temperature > 30) {
            alerts.push(`High Temperature: ${data.temperature}°C`);
        }
        
        // Show notifications for each alert
        alerts.forEach(alert => {
            showNotification(alert, 'alert', source);
        });
    }

    // Function to update the video stream
    function updateVideoStream(videoUrl) {
        const videoElement = document.getElementById('videoStream');
        if (videoElement) {
            videoElement.src = videoUrl;
        }
    }

    // Function to toggle active navigation button
    function toggleActiveNav(activeButtonId) {
        const pi1Btn = document.getElementById('pi1Btn');
        const pi2Btn = document.getElementById('pi2Btn');

        pi1Btn.classList.remove('bg-blue-600', 'text-white');
        pi2Btn.classList.remove('bg-blue-600', 'text-white');

        const activeButton = document.getElementById(activeButtonId);
        if (activeButton) {
            activeButton.classList.add('bg-blue-600', 'text-white');
        }
    }

    const pi1Btn = document.getElementById('pi1Btn');
    const pi2Btn = document.getElementById('pi2Btn');

    if (pi1Btn) {
        pi1Btn.addEventListener('click', () => {
            currentPi = 'pi1';
            fetchAllData();
            updateVideoStream(pi1Video);
            toggleActiveNav('pi1Btn');
        });
    }

    if (pi2Btn) {
        pi2Btn.addEventListener('click', () => {
            currentPi = 'pi2';
            fetchAllData();
            updateVideoStream(pi2Video);
            toggleActiveNav('pi2Btn');
        });
    }

    // Initial data fetch for PI 1
    fetchAllData();
    updateVideoStream(pi1Video);
    toggleActiveNav('pi1Btn');

    // Periodic data refresh
    setInterval(fetchAllData, 30000); // Refresh every 30 seconds
});
