const DEFAULT_SETTINGS = {
  uiLang: "en",
  languages: ["heb", "eng"],
  columnSensitivity: "normal",
  autoCopy: false,
  rememberRegions: true,
};

const SAVED_REGIONS_KEY = "capturedRegions"; // must match src/content/content.js

const STATE = { uiLang: "en" };
function T(key, vars) {
  return ExtractifyI18n.t(STATE.uiLang, key, vars);
}

const langHeb = document.getElementById("lang-heb");
const langEng = document.getElementById("lang-eng");
const sensitivityInputs = document.querySelectorAll('input[name="sensitivity"]');
const autoCopyInput = document.getElementById("auto-copy");
const rememberRegionsInput = document.getElementById("remember-regions");
const clearRegionsBtn = document.getElementById("clear-regions-btn");
const clearRegionsStatus = document.getElementById("clear-regions-status");
const saveBtn = document.getElementById("save-btn");
const resetBtn = document.getElementById("reset-btn");
const statusEl = document.getElementById("save-status");
const shortcutsLink = document.getElementById("shortcuts-link");
const shortcutHintEl = document.getElementById("shortcut-hint");
const subtitleEl = document.getElementById("subtitle-version");
const aboutVersionEl = document.getElementById("about-version");
const testBtn = document.getElementById("test-btn");
const testResult = document.getElementById("test-result");
const langButtons = document.querySelectorAll(".lang-btn");
const updateBanner = document.getElementById("update-banner");
const updateBannerText = document.getElementById("update-banner-text");
const updateBannerClose = document.getElementById("update-banner-close");

const VERSION = chrome.runtime.getManifest().version;
const SHORTCUT_DISPLAY = "Ctrl+Shift+K (⌘+Shift+K on Mac)";

function applyTranslations() {
  document.documentElement.lang = STATE.uiLang;
  document.documentElement.dir = ExtractifyI18n.dirFor(STATE.uiLang);
  document.title = T("optionsTitle");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = T(el.getAttribute("data-i18n"));
  });

  subtitleEl.textContent = T("subtitleVersion", { version: VERSION });
  aboutVersionEl.textContent = T("aboutVersion", { version: VERSION });
  shortcutHintEl.textContent = T("secShortcutHint", { shortcut: SHORTCUT_DISPLAY });
  refreshClearRegionsBtn();

  langButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === STATE.uiLang);
  });

  if (!updateBanner.hidden && STATE.pendingUpdateVersion) {
    updateBannerText.textContent = T("updateBanner", { version: STATE.pendingUpdateVersion });
  }
}

function applyToForm(settings) {
  langHeb.checked = settings.languages.includes("heb");
  langEng.checked = settings.languages.includes("eng");
  sensitivityInputs.forEach((input) => {
    input.checked = input.value === settings.columnSensitivity;
  });
  autoCopyInput.checked = !!settings.autoCopy;
  rememberRegionsInput.checked = settings.rememberRegions !== false;
}

function readForm() {
  const languages = [];
  if (langHeb.checked) languages.push("heb");
  if (langEng.checked) languages.push("eng");
  const sensitivity = [...sensitivityInputs].find((i) => i.checked)?.value || "normal";
  return {
    uiLang: STATE.uiLang,
    languages: languages.length ? languages : ["eng"], // never allow zero languages
    columnSensitivity: sensitivity,
    autoCopy: autoCopyInput.checked,
    rememberRegions: rememberRegionsInput.checked,
  };
}

// ---- Per-site remembered capture areas ----
// Shows how many sites currently have a saved area (0 disables the button)
// and keeps the count fresh after every clear. The count itself is read
// fresh each time rather than cached, since content.js writes to this same
// storage key independently while this settings page may still be open.
function refreshClearRegionsBtn() {
  chrome.storage.local.get([SAVED_REGIONS_KEY], (res) => {
    const count = Object.keys(res[SAVED_REGIONS_KEY] || {}).length;
    clearRegionsBtn.textContent = T("clearRegionsBtn", { count });
    clearRegionsBtn.disabled = count === 0;
  });
}

clearRegionsBtn.addEventListener("click", () => {
  chrome.storage.local.remove(SAVED_REGIONS_KEY, () => {
    refreshClearRegionsBtn();
    clearRegionsStatus.textContent = T("clearRegionsStatus");
    setTimeout(() => {
      if (clearRegionsStatus.textContent === T("clearRegionsStatus")) clearRegionsStatus.textContent = "";
    }, 2200);
  });
});

function load() {
  chrome.storage.local.get(["settings"], (res) => {
    const settings = Object.assign({}, DEFAULT_SETTINGS, res.settings || {});
    STATE.uiLang = ExtractifyI18n.normalizeLang(settings.uiLang);
    applyToForm(settings);
    applyTranslations();
  });
}

function showStatus(text) {
  statusEl.textContent = text;
  setTimeout(() => {
    if (statusEl.textContent === text) statusEl.textContent = "";
  }, 2200);
}

function setLanguage(lang) {
  STATE.uiLang = ExtractifyI18n.normalizeLang(lang);
  applyTranslations();
  const settings = readForm();
  chrome.storage.local.set({ settings });
}

langButtons.forEach((btn) => {
  btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
});

saveBtn.addEventListener("click", () => {
  const settings = readForm();
  chrome.storage.local.set({ settings }, () => showStatus(T("savedStatus")));
});

resetBtn.addEventListener("click", () => {
  chrome.storage.local.set({ settings: DEFAULT_SETTINGS }, () => {
    STATE.uiLang = DEFAULT_SETTINGS.uiLang;
    applyToForm(DEFAULT_SETTINGS);
    applyTranslations();
    showStatus(T("resetStatus"));
  });
});

// Extension pages can't reliably navigate directly to chrome:// URLs via a
// plain <a href> click; open it through the tabs API instead.
shortcutsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

// ---- One-time "just updated" banner ----
// background.js records this in chrome.storage.local (reason: 'update' in
// onInstalled). We read it once, show it, and immediately clear it so it
// doesn't reappear the next time Settings is opened — but keep the version
// number in memory for this page's own lifetime so a language switch can
// still re-render the banner text correctly.
chrome.storage.local.get(["updateNotice"], (res) => {
  if (res.updateNotice?.version) {
    STATE.pendingUpdateVersion = res.updateNotice.version;
    updateBanner.hidden = false;
    updateBannerText.textContent = T("updateBanner", { version: STATE.pendingUpdateVersion });
    chrome.storage.local.remove("updateNotice");
  }
});
updateBannerClose.addEventListener("click", () => { updateBanner.hidden = true; });

// ---- OCR engine self-test ----
// Draws a small built-in test image (never touches the user's screen),
// runs it through the exact same OCR + table-reconstruction code path
// content.js uses (via the shared lib/snaptable-ocr.js), and reports
// pass/fail. This is a real functional check: if the bundled Tesseract.js
// files fail to load/fetch on this machine, this is where it shows up.
function drawTestImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 70;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.font = "bold 34px Arial, sans-serif";
  ctx.textBaseline = "middle";
  // Two number groups with a wide gap: digits OCR reliably regardless of
  // which language pack is loaded, and the gap exercises the same
  // column-detection heuristic used on real tables.
  ctx.fillText("4217", 20, 38);
  ctx.fillText("9080", 300, 38);
  return canvas.toDataURL("image/png");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

async function runSelfTest() {
  testBtn.disabled = true;
  testResult.hidden = false;
  testResult.className = "test-result";
  testResult.textContent = T("testStarting");

  const settings = readForm();
  const t0 = performance.now();
  let worker;
  try {
    worker = await SnapTableOCR.createOcrWorker(settings.languages, (m) => {
      if (m?.status) {
        testResult.textContent = `${m.status} — ${Math.round((m.progress || 0) * 100)}%`;
      }
    });

    const imageDataUrl = drawTestImage();
    testResult.textContent = T("testRecognizing");
    const { data } = await worker.recognize(imageDataUrl, {}, { text: true, blocks: true });
    const result = SnapTableOCR.buildTsv(data, settings.columnSensitivity);
    const elapsed = Math.round(performance.now() - t0);

    const rawText = (data.text || "").replace(/\s+/g, " ").trim();
    const pass = rawText.includes("4217") && rawText.includes("9080");
    const colsOk = result.isTable && result.colCount >= 2;
    const langsLabel = settings.languages.map((l) => T(l === "heb" ? "langHeb" : "langEng")).join(" + ");

    testResult.className = "test-result " + (pass ? "is-pass" : "is-fail");
    testResult.innerHTML = `
      <div class="test-result-title">${pass ? T("testPassTitle") : T("testFailTitle")}</div>
      <div>${T("testElapsed", { ms: elapsed, langs: langsLabel })}</div>
      <div>${T("testRecognizedText")} <code>${escapeHtml(rawText || "—")}</code></div>
      <div>${T("testColumnDetection")} ${colsOk ? T("testColumnsOk", { cols: result.colCount }) : T("testColumnsFail")}</div>
      ${result.confidence != null ? `<div>${T("chipConfidence", { pct: result.confidence })}</div>` : ""}
      ${pass ? "" : `<div>${T("testFailHint")}</div>`}
    `;
  } catch (err) {
    const elapsed = Math.round(performance.now() - t0);
    testResult.className = "test-result is-fail";
    testResult.innerHTML = `
      <div class="test-result-title">${T("testErrorTitle")}</div>
      <div>${T("testElapsedToFail", { ms: elapsed })}</div>
      <div>${escapeHtml(err?.message || String(err))}</div>
    `;
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch (_) { /* already gone */ }
    }
    testBtn.disabled = false;
  }
}

testBtn.addEventListener("click", runSelfTest);

load();
