/* Data — the jobs model, encrypted at rest.
 *
 * Everything sensitive is AES-GCM encrypted by vault.js before it reaches
 * Store, because Store is mirrored to a Firebase node that is readable without
 * auth. Only ciphertext leaves the browser.
 *
 *   "jobs"       -> [ { id, title, category, company, address, payMin, payMax,
 *                       payPeriod, employmentType, link, description, createdAt } ]   (encrypted)
 *   "categories" -> [ "Jewelry", ... ]                                                (encrypted)
 *   "apiKey"     -> "sk-ant-..."                                                      (encrypted)
 *   "prefs"      -> { model, effort, webSearch }                                       (plain — not secret)
 */
(function () {
  const DEFAULT_CATEGORIES = ["Jewelry", "Fashion", "Retail", "Museums"];
  const DEFAULT_PREFS = { model: "claude-opus-5", effort: "medium", webSearch: true };

  let jobs = [];
  let categories = [];
  let apiKey = "";
  let loaded = false;

  const listeners = [];
  const onChange = (fn) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); };
  const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) {} });

  async function readBlob(key, fallback) {
    const blob = window.Store.get(key, null);
    if (!blob) return fallback;
    try {
      const value = await window.Vault.decrypt(blob);
      return value === null || value === undefined ? fallback : value;
    } catch (e) {
      // Wrong key or corrupt blob — don't destroy it, just show nothing.
      console.warn("Data: could not decrypt", key, e.message);
      return fallback;
    }
  }

  async function writeBlob(key, value) {
    window.Store.set(key, await window.Vault.encrypt(value));
  }

  /* ------------------------------------------------------------- lifecycle */

  // Pulls everything out of the encrypted store. Requires an unlocked vault.
  async function load() {
    if (!window.Vault.isUnlocked()) { loaded = false; return; }
    jobs = await readBlob("jobs", []);
    categories = await readBlob("categories", DEFAULT_CATEGORIES.slice());
    apiKey = await readBlob("apiKey", "");
    loaded = true;
    notify();
  }

  function unload() {
    jobs = [];
    categories = [];
    apiKey = "";
    loaded = false;
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

    await writeBlob("jobs", jobs);
    if (clean.category) await addCategory(clean.category);
    notify();
    return clean;
  }

  async function deleteJob(id) {
    jobs = jobs.filter((j) => j.id !== id);
    await writeBlob("jobs", jobs);
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
    await writeBlob("categories", categories);
    notify();
    return clean;
  }

  async function removeCategory(name) {
    categories = categories.filter((c) => c !== name);
    await writeBlob("categories", categories);
    notify();
  }

  /* ---------------------------------------------------------------- secrets */

  const getApiKey = () => apiKey;
  const hasApiKey = () => Boolean(apiKey);
  const keyPreview = () => (apiKey ? `${apiKey.slice(0, 11)}…${apiKey.slice(-4)}` : null);

  async function setApiKey(value) {
    apiKey = (value || "").trim();
    await writeBlob("apiKey", apiKey);
    notify();
  }

  /* ------------------------------------------------------------ preferences */

  // Not secret, so kept in the clear — readable before the vault is unlocked.
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

    await writeBlob("jobs", jobs);
    await writeBlob("categories", categories);
    notify();
    return { added, skipped: payload.jobs.length - added };
  }

  window.Data = {
    load, unload, isLoaded, onChange,
    listJobs, saveJob, deleteJob,
    listCategories, addCategory, removeCategory,
    getApiKey, hasApiKey, keyPreview, setApiKey,
    getPrefs, setPrefs,
    exportAll, importAll,
  };
})();
