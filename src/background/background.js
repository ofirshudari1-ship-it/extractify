// Extractify – background service worker
// Responsibilities: react to toolbar/shortcut trigger, inject content script,
// capture the visible tab on request (only background has that permission),
// hold default settings, and set the toolbar tooltip in the user's chosen
// interface language.

importScripts("../shared/extractify-i18n.js");

const DEFAULT_SETTINGS = {
  uiLang: "en", // interface language: 'en' (default) | 'he'
  languages: ["heb", "eng"], // OCR languages to load, in order
  columnSensitivity: "normal", // 'loose' | 'normal' | 'tight'
  autoCopy: false, // copy the table to the clipboard as soon as recognition finishes
  rememberRegions: true, // remember the last drag-captured rect per site, for one-click reuse
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    chrome.tabs.create({ url: chrome.runtime.getURL("src/welcome/welcome.html") });
  } else if (details.reason === "update") {
    // Unpacked extensions update by the user overwriting the folder and
    // clicking "Reload" in chrome://extensions — this fires just like a
    // Web Store update would. Record it so Settings can show a one-time
    // "updated to vX" banner without wiping the user's existing settings
    // (chrome.storage.local already survives the reload on its own).
    await chrome.storage.local.set({
      updateNotice: {
        version: chrome.runtime.getManifest().version,
        previousVersion: details.previousVersion || null,
      },
    });
  }
  updateActionTitle();
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => createContextMenus());

// Context menu items persist across service-worker sleep/wake, but not
// reliably across every possible restart path — removeAll-then-create is
// the standard defensive pattern so we never hit a "duplicate id" error.
async function createContextMenus() {
  const { settings } = await chrome.storage.local.get(["settings"]);
  const lang = ExtractifyI18n.normalizeLang(settings?.uiLang);
  chrome.contextMenus.removeAll(() => {
    // contexts: ["all"] is deliberate here, not a leftover default - "Capture
    // Area" is a general drag-to-select screenshot trigger that's equally
    // relevant no matter what's under the cursor (page, link, selected text,
    // an image), unlike a context-specific action that only makes sense in
    // one of those. See SPEC.md v1.10.1+ for the full reasoning.
    chrome.contextMenus.create({
      id: "tablify-capture-area",
      title: ExtractifyI18n.t(lang, "ctxCaptureArea"),
      contexts: ["all"],
    });
    chrome.contextMenus.create({
      id: "tablify-extract-image",
      title: ExtractifyI18n.t(lang, "ctxExtractImage"),
      contexts: ["image"],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "tablify-capture-area") {
    startCapture(tab);
  } else if (info.menuItemId === "tablify-extract-image") {
    extractFromImage(tab, info.srcUrl);
  }
});

// Right-click "Extract Table from This Image": the image is already exactly
// the region we want, so we skip drag-selection and screenshotting entirely.
// Fetching happens here (not in the content script) because the background
// service worker's fetch() is covered by our host_permissions and isn't
// subject to the page's own CORS restrictions the way a content-script fetch
// would be.
async function extractFromImage(tab, srcUrl) {
  if (!tab || !tab.id || !srcUrl) return;
  warmOcrEngine(); // overlaps the ~1-2s OCR engine load with the fetch below
  try {
    const response = await fetch(srcUrl);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);

    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["src/content/overlay.css"] });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/shared/extractify-i18n.js", "src/content/content.js"],
    });
    await chrome.tabs.sendMessage(tab.id, { type: "SNAPTABLE_EXTRACT_IMAGE", dataUrl });
  } catch (err) {
    console.error("Extractify: failed to extract table from image", err);
    flashUnsupportedPageBadge();
  }
}

function blobToDataUrl(blob) {
  return blob.arrayBuffer().then((buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return `data:${blob.type || "image/png"};base64,${btoa(binary)}`;
  });
}

async function updateActionTitle() {
  const { settings } = await chrome.storage.local.get(["settings"]);
  const lang = ExtractifyI18n.normalizeLang(settings?.uiLang);
  await chrome.action.setTitle({ title: ExtractifyI18n.t(lang, "actionTitle") });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) {
    updateActionTitle();
    createContextMenus();
  }
});

updateActionTitle();

// Chrome never allows script injection into chrome://, the Web Store, or the
// extension gallery — there's no way around that. We can't show an in-page
// message there either (no content script can run), so the best available
// feedback is a brief badge flash telling the user why nothing happened.
async function flashUnsupportedPageBadge() {
  await chrome.action.setBadgeBackgroundColor({ color: "#E0507A" });
  await chrome.action.setBadgeText({ text: "!" });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1800);
}

async function startCapture(tab) {
  if (!tab || !tab.id || !/^(https?|file):/.test(tab.url || "")) {
    flashUnsupportedPageBadge();
    return;
  }
  // Overlaps the OCR engine's ~1-2s WASM+language load with the time the
  // user spends dragging a selection, so it's usually already warm by the
  // time there's actually an image to recognize. Best-effort only: a real
  // capture still creates the worker itself if this doesn't win the race
  // (e.g. a very fast drag, or this being the very first capture ever).
  warmOcrEngine();
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["src/content/overlay.css"],
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      // content.js only needs ExtractifyI18n for its UI strings now - actual
      // OCR runs in the offscreen document (see ensureOffscreenDocument),
      // not here, so Tesseract itself never has to load into the page's
      // isolated world at all.
      files: ["src/shared/extractify-i18n.js", "src/content/content.js"],
    });
    await chrome.tabs.sendMessage(tab.id, { type: "SNAPTABLE_START" });
  } catch (err) {
    console.error("Extractify: failed to start capture", err);
    flashUnsupportedPageBadge();
  }
}

chrome.action.onClicked.addListener((tab) => startCapture(tab));

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "capture-area") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  startCapture(tab);
});

// Content script cannot call captureVisibleTab itself (host-permission API
// that only privileged contexts get), so it asks the background for a
// screenshot of the currently visible viewport.
//
// OCR itself also can't run in the content script: a Worker created there
// inherits the CSP of whatever page it's running on, and sites with a
// strict `worker-src`/`script-src` policy block it outright (seen in the
// wild: "Failed to construct 'Worker': Script at 'chrome-extension://...'
// cannot be accessed from origin '<site>'"). The fix is the offscreen
// document below, which runs under the extension's own CSP no matter what
// page triggered the capture.
let offscreenReady = null;

function ensureOffscreenDocument() {
  if (!offscreenReady) {
    offscreenReady = chrome.runtime
      .getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] })
      .then((existing) => {
        if (existing.length > 0) return;
        return chrome.offscreen.createDocument({
          url: "src/offscreen/offscreen.html",
          reasons: ["WORKERS"],
          justification: "Run Tesseract.js OCR in a Worker isolated from the host page's CSP",
        });
      })
      .catch((err) => {
        offscreenReady = null; // allow retry on next request
        throw err;
      });
  }
  return offscreenReady;
}

// Fire-and-forget: creates the offscreen document (if needed) and asks it to
// start loading a Tesseract worker for the user's current OCR languages
// *before* there's actually an image to recognize. Tesseract's own worker
// creation (WASM core + language data) is the slowest part of a capture by
// far, and it doesn't depend on the screenshot at all, so there's no reason
// to wait until after cropping to start it. See offscreen.js's getWorker()
// for how a real recognize request that arrives while this is still loading
// safely reuses it instead of starting a second, redundant one.
async function warmOcrEngine() {
  try {
    await ensureOffscreenDocument();
    const { settings } = await chrome.storage.local.get(["settings"]);
    const languages = settings?.languages?.length ? settings.languages : DEFAULT_SETTINGS.languages;
    chrome.runtime.sendMessage({ type: "TABLIFY_WARM_ENGINE", languages }).catch(() => {});
  } catch (err) {
    // Purely an optimization - a real capture will create the worker itself
    // if warming didn't get there first, so there's nothing to surface here.
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SNAPTABLE_CAPTURE_VISIBLE") {
    const windowId = sender.tab?.windowId;
    chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true, dataUrl });
    });
    return true; // keep the message channel open for the async response
  }

  if (message?.type === "TABLIFY_RECOGNIZE_REQUEST") {
    const tabId = sender.tab?.id;
    (async () => {
      try {
        await ensureOffscreenDocument();
        const response = await chrome.runtime.sendMessage({
          type: "TABLIFY_OFFSCREEN_RECOGNIZE",
          dataUrl: message.dataUrl,
          languages: message.languages,
          columnSensitivity: message.columnSensitivity,
          tabId,
        });
        sendResponse(response);
      } catch (err) {
        sendResponse({ ok: false, error: err?.message || String(err) });
      }
    })();
    return true;
  }

  if (message?.type === "TABLIFY_OFFSCREEN_PROGRESS" && message.tabId) {
    chrome.tabs.sendMessage(message.tabId, { type: "SNAPTABLE_PROGRESS", progress: message.progress });
    return false;
  }
});
