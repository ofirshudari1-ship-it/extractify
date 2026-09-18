// Extractify – shared translation strings, used by the options page and the
// in-page capture panel. English is the default/fallback language; Hebrew is
// a full second translation the user can switch to from Settings. This is a
// small hand-rolled i18n layer (not chrome.i18n) because it needs to be
// switchable at runtime from inside the extension's own Settings UI, not
// tied to the browser's system language.

(function (global) {
  const STRINGS = {
    en: {
      productName: "Extractify",
      tagline: "Screenshot → Text / Table",
      actionTitle: "Extractify – click to capture an area",
      ctxCaptureArea: "Capture Area",
      ctxExtractImage: "Extract Table from This Image",

      // content script — selection overlay
      selectHint: "Drag to select an area to scan · Esc to cancel",

      // content script — result panel
      panelTitle: "Extractify",
      close: "Close",
      chipSensitivity: "Column sensitivity: {level}",
      chipConfidence: "AI confidence: {pct}%",
      placeholderText: "Recognized text will appear here…",
      copyTable: "Copy as Table (TSV)",
      copyText: "Copy as Text",
      copyMarkdown: "Copy as Markdown",
      downloadCsv: "Download CSV",
      addCapture: "+ Add Capture",
      addCaptureHint: "Capture another area and add its rows to this table (instead of starting over)",
      newArea: "New Area",
      recaptureBtn: "↻ Recapture",
      recaptureHint: "Re-run the capture on the exact same area — useful if the page was still loading, or the result looks off",
      reuseRegionHint: "↻ Press Enter to reuse the last area captured on this site",

      gridModeLabel: "Grid",
      textModeLabel: "Text",
      addRow: "+ Row",
      addColumn: "+ Column",
      deleteRow: "Delete row",
      deleteColumn: "Delete column",
      toastDownloaded: "Downloaded as extractify-table.csv",

      statusCropping: "Cropping and preparing image…",
      statusRecognizing: "Recognizing text (OCR)…",
      statusTableResult: "Table detected: {rows} rows · up to {cols} columns. Edit before copying.",
      statusTextResult: "Text recognized (no clear column structure). Edit before copying.",
      statusAppended: "Added {rows} more row(s) — {total} total now. Edit before copying.",

      progressLoadingCore: "Loading OCR engine…",
      progressInitEngine: "Starting OCR engine…",
      progressLoadingLang: "Loading language data…",
      progressInitApi: "Preparing recognition…",
      progressRecognizing: "Recognizing text…",
      progressGeneric: "Processing…",

      toastCopied: "Copied! Paste into Excel or Google Sheets.",
      toastCopyFailed: "Copy failed — select the text and copy manually.",

      errorCaptureFailed: "Screenshot failed: {error}",
      errorPrefix: "Error: {error}",
      errorEngineLoad: "Couldn't load the OCR engine files. Try refreshing the page and trying again.",
      errorPermission: "No permission to capture this page (e.g. chrome:// pages or the extension store).",
      errorBusy: "Still recognizing the previous capture — wait for it to finish first.",
      errorUnknown: "Unknown error",

      sensitivityLoose: "Loose",
      sensitivityNormal: "Normal",
      sensitivityTight: "Tight",
      langHeb: "Hebrew",
      langEng: "English",

      // options page
      optionsTitle: "Extractify Settings",
      subtitleVersion: "Screenshot → Text / Table · v{version}",

      updateBanner: "Extractify was just updated to v{version}. Your settings were kept.",

      secUiLangTitle: "Interface Language",
      secUiLangHint: "Language for this settings page and the capture panel. Doesn't affect what languages OCR can read — that's below.",
      uiLangEn: "English",
      uiLangHe: "עברית (Hebrew)",

      secOcrLangTitle: "OCR Recognition Languages",
      secOcrLangHint: "Pick the languages that appear in the areas you'll capture. More languages loaded = slightly slower recognition.",
      langCheckHeb: "Hebrew",
      langCheckEng: "English",

      secSensitivityTitle: "Column Sensitivity",
      secSensitivityHint: "Controls how wide a gap between words must be to count as a new table column. If columns merge together, increase sensitivity (Tight). If one column splits into too many, decrease it (Loose).",
      sensitivityLooseDesc: "Loose – fewer columns, fewer false splits",
      sensitivityNormalDesc: "Normal (recommended)",
      sensitivityTightDesc: "Tight – more columns, good for dense tables",

      secBehaviorTitle: "Behavior",
      secBehaviorHint: "Fine-tune what happens right after a capture finishes recognizing.",
      autoCopyLabel: "Automatically copy the result as a table when recognition finishes",
      autoCopyHint: "Skips the extra click on \"Copy as Table\" — useful if you paste into the same spreadsheet over and over.",

      rememberRegionsLabel: "Remember the last capture area per website",
      rememberRegionsHint: "Next time you start a capture on a site you've used before, press Enter right after to instantly reuse that area instead of dragging again. Only the rectangle's position and size are stored on this device — never a screenshot or any recognized text.",
      clearRegionsBtn: "Clear saved areas ({count})",
      clearRegionsStatus: "Cleared ✓",

      secSecurityTitle: "Security & Privacy",
      secSecurityIntro: "Extractify uses an on-device AI engine (a neural-network-based OCR model, not a cloud AI) to recognize text. Everything happens locally in your browser — no server, no account, no analytics, nothing to sign up for.",
      secSecurityDataNote: "Your settings (interface language, OCR languages, column sensitivity) are saved only on this device (chrome.storage.local). They are never synced through your Google account, even if Chrome Sync is turned on — a deliberate choice, not a limitation. Screenshots and recognized text are processed in memory only and are never written to disk or sent anywhere.",
      secSecurityPermsTitle: "Why does it need these permissions?",
      permActiveTabName: "activeTab",
      permActiveTabWhy: "Lets Extractify see and capture only the tab you're currently using, and only when you click its icon or press the keyboard shortcut — never in the background, never on tabs you haven't asked it to look at.",
      permScriptingName: "scripting",
      permScriptingWhy: "Lets Extractify inject its selection tool and result panel into the page you're capturing from.",
      permStorageName: "storage",
      permStorageWhy: "Saves your settings on this device (see above) — nothing else.",
      permClipboardName: "clipboardWrite",
      permClipboardWhy: "Lets the \"Copy\" buttons in the result panel put text on your clipboard when you click them.",
      permContextMenusName: "contextMenus",
      permContextMenusWhy: "Adds the right-click menu options (\"Capture Area\", \"Extract Table from This Image\").",
      permOffscreenName: "offscreen",
      permOffscreenWhy: "Runs the OCR engine on a hidden extension page that isn't subject to the security policy of the site you're capturing from — see the FAQ below for why that matters.",
      permHostName: "Access to all websites",
      permHostWhy: "Needed so capture and the right-click menu work on any site you visit, and so a right-clicked image can be fetched for OCR regardless of which site it's on. This is broad by necessity, but nothing is ever sent off your device as a result of it — recognition always happens locally.",

      secTestTitle: "Test OCR Engine",
      secTestHint: "Runs real OCR on a built-in test image (nothing on your screen is captured) to confirm the offline engine loads and works correctly on this computer.",
      testBtn: "Run Test",
      testStarting: "Starting…",
      testRecognizing: "Recognizing text in the test image…",
      testPassTitle: "✅ Engine works correctly",
      testFailTitle: "⚠️ Recognition didn't match what was expected",
      testErrorTitle: "⚠️ Test failed",
      testElapsed: "Time: {ms}ms · Languages: {langs}",
      testElapsedToFail: "Time to failure: {ms}ms",
      testRecognizedText: "Recognized text:",
      testColumnDetection: "Column structure detected:",
      testColumnsOk: "Yes ({cols} columns)",
      testColumnsFail: "Not detected",
      testFailHint: "Try refreshing this page and running the test again. If it keeps failing, try reinstalling the extension — a file may have been corrupted when extracting the ZIP.",

      secShortcutTitle: "Keyboard Shortcut & Right-Click",
      secShortcutHint: "Default shortcut is {shortcut}. You can start a capture any of these ways:",
      triggerToolbar: "Click the toolbar icon",
      triggerRightClick: "Right-click anywhere on the page → “Capture Area”",
      triggerRightClickImage: "Right-click directly on an image → “Extract Table from This Image” (no need to drag-select)",
      shortcutLinkBtn: "Open keyboard shortcut settings (to change it)",

      secHelpTitle: "Help & FAQ",
      faqQ1: "The recognized text has mistakes — is that normal?",
      faqA1: "Yes, OCR (text recognition) is never 100% perfect, especially on blurry, small, or low-contrast text, or unusual fonts. That's exactly why the result panel is editable — fix it there before copying.",
      faqQ2: "Columns are merged together, or split into too many.",
      faqA2: "Open Settings and adjust Column Sensitivity (above). “Tight” creates more column breaks; “Loose” creates fewer. You can also just fix the tabs manually in the result panel's text box.",
      faqQ3: "Nothing happens when I click the toolbar icon.",
      faqA3: "Extractify can't run on chrome:// pages, the Chrome Web Store, or other browser-internal pages — that's a Chrome restriction, not a bug. The toolbar icon briefly flashes red on those pages to let you know.",
      faqQ4: "“Copy” doesn't seem to do anything.",
      faqA4: "Some pages restrict clipboard access. If the toast notification doesn't appear, select the text in the panel manually and copy it with Ctrl+C / Cmd+C.",
      faqQ5: "How do I update to a newer version?",
      faqA5: "Extract the new ZIP over the existing folder (overwrite the files), then click the reload icon (↻) on Extractify's card at chrome://extensions. Your settings are kept — no need to remove and reinstall.",
      faqQ6: "Does anything leave my computer?",
      faqA6: "No. OCR runs fully offline inside your browser — screenshots and recognized text are never uploaded anywhere.",
      faqQ7: "Why does it need access to every website, and an unusual-sounding \"offscreen\" permission?",
      faqA7: "Some sites set a strict security policy that blocks the OCR engine from starting directly on the page (you'd see an error like \"Failed to construct 'Worker'\"). The \"offscreen\" permission lets Extractify run OCR on a hidden page of its own instead, immune to that site's policy — so recognition keeps working everywhere. \"Access to all websites\" is what lets the capture tool and this fix apply on any site you visit, not a fixed list. See Security & Privacy above for what every permission is used for.",
      faqQ8: "Why did it copy something without me clicking Copy?",
      faqA8: "You turned on \"Automatically copy the result as a table when recognition finishes\" under Behavior above. Turn it back off there if you'd rather copy manually each time.",

      secAboutTitle: "About",
      aboutVersion: "Version {version}",
      aboutPrivacy: "Extractify runs 100% offline: no screenshots, recognized text, or usage data ever leave your computer. No account, no server, no tracking.",

      saveBtn: "Save",
      resetBtn: "Reset to Defaults",
      savedStatus: "Saved ✓",
      resetStatus: "Reset to defaults ✓",

      // welcome / first-run page
      welcomeEyebrow: "Welcome to",
      welcomeSubtitle: "Turn any part of your screen into a real, pasteable table using on-device AI — no cloud, no account, fully offline.",
      welcomeStep1Title: "1. Start a capture",
      welcomeStep1Body: "Click the toolbar icon, press {shortcut}, or right-click anywhere on a page and choose “Capture Area.” Right-click directly on an image to extract it instantly, no dragging needed.",
      welcomeStep2Title: "2. Drag to select",
      welcomeStep2Body: "Drag a rectangle over the text or table you want — a dashboard, a screenshot in an email, anything visible on screen.",
      welcomeStep3Title: "3. Review & copy",
      welcomeStep3Body: "Extractify recognizes the text offline (Hebrew + English) and shows it in an editable panel. Fix anything OCR got wrong, then click “Copy as Table.”",
      welcomeStep4Title: "4. Paste anywhere",
      welcomeStep4Body: "Paste (Ctrl+V) into Excel or Google Sheets — the text lands in real columns and rows, not one big cell.",
      welcomeCta: "Open Settings",
      welcomeGotIt: "Got it, let's go",
      welcomePrivacyNote: "Everything above runs locally in your browser. Nothing is ever uploaded.",
    },

    he: {
      productName: "Extractify",
      tagline: "צילום מסך ← טקסט/טבלה",
      actionTitle: "Extractify – לחצו כדי לצלם אזור",
      ctxCaptureArea: "צילום אזור",
      ctxExtractImage: "חילוץ טבלה מהתמונה הזו",

      selectHint: "גררו לבחירת אזור לזיהוי טקסט · Esc לביטול",

      panelTitle: "Extractify",
      close: "סגור",
      chipSensitivity: "רגישות עמודות: {level}",
      chipConfidence: "ביטחון AI: {pct}%",
      placeholderText: "הטקסט המזוהה יופיע כאן…",
      copyTable: "העתק כטבלה (TSV)",
      copyText: "העתק כטקסט",
      copyMarkdown: "העתק כ-Markdown",
      downloadCsv: "הורדת CSV",
      addCapture: "+ הוספת צילום",
      addCaptureHint: "צילום אזור נוסף והוספת השורות שלו לטבלה הזו (במקום להתחיל מחדש)",
      newArea: "אזור חדש",
      recaptureBtn: "↻ צילום מחדש",
      recaptureHint: "מריץ שוב את הצילום על אותו אזור בדיוק — שימושי אם הדף עדיין נטען, או שהתוצאה נראית לא מדויקת",
      reuseRegionHint: "↻ הקישו Enter לשימוש חוזר באזור האחרון שצולם באתר הזה",

      gridModeLabel: "רשת",
      textModeLabel: "טקסט",
      addRow: "+ שורה",
      addColumn: "+ עמודה",
      deleteRow: "מחיקת שורה",
      deleteColumn: "מחיקת עמודה",
      toastDownloaded: "הורד כקובץ extractify-table.csv",

      statusCropping: "חותך ומכין תמונה…",
      statusRecognizing: "מזהה טקסט (OCR)…",
      statusTableResult: "זוהתה טבלה: {rows} שורות · עד {cols} עמודות. ניתן לערוך לפני העתקה.",
      statusTextResult: "זוהה טקסט (ללא מבנה עמודות ברור). ניתן לערוך לפני העתקה.",
      statusAppended: "נוספו {rows} שורות נוספות — סה״כ {total} עכשיו. ניתן לערוך לפני העתקה.",

      progressLoadingCore: "טוען מנוע OCR…",
      progressInitEngine: "מאתחל מנוע OCR…",
      progressLoadingLang: "טוען נתוני שפה…",
      progressInitApi: "מכין זיהוי…",
      progressRecognizing: "מזהה טקסט…",
      progressGeneric: "מעבד…",

      toastCopied: "הועתק! ניתן להדביק ב-Excel או Google Sheets.",
      toastCopyFailed: "ההעתקה נכשלה — סמנו והעתיקו ידנית.",

      errorCaptureFailed: "צילום המסך נכשל: {error}",
      errorPrefix: "שגיאה: {error}",
      errorEngineLoad: "לא ניתן היה לטעון את קבצי מנוע ה-OCR. נסו לרענן את הדף ולנסות שוב.",
      errorPermission: "אין הרשאה לצלם את הדף הזה (למשל דפי chrome:// או חנות התוספים).",
      errorBusy: "עדיין מזהה את הצילום הקודם — צריך לחכות שיסתיים קודם.",
      errorUnknown: "שגיאה לא ידועה",

      sensitivityLoose: "רפויה",
      sensitivityNormal: "רגילה",
      sensitivityTight: "הדוקה",
      langHeb: "עברית",
      langEng: "אנגלית",

      optionsTitle: "הגדרות Extractify",
      subtitleVersion: "צילום מסך ← טקסט/טבלה · גרסה {version}",

      updateBanner: "Extractify עודכן לגרסה {version}. ההגדרות שלך נשמרו.",

      secUiLangTitle: "שפת הממשק",
      secUiLangHint: "שפה לעמוד ההגדרות ולפאנל הצילום. לא משפיע על אילו שפות ה-OCR מזהה – זה למטה.",
      uiLangEn: "English (אנגלית)",
      uiLangHe: "עברית",

      secOcrLangTitle: "שפות זיהוי (OCR)",
      secOcrLangHint: "בחרו את השפות שקיימות באזורים שתצלמו. יותר שפות = זיהוי איטי מעט יותר.",
      langCheckHeb: "עברית",
      langCheckEng: "אנגלית",

      secSensitivityTitle: "רגישות זיהוי עמודות",
      secSensitivityHint: "קובע איזה מרווח בין מילים ייחשב כעמודה חדשה. אם עמודות מתמזגות – הגבירו רגישות (הדוקה). אם עמודה אחת מתפצלת ליותר מדי – הורידו (רפויה).",
      sensitivityLooseDesc: "רפויה – פחות עמודות, פחות פיצולים שגויים",
      sensitivityNormalDesc: "רגילה (מומלץ)",
      sensitivityTightDesc: "הדוקה – יותר עמודות, מתאימה לטבלאות צפופות",

      secBehaviorTitle: "התנהגות",
      secBehaviorHint: "כיוונון של מה שקורה מיד אחרי שהזיהוי מסתיים.",
      autoCopyLabel: "העתקה אוטומטית של התוצאה כטבלה כשהזיהוי מסתיים",
      autoCopyHint: "חוסך את הלחיצה הנוספת על \"העתק כטבלה\" — שימושי אם מדביקים שוב ושוב לאותו גיליון.",

      rememberRegionsLabel: "זכירת אזור הצילום האחרון לכל אתר",
      rememberRegionsHint: "בפעם הבאה שמתחילים צילום באתר שכבר צילמתם בו בעבר, הקישו Enter מיד כדי להשתמש שוב באותו אזור במקום לגרור מחדש. נשמרים רק מיקום וגודל המלבן על המכשיר הזה — לעולם לא צילום מסך או טקסט מזוהה.",
      clearRegionsBtn: "ניקוי אזורים שמורים ({count})",
      clearRegionsStatus: "נוקה ✓",

      secSecurityTitle: "אבטחה ופרטיות",
      secSecurityIntro: "Extractify משתמש במנוע AI מקומי (מודל OCR מבוסס רשת נוירונים, לא בינה מלאכותית בענן) לזיהוי טקסט. הכול קורה מקומית בדפדפן שלך – בלי שרת, בלי חשבון, בלי אנליטיקס, שום דבר שצריך להירשם אליו.",
      secSecurityDataNote: "ההגדרות שלך (שפת ממשק, שפות OCR, רגישות עמודות) נשמרות רק על המחשב הזה (chrome.storage.local). הן לעולם לא מסתנכרנות דרך חשבון Google שלך, גם אם Chrome Sync דלוק – זו בחירה מכוונת, לא מגבלה. צילומי מסך וטקסט מזוהה מעובדים בזיכרון בלבד ואף פעם לא נשמרים לדיסק או נשלחים לשום מקום.",
      secSecurityPermsTitle: "למה זה צריך את ההרשאות האלה?",
      permActiveTabName: "activeTab",
      permActiveTabWhy: "מאפשר ל-Extractify לראות ולצלם רק את הטאב שבו אתה נמצא כרגע, ורק כשלוחצים על הסמל שלו או על קיצור המקלדת – לעולם לא ברקע, לעולם לא בטאבים שלא ביקשת.",
      permScriptingName: "scripting",
      permScriptingWhy: "מאפשר ל-Extractify להזריק את כלי הבחירה ואת פאנל התוצאה לתוך העמוד שממנו אתה מצלם.",
      permStorageName: "storage",
      permStorageWhy: "שומר את ההגדרות שלך על המחשב הזה (ראו למעלה) – שום דבר אחר.",
      permClipboardName: "clipboardWrite",
      permClipboardWhy: "מאפשר לכפתורי \"העתק\" בפאנל התוצאה להעתיק טקסט ללוח כשלוחצים עליהם.",
      permContextMenusName: "contextMenus",
      permContextMenusWhy: "מוסיף את אפשרויות התפריט בלחיצה ימנית (\"צילום אזור\", \"חילוץ טבלה מהתמונה הזו\").",
      permOffscreenName: "offscreen",
      permOffscreenWhy: "מריץ את מנוע ה-OCR בעמוד תוסף נסתר שלא כפוף למדיניות האבטחה של האתר שממנו אתה מצלם – ראו בשאלות הנפוצות למטה למה זה חשוב.",
      permHostName: "גישה לכל האתרים",
      permHostWhy: "נדרש כדי שהצילום ותפריט הלחיצה הימנית יעבדו בכל אתר שאתה מבקר בו, וכדי שאפשר יהיה לשלוף תמונה שנלחצה עליה ימנית לצורך OCR, ללא קשר לאתר שבו היא נמצאת. זו הרשאה רחבה מטבעה, אבל שום דבר לעולם לא נשלח החוצה בעקבותיה – הזיהוי תמיד קורה מקומית.",

      secTestTitle: "בדיקת מנוע OCR",
      secTestHint: "מריץ זיהוי אמיתי על תמונת בדיקה מובנית (בלי לצלם כלום מהמסך שלך) – כדי לוודא שמנוע ה-OCR האופליין נטען ועובד תקין על המחשב הזה.",
      testBtn: "הרצת בדיקה",
      testStarting: "מתחיל…",
      testRecognizing: "מזהה טקסט בתמונת הבדיקה…",
      testPassTitle: "✅ המנוע עובד תקין",
      testFailTitle: "⚠️ הזיהוי לא תואם לצפוי",
      testErrorTitle: "⚠️ הבדיקה נכשלה",
      testElapsed: "זמן ריצה: {ms}ms · שפות: {langs}",
      testElapsedToFail: "זמן עד לכשל: {ms}ms",
      testRecognizedText: "טקסט שזוהה:",
      testColumnDetection: "זיהוי מבנה עמודות:",
      testColumnsOk: "כן ({cols} עמודות)",
      testColumnsFail: "לא זוהה",
      testFailHint: "נסו לרענן את דף ההגדרות ולהריץ שוב. אם זה חוזר על עצמו, נסו להתקין מחדש את התוסף – ייתכן שקובץ נפגם בחילוץ מה-ZIP.",

      secShortcutTitle: "קיצור מקלדת ולחיצה ימנית",
      secShortcutHint: "קיצור ברירת המחדל הוא {shortcut}. אפשר להתחיל צילום בכל אחת מהדרכים האלה:",
      triggerToolbar: "לחיצה על סמל התוסף בסרגל הכלים",
      triggerRightClick: "לחיצה ימנית בכל מקום בעמוד ← \"צילום אזור\"",
      triggerRightClickImage: "לחיצה ימנית ישירות על תמונה ← \"חילוץ טבלה מהתמונה הזו\" (בלי צורך לגרור בחירה)",
      shortcutLinkBtn: "פתיחת הגדרות קיצורי מקלדת (לשינוי)",

      secHelpTitle: "עזרה ושאלות נפוצות",
      faqQ1: "בטקסט שזוהה יש טעויות – זה נורמלי?",
      faqA1: "כן, זיהוי טקסט (OCR) מעולם לא מושלם ב-100%, במיוחד על טקסט מטושטש, קטן או בניגודיות נמוכה. בדיוק לכך הפאנל ניתן לעריכה – תקנו שם לפני העתקה.",
      faqQ2: "עמודות מתמזגות, או מתפצלות ליותר מדי.",
      faqA2: "פתחו את ההגדרות וכוונו את רגישות עמודות (למעלה). ניתן גם פשוט לתקן ידנית את ה-Tab בתיבת הטקסט בפאנל התוצאה.",
      faqQ3: "לא קורה כלום כשלוחץ על סמל התוסף.",
      faqA3: "Extractify לא יכול לרוץ על דפי chrome://, חנות התוספים של כרום, או דפים פנימיים אחרים – זו מגבלה של כרום, לא באג. סמל התוסף יבהב באדום לרגע קצר בדפים כאלה.",
      faqQ4: "נראה ש\"העתקה\" לא עושה כלום.",
      faqA4: "דפים מסוימים מגבילים גישה ללוח. אם ההתראה לא מופיעה, סמנו את הטקסט בפאנל ידנית והעתיקו עם Ctrl+C.",
      faqQ5: "איך מעדכנים לגרסה חדשה?",
      faqA5: "חלצו את ה-ZIP החדש מעל התיקייה הקיימת (דריסה על הקבצים), ואחר-כך לחצו על סמל הרענון (↻) בכרטיס של Extractify ב-chrome://extensions. ההגדרות שלך נשמרות – אין צורך להסיר ולהתקין מחדש.",
      faqQ6: "האם משהו יוצא מהמחשב שלי?",
      faqA6: "לא. ה-OCR רץ לגמרי אופליין בתוך הדפדפן – צילומי מסך וטקסט מזוהה אף פעם לא עולים לשום מקום. אין חשבון, אין שרת, אין מעקב.",
      faqQ7: "למה זה צריך גישה לכל אתר, והרשאה מוזרה בשם \"offscreen\"?",
      faqA7: "אתרים מסוימים מגדירים מדיניות אבטחה מחמירה שחוסמת את מנוע ה-OCR מלהתחיל ישירות בעמוד (הייתם רואים שגיאה כמו \"Failed to construct 'Worker'\"). הרשאת \"offscreen\" מאפשרת ל-Extractify להריץ את ה-OCR בעמוד נסתר משלו במקום זאת, חסין מהמדיניות של האתר – כך שהזיהוי ממשיך לעבוד בכל מקום. \"גישה לכל האתרים\" היא מה שמאפשר לכלי הצילום ולתיקון הזה לפעול בכל אתר שתבקרו בו, לא רשימה קבועה. ראו אבטחה ופרטיות למעלה למה כל הרשאה משמשת.",
      faqQ8: "למה זה העתיק משהו בלי שלחצתי על העתקה?",
      faqA8: "הדלקתם את \"העתקה אוטומטית של התוצאה כטבלה כשהזיהוי מסתיים\" תחת התנהגות למעלה. כבו אותה שם אם אתם מעדיפים להעתיק ידנית בכל פעם.",

      secAboutTitle: "אודות",
      aboutVersion: "גרסה {version}",
      aboutPrivacy: "Extractify רץ 100% אופליין: צילומי מסך, טקסט מזוהה או נתוני שימוש אף פעם לא יוצאים מהמחשב שלך. בלי חשבון, בלי שרת, בלי מעקב.",

      saveBtn: "שמירה",
      resetBtn: "איפוס לברירת מחדל",
      savedStatus: "נשמר ✓",
      resetStatus: "אופס לברירת מחדל ✓",

      welcomeEyebrow: "ברוכים הבאים ל-",
      welcomeSubtitle: "הופכים כל חלק מהמסך לטבלה אמיתית שאפשר להדביק, בעזרת AI מקומי – בלי ענן, בלי חשבון, לגמרי אופליין.",
      welcomeStep1Title: "1. מתחילים צילום",
      welcomeStep1Body: "לחצו על סמל התוסף, הקישו {shortcut}, או לחצו לחיצה ימנית בכל מקום בעמוד ובחרו \"צילום אזור\". לחיצה ימנית ישירות על תמונה מחלצת אותה מיד, בלי צורך לגרור.",
      welcomeStep2Title: "2. גוררים לבחירה",
      welcomeStep2Body: "גוררים מלבן מעל הטקסט או הטבלה שרוצים – דשבורד, צילום מסך במייל, כל דבר שרואים על המסך.",
      welcomeStep3Title: "3. בודקים ומעתיקים",
      welcomeStep3Body: "Extractify מזהה את הטקסט אופליין (עברית + אנגלית) ומציג אותו בפאנל לעריכה. מתקנים מה שה-OCR פספס, ולוחצים \"העתק כטבלה\".",
      welcomeStep4Title: "4. מדביקים בכל מקום",
      welcomeStep4Body: "מדביקים (Ctrl+V) ל-Excel או Google Sheets – הטקסט נכנס לעמודות ושורות אמיתיות, לא לתא אחד גדול.",
      welcomeCta: "פתיחת הגדרות",
      welcomeGotIt: "הבנתי, בואו נתחיל",
      welcomePrivacyNote: "כל מה שלמעלה רץ מקומית בדפדפן. שום דבר לא מועלה לשום מקום.",
    },
  };

  function t(lang, key, vars) {
    const dict = STRINGS[lang] || STRINGS.en;
    let s = dict[key] ?? STRINGS.en[key] ?? key;
    if (vars) {
      for (const k in vars) {
        s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      }
    }
    return s;
  }

  function normalizeLang(lang) {
    return lang === "he" ? "he" : "en";
  }

  function dirFor(lang) {
    return lang === "he" ? "rtl" : "ltr";
  }

  global.ExtractifyI18n = { t, normalizeLang, dirFor, STRINGS };
})(typeof window !== "undefined" ? window : this);
