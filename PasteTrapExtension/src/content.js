// Isolated-world content script: receives reports from injected.js, analyses
// them, shows an in-page warning, and answers the popup's scan requests.
(function () {
  "use strict";
  const ext = globalThis.browser || globalThis.chrome;
  const A = globalThis.PasteTrapAnalyzer;
  const CHANNEL = "__pastetrap__";
  const events = [];            // runtime clipboard events seen on this page
  let settings = { warn: true };
  let lastKey = "", lastAt = 0; // de-duplicate identical reports

  try {
    Promise.resolve(ext.storage.local.get({ warn: true })).then(s => { settings = s; });
    ext.storage.onChanged.addListener((c) => { if (c.warn) settings.warn = c.warn.newValue; });
  } catch (_) {}

  // ---------- runtime events ----------
  function handleClipboardWrite(api, text, selection) {
    const key = api + "|" + text;
    const now = Date.now();
    if (key === lastKey && now - lastAt < 800) return;
    lastKey = key; lastAt = now;

    const res = A.analyze(text);
    const reasons = res.reasons.slice();
    let score = res.score;

    // Hijack: user selected one thing, page silently put something else on the clipboard.
    const sel = A.normalize(selection), txt = A.normalize(text);
    if (sel && txt && sel !== txt) {
      score = Math.min(100, score + 30);
      reasons.push("Clipboard content differs from what you selected (clipboard hijacking).");
    }
    const risk = A.riskFor(score);
    const ev = { api, risk, score, reasons, preview: text.slice(0, 300), time: new Date().toLocaleTimeString() };
    events.push(ev);
    if (events.length > 20) events.shift();

    if (risk !== "LOW") {
      try { ext.runtime.sendMessage({ type: "PT_ALERT", risk, score }); } catch (_) {}
      if (settings.warn) showBanner(ev);
    }
  }

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (e.source !== window || !d || d.channel !== CHANNEL) return;
    handleClipboardWrite(String(d.api), String(d.text || ""), String(d.selection || ""));
  });

  // Also inspect what the *user* copies by hand (e.g. a fake CAPTCHA with visible text).
  document.addEventListener("copy", () => {
    const sel = (getSelection() || "").toString();
    if (sel) handleClipboardWrite("user copy", sel, sel);
  }, true);

  // ---------- in-page warning ----------
  function showBanner(ev) {
    if (!document.documentElement) return;
    document.getElementById("pastetrap-host")?.remove();
    const host = document.createElement("div");
    host.id = "pastetrap-host";
    host.style.cssText = "all:initial;position:fixed;top:12px;right:12px;z-index:2147483647;";
    const root = host.attachShadow({ mode: "closed" });
    const color = ev.risk === "HIGH" ? "#dc2626" : "#d97706";
    root.innerHTML = `
      <style>
        .box{font:14px/1.45 system-ui,Arial,sans-serif;width:360px;background:#0b1020;color:#fff;
             border:2px solid ${color};border-radius:12px;padding:14px;box-shadow:0 10px 30px #0008}
        h2{margin:0 0 6px;font-size:15px;color:${color}}
        ul{margin:6px 0 8px 18px;padding:0;color:#cbd5e1}
        pre{margin:6px 0;padding:8px;background:#162033;border-radius:8px;white-space:pre-wrap;
            word-break:break-all;max-height:90px;overflow:auto;color:#fca5a5;font-size:12px}
        button{margin:4px 6px 0 0;padding:7px 12px;border:0;border-radius:8px;cursor:pointer;font-weight:600}
        .p{background:#2563eb;color:#fff}.s{background:#334155;color:#fff}
        small{color:#94a3b8}
      </style>
      <div class="box">
        <h2></h2>
        <div>This page put the following on your clipboard. <b>Do not paste it</b> into Run, Terminal or PowerShell.</div>
        <pre></pre><ul></ul>
        <button class="p" id="clear">Clear clipboard</button>
        <button class="s" id="close">Dismiss</button>
        <div><small>Source: <span id="api"></span></small></div>
      </div>`;
    root.querySelector("h2").textContent = `⚠ PasteTrap: ${ev.risk} risk`;
    root.querySelector("pre").textContent = ev.preview;
    root.getElementById("api").textContent = ev.api;
    const ul = root.querySelector("ul");
    ev.reasons.forEach(r => { const li = document.createElement("li"); li.textContent = r; ul.appendChild(li); });
    root.getElementById("close").onclick = () => host.remove();
    root.getElementById("clear").onclick = async () => {
      try { await navigator.clipboard.writeText(" "); root.getElementById("clear").textContent = "Clipboard cleared ✓"; }
      catch (_) { root.getElementById("clear").textContent = "Couldn't clear: copy any text manually"; }
    };
    (document.body || document.documentElement).appendChild(host);
  }

  // ---------- static page scan (popup "Scan" button) ----------
  function scanPage() {
    const findings = [];
    let score = 0;
    const add = (type, message, pts) => { findings.push({ type, message }); score += pts; };

    const patterns = [
      [/navigator\.clipboard\.writetext/i, "clipboard-write", "Calls navigator.clipboard.writeText()", 30],
      [/navigator\.clipboard\.write\s*\(/i, "clipboard-write", "Calls navigator.clipboard.write()", 30],
      [/clipboarddata\.setdata/i, "clipboard-manipulation", "Modifies clipboard data in a copy event", 40],
      [/addeventlistener\(\s*["']copy["']|\.oncopy\s*=/i, "copy-handler", "Registers a copy event handler", 25],
      [/execcommand\(\s*["']copy["']/i, "clipboard-copy", "Uses legacy execCommand('copy')", 20]
    ];

    const external = [];
    document.querySelectorAll("script").forEach((s, i) => {
      if (s.src) { external.push(s.src); return; }
      const code = s.textContent || "";
      if (!code.trim()) return;
      patterns.forEach(([re, type, msg, pts]) => { if (re.test(code)) add(type, `${msg} (inline script ${i + 1})`, pts); });
      const r = A.analyze(code);          // a command literal inside the script?
      if (r.score >= 50) add("payload-in-script", `Inline script contains a suspicious command: ${r.reasons[0]}`, 40);
    });
    if (external.length) {
      const origin = location.origin;
      const third = external.filter(u => { try { return new URL(u, location.href).origin !== origin; } catch (_) { return false; } });
      findings.push({ type: "external-script", message: `${external.length} external script(s), ${third.length} from other origins (not analysed).` });
    }

    // Visible AND hidden text that looks like a paste-me command / lure.
    let text = "";
    document.querySelectorAll("pre, code, textarea, input[type=text], input[type=hidden], [hidden], [aria-hidden=true], [style*='display:none'], [style*='display: none']")
      .forEach(el => { text += "\n" + (el.value || el.textContent || ""); });
    text += "\n" + (document.body ? document.body.innerText.slice(0, 20000) : "");
    const t = A.analyze(text.slice(0, 100000));
    if (t.score >= 20) {
      t.reasons.forEach(r => findings.push({ type: "page-text", message: `Page text: ${r}` }));
      score += Math.round(t.score / 2);
    }

    events.forEach(ev => { if (ev.risk !== "LOW") score += 20; });
    score = Math.min(score, 100);
    return { score, risk: A.riskFor(score), findings };
  }

  ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "CHECK_PAGE") {
      sendResponse({ success: true, ...scanPage(), events });
    }
    // Synchronous response; nothing async to keep open.
  });
})();
