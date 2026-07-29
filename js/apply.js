/* Apply page — shows one job, and the resume being sent for it.
 *
 * ?job=<id>  the role to tailor for; no parameter means the default resume.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const { el } = window.UI;

  const jobId = new URLSearchParams(location.search).get("job");
  let job = null;
  let activeVersionId = null;   // which saved version is loaded, if any
  let loadedText = "";          // what the textarea held when it was last loaded

  const PERIOD_LABEL = { hour: "hr", day: "day", week: "wk", month: "mo", year: "yr" };

  const formatMoney = (n) => (n % 1 === 0 ? n.toLocaleString("en-US") : n.toFixed(2));

  function formatPay(j) {
    const { payMin: min, payMax: max, payPeriod: period } = j;
    if (min == null && max == null) return "";
    const unit = period ? `/${PERIOD_LABEL[period] || period}` : "";
    if (min != null && max != null && min !== max) return `$${formatMoney(min)}–${formatMoney(max)}${unit}`;
    return `$${formatMoney(min ?? max)}${unit}`;
  }

  const CHIP_COLORS = [
    ["#ede9fe", "#5b21b6"], ["#e0f2fe", "#075985"], ["#dcfce7", "#166534"],
    ["#ffedd5", "#9a3412"], ["#fce7f3", "#9d174d"], ["#ccfbf1", "#115e59"],
    ["#fef9c3", "#854d0e"],
  ];

  function chipColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return CHIP_COLORS[hash % CHIP_COLORS.length];
  }

  function safeUrl(raw) {
    if (!raw) return null;
    try {
      const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch (e) { return null; }
  }

  const mapsUrl = (address) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* ------------------------------------------------------------- the role */

  function renderJob() {
    if (!job) {
      $("jobTitle").textContent = "Default resume";
      $("jobCompany").textContent = "The version everything else starts from.";
      document.title = "Resume — Jobs";
      $("editorTitle").textContent = "Default resume";
      $("tailorBtn").hidden = true;
      $("saveBaseBtn").hidden = false;
      return;
    }

    $("jobTitle").textContent = job.title || "(untitled)";
    $("jobCompany").textContent = job.company || "";
    document.title = `${job.title || "Apply"} — Jobs`;
    $("editorTitle").textContent = "Resume for this job";

    if (job.category) {
      const [bg, fg] = chipColor(job.category);
      const chip = $("jobCategory");
      chip.textContent = job.category;
      chip.style.background = bg;
      chip.style.color = fg;
      chip.hidden = false;
    }

    const facts = $("jobFacts");
    const address = (job.address || "").trim();
    if (address) {
      facts.append(address.toLowerCase() === "remote"
        ? el("span", null, el("b", { text: "Remote" }))
        : el("span", null, el("a", {
            href: mapsUrl(address), target: "_blank", rel: "noopener noreferrer",
            title: "Open in Google Maps", text: address,
          })));
    }
    const pay = formatPay(job);
    if (pay) facts.append(el("span", null, el("b", { text: pay })));
    if (job.employmentType) facts.append(el("span", { text: job.employmentType }));

    const link = safeUrl(job.link);
    if (link) { $("jobLink").href = link; $("jobLink").hidden = false; }

    if ((job.description || "").trim()) {
      $("postingText").textContent = job.description;
      $("postingBox").hidden = false;
    }
  }

  /* -------------------------------------------------------------- editing */

  function loadIntoEditor(text, versionId = null) {
    $("latex").value = text;
    loadedText = text;
    activeVersionId = versionId;
    renderEditorState();
    renderVersions();
  }

  const isDirty = () => $("latex").value !== loadedText;

  function renderPaper() {
    const paper = $("paper");
    try {
      paper.innerHTML = window.LatexRender.toHtml($("latex").value);
    } catch (e) {
      // A preview failing must never cost her the document.
      paper.replaceChildren(el("p", {
        class: "hint warn",
        text: "Couldn't preview this LaTeX — the source is still intact under “Edit the LaTeX source”.",
      }));
      console.warn("preview failed", e);
    }
  }

  function renderEditorState() {
    const version = activeVersionId ? window.Resume.getVersion(activeVersionId) : null;
    const dirty = isDirty();

    $("editorState").textContent = version
      ? `${version.label}${dirty ? " — edited" : ""}`
      : dirty ? "Edited — not saved" : "Default resume";

    $("revertBtn").hidden = !dirty;
    $("saveBaseBtn").hidden = Boolean(job) && !dirty && !version;
    $("contactWarn").hidden = !window.Resume.needsContactDetails($("latex").value);
    $("charCount").textContent = `${$("latex").value.length.toLocaleString("en-US")} characters`;
    renderPaper();
  }

  function renderVersions() {
    const versions = window.Resume.listVersions(jobId || null);
    const list = $("versionList");
    list.replaceChildren();
    $("versionsEmpty").hidden = versions.length > 0;

    for (const version of versions) {
      const when = new Date(version.createdAt);
      list.append(el("li", { class: `version${version.id === activeVersionId ? " active" : ""}` },
        el("div", {
          class: "version-main",
          title: "Load this version",
          onclick: () => {
            if (isDirty() && !confirm("Discard the unsaved edits and load this version?")) return;
            loadIntoEditor(version.latex, version.id);
            renderChanges(version.changes || []);
            toast(`Loaded “${version.label}”`);
          },
        },
          el("div", { class: "version-name", text: version.label }),
          el("div", {
            class: "version-date",
            text: when.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              + " · " + when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          }),
        ),
        el("button", {
          type: "button", title: `Delete “${version.label}”`, "aria-label": "Delete version",
          onclick: () => {
            if (!confirm(`Delete “${version.label}”?`)) return;
            window.Resume.deleteVersion(version.id);
            if (activeVersionId === version.id) activeVersionId = null;
            renderVersions();
            renderEditorState();
            toast("Version deleted");
          },
        }, el("span", { class: "material-symbols-rounded", style: { fontSize: "18px" }, text: "delete" })),
      ));
    }
  }

  function renderChanges(changes) {
    const box = $("changesBox");
    const list = $("changesList");
    list.replaceChildren();
    if (!changes || !changes.length) { box.hidden = true; return; }
    for (const line of changes) list.append(el("li", { text: line }));
    box.hidden = false;
  }

  /* --------------------------------------------------------------- Claude */

  function setStatus(message, kind = "") {
    const node = $("tailorStatus");
    node.textContent = message;
    node.className = `status ${kind}`;
  }

  async function runTailor() {
    const button = $("tailorBtn");
    button.disabled = true;
    setStatus("Claude is rewriting the resume for this job — this takes a moment at high effort…");

    try {
      const result = await window.Tailor.tailor(job, $("latex").value);
      loadIntoEditor(result.latex, null);
      renderChanges(result.changes);
      setStatus("Done — read it through before you save it.", "ok");
    } catch (e) {
      setStatus(e.message, "error");
    } finally {
      button.disabled = false;
    }
  }

  /* -------------------------------------------------------------- exports */

  function fileName(extension) {
    const who = "resume";
    const what = job ? slug(`${job.company || ""} ${job.title || ""}`) : "default";
    return `${who}${what ? "-" + what : ""}.${extension}`;
  }

  function download() {
    const url = URL.createObjectURL(new Blob([$("latex").value], { type: "application/x-tex" }));
    const link = el("a", { href: url, download: fileName("tex") });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(`Saved ${fileName("tex")}`);
  }

  async function copyLatex() {
    try {
      await navigator.clipboard.writeText($("latex").value);
      toast("LaTeX copied");
    } catch (e) {
      $("latex").select();
      toast("Press Ctrl+C to copy");
    }
  }

  /* ---------------------------------------------------------------- toast */

  let toastTimer;
  function toast(message) {
    const node = $("toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2400);
  }

  /* --------------------------------------------------------------- wiring */

  $("latex").addEventListener("input", renderEditorState);
  $("tailorBtn").addEventListener("click", runTailor);
  $("downloadBtn").addEventListener("click", download);
  $("copyBtn").addEventListener("click", copyLatex);
  $("printBtn").addEventListener("click", () => window.print());

  $("saveVersionBtn").addEventListener("click", () => {
    const suggested = job
      ? `${job.company || job.title || "Job"} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : `Version — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const label = prompt("Name this version:", suggested);
    if (label === null) return;
    const saved = window.Resume.saveVersion({
      jobId: jobId || null,
      label,
      latex: $("latex").value,
      changes: [...$("changesList").children].map((li) => li.textContent),
    });
    loadIntoEditor($("latex").value, saved.id);
    toast("Version saved");
  });

  $("saveBaseBtn").addEventListener("click", () => {
    if (!confirm("Replace the default resume with what is in the box?\n\nEvery future tailoring starts from this.")) return;
    window.Resume.setBase($("latex").value);
    loadIntoEditor($("latex").value, null);
    toast("Default resume updated");
  });

  $("revertBtn").addEventListener("click", () => {
    if (!confirm("Discard the changes since this was loaded?")) return;
    loadIntoEditor(loadedText, activeVersionId);
  });

  $("resetBtn").addEventListener("click", () => {
    if (!confirm("Throw away the saved default and go back to the resume the app shipped with?\n\nSaved versions are kept.")) return;
    loadIntoEditor(window.Resume.resetBase(), null);
    renderChanges([]);
    toast("Reset to the shipped resume");
  });

  $("overleafForm").addEventListener("submit", () => {
    $("overleafSnip").value = $("latex").value;
    $("overleafName").value = fileName("tex");
  });

  window.addEventListener("beforeunload", (event) => {
    if (!isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  window.addEventListener("jobs-sync-status", (event) => {
    const dot = $("syncDot");
    const { online, error } = event.detail;
    dot.className = "sync-dot" + (!online ? " offline" : error ? " error" : "");
    dot.title = !online ? "Offline — changes save locally" : error ? `Sync problem: ${error}` : "Synced";
  });

  /* ------------------------------------------------------------------ boot */

  (async function init() {
    await window.Sync.ready;
    await window.Data.load();

    if (jobId) {
      job = window.Data.listJobs().find((j) => j.id === jobId) || null;
      if (!job) {
        setStatus("That job is no longer in the list — showing the default resume.", "error");
      }
    }
    renderJob();
    loadIntoEditor(window.Resume.getBase(), null);
  })();
})();
