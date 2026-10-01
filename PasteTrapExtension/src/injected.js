// Runs in the PAGE's own JavaScript world (world: "MAIN") so it can observe
// the clipboard APIs the page itself calls. It only reports what the page
// tries to put on the clipboard; it never changes the page's behaviour.
(function () {
  "use strict";
  if (window.__pasteTrapHooked) return;
  try { Object.defineProperty(window, "__pasteTrapHooked", { value: true }); } catch (_) { return; }

  const CHANNEL = "__pastetrap__";
  const MAX = 5000;

  function report(api, text, extra) {
    try {
      window.postMessage(Object.assign({
        channel: CHANNEL, api: api, text: String(text == null ? "" : text).slice(0, MAX), ts: Date.now()
      }, extra || {}), "*");
    } catch (_) {}
  }

  // Wrap a method but keep it looking native (name / toString).
  function wrap(obj, name, wrapper) {
    const orig = obj && obj[name];
    if (typeof orig !== "function") return;
    const wrapped = function () {
      try { wrapper.apply(this, arguments); } catch (_) {}
      return orig.apply(this, arguments);
    };
    try { Object.defineProperty(wrapped, "name", { value: orig.name }); } catch (_) {}
    wrapped.toString = function () { return Function.prototype.toString.call(orig); };
    obj[name] = wrapped;
  }

  function currentSelection() {
    try {
      const el = document.activeElement;
      if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT") && typeof el.selectionStart === "number") {
        const s = el.value.substring(el.selectionStart, el.selectionEnd);
        if (s) return s;
      }
      return (window.getSelection && window.getSelection().toString()) || "";
    } catch (_) { return ""; }
  }

  // 1. navigator.clipboard.writeText(text)
  if (window.Clipboard) {
    wrap(Clipboard.prototype, "writeText", function (text) {
      report("navigator.clipboard.writeText", text, { selection: currentSelection() });
    });

    // 2. navigator.clipboard.write([ClipboardItem])
    wrap(Clipboard.prototype, "write", function (items) {
      try {
        Array.from(items || []).forEach(function (item) {
          if (item.types && item.types.indexOf("text/plain") !== -1) {
            item.getType("text/plain").then(function (blob) { return blob.text(); })
              .then(function (t) { report("navigator.clipboard.write", t, { selection: currentSelection() }); })
              .catch(function () {});
          }
        });
      } catch (_) {}
    });
  }

  // 3. document.execCommand("copy" | "cut")
  wrap(Document.prototype, "execCommand", function (cmd) {
    if (typeof cmd === "string" && /^(copy|cut)$/i.test(cmd)) {
      report("document.execCommand", currentSelection(), { selection: currentSelection(), noText: true });
    }
  });

  // 4. copy event + clipboardData.setData (classic clipboard hijacking)
  let activeCopy = null, selAtCopy = "";
  function onCopy(e) {
    activeCopy = e; selAtCopy = currentSelection();
    setTimeout(function () { activeCopy = null; }, 0);
  }
  window.addEventListener("copy", onCopy, true);
  window.addEventListener("cut", onCopy, true);

  if (window.DataTransfer) {
    wrap(DataTransfer.prototype, "setData", function (type, data) {
      if (activeCopy && activeCopy.clipboardData === this && /^text(\/plain)?$/i.test(String(type))) {
        report("clipboardData.setData", data, { selection: selAtCopy });
      }
    });
  }
})();
