# Changelog

All notable changes to Extractify are listed here, newest first. For the
full reasoning behind each decision (why, not just what), see [SPEC.md](SPEC.md).

## [1.11.0]

**עברית:** סבב שיפור מוצר יזום (לא ביקורת ציות) — מחקר מתחרים קצר
(Table Capture, Copyfish, Google Lens, Tabula, ExtractTable), שתי
תוספות מוצר מקומיות-בלבד שנבעו ישירות ממנו, ולכידה של UI מודרני
בפאנל/הגדרות/מסך פתיחה. שום שינוי בפלטת הצבעים.

**English:** A proactive product-improvement pass (not a compliance
sweep) — a short competitor scan (Table Capture, Copyfish, Google Lens'
table extraction, Tabula, ExtractTable), two local-only additions that
came directly out of it, and a UI modernization pass across the capture
panel, options page, and welcome screen. No color-palette changes.

### Added
- **Recapture** (`src/content/content.js`, `snaptable-btn` `data-action="recapture"`
  in the result panel footer): re-runs the exact same screenshot → crop →
  OCR pass on the last drag-captured region, without re-dragging. Mirrors
  Copyfish's "Recapture"/repeat-OCR flow. The button auto-highlights with a
  gentle pulse (`.is-suggested` in `src/content/overlay.css`, honors
  `prefers-reduced-motion`) whenever a capture fails or its OCR confidence
  is below 70% — the two moments a retry is most likely to help. Hidden
  once a panel has "Add Capture" rows from more than one region, so it can
  never silently discard already-combined multi-region data.
- **Per-site remembered capture area** ("Remember the last capture area
  per website", on by default under Settings → Behavior): after a
  successful drag capture, its rectangle (position + size only, never
  content) is saved per hostname via `chrome.storage.local` (capped at the
  40 most recently used sites). Starting a fresh capture on a site with a
  saved region shows "↻ Press Enter to reuse the last area captured on
  this site" next to the drag-selection hint — press Enter to recapture
  instantly, or just start dragging as before to ignore it. Modeled on
  Table Capture Pro's per-site "Recipes". Settings adds a "Clear saved
  areas (N)" button to wipe the whole list, and `PRIVACY.md` discloses
  the new local-only data per STANDARDS.md §11.10.
- `DEFAULT_SETTINGS.rememberRegions` (`src/background/background.js`,
  `src/content/content.js`, `src/options/options.js`) — new setting,
  defaults to `true`, never leaves the device either way.

### Changed
- UI modernization pass, palette unchanged (`src/content/overlay.css`,
  `src/options/options.css`, `src/welcome/welcome.css`): consistent
  150ms transitions on buttons/chips/grid cells/mode toggle, visible
  `:focus-visible` rings, a subtle hover lift on the welcome page's step
  cards with a staggered entrance animation, hover backgrounds on
  Settings' checkbox/radio rows, and a `prefers-reduced-motion` guard
  added everywhere a new transition or animation was introduced.

### Fixed
- None this release — the offscreen OCR pipeline (worker queue chaining,
  warm-up race handling, per-tab progress routing) and the crop/contrast
  pipeline in `content.js` were reviewed for the requested performance
  sweep and found already correct; no real bug was found worth "fixing"
  just to have something to list. See SPEC.md for what was checked.

### Competitor research (brief)
- **Table Capture** (Chrome Web Store, 2026): free tier covers clipboard/
  Google Sheets export; Pro (paid) adds multi-page/scroll capture,
  Markdown export, and per-site "Recipes"; Cloud (paid) adds live Google
  Sheets sync and an AI "Magic Columns"/"Table Talk" chat layer — both
  explicitly cloud-dependent, so skipped here (Extractify stays
  offline-only; the per-site memory idea was adapted, the cloud sync
  was not).
- **Copyfish**: free OCR extension whose core retry affordance is a
  "Recapture" button plus a "repeat OCR on the same marked area" flow
  for subtitles — directly inspired the Recapture addition above.
- Google Lens' in-browser table extraction and Tabula/ExtractTable were
  also reviewed; both are cloud/server-side by design and offered no
  local-only pattern worth adapting beyond what's already in
  Extractify's own column-gap heuristic (`src/shared/snaptable-ocr.js`).

## [1.10.2]

**עברית:** תיקון ציות ל-STANDARDS.md §13.3 בעקבות סבב ביקורת תאימות
מלא. כותרות שני פריטי התפריט בלחיצה ימנית כללו את שם המוצר ("...with
Extractify" / "...עם Extractify") — הסטנדרט אוסר במפורש על כך ("כותרת
פריט התפריט קצרה וברורה בפעולה, לא שם מוצר"), עם Extractify עצמו
כדוגמה בטקסט הסטנדרט. הכותרות קוצרו לפועל בלבד ("Capture Area"/"צילום
אזור", "Extract Table from This Image"/"חילוץ טבלה מהתמונה הזו") בשתי
השפות, וכל האזכורים התיעודיים התואמים (עמוד ההגדרות, מסך הפתיחה,
README, SPEC, USER-GUIDE) עודכנו בהתאם. אין שינוי בהתנהגות בפועל —
אותם שני פריטי תפריט, באותם מיקומים (`contexts: ["all"]`/`["image"]`),
רק טקסט קצר יותר.

**English:** Compliance fix against `STANDARDS.md` §13.3, found during a
full audit pass. Both right-click context-menu item titles included the
product name ("...with Extractify" / "...(Extractify)") — the standard
explicitly forbids this pattern ("menu item title should be a short,
clear action, not a product name"), using Extractify itself as the
example of what to avoid. Titles were shortened to the action alone
("Capture Area"/"צילום אזור", "Extract Table from This Image"/"חילוץ
טבלה מהתמונה הזו") in both languages, and every matching documentation
reference (Settings page, Welcome screen, README, SPEC, USER-GUIDE) was
updated to match. No behavior change — same two menu items, same
placement (`contexts: ["all"]`/`["image"]`), shorter text only.

### Changed
- Context-menu item titles no longer append "with Extractify"/"
  (Extractify)" — both `_locales`-equivalent strings in
  `src/shared/extractify-i18n.js` (`ctxCaptureArea`, `ctxExtractImage`)
  and every doc/UI string quoting them (`triggerRightClick`,
  `welcomeStep1Body`, `README.md`, `SPEC.md`, `USER-GUIDE.md`,
  `src/options/options.html`).

## [1.10.1]

A second, closer STANDARDS.md pass — filled in real gaps the first pass
missed rather than just re-reading the same checklist and calling it done.

### Added
- `build/build.ps1` — the single-command build script §9 requires:
  validates `manifest.json` + both locale files as JSON, syntax-checks
  every hand-written JS file, verifies EN/HE translation key parity, and
  rebuilds `Extractify-v<version>.zip` from exactly what ships. Actually
  run end-to-end to confirm it works, not just written and assumed.
- `USER-GUIDE.md` — step-by-step usage with literal button labels and
  menu text (§9 requirement; screenshots deferred with the same honest
  note as the store listing assets, since nothing is blocking on them
  while this stays privately distributed).
- `RELEASE-CHECKLIST.md` — a repeatable checklist for every future
  release, filtered from the shared standard's Definition of Done down
  to what actually applies to a Chrome extension (the Windows-installer
  items don't).

### Changed
- Documented, in code, why the "Capture Area" context-menu item uses
  `contexts: ["all"]` — flagged by `STANDARDS.md` §13.3 as something to
  avoid without justification. It's deliberate here: unlike an action
  that only makes sense in one context (selected text, an image),
  drag-to-select capture is equally relevant no matter what's under the
  cursor. See `SPEC.md` for the full reasoning — narrowing it would trade
  a real capability for a checklist item satisfied only on paper.

## [1.10.0]

A structural compliance pass against the project's portfolio-wide
`STANDARDS.md`, not a user-facing feature release — the extension behaves
identically to 1.9.0 for anyone already using it. No functional code
changed; every JS/HTML file only had its internal file paths updated to
match, and both dev test harnesses were re-run against the real engine
to confirm nothing broke in the move.

### Changed
- **Full folder restructure** to match the standard Chrome-extension
  layout: `manifest.json` now sits at the project root (was nested under
  `extension/`); source split into `src/background/`, `src/content/`,
  `src/options/`, `src/offscreen/`, `src/welcome/`, and `src/shared/`
  (renamed from `lib/`); icons moved to `assets/icons/`; dev-only test
  pages moved from `test/` to `tests/`; the icon-generation script moved
  to `build/make-icons.ps1`. See `DELETIONS.md` for the full list.
- **Installer ZIP renamed** to `Extractify-v<version>.zip` (was the
  unversioned `Extractify.zip`) and now contains only the files Chrome
  actually needs to load the extension (`manifest.json`, `src/`,
  `assets/`, `_locales/`) — no docs, no dev tools, no test harnesses.
- **Manifest-level strings** (extension name, description, toolbar
  tooltip, keyboard-shortcut description) now go through Chrome's native
  `_locales/en/` and `_locales/he/` i18n system via `__MSG_x__`
  placeholders and `default_locale`, instead of being hardcoded English
  text. This is deliberately layered *on top of* the existing custom
  in-page i18n system (`ExtractifyI18n`), not a replacement for it — see
  `SPEC.md` for why both exist and what each one is actually responsible
  for.

### Added
- `PRIVACY.md` and `EULA.md` at the project root (bilingual EN/HE).
- `store/STORE_LISTING.md` — Chrome Web Store listing text and permission
  justifications, ready in advance even though this build isn't
  published there today.
- `site/README.md` pointing at the hosted landing page.
- `DELETIONS.md` — a log of every file/folder this pass moved or removed
  and why, per the project standards' hard rule that nothing gets
  deleted silently.

### Verified
- Manifest JSON and both `_locales/*/messages.json` files parse cleanly.
- All 7 hand-written JS files pass a syntax check from their new
  locations.
- Zero `eval`/`new Function`, zero hardcoded secrets, and zero remote
  `<script src="http...">` tags across all authored code (the one
  `eval`-shaped match in the whole tree is inside the unmodified
  third-party `tesseract` worker bundle, not code this project wrote).
- Both dev test harnesses (`tests/harness.html`, the real OCR engine;
  `tests/panel-ui-harness.html`, the full capture-panel UI) re-run
  successfully against the restructured paths — including the panel's
  icon loading correctly from the new `assets/icons/` location.
- `Extractify-v1.10.0.zip` inspected entry-by-entry: `manifest.json` at
  the archive root, 26 files total, nothing extraneous included.
- Confirmed no file anywhere in the project still hardcodes the old
  `1.9.0` version string — `options.js` reads it once, dynamically, from
  `chrome.runtime.getManifest()`, so there is exactly one place the
  version number lives.

## [1.9.0]

A round focused on accuracy, speed, and one new option — plus a
concurrency bug found and fixed while building the speed improvement.

### Added
- **Low-contrast image preprocessing.** Before OCR, a capture is now
  grayscaled and contrast-stretched — but *only* when its actual contrast
  is genuinely low (a light-gray-on-white dashboard label, or text sitting
  over a semi-transparent overlay). An already high-contrast capture
  (plain black text on white, the common case) is left byte-for-byte
  untouched, so this can only help, never hurt, a normal capture.
- **OCR engine pre-warming.** The offscreen document and its Tesseract
  worker now start loading the moment you trigger a capture (icon click,
  keyboard shortcut, or right-click), instead of waiting until after
  you've finished dragging a selection. The ~1-2s engine load now overlaps
  with the time you spend selecting, so recognition itself starts sooner
  once you release the mouse.
- **"Automatically copy the result" option**, under a new Behavior section
  in Settings. When on, the table is copied to your clipboard the instant
  recognition finishes — no need to click "Copy as Table" yourself. Off
  by default. A new FAQ entry explains it in case it ever surprises
  someone who didn't realize they'd turned it on.

### Fixed
- **A worker-creation race introduced by the pre-warming feature itself**,
  caught during implementation, before shipping: a warm-up call and a real
  recognize request arriving close together could both see no cached
  worker and both start loading Tesseract, wasting a full engine load and
  silently leaking the loser (never terminated). Fixed with a small
  promise-chain queue in the offscreen document so worker creation is
  never attempted twice at once, and one failed attempt can't wedge every
  capture after it.

### Verified
- The contrast stretch was tested against the real Tesseract engine, not
  assumed: on one low-contrast case, the *unprocessed* image was
  misread ("4217" came back as "77"), while the stretched version read it
  correctly at 95% confidence — a genuine, measured fix, not a
  theoretical one. A normal high-contrast capture was confirmed
  byte-identical before and after (the skip guard works).
- The worker-queue fix was verified directly against the real engine: two
  concurrent requests for the same languages produced exactly one created
  worker and both callers received that same instance; a forced failure
  on the first queued attempt did not prevent the next one from
  succeeding.
- Auto-copy was verified through the real capture pipeline (not a stub):
  the clipboard received the exact table content with no manual click.
- Regression-checked "Add Capture" once more on top of all of the above —
  still merges correctly into the same panel instance.
- Full syntax check across all 7 hand-written JS files and the manifest;
  translation parity: 145 English keys = 145 Hebrew keys.

## [1.8.1]

A focused correctness pass over the 1.8.0 "Add Capture" code — no new
features, two real bugs found and fixed by careful re-review (not
user-reported).

### Fixed
- **"Add Capture" could silently drop an unsaved edit.** If you edited a
  grid cell (or the raw text) and then clicked "Add Capture" *without*
  first switching view modes or using an Add/Delete Row/Column button, the
  edit was lost — the append merged onto stale, pre-edit data instead of
  what was actually on screen. `appendResult()` now syncs from whichever
  view is currently active first, exactly like the copy buttons already
  did.
- **The keyboard shortcut or right-click menu could destroy a panel mid-capture.**
  Triggering `Ctrl+Shift+K` (or the right-click menu) while a previous
  capture in the same panel was still being recognized — most likely
  during a multi-step "Add Capture" session — started a *fresh* capture
  that closed the panel out from under the one already in flight, so that
  capture's result silently disappeared into a detached, invisible panel
  when it finished. Both entry points now check a `busy` flag and show a
  toast ("still recognizing the previous capture") instead.

### Verified
- Both fixes reproduced and confirmed against the real bundled
  `content.js`: an edited cell now survives an Add Capture merge exactly
  as typed; retriggering a capture mid-recognition now leaves the original
  panel untouched and shows the busy toast, and the original capture still
  completes normally afterward.
- Re-ran the real (unmocked) Tesseract.js pipeline end to end — PASS,
  correct digits, correct column count — to confirm nothing in the OCR
  engine itself regressed from other changes this pass.
- Full syntax check across all 7 hand-written JS files, and translation
  key parity: 139 English keys = 139 Hebrew keys.

## [1.8.0]

### Added
- **"Add Capture" — merge multiple captures into one table.** A table that's
  taller than one screen (a long dashboard, a paginated list) used to mean
  either a cramped screenshot or starting over for each section. The new
  "+ Add Capture" button in the result panel starts another drag-selection
  without closing the current panel, and appends the new capture's rows to
  the bottom of the existing table instead of replacing it. The status line
  confirms how many rows were added and the running total. "New Area" still
  works exactly as before — replaces the panel completely — for a genuinely
  fresh capture.
- Starting a capture (either "New Area" or "Add Capture") is now blocked
  while a previous capture in the same panel is still being recognized,
  closing a small pre-existing gap where clicking too fast could let two
  requests race against the same panel.

### Verified
- Full "Add Capture" flow run against the real bundled `content.js` through
  actual drag-select mouse events (not a shortcut call): first capture (3
  rows) → Add Capture → second capture (2 rows) → confirmed same panel
  instance reused, 5 rows present in the grid, status text and AI confidence
  both reflected the second capture, and Copy as Table produced the full
  5-row TSV.
- Confirmed "New Area" right after that still fully replaces the panel (new
  DOM instance, no leftover rows from the previous table) — no regression
  from the new append path.

## [1.7.0]

### Added
- **Editable table grid in the result panel.** Recognized results now open
  in a real spreadsheet-style grid — click any cell to fix an OCR mistake,
  add or delete rows and columns with dedicated buttons, and press Enter to
  move to the cell below. A "Grid / Text" toggle switches to the previous
  raw-TSV textarea view (and back) without losing edits either way — the
  two views edit the same underlying data. Results with a detected table
  open in Grid mode by default; plain-text results (no columns detected)
  open in Text mode, as before.
- **"Download CSV" button** in the result panel, alongside the existing
  copy buttons — writes a real `.csv` file with proper quoting for any
  cell containing a comma, quote, or newline. The file is written with a
  UTF-8 byte-order mark, because Excel otherwise guesses the wrong
  codepage for non-ASCII text (Hebrew, in particular) and shows it as
  garbled characters instead of opening it as UTF-8.

### Fixed
- The dev-only panel test harness (`test/panel-ui-harness.html`, not
  shipped in the ZIP) was still shimming `chrome.storage.sync`, left over
  from before the 1.4.0 migration to `chrome.storage.local` — it worked by
  accident because the extension just fell back to defaults every time.
  Updated to shim the real API the extension actually calls.

### Verified
- Full grid workflow exercised directly against the real bundled
  `content.js` in a live browser: cell edit, add row, add column, delete a
  specific row, delete a specific column, and round-tripping the same data
  through Grid → Text → Grid all preserved edits correctly.
- Copy as Table and Download CSV both checked against the live grid state
  (not a stale snapshot) — copied/downloaded content matched the edited
  cells exactly, byte-for-byte for the CSV (including the UTF-8 BOM,
  confirmed via the actual `ef bb bf` byte sequence).
- Confirmed a non-table (plain paragraph) result still opens in Text mode
  by default, with a Hebrew test string rendering and copying correctly.

## [1.6.0]

### Fixed
- **Progress updates could silently go to the wrong tab from the 2nd
  capture onward.** The OCR worker (in the offscreen document) is cached
  and reused across captures for speed, but Tesseract.js only binds its
  progress callback once, at worker creation — so every capture after the
  first kept reporting progress against the *first* capture's tab. The
  final result was never affected (that's matched by request/response, not
  by tab), just the live progress bar animation on subsequent captures.
  Fixed with a small indirection: each request now installs its own
  handler right before recognizing, regardless of whether the worker
  itself is freshly created or reused. Verified directly against the real
  bundled code with two simulated back-to-back requests sharing one cached
  worker — confirmed each one's progress now reaches only its own tab.

### Added
- **AI confidence score**, shown as a chip on the result panel (and in the
  Settings self-test): Tesseract's own 0–100 mean-confidence figure for
  the recognized region, so you have an honest, quick signal for whether
  to double check the text before trusting it. Turns red under 70%.
- `minimum_chrome_version: "116"` declared in the manifest (Extractify
  depends on `chrome.runtime.getContexts`, added in Chrome 116) — Chrome
  will now show a clear message on an unsupported browser instead of a
  cryptic runtime failure.

### Changed
- The remembered result-panel position is now clamped to the visible
  viewport when reopened, so a panel dragged before a window resize can't
  reappear partly or fully off-screen with no way to drag it back.

## [1.5.0]

### Removed
- **The `.exe` installer, the `.bat` install/uninstall scripts, and the
  `installer/` build project that produced them.** A Chrome extension
  doesn't need a separate installer — Chrome itself loads a folder
  directly via "Load unpacked." The EXE/bat approach was more moving
  parts than the problem needed, and (as a side effect of embedding its
  own copy of the extension) duplicated ~6MB of data on every build.
  Installation is back to the standard, well-understood flow: extract
  the ZIP, `chrome://extensions` → Developer mode → Load unpacked.

### Changed
- `Extractify.zip` is flat again (`manifest.json` at the ZIP root) instead
  of containing the extension as a subfolder alongside install scripts.

## [1.4.0]

### Added
- **Security & Privacy** section in Settings: plain-language explanation of
  every permission the extension requests and why, plus a clear statement
  of what data exists and where it's stored.
- "AI-powered" positioning in the manifest description, welcome screen, and
  Settings — accurate, not marketing fluff: Tesseract's OCR engine is a
  genuine on-device neural network, not a rebrand of plain OCR.
- One new FAQ entry explaining the `offscreen` permission and "access to
  all websites" in plain terms.

### Changed
- **Settings now use `chrome.storage.local` instead of `chrome.storage.sync`.**
  Your language/OCR/sensitivity settings never touch a Google server now,
  even if Chrome Sync is turned on — a deliberate privacy tightening, not
  a bug fix. **One-time effect: settings saved under the old storage are
  not carried over** (they were never sensitive — language, OCR languages,
  column sensitivity — so this just resets to defaults once).

### Verified
- Full options page re-rendered and read back in both English and Hebrew
  (including the new section) via a live browser test.
- Built-in OCR self-test re-run after the storage migration — passed
  (~350ms, correct digits, correct column count).

## [1.3.1]

### Added
- Automatic upscaling of small captures before OCR (up to 3×, capped at a
  700px long side) — Tesseract's own docs recommend this for accuracy;
  large captures are untouched.
- "Copy as Markdown" button (table syntax if columns were detected,
  fenced code block otherwise).
- `Ctrl+Enter` / `⌘+Enter` in the result panel copies the table instantly.
- The result panel now remembers its dragged position across captures on
  the same tab.

### Fixed
- **`Esc` didn't close the result panel.** The keyboard listener was
  attached only while the drag-selection overlay existed and was removed
  before the panel ever appeared. Replaced with a single listener that
  lives for the page's lifetime and checks current state instead.

## [1.3.0]

### Changed
- **Renamed Tablify → Extractify.** "Tablify" implied tables only; the
  extension extracts text from any image or PDF. Same "-ify" branding
  style, broader and more accurate name. No functional change.
- All user-facing files, folder names, and the installer were renamed to
  match (`extractify-i18n.js`, `Extractify-Setup.exe`,
  `Install-Extractify.bat`, etc). A few purely-internal identifiers
  (invisible to users) were deliberately left as historical artifacts —
  see SPEC.md.

## [1.2.1]

### Fixed
- **OCR failed outright on sites with a strict Content-Security-Policy**
  (reported error: `Failed to construct 'Worker': ... cannot be accessed
  from origin '<site>'`). A Worker created by a content script is bound to
  the *host page's* CSP, not the extension's — some sites block it
  completely. Fixed by moving all OCR execution into a Manifest V3
  **offscreen document**, Chrome's official pattern for exactly this
  problem, which runs under the extension's own CSP regardless of the page.

## [1.2.0]

### Added
- Bilingual interface (English default, Hebrew toggle) with live
  RTL/LTR switching — a custom i18n layer, not `chrome.i18n`, since the
  user picks the language from inside Settings rather than the browser's
  system locale.
- Right-click context menu: "Capture Area" (anywhere) and "Extract Table
  from This Image" (on any `<img>`, skips drag-selection entirely).
- First-run "Welcome" page explaining how to use the extension.
- `Install-Tablify.bat` / `Uninstall-Tablify.bat` for one-click install
  without manually using `chrome://extensions`.
- Update-without-reinstall support: overwrite files + Reload keeps
  settings and the extension ID; a one-time "updated to vX" banner
  confirms it landed.
- Result panel upgrades: real progress bar, thumbnail of the captured
  region, row/column summary, draggable panel, dark mode, friendlier
  error messages, live size label while selecting.
- Built-in "Run Test" self-test in Settings (real OCR against a bundled
  test image, no screen capture involved).

### Changed
- Renamed SnapTable OCR → Tablify.

## [1.1.0]

### Fixed
- **Critical: the extension didn't load in Chrome at all.** `manifest.json`
  declared `"default_locale": "he"` without a matching `_locales` folder,
  which fails Chrome's manifest validation outright. Removed (it wasn't
  needed — no `__MSG_x__` placeholders were used anywhere).

### Added
- Real progress bar, thumbnail preview, row/column result summary,
  draggable panel, live selection-size label, "New Area" button, dark
  mode, friendlier error messages, built-in OCR self-test.

## [1.0.0]

Initial release as **SnapTable OCR**: drag-select an area of the screen,
recognize text offline (Tesseract.js, Hebrew + English), reconstruct table
columns from word positions, copy as tab-separated text for pasting into
Excel / Google Sheets.
