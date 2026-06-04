// Spot the Scam — read each message, decide Safe vs Scam, get instant feedback.
//
// Each card has a true answer in data-answer ("safe" | "scam"). Tapping an
// answer locks the card, reveals the explanation, and marks it correct or
// incorrect. The scoreboard counts how many you spotted correctly.
(function () {
  const cards = Array.from(document.querySelectorAll(".scam-card"));
  const TOTAL = cards.length;
  const answered = new Set();
  let correct = 0;

  const doneCountEl = document.getElementById("gb-done");
  const feedbackEl = document.getElementById("sb-feedback");

  function label(answer) {
    return answer === "scam" ? "a scam" : "safe";
  }

  function verdictForScore(n) {
    if (n === TOTAL) return "🌟 Perfect! You caught every one.";
    if (n / TOTAL >= 0.75) return "👍 Great eye for scams.";
    if (n / TOTAL >= 0.5) return "🙂 Good start — review the ones you missed.";
    return "📘 Scams are tricky — read the warning signs and try again.";
  }

  function feedbackText() {
    const a = answered.size;
    if (a === 0)
      return "Read each message and choose “Looks Safe” or “It's a Scam.”";
    if (a < TOTAL) return `${a} of ${TOTAL} answered — keep going.`;
    return `You spotted ${correct} of ${TOTAL} correctly. ${verdictForScore(
      correct
    )}`;
  }

  function updateScore() {
    doneCountEl.textContent = String(correct);
    feedbackEl.textContent = feedbackText();
  }

  cards.forEach((card, i) => {
    const truth = card.dataset.answer; // "safe" | "scam"
    const buttons = Array.from(card.querySelectorAll(".scam-btn"));
    const verdictEl = card.querySelector("[data-verdict]");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answered.has(i)) return; // one answer per card
        answered.add(i);
        const choice = btn.dataset.choice;
        const isRight = choice === truth;
        if (isRight) correct++;

        card.classList.add("answered", isRight ? "correct" : "incorrect");
        btn.classList.add("chosen");
        // Always highlight the true answer so the lesson is clear.
        buttons.forEach((b) => {
          b.disabled = true;
          if (b.dataset.choice === truth) b.classList.add("is-truth");
        });

        verdictEl.textContent = isRight
          ? `✓ Correct — this is ${label(truth)}.`
          : `✗ Not quite — this is ${label(truth)}.`;
        verdictEl.classList.add(isRight ? "ok" : "bad");

        updateScore();
      });
    });
  });

  // ---------- Reset ----------
  const resetBtn = document.getElementById("sb-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      answered.clear();
      correct = 0;
      cards.forEach((card) => {
        card.classList.remove("answered", "correct", "incorrect");
        const verdictEl = card.querySelector("[data-verdict]");
        verdictEl.textContent = "";
        verdictEl.classList.remove("ok", "bad");
        card.querySelectorAll(".scam-btn").forEach((b) => {
          b.disabled = false;
          b.classList.remove("chosen", "is-truth");
        });
      });
      updateScore();
    });
  }

  // ---------- Init ----------
  updateScore();
})();
