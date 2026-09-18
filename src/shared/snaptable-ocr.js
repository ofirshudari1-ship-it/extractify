// SnapTable OCR – shared OCR helper, used by both content.js (the real
// capture flow) and options.js (the "test OCR engine" self-check). Keeping
// this logic in one file means both places stay in sync automatically.
//
// Depends on tesseract.min.js being loaded first (defines global `Tesseract`)
// and on `chrome.runtime.getURL` being available (extension context only).

(function (global) {
  const LANG_LABELS = { heb: "עברית", eng: "אנגלית" };
  const SENSITIVITY_LABELS = { loose: "רפויה", normal: "רגילה", tight: "הדוקה" };

  function createOcrWorker(languages, onProgress) {
    return Tesseract.createWorker(languages, 1, {
      workerPath: chrome.runtime.getURL("src/shared/worker.min.js"),
      // corePath must be a *directory*: Tesseract.js feature-detects SIMD
      // support and picks the matching file itself. We only ship the two
      // "-lstm" builds since oem=1/LSTM_ONLY never needs the legacy-capable
      // ones, which halves the bundled download size.
      corePath: chrome.runtime.getURL("src/shared"),
      langPath: chrome.runtime.getURL("src/shared/lang-data"),
      workerBlobURL: false,
      gzip: true,
      logger: onProgress || undefined,
    });
  }

  function flattenLines(blocks) {
    const lines = [];
    for (const block of blocks || []) {
      for (const para of block?.paragraphs || []) {
        for (const line of para?.lines || []) {
          lines.push(line);
        }
      }
    }
    return lines;
  }

  // Reconstructs a tab-separated table from Tesseract's word bounding boxes:
  // a horizontal gap between two words that is "wide" relative to the text
  // height is treated as a column boundary. This is a heuristic, not real
  // table/grid detection — see SPEC.md for the reasoning and known limits.
  function buildTsv(data, sensitivity) {
    let lines = [];
    try {
      lines = flattenLines(data?.blocks);
    } catch (err) {
      console.warn("SnapTable OCR: could not read layout blocks, falling back to plain text", err);
    }
    // Tesseract always returns a 0-100 mean confidence score for the whole
    // recognized region (regardless of the `blocks` output option), which
    // is worth surfacing to the user as a quick signal for "should I
    // double-check this before pasting it anywhere" - a small, honest piece
    // of transparency for what is, under the hood, a neural-network model
    // that's never 100% certain.
    const confidence = Number.isFinite(data?.confidence) ? Math.round(data.confidence) : null;

    if (!lines.length) {
      const text = (data?.text || "").trim();
      const rowCount = text ? text.split("\n").length : 0;
      return { text, isTable: false, rowCount, colCount: 1, confidence };
    }

    const multiplier = { loose: 2.6, normal: 1.5, tight: 0.9 }[sensitivity] ?? 1.5;
    let maxCols = 1;

    const rows = lines
      .map((line) => {
        try {
          const words = [...(line.words || [])]
            .filter((w) => w?.bbox && typeof w.text === "string")
            .sort((a, b) => a.bbox.x0 - b.bbox.x0);
          if (!words.length) return (line.text || "").trim();

          const avgHeight =
            words.reduce((sum, w) => sum + (w.bbox.y1 - w.bbox.y0), 0) / words.length || 10;
          const threshold = avgHeight * multiplier;

          let out = words[0].text;
          let cols = 1;
          for (let i = 1; i < words.length; i++) {
            const gap = words[i].bbox.x0 - words[i - 1].bbox.x1;
            const isColBreak = gap > threshold;
            if (isColBreak) cols++;
            out += (isColBreak ? "\t" : " ") + words[i].text;
          }
          if (cols > maxCols) maxCols = cols;
          return out;
        } catch (err) {
          // Unexpected shape for this line — fall back to its plain text
          // rather than losing the row entirely.
          return (line?.text || "").trim();
        }
      })
      .filter((line) => line.trim().length > 0);

    return { text: rows.join("\n"), isTable: true, rowCount: rows.length, colCount: maxCols, confidence };
  }

  global.SnapTableOCR = { createOcrWorker, buildTsv, LANG_LABELS, SENSITIVITY_LABELS };
})(typeof window !== "undefined" ? window : this);
