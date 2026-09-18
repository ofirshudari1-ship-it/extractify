// Extractify – offscreen document
// Runs the actual Tesseract.js OCR, in an extension page immune to the CSP
// of whatever site the user is capturing from (see offscreen.html for why).
// Talks to background.js via chrome.runtime messaging; never talks to
// content scripts directly.

let worker = null;
let workerLangs = null;

// Tesseract.js binds the `logger` callback to a worker only once, at
// creation time (there's no worker.setLogger()) - but the worker itself is
// intentionally cached and reused across captures (recreating it means
// reloading the WASM engine + language data, ~1-2s). Without this
// indirection, the logger passed to the FIRST createOcrWorker() call would
// stay wired forever, so every capture after the first would silently send
// its progress pings to the first request's tabId instead of its own - the
// progress bar would just sit still on any tab but the one that happened to
// create the worker. Routing every ping through a reassignable variable
// instead fixes that: each request installs its own handler right before
// recognizing, regardless of whether the worker itself is fresh or reused.
let currentProgressHandler = null;

// Chains every getWorker() call through this promise instead of letting them
// run concurrently. Without it, a warm-up call (background.js gets a head
// start on loading the engine while the user is still dragging a selection)
// racing a real recognize request that arrives moments later would both see
// `worker` as null and both call createOcrWorker(), wasting a full WASM load
// and leaking whichever worker loses the race (its own `worker = ...`
// assignment gets silently overwritten, so it's never terminated). Chaining
// through both success and failure (`.then(run, run)`) means one attempt
// failing can never permanently wedge every capture after it.
let workerQueue = Promise.resolve(null);

function getWorker(languages) {
  const run = async () => {
    const langKey = languages.join("+");
    if (worker && workerLangs === langKey) {
      return worker;
    }
    if (worker) {
      await worker.terminate();
      worker = null;
    }
    worker = await SnapTableOCR.createOcrWorker(languages, (m) => currentProgressHandler?.(m));
    workerLangs = langKey;
    return worker;
  };
  workerQueue = workerQueue.then(run, run);
  return workerQueue;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "TABLIFY_WARM_ENGINE") {
    // Best-effort pre-load, triggered by background.js while the user is
    // still dragging a selection. No response expected; errors here just
    // mean the real request (which does report a proper error) creates the
    // worker itself instead.
    getWorker(message.languages).catch(() => {});
    return false;
  }

  if (message?.type !== "TABLIFY_OFFSCREEN_RECOGNIZE") return false;

  (async () => {
    currentProgressHandler = (m) => {
      // One-way progress ping; background relays it to the requesting tab.
      chrome.runtime.sendMessage({
        type: "TABLIFY_OFFSCREEN_PROGRESS",
        tabId: message.tabId,
        progress: m,
      });
    };
    try {
      const w = await getWorker(message.languages);
      const { data } = await w.recognize(message.dataUrl, {}, { text: true, blocks: true });
      const result = SnapTableOCR.buildTsv(data, message.columnSensitivity);
      sendResponse({ ok: true, result });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || String(err) });
    } finally {
      currentProgressHandler = null;
    }
  })();

  return true; // async sendResponse
});
