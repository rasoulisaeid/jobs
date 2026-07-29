/* Store — namespaced localStorage cache, mirrored to Firebase by sync.js.
 *
 * All keys live under "jobs:v1:". localStorage is a fast local cache; Firebase
 * is the shared source of truth. Every write notifies listeners so the sync
 * layer can push the change up. (Same contract as the Systems app.) */
(function () {
  const NS = "jobs:v1:";
  const listeners = [];
  let muted = false;                 // suppress notifications during a remote restore

  function notify() {
    if (muted) return;
    listeners.forEach((fn) => { try { fn(); } catch (e) {} });
  }

  function get(key, def) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw === null ? def : JSON.parse(raw);
    } catch (e) { return def; }
  }

  function set(key, val) {
    try { localStorage.setItem(NS + key, JSON.stringify(val)); notify(); }
    catch (e) {
      // Usually QuotaExceededError. Silently dropping the write would look like
      // a successful save that vanishes on reload, so make it loud.
      console.error("Store.set failed", key, e);
      alert("Couldn't save — local storage is full.\n\nRecent changes to \"" + key + "\" were NOT saved.");
    }
  }

  function del(key) {
    try { localStorage.removeItem(NS + key); notify(); } catch (e) {}
  }

  // Serialize every namespaced key -> raw JSON string, for Firebase mirroring.
  function dump() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(NS) === 0) out[k.slice(NS.length)] = localStorage.getItem(k);
    }
    return out;
  }

  // Replace all namespaced keys with the given map. Does NOT notify — this is
  // how incoming Firebase data is applied without echoing straight back up.
  function restore(obj) {
    muted = true;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.indexOf(NS) === 0) localStorage.removeItem(k);
      }
      if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((k) => {
          const v = obj[k];
          localStorage.setItem(NS + k, typeof v === "string" ? v : JSON.stringify(v));
        });
      }
    } catch (e) { console.warn("Store.restore failed", e); }
    muted = false;
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
  }

  window.Store = { get, set, del, dump, restore, onChange, NS };
})();
