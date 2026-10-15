const WIPE_THRESHOLD_MINUTES = 30; // Threshold in minutes

// Function to physically delete files and clear browser download history
function clearDownloads() {
    console.log("AutoWiper: Starting download cleanup...");

    chrome.downloads.search({}, (items) => {
        console.log(`AutoWiper: Found ${items.length} item(s) in download history.`);

        items.forEach((item) => {
            // Check if the file finished downloading
            if (item.state === "complete") {
                console.log(`AutoWiper: Deleting physical file ID ${item.id} (${item.filename})...`);

                // Deletes physical file from ChromeOS storage
                chrome.downloads.removeFile(item.id, () => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        console.warn(`AutoWiper: File already missing or delete error: ${error.message}`);
                    } else {
                        console.log(`AutoWiper: Physical file deleted successfully.`);
                    }

                    // Erase history entry after attempting file deletion
                    chrome.downloads.erase({ id: item.id });
                });
            } else {
                // If download was cancelled or interrupted, just clear history
                chrome.downloads.erase({ id: item.id });
            }
        });
    });
}

// Function to save current timestamp to persistent storage
function updateHeartbeat() {
    chrome.storage.local.set({ lastActiveTime: Date.now() });
}

// Start background alarm to keep heartbeat fresh every 1 minute
function startHeartbeatAlarm() {
    chrome.alarms.create("sessionHeartbeat", { periodInMinutes: 1 });
}

// Trigger on browser / device startup
chrome.runtime.onStartup.addListener(() => {
    console.log("AutoWiper: onStartup event fired.");
    const now = Date.now();

    chrome.storage.local.get(["lastActiveTime"], (result) => {
        const lastActive = result.lastActiveTime;

        if (lastActive) {
            const elapsedMinutes = (now - lastActive) / (1000 * 60);
            console.log(`AutoWiper: Inactive for ${elapsedMinutes.toFixed(1)} minutes.`);

            if (elapsedMinutes >= WIPE_THRESHOLD_MINUTES) {
                console.log(`AutoWiper: Threshold reached (${WIPE_THRESHOLD_MINUTES}m). Purging downloads...`);
                clearDownloads();
            } else {
                console.log("AutoWiper: Threshold not met. Skipping download purge.");
            }
        } else {
            console.log("AutoWiper: No previous timestamp found. Executing initial purge...");
            clearDownloads();
        }

        // Refresh timestamp and restart heartbeat for current session
        updateHeartbeat();
        startHeartbeatAlarm();
    });
});

// Trigger on extension install or manual reload
chrome.runtime.onInstalled.addListener(() => {
    console.log("AutoWiper: Extension installed or reloaded.");
    updateHeartbeat();
    startHeartbeatAlarm();
    clearDownloads();
});

// Listen for periodic heartbeat updates
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "sessionHeartbeat") {
        updateHeartbeat();
    }
});