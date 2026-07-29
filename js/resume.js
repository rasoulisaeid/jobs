/* Resume — the base LaTeX CV plus the tailored versions made from it.
 *
 * The documents go through Store, so they sync to Firebase and follow her to
 * any device. That is only safe because of the split below:
 *
 *   Store  "resume" / "resumeVersions"  ->  LaTeX holding PLACEHOLDER tokens
 *   local  "jobs:local:contact"         ->  the real address, phone and email
 *
 * The Firebase node is readable by anyone with the URL, and the URL is in a
 * public repo — so nothing that reaches Store may carry contact details. The
 * placeholders are only filled in on the way out, by applyContact(), for the
 * preview, the printer and exports. redact() is the belt-and-braces: anything
 * heading into Store gets the real values swapped back out first, so hand-typing
 * them into the source still cannot publish them.
 *
 * What does sync is her name, work history and education — public-CV material,
 * the same order of exposure as the job list already up there.
 */
(function () {
  const KEY_BASE = "resume";              // via Store -> synced
  const KEY_VERSIONS = "resumeVersions";  // via Store -> synced
  const CELL_CONTACT = "jobs:local:contact";  // this device only, never synced

  // Where the documents lived before they synced; drained by migrateLocal().
  const OLD_BASE = "jobs:local:resume";
  const OLD_VERSIONS = "jobs:local:resumeVersions";

  // String.raw is required, not stylistic: "\usepackage" is an invalid unicode
  // escape and a plain template literal would refuse to parse.
  const DEFAULT_LATEX = String.raw`\documentclass[11pt]{article}
\usepackage[margin=0.85in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage{titlesec}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlist[itemize]{left=0pt,label=\textbullet,itemsep=2pt,topsep=2pt}

% Section headings with a rule under them
\titleformat{\section}{\large\bfseries}{}{0pt}{}[\vspace{-7pt}\rule{\textwidth}{0.8pt}]
\titlespacing*{\section}{0pt}{13pt}{7pt}

\begin{document}

\begin{center}
{\LARGE \textbf{SAHAR EBRAHIMZADEH}}\\[4pt]
CITY, STATE ZIP \,\textbar\, PHONE NUMBER \,\textbar\, \href{mailto:EMAIL ADDRESS}{EMAIL ADDRESS}
\end{center}

\vspace{4pt}

\section*{Summary}
Detail-oriented and organized beauty enthusiast with one year of hands-on experience in a pharmacy beauty section. Passionate about skincare and cosmetics, and a fast learner with skills in customer consultation.

\section*{Skills}
\begin{itemize}
  \item Customer support and shade matching
  \item Skincare and cosmetics product knowledge
  \item Merchandising, clean testers, tidy shelves
  \item Inventory and expiry-date checks, restocking
\end{itemize}

\section*{Experience}
\textbf{Jewelry Sales Associate} \hfill Tehran, Iran \hfill 07/2023--08/2024\\[-2pt]
\begin{itemize}
  \item Assisted customers with product selection and provided a positive sales experience
  \item Built customer relationship and followed up with clients to encourage repeat visits
\end{itemize}

\vspace{6pt}

\textbf{Pharmacy Beauty Associate} \hfill Tehran, Iran \hfill 06/2022--07/2023\\[-2pt]
\begin{itemize}
  \item Helped customers choose skincare and makeup; shade matching
  \item Managed stock: restocked, rotated items, checked expiry dates
  \item Kept testers clean and followed return/exchange rules
\end{itemize}

\section*{Education}
\textbf{Bu-Ali Sina University}, Hamedan, Iran \hfill 07/2019\\
Bachelor of Arts, Archaeology

\end{document}
`;

  // The tokens in DEFAULT_LATEX that the saved contact details fill in.
  const PLACEHOLDERS = {
    address: "CITY, STATE ZIP",
    phone: "PHONE NUMBER",
    email: "EMAIL ADDRESS",
  };
  const FIELDS = Object.keys(PLACEHOLDERS);

  const listeners = [];
  const onChange = (fn) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); };
  const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) {} });

  function readCell(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  function writeCell(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) {
      console.error("Resume: save failed", e);
      alert("Couldn't save — this browser's storage is full.");
    }
  }

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

  /* -------------------------------------------------------- contact details */

  /* Kept apart from the LaTeX on purpose. The document keeps its placeholder
   * tokens and they are only filled in when something is rendered, printed or
   * exported — so the copy sent to Claude for tailoring carries no phone
   * number, no email and no address. Stored in this browser, never synced. */

  function getContact() {
    const saved = readCell(CELL_CONTACT, {});
    const out = {};
    for (const f of FIELDS) out[f] = typeof saved?.[f] === "string" ? saved[f] : "";
    return out;
  }

  function setContact(patch) {
    const next = { ...getContact() };
    for (const f of FIELDS) if (f in patch) next[f] = String(patch[f] || "").trim();
    writeCell(CELL_CONTACT, next);
    notify();
    return next;
  }

  const hasContact = () => FIELDS.every((f) => getContact()[f]);

  // TeX chokes on these, and they turn up in real addresses and emails.
  function escapeLatex(s) {
    return String(s)
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/([&%$#_{}])/g, "\\$1")
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");
  }

  /* The inverse of applyContact: puts the placeholders back. Everything on its
   * way into Store passes through here, so real contact details cannot reach
   * Firebase even if they were typed straight into the LaTeX source. */
  function redact(latex) {
    const details = getContact();
    let out = String(latex || "");
    for (const f of FIELDS) {
      const value = details[f];
      if (!value) continue;
      out = out.split(escapeLatex(value)).join(PLACEHOLDERS[f]);  // as stored
      out = out.split(value).join(PLACEHOLDERS[f]);               // as typed
    }
    return out;
  }

  // Swaps the placeholder tokens for the saved details. Everything the user
  // ever sees or sends goes through this.
  function applyContact(latex, contact) {
    const details = contact || getContact();
    let out = String(latex || "");
    for (const f of FIELDS) {
      if (!details[f]) continue;
      out = out.split(PLACEHOLDERS[f]).join(escapeLatex(details[f]));
    }
    return out;
  }

  // True while a placeholder would still reach the page.
  const needsContactDetails = (latex) => {
    const text = applyContact(latex === undefined ? getBase() : latex);
    return FIELDS.some((f) => text.includes(PLACEHOLDERS[f]));
  };

  /* --------------------------------------------------------------- versions */

  const newId = () => "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function allVersions() {
    const list = window.Store.get(KEY_VERSIONS, []);
    return Array.isArray(list) ? list : [];
  }

  const writeVersions = (list) => window.Store.set(KEY_VERSIONS, list);

  // jobId undefined -> every version; null -> the ones not tied to a job.
  function listVersions(jobId) {
    const list = allVersions();
    const filtered = jobId === undefined ? list : list.filter((v) => (v.jobId || null) === (jobId || null));
    return filtered.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  const getVersion = (id) => allVersions().find((v) => v.id === id) || null;

  function saveVersion({ jobId = null, label = "", latex = "", changes = [], source = "manual" }) {
    const version = {
      id: newId(),
      jobId: jobId || null,
      label: String(label || "").trim() || "Untitled version",
      latex: redact(String(latex || "")),
      changes: Array.isArray(changes) ? changes : [],
      source,                                   // "claude" | "manual"
      createdAt: new Date().toISOString(),
    };
    writeVersions([version, ...allVersions()]);
    notify();
    return version;
  }

  // The newest version for a job — what the next tailoring should build on.
  const latestVersion = (jobId) => listVersions(jobId || null)[0] || null;

  function deleteVersion(id) {
    writeVersions(allVersions().filter((v) => v.id !== id));
    notify();
  }

  // In-place text update — how autosave keeps a loaded version current.
  function updateVersion(id, latex) {
    const list = allVersions();
    const at = list.findIndex((v) => v.id === id);
    if (at < 0) return null;
    list[at] = { ...list[at], latex: redact(String(latex || "")), updatedAt: new Date().toISOString() };
    writeVersions(list);
    notify();
    return list[at];
  }

  function renameVersion(id, label) {
    const list = allVersions();
    const at = list.findIndex((v) => v.id === id);
    if (at < 0) return;
    list[at] = { ...list[at], label: String(label || "").trim() || list[at].label };
    writeVersions(list);
    notify();
  }

  /* ------------------------------------------------------------- migration */

  /* Drains the pre-sync localStorage cells into Store, once. Runs after the
   * first Firebase pull so a device that already has remote data merges into
   * it rather than overwriting it. */
  function migrateLocal() {
    let moved = 0;
    try {
      const oldBase = localStorage.getItem(OLD_BASE);
      if (oldBase !== null) {
        const text = JSON.parse(oldBase);
        if (typeof text === "string" && text.trim() && window.Store.get(KEY_BASE, null) === null) {
          window.Store.set(KEY_BASE, redact(text));
          moved++;
        }
        localStorage.removeItem(OLD_BASE);
      }

      const oldVersions = localStorage.getItem(OLD_VERSIONS);
      if (oldVersions !== null) {
        const incoming = JSON.parse(oldVersions);
        if (Array.isArray(incoming) && incoming.length) {
          const existing = allVersions();
          const seen = new Set(existing.map((v) => v.id));
          const fresh = incoming
            .filter((v) => v && v.id && !seen.has(v.id))
            .map((v) => ({ ...v, latex: redact(v.latex) }));
          if (fresh.length) { writeVersions([...fresh, ...existing]); moved += fresh.length; }
        }
        localStorage.removeItem(OLD_VERSIONS);
      }
    } catch (e) { console.warn("Resume: migration skipped —", e.message); }
    if (moved) notify();
    return moved;
  }

  window.Resume = {
    DEFAULT_LATEX, PLACEHOLDERS, FIELDS,
    getBase, setBase, resetBase,
    getContact, setContact, hasContact, applyContact, redact, needsContactDetails, escapeLatex,
    listVersions, latestVersion, getVersion, saveVersion, updateVersion, deleteVersion, renameVersion,
    migrateLocal, onChange,
  };
})();
