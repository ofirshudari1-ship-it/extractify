# User Guide — Extractify

_Screenshots are not embedded in this file yet (the extension isn't
Store-published, so nothing blocks on them today — see
`store/STORE_LISTING.md`). Every step below is still concrete and
literal: exact button labels, exact menu text, exact keyboard shortcuts._

For the short version, see the "שימוש" section of `README.md`. This
document goes step-by-step with what you'll actually see on screen.

## Installing

1. Extract `Extractify-v<version>.zip` to a folder you'll keep — Chrome
   reads the extension from that folder every time it starts, so don't
   delete it after installing.
2. Open `chrome://extensions` in the address bar.
3. Turn on **Developer mode** — a toggle in the top-right corner of that
   page.
4. Click **Load unpacked**, then select the folder you extracted (the one
   whose contents start with `manifest.json` directly, not a parent
   folder around it).
5. The Extractify icon (a rounded square with a small grid mark) appears
   in the toolbar, and a "Welcome" tab opens automatically explaining the
   basics.

If a "Disable developer mode extensions" banner appears on browser
restart, that's Chrome's own generic warning for any unpacked extension
— it's not specific to Extractify and doesn't mean anything is wrong.

## Capturing your first table

Four different ways to start a capture — pick whichever fits the moment:

| Trigger | When to use it |
|---|---|
| Click the toolbar icon | Anytime, one click |
| `Ctrl+Shift+K` (`⌘+Shift+K` on Mac) | Keyboard-first workflow, no mouse needed to start |
| Right-click anywhere → **"Capture Area"** | When your hand is already on the mouse over the content |
| Right-click directly on an image → **"Extract Table from This Image"** | Skips drag-selection entirely — the image *is* the region |

For the first three: your cursor becomes a crosshair. Click and drag a
rectangle over the table, dashboard, or paragraph you need — a small
label follows your cursor showing the live pixel size. Release the mouse
to capture.

## Reading the result panel

A panel appears (draggable by its purple header bar) showing, top to
bottom:
- A thumbnail of exactly what was captured.
- Two chips: which OCR languages were active, and the column-sensitivity
  setting in use.
- Once recognition finishes, a third chip: **AI confidence** (e.g. "AI
  confidence: 92%"). Below 70% it turns red — that's your cue to
  double-check the text before trusting it, not a guarantee something is
  wrong.
- A **Grid / Text** toggle. A detected table opens in **Grid** — a real
  editable spreadsheet grid, click any cell to fix an OCR mistake, **+
  Row** / **+ Column** to add, the **×** next to any row/column to
  delete it, Enter moves to the cell below. Plain text (no columns
  detected) opens in **Text** instead, a normal editable text box.
  Switching between the two never loses your edits either way.

## Getting the result out

Buttons along the bottom of the panel:

| Button | What it does |
|---|---|
| **Copy as Table (TSV)** | Copies tab-separated text — paste into Excel/Sheets and it lands in real columns |
| **Copy as Text** | Same content, tabs collapsed to spaces — for a plain text destination |
| **Copy as Markdown** | A GitHub-flavored Markdown table — for Notion, GitHub, docs |
| **Download CSV** | Saves a real `.csv` file, with a UTF-8 marker so Hebrew text opens correctly in Excel instead of as garbled characters |
| **↻ Recapture** | Re-runs the exact same screenshot → crop → OCR pass on the same area, without re-dragging. Appears right after any single-region capture; auto-highlights with a gentle pulse when the capture failed or the confidence chip reads below 70%, since those are the two moments trying again is most likely to help. Disappears once you've used "Add Capture" below, so it can never overwrite rows from a different region by accident. |
| **+ Add Capture** | Starts another drag-selection *without closing this panel* — its rows get added to the bottom of the table you already have. Use this for a table taller than one screen: capture the top half, Add Capture, scroll, capture the bottom half — one merged table at the end. |
| **New Area** | Starts a completely fresh capture, replacing everything in this panel |

`Ctrl+Enter` anywhere in the panel is a shortcut for "Copy as Table."
`Esc` closes the panel (or cancels an in-progress drag-selection).

Then switch to Excel/Sheets and paste (`Ctrl+V`) — the content lands in
real rows and columns, not one long line of text.

## Reusing your last capture area on a site

If "Remember the last capture area per website" is on under Settings →
Behavior (it is by default), Extractify remembers the position and size
of your last drag-selected rectangle on each site you capture from —
never the content, just the rectangle. Start a fresh capture (toolbar
icon, shortcut, or right-click → "Capture Area") on a site you've
captured on before, and next to the usual "Drag to select…" hint you'll
see "↻ Press Enter to reuse the last area captured on this site." Press
Enter to capture that exact area instantly, or just start dragging as
usual to ignore it and pick a new one. Settings → Behavior also has a
"Clear saved areas" button that wipes everything remembered for every
site at once.

## Settings

Right-click the toolbar icon → **Options**, or open `chrome://extensions`
→ Extractify's card → **Extension options**. From there:

- **Interface language** — the EN/עב toggle in the top-right corner,
  switches this whole page (and the capture panel) instantly, including
  right-to-left layout for Hebrew.
- **OCR Recognition Languages** — which languages the recognizer expects
  to see. More languages loaded means slightly slower recognition; turn
  off one you never capture to speed things up.
- **Column Sensitivity** — Loose / Normal / Tight. If two columns keep
  merging into one, increase sensitivity (Tight). If one column keeps
  splitting into two, decrease it (Loose).
- **Behavior → Automatically copy the result** — off by default. Turn it
  on to skip clicking "Copy as Table" every time; the table copies to
  your clipboard the instant recognition finishes.
- **Security & Privacy** — an expandable list explaining exactly what
  every permission Extractify requests is for, in plain language, plus
  what happens to your data (nothing leaves your device — see
  `PRIVACY.md` for the full policy).
- **Test OCR Engine** — runs a real recognition pass on a small built-in
  test image (never touches your actual screen). Worth running once
  right after installing, to confirm the OCR engine loads correctly on
  your machine.
- **Help & FAQ** and **About** — common questions, and the current
  version number.

## Updating to a newer version

No Chrome Web Store auto-update (it's a private ZIP), but no full
reinstall needed either — unless the internal folder layout changed
(check `CHANGELOG.md`; that's called out explicitly when it happens):

1. Extract the new ZIP **over** the same folder you originally used —
   not a new folder.
2. `chrome://extensions` → click the reload icon (↻) on Extractify's
   card.
3. Your settings carry over automatically, and a short "Extractify was
   just updated to vX.X.X" banner confirms it landed, on the Settings
   page.

## Uninstalling

`chrome://extensions` → find Extractify's card → **Remove**. You can then
delete the folder you extracted the ZIP into.
