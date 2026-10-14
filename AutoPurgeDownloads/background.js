const WIPE_THRESHOLD_MINUTES = 15; // Threshold in minutes

// Function to physically delete files and clear browser download history
function clearDownloads() {
    chrome.downloads.search({}, (items) => {
        items.forEach((item) => {
            if (item.exists) {
                // Deletes physical file from ChromeOS storage
                chrome.downloads.removeFile(item.id, () => {
                    if (!chrome.runtime.lastError) {
                        // Removes record from chrome://downloads history
                        chrome.downloads.erase({ id: item.id });
                    }
                });
            } else {
                // Clear history entry if file was manually deleted
                chrome.downloads.erase({ id: item.id });
            }
        });
    });
}

// Function to save current timestamp to persistent storage
function updateHeartbeat() {
    chrome.storage.local.set({ lastActiveTime: Date.now() });
}

// Initialize alarm to update timestamp every minute
function startHeartbeatAlarm() {
    chrome.alarms.create("sessionHeartbeat", { periodInMinutes: 1 });
}

// Check elapsed time on browser/device startup
chrome.runtime.onStartup.addListener(() => {
    const now = Date.now();

    chrome.storage.local.get(["lastActiveTime"], (result) => {
        const lastActive = result.lastActiveTime;

        if (lastActive) {
            const elapsedMinutes = (now - lastActive) / (1000 * 60);

            // Wipe ONLY if the device was inactive/off for n minutes or more
            if (elapsedMinutes >= WIPE_THRESHOLD_MINUTES) {
                clearDownloads();
            }
        } else {
            // If no stored timestamp exists (first boot after install), perform initial wipe
            clearDownloads();
        }

        // Refresh timestamp and ensure heartbeat alarm is active for current session
        updateHeartbeat();
        startHeartbeatAlarm();
    });
});

// Setup heartbeat when installed or updated
chrome.runtime.onInstalled.addListener(() => {
    updateHeartbeat();
    startHeartbeatAlarm();
});

// Listen for periodic heartbeat alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "sessionHeartbeat") {
        updateHeartbeat();
    }
});