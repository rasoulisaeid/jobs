/* Data — the jobs model.
 *
 * Job records sync through Store to a Firebase node that is readable without
 * auth. That's fine for job postings — they're public listings to begin with.
 * The Claude API key is the one real secret, so it never goes near Store: it
 * lives in its own localStorage key that sync.js doesn't mirror, which means
 * it stays on this device and has to be entered once per browser.
 *
 *   Store "jobs"       -> [ { id, title, category, company, address, payMin, payMax,
 *                             payPeriod, employmentType, link, description, createdAt } ]
 *   Store "categories" -> [ "Jewelry", ... ]
 *   Store "prefs"      -> { model, effort, webSearch }
 *   local  apiKey      -> "sk-ant-..."   (this device only, never synced)
 */
(function () {
  const DEFAULT_CATEGORIES = ["Jewelry", "Fashion", "Retail", "Museums"];
  const DEFAULT_PREFS = { model: "claude-opus-5", effort: "medium", webSearch: true };
  const KEY_CELL = "jobs:local:apiKey";   // outside Store's namespace on purpose

  let jobs = [];
  let categories = [];
  let loaded = false;

  const listeners = [];
  const onChange = (fn) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); };
  const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) {} });

  /* ------------------------------------------------------------- lifecycle */

  // Reads the store into memory. Async only so callers can await it either way.
  async function load() {
    jobs = window.Store.get("jobs", []);
    categories = window.Store.get("categories", DEFAULT_CATEGORIES.slice());
    if (!Array.isArray(jobs)) jobs = [];
    if (!Array.isArray(categories) || !categories.length) categories = DEFAULT_CATEGORIES.slice();
    loaded = true;
    notify();
  }

  const isLoaded = () => loaded;

  /* ------------------------------------------------------------------ jobs */

  const listJobs = () => jobs.slice();

  const newId = () => "j" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  async function saveJob(job) {
    const clean = {
      id: job.id || newId(),
      title: (job.title || "").trim(),
      category: (job.category || "").trim(),
      company: (job.company || "").trim(),
      address: (job.address || "").trim(),
      payMin: numOrNull(job.payMin),
      payMax: numOrNull(job.payMax),
      payPeriod: (job.payPeriod || "") || null,
      employmentType: (job.employmentType || "") || null,
      link: (job.link || "").trim(),
      description: (job.description || "").trim(),
      createdAt: job.createdAt || new Date().toISOString(),
    };

    const at = jobs.findIndex((j) => j.id === clean.id);
    if (at >= 0) jobs[at] = clean;
    else jobs.unshift(clean);

    window.Store.set("jobs", jobs);
    if (clean.category) await addCategory(clean.category);
    notify();
    return clean;
  }

  async function deleteJob(id) {
    jobs = jobs.filter((j) => j.id !== id);
    window.Store.set("jobs", jobs);
    notify();
  }

  function numOrNull(v) {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  /* ------------------------------------------------------------ categories */

  const listCategories = () => categories.slice();

  async function addCategory(name) {
    const clean = (name || "").trim();
    if (!clean || categories.includes(clean)) return clean;
    categories = [...categories, clean].sort((a, b) => a.localeCompare(b));
    window.Store.set("categories", categories);
    notify();
    return clean;
  }

  async function removeCategory(name) {
    categories = categories.filter((c) => c !== name);
    window.Store.set("categories", categories);
    notify();
  }

  /* --------------------------------------------------------------- api key */

  // Read straight from localStorage rather than through Store, so it is never
  // part of dump() and never wiped by an incoming restore().
  function getApiKey() {
    try { return localStorage.getItem(KEY_CELL) || ""; } catch (e) { return ""; }
  }

  const hasApiKey = () => Boolean(getApiKey());

  function keyPreview() {
    const key = getApiKey();
    return key ? `${key.slice(0, 11)}…${key.slice(-4)}` : null;
  }

  async function setApiKey(value) {
    const key = (value || "").trim();
    try {
      if (key) localStorage.setItem(KEY_CELL, key);
      else localStorage.removeItem(KEY_CELL);
    } catch (e) { console.error("Could not save the API key", e); }
    notify();
  }

  /* ------------------------------------------------------------ preferences */

  const getPrefs = () => ({ ...DEFAULT_PREFS, ...window.Store.get("prefs", {}) });
  function setPrefs(patch) {
    window.Store.set("prefs", { ...getPrefs(), ...patch });
    notify();
  }

  /* -------------------------------------------------------- import / export */

  function exportAll() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      jobs: listJobs(),
      categories: listCategories(),
    };
  }

  // Merges by id; anything already present is left alone so a double import
  // can't create duplicates.
  async function importAll(payload) {
    if (!payload || !Array.isArray(payload.jobs)) throw new Error("That file has no jobs in it.");

    const seen = new Set(jobs.map((j) => j.id));
    let added = 0;
    for (const raw of payload.jobs) {
      const id = raw.id || newId();
      if (seen.has(id)) continue;
      seen.add(id);
      jobs.push({
        id,
        title: raw.title || "",
        category: raw.category || "",
        company: raw.company || "",
        address: raw.address || "",
        payMin: numOrNull(raw.payMin),
        payMax: numOrNull(raw.payMax),
        payPeriod: raw.payPeriod || null,
        employmentType: raw.employmentType || null,
        link: raw.link || "",
        description: raw.description || "",
        createdAt: raw.createdAt || new Date().toISOString(),
      });
      added++;
    }

    jobs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    const incoming = Array.isArray(payload.categories) ? payload.categories : [];
    categories = [...new Set([...categories, ...incoming])].sort((a, b) => a.localeCompare(b));

    window.Store.set("jobs", jobs);
    window.Store.set("categories", categories);
    notify();
    return { added, skipped: payload.jobs.length - added };
  }

  window.Data = {
    load, isLoaded, onChange,
    listJobs, saveJob, deleteJob,
    listCategories, addCategory, removeCategory,
    getApiKey, hasApiKey, keyPreview, setApiKey,
    getPrefs, setPrefs,
    exportAll, importAll,
  };
})();
