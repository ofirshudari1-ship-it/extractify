# Extractify

**Select a region of your screen (or right-click any image) and turn the text inside it into a real, editable table.**

## What it does

Extractify lets you drag-select any part of your screen — a table on a dashboard, a chart, a PDF preview, a scanned document — and instantly reads the text inside it using on-device OCR (optical character recognition). It automatically detects column structure and builds an editable table you can correct cell-by-cell, then copy straight into Excel, Google Sheets, or Notion as real rows and columns (not just plain text). It also works by right-clicking any image on a page to extract its table content in one click, without dragging a selection at all. The interface is bilingual (English and Hebrew), with OCR support for both languages.

## Install

Extractify is not published on the Chrome Web Store, so installation is manual and there is no automatic update:

1. Download the latest `.zip` from the [Releases page](https://github.com/ofirshudari1-ship-it/extractify/releases/latest).
2. Extract the zip to a folder you'll keep on your computer (don't delete it afterwards — Chrome loads the extension's files from there every time).
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the folder you extracted.

Because this isn't a Chrome Web Store install, Chrome will never update it automatically. To get a new version later, download the new release zip, extract it over the same folder (or a fresh one), and click the reload icon on Extractify's card at `chrome://extensions` — or repeat "Load unpacked" for a new folder.

## Key features

- **Region capture**: click the toolbar icon, press `Ctrl+Shift+K`, or right-click anywhere on a page to drag-select a screen region for OCR.
- **One-click image extraction**: right-click directly on any image to pull its table content immediately, no dragging required.
- **Editable results grid**: correct misread cells, add/remove rows and columns, and switch between a structured Grid view and plain Text view without losing edits.
- **Multiple export formats**: copy as a tab-separated table (pastes as real columns in Excel/Sheets), copy as Markdown, copy as plain text, or download a real `.csv` file (UTF-8 with BOM, so Hebrew text opens correctly in Excel).
- **Add Capture**: stitch together multiple screen regions (e.g. a table that's taller than the screen) into a single combined table before exporting.
- **Recapture**: re-run OCR on the last captured region with one click — auto-highlighted whenever a capture fails or confidence is below 70%.
- **Per-site remembered capture area**: optionally remembers the position and size of your last capture on each website, so returning to the same page lets you recapture instantly with Enter instead of dragging again.
- **Confidence score**: each result shows an AI confidence score so you know when to double-check the text before trusting it.

## Privacy

Extractify runs its OCR engine (Tesseract.js, a neural-network OCR engine compiled to WebAssembly) entirely on your device. It makes **zero network requests** — no server, no analytics, no crash reporting, no third-party SDK, and no AI API of any kind. The captured image and recognized text exist only in memory for the duration of a single capture and are never written to disk, logged, or transmitted anywhere.

The only data stored locally (via `chrome.storage.local`, never synced through your Google account) is your own preferences — interface language, OCR languages, column sensitivity — plus, if you leave the optional "remember capture area per website" setting on, the position and size (not content) of your last capture on each site. Everything can be cleared from Settings at any time, and uninstalling the extension removes it all.
