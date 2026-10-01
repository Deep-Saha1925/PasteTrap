// Background worker: shows a badge on the toolbar icon when a page triggers an alert.
const ext = globalThis.browser || globalThis.chrome;
const action = ext.action || ext.browserAction;

ext.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== "PT_ALERT" || !sender.tab) return;
  const tabId = sender.tab.id;
  action.setBadgeText({ tabId, text: msg.risk === "HIGH" ? "!!" : "!" });
  action.setBadgeBackgroundColor({ tabId, color: msg.risk === "HIGH" ? "#dc2626" : "#d97706" });
});

// Clear the badge when the tab navigates to a new page.
ext.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading") action.setBadgeText({ tabId, text: "" });
});
