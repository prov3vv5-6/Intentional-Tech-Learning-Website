// Tech Words Made Simple — an auto-graded glossary quiz.
//
// Each card holds a tech word, a short meaning, and a friendly longer
// explanation (in the data- attributes). The quiz shows the word and asks the
// user to pick its meaning. On Hard, it flips: it shows a meaning and asks for
// the word. Either way, answering reveals the full glossary entry so every card
// teaches, right or wrong.
//
// When every active question is answered, a results window pops up with the
// score and the option to replay just the words that were missed — a smaller,
// fresh scoreboard so the tricky ones can be mastered.
(function () {
  const DIFFS = {
    // target: what the user is choosing. "def" = pick the meaning (word shown);
    // "term" = pick the word (meaning shown).
    easy: { target: "def", choices: 3, q: "What does this word mean?" },
    medium: { target: "def", choices: 4, q: "What does this word mean?" },
    hard: { target: "term", choices: 4, q: "Which word means this?" },
  };
  let difficulty = "easy";

  const cards = Array.from(document.querySelectorAll(".tw-card"));

  // Pull the quiz data straight from the card markup.
  const data = cards.map((card) => ({
    card,
    term: card.dataset.term.trim(),
    def: card.dataset.def.trim(),
    more: card.dataset.more.trim(),
  }));
  const allTerms = data.map((d) => d.term);
  const allDefs = data.map((d) => d.def);

  // Which questions are in play right now. Normally every word; in "practice"
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
    if (n / t >= 0.75) return "👍 Great job — these words are clicking.";
    if (n / t >= 0.5) return "🙂 Good start — review the ones you missed.";
    return "📘 Keep practicing — they'll stick with another round.";
  }

  function feedbackText() {
    const a = answered.size;
    const t = total();
    if (a === 0) {
      return practicing
        ? "Try these again — tap the answer that matches each one."
        : "Tap the meaning that matches each word.";
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
  // `indices` is the list of words to put in play. Cards not in the list are
  // hidden, and any tier section left empty is hidden too.
  function render(indices) {
    activeIndices = indices;
    const inPlay = new Set(indices);
    const cfg = DIFFS[difficulty];
    answered.clear();
    missed.clear();
    correct = 0;

    data.forEach((d, i) => {
      const card = d.card;
      card.classList.remove("answered", "correct", "incorrect");
      // Clear any quiz nodes from a previous render.
      card
        .querySelectorAll(".iq-q, .iq-choices, .iq-verdict, .tw-reveal")
        .forEach((e) => e.remove());

      const prompt = card.querySelector(".tw-prompt");

      if (!inPlay.has(i)) {
        card.classList.add("iq-hidden");
        return;
      }
      card.classList.remove("iq-hidden");

      // What's shown vs. what's being chosen depends on difficulty.
      const showDef = cfg.target === "term"; // Hard: show the meaning
      prompt.textContent = showDef ? d.def : d.term;
      prompt.classList.toggle("is-def", showDef);

      const truth = cfg.target === "term" ? d.term : d.def;
      const pool = cfg.target === "term" ? allTerms : allDefs;
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

      // The full glossary entry — revealed (via CSS) once answered.
      const reveal = document.createElement("div");
      reveal.className = "tw-reveal";
      const rTerm = document.createElement("div");
      rTerm.className = "tw-reveal-term";
      rTerm.textContent = d.term;
      const rDef = document.createElement("div");
      rDef.className = "tw-reveal-def";
      rDef.textContent = d.def;
      const rMore = document.createElement("div");
      rMore.className = "tw-reveal-more";
      rMore.textContent = d.more;
      reveal.append(rTerm, rDef, rMore);

      card.append(q, choices, verdict, reveal);

      card._choices = choices;
      card._verdict = verdict;
    });

    // Hide tier sections that have no questions in this run.
    document.querySelectorAll(".tier").forEach((tier) => {
      const hasActive = tier.querySelector(".tw-card:not(.iq-hidden)");
      tier.classList.toggle("tier-hidden", !hasActive);
    });

    bannerEl.hidden = !practicing;
    practiceBtn.hidden = true;
    updateScore();
  }

  // Start the full quiz from scratch.
  function startFull() {
    practicing = false;
    render(data.map((_, i) => i));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Replay only the words missed on the run that just finished.
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
        ? "You mastered the words you missed. Well done!"
        : "You knew every single one. Wonderful work!";
    } else {
      const word = missCount === 1 ? "word" : "words";
      modalSub.textContent = `You missed ${missCount} ${word}. Want to practice just those, or start the whole quiz over?`;
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
      startFull(); // fresh, re-randomized run over all words
    });
  });

  // ---------- Reset ----------
  const resetBtn = document.getElementById("sb-reset");
  if (resetBtn) resetBtn.addEventListener("click", startFull);

  // ---------- Init ----------
  render(activeIndices);
})();
