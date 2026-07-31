/* Mock interview — runs one question at a time, read aloud by ElevenLabs.
 *
 * One question on screen at a time on purpose. A list of twenty questions gets
 * skim-read; one question with a voice asking it gets answered out loud, which
 * is the only practice that helps on the day.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const { el } = window.UI;

  const DONE_CELL = "jobs:local:mockRuns";   // which runs are finished, per device

  let run = null;      // { version, flat: [{ sectionTitle, q, tip }], at }

  /* ---------------------------------------------------------------- voices */

  function renderVoices() {
    const voices = window.Voice.listVoices();
    const select = $("voiceSelect");
    const chosen = window.Voice.getSelected();

    select.replaceChildren();
    if (!voices.length) {
      select.append(new Option("No voice yet — add one", ""));
      select.disabled = true;
    } else {
      select.disabled = false;
      for (const v of voices) select.append(new Option(v.name, v.id));
      select.value = chosen;
    }

    $("removeVoiceBtn").hidden = !voices.length;
    $("testVoiceBtn").disabled = !voices.length;

    const status = $("voiceStatus");
    if (!window.Voice.hasKey()) {
      status.className = "hint warn";
      status.textContent = "No ElevenLabs API key yet — add one under Settings on the jobs page, then the questions can be read aloud.";
    } else if (!voices.length) {
      status.className = "hint warn";
      status.textContent = "Key saved. Add a voice ID to hear the questions.";
    } else {
      status.className = "hint ok";
      status.textContent = `Key saved (${window.Voice.keyPreview()}). ${voices.length} voice${voices.length === 1 ? "" : "s"} ready.`;
    }
  }

  $("voiceSelect").addEventListener("change", (event) => {
    window.Voice.setSelected(event.target.value);
    toast("Voice changed");
  });

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
    } catch (e) {
      toast(e.message);
    }
  });

  $("removeVoiceBtn").addEventListener("click", () => {
    const id = $("voiceSelect").value;
    const voice = window.Voice.listVoices().find((v) => v.id === id);
    if (!voice || !confirm(`Remove “${voice.name}” from the list?`)) return;
    window.Voice.removeVoice(id);
    renderVoices();
    toast("Voice removed");
  });

  $("testVoiceBtn").addEventListener("click", async () => {
    const button = $("testVoiceBtn");
    button.disabled = true;
    try {
      await window.Voice.speak("Hello. Thanks for coming in today. Shall we get started?", $("voiceSelect").value);
    } catch (e) {
      toast(e.message);
    } finally {
      button.disabled = false;
    }
  });

  /* -------------------------------------------------------------- picking */

  const doneRuns = () => {
    try { return JSON.parse(localStorage.getItem(DONE_CELL) || "[]"); } catch (e) { return []; }
  };

  function markDone(id) {
    const list = [...new Set([...doneRuns(), id])];
    try { localStorage.setItem(DONE_CELL, JSON.stringify(list)); } catch (e) {}
  }

  function renderVersions() {
    const done = doneRuns();
    const list = $("versionList");
    list.replaceChildren();

    for (const version of window.MockInterviews) {
      const questions = version.sections.reduce((n, s) => n + s.questions.length, 0);
      list.append(el("button", {
        class: `version-card${done.includes(version.id) ? " is-done" : ""}`,
        type: "button",
        onclick: () => startRun(version),
      },
        el("div", { class: "version-top" },
          el("span", { class: "version-name", text: version.name }),
          done.includes(version.id)
            ? el("span", { class: "material-symbols-rounded version-tick", text: "check_circle" })
            : null),
        el("span", { class: "version-tone", text: version.tone }),
        el("p", { class: "version-blurb", text: version.blurb }),
        el("span", { class: "version-meta", text: `${version.sections.length} sections · ${questions} questions` }),
      ));
    }

    const finished = window.MockInterviews.filter((v) => done.includes(v.id)).length;
    $("runCount").textContent = finished ? `${finished} of ${window.MockInterviews.length} done` : "";
  }

  /* ------------------------------------------------------------- the run */

  function startRun(version) {
    const flat = [];
    for (const section of version.sections) {
      section.questions.forEach((question, i) => {
        flat.push({
          section: section.title,
          sectionIndex: version.sections.indexOf(section) + 1,
          first: i === 0,
          q: question.q,
          tip: question.tip,
        });
      });
    }
    run = { version, flat, at: 0 };

    $("pickScreen").hidden = true;
    $("doneScreen").hidden = true;
    $("runScreen").hidden = false;
    $("runName").textContent = version.name;
    renderQuestion();
  }

  function renderQuestion() {
    const item = run.flat[run.at];
    const total = run.flat.length;

    $("runSection").textContent = `Part ${item.sectionIndex} · ${item.section}`;
    $("questionText").textContent = item.q;
    $("tipText").textContent = item.tip;
    $("tipText").hidden = true;
    $("tipBtn").textContent = "Show what they want";
    $("playStatus").textContent = "";
    $("playStatus").className = "status";

    $("progressFill").style.width = `${((run.at + 1) / total) * 100}%`;
    $("progressText").textContent = `Question ${run.at + 1} of ${total}`;

    $("prevBtn").disabled = run.at === 0;
    $("nextBtn").innerHTML = "";
    $("nextBtn").append(
      run.at === total - 1 ? "Finish" : "Next",
      el("span", { class: "material-symbols-rounded", text: run.at === total - 1 ? "done" : "arrow_forward" }),
    );

    if ($("autoPlay").checked) play();
  }

  async function play() {
    const item = run.flat[run.at];
    const button = $("playBtn");
    const status = $("playStatus");

    button.disabled = true;
    $("playLabel").textContent = "Playing…";
    status.textContent = "";
    status.className = "status";

    try {
      await window.Voice.speak(item.q, $("voiceSelect").value);
    } catch (e) {
      status.textContent = e.message;
      status.className = "status error";
    } finally {
      button.disabled = false;
      $("playLabel").textContent = window.Voice.isCached(item.q, $("voiceSelect").value)
        ? "Play again" : "Play question";
    }
  }

  function step(by) {
    window.Voice.stop();
    const next = run.at + by;
    if (next < 0) return;
    if (next >= run.flat.length) return finish();
    run.at = next;
    renderQuestion();
  }

  function finish() {
    window.Voice.stop();
    markDone(run.version.id);
    $("runScreen").hidden = true;
    $("doneScreen").hidden = false;
    $("doneTitle").textContent = `${run.version.name} — done`;
    $("doneText").textContent =
      "Now do the one thing that actually helps: pick the three questions you stumbled on and say those answers out loud again, without reading.";
    renderVersions();
  }

  $("playBtn").addEventListener("click", play);
  $("nextBtn").addEventListener("click", () => step(1));
  $("prevBtn").addEventListener("click", () => step(-1));

  $("tipBtn").addEventListener("click", () => {
    const tip = $("tipText");
    tip.hidden = !tip.hidden;
    $("tipBtn").textContent = tip.hidden ? "Show what they want" : "Hide";
  });

  $("quitBtn").addEventListener("click", () => {
    if (!confirm("Stop here and go back to the list?")) return;
    window.Voice.stop();
    $("runScreen").hidden = true;
    $("pickScreen").hidden = false;
    renderVersions();
  });

  $("againBtn").addEventListener("click", () => startRun(run.version));
  $("otherBtn").addEventListener("click", () => {
    $("doneScreen").hidden = true;
    $("pickScreen").hidden = false;
  });

  // Space plays, arrows move — so she can keep her eyes up and answer out loud.
  document.addEventListener("keydown", (event) => {
    if ($("runScreen").hidden) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (typing) return;
    if (event.key === " ") { event.preventDefault(); play(); }
    if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
  });

  /* ------------------------------------------------------------------ misc */

  let toastTimer;
  function toast(message) {
    const node = $("toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2400);
  }

  window.addEventListener("jobs-sync-status", (event) => {
    const dot = $("syncDot");
    const { online, error } = event.detail;
    dot.className = "sync-dot" + (!online ? " offline" : error ? " error" : "");
    dot.title = !online ? "Offline — changes save locally" : error ? `Sync problem: ${error}` : "Synced";
  });

  // The voice list is synced, so it can arrive after the page has drawn.
  window.addEventListener("jobs-synced", renderVoices);

  (async function init() {
    await window.Sync.ready;
    renderVoices();
    renderVersions();
  })();
})();
