/* Voice — reads the interview questions aloud with ElevenLabs.
 *
 * Voice IDs are not secrets, so they sync like everything else and the list
 * follows her to any device. The API key is a secret and behaves exactly like
 * the Claude key: localStorage on this device only, never in Store, never on
 * the wire to Firebase.
 *
 * Audio is cached per voice+text for the session, so replaying a question you
 * have already heard costs nothing.
 */
(function () {
  const API = "https://api.elevenlabs.io/v1/text-to-speech";
  const KEY_CELL = "jobs:local:elevenKey";       // this device only
  const PICK_CELL = "jobs:local:voicePick";      // per-device preference
  const ANSWER_CELL = "jobs:local:answerVoice";  // per-device preference
  const SEEDED_CELL = "jobs:local:voiceSeeded";  // so a removal stays removed
  const STORE_KEY = "voices";                    // synced

  const DEFAULT_MODEL = "eleven_multilingual_v2";

  // Sahar's own cloned voice — the default for reading the answers back, so
  // she hears the sentences in her own voice before she has to say them.
  const SAHAR_ID = "jue5C5v9CO3kJzxK6LNV";

  const cache = new Map();      // `${voiceId}::${text}` -> object URL, this session
  const savedKeys = new Set();  // what is already on disk, for a sync isCached()
  let current = null;           // the Audio element that is playing

  /* ------------------------------------------------- the clip store ------ */

  /* Generated audio is kept in IndexedDB, not just in memory, because every
   * regeneration costs ElevenLabs credits and a page reload would otherwise
   * throw away everything. Blobs go in as-is — base64 in localStorage would
   * inflate them by a third and blow the 5MB quota after a couple of jobs.
   *
   * Device-local on purpose: it is large, and it is derived data that can
   * always be made again. */
  const DB_NAME = "jobs-voice";
  const STORE = "clips";
  let dbPromise = null;

  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      if (typeof indexedDB === "undefined") return resolve(null);
      let req;
      try { req = indexedDB.open(DB_NAME, 1); } catch (e) { return resolve(null); }
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      // Private mode and blocked storage both land here — fall back to memory.
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    });
    return dbPromise;
  }

  function withStore(mode, run) {
    return db().then((d) => {
      if (!d) return null;
      return new Promise((resolve) => {
        let tx;
        try { tx = d.transaction(STORE, mode); } catch (e) { return resolve(null); }
        const result = run(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(result && "result" in result ? result.result : null);
        tx.onerror = () => resolve(null);
        tx.onabort = () => resolve(null);
      });
    }).catch(() => null);
  }

  const clipGet = (key) => withStore("readonly", (store) => store.get(key));
  const clipPut = (key, blob) => withStore("readwrite", (store) => store.put(blob, key));
  const clipKeys = () => withStore("readonly", (store) => store.getAllKeys());
  const clipBlobs = () => withStore("readonly", (store) => store.getAll());

  async function clearSaved() {
    await withStore("readwrite", (store) => store.clear());
    savedKeys.clear();
    for (const url of cache.values()) URL.revokeObjectURL(url);
    cache.clear();
    notify();
  }

  async function savedSize() {
    const blobs = (await clipBlobs()) || [];
    return { count: blobs.length, bytes: blobs.reduce((n, b) => n + (b?.size || 0), 0) };
  }

  // Loaded once at start so isCached() can stay synchronous for the UI.
  const ready = (async () => {
    const keys = (await clipKeys()) || [];
    for (const k of keys) savedKeys.add(k);
    return savedKeys.size;
  })();

  const listeners = [];
  const onChange = (fn) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); };
  const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) {} });

  /* ------------------------------------------------------------------- key */

  function getKey() {
    try { return localStorage.getItem(KEY_CELL) || ""; } catch (e) { return ""; }
  }

  const hasKey = () => Boolean(getKey());

  function keyPreview() {
    const key = getKey();
    return key ? `${key.slice(0, 6)}…${key.slice(-4)}` : null;
  }

  function setKey(value) {
    const key = (value || "").trim();
    try {
      if (key) localStorage.setItem(KEY_CELL, key);
      else localStorage.removeItem(KEY_CELL);
    } catch (e) { console.error("Could not save the ElevenLabs key", e); }
    notify();
  }

  /* ---------------------------------------------------------------- voices */

  function listVoices() {
    const list = window.Store.get(STORE_KEY, []);
    return Array.isArray(list) ? list.filter((v) => v && v.id) : [];
  }

  function addVoice(name, id) {
    const voiceId = String(id || "").trim();
    if (!voiceId) throw new Error("Paste the voice ID from ElevenLabs.");
    if (/\s/.test(voiceId)) throw new Error("That does not look like a voice ID — it should have no spaces.");

    const list = listVoices();
    if (list.some((v) => v.id === voiceId)) throw new Error("That voice is already in the list.");

    const voice = { id: voiceId, name: String(name || "").trim() || `Voice ${list.length + 1}` };
    window.Store.set(STORE_KEY, [...list, voice]);
    notify();
    return voice;
  }

  function removeVoice(id) {
    window.Store.set(STORE_KEY, listVoices().filter((v) => v.id !== id));
    if (getSelected() === id) setSelected("");
    if (getAnswerVoice() === id) setAnswerVoice("");
    notify();
  }

  function renameVoice(id, name) {
    const list = listVoices();
    const at = list.findIndex((v) => v.id === id);
    if (at < 0) return;
    list[at] = { ...list[at], name: String(name || "").trim() || list[at].name };
    window.Store.set(STORE_KEY, list);
    notify();
  }

  /* Adds Sahar's voice once, the first time this device loads the page. The
   * flag means removing it from the list makes it stay removed instead of
   * reappearing on the next visit. */
  function ensureSeeded() {
    let done = "";
    try { done = localStorage.getItem(SEEDED_CELL) || ""; } catch (e) {}
    if (done) return false;
    try { localStorage.setItem(SEEDED_CELL, "1"); } catch (e) {}

    const list = listVoices();
    if (list.some((v) => v.id === SAHAR_ID)) return false;
    window.Store.set(STORE_KEY, [...list, { id: SAHAR_ID, name: "Sahar — your voice" }]);
    notify();
    return true;
  }

  // Which voice reads the interviewer's questions. A preference, so it is local.
  function getSelected() {
    let saved = "";
    try { saved = localStorage.getItem(PICK_CELL) || ""; } catch (e) {}
    const list = listVoices();
    if (saved && list.some((v) => v.id === saved)) return saved;
    // With nothing chosen, an interviewer should not default to her own voice.
    const notHer = list.find((v) => v.id !== SAHAR_ID);
    return (notHer || list[0])?.id || "";
  }

  function setSelected(id) {
    try {
      if (id) localStorage.setItem(PICK_CELL, id);
      else localStorage.removeItem(PICK_CELL);
    } catch (e) {}
    notify();
  }

  // Which voice reads her answers back. Defaults to her own.
  function getAnswerVoice() {
    let saved = "";
    try { saved = localStorage.getItem(ANSWER_CELL) || ""; } catch (e) {}
    const list = listVoices();
    if (saved && list.some((v) => v.id === saved)) return saved;
    if (list.some((v) => v.id === SAHAR_ID)) return SAHAR_ID;
    return list.length ? list[0].id : "";
  }

  function setAnswerVoice(id) {
    try {
      if (id) localStorage.setItem(ANSWER_CELL, id);
      else localStorage.removeItem(ANSWER_CELL);
    } catch (e) {}
    notify();
  }

  /* ------------------------------------------------------------- speaking */

  function stop() {
    if (!current) return;
    current.pause();
    current.currentTime = 0;
    current = null;
  }

  async function fetchAudio(text, voiceId) {
    const cacheKey = `${voiceId}::${text}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    // On disk from a previous visit — no request, no credits.
    const saved = await clipGet(cacheKey);
    if (saved) {
      const url = URL.createObjectURL(saved);
      cache.set(cacheKey, url);
      savedKeys.add(cacheKey);
      return url;
    }

    const key = getKey();
    if (!key) throw new Error("No ElevenLabs API key saved. Add one under Settings on the jobs page.");
    if (!voiceId) throw new Error("Add a voice ID first, at the top of this page.");

    let res;
    try {
      res = await fetch(`${API}/${encodeURIComponent(voiceId)}`, {
        method: "POST",
        headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({
          text,
          model_id: window.Store.get("voiceModel", DEFAULT_MODEL),
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
        }),
      });
    } catch (e) {
      // No status code means the request never completed — usually the network,
      // sometimes the browser blocking a cross-origin call.
      throw new Error("Couldn't reach ElevenLabs. Check the connection, then the key.");
    }

    if (!res.ok) {
      if (res.status === 401) throw new Error("ElevenLabs rejected that key. Check it under Settings.");
      if (res.status === 404) throw new Error("No voice with that ID. Check it in your ElevenLabs voice library.");
      if (res.status === 422) throw new Error("ElevenLabs could not use that voice or model for this text.");
      if (res.status === 429) throw new Error("ElevenLabs rate limit or quota reached. Try again later.");
      let detail = "";
      try { detail = (await res.json())?.detail?.message || ""; } catch (e) {}
      throw new Error(detail || `ElevenLabs error — HTTP ${res.status}`);
    }

    const blob = await res.blob();
    await clipPut(cacheKey, blob);          // keep it, so this is paid for once
    savedKeys.add(cacheKey);
    const url = URL.createObjectURL(blob);
    cache.set(cacheKey, url);
    notify();
    return url;
  }

  // Resolves when the clip finishes, so callers can chain questions.
  async function speak(text, voiceId) {
    stop();
    const url = await fetchAudio(text, voiceId || getSelected());
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      current = audio;
      audio.onended = () => { if (current === audio) current = null; resolve(); };
      audio.onerror = () => { if (current === audio) current = null; reject(new Error("Couldn't play that audio.")); };
      audio.play().catch(reject);
    });
  }

  function isCached(text, voiceId) {
    const key = `${voiceId || getSelected()}::${text}`;
    return cache.has(key) || savedKeys.has(key);
  }

  const isPlaying = () => Boolean(current);

  window.Voice = {
    DEFAULT_MODEL, SAHAR_ID, ready,
    getKey, hasKey, keyPreview, setKey,
    listVoices, addVoice, removeVoice, renameVoice, ensureSeeded,
    getSelected, setSelected, getAnswerVoice, setAnswerVoice,
    speak, stop, isCached, isPlaying, savedSize, clearSaved, onChange,
  };
})();
