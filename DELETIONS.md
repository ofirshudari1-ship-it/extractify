# DELETIONS.md

Log of every file/folder removed from this project, with reason. Per
`_AUDIT/STANDARDS.md`'s hard rule: logged here first; only removed once it's
unambiguously reconstructible build output, or after explicit approval.

## 2026-09-14 — STANDARDS.md compliance pass (folder restructure)

**Restructured, not deleted** (content preserved 100%, only moved — listed
here for transparency since the old paths disappear):
- `extension/background.js` → `src/background/background.js`
- `extension/content/*` → `src/content/*`
- `extension/options/*` → `src/options/*`
- `extension/offscreen/*` → `src/offscreen/*`
- `extension/welcome/*` → `src/welcome/*`
- `extension/lib/*` → `src/shared/*`
- `extension/icons/*` → `assets/icons/*`
- `extension/manifest.json` → `manifest.json` (project root)
- `test/*` → `tests/*`
- `make-icons.ps1` → `build/make-icons.ps1`
- Empty `extension/` and `test/` directories removed after their contents
  moved out (nothing left inside them).

Reason: `STANDARDS.md` §1 mandates a specific Chrome-extension folder layout
(`manifest.json` at root, `src/{background,content,options,offscreen,
welcome,shared}`, `assets/icons`, `_locales/`, `build/` for dev-only
scripts) instead of everything nested one level under a generic
`extension/` folder. All internal path references (manifest.json,
background.js script-injection paths, `chrome.runtime.getURL()` calls,
`<script src>`/`<img src>` tags) were updated to match and re-verified
against the real running extension code (both dev test harnesses re-run
successfully after the move — OCR pipeline test: PASS; panel UI test:
grid renders, icon loads from the new `assets/icons/` path).

**Actually deleted** (superseded build output, safe to remove without
separate approval per the "fully reconstructible" exemption):
- `Extractify.zip` (6,567,963 bytes, built 2026-09-13) — the old flat
  extension package, from before the folder restructure above. Fully
  superseded by `Extractify-v1.10.0.zip` (built fresh from the current
  `manifest.json` + `src/` + `assets/` + `_locales/`, same source content,
  just re-packaged with the new internal paths and the standards-mandated
  `<ExtName>-v<version>.zip` naming). Reconstructible at any time by
  re-running the zip build step against the current source tree.
