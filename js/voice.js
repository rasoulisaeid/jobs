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
  const KEY_CELL = "jobs:local:elevenKey";     // this device only
  const PICK_CELL = "jobs:local:voicePick";    // per-device preference
  const STORE_KEY = "voices";                  // synced

  const DEFAULT_MODEL = "eleven_multilingual_v2";

  const cache = new Map();      // `${voiceId}::${text}` -> object URL
  let current = null;           // the Audio element that is playing

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

  // Which voice this device is using — a preference, so it stays local.
  function getSelected() {
    let saved = "";
    try { saved = localStorage.getItem(PICK_CELL) || ""; } catch (e) {}
    const list = listVoices();
    if (saved && list.some((v) => v.id === saved)) return saved;
    return list.length ? list[0].id : "";
  }

  function setSelected(id) {
    try {
      if (id) localStorage.setItem(PICK_CELL, id);
      else localStorage.removeItem(PICK_CELL);
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

    const url = URL.createObjectURL(await res.blob());
    cache.set(cacheKey, url);
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

  const isCached = (text, voiceId) => cache.has(`${voiceId || getSelected()}::${text}`);
  const isPlaying = () => Boolean(current);

  window.Voice = {
    DEFAULT_MODEL,
    getKey, hasKey, keyPreview, setKey,
    listVoices, addVoice, removeVoice, renameVoice, getSelected, setSelected,
    speak, stop, isCached, isPlaying, onChange,
  };
})();
