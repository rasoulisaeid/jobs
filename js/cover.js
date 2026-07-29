/* Cover — the cover letter, one per job.
 *
 * Same shape as Resume on purpose: apply.js switches between the two through a
 * single doc() accessor, so the preview, inline editing, autosave, versions and
 * printing are all shared rather than written twice.
 *
 * Storage follows the same rule too — the letter syncs, the contact details do
 * not, and everything on its way into Store goes through Resume.redact().
 */
(function () {
  const KEY_BASE = "coverBase";          // via Store -> synced
  const KEY_VERSIONS = "coverVersions";  // via Store -> synced

  // A letter has to be addressed to someone, so this is only ever a starting
  // point — Claude fills it in against the actual posting.
  const DEFAULT_LATEX = String.raw`\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage[hidelinks]{hyperref}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{10pt}

\begin{document}

\begin{center}
{\LARGE \textbf{SAHAR EBRAHIMZADEH}}\\[4pt]
CITY, STATE ZIP \,\textbar\, PHONE NUMBER \,\textbar\, \href{mailto:EMAIL ADDRESS}{EMAIL ADDRESS}
\end{center}

\vspace{20pt}

Dear Hiring Manager,

I am applying for the [ROLE] job at [COMPANY]. I have worked in retail sales for two years, most recently selling jewelry, and I would like to keep doing that work here.

[What she has actually done that matters for this job, with one real detail.]

[Why this store, and a short closing line.]

\vspace{8pt}

Sincerely,\\
Sahar Ebrahimzadeh

\end{document}
`;

  const listeners = [];
  const onChange = (fn) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); };
  const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) {} });

  const redact = (text) => window.Resume.redact(text);

  /* ------------------------------------------------------------------- base */

  function getBase() {
    const saved = window.Store.get(KEY_BASE, null);
    return typeof saved === "string" && saved.trim() ? saved : DEFAULT_LATEX;
  }

  function setBase(latex) {
    window.Store.set(KEY_BASE, redact(String(latex || "")));
    notify();
  }

  function resetBase() {
    window.Store.del(KEY_BASE);
    notify();
    return DEFAULT_LATEX;
  }

  /* --------------------------------------------------------------- versions */

  const newId = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function allVersions() {
    const list = window.Store.get(KEY_VERSIONS, []);
    return Array.isArray(list) ? list : [];
  }

  const writeVersions = (list) => window.Store.set(KEY_VERSIONS, list);

  function listVersions(jobId) {
    const list = allVersions();
    const filtered = jobId === undefined
      ? list
      : list.filter((v) => (v.jobId || null) === (jobId || null));
    return filtered.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  const latestVersion = (jobId) => listVersions(jobId || null)[0] || null;
  const getVersion = (id) => allVersions().find((v) => v.id === id) || null;

  function saveVersion({ jobId = null, label = "", latex = "", changes = [], source = "manual" }) {
    const version = {
      id: newId(),
      jobId: jobId || null,
      label: String(label || "").trim() || "Untitled letter",
      latex: redact(String(latex || "")),
      changes: Array.isArray(changes) ? changes : [],
      source,
      createdAt: new Date().toISOString(),
    };
    writeVersions([version, ...allVersions()]);
    notify();
    return version;
  }

  function updateVersion(id, latex) {
    const list = allVersions();
    const at = list.findIndex((v) => v.id === id);
    if (at < 0) return null;
    list[at] = { ...list[at], latex: redact(String(latex || "")), updatedAt: new Date().toISOString() };
    writeVersions(list);
    notify();
    return list[at];
  }

  function deleteVersion(id) {
    writeVersions(allVersions().filter((v) => v.id !== id));
    notify();
  }

  function renameVersion(id, label) {
    const list = allVersions();
    const at = list.findIndex((v) => v.id === id);
    if (at < 0) return;
    list[at] = { ...list[at], label: String(label || "").trim() || list[at].label };
    writeVersions(list);
    notify();
  }

  // Still carrying the square-bracket prompts Claude is meant to replace.
  const isTemplate = (latex) => /\[(ROLE|COMPANY)\]/.test(String(latex || ""));

  window.Cover = {
    DEFAULT_LATEX, isTemplate,
    getBase, setBase, resetBase,
    listVersions, latestVersion, getVersion,
    saveVersion, updateVersion, deleteVersion, renameVersion,
    onChange,
  };
})();
