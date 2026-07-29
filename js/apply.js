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

  // The document keeps its placeholder tokens; the real details are only
  // stitched in on the way out — to the preview, the printer, or a file.
  const forOutput = () => window.Resume.applyContact($("latex").value);

  function renderPaper() {
    const paper = $("paper");
    try {
      paper.innerHTML = window.LatexRender.toHtml(forOutput());
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

  // "v3 — Jul 29" — the number counts what already exists for this job.
  function nextVersionLabel() {
    const n = window.Resume.listVersions(jobId || null).length + 1;
    const when = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `v${n} — ${when}`;
  }

  function openTailorPanel() {
    $("tailorTarget").textContent = job
      ? `Tailor for ${job.title || "this role"}${job.company ? ` at ${job.company}` : ""}`
      : "Make a new version of the default resume";
    $("tailorPanel").hidden = false;
    $("tailorBtn").disabled = true;
    setStatus("");
    setTimeout(() => $("tailorNotes").focus(), 40);
  }

  function closeTailorPanel() {
    $("tailorPanel").hidden = true;
    $("tailorBtn").disabled = false;
  }

  async function runTailor() {
    closeTailorPanel();
    const button = $("tailorBtn");
    button.disabled = true;
    setStatus("Claude is rewriting the resume for this job — this takes a moment at high effort…");

    try {
      const result = await window.Tailor.tailor(job, $("latex").value, $("tailorNotes").value);

      // Saved straight away, so it syncs and the next tailoring builds on it
      // rather than starting over from the default.
      const saved = window.Resume.saveVersion({
        jobId: jobId || null,
        label: nextVersionLabel(),
        latex: result.latex,
        changes: result.changes,
        source: "claude",
      });

      loadIntoEditor(result.latex, saved.id);
      renderChanges(result.changes);
      setStatus(`Saved as “${saved.label}”. Read it through — edit freely, it will sync.`, "ok");
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
    const url = URL.createObjectURL(new Blob([forOutput()], { type: "application/x-tex" }));
    const link = el("a", { href: url, download: fileName("tex") });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(`Saved ${fileName("tex")}`);
  }

  async function copyLatex() {
    try {
      await navigator.clipboard.writeText(forOutput());
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
  $("tailorBtn").addEventListener("click", openTailorPanel);
  $("tailorRunBtn").addEventListener("click", runTailor);
  $("tailorCancelBtn").addEventListener("click", closeTailorPanel);

  $("tailorNotes").addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); runTailor(); }
    if (event.key === "Escape") { event.preventDefault(); closeTailorPanel(); }
  });
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
    $("overleafSnip").value = forOutput();
    $("overleafName").value = fileName("tex");
  });

  $("contactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    window.Resume.setContact({
      address: $("contactAddress").value,
      phone: $("contactPhone").value,
      email: $("contactEmail").value,
    });
    renderEditorState();
    toast("Contact details saved on this device");
  });

  // Live preview while typing, without committing to storage yet.
  for (const id of ["contactAddress", "contactPhone", "contactEmail"]) {
    $(id).addEventListener("input", renderPreviewWithForm);
  }

  function renderPreviewWithForm() {
    const draft = window.Resume.applyContact($("latex").value, {
      address: $("contactAddress").value.trim(),
      phone: $("contactPhone").value.trim(),
      email: $("contactEmail").value.trim(),
    });
    try { $("paper").innerHTML = window.LatexRender.toHtml(draft); } catch (e) {}
  }

  function loadContactForm() {
    const contact = window.Resume.getContact();
    $("contactAddress").value = contact.address;
    $("contactPhone").value = contact.phone;
    $("contactEmail").value = contact.email;
  }

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
    window.Resume.migrateLocal();   // drain the pre-sync cells, once

    if (jobId) {
      job = window.Data.listJobs().find((j) => j.id === jobId) || null;
      if (!job) {
        setStatus("That job is no longer in the list — showing the default resume.", "error");
      }
    }
    renderJob();
    loadContactForm();
    openLatestOrBase();
  })();

  // Pick up where she left off: the newest version for this job if there is
  // one, otherwise the default resume.
  function openLatestOrBase() {
    const latest = window.Resume.latestVersion(jobId || null);
    if (latest) {
      loadIntoEditor(latest.latex, latest.id);
      renderChanges(latest.changes || []);
      $("editorState").textContent = latest.label;
    } else {
      loadIntoEditor(window.Resume.getBase(), null);
    }
  }

  // A sync from another device replaces the store wholesale.
  window.addEventListener("jobs-synced", () => {
    if (isDirty()) { toast("Newer resume arrived from another device — your edits are still here"); return; }
    renderVersions();
    if (!activeVersionId) openLatestOrBase();
  });
})();
