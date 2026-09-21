// Extractify – content script
// Draws a drag-to-select overlay, asks the background worker for a screenshot
// of the visible viewport, crops it to the selection, runs it through
// Tesseract.js (bundled locally, runs fully offline) and shows an editable
// preview the user can copy as a tab-separated table (pastes as real columns
// in Excel / Google Sheets) or as plain text. All UI text goes through the
// shared ExtractifyI18n dictionary (English by default, Hebrew when chosen in
// Settings) so it stays in sync with the options page.

if (window.__snaptableActive) {
  // Content script already injected earlier in this page's lifetime.
  // The listener registered below is still alive and will handle the
  // SNAPTABLE_START message that triggered this re-injection.
} else {
  window.__snaptableActive = true;

  const STATE = {
    uiLang: "en",
    root: null,
    selectionBox: null,
    sizeLabel: null,
    dragStart: null,
    panel: null, // currently open result panel (only one at a time)
    panelApi: null, // the object showPanel() returns, for routing SNAPTABLE_PROGRESS
    lastPanelPos: null, // {left, top} remembered across captures on this page
    busy: false, // true while a capture is being cropped/recognized
    lastRect: null, // {left, top, width, height} of the most recent drag capture - powers "Recapture"
    savedRegionForReuse: null, // a per-site remembered region offered during the current selection, if any
    kbdBox: null, // {left, top, width, height} of the keyboard-adjustable selection box, while active
    kbdHintEl: null, // the second line inside the selection hint that shows keyboard instructions
  };

  // Per-site "remember this area" store, keyed by hostname. Lets a user who
  // scrapes the same dashboard/report daily skip re-dragging the selection
  // every time - press Enter right after starting a capture to reuse the
  // last area captured on this exact site. Never leaves the device (same
  // chrome.storage.local as every other setting) and holds only rectangle
  // coordinates, never captured content.
  const SAVED_REGIONS_KEY = "capturedRegions";
  const MAX_SAVED_REGIONS = 40;

  function getSavedRegion(hostname) {
    return new Promise((resolve) => {
      if (!hostname) {
        resolve(null);
        return;
      }
      chrome.storage.local.get([SAVED_REGIONS_KEY], (res) => {
        resolve(res[SAVED_REGIONS_KEY]?.[hostname] || null);
      });
    });
  }

  function saveRegion(hostname, rect) {
    if (!hostname) return;
    chrome.storage.local.get([SAVED_REGIONS_KEY], (res) => {
      const all = res[SAVED_REGIONS_KEY] || {};
      delete all[hostname]; // re-insert at the end so eviction is least-recently-used
      all[hostname] = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      const keys = Object.keys(all);
      if (keys.length > MAX_SAVED_REGIONS) delete all[keys[0]];
      chrome.storage.local.set({ [SAVED_REGIONS_KEY]: all });
    });
  }

  // A region saved on a previous visit may no longer fit today's viewport
  // (window resized, page layout changed) - clamp it back into bounds rather
  // than handing captureAndRecognize a rect that hangs off the edge, and bail
  // out entirely if what's left is too small to be useful.
  function fitRegionToViewport(region) {
    const maxW = window.innerWidth;
    const maxH = window.innerHeight;
    const left = Math.min(Math.max(0, region.left), Math.max(0, maxW - 20));
    const top = Math.min(Math.max(0, region.top), Math.max(0, maxH - 20));
    const width = Math.min(region.width, maxW - left);
    const height = Math.min(region.height, maxH - top);
    if (width < 6 || height < 6) return null;
    return { left, top, width, height };
  }

  // Attached once for the page's whole lifetime (not per-selection) so Esc
  // and Ctrl+Enter keep working once the selection overlay is gone and only
  // the result panel remains open - previously this was attached/detached
  // per selection, which meant Esc silently did nothing while a panel was
  // showing.
  document.addEventListener("keydown", onGlobalKeyDown, true);

  function onGlobalKeyDown(e) {
    if (e.key === "Escape") {
      if (STATE.root) cleanupSelectionOverlay();
      else if (STATE.panel) closePanel();
      return;
    }
    if (!e.ctrlKey && !e.metaKey && e.key === "Enter" && STATE.root && !STATE.dragStart) {
      // Only offered while the selection overlay is up and nothing has been
      // mouse-dragged yet - once dragging starts, Enter has no special
      // meaning. Three things Enter can mean here, checked in priority
      // order: reuse a saved region if one was offered, confirm an
      // already-active keyboard selection box, or (the mouse-free entry
      // point into capturing at all) start one.
      e.preventDefault();
      if (STATE.savedRegionForReuse) {
        useSavedRegion();
      } else if (STATE.kbdBox) {
        confirmKeyboardSelection();
      } else {
        startKeyboardSelection();
      }
      return;
    }
    if (STATE.kbdBox && !STATE.dragStart && e.key.startsWith("Arrow")) {
      e.preventDefault();
      adjustKeyboardBox(e);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && STATE.panel) {
      e.preventDefault();
      STATE.panel.el.querySelector('[data-action="copy-table"]')?.click();
    }
  }

  // ---- Keyboard-only region selection ----
  // The core interaction (drag a rectangle with the mouse) has no keyboard
  // equivalent by nature, so this is the accessible alternative: a box of a
  // sensible default size appears centered in the viewport, movable with the
  // arrow keys and resizable with Shift + arrow keys, confirmed with Enter
  // and cancelled with Esc (already handled above via cleanupSelectionOverlay,
  // which also clears STATE.kbdBox). Reuses the same .snaptable-selection
  // box/label elements and rect shape captureAndRecognize() already expects,
  // so nothing downstream needs to know whether a region came from a mouse
  // drag or the keyboard.
  const KBD_STEP = 16;
  const KBD_STEP_LARGE = 48; // Alt+Arrow, for covering more ground quickly

  function startKeyboardSelection() {
    if (!STATE.root) return;
    const width = Math.max(60, Math.min(360, Math.round(window.innerWidth * 0.5)));
    const height = Math.max(60, Math.min(220, Math.round(window.innerHeight * 0.4)));
    STATE.kbdBox = {
      left: Math.round((window.innerWidth - width) / 2),
      top: Math.round((window.innerHeight - height) / 2),
      width,
      height,
    };

    const box = document.createElement("div");
    box.className = "snaptable-selection snaptable-selection-kbd";
    STATE.root.appendChild(box);
    STATE.selectionBox = box;

    const label = document.createElement("div");
    label.className = "snaptable-size-label";
    STATE.root.appendChild(label);
    STATE.sizeLabel = label;

    renderKeyboardBox();
    if (STATE.kbdHintEl) STATE.kbdHintEl.textContent = T("kbdSelectionActiveHint");
  }

  function renderKeyboardBox() {
    const { left, top, width, height } = STATE.kbdBox;
    Object.assign(STATE.selectionBox.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
    Object.assign(STATE.sizeLabel.style, { left: `${left}px`, top: `${top}px` });
    STATE.sizeLabel.textContent = `${Math.round(width)} × ${Math.round(height)}`;
  }

  function adjustKeyboardBox(e) {
    const box = STATE.kbdBox;
    const step = e.altKey ? KBD_STEP_LARGE : KBD_STEP;
    const maxW = window.innerWidth;
    const maxH = window.innerHeight;
    if (e.shiftKey) {
      // Resize, anchored at the box's current top-left corner.
      if (e.key === "ArrowRight") box.width = Math.min(maxW - box.left, box.width + step);
      else if (e.key === "ArrowLeft") box.width = Math.max(24, box.width - step);
      else if (e.key === "ArrowDown") box.height = Math.min(maxH - box.top, box.height + step);
      else if (e.key === "ArrowUp") box.height = Math.max(24, box.height - step);
    } else {
      // Move, clamped so the box can never be dragged off-screen.
      if (e.key === "ArrowRight") box.left = Math.min(maxW - box.width, box.left + step);
      else if (e.key === "ArrowLeft") box.left = Math.max(0, box.left - step);
      else if (e.key === "ArrowDown") box.top = Math.min(maxH - box.height, box.top + step);
      else if (e.key === "ArrowUp") box.top = Math.max(0, box.top - step);
    }
    renderKeyboardBox();
  }

  async function confirmKeyboardSelection() {
    const rect = Object.assign({}, STATE.kbdBox);
    STATE.kbdBox = null;
    const append = STATE.appendMode;
    STATE.appendMode = false;
    cleanupSelectionOverlay();
    await captureAndRecognize(rect, { append });
  }

  function T(key, vars) {
    return ExtractifyI18n.t(STATE.uiLang, key, vars);
  }

  function langLabel(code) {
    if (code === "heb") return T("langHeb");
    if (code === "eng") return T("langEng");
    return code;
  }

  function sensitivityLabel(level) {
    const key = "sensitivity" + (level ? level[0].toUpperCase() + level.slice(1) : "Normal");
    return T(key);
  }

  chrome.runtime.onMessage.addListener((message) => {
    // The keyboard shortcut and the right-click menu both reach here
    // directly from background.js - unlike the in-panel buttons, they have
    // no idea a capture is already being recognized. Without this guard,
    // triggering either one mid-recognition would call beginSelection()
    // with no append intent, which closes the panel a still-in-flight
    // "Add Capture" request is about to try to update - silently losing
    // that capture into a detached, invisible panel.
    if (
      (message?.type === "SNAPTABLE_START" || message?.type === "SNAPTABLE_EXTRACT_IMAGE") &&
      STATE.busy
    ) {
      showToast(T("errorBusy"), true);
      return;
    }
    if (message?.type === "SNAPTABLE_START") {
      getSettings().then(() => beginSelection());
    } else if (message?.type === "SNAPTABLE_EXTRACT_IMAGE" && message.dataUrl) {
      getSettings().then((settings) => recognizeDirectImage(message.dataUrl, settings));
    } else if (message?.type === "SNAPTABLE_PROGRESS") {
      STATE.panelApi?.setProgress(message.progress);
    }
  });

  // Right-click → "Extract Table from This Image": the image is already
  // exactly the region we want, so this skips drag-selection and the
  // hide-overlay/screenshot/crop dance that captureAndRecognize() needs.
  async function recognizeDirectImage(dataUrl, settings) {
    STATE.lastRect = null; // no on-page rect behind a right-clicked image - "Recapture" doesn't apply
    const panel = showPanel(settings);
    panel.setStatus(T("statusRecognizing"), true);
    STATE.busy = true;

    try {
      const preparedDataUrl = await prepareImage(dataUrl);
      panel.setThumb(preparedDataUrl);
      const result = await recognizeViaOffscreen(preparedDataUrl, settings);
      panel.setProgress(null);
      panel.setStatus(
        result.isTable
          ? T("statusTableResult", { rows: result.rowCount, cols: result.colCount })
          : T("statusTextResult"),
        false
      );
      panel.setResult(result);
      panel.setConfidence(result.confidence);
      maybeAutoCopy(panel, settings);
    } catch (err) {
      console.error("Extractify OCR error:", err);
      panel.setProgress(null);
      panel.setStatus(T("errorPrefix", { error: friendlyError(err?.message || String(err)) }), false, true);
    } finally {
      STATE.busy = false;
    }
  }

  // When the user has opted into it in Settings, copies the table to the
  // clipboard the moment recognition finishes, without waiting for them to
  // click "Copy as Table" themselves - a small speed win for anyone who
  // pastes into the same spreadsheet capture after capture. Reuses the
  // panel's own copy-table button (and its existing toast feedback) rather
  // than duplicating the copy logic.
  function maybeAutoCopy(panel, settings) {
    if (settings.autoCopy) panel.el.querySelector('[data-action="copy-table"]')?.click();
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["settings"], (res) => {
        const settings = Object.assign(
          { uiLang: "en", languages: ["heb", "eng"], columnSensitivity: "normal", autoCopy: false, rememberRegions: true },
          res.settings || {}
        );
        STATE.uiLang = ExtractifyI18n.normalizeLang(settings.uiLang);
        resolve(settings);
      });
    });
  }

  function cleanupSelectionOverlay() {
    if (STATE.root) {
      STATE.root.remove();
      STATE.root = null;
    }
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("mouseup", onMouseUp, true);
    document.removeEventListener("mousedown", onMouseDown, true);
    STATE.dragStart = null;
    STATE.kbdBox = null;
    STATE.kbdHintEl = null;
  }

  function closePanel() {
    if (STATE.panel) {
      STATE.panel.el.remove();
      STATE.panel = null;
      STATE.panelApi = null;
    }
  }

  function beginSelection(opts) {
    cleanupSelectionOverlay(); // reset any previous selection first
    // "Add Capture" keeps the current panel and its accumulated rows open
    // so the next capture's result can be appended to it instead of
    // replacing it - a fresh capture (the default) still starts clean.
    STATE.appendMode = !!(opts?.append && STATE.panelApi);
    if (!STATE.appendMode) closePanel();

    const root = document.createElement("div");
    root.className = "snaptable-root";
    root.style.direction = ExtractifyI18n.dirFor(STATE.uiLang);

    const dim = document.createElement("div");
    dim.className = "snaptable-dim";
    root.appendChild(dim);

    const hint = document.createElement("div");
    hint.className = "snaptable-hint";
    hint.setAttribute("role", "status");
    hint.setAttribute("aria-live", "polite");
    hint.textContent = T("selectHint");
    root.appendChild(hint);

    // Always visible, not just once the user tries it - this is the only
    // discoverable hint that dragging isn't the sole way to select a region
    // (see startKeyboardSelection(), triggered by Enter). Its text switches
    // to the active move/resize/confirm instructions once that mode starts.
    const kbdHint = document.createElement("div");
    kbdHint.className = "snaptable-hint-kbd";
    kbdHint.textContent = T("kbdSelectionHint");
    hint.appendChild(kbdHint);
    STATE.kbdHintEl = kbdHint;

    document.documentElement.appendChild(root);

    STATE.root = root;
    STATE.selectionBox = null;
    STATE.savedRegionForReuse = null;

    document.addEventListener("mousedown", onMouseDown, true);

    // Only offer a saved region on a fresh capture, never mid-"Add Capture" -
    // appending is already about deliberately picking a *different* area.
    if (!STATE.appendMode) offerSavedRegion(hint);
  }

  // Fetches this site's remembered region (if any and if the user hasn't
  // opted out under Settings) and, once it arrives, turns the plain
  // selection hint into a two-line hint with a one-click "reuse" option.
  // Async on purpose: the drag-to-select overlay must appear instantly, so
  // this never blocks beginSelection() itself.
  function offerSavedRegion(hintEl) {
    getSettings().then((settings) => {
      if (settings.rememberRegions === false) return;
      getSavedRegion(location.hostname).then((region) => {
        if (!region || !STATE.root) return; // overlay may already be gone
        const fitted = fitRegionToViewport(region);
        if (!fitted) return;
        STATE.savedRegionForReuse = fitted;

        const reuseBtn = document.createElement("button");
        reuseBtn.type = "button";
        reuseBtn.className = "snaptable-hint-reuse";
        reuseBtn.textContent = T("reuseRegionHint");
        reuseBtn.addEventListener("mousedown", (e) => e.stopPropagation()); // don't start a drag
        reuseBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          useSavedRegion();
        });
        hintEl.appendChild(reuseBtn);
      });
    });
  }

  async function useSavedRegion() {
    const rect = STATE.savedRegionForReuse;
    if (!rect) return;
    const append = STATE.appendMode;
    STATE.appendMode = false;
    STATE.savedRegionForReuse = null;
    cleanupSelectionOverlay();
    await captureAndRecognize(rect, { append });
  }

  function onMouseDown(e) {
    if (!STATE.root) return;
    e.preventDefault();
    STATE.dragStart = { x: e.clientX, y: e.clientY };

    // An in-progress keyboard selection (see startKeyboardSelection) is
    // superseded by an actual mouse drag - remove its box/label instead of
    // leaving them behind as orphaned DOM nodes once STATE.selectionBox
    // below gets reassigned to the new mouse-drawn box.
    if (STATE.kbdBox) {
      STATE.kbdBox = null;
      STATE.selectionBox?.remove();
      STATE.sizeLabel?.remove();
      if (STATE.kbdHintEl) STATE.kbdHintEl.textContent = T("kbdSelectionHint");
    }

    const box = document.createElement("div");
    box.className = "snaptable-selection";
    STATE.root.appendChild(box);
    STATE.selectionBox = box;

    const label = document.createElement("div");
    label.className = "snaptable-size-label";
    STATE.root.appendChild(label);
    STATE.sizeLabel = label;

    updateBox(e.clientX, e.clientY);

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
  }

  function updateBox(curX, curY) {
    const { x, y } = STATE.dragStart;
    const left = Math.min(x, curX);
    const top = Math.min(y, curY);
    const w = Math.abs(curX - x);
    const h = Math.abs(curY - y);
    Object.assign(STATE.selectionBox.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${w}px`,
      height: `${h}px`,
    });
    Object.assign(STATE.sizeLabel.style, {
      left: `${left}px`,
      top: `${top}px`,
    });
    STATE.sizeLabel.textContent = `${Math.round(w)} × ${Math.round(h)}`;
  }

  function onMouseMove(e) {
    if (!STATE.dragStart) return;
    updateBox(e.clientX, e.clientY);
  }

  async function onMouseUp(e) {
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("mouseup", onMouseUp, true);
    document.removeEventListener("mousedown", onMouseDown, true);

    if (!STATE.dragStart) return;
    const { x, y } = STATE.dragStart;
    const left = Math.min(x, e.clientX);
    const top = Math.min(y, e.clientY);
    const w = Math.abs(e.clientX - x);
    const h = Math.abs(e.clientY - y);
    STATE.dragStart = null;

    if (w < 6 || h < 6) {
      // too small — treat as accidental click, restart selection mode
      // (preserving append intent, so retrying an "Add Capture" doesn't
      // silently fall back to replacing the panel)
      beginSelection({ append: STATE.appendMode });
      return;
    }

    const append = STATE.appendMode;
    STATE.appendMode = false;
    await captureAndRecognize({ left, top, width: w, height: h }, { append });
  }

  async function captureAndRecognize(rect, opts) {
    STATE.busy = true;
    STATE.lastRect = rect; // powers the "Recapture" button regardless of outcome
    try {
      // Hide the overlay so it doesn't appear in the screenshot, then wait a
      // couple of frames for the browser to actually repaint without it.
      if (STATE.root) STATE.root.style.visibility = "hidden";
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const capture = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "SNAPTABLE_CAPTURE_VISIBLE" }, resolve);
      });

      cleanupSelectionOverlay();

      if (!capture?.ok) {
        showToast(T("errorCaptureFailed", { error: friendlyError(capture?.error) }), true);
        return;
      }

      const settings = await getSettings();
      // Appending reuses the already-open panel (and its accumulated rows)
      // instead of showPanel() tearing it down and starting a blank one.
      const append = !!(opts?.append && STATE.panelApi);
      const panel = append ? STATE.panelApi : showPanel(settings);
      panel.setStatus(T("statusCropping"), true);

      try {
        const croppedDataUrl = await prepareImage(capture.dataUrl, rect);
        panel.setThumb(croppedDataUrl);
        panel.setStatus(T("statusRecognizing"), true);

        const result = await recognizeViaOffscreen(croppedDataUrl, settings);

        panel.setProgress(null);
        if (append) {
          const total = panel.appendResult(result);
          panel.setStatus(T("statusAppended", { rows: result.rowCount, total }), false);
        } else {
          panel.setStatus(
            result.isTable
              ? T("statusTableResult", { rows: result.rowCount, cols: result.colCount })
              : T("statusTextResult"),
            false
          );
          panel.setResult(result);
        }
        panel.setConfidence(result.confidence);
        maybeAutoCopy(panel, settings);
        // Remember this area for next time (unless the user opted out) -
        // only for a real drag-selected rect, and re-saved even on a repeat
        // capture of a site already saved, so the timestamp-free LRU
        // eviction above still reflects genuinely recent use.
        if (settings.rememberRegions !== false && location.hostname) {
          saveRegion(location.hostname, rect);
        }
      } catch (err) {
        console.error("Extractify OCR error:", err);
        panel.setProgress(null);
        panel.setStatus(T("errorPrefix", { error: friendlyError(err?.message || String(err)) }), false, true);
      }
    } finally {
      STATE.busy = false;
    }
  }

  function friendlyError(message) {
    const msg = String(message || T("errorUnknown"));
    if (/network|fetch|404|failed to load/i.test(msg)) return T("errorEngineLoad");
    if (/permission|denied/i.test(msg)) return T("errorPermission");
    return msg;
  }

  // Grayscale + linear contrast stretch, applied only when the captured
  // region's contrast is genuinely low - a light-gray-on-white dashboard
  // label, or text sitting over a semi-transparent overlay, are exactly the
  // cases where Tesseract's accuracy suffers most and a stretch measurably
  // helps. An already high-contrast capture (plain black text on white,
  // the common case) is left completely untouched: its luminance range is
  // already close to 0-255, so stretching it again would be a no-op at
  // best - skipping it outright means this can only help, never hurt, a
  // normal capture. A near-blank region (near-zero range) is also skipped,
  // since stretching there would just amplify invisible noise.
  function stretchContrast(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;
    let min = 255;
    let max = 0;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (gray < min) min = gray;
      if (gray > max) max = gray;
    }
    const range = max - min;
    if (range >= 180 || range < 8) return;

    const scale = 255 / range;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const stretched = Math.min(255, Math.max(0, (gray - min) * scale));
      d[i] = d[i + 1] = d[i + 2] = stretched;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Crops `dataUrl` to `rect` (in CSS px) if given, otherwise uses the whole
  // image at its natural size (the right-click "extract this image" path).
  // Also upscales the result when it's small: Tesseract's own docs note
  // recognition quality improves a lot on low-resolution input, and small
  // dashboard widgets / UI labels are exactly the common case here.
  function prepareImage(dataUrl, rect) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const dpr = rect ? window.devicePixelRatio || 1 : 1;
        const srcX = rect ? Math.round(rect.left * dpr) : 0;
        const srcY = rect ? Math.round(rect.top * dpr) : 0;
        const srcW = rect ? Math.round(rect.width * dpr) : img.naturalWidth;
        const srcH = rect ? Math.round(rect.height * dpr) : img.naturalHeight;

        const MIN_LONG_SIDE = 700;
        const longSide = Math.max(srcW, srcH);
        const scale = longSide > 0 && longSide < MIN_LONG_SIDE ? Math.min(3, MIN_LONG_SIDE / longSide) : 1;

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(srcW * scale));
        canvas.height = Math.max(1, Math.round(srcH * scale));
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
        stretchContrast(ctx, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load the image"));
      img.src = dataUrl;
    });
  }

  // OCR runs in an offscreen document (see background.js), not here - a
  // Worker created directly in a content script is bound to the CSP of
  // whatever page it's running on, and strict sites block it outright.
  // Progress updates arrive separately as SNAPTABLE_PROGRESS messages
  // (routed to whichever panel is currently open via STATE.panelApi),
  // since a single request/response round trip can't stream them.
  function recognizeViaOffscreen(dataUrl, settings) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "TABLIFY_RECOGNIZE_REQUEST",
          dataUrl,
          languages: settings.languages,
          columnSensitivity: settings.columnSensitivity,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response?.ok) {
            reject(new Error(response?.error || "Recognition failed"));
            return;
          }
          resolve(response.result);
        }
      );
    });
  }

  const PROGRESS_KEYS = {
    "loading tesseract core": "progressLoadingCore",
    "initializing tesseract": "progressInitEngine",
    "initialized tesseract": "progressInitEngine",
    "loading language traineddata": "progressLoadingLang",
    "initializing api": "progressInitApi",
    "recognizing text": "progressRecognizing",
  };

  // Converts the panel's tab-separated text into a GitHub-flavored Markdown
  // table, for pasting into Notion/GitHub/docs instead of a spreadsheet. If
  // the recognized text has no tab-separated columns at all, a Markdown
  // table would be meaningless, so it's wrapped as a fenced code block
  // instead - still valid, still useful, never garbled output.
  function tsvToMarkdown(tsv) {
    const lines = tsv.split("\n").filter((l) => l.length > 0);
    if (!lines.some((l) => l.includes("\t"))) {
      return "```\n" + tsv + "\n```";
    }
    const rows = lines.map((l) => l.split("\t"));
    const colCount = Math.max(...rows.map((r) => r.length));
    const esc = (s) => String(s).replace(/\|/g, "\\|").trim();
    const rowLine = (r) => {
      const padded = r.slice();
      while (padded.length < colCount) padded.push("");
      return "| " + padded.map(esc).join(" | ") + " |";
    };
    const [header, ...body] = rows;
    return [
      rowLine(header),
      "| " + Array(colCount).fill("---").join(" | ") + " |",
      ...body.map(rowLine),
    ].join("\n");
  }

  // Converts tab-separated rows into real CSV: comma-separated, with proper
  // quoting for any field that contains a comma, quote, or newline.
  function tsvToCsv(tsv) {
    const rows = tsv.split("\n").map((l) => l.split("\t"));
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return rows.map((r) => r.map(esc).join(",")).join("\r\n");
  }

  // Triggers a real file download of the current result as CSV. A UTF-8 BOM
  // is prepended because Excel otherwise guesses the wrong codepage for
  // non-ASCII text (Hebrew, in particular) and shows it as garbled mojibake
  // instead of actually opening the file as UTF-8.
  function downloadCsv(tsv) {
    const BOM = String.fromCharCode(0xfeff);
    const blob = new Blob([BOM + tsvToCsv(tsv)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extractify-table.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast(T("toastDownloaded"));
  }

  function escapeCellHtml(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  // Splits recognized text into a rows-of-cells grid (the canonical data
  // structure behind the editable grid view). A lone trailing empty line is
  // dropped as a textarea-editing artifact, but blank rows in the middle are
  // kept - they're meaningful (e.g. a real blank row in the source table).
  function parseRows(text) {
    const lines = String(text || "").split("\n");
    if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
    const rows = lines.map((l) => l.split("\t"));
    return rows.length ? rows : [[""]];
  }

  function rowsToTsv(rows) {
    return rows.map((r) => r.join("\t")).join("\n");
  }

  function showPanel(settings) {
    closePanel();

    const panel = document.createElement("div");
    panel.className = "snaptable-panel";
    panel.style.direction = ExtractifyI18n.dirFor(STATE.uiLang);
    // Announces itself to assistive tech as a dialog the moment it appears -
    // otherwise a screen-reader user has no way to know new content just
    // showed up on the page at all, since it's inserted outside the normal
    // reading flow (appended to documentElement, not the page content).
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", T("panelTitle"));
    if (STATE.lastPanelPos) {
      // Clamped so a panel dragged before a window resize (or before
      // scrolling on a page where it ended up far down) can't reopen
      // partly or fully off-screen with no visible way to drag it back.
      const left = Math.min(Math.max(0, STATE.lastPanelPos.left), Math.max(0, window.innerWidth - 100));
      const top = Math.min(Math.max(0, STATE.lastPanelPos.top), Math.max(0, window.innerHeight - 60));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    } else {
      panel.style.top = "80px";
      panel.style.insetInlineEnd = "24px";
    }

    const iconUrl = chrome.runtime.getURL("assets/icons/icon32.png");
    const langsLabel = (settings.languages || []).map(langLabel).join(" + ");
    const sensLabel = sensitivityLabel(settings.columnSensitivity);

    panel.innerHTML = `
      <div class="snaptable-panel-header">
        <img src="${iconUrl}" alt="">
        <span>${T("panelTitle")}</span>
        <button class="snaptable-btn-close" title="${T("close")}" aria-label="${T("close")}">✕</button>
      </div>
      <div class="snaptable-panel-meta">
        <span class="snaptable-chip">${langsLabel}</span>
        <span class="snaptable-chip">${T("chipSensitivity", { level: sensLabel })}</span>
        <span class="snaptable-chip snaptable-chip-confidence" hidden></span>
      </div>
      <div class="snaptable-panel-body">
        <div class="snaptable-thumb-row" hidden><img class="snaptable-thumb" alt=""></div>
        <div class="snaptable-mode-toggle" hidden>
          <button class="snaptable-mode-btn" data-mode="grid" type="button">${T("gridModeLabel")}</button>
          <button class="snaptable-mode-btn" data-mode="text" type="button">${T("textModeLabel")}</button>
        </div>
        <div class="snaptable-gridwrap" hidden>
          <table class="snaptable-grid"><thead><tr></tr></thead><tbody></tbody></table>
        </div>
        <div class="snaptable-grid-toolbar" hidden>
          <button class="snaptable-btn snaptable-btn-secondary" data-action="add-row" type="button">${T("addRow")}</button>
          <button class="snaptable-btn snaptable-btn-secondary" data-action="add-col" type="button">${T("addColumn")}</button>
        </div>
        <textarea spellcheck="false" placeholder="${T("placeholderText")}"></textarea>
        <div class="snaptable-progress" hidden><div class="snaptable-progress-fill"></div></div>
        <div class="snaptable-status" role="status" aria-live="polite"></div>
      </div>
      <div class="snaptable-panel-footer">
        <button class="snaptable-btn snaptable-btn-primary" data-action="copy-table">${T("copyTable")}</button>
        <button class="snaptable-btn snaptable-btn-secondary" data-action="copy-text">${T("copyText")}</button>
        <button class="snaptable-btn snaptable-btn-secondary" data-action="copy-markdown">${T("copyMarkdown")}</button>
        <button class="snaptable-btn snaptable-btn-secondary" data-action="download-csv">${T("downloadCsv")}</button>
        <button class="snaptable-btn snaptable-btn-secondary snaptable-footer-spacer" data-action="recapture" title="${T("recaptureHint")}" ${STATE.lastRect ? "" : "hidden"}>${T("recaptureBtn")}</button>
        <button class="snaptable-btn snaptable-btn-secondary" data-action="add-capture" title="${T("addCaptureHint")}">${T("addCapture")}</button>
        <button class="snaptable-btn snaptable-btn-secondary" data-action="new-capture">${T("newArea")}</button>
      </div>
    `;

    document.documentElement.appendChild(panel);
    STATE.panel = { el: panel };
    // Moves keyboard focus into the panel as soon as it appears, same as any
    // other dialog - without this, a keyboard-only user has no indication
    // focus is still sitting wherever it was on the host page, and would
    // have to hunt for the panel with Tab from scratch. The close button is
    // the first focusable element in DOM/reading order, so this also lines
    // focus up with where Tab would naturally start.
    panel.querySelector(".snaptable-btn-close")?.focus({ preventScroll: true });

    const textarea = panel.querySelector("textarea");
    const statusEl = panel.querySelector(".snaptable-status");
    const closeBtn = panel.querySelector(".snaptable-btn-close");
    const header = panel.querySelector(".snaptable-panel-header");
    const thumbRow = panel.querySelector(".snaptable-thumb-row");
    const thumbImg = panel.querySelector(".snaptable-thumb");
    const progressWrap = panel.querySelector(".snaptable-progress");
    const progressFill = panel.querySelector(".snaptable-progress-fill");
    const copyTableBtn = panel.querySelector('[data-action="copy-table"]');
    const copyTextBtn = panel.querySelector('[data-action="copy-text"]');
    const copyMarkdownBtn = panel.querySelector('[data-action="copy-markdown"]');
    const downloadCsvBtn = panel.querySelector('[data-action="download-csv"]');
    const recaptureBtn = panel.querySelector('[data-action="recapture"]');
    const addCaptureBtn = panel.querySelector('[data-action="add-capture"]');
    const newCaptureBtn = panel.querySelector('[data-action="new-capture"]');
    const confidenceChip = panel.querySelector(".snaptable-chip-confidence");
    const modeToggle = panel.querySelector(".snaptable-mode-toggle");
    const modeButtons = panel.querySelectorAll(".snaptable-mode-btn");
    const gridWrap = panel.querySelector(".snaptable-gridwrap");
    const gridToolbar = panel.querySelector(".snaptable-grid-toolbar");
    const gridHead = panel.querySelector(".snaptable-grid thead tr");
    const gridBody = panel.querySelector(".snaptable-grid tbody");

    // Once "Add Capture" has folded a second region's rows into this panel,
    // "Recapture" (which redoes only STATE.lastRect - the most recent single
    // region) would silently discard every earlier region's rows if it ran
    // its normal replace-the-panel path. Safer to just stop offering it once
    // a capture has become multi-region, rather than have it destroy data.
    let isMultiCapture = false;

    // Canonical editable data: an array of rows, each an array of cell
    // strings. The grid view and the raw-text view are two ways of editing
    // the same underlying `rows` - switching modes converts one way, so
    // edits made in either view are never lost.
    let rows = [[""]];
    let mode = "text";

    function renderGrid() {
      const colCount = Math.max(1, ...rows.map((r) => r.length));
      gridHead.innerHTML =
        `<th class="snaptable-rowhandle"></th>` +
        Array.from({ length: colCount }, (_, ci) =>
          colCount > 1
            ? `<th><button class="snaptable-cell-del" data-action="del-col" data-col="${ci}" type="button" title="${T("deleteColumn")}" aria-label="${T("deleteColumn")}">×</button></th>`
            : `<th></th>`
        ).join("");
      gridBody.innerHTML = rows
        .map((r, ri) => {
          const cells = Array.from({ length: colCount }, (_, ci) => {
            const val = escapeCellHtml(r[ci] ?? "");
            return `<td contenteditable="true" dir="auto" tabindex="0" data-row="${ri}" data-col="${ci}">${val}</td>`;
          }).join("");
          return `<tr>
            <td class="snaptable-rowhandle"><button class="snaptable-cell-del" data-action="del-row" data-row="${ri}" type="button" title="${T("deleteRow")}" aria-label="${T("deleteRow")}">×</button></td>
            ${cells}
          </tr>`;
        })
        .join("");
    }

    function syncGridFromDom() {
      rows = [...gridBody.querySelectorAll("tr")].map((tr) =>
        [...tr.querySelectorAll("td[contenteditable]")].map((td) => td.textContent)
      );
      if (!rows.length) rows = [[""]];
    }

    function applyMode() {
      gridWrap.hidden = mode !== "grid";
      gridToolbar.hidden = mode !== "grid";
      textarea.hidden = mode !== "text";
      modeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === mode));
      if (mode === "text") textarea.focus();
    }

    function setMode(next) {
      if (next === mode) return;
      if (next === "text") {
        syncGridFromDom();
        textarea.value = rowsToTsv(rows);
      } else {
        rows = parseRows(textarea.value);
        renderGrid();
      }
      mode = next;
      applyMode();
    }

    function currentTsv() {
      if (mode === "grid") {
        syncGridFromDom();
        return rowsToTsv(rows);
      }
      return textarea.value;
    }

    modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

    panel.querySelector('[data-action="add-row"]').addEventListener("click", () => {
      syncGridFromDom();
      const colCount = Math.max(1, ...rows.map((r) => r.length));
      rows.push(new Array(colCount).fill(""));
      renderGrid();
    });
    panel.querySelector('[data-action="add-col"]').addEventListener("click", () => {
      syncGridFromDom();
      rows.forEach((r) => r.push(""));
      renderGrid();
    });
    gridBody.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="del-row"]');
      if (!btn) return;
      syncGridFromDom();
      if (rows.length > 1) rows.splice(Number(btn.dataset.row), 1);
      renderGrid();
    });
    gridHead.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="del-col"]');
      if (!btn) return;
      syncGridFromDom();
      const colCount = Math.max(1, ...rows.map((r) => r.length));
      if (colCount > 1) rows.forEach((r) => r.splice(Number(btn.dataset.col), 1));
      renderGrid();
    });
    // Enter commits the cell and moves down instead of inserting a literal
    // newline into a contenteditable cell, which would silently corrupt the
    // TSV/CSV export (a cell value is never allowed to contain "\n").
    gridBody.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const td = e.target.closest("td[contenteditable]");
      if (!td) return;
      e.preventDefault();
      const next = gridBody.querySelector(
        `td[data-row="${Number(td.dataset.row) + 1}"][data-col="${td.dataset.col}"]`
      );
      (next || td).blur();
      next?.focus();
    });

    closeBtn.addEventListener("click", () => closePanel());
    newCaptureBtn.addEventListener("click", () => beginSelection());
    addCaptureBtn.addEventListener("click", () => beginSelection({ append: true }));
    // Re-runs the exact same screenshot+crop+OCR pass without re-dragging -
    // useful when a dashboard was still loading, a tooltip briefly covered
    // text, or the confidence score below just looks low and is worth a
    // second try before manually correcting anything.
    recaptureBtn.addEventListener("click", () => {
      if (!STATE.lastRect || STATE.busy || isMultiCapture) return;
      recaptureBtn.classList.remove("is-suggested");
      captureAndRecognize(STATE.lastRect, { append: false });
    });

    copyTableBtn.addEventListener("click", () => copyToClipboard(currentTsv()));
    copyTextBtn.addEventListener("click", () => {
      // Plain-text copy: collapse tabs back to single spaces.
      copyToClipboard(currentTsv().replace(/\t/g, " "));
    });
    copyMarkdownBtn.addEventListener("click", () => copyToClipboard(tsvToMarkdown(currentTsv())));
    downloadCsvBtn.addEventListener("click", () => downloadCsv(currentTsv()));

    makeDraggable(panel, header);

    const api = {
      el: panel,
      setStatus(text, spinning, isError) {
        statusEl.classList.toggle("is-error", !!isError);
        // A finished, successful status (not spinning, not an error) gets a
        // small checkmark ahead of the text - the clearest, quickest signal
        // that recognition actually completed, and (together with the
        // status text itself) never relies on color alone the way a plain
        // green dot would.
        const success = !spinning && !isError;
        statusEl.innerHTML = spinning
          ? `<span class="snaptable-spinner"></span><span></span>`
          : success
          ? `<span class="snaptable-status-icon" aria-hidden="true">✓</span><span></span>`
          : `<span></span>`;
        statusEl.lastElementChild.textContent = text;
        if (success) {
          // Restart the flash even if the class is already present from a
          // previous success (e.g. "Add Capture" run twice in a row) -
          // removing then forcing a reflow before re-adding it is the
          // standard way to replay a CSS animation on the same element.
          panel.classList.remove("snaptable-flash-success");
          void panel.offsetWidth;
          panel.classList.add("snaptable-flash-success");
        }
        const busy = !!spinning;
        copyTableBtn.disabled = busy;
        copyTextBtn.disabled = busy;
        copyMarkdownBtn.disabled = busy;
        downloadCsvBtn.disabled = busy;
        // Also blocks starting an overlapping capture while one is still
        // being recognized - previously possible (a pre-existing gap, not
        // introduced by Add Capture), and now that two in-flight requests
        // can legitimately target the very same open panel, actually
        // guarding against it matters more than before.
        addCaptureBtn.disabled = busy;
        newCaptureBtn.disabled = busy;
        recaptureBtn.disabled = busy;
        recaptureBtn.hidden = !STATE.lastRect || isMultiCapture;
        // A failed recognition is the single clearest moment to suggest
        // trying again - a gently pulsing outline (see overlay.css, honors
        // prefers-reduced-motion) rather than another toast the user has to
        // read and dismiss.
        if (!busy) recaptureBtn.classList.toggle("is-suggested", !!isError);
      },
      setProgress(m) {
        if (!m) {
          progressWrap.hidden = true;
          return;
        }
        progressWrap.hidden = false;
        const pct = Math.round((m.progress || 0) * 100);
        progressFill.style.width = pct + "%";
        const label = T(PROGRESS_KEYS[m.status] || "progressGeneric");
        statusEl.classList.remove("is-error");
        statusEl.innerHTML = `<span class="snaptable-spinner"></span><span></span>`;
        statusEl.lastElementChild.textContent = `${label} ${pct}%`;
      },
      setThumb(dataUrl) {
        thumbImg.src = dataUrl;
        thumbRow.hidden = false;
      },
      setConfidence(pct) {
        if (pct == null) {
          confidenceChip.hidden = true;
          return;
        }
        confidenceChip.hidden = false;
        confidenceChip.textContent = T("chipConfidence", { pct });
        // A visibly low score is exactly when a user most benefits from
        // being nudged to double-check the text before trusting it.
        const low = pct < 70;
        confidenceChip.classList.toggle("is-low-confidence", low);
        if (!recaptureBtn.disabled) recaptureBtn.classList.toggle("is-suggested", low);
      },
      setResult(result) {
        rows = parseRows(result.text);
        textarea.value = rowsToTsv(rows);
        renderGrid();
        modeToggle.hidden = false;
        mode = result.isTable ? "grid" : "text";
        applyMode();
        if (mode === "text") textarea.select();
      },
      // Used by "Add Capture": folds another capture's rows onto the end of
      // the ones already in this panel instead of replacing them - the
      // multi-region workflow (e.g. a table that's taller than one screen).
      // Always switches to Grid, since combined multi-capture data reads
      // better as a table than as a wall of concatenated text. Returns the
      // new total row count for the status message.
      appendResult(result) {
        // `rows` only reflects live edits when they were synced back from
        // whichever view is currently active (the same thing currentTsv()
        // does before copying) - without this, editing a cell or the raw
        // text and then clicking "Add Capture" without first switching
        // modes would silently append onto stale, pre-edit data.
        if (mode === "grid") syncGridFromDom();
        else rows = parseRows(textarea.value);
        rows = rows.concat(parseRows(result.text));
        textarea.value = rowsToTsv(rows);
        renderGrid();
        modeToggle.hidden = false;
        mode = "grid";
        applyMode();
        isMultiCapture = true;
        recaptureBtn.hidden = true;
        recaptureBtn.classList.remove("is-suggested");
        return rows.length;
      },
    };
    STATE.panelApi = api;
    return api;
  }

  function makeDraggable(panel, handle) {
    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest(".snaptable-btn-close")) return;
      e.preventDefault();
      const startRect = panel.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      // Switch from inset-based positioning to an explicit left/top so the
      // panel follows the cursor from its current on-screen position.
      panel.style.insetInlineEnd = "auto";
      panel.style.left = `${startRect.left}px`;
      panel.style.top = `${startRect.top}px`;

      function onMove(ev) {
        panel.style.left = `${startRect.left + (ev.clientX - startX)}px`;
        panel.style.top = `${Math.max(0, startRect.top + (ev.clientY - startY))}px`;
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("mouseup", onUp, true);
        // Remembered for next capture on this page, so the panel doesn't
        // jump back to the default corner every time.
        const finalRect = panel.getBoundingClientRect();
        STATE.lastPanelPos = { left: finalRect.left, top: finalRect.top };
      }
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup", onUp, true);
    });
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(T("toastCopied"));
    } catch (err) {
      // Fallback for pages where the async Clipboard API is restricted.
      const tmp = document.createElement("textarea");
      tmp.value = text;
      tmp.style.position = "fixed";
      tmp.style.opacity = "0";
      document.body.appendChild(tmp);
      tmp.select();
      const ok = document.execCommand("copy");
      tmp.remove();
      if (ok) showToast(T("toastCopied"));
      else showToast(T("toastCopyFailed"), true);
    }
  }

  function showToast(text, isError) {
    const toast = document.createElement("div");
    toast.className = "snaptable-toast" + (isError ? " is-error" : "");
    toast.style.direction = ExtractifyI18n.dirFor(STATE.uiLang);
    toast.textContent = text;
    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }
}
