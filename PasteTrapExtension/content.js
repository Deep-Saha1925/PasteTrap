console.log("PasteTrap content script loaded.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "CHECK_PAGE") {

        sendResponse({
            success: true,
            message: "PasteTrap is inspecting this page."
        });

    }

});