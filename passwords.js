// Passwords & Account Safety — two parts on one page:
//   1. A live strength meter that reacts as you type, teaching the few things
//      that matter most: length, using several words, and avoiding the
//      well-known passwords everyone tries first.
//   2. A "Good idea / Risky" quiz of everyday account habits, scored on the
//      shared scoreboard with instant, plain-English feedback.
(function () {
  // ---------- Part 1: Strength meter ----------
  // The handful of passwords attackers guess first. Kept short on purpose —
  // the goal is to teach the idea, not to be an exhaustive blocklist.
  const COMMON = new Set([
    "password",
    "password1",
    "passw0rd",
    "123456",
    "1234567",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty",
    "qwerty123",
    "111111",
    "000000",
    "abc123",
    "letmein",
    "iloveyou",
    "admin",
    "welcome",
    "monkey",
    "dragon",
    "football",
    "sunshine",
  ]);

  const input = document.getElementById("pw-input");
  const barFill = document.getElementById("pw-bar-fill");
  const verdictEl = document.getElementById("pw-verdict");
  const tipEl = document.getElementById("pw-tip");
  const sampleBtn = document.getElementById("pw-sample");
  const checks = {
    length: document.querySelector('[data-check="length"]'),
    words: document.querySelector('[data-check="words"]'),
    common: document.querySelector('[data-check="common"]'),
  };

  // Count word-like chunks (3+ letters in a row) — how a passphrase reads.
  function wordCount(value) {
    const m = value.match(/[a-zA-Z]{3,}/g);
    return m ? m.length : 0;
  }

  function isCommon(value) {
    return COMMON.has(value.toLowerCase().trim());
  }

  const DEFAULT_TIP =
    "The single best thing you can do is make it <b>longer</b>. Three random " +
    "words like <b>river-basket-lemon</b> are easy for you to remember and very " +
    "hard for anyone to guess.";

  function assess() {
    const value = input.value;
    const len = value.length;
    const words = wordCount(value);
    const common = isCommon(value);

    // Light up the teaching checklist.
    const longEnough = len >= 12;
    const isPassphrase = words >= 3 || (words >= 2 && len >= 14);
    const notCommon = len > 0 && !common;
    checks.length.classList.toggle("met", longEnough);
    checks.words.classList.toggle("met", isPassphrase);
    checks.common.classList.toggle("met", notCommon);

    // Nothing typed yet — reset to the neutral starting state.
    if (len === 0) {
      barFill.style.width = "0";
      barFill.className = "pw-bar-fill";
      verdictEl.className = "pw-verdict";
      verdictEl.textContent = "Start typing to see how it measures up.";
      tipEl.innerHTML = DEFAULT_TIP;
      return;
    }

    // Score the few things that genuinely matter.
    let score = 0;
    if (len >= 8) score++;
    if (len >= 12) score++;
    if (len >= 16) score++;
    if (words >= 2) score++;
    if (words >= 3) score++;
    if (/[a-z]/i.test(value) && /[0-9]/.test(value)) score++;

    let level, label, tip;
    if (common) {
      level = "weak";
      label = "Too weak — this is one of the most common passwords";
      tip =
        "This is one of the first passwords anyone tries. Swap it for three " +
        "random words strung together.";
      score = 0;
    } else if (score >= 4) {
      level = "strong";
      label = "Strong — nice and hard to guess!";
      tip =
        "Great. Just don't reuse it on another site, and you're in good shape.";
    } else if (score >= 2) {
      level = "fair";
      label = "Getting better — make it longer";
      tip =
        "You're on the right track. Add another word or two — length is what " +
        "really makes it tough to crack.";
    } else {
      level = "weak";
      label = "Too weak — too short and easy to guess";
      tip =
        "Short passwords are quick to break. Try three random words together, " +
        "like <b>copper-otter-window</b>.";
    }

    const pct = level === "weak" ? Math.max(12, (score / 6) * 100) : (score / 6) * 100;
    barFill.style.width = Math.min(100, pct) + "%";
    barFill.className = "pw-bar-fill " + level;
    verdictEl.className = "pw-verdict " + level;
    verdictEl.textContent = label;
    tipEl.innerHTML = tip;
  }

  if (input) {
    input.addEventListener("input", assess);
    assess();
  }

  // A few example strong passphrases the "Show me a strong one" button cycles.
  const SAMPLES = [
    "river-basket-lemon-31",
    "copper-otter-window",
    "quiet-maple-thunder-7",
    "garden-pickle-rocket",
  ];
  let sampleIdx = 0;
  if (sampleBtn) {
    sampleBtn.addEventListener("click", () => {
      input.value = SAMPLES[sampleIdx % SAMPLES.length];
      sampleIdx++;
      assess();
      input.focus();
    });
  }

  // ---------- Part 2: Good idea / Risky quiz ----------
  const cards = Array.from(document.querySelectorAll(".pw-card"));

  // Which cards are in play right now. Normally all of them; in "practice"
  // mode, only the ones missed on the previous run.
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

  function label(answer) {
    return answer === "do" ? "a good idea" : "risky";
  }

  function total() {
    return activeIndices.length;
  }

  function verdictForScore(n) {
    const t = total();
    if (n === t) return "🌟 Perfect — your instincts are sharp!";
    if (n / t >= 0.75) return "👍 Great judgment on account safety.";
    if (n / t >= 0.5) return "🙂 Good start — review the ones you missed.";
    return "📘 Read the explanations and try again — these habits add up.";
  }

  function feedbackText() {
    const a = answered.size;
    const t = total();
    if (a === 0) {
      return practicing
        ? "Try these again — decide Good idea or Risky."
        : "Scroll down to the quiz and decide: Good idea or Risky?";
    }
    if (a < t) return `${a} of ${t} answered — keep going.`;
    return `You made ${correct} of ${t} good calls. ${verdictForScore(correct)}`;
  }

  function updateScore() {
    doneCountEl.textContent = String(correct);
    if (denomEl) denomEl.textContent = `/ ${total()}`;
    feedbackEl.textContent = feedbackText();
  }

  function answer(card, i, btn, buttons, truth) {
    if (answered.has(i)) return; // one answer per card
    answered.add(i);
    const choice = btn.dataset.choice;
    const isRight = choice === truth;
    if (isRight) correct++;
    else missed.add(i);

    card.classList.add("answered", isRight ? "correct" : "incorrect");
    btn.classList.add("chosen");
    // Always highlight the true answer so the lesson lands.
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.dataset.choice === truth) b.classList.add("is-truth");
    });

    const verdictQEl = card.querySelector("[data-verdict]");
    verdictQEl.textContent = isRight
      ? `✓ Correct — this is ${label(truth)}.`
      : `✗ Not quite — this is ${label(truth)}.`;
    verdictQEl.classList.add(isRight ? "ok" : "bad");

    updateScore();

    if (answered.size === total()) {
      // Small pause so the user sees their last answer land first.
      setTimeout(showResults, 650);
    }
  }

  cards.forEach((card, i) => {
    const truth = card.dataset.answer; // "do" | "dont"
    const buttons = Array.from(card.querySelectorAll(".pw-btn"));
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => answer(card, i, btn, buttons, truth));
    });
  });

  // Clear a card back to its unanswered state.
  function resetCard(card) {
    card.classList.remove("answered", "correct", "incorrect");
    const verdictQEl = card.querySelector("[data-verdict]");
    verdictQEl.textContent = "";
    verdictQEl.classList.remove("ok", "bad");
    card.querySelectorAll(".pw-btn").forEach((b) => {
      b.disabled = false;
      b.classList.remove("chosen", "is-truth");
    });
  }

  // Put `indices` in play; hide the rest, and hide any group left empty.
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
      const hasActive = tier.querySelector(".pw-card:not(.iq-hidden)");
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
        ? "You mastered the habits you missed. Well done!"
        : "You judged every one correctly. Wonderful work!";
    } else {
      const word = missCount === 1 ? "habit" : "habits";
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
