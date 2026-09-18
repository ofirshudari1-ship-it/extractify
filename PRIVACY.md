# Privacy Policy — Extractify

_Last updated: 2026-09-15 · Version 1.11.0_

## English

**Single purpose.** Extractify has exactly one purpose: let you select a
region of your screen (or right-click an image) and turn the text in it
into a table or plain text you can paste elsewhere. Every permission it
requests exists only to serve that one purpose — see the "Security &
Privacy" section inside the extension's own Settings page for a
line-by-line justification of each one.

**What data Extractify processes.** The pixels of the screen region or
image you explicitly select when you trigger a capture. Nothing else —
Extractify does not read page content, browsing history, cookies, or any
other tab in the background.

**Where that data goes: nowhere but your own device.** Recognition runs
entirely on-device, inside a Tesseract.js neural-network OCR engine
compiled to WebAssembly and bundled with the extension itself
(`src/shared/`). Extractify makes **zero network requests** of its own —
it has no server, no analytics, no crash reporting, no third-party SDK,
and no AI API of any kind (not Claude, not OpenAI, not anything). The
captured image and the recognized text exist only in memory for the
duration of that one capture and are never written to disk, logged, or
transmitted anywhere. Because no data is ever sent off-device, Google's
"Limited Use" disclosure requirements for remote AI processing do not
apply — there is no remote processing to disclose.

**What is stored, and where.** Your own preferences — interface language,
OCR languages, column sensitivity, and the auto-copy toggle — saved via
`chrome.storage.local`. **Since v1.11.0**, if "Remember the last capture
area per website" is left on (the default), Extractify also stores the
*position and size* of your last drag-selected rectangle for each website
you capture from, keyed by that site's hostname, so a later capture on the
same site can offer to reuse it instead of making you drag again. This is
coordinates only (a few numbers per site) — never a screenshot, never
recognized text, and never anything about what was on the page. You can
turn this off or clear everything already saved from Settings → Behavior
at any time. Either way, all of this is local to your device only and is
**never** synced through your Google account, even if Chrome Sync is
turned on for everything else. Uninstalling the extension removes this
data along with it.

**Changes to this policy.** If a future version ever changes what data is
collected or how it's handled, that change will be disclosed here and in
`CHANGELOG.md` before the update ships — not silently.

**Contact.** This is a privately distributed extension (not published on
the Chrome Web Store); questions go to whoever gave you the ZIP file.

---

## עברית

**מטרה יחידה.** ל-Extractify יש מטרה אחת בדיוק: לאפשר לכם לסמן אזור
במסך (או ללחוץ ימני על תמונה) ולהפוך את הטקסט שבו לטבלה או טקסט רגיל
שאפשר להדביק במקום אחר. כל הרשאה שהתוסף מבקש קיימת רק כדי לשרת את
המטרה היחידה הזו — ראו את סעיף "אבטחה ופרטיות" בתוך עמוד ההגדרות של
התוסף עצמו להצדקה שורה-אחר-שורה של כל אחת.

**אילו נתונים Extractify מעבד.** הפיקסלים של אזור המסך או התמונה
שסימנתם במפורש כשהתחלתם צילום. שום דבר אחר — Extractify לא קורא תוכן
עמוד, היסטוריית גלישה, עוגיות, או כל כרטיסייה אחרת ברקע.

**לאן הנתונים האלה הולכים: לשום מקום מלבד המחשב שלכם.** הזיהוי רץ
לגמרי במכשיר, בתוך מנוע OCR מבוסס רשת נוירונים (Tesseract.js) שמקומפל
ל-WebAssembly וארוז בתוך התוסף עצמו (`src/shared/`). ל-Extractify
**אפס בקשות רשת** משל עצמו — אין שרת, אין אנליטיקס, אין דיווח קריסות,
אין SDK של צד שלישי, ואין שום API של AI (לא Claude, לא OpenAI, שום דבר).
התמונה שצולמה והטקסט שזוהה קיימים רק בזיכרון למשך הצילום הבודד ההוא,
ולעולם לא נכתבים לדיסק, נרשמים בלוג, או נשלחים לשום מקום. מכיוון ששום
נתון לעולם לא יוצא מהמכשיר, דרישות הגילוי של גוגל ל"שימוש מוגבל"
(Limited Use) לעיבוד AI מרוחק לא רלוונטיות — אין עיבוד מרוחק לגלות עליו.

**מה נשמר, ואיפה.** ההעדפות שלכם — שפת ממשק, שפות OCR, רגישות עמודות,
ומתג ההעתקה האוטומטית — נשמרות דרך `chrome.storage.local`. **החל מגרסה
1.11.0**, אם "זכירת אזור הצילום האחרון לכל אתר" דלוק (ברירת המחדל),
Extractify גם שומר את *המיקום והגודל* של המלבן האחרון שגררתם לכל אתר
שצילמתם ממנו, לפי שם המתחם (hostname) של האתר, כדי שצילום הבא באותו
אתר יוכל להציע להשתמש בו שוב במקום לגרור מחדש. אלו רק קואורדינטות
(כמה מספרים לכל אתר) — לעולם לא צילום מסך, לעולם לא טקסט מזוהה, ולעולם
לא שום דבר על מה שהיה בעמוד. אפשר לכבות את זה או לנקות הכול מההגדרות ←
התנהגות בכל רגע. בכל מקרה, כל זה מקומי למכשיר שלכם בלבד, ו**לעולם לא**
מסתנכרן דרך חשבון Google, גם אם Chrome Sync דלוק לכל השאר. הסרת התוסף
מוחקת את הנתונים האלה יחד איתו.

**שינויים במדיניות הזו.** אם גרסה עתידית אי-פעם תשנה אילו נתונים
נאספים או איך הם מטופלים, זה יגולה כאן וב-`CHANGELOG.md` **לפני** שהעדכון
יוצא — לא בשקט.

**יצירת קשר.** זהו תוסף בהפצה פרטית (לא מפורסם בחנות תוספי כרום); שאלות
מופנות למי שנתן לכם את קובץ ה-ZIP.
