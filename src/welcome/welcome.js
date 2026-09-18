const STATE = { uiLang: "en" };
function T(key, vars) {
  return ExtractifyI18n.t(STATE.uiLang, key, vars);
}

const langButtons = document.querySelectorAll(".lang-btn");
const step1Body = document.getElementById("step1-body");
const openSettingsBtn = document.getElementById("open-settings-btn");
const gotItBtn = document.getElementById("got-it-btn");

const SHORTCUT_DISPLAY = "Ctrl+Shift+K";

function applyTranslations() {
  document.documentElement.lang = STATE.uiLang;
  document.documentElement.dir = ExtractifyI18n.dirFor(STATE.uiLang);
  document.title = T("productName") + " – " + T("tagline");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = T(el.getAttribute("data-i18n"));
  });
  step1Body.textContent = T("welcomeStep1Body", { shortcut: SHORTCUT_DISPLAY });

  langButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === STATE.uiLang);
  });
}

function setLanguage(lang) {
  STATE.uiLang = ExtractifyI18n.normalizeLang(lang);
  applyTranslations();
  // Keep this in sync with whatever the user picks here, so Settings and
  // the capture panel open in the same language right away.
  chrome.storage.local.get(["settings"], (res) => {
    const settings = Object.assign(
      { uiLang: "en", languages: ["heb", "eng"], columnSensitivity: "normal" },
      res.settings || {},
      { uiLang: STATE.uiLang }
    );
    chrome.storage.local.set({ settings });
  });
}

langButtons.forEach((btn) => btn.addEventListener("click", () => setLanguage(btn.dataset.lang)));

openSettingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
gotItBtn.addEventListener("click", () => window.close());

chrome.storage.local.get(["settings"], (res) => {
  STATE.uiLang = ExtractifyI18n.normalizeLang(res.settings?.uiLang);
  applyTranslations();
});
