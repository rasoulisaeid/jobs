/* Resume — the base LaTeX CV plus the tailored versions made from it.
 *
 * Deliberately NOT in Store, so none of this syncs to Firebase. A resume holds
 * a home address, a phone number and a personal email, and this repo is public
 * — including js/sync.js, which spells out the database URL. Anyone reading the
 * repo could fetch the node. So the resume lives in this browser only, next to
 * the API key.
 *
 * The cost is real: nothing here follows her to a second device. Flipping to
 * synced is a small change (swap the localStorage calls for window.Store), but
 * it publishes the contact details, so it should be a deliberate decision.
 *
 * For the same reason DEFAULT_LATEX ships with the contact line placeheld. Her
 * real details are typed in once and never leave the machine except when she
 * chooses to send a resume to Claude or to Overleaf.
 */
(function () {
  const CELL = "jobs:local:resume";
  const CELL_VERSIONS = "jobs:local:resumeVersions";

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

  // The strings left in DEFAULT_LATEX for her to replace. Used to nag once.
  const PLACEHOLDERS = ["CITY, STATE ZIP", "PHONE NUMBER", "EMAIL ADDRESS"];

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

  const getBase = () => readCell(CELL, DEFAULT_LATEX);

  function setBase(latex) {
    writeCell(CELL, String(latex || ""));
    notify();
  }

  function resetBase() {
    try { localStorage.removeItem(CELL); } catch (e) {}
    notify();
    return DEFAULT_LATEX;
  }

  // True while the shipped contact line is still in place.
  const needsContactDetails = (latex) => {
    const text = latex === undefined ? getBase() : latex;
    return PLACEHOLDERS.some((p) => text.includes(p));
  };

  /* --------------------------------------------------------------- versions */

  const newId = () => "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function allVersions() {
    const list = readCell(CELL_VERSIONS, []);
    return Array.isArray(list) ? list : [];
  }

  // jobId undefined -> every version; null -> the ones not tied to a job.
  function listVersions(jobId) {
    const list = allVersions();
    const filtered = jobId === undefined ? list : list.filter((v) => (v.jobId || null) === (jobId || null));
    return filtered.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  const getVersion = (id) => allVersions().find((v) => v.id === id) || null;

  function saveVersion({ jobId = null, label = "", latex = "", changes = [] }) {
    const version = {
      id: newId(),
      jobId: jobId || null,
      label: String(label || "").trim() || "Untitled version",
      latex: String(latex || ""),
      changes: Array.isArray(changes) ? changes : [],
      createdAt: new Date().toISOString(),
    };
    writeCell(CELL_VERSIONS, [version, ...allVersions()]);
    notify();
    return version;
  }

  function deleteVersion(id) {
    writeCell(CELL_VERSIONS, allVersions().filter((v) => v.id !== id));
    notify();
  }

  function renameVersion(id, label) {
    const list = allVersions();
    const at = list.findIndex((v) => v.id === id);
    if (at < 0) return;
    list[at] = { ...list[at], label: String(label || "").trim() || list[at].label };
    writeCell(CELL_VERSIONS, list);
    notify();
  }

  window.Resume = {
    DEFAULT_LATEX, PLACEHOLDERS,
    getBase, setBase, resetBase, needsContactDetails,
    listVersions, getVersion, saveVersion, deleteVersion, renameVersion,
    onChange,
  };
})();
