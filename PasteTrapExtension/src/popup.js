const ext = globalThis.browser || globalThis.chrome;
const statusEl = document.getElementById("status");
const warnToggle = document.getElementById("warnToggle");

// Tiny DOM helper: builds elements with textContent only (no innerHTML => no XSS from page data).
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  Object.assign(n, props);
  kids.forEach(k => n.append(k));
  return n;
}

async function scan() {
  statusEl.textContent = "Scanning page…";
  try {
    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("No active tab");
    const res = await ext.tabs.sendMessage(tab.id, { type: "CHECK_PAGE" });
    render(res);
  } catch (e) {
    statusEl.replaceChildren(
      "Can't scan this page. Browser-internal pages (chrome://, the Web Store, PDF viewer) are off-limits. ",
      "If this is a normal site, reload it once and scan again."
    );
  }
}

function render(res) {
  if (!res || !res.success) { statusEl.textContent = "Could not scan this page."; return; }
  const out = [
    el("div", {}, el("span", { className: "badge " + res.risk, textContent: res.risk + " RISK" }),
       ` score ${res.score}/100`)
  ];

  if (res.events && res.events.length) {
    out.push(el("h3", { textContent: "Clipboard writes seen on this page" }));
    res.events.slice().reverse().forEach(ev => {
      out.push(el("div", {}, el("span", { className: "badge " + ev.risk, textContent: ev.risk }),
        ` ${ev.api} · ${ev.time}`, el("code", { textContent: ev.preview })));
      if (ev.reasons.length) out.push(el("ul", {}, ...ev.reasons.map(r => el("li", { textContent: r }))));
    });
  }

  if (res.findings.length) {
    out.push(el("h3", { textContent: "Static findings" }),
      el("ul", {}, ...res.findings.map(f => el("li", { textContent: f.message }))));
  } else if (!res.events || !res.events.length) {
    out.push(el("p", { textContent: "✅ No clipboard-related patterns detected." }));
  }
  statusEl.replaceChildren(...out);
}

document.getElementById("scanButton").addEventListener("click", scan);

ext.storage.local.get({ warn: true }).then(s => { warnToggle.checked = s.warn; });
warnToggle.addEventListener("change", () => ext.storage.local.set({ warn: warnToggle.checked }));

scan(); // scan automatically when the popup opens
