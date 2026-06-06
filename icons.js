// Icon Recognition — an auto-graded multiple-choice quiz.
//
// Each card shows an icon and asks what it is. The user taps an answer; the
// card marks correct/incorrect, highlights the right answer, and reveals the
// icon's name + what it's for. One score, out of all the icons. Difficulty
// controls how many choices there are and whether you match the name or the
// description ("what it does").
(function () {
  const DIFFS = {
    easy: { target: "name", choices: 3, q: "What is this icon?" },
    medium: { target: "name", choices: 4, q: "What is this icon?" },
    hard: { target: "desc", choices: 4, q: "What does this icon do?" },
  };
  let difficulty = "easy";

  const cards = Array.from(document.querySelectorAll(".card"));
  const TOTAL = cards.length;

  // Pull the quiz data straight from the existing card markup.
  const data = cards.map((card) => ({
    card,
    name: card.querySelector(".label").textContent.trim(),
    desc: card.querySelector(".desc").textContent.trim(),
  }));
  const allNames = data.map((d) => d.name);
  const allDescs = data.map((d) => d.desc);

  const answered = new Set();
  let correct = 0;

  const doneCountEl = document.getElementById("gb-done");
  const denomEl = document.querySelector(".gb-count small");
  const feedbackEl = document.getElementById("sb-feedback");

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Scoreboard ----------
  function verdictForScore(n) {
    if (n === TOTAL) return "🌟 Perfect — you know them all!";
    if (n / TOTAL >= 0.75) return "👍 Great job recognizing your icons.";
    if (n / TOTAL >= 0.5) return "🙂 Good start — review the ones you missed.";
    return "📘 Keep practicing — you'll get them with another round.";
  }

  function feedbackText() {
    const a = answered.size;
    if (a === 0) return "Tap the answer that matches each icon.";
    if (a < TOTAL) return `${a} of ${TOTAL} answered — keep going.`;
    return `You got ${correct} of ${TOTAL}. ${verdictForScore(correct)}`;
  }

  function updateScore() {
    doneCountEl.textContent = String(correct);
    feedbackEl.textContent = feedbackText();
  }

  // ---------- Answering ----------
  function answer(d, i, btn, choice, truth) {
    if (answered.has(i)) return; // one answer per card
    answered.add(i);
    const isRight = choice === truth;
    if (isRight) correct++;

    d.card.classList.add("answered", isRight ? "correct" : "incorrect");
    d.card._choices.querySelectorAll(".choice").forEach((b) => {
      b.disabled = true;
      if (b.textContent === truth) b.classList.add("is-truth");
    });
    btn.classList.add("chosen");
    d.card._verdict.textContent = isRight ? "✓ Correct!" : "✗ Not quite —";
    d.card._verdict.classList.add(isRight ? "ok" : "bad");
    updateScore();
  }

  // ---------- Build / rebuild the quiz ----------
  function render() {
    const cfg = DIFFS[difficulty];
    answered.clear();
    correct = 0;

    data.forEach((d, i) => {
      const card = d.card;
      card.classList.add("iq-card");
      card.classList.remove("answered", "correct", "incorrect");
      // Clear any quiz nodes from a previous render.
      card.querySelectorAll(".iq-q, .iq-choices, .iq-verdict").forEach((e) =>
        e.remove()
      );

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

    updateScore();
  }

  // ---------- Difficulty toggle ----------
  document.querySelectorAll(".diff-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      difficulty = toggle.dataset.level;
      document
        .querySelectorAll(".diff-toggle")
        .forEach((b) => b.classList.toggle("active", b === toggle));
      render(); // fresh, re-randomized run
    });
  });

  // ---------- Reset ----------
  const resetBtn = document.getElementById("sb-reset");
  if (resetBtn) resetBtn.addEventListener("click", render);

  // ---------- Init ----------
  if (denomEl) denomEl.textContent = `/ ${TOTAL}`;
  render();
})();
