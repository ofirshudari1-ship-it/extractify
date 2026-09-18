# Release Checklist — Extractify

Run through this before calling any version "done" — per
`_AUDIT/STANDARDS.md` §10 (Definition of Done) and §14.5, filtered to what
actually applies to a Chrome extension (the Windows-installer items in the
shared standard don't apply here — this is a plain unpacked-extension ZIP,
not an `.exe`).

## Before touching code

- [ ] Read `CHANGELOG.md`'s most recent entry — know what actually changed
      since the last release, so this pass isn't guessing.

## Version sync (all four, same commit, never staggered)

- [ ] `manifest.json` → `"version"` bumped
- [ ] `CHANGELOG.md` → new entry added (Added/Changed/Fixed/Removed)
- [ ] `SPEC.md` → new section added *if functionality changed* (a pure
      compliance/refactor pass still gets a short section explaining why)
- [ ] `README.md` → version number in the intro line updated; usage
      section updated if any button/setting/flow changed

## Build (run `build\build.ps1`, don't skip straight to zipping by hand)

- [ ] `manifest.json` + both `_locales/*/messages.json` parse as valid JSON
- [ ] All 7 hand-written JS files pass `node --check`
- [ ] English/Hebrew translation keys match exactly (the build script
      fails loudly if they don't — if it does, find the missing key
      before doing anything else)
- [ ] `Extractify-v<version>.zip` rebuilt at the project root, old
      versioned zip removed first (the build script does this — verify
      only one `Extractify-v*.zip` exists in the root afterward)
- [ ] Zip contents spot-checked: `manifest.json` at the archive root,
      only `manifest.json`/`src/`/`assets/`/`_locales/` inside — no
      `tests/`, `store/`, `build/`, or root-level docs

## Functional verification (through the real UI, not just syntax)

Use `tests/harness.html` (real OCR engine, no extension context needed)
and `tests/panel-ui-harness.html` (full capture-panel UI with a chrome
shim) — see each file's own header comment for how to serve them locally.

- [ ] `tests/harness.html` → status reads `PASS`
- [ ] `tests/panel-ui-harness.html` → panel opens, grid renders with the
      canned result, icon loads from `assets/icons/`
- [ ] If anything in the capture/recognition pipeline changed: manually
      load the extension via **Load unpacked** and run one real capture
      against an actual on-screen table, not just the mocked harness
- [ ] Settings page **Run Test** button passes (loads the real OCR
      engine, not mocked)
- [ ] Language toggle (EN ⇄ עב) checked on both the Settings page and a
      captured result panel — RTL layout, not just translated text
- [ ] Dark mode checked (OS-level dark mode, or DevTools' rendering
      emulation) — panel, Settings page, and Welcome page all still
      readable and on-brand, not just "not broken"

## Security & privacy (re-check every release, not just once)

- [ ] `grep -rn "eval(\|new Function("` across `src/` (excluding the
      third-party `tesseract*`/`worker.min.js` bundles) → nothing found
- [ ] No hardcoded secrets/API keys/tokens anywhere in `src/`
- [ ] No `<script src="http...">` (remote code) in any HTML file
- [ ] `manifest.json` permissions list still matches what's actually
      used and justified in the Settings page's Security & Privacy
      section and `store/STORE_LISTING.md` — if a permission was added
      or removed, both of those need updating too
- [ ] If any new data collection/handling was introduced: `PRIVACY.md`
      updated *before* the release ships, not after

## Folder cleanliness

- [ ] Project root contains only: `manifest.json`, the one versioned
      zip, `CHANGELOG.md`/`SPEC.md`/`README.md`/`PRIVACY.md`/`EULA.md`/
      `USER-GUIDE.md`/`RELEASE-CHECKLIST.md`/`DELETIONS.md`, and the
      mandated folders (`src/`, `assets/`, `_locales/`, `tests/`,
      `store/`, `site/`, `build/`)
- [ ] No duplicate zips, no `.bak` files, no leftover debug/test files
      created while working on this release
- [ ] Anything removed this release is logged in `DELETIONS.md` first

## Final

- [ ] This checklist itself was actually followed, not just read
