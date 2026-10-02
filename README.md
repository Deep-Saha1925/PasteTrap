# PasteTrap

Browser extension that warns you when a webpage puts a suspicious command on your
clipboard (ClickFix / fake-CAPTCHA / paste-jacking attacks). Chrome, Edge, Brave, Firefox 128+.

## Project layout
```
PasteTrap/
├─ PasteTrapExtension/   the extension (this is what gets published)
│  ├─ manifest.json
│  ├─ src/               injected.js, analyzer.js, content.js, service-worker.js, popup.*
│  └─ icons/
├─ tests/                test-page.html (manual) and test-analyzer.js (unit tests)
├─ demo/                 original standalone web demo
├─ dist/                 built zips for the stores (git-ignored)
├─ build.ps1             builds dist\pastetrap-<version>.zip
└─ README.md
```

## Try it (Chrome / Edge / Brave)
1. Open `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** and pick the `PasteTrapExtension` folder.
3. Open `tests/test-page.html` in the browser and click the buttons.

Firefox: `about:debugging#/runtime/this-firefox` > Load Temporary Add-on > `manifest.json`.

## Test the detector
`node tests/test-analyzer.js`

## Publish
1. Bump `version` in `PasteTrapExtension/manifest.json`.
2. Run `.\build.ps1` and upload `dist\pastetrap-<version>.zip` to the Chrome Web Store,
   Edge Add-ons and addons.mozilla.org.
3. Never change the Firefox ID in `manifest.json` once published.

## Note on antivirus
`analyzer.js` and the test files contain sample attack command text (it's a detector),
which can trigger false positives in some antivirus tools. There is no executable code
that downloads or runs anything.