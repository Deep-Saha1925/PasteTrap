console.log("PasteTrap content script loaded.");


// ============================================
// SECURITY SCANNER
// ============================================

function scanPage() {

    const findings = [];
    let score = 0;

    // --------------------------------------------
    // Find all <script> elements
    // --------------------------------------------

    const scripts = document.querySelectorAll("script");


    scripts.forEach((script, index) => {

        // ----------------------------------------
        // External script
        // ----------------------------------------

        if (script.src) {

            findings.push({
                type: "external-script",
                message: `External script detected: ${script.src}`
            });

            return;
        }

        // ----------------------------------------
        // Inline script
        // ----------------------------------------

        const code = script.textContent || "";

        if (!code.trim()) {
            return;
        }

        const lowerCode = code.toLowerCase();

        // ========================================
        // DETECTOR 1
        // navigator.clipboard.writeText()
        // ========================================

        if (
            lowerCode.includes(
                "navigator.clipboard.writetext"
            )
        ) {

            findings.push({
                type: "clipboard-write",
                message:
                    `Clipboard write operation found in script ${index + 1}.`
            });

            score += 30;
        }

        // DETECTOR 2
        // navigator.clipboard.write()

        if (
            lowerCode.includes(
                "navigator.clipboard.write("
            )
        ) {

            findings.push({
                type: "clipboard-write",
                message:
                    `Clipboard write() operation found in script ${index + 1}.`
            });

            score += 30;
        }

        // DETECTOR 3
        // clipboardData.setData()

        if (
            lowerCode.includes(
                "clipboarddata.setdata"
            )
        ) {

            findings.push({
                type: "clipboard-manipulation",
                message:
                    `Clipboard data modification found in script ${index + 1}.`
            });

            score += 40;
        }

        // DETECTOR 4
        // copy event listener

        if (
            lowerCode.includes(
                'addeventlistener("copy"'
            ) ||
            lowerCode.includes(
                "addeventlistener('copy'"
            )
        ) {

            findings.push({
                type: "copy-handler",
                message:
                    `Copy event listener found in script ${index + 1}.`
            });

            score += 25;
        }

        // DETECTOR 5
        // document.oncopy

        if (
            lowerCode.includes("document.oncopy")
        ) {

            findings.push({
                type: "copy-handler",
                message:
                    `document.oncopy handler found in script ${index + 1}.`
            });

            score += 25;
        }

        // DETECTOR 6
        // execCommand("copy")

        if (
            lowerCode.includes(
                'execcommand("copy"'
            ) ||
            lowerCode.includes(
                "execcommand('copy'"
            )
        ) {

            findings.push({
                type: "clipboard-copy",
                message:
                    `Legacy clipboard copy operation found in script ${index + 1}.`
            });

            score += 20;
        }

    });

    // Calculate risk level

    let risk = "LOW";

    if (score >= 50) {

        risk = "HIGH";

    } else if (score >= 20) {

        risk = "MEDIUM";
    }

    return {
        score,
        risk,
        findings
    };
}

// MESSAGE FROM POPUP

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.type === "CHECK_PAGE") {

            const result = scanPage();


            sendResponse({
                success: true,
                ...result
            });

        }

    }
);