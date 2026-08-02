/* Shop floor — ten conversations, start to finish.
 *
 * The data lives in scenario-data.js. This file draws it, plays it, and keeps
 * track of which ones she has practised.
 *
 * Two voices: the customer is read by whichever voice she picked, her own
 * lines by her cloned voice. Hearing a stranger's accent ask the question and
 * her own voice give the answer is the whole point — the reply stops sounding
 * like something a website wrote and starts sounding like something she says.
 *
 * Practice mode blurs her lines so she has to try first, then tap to check.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const { el } = window.UI;

  const DONE_CELL = "jobs:local:scenariosDone";   // her progress, this device
  const PRACTICE_CELL = "jobs:local:scenariosHide";

  const scenarios = window.SCENARIOS || [];

  /* ---------------------------------------------------------- her progress */

  function loadDone() {
    try { return new Set(JSON.parse(localStorage.getItem(DONE_CELL) || "[]")); }
    catch (e) { return new Set(); }
  }

  let done = loadDone();

  function saveDone() {
    try { localStorage.setItem(DONE_CELL, JSON.stringify([...done])); } catch (e) {}
  }

  function renderProgress() {
    const n = scenarios.filter((s) => done.has(s.id)).length;
    $("progressFill").style.width = `${(n / scenarios.length) * 100}%`;
    $("progressText").textContent = `${n} of ${scenarios.length} practised`;
  }

  /* ------------------------------------------------------------ practice */

  let practice = false;
  try { practice = localStorage.getItem(PRACTICE_CELL) === "1"; } catch (e) {}

  function renderPractice() {
    document.body.classList.toggle("practice", practice);
    $("practiceBtn").classList.toggle("on", practice);
    $("practiceBtn").textContent = practice ? "Show my lines" : "Hide my lines";
    if (!practice) for (const n of document.querySelectorAll(".t-you.shown")) n.classList.remove("shown");
  }

  $("practiceBtn").addEventListener("click", () => {
    practice = !practice;
    try { localStorage.setItem(PRACTICE_CELL, practice ? "1" : "0"); } catch (e) {}
    renderPractice();
  });

  /* ---------------------------------------------------------------- voices */

  function renderVoices() {
    const voices = window.Voice.listVoices();

    for (const [id, chosen] of [
      ["voiceSelect", window.Voice.getSelected()],
      ["answerVoiceSelect", window.Voice.getAnswerVoice()],
    ]) {
      const select = $(id);
      select.replaceChildren();
      if (!voices.length) {
        select.append(new Option("No voice yet — add one", ""));
        select.disabled = true;
      } else {
        select.disabled = false;
        for (const v of voices) select.append(new Option(v.name, v.id));
        select.value = chosen;
      }
    }

    $("removeVoiceBtn").hidden = !voices.length;
    $("testVoiceBtn").disabled = !voices.length;
    $("testAnswerBtn").disabled = !voices.length;

    const status = $("voiceStatus");
    if (!window.Voice.hasKey()) {
      status.className = "hint";
      status.textContent =
        "Optional. Add an ElevenLabs key under Settings on the jobs page to hear these conversations out loud.";
    } else if (!voices.length) {
      status.className = "hint warn";
      status.textContent = "Key saved. Add a voice ID to hear the customer speak.";
    } else {
      status.className = "hint ok";
      status.textContent =
        `${voices.length} voice${voices.length === 1 ? "" : "s"} ready — the customer uses the first one, you use the second.`;
    }
  }

  async function renderSaved() {
    const { count, bytes } = await window.Voice.savedSize();
    $("clearAudioBtn").hidden = count === 0;
    $("savedAudio").textContent = count
      ? `${count} clip${count === 1 ? "" : "s"} saved (${(bytes / 1024 / 1024).toFixed(1)} MB) — playing these again is free.`
      : "";
  }

  $("voiceSelect").addEventListener("change", (e) => window.Voice.setSelected(e.target.value));
  $("answerVoiceSelect").addEventListener("change", (e) => window.Voice.setAnswerVoice(e.target.value));

  $("testVoiceBtn").addEventListener("click", (e) =>
    playText("Hi. Can I see that gold chain? The thin one, in the middle.", e.currentTarget, $("voiceSelect").value));

  $("testAnswerBtn").addEventListener("click", (e) =>
    playText("Good afternoon. Of course — this one here?", e.currentTarget, $("answerVoiceSelect").value));

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

  $("clearAudioBtn").addEventListener("click", async () => {
    if (!confirm("Delete the saved audio?\n\nThe lines will be generated again next time, which uses ElevenLabs credits.")) return;
    await window.Voice.clearSaved();
    renderSaved();
    toast("Saved audio cleared");
  });

  /* --------------------------------------------------------------- playing */

  // Bumped whenever anything stops playback, so a run-through that is already
  // in flight notices it is no longer the current one and quietly gives up.
  let runToken = 0;

  function stopAll() {
    runToken++;
    window.Voice.stop();
    for (const n of document.querySelectorAll(".turn.speaking")) n.classList.remove("speaking");
    for (const b of document.querySelectorAll(".play-all.on")) {
      b.classList.remove("on");
      b.querySelector(".material-symbols-rounded").textContent = "play_arrow";
      b.querySelector(".play-all-label").textContent = "Play the conversation";
    }
  }

  async function playText(text, button, voiceId) {
    stopAll();
    const icon = button.querySelector(".material-symbols-rounded");
    const was = icon ? icon.textContent : null;
    button.disabled = true;
    if (icon) icon.textContent = "graphic_eq";
    try {
      await window.Voice.speak(text, voiceId);
    } catch (e) {
      toast(e.message);
    } finally {
      button.disabled = false;
      if (icon) icon.textContent = was;
      renderSaved();
    }
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function playConversation(scenario, card, button) {
    const mine = runToken + 1;
    stopAll();               // takes runToken to `mine`

    button.classList.add("on");
    button.querySelector(".material-symbols-rounded").textContent = "stop";
    button.querySelector(".play-all-label").textContent = "Stop";

    const rows = [...card.querySelectorAll(".turn")];

    try {
      for (let i = 0; i < scenario.turns.length; i++) {
        if (runToken !== mine) return;                 // something else took over
        const turn = scenario.turns[i];
        if (turn.who === "stage") continue;            // directions are not spoken

        const row = rows[i];
        row.classList.add("speaking");
        row.scrollIntoView({ behavior: "smooth", block: "center" });

        // Practice mode still blurs her line on screen, but she needs to hear
        // it — the point is to say it first and then compare.
        try {
          await window.Voice.speak(
            turn.text,
            turn.who === "you" ? $("answerVoiceSelect").value : $("voiceSelect").value,
          );
        } finally {
          row.classList.remove("speaking");
        }

        if (runToken !== mine) return;
        await wait(turn.who === "customer" ? 550 : 350);
      }
    } catch (e) {
      toast(e.message);
    } finally {
      if (runToken === mine) stopAll();
      renderSaved();
    }
  }

  /* -------------------------------------------------------------- drawing */

  function dots(n) {
    return el("span", { class: "dots", title: `Difficulty ${n} of 5` },
      [1, 2, 3, 4, 5].map((i) => el("i", { class: i <= n ? "on" : "" })));
  }

  function turnRow(turn) {
    if (turn.who === "stage") return el("p", { class: "turn t-stage", text: turn.text });

    const isYou = turn.who === "you";
    const bubble = el("div", { class: "bubble" }, el("p", { class: "line", text: turn.text }));
    if (turn.note) bubble.append(el("p", { class: "note", text: turn.note }));

    const row = el("div", { class: `turn ${isYou ? "t-you" : "t-them"}` },
      el("span", { class: "who", text: isYou ? "You" : "Customer" }),
      bubble,
      el("button", {
        class: "line-play", type: "button",
        title: isYou ? "Hear it in your own voice" : "Hear the customer",
        "aria-label": "Play this line",
        onclick: (event) => {
          event.stopPropagation();
          playText(turn.text, event.currentTarget,
            isYou ? $("answerVoiceSelect").value : $("voiceSelect").value);
        },
      }, el("span", { class: "material-symbols-rounded", text: "volume_up" })),
    );

    // In practice mode her lines are blurred until she taps them.
    if (isYou) bubble.addEventListener("click", () => row.classList.toggle("shown"));
    return row;
  }

  function card(scenario, index) {
    const buys = scenario.outcome === "buy";

    const tick = el("span", {
      class: "tick", role: "button", tabindex: "0",
      title: "Mark as practised", "aria-label": "Mark as practised",
    });
    const mark = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (done.has(scenario.id)) done.delete(scenario.id); else done.add(scenario.id);
      saveDone();
      node.classList.toggle("done", done.has(scenario.id));
      renderProgress();
    };
    tick.addEventListener("click", mark);
    tick.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") mark(e); });

    const playAll = el("button", {
      class: "btn ghost small play-all", type: "button",
      onclick: (event) => {
        event.preventDefault();
        const button = event.currentTarget;
        if (button.classList.contains("on")) stopAll();
        else playConversation(scenario, node, button);
      },
    },
      el("span", { class: "material-symbols-rounded", text: "play_arrow" }),
      el("span", { class: "play-all-label", text: "Play the conversation" }));

    const node = el("details", { class: `scn${done.has(scenario.id) ? " done" : ""}`, id: scenario.id },
      el("summary", null,
        tick,
        el("span", { class: "scn-n", text: String(index + 1) }),
        el("span", { class: "scn-title", text: scenario.title }),
        dots(scenario.hardness),
        el("span", { class: `tag ${buys ? "tag-buy" : "tag-walk"}`, text: buys ? "Buys" : "Walks out" }),
      ),
      el("div", { class: "scn-body" },
        el("p", { class: "setup", text: scenario.setup }),
        scenario.reason ? el("p", { class: "reason" },
          el("b", { text: "Why she doesn’t buy: " }), scenario.reason) : null,
        el("div", { class: "convo-bar" }, playAll),
        el("div", { class: "convo" }, scenario.turns.map(turnRow)),
        el("p", { class: "after", text: scenario.after }),
        el("div", { class: "lessons" },
          el("p", { class: "lessons-title", text: "What a manager is listening for" }),
          el("ul", null, scenario.lessons.map((t) => el("li", { text: t })))),
      ),
    );

    // A conversation playing inside a card that gets collapsed should stop.
    node.addEventListener("toggle", () => { if (!node.open) stopAll(); });
    return node;
  }

  function render() {
    const list = $("list");
    list.replaceChildren();

    for (const [outcome, title, note] of [
      ["buy", "They buy", "Five customers who walk out with something. The easy one first, the hardest last."],
      ["walk", "They walk out", "Five who leave with nothing, each for a different reason. Every one of these is still a good visit."],
    ]) {
      const group = scenarios.filter((s) => s.outcome === outcome);
      list.append(el("section", { class: "group", id: outcome === "buy" ? "buys" : "walkouts" },
        el("h2", null,
          el("span", { class: `dot ${outcome}` }),
          title,
          el("span", { class: "group-count", text: `${group.length}` })),
        el("p", { class: "group-note", text: note }),
        group.map((s) => card(s, scenarios.indexOf(s))),
      ));
    }

    renderProgress();
    renderPractice();
  }

  /* ----------------------------------------------------------------- chrome */

  $("toggleAll").addEventListener("click", () => {
    const expanding = $("toggleAll").textContent.startsWith("Expand");
    for (const n of document.querySelectorAll(".scn")) n.open = expanding;
    $("toggleAll").textContent = expanding ? "Collapse all" : "Expand all";
  });

  $("resetProgress").addEventListener("click", () => {
    if (done.size && !confirm("Clear all your ✓ marks?")) return;
    done = new Set();
    saveDone();
    for (const n of document.querySelectorAll(".scn.done")) n.classList.remove("done");
    renderProgress();
  });

  $("printBtn").addEventListener("click", () => {
    for (const n of document.querySelectorAll(".scn")) n.open = true;
    window.print();
  });

  // Stop the audio on the way out — a clip that keeps talking to an empty page
  // is worse than one that cuts off.
  window.addEventListener("pagehide", stopAll);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") stopAll(); });

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

  window.addEventListener("jobs-synced", renderVoices);

  /* -------------------------------------------------------------------- boot */

  (async function init() {
    $("count").textContent = `${scenarios.length} conversations`;
    render();
    await window.Sync.ready;
    window.Voice.ensureSeeded();
    await window.Voice.ready;
    renderVoices();
    renderSaved();
  })();
})();
