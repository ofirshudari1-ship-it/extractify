# Chrome Web Store Listing — Extractify

Not currently published (private ZIP distribution — see `README.md`). This
doc exists per `STANDARDS.md` §8/§9 so the listing text and required
assets are ready in one place if that ever changes, without blocking on it.

## Short description (≤132 chars)

- **EN:** Turn any screenshot into a real spreadsheet table — offline,
  on-device OCR. Select an area, get columns, paste into Excel.
- **HE:** הופכים כל צילום מסך לטבלה אמיתית — OCR מקומי לגמרי, אופליין.
  מסמנים אזור, מקבלים עמודות, מדביקים ל-Excel.

## Full description

### EN

Extractify selects a region of your screen — or a single image via
right-click — reads the text with an on-device neural-network OCR engine
(Tesseract.js, Hebrew + English), rebuilds rows and columns from where the
words actually sit, and hands you an editable table ready to paste into
Excel, Google Sheets, or Notion. Nothing you capture ever leaves your
computer: there's no server, no account, no analytics, and no AI API of
any kind — see `PRIVACY.md` for the full policy.

Highlights:
- Fully offline OCR — works with no internet connection
- Editable spreadsheet-style result grid — fix a cell before copying
- AI confidence score on every result, so you know when to double-check
- "Add Capture" merges multiple captures (a table taller than one screen)
  into a single table
- "Recapture" re-runs a capture on the same area with one click — no
  re-dragging, auto-highlighted when confidence is low
- Remembers your last capture area per website for instant reuse
  (opt-out anytime; position/size only, never content)
- Copy as Table (TSV), Markdown, or plain text — or download as CSV
- Fully bilingual interface (English / Hebrew) with live RTL switching

### HE

Extractify מסמן אזור על המסך שלכם — או תמונה בודדת דרך לחיצה ימנית —
קורא את הטקסט באמצעות מנוע OCR מבוסס רשת נוירונים שרץ במכשיר
(Tesseract.js, עברית + אנגלית), בונה מחדש שורות ועמודות לפי המיקום
האמיתי של המילים, ומעביר לכם טבלה ניתנת לעריכה שמוכנה להדבקה ל-Excel,
Google Sheets, או Notion. שום דבר שאתם מצלמים לא יוצא מהמחשב שלכם: אין
שרת, אין חשבון, אין אנליטיקס, ואין שום API של AI — ראו `PRIVACY.md`
למדיניות המלאה.

נקודות עיקריות:
- OCR לגמרי אופליין — עובד בלי חיבור לאינטרנט
- רשת תוצאה ניתנת לעריכה בסגנון גיליון אלקטרוני — תקנו תא לפני העתקה
- ציון ביטחון AI על כל תוצאה, כדי שתדעו מתי כדאי לבדוק שוב
- "Add Capture" ממזג כמה צילומים (טבלה שארוכה מגובה מסך אחד) לטבלה אחת
- "Recapture" מריץ מחדש צילום על אותו אזור בלחיצה אחת — בלי לגרור מחדש,
  מודגש אוטומטית כשהביטחון נמוך
- זוכר את אזור הצילום האחרון לכל אתר לשימוש חוזר מיידי (אפשר לכבות
  בכל עת; רק מיקום/גודל, לעולם לא תוכן)
- העתקה כטבלה (TSV), Markdown, או טקסט רגיל — או הורדה כ-CSV
- ממשק דו-לשוני מלא (אנגלית/עברית) עם מעבר RTL חי

## Category

Productivity

## Permissions justification (for the store review form)

Full line-by-line justification lives in the extension's own Settings
page (Security & Privacy section) and `SPEC.md` — summarized:

| Permission | Why |
|---|---|
| `activeTab` | Read/interact with the current tab only when the user explicitly triggers a capture |
| `scripting` | Inject the selection overlay and result panel on capture |
| `storage` | Save user preferences locally (`chrome.storage.local`, never synced) |
| `clipboardWrite` | Copy the recognized result when the user clicks a copy button (or opts into auto-copy) |
| `contextMenus` | Build the right-click "Capture Area" / "Extract Table from This Image" entries |
| `offscreen` | Run the OCR engine in a page immune to a website's own Content-Security-Policy |
| `host_permissions: <all_urls>` | Capture and image-extraction must work on whichever site the user is on — not a fixed list |

## Required visual assets — deferred, not blocking

Per §8: 1-5 screenshots at 1280×800, one promo tile at 440×280. **Not
produced yet** — this extension is not Store-published, so there's no
review queue waiting on them. If/when publishing is decided, capture:
1. The drag-selection overlay mid-drag over a real table
2. The result panel in Grid mode with a few edited cells
3. The Settings page's Security & Privacy section
4. The bilingual toggle (English vs. Hebrew RTL) side by side
Generate the promo tile from the same brand gradient (indigo `#4F46E5` →
violet `#7C3AED`) used throughout the extension's own UI and the landing
page, for visual consistency.
