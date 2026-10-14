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

// Trigger strictly on Chromebook startup / browser profile launch
chrome.runtime.onStartup.addListener(() => {
    clearDownloads();
});