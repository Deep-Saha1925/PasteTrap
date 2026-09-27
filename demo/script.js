const normalText =
  document.getElementById("normalText").textContent.trim();

const visibleTrapText =
  document.getElementById("visibleTrapText").textContent.trim();

// This is intentionally fake. It is NOT a real shell command.
const hiddenDemoPayload =
  'echo "Hello"';

const copyNormalBtn = document.getElementById("copyNormalBtn");
const copyTrapBtn = document.getElementById("copyTrapBtn");
const normalStatus = document.getElementById("normalStatus");
const trapStatus = document.getElementById("trapStatus");

const pasteBox = document.getElementById("pasteBox");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const result = document.getElementById("result");

const simulation = document.getElementById("simulation");
const runSimulationBtn = document.getElementById("runSimulationBtn");
const fakeSecret = document.getElementById("fakeSecret");
const attackerReceived = document.getElementById("attackerReceived");
const simulationStatus = document.getElementById("simulationStatus");

function setStatus(element, message) {
  element.textContent = message;
}

async function copyToClipboard(text) {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API is unavailable. Use HTTPS or localhost.");
  }

  await navigator.clipboard.writeText(text);
}

copyNormalBtn.addEventListener("click", async () => {
  try {
    await copyToClipboard(normalText);
    setStatus(normalStatus, "✅ Normal text copied.");
  } catch (error) {
    setStatus(normalStatus, `❌ ${error.message}`);
  }
});

copyTrapBtn.addEventListener("click", async () => {
  try {
    const clipboardPayload =
      `${hiddenDemoPayload}`;

    await copyToClipboard(clipboardPayload);

    setStatus(
      trapStatus,
      "⚠️ Demo content copied. Now paste it into the analyzer below."
    );
  } catch (error) {
    setStatus(trapStatus, `❌ ${error.message}`);
  }
});

function analyzeText(text) {
  const checks = [];

  const lower = text.toLowerCase();

  // These are deliberately broad educational indicators.
  // We DO NOT execute anything.
  if (lower.includes("[pastetrap-demo]")) {
    checks.push("This content contains the PasteTrap demo payload.");
  }

  if (
    lower.includes("powershell") ||
    lower.includes("invoke-webrequest") ||
    lower.includes("curl ") ||
    lower.includes("wget ")
  ) {
    checks.push("It contains a command/tool commonly associated with downloading data.");
  }

  if (
    lower.includes("token") ||
    lower.includes("password") ||
    lower.includes("cookie") ||
    lower.includes("api_key")
  ) {
    checks.push("It references information that may be sensitive.");
  }

  if (
    lower.includes("base64") ||
    lower.includes("eval(") ||
    lower.includes("document.cookie")
  ) {
    checks.push("It contains a pattern that deserves extra inspection.");
  }

  if (checks.length === 0) {
    return {
      risk: "safe",
      title: "✅ No obvious warning pattern detected",
      message:
        "That does not prove the text is safe. It only means this small demo did not recognize one of its warning patterns."
    };
  }

  return {
    risk: "warning",
    title: "⚠️ Suspicious content detected",
    message:
      "Do not execute untrusted pasted content without understanding exactly what it does.",
    checks
  };
}

analyzeBtn.addEventListener("click", () => {
  const text = pasteBox.value.trim();

  if (!text) {
    result.className = "result warning";
    result.innerHTML = `
      <h3>Paste something first</h3>
      <p>The analyzer needs text to inspect.</p>
    `;
    return;
  }

  const analysis = analyzeText(text);

  if (analysis.risk === "safe") {
    result.className = "result safe";
    result.innerHTML = `
      <h3>${analysis.title}</h3>
      <p>${analysis.message}</p>
    `;
    simulation.classList.add("hidden");
    return;
  }

  result.className = "result warning";
  result.innerHTML = `
    <h3>${analysis.title}</h3>
    <p>${analysis.message}</p>
    <ul>
      ${analysis.checks.map(item => `<li>${item}</li>`).join("")}
    </ul>
  `;

  simulation.classList.remove("hidden");
});

clearBtn.addEventListener("click", () => {
  pasteBox.value = "";
  result.className = "result hidden";
  result.innerHTML = "";
  simulation.classList.add("hidden");
  simulationStatus.textContent = "";
  attackerReceived.textContent = "Nothing received";
});

runSimulationBtn.addEventListener("click", () => {
  // Safe fake secret — never use a real password/token here.
  const demoSecret = "DEMO_PASSWORD_123";

  fakeSecret.textContent = demoSecret;

  setTimeout(() => {
    attackerReceived.textContent = demoSecret;

    setStatus(
      simulationStatus,
      "🚨 Simulation complete. No network request was made. This was only a visual demonstration."
    );
  }, 700);
});

// Optional educational feedback:
// Highlight suspicious text when the user pastes directly.
pasteBox.addEventListener("paste", () => {
  setTimeout(() => {
    const text = pasteBox.value.toLowerCase();

    if (text.includes("[pastetrap-demo]")) {
      pasteBox.style.borderColor = "rgba(248,113,113,0.9)";
    } else {
      pasteBox.style.borderColor = "";
    }
  }, 50);
});