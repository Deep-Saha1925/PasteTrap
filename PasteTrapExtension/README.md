# PasteTrap Extension (v1.1.0)

Browser extension that warns you when a webpage puts a suspicious command on your
clipboard (ClickFix / fake-CAPTCHA / paste-jacking attacks).

## What it does
- **Live detection**: hooks `navigator.clipboard.writeText/write`, `document.execCommand('copy')`
  and `clipboardData.setData` in the page's own JS world and analyses what gets copied.
- **Hijack detection**: flags when the clipboard differs from what you selected.
- **In-page warning** with a "Clear clipboard" button, plus a toolbar badge (`!` / `!!`).
- **Popup scan**: static scan of inline scripts and visible/hidden page text for commands and lures.
- Works on Chrome, Edge, Brave and Firefox (128+).

## Install (Chrome / Edge / Brave)
1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose this `PasteTrapExtension` folder.
4. Open `test-page.html` (drag it into the browser) and click the buttons.

## Install (Firefox)
1. Open `about:debugging#/runtime/this-firefox`.
2. **Load Temporary Add-on...** and pick `manifest.json`.

## Tests
`node test-analyzer.js` runs the command-detection unit tests.

## Layout
- `manifest.json`: MV3 manifest
- `src/injected.js`: page-world clipboard hooks
- `src/analyzer.js`: command-pattern scoring
- `src/content.js`: banner, event log, page scan
- `src/service-worker.js`: toolbar badge
- `src/popup.*`: popup UI
