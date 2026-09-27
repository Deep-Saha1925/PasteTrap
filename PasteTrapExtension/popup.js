const scanButton = document.getElementById("scanButton");
const status = document.getElementById("status");

scanButton.addEventListener("click", async () => {

    status.textContent = "Scanning page...";

    try {

        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });


        const currentTab = tabs[0];


        if (!currentTab || !currentTab.id) {

            throw new Error(
                "Could not find the current tab."
            );
        }


        const response = await chrome.tabs.sendMessage(
            currentTab.id,
            {
                type: "CHECK_PAGE"
            }
        );

        displayResults(response);

    } catch (error) {

        console.error(error);

        status.innerHTML = `
            ❌ Could not communicate with this page.
            <br><br>
            Try reloading the webpage and then scan again.
        `;

    }

});


// ============================================
// DISPLAY RESULTS
// ============================================

function displayResults(response) {

    if (!response.success) {

        status.textContent =
            "Could not scan this page.";

        return;
    }


    const score = response.score;
    const risk = response.risk;
    const findings = response.findings;


    let html = `

        <strong>
            Risk Level: ${risk}
        </strong>

        <br>

        <span>
            Risk Score: ${score}
        </span>

        <br><br>
    `;


    // ========================================
    // No findings
    // ========================================

    if (findings.length === 0) {

        html += `
            ✅ No clipboard-related
            patterns detected.
        `;

        status.innerHTML = html;

        return;
    }


    // ========================================
    // Findings
    // ========================================

    html += `
        <strong>
            Findings:
        </strong>

        <ul>
    `;


    findings.forEach((finding) => {

        html += `
            <li>
                ${finding.message}
            </li>
        `;

    });

    html += `
        </ul>
    `;

    status.innerHTML = html;
}