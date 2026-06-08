// Icon Recognition — an auto-graded multiple-choice quiz.
//
// Each card shows an icon and asks what it is. The user taps an answer; the
// card marks correct/incorrect, highlights the right answer, and reveals the
// icon's name + what it's for. Difficulty controls how many choices there are
// and whether you match the name or the description ("what it does").
//
// When every active question is answered, a results window pops up with the
// score. From there (or from the button it leaves behind) the user can replay
// just the icons they missed — a fresh, smaller scoreboard — so they get a
// chance to master the ones that tripped them up.
(function () {
  const DIFFS = {
    easy: { target: "name", choices: 3, q: "What is this icon?" },
    medium: { target: "name", choices: 4, q: "What is this icon?" },
    hard: { target: "desc", choices: 4, q: "What does this icon do?" },
  };
  let difficulty = "easy";

  const cards = Array.from(document.querySelectorAll(".card"));

  // Pull the quiz data straight from the existing card markup.
  const data = cards.map((card) => ({
    card,
    name: card.querySelector(".label").textContent.trim(),
    desc: card.querySelector(".desc").textContent.trim(),
  }));
  const allNames = data.map((d) => d.name);
  const allDescs = data.map((d) => d.desc);

  // Which questions are in play right now. Normally every icon; in "practice"
  // mode, only the ones the user missed on the previous run.
  let activeIndices = data.map((_, i) => i);
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

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Scoreboard ----------
  function total() {
    return activeIndices.length;
  }

  function verdictForScore(n) {
    const t = total();
    if (n === t) return "🌟 Perfect — you know them all!";
    if (n / t >= 0.75) return "👍 Great job recognizing your icons.";
    if (n / t >= 0.5) return "🙂 Good start — review the ones you missed.";
    return "📘 Keep practicing — you'll get them with another round.";
  }

  function feedbackText() {
    const a = answered.size;
    const t = total();
    if (a === 0) {
      return practicing
        ? "Try these again — tap the answer that matches each icon."
        : "Tap the answer that matches each icon.";
    }
    if (a < t) return `${a} of ${t} answered — keep going.`;
    return `You got ${correct} of ${t}. ${verdictForScore(correct)}`;
  }

  function updateScore() {
    doneCountEl.textContent = String(correct);
    if (denomEl) denomEl.textContent = `/ ${total()}`;
    feedbackEl.textContent = feedbackText();
  }

  // ---------- Answering ----------
  function answer(d, i, btn, choice, truth) {
    if (answered.has(i)) return; // one answer per card
    answered.add(i);
    const isRight = choice === truth;
    if (isRight) correct++;
    else missed.add(i);

    d.card.classList.add("answered", isRight ? "correct" : "incorrect");
    d.card._choices.querySelectorAll(".choice").forEach((b) => {
      b.disabled = true;
      if (b.textContent === truth) b.classList.add("is-truth");
    });
    btn.classList.add("chosen");
    d.card._verdict.textContent = isRight ? "✓ Correct!" : "✗ Not quite —";
    d.card._verdict.classList.add(isRight ? "ok" : "bad");
    updateScore();

    if (answered.size === total()) {
      // Small pause so the user sees their last answer land first.
      setTimeout(showResults, 650);
    }
  }

  // ---------- Build / rebuild the quiz ----------
  // `indices` is the list of data entries to put in play. Cards not in the
  // list are hidden, and any tier section left empty is hidden too.
  function render(indices) {
    activeIndices = indices;
    const inPlay = new Set(indices);
    const cfg = DIFFS[difficulty];
    answered.clear();
    missed.clear();
    correct = 0;

    data.forEach((d, i) => {
      const card = d.card;
      card.classList.add("iq-card");
      card.classList.remove("answered", "correct", "incorrect");
      // Clear any quiz nodes from a previous render.
      card.querySelectorAll(".iq-q, .iq-choices, .iq-verdict").forEach((e) =>
        e.remove()
      );

      if (!inPlay.has(i)) {
        card.classList.add("iq-hidden");
        return;
      }
      card.classList.remove("iq-hidden");

      const truth = cfg.target === "name" ? d.name : d.desc;
      const pool = cfg.target === "name" ? allNames : allDescs;
      const distractors = shuffle(pool.filter((v) => v !== truth)).slice(
        0,
        cfg.choices - 1
      );
      const options = shuffle([truth, ...distractors]);

      const q = document.createElement("div");
      q.className = "iq-q";
      q.textContent = cfg.q;

      const choices = document.createElement("div");
      choices.className = "iq-choices";
      options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice";
        btn.textContent = opt;
        btn.addEventListener("click", () => answer(d, i, btn, opt, truth));
        choices.appendChild(btn);
      });

      const verdict = document.createElement("div");
      verdict.className = "iq-verdict";

      // Insert above the (hidden until answered) name + description.
      const label = card.querySelector(".label");
      card.insertBefore(q, label);
      card.insertBefore(choices, label);
      card.insertBefore(verdict, label);

      card._choices = choices;
      card._verdict = verdict;
    });

    // Hide tier sections that have no questions in this run.
    document.querySelectorAll(".tier").forEach((tier) => {
      const hasActive = tier.querySelector(".card:not(.iq-hidden)");
      tier.classList.toggle("tier-hidden", !hasActive);
    });

    bannerEl.hidden = !practicing;
    practiceBtn.hidden = true;
    updateScore();
  }

  // Start the full test from scratch.
  function startFull() {
    practicing = false;
    render(data.map((_, i) => i));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Replay only the icons missed on the run that just finished.
  function startPractice() {
    if (missed.size === 0) return;
    practicing = true;
    render(Array.from(missed));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Results modal ----------
  function openModal() {
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
    // Leave a button behind so they can still practice their misses later.
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
        ? "You mastered the icons you missed. Well done!"
        : "You knew every single one. Wonderful work!";
    } else {
      const word = missCount === 1 ? "icon" : "icons";
      modalSub.textContent = `You missed ${missCount} ${word}. Want to practice just those, or start the whole test over?`;
    }

    // Nothing to practice on a perfect run — only offer to start over.
    modalPractice.hidden = perfect;
    modalPractice.textContent =
      missCount === 1
        ? "Practice the 1 I missed"
        : `Practice the ${missCount} I missed`;

    openModal();
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
    // Click on the dark backdrop (outside the card) closes it.
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  practiceBtn.addEventListener("click", startPractice);

  // ---------- Difficulty toggle ----------
  document.querySelectorAll(".diff-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      difficulty = toggle.dataset.level;
      document
        .querySelectorAll(".diff-toggle")
        .forEach((b) => b.classList.toggle("active", b === toggle));
      startFull(); // fresh, re-randomized run over all icons
    });
  });

  // ---------- Reset ----------
  const resetBtn = document.getElementById("sb-reset");
  if (resetBtn) resetBtn.addEventListener("click", startFull);

  // ---------- Init ----------
  render(activeIndices);
})();
