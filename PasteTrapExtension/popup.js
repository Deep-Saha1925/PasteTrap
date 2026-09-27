const scanButton = document.getElementById("scanButton");
const status = document.getElementById("status");

scanButton.addEventListener("click", async () => {

    status.textContent = "Scanning...";

    try {

        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        console.log(tabs)

        const currentTab = tabs[0];

        if (!currentTab || !currentTab.id) {
            throw new Error("Could not find the current tab.");
        }

        const response = await chrome.tabs.sendMessage(
            currentTab.id,
            {
                type: "CHECK_PAGE"
            }
        );

        status.textContent = response.message;

    } catch (error) {

        console.error(error);

        status.textContent =
            "Could not communicate with this page.";

    }

});