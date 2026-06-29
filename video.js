// Video Call Basics — two parts on one page:
//   1. A pretend video call you can poke at safely: mute/unmute, turn the
//      camera off/on, and leave. Every button shows the same visual change a
//      real call (Google Meet) would, so the controls stop being scary.
//   2. A short "what should you do?" quiz about joining and running a call,
//      scored on the shared scoreboard with the results modal + a
//      practice-what-you-missed mode.
(function () {
  // ---------- Part 1: The pretend call ----------
  const stage = document.getElementById("vc-stage");
  const self = document.getElementById("vc-self");
  const selfLabel = document.getElementById("vc-self-label");
  const micBtn = document.getElementById("vc-mic");
  const micLabel = document.getElementById("vc-mic-label");
  const camBtn = document.getElementById("vc-cam");
  const camLabel = document.getElementById("vc-cam-label");
  const leaveBtn = document.getElementById("vc-leave");
  const rejoinBtn = document.getElementById("vc-rejoin");
  const statusEl = document.getElementById("vc-status");
  const taskEls = {};
  document.querySelectorAll(".vc-tasks li").forEach((li) => {
    taskEls[li.dataset.task] = li;
  });
  const TASK_COUNT = Object.keys(taskEls).length;

  let micOn = true;
  let camOn = true;
  let inCall = true;
  const tasksDone = new Set();

  function markTask(name) {
    if (taskEls[name] && !tasksDone.has(name)) {
      tasksDone.add(name);
      taskEls[name].classList.add("met");
    }
    updateCallStatus();
  }

  function updateCallStatus() {
    if (tasksDone.size >= TASK_COUNT) {
      statusEl.textContent =
        "🌟 You've got it — you tried every control. That's all there is to it!";
      statusEl.classList.add("done");
    } else if (!inCall) {
      statusEl.textContent =
        "You've left the call. Tap “Rejoin the call” to keep practicing.";
      statusEl.classList.remove("done");
    } else if (tasksDone.size > 0) {
      statusEl.textContent = `Nice — you've tried ${tasksDone.size} of ${TASK_COUNT}. Keep going!`;
      statusEl.classList.remove("done");
    } else {
      statusEl.textContent =
        "You're in the call and everyone can see and hear you. Try each button — watch how it changes.";
      statusEl.classList.remove("done");
    }
  }

  function setMic(on) {
    micOn = on;
    micBtn.classList.toggle("is-off", !on);
    micLabel.textContent = on ? "Mute" : "Unmute";
    self.classList.toggle("mic-off", !on);
  }

  function setCam(on) {
    camOn = on;
    camBtn.classList.toggle("is-off", !on);
    camLabel.textContent = on ? "Stop video" : "Start video";
    self.classList.toggle("cam-on", on);
    selfLabel.textContent = on ? "You" : "Camera off";
  }

  function setControlsEnabled(on) {
    micBtn.disabled = !on;
    camBtn.disabled = !on;
    leaveBtn.disabled = !on;
  }

  micBtn.addEventListener("click", () => {
    if (!inCall) return;
    const next = !micOn;
    setMic(next);
    markTask(next ? "unmute" : "mute");
  });

  camBtn.addEventListener("click", () => {
    if (!inCall) return;
    const next = !camOn;
    setCam(next);
    markTask(next ? "camon" : "camoff");
  });

  leaveBtn.addEventListener("click", () => {
    if (!inCall) return;
    inCall = false;
    stage.classList.add("ended");
    setControlsEnabled(false);
    markTask("leave");
  });

  rejoinBtn.addEventListener("click", () => {
    inCall = true;
    stage.classList.remove("ended");
    setControlsEnabled(true);
    // Come back the normal way — unmuted and on camera — but keep progress.
    setMic(true);
    setCam(true);
    updateCallStatus();
  });

  // ---------- Part 2: Scenario quiz ----------
  const cards = Array.from(document.querySelectorAll(".vcq-card"));

  // Which questions are in play. Normally all; in practice mode, only misses.
  let activeIndices = cards.map((_, i) => i);
  let practicing = false;

  const answered = new Set(); // indices answered this run
  const missed = new Set(); // indices answered wrong this run
  let correct = 0;

  const doneCountEl = document.getElementById("gb-done");
  const denomEl = document.querySelector(".gb-count small");
  const feedbackEl = document.getElementById("sb-feedback");
  const bannerEl = document.getElementById("sb-banner");
  const practiceBtn = document.getElementById("sb-practice");

  const modal = document.getElementById("result-modal");
  const modalEmoji = document.getElementById("modal-emoji");
  const modalTitle = document.getElementById("modal-title");
  const modalScore = document.getElementById("modal-score");
  const modalSub = document.getElementById("modal-sub");
  const modalPractice = document.getElementById("modal-practice");
  const modalRestart = document.getElementById("modal-restart");
  const modalClose = document.getElementById("modal-close");

  function total() {
    return activeIndices.length;
  }

  function verdictForScore(n) {
    const t = total();
    if (n === t) return "🌟 Perfect — you're ready for a real call!";
    if (n / t >= 0.75) return "👍 Great — the basics are clicking.";
    if (n / t >= 0.5) return "🙂 Good start — review the ones you missed.";
    return "📘 Read the explanations and try again — you'll get there.";
  }

  function feedbackText() {
    const a = answered.size;
    const t = total();
    if (a === 0) {
      return practicing
        ? "Try these again — pick the best thing to do."
        : "Practice the call above, then answer the quiz questions.";
    }
    if (a < t) return `${a} of ${t} answered — keep going.`;
    return `You got ${correct} of ${t}. ${verdictForScore(correct)}`;
  }

  function updateScore() {
    doneCountEl.textContent = String(correct);
    if (denomEl) denomEl.textContent = `/ ${total()}`;
    feedbackEl.textContent = feedbackText();
  }

  function answer(card, i, btn, buttons, truthIdx) {
    if (answered.has(i)) return; // one answer per card
    answered.add(i);
    const isRight = buttons.indexOf(btn) === truthIdx;
    if (isRight) correct++;
    else missed.add(i);

    card.classList.add("answered", isRight ? "correct" : "incorrect");
    btn.classList.add("chosen");
    buttons.forEach((b, idx) => {
      b.disabled = true;
      if (idx === truthIdx) b.classList.add("is-truth");
    });

    const verdictEl = card.querySelector(".vcq-verdict");
    verdictEl.textContent = isRight ? "✓ Correct!" : "✗ Not quite —";
    verdictEl.classList.add(isRight ? "ok" : "bad");

    updateScore();

    if (answered.size === total()) {
      setTimeout(showResults, 650);
    }
  }

  cards.forEach((card, i) => {
    const truthIdx = Number(card.dataset.answer);
    const buttons = Array.from(card.querySelectorAll(".choice"));
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => answer(card, i, btn, buttons, truthIdx));
    });
  });

  function resetCard(card) {
    card.classList.remove("answered", "correct", "incorrect");
    const verdictEl = card.querySelector(".vcq-verdict");
    verdictEl.textContent = "";
    verdictEl.classList.remove("ok", "bad");
    card.querySelectorAll(".choice").forEach((b) => {
      b.disabled = false;
      b.classList.remove("chosen", "is-truth");
    });
  }

  function render(indices) {
    activeIndices = indices;
    const inPlay = new Set(indices);
    answered.clear();
    missed.clear();
    correct = 0;

    cards.forEach((card, i) => {
      resetCard(card);
      card.classList.toggle("iq-hidden", !inPlay.has(i));
    });

    document.querySelectorAll(".tier").forEach((tier) => {
      const hasActive = tier.querySelector(".vcq-card:not(.iq-hidden)");
      tier.classList.toggle("tier-hidden", !hasActive);
    });

    bannerEl.hidden = !practicing;
    practiceBtn.hidden = true;
    updateScore();
  }

  function scrollToQuiz() {
    const first = cards.find((c) => !c.classList.contains("iq-hidden"));
    const target = (first && first.closest(".tier")) || first;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startFull() {
    practicing = false;
    render(cards.map((_, i) => i));
  }

  function startPractice() {
    if (missed.size === 0) return;
    practicing = true;
    render(Array.from(missed));
    scrollToQuiz();
  }

  // ---------- Results modal ----------
  function closeModal() {
    modal.hidden = true;
    practiceBtn.hidden = missed.size === 0;
  }

  function showResults() {
    const t = total();
    const missCount = missed.size;
    const perfect = missCount === 0;

    modalEmoji.textContent = perfect ? "🌟" : correct / t >= 0.75 ? "🎉" : "💪";
    modalTitle.textContent = perfect
      ? "Perfect score!"
      : correct / t >= 0.75
      ? "Great job!"
      : "Nice effort!";
    modalScore.textContent = `You got ${correct} out of ${t}`;

    if (perfect) {
      modalSub.textContent = practicing
        ? "You mastered the questions you missed. Well done!"
        : "You answered every one correctly — you're ready for a real call!";
    } else {
      const word = missCount === 1 ? "question" : "questions";
      modalSub.textContent = `You missed ${missCount} ${word}. Want to practice just those, or start the whole quiz over?`;
    }

    modalPractice.hidden = perfect;
    modalPractice.textContent =
      missCount === 1
        ? "Practice the 1 I missed"
        : `Practice the ${missCount} I missed`;

    modal.hidden = false;
  }

  // ---------- Wiring ----------
  modalPractice.addEventListener("click", () => {
    modal.hidden = true;
    startPractice();
  });
  modalRestart.addEventListener("click", () => {
    modal.hidden = true;
    startFull();
  });
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  practiceBtn.addEventListener("click", startPractice);

  const resetBtn = document.getElementById("sb-reset");
  if (resetBtn) resetBtn.addEventListener("click", startFull);

  // ---------- Init ----------
  updateScore();
})();
