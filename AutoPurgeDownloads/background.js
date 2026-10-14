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

// Trigger 1: On browser/profile startup
chrome.runtime.onStartup.addListener(() => {
    console.log("AutoWiper: onStartup event fired.");
    clearDownloads();
});

// Trigger 2: Runs when you click "Reload" or "Load Unpacked" (for testing)
chrome.runtime.onInstalled.addListener(() => {
    console.log("AutoWiper: Extension installed/reloaded.");
    clearDownloads();
});