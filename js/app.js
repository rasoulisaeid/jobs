/* App — the jobs dashboard. Waits for Firebase, then renders. */
(function () {
  const $ = (id) => document.getElementById(id);
  const { el } = window.UI;

  let editingId = null;
  let sort = { key: "createdAt", dir: "desc" };

  /* ------------------------------------------------------------ formatting */

  const PERIOD_LABEL = { hour: "hr", day: "day", week: "wk", month: "mo", year: "yr" };

  const formatMoney = (n) => (n % 1 === 0 ? n.toLocaleString("en-US") : n.toFixed(2));

  function formatPay(job) {
    const { payMin: min, payMax: max, payPeriod: period } = job;
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

  /* -------------------------------------------------------------- rendering */

  function visibleJobs() {
    const query = $("search").value.trim().toLowerCase();
    const category = $("categoryFilter").value;

    const filtered = window.Data.listJobs().filter((job) => {
      if (category && job.category !== category) return false;
      if (!query) return true;
      return [job.title, job.company, job.address, job.category, job.description]
        .join(" ").toLowerCase().includes(query);
    });

    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      let av, bv;
      if (key === "pay") {
        av = a.payMin ?? a.payMax ?? -Infinity;
        bv = b.payMin ?? b.payMax ?? -Infinity;
      } else if (key === "createdAt") {
        av = a.createdAt || ""; bv = b.createdAt || "";
      } else {
        av = (a[key] || "").toLowerCase(); bv = (b[key] || "").toLowerCase();
      }
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  }

  function renderTable() {
    const all = window.Data.listJobs();
    const rows = visibleJobs();
    const body = $("jobsBody");
    body.replaceChildren();

    for (const job of rows) {
      const addressCell = job.address && job.address.trim().toLowerCase() !== "remote"
        ? el("td", { class: "cell-address" }, el("a", {
            href: mapsUrl(job.address), target: "_blank", rel: "noopener noreferrer",
            title: "Open in Google Maps", text: job.address,
          }))
        : el("td", { class: "cell-address", text: job.address || "" });

      const [bg, fg] = job.category ? chipColor(job.category) : ["", ""];

      body.append(el("tr", null,
        el("td", { class: "cell-title", text: job.title || "(untitled)" }),
        el("td", null, job.category
          ? el("span", { class: "chip", style: { background: bg, color: fg }, text: job.category })
          : null),
        el("td", { text: job.company || "" }),
        addressCell,
        el("td", { class: "cell-pay", text: formatPay(job) }),
        el("td", { class: "cell-muted", text: job.employmentType || "" }),
        el("td", { class: "col-tight" }, safeUrl(job.link)
          ? el("a", { href: safeUrl(job.link), target: "_blank", rel: "noopener noreferrer", text: "Open ↗" })
          : null),
        el("td", { class: "col-tight" },
          el("button", { class: "row-edit", type: "button", text: "Edit", onclick: () => openJobModal(job) })),
      ));
    }

    $("jobCount").textContent = all.length
      ? `${rows.length}${rows.length === all.length ? "" : ` of ${all.length}`}`
      : "";
    $("emptyState").hidden = all.length > 0;
    $("tableWrap").hidden = all.length === 0;

    document.querySelectorAll("th[data-sort]").forEach((th) => {
      const arrow = th.querySelector(".arrow");
      if (arrow) arrow.remove();
      if (th.dataset.sort === sort.key) {
        th.append(el("span", { class: "arrow", text: sort.dir === "asc" ? " ▲" : " ▼" }));
      }
    });
  }

  function renderCategories() {
    const categories = window.Data.listCategories();

    const filter = $("categoryFilter");
    const currentFilter = filter.value;
    filter.replaceChildren(new Option("All categories", ""));
    for (const name of categories) filter.append(new Option(name, name));
    filter.value = categories.includes(currentFilter) ? currentFilter : "";

    const select = $("category");
    const chosen = select.value;
    select.replaceChildren(new Option("—", ""));
    for (const name of categories) select.append(new Option(name, name));
    if (chosen && categories.includes(chosen)) select.value = chosen;

    const list = $("categoryList");
    list.replaceChildren();
    for (const name of categories) {
      const [bg, fg] = chipColor(name);
      list.append(el("span", { class: "chip", style: { background: bg, color: fg } }, name,
        el("button", {
          type: "button", text: "×", title: `Remove ${name}`,
          onclick: async () => { await window.Data.removeCategory(name); },
        })));
    }
  }

  function renderAll() {
    if (!window.Data.isLoaded()) return;
    renderCategories();
    renderTable();
  }

  async function setCategoryValue(name) {
    if (name) await window.Data.addCategory(name);
    renderCategories();
    $("category").value = name || "";
  }

  /* ------------------------------------------------------------- job modal */

  function openJobModal(job) {
    editingId = job?.id ?? null;
    $("jobModalTitle").textContent = job ? "Edit job" : "Add job";
    $("deleteBtn").hidden = !job;

    $("description").value = job?.description || "";
    $("link").value = job?.link || "";
    $("title").value = job?.title || "";
    $("company").value = job?.company || "";
    $("address").value = job?.address || "";
    $("payMin").value = job?.payMin ?? "";
    $("payMax").value = job?.payMax ?? "";
    $("payPeriod").value = job?.payPeriod || "";
    $("employmentType").value = job?.employmentType || "";
    $("category").value = job?.category || "";

    $("addressHint").textContent = "";
    setStatus("");
    $("jobModal").showModal();
    (job ? $("title") : $("description")).focus();
  }

  function setStatus(message, kind = "") {
    const node = $("extractStatus");
    node.textContent = message;
    node.className = `status ${kind}`;
  }

  async function runExtract() {
    const button = $("extractBtn");
    button.disabled = true;
    setStatus("Reading the posting…");

    try {
      const data = await window.Extract.extract($("description").value);
      $("title").value = data.title || "";
      $("company").value = data.company || "";
      $("address").value = data.address || "";
      $("payMin").value = data.pay_min ?? "";
      $("payMax").value = data.pay_max ?? "";
      $("payPeriod").value = data.pay_period || "";
      $("employmentType").value = data.employment_type || "";
      await setCategoryValue(data.category || "");

      // An address Claude looked up is a best guess — say so while it's reviewable.
      const hint = $("addressHint");
      hint.className = data.address_from_web ? "hint warn" : "hint";
      hint.textContent = data.address_from_web
        ? "Found by web search, not in the posting — worth a quick check."
        : "";

      setStatus("Filled in — check the fields before saving.", "ok");
    } catch (e) {
      setStatus(e.message, "error");
    } finally {
      button.disabled = false;
    }
  }

  async function saveJob(event) {
    event.preventDefault();
    try {
      await window.Data.saveJob({
        id: editingId,
        title: $("title").value,
        category: $("category").value,
        company: $("company").value,
        address: $("address").value,
        payMin: $("payMin").value,
        payMax: $("payMax").value,
        payPeriod: $("payPeriod").value,
        employmentType: $("employmentType").value,
        link: $("link").value,
        description: $("description").value,
        createdAt: editingId ? window.Data.listJobs().find((j) => j.id === editingId)?.createdAt : null,
      });
      $("jobModal").close();
      toast(editingId ? "Job updated" : "Job added");
    } catch (e) {
      setStatus(e.message, "error");
    }
  }

  /* -------------------------------------------------------- settings modal */

  function renderKeyStatus() {
    const status = $("keyStatus");
    const hasKey = window.Data.hasApiKey();
    $("apiKey").value = "";
    $("removeKeyBtn").hidden = !hasKey;

    if (hasKey) {
      $("apiKey").placeholder = "Leave blank to keep the saved key";
      status.className = "hint ok";
      status.textContent = `✓ Saved: ${window.Data.keyPreview()} — type a new key only to replace it.`;
    } else {
      $("apiKey").placeholder = "sk-ant-…";
      status.className = "hint warn";
      status.textContent = "No key saved yet — extraction needs one.";
    }
  }

  function renderEffortOptions(preferred) {
    const model = window.Extract.findModel($("model").value);
    const effort = $("effort");
    $("modelHint").textContent = model.note;

    if (!model.efforts.length) {
      effort.replaceChildren(new Option("Not applicable", ""));
      effort.disabled = true;
      $("effortHint").textContent = `${model.label.split(" — ")[0]} has no effort setting.`;
      return;
    }

    effort.disabled = false;
    effort.replaceChildren();
    for (const level of model.efforts) {
      effort.append(new Option(window.Extract.EFFORT_LABELS[level] || level, level));
    }
    effort.value = model.efforts.includes(preferred) ? preferred : "medium";
    $("effortHint").textContent = "How hard Claude thinks before answering. Higher costs more.";
  }

  function openSettings() {
    const prefs = window.Data.getPrefs();

    const model = $("model");
    model.replaceChildren();
    for (const m of window.Extract.MODELS) model.append(new Option(m.label, m.id));
    model.value = prefs.model;

    renderKeyStatus();
    renderEffortOptions(prefs.effort);
    $("webSearch").checked = prefs.webSearch;
    renderCategories();
    $("settingsModal").showModal();
  }

  async function saveSettings(event) {
    event.preventDefault();
    try {
      if ($("apiKey").value.trim()) await window.Data.setApiKey($("apiKey").value);
      window.Data.setPrefs({
        model: $("model").value,
        effort: $("effort").disabled ? "medium" : $("effort").value,
        webSearch: $("webSearch").checked,
      });
      renderKeyStatus();
      $("settingsModal").close();
      toast("Settings saved");
    } catch (e) {
      toast(e.message);
    }
  }

  /* -------------------------------------------------------- import / export */

  function exportJson() {
    const payload = window.Data.exportAll();
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const stamp = new Date().toISOString().slice(0, 10);
    const link = el("a", { href: url, download: `jobs-${stamp}.json` });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(`Exported ${payload.jobs.length} jobs`);
  }

  async function importJson(file) {
    try {
      const result = await window.Data.importAll(JSON.parse(await file.text()));
      $("importHint").className = "hint ok";
      $("importHint").textContent = `Imported ${result.added} job${result.added === 1 ? "" : "s"}` +
        (result.skipped ? `, skipped ${result.skipped} already here.` : ".");
      toast(`Imported ${result.added} jobs`);
    } catch (e) {
      $("importHint").className = "hint warn";
      $("importHint").textContent = e.message;
    }
  }

  /* ------------------------------------------------------------------ toast */

  let toastTimer;
  function toast(message) {
    const node = $("toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2400);
  }

  /* ----------------------------------------------------------------- wiring */

  $("addBtn").addEventListener("click", () => openJobModal(null));
  $("settingsBtn").addEventListener("click", openSettings);
  $("extractBtn").addEventListener("click", runExtract);
  $("jobForm").addEventListener("submit", saveJob);
  $("settingsForm").addEventListener("submit", saveSettings);
  $("search").addEventListener("input", renderTable);
  $("categoryFilter").addEventListener("change", renderTable);
  $("model").addEventListener("change", () => renderEffortOptions($("effort").value));

  $("deleteBtn").addEventListener("click", async () => {
    if (!editingId || !confirm("Delete this job?")) return;
    await window.Data.deleteJob(editingId);
    $("jobModal").close();
    toast("Job deleted");
  });

  $("removeKeyBtn").addEventListener("click", async () => {
    if (!confirm("Remove the saved Claude API key?")) return;
    await window.Data.setApiKey("");
    renderKeyStatus();
    toast("API key removed");
  });

  $("newCategoryBtn").addEventListener("click", async () => {
    const name = prompt("New category name:");
    if (name && name.trim()) await setCategoryValue(name.trim());
  });

  $("addCategoryBtn").addEventListener("click", async () => {
    const input = $("newCategoryInput");
    if (input.value.trim()) await window.Data.addCategory(input.value.trim());
    input.value = "";
  });

  $("newCategoryInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); $("addCategoryBtn").click(); }
  });

  $("exportBtn").addEventListener("click", exportJson);
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) importJson(file);
    event.target.value = "";
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      sort = sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" };
      renderTable();
    });
  });

  // Ctrl/Cmd+Enter runs extraction from inside the description box.
  $("description").addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runExtract();
    }
  });

  window.Data.onChange(renderAll);

  // A change arriving from another device replaces the store wholesale, so the
  // copy held in memory has to be rebuilt.
  window.addEventListener("jobs-synced", () => window.Data.load());

  window.addEventListener("jobs-sync-status", (event) => {
    const dot = $("syncDot");
    const { online, error } = event.detail;
    dot.className = "sync-dot" + (!online ? " offline" : error ? " error" : "");
    dot.title = !online ? "Offline — changes save locally" : error ? `Sync problem: ${error}` : "Synced";
  });

  /* ------------------------------------------------------------------- boot */

  (async function init() {
    await window.Sync.ready;          // let Firebase land before we read the store
    await window.Data.load();
  })();
})();
