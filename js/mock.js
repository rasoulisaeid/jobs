/* Interview page — one researched question set per job, all of it on screen.
 *
 * ?job=<id>  the job to prepare for; no parameter shows a list to pick from.
 *
 * Everything is visible at once by design. This is a study sheet, not a
 * simulation: she reads down it, plays a question when she wants to hear the
 * accent, and covers the answer with her hand when she wants to test herself.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const { el } = window.UI;

  let jobId = new URLSearchParams(location.search).get("job");
  let job = null;

  /* ------------------------------------------------------------ formatting */

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
      const url = new URL(String(raw).includes("://") ? raw : `https://${raw}`);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch (e) { return null; }
  }

  const mapsUrl = (address) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  /* ---------------------------------------------------------------- voices */

  function renderVoices() {
    const voices = window.Voice.listVoices();
    const select = $("voiceSelect");

    select.replaceChildren();
    if (!voices.length) {
      select.append(new Option("No voice yet — add one", ""));
      select.disabled = true;
    } else {
      select.disabled = false;
      for (const v of voices) select.append(new Option(v.name, v.id));
      select.value = window.Voice.getSelected();
    }

    $("removeVoiceBtn").hidden = !voices.length;
    $("testVoiceBtn").disabled = !voices.length;

    const status = $("voiceStatus");
    if (!window.Voice.hasKey()) {
      status.className = "hint";
      status.textContent = "Optional. Add an ElevenLabs key under Settings on the jobs page to hear the questions read out in different accents.";
    } else if (!voices.length) {
      status.className = "hint warn";
      status.textContent = "Key saved. Add a voice ID to hear the questions.";
    } else {
      status.className = "hint ok";
      status.textContent = `${voices.length} voice${voices.length === 1 ? "" : "s"} ready — switch between them to practise different accents.`;
    }
  }

  $("voiceSelect").addEventListener("change", (event) => window.Voice.setSelected(event.target.value));

  $("addVoiceBtn").addEventListener("click", () => {
    $("addVoiceForm").hidden = false;
    $("voiceName").focus();
  });

  $("cancelVoiceBtn").addEventListener("click", () => {
    $("addVoiceForm").hidden = true;
    $("voiceName").value = "";
    $("voiceId").value = "";
  });

  $("addVoiceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const voice = window.Voice.addVoice($("voiceName").value, $("voiceId").value);
      window.Voice.setSelected(voice.id);
      $("addVoiceForm").hidden = true;
      $("voiceName").value = "";
      $("voiceId").value = "";
      renderVoices();
      toast(`Added ${voice.name}`);
    } catch (e) { toast(e.message); }
  });

  $("removeVoiceBtn").addEventListener("click", () => {
    const id = $("voiceSelect").value;
    const voice = window.Voice.listVoices().find((v) => v.id === id);
    if (!voice || !confirm(`Remove “${voice.name}” from the list?`)) return;
    window.Voice.removeVoice(id);
    renderVoices();
  });

  $("testVoiceBtn").addEventListener("click", async () => {
    const button = $("testVoiceBtn");
    button.disabled = true;
    try {
      await window.Voice.speak("Thanks for coming in today. Tell me a little about yourself.", $("voiceSelect").value);
    } catch (e) { toast(e.message); } finally { button.disabled = false; }
  });

  async function playQuestion(text, button) {
    const icon = button.querySelector(".material-symbols-rounded");
    button.disabled = true;
    icon.textContent = "graphic_eq";
    try {
      await window.Voice.speak(text, $("voiceSelect").value);
    } catch (e) {
      toast(e.message);
    } finally {
      button.disabled = false;
      icon.textContent = "volume_up";
    }
  }

  /* ------------------------------------------------------------- the job */

  function renderJob() {
    $("jobTitle").textContent = job.title || "(untitled)";
    $("jobCompany").textContent = job.company || "";
    document.title = `${job.title || "Interview"} — Interview`;

    if (job.category) {
      const [bg, fg] = chipColor(job.category);
      const chip = $("jobCategory");
      chip.textContent = job.category;
      chip.style.background = bg;
      chip.style.color = fg;
      chip.hidden = false;
    }

    const facts = $("jobFacts");
    facts.replaceChildren();
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
  }

  function renderJobPicker() {
    const jobs = window.Data.listJobs();
    const list = $("jobList");
    list.replaceChildren();

    for (const j of jobs) {
      const saved = window.Interviews.get(j.id);
      list.append(el("a", {
        class: `job-pick${saved ? " is-ready" : ""}`,
        href: `mock.html?job=${encodeURIComponent(j.id)}`,
      },
        el("span", { class: "job-pick-title", text: j.title || "(untitled)" }),
        el("span", { class: "job-pick-company", text: j.company || "" }),
        el("span", {
          class: "job-pick-meta",
          text: saved ? `${window.Interviews.countQuestions(saved)} questions ready` : "Not built yet",
        }),
      ));
    }

    if (!jobs.length) {
      list.append(el("p", { class: "hint", text: "No jobs saved yet. Add one on the jobs page first." }));
    }
  }

  /* ------------------------------------------------------------ the sheet */

  function renderInterview() {
    const saved = window.Interviews.get(jobId);
    $("result").hidden = !saved;
    $("emptyState").hidden = Boolean(saved);
    $("regenBtn").hidden = !saved;
    $("genLabel").textContent = saved ? "Build a new one" : "Build the interview";

    if (!saved) { $("qCount").textContent = ""; $("genMeta").textContent = ""; return; }

    const total = window.Interviews.countQuestions(saved);
    $("qCount").textContent = `${total} questions`;
    const when = new Date(saved.createdAt);
    $("genMeta").textContent = `Built ${when.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

    // what the research turned up
    $("researchBox").hidden = !saved.research && !(saved.sources || []).length;
    $("researchText").textContent = saved.research || "";
    const sources = $("sourceList");
    sources.replaceChildren();
    for (const source of saved.sources || []) {
      const url = safeUrl(source.url);
      if (!url) continue;
      sources.append(el("a", {
        class: "source", href: url, target: "_blank", rel: "noopener noreferrer",
      }, el("span", { class: "material-symbols-rounded", text: "link" }), source.title || url));
    }

    // every question on the page at once
    const wrap = $("sections");
    wrap.replaceChildren();
    let n = 0;

    for (const section of saved.sections || []) {
      const block = el("section", { class: "qa-section" },
        el("h2", { class: "qa-section-title", text: section.title }));

      for (const item of section.questions || []) {
        n++;
        block.append(el("article", { class: "qa" },
          el("div", { class: "qa-head" },
            el("span", { class: "qa-num", text: String(n) }),
            el("h3", { class: "qa-q", text: item.question }),
            el("button", {
              class: "qa-play", type: "button",
              title: "Hear this question",
              "aria-label": `Play question ${n}`,
              onclick: (event) => playQuestion(item.question, event.currentTarget),
            }, el("span", { class: "material-symbols-rounded", text: "volume_up" })),
          ),
          item.reported
            ? el("span", { class: "qa-badge", title: "A candidate reported this exact question at this company" },
                el("span", { class: "material-symbols-rounded", text: "verified" }), "Reported at this company")
            : null,
          el("div", { class: "qa-answer" },
            el("span", { class: "qa-label", text: "Say something like" }),
            el("p", { text: item.answer })),
          item.why ? el("p", { class: "qa-why", text: item.why }) : null,
        ));
      }
      wrap.append(block);
    }
  }

  /* ----------------------------------------------------------- generating */

  function setStatus(message, kind = "") {
    const node = $("genStatus");
    node.textContent = message;
    node.className = `status ${kind}`;
  }

  $("genBtn").addEventListener("click", () => {
    $("genPanel").hidden = false;
    $("genBtn").disabled = true;
    setStatus("");
    $("genNotes").focus();
  });

  $("genCancelBtn").addEventListener("click", () => {
    $("genPanel").hidden = true;
    $("genBtn").disabled = false;
  });

  $("regenBtn").addEventListener("click", () => $("genBtn").click());

  $("genRunBtn").addEventListener("click", runGenerate);

  $("genNotes").addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); runGenerate(); }
    if (event.key === "Escape") { event.preventDefault(); $("genCancelBtn").click(); }
  });

  async function runGenerate() {
    $("genPanel").hidden = true;
    $("genRunBtn").disabled = true;
    $("genBtn").disabled = true;
    $("regenBtn").disabled = true;
    setStatus("Searching for what this company asks, then writing the interview. This takes up to a minute…");

    try {
      const resume = window.Resume.latestVersion(jobId)?.latex || window.Resume.getBase();
      const letter = window.Cover.latestVersion(jobId)?.latex || null;
      const result = await window.Interviews.generate(job, resume, letter, $("genNotes").value);

      window.Interviews.save(jobId, result);
      renderInterview();

      const reported = (result.sections || [])
        .flatMap((s) => s.questions || []).filter((q) => q.reported).length;
      setStatus(
        `${result.total} questions ready` +
        (reported ? ` — ${reported} reported by candidates at this company.` : ", none company-specific: nothing was found for this employer, so these are the standard ones for the role."),
        "ok",
      );
    } catch (e) {
      setStatus(e.message, "error");
    } finally {
      $("genRunBtn").disabled = false;
      $("genBtn").disabled = false;
      $("regenBtn").disabled = false;
    }
  }

  $("printBtn").addEventListener("click", () => window.print());

  /* ------------------------------------------------------------------ misc */

  let toastTimer;
  function toast(message) {
    const node = $("toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2600);
  }

  window.addEventListener("jobs-sync-status", (event) => {
    const dot = $("syncDot");
    const { online, error } = event.detail;
    dot.className = "sync-dot" + (!online ? " offline" : error ? " error" : "");
    dot.title = !online ? "Offline — changes save locally" : error ? `Sync problem: ${error}` : "Synced";
  });

  window.addEventListener("jobs-synced", async () => {
    await window.Data.load();
    renderVoices();
    if (jobId) renderInterview(); else renderJobPicker();
  });

  /* ------------------------------------------------------------------ boot */

  (async function init() {
    await window.Sync.ready;
    await window.Data.load();
    renderVoices();

    job = jobId ? window.Data.listJobs().find((j) => j.id === jobId) || null : null;

    if (!job) {
      jobId = null;
      $("pickScreen").hidden = false;
      renderJobPicker();
      return;
    }

    $("jobScreen").hidden = false;
    renderJob();
    renderInterview();
  })();
})();
