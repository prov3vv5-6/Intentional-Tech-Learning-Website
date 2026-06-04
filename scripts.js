// Icon Recognition Sheet — Test Type toggle + self-scoring.
//
// Pick a Test Type (Icon / Icon Name / Icon Description): that part of every
// card is hidden behind a reveal button so you can quiz yourself, and the
// G / Y / R circles on each card become clickable to score how well you knew
// it. Scores are tracked separately per test type, so testing "Icon Name"
// doesn't disturb your "Icon" results.
(function () {
  // Each test type maps to the element it hides and the reveal-button label.
  const SLOTS = {
    icon: { selector: ".card-top", label: "Icon" },
    name: { selector: ".label", label: "Icon Name" },
    desc: { selector: ".desc", label: "Icon Description" },
  };
  const POINTS = { g: 1, y: 0.5, r: 0 }; // green / yellow / red
  const TYPES = ["icon", "name", "desc"];

  // Difficulty controls how much of each card is hidden. The selected test
  // type is always hidden; harder modes hide an extra slot for less context.
  //   easy   → just the test-type slot
  //   medium → test-type slot + a second slot
  //   hard   → test-type slot + a (different) second slot
  const DIFFICULTY_EXTRA = {
    icon: { easy: [], medium: ["name"], hard: ["desc"] },
    name: { easy: [], medium: ["icon"], hard: ["desc"] },
    desc: { easy: [], medium: ["icon"], hard: ["name"] },
  };

  const cards = Array.from(document.querySelectorAll(".card"));
  const cardCount = cards.length;
  const toggles = document.querySelectorAll(".test-toggle:not(.diff-toggle)");
  const diffToggles = document.querySelectorAll(".diff-toggle");

  // state[i][type] = "g" | "y" | "r" | null  — one mark per card per type.
  const state = cards.map(() => ({ icon: null, name: null, desc: null }));
  let activeType = null;
  let difficulty = "easy";

  // ---------- Reveal / hide slot ----------
  function clearTest() {
    document.querySelectorAll(".reveal-btn").forEach((b) => b.remove());
    document
      .querySelectorAll(".slot-hidden")
      .forEach((el) => el.classList.remove("slot-hidden"));
  }

  // Hide one slot on a card and drop a reveal button in its place.
  function hideSlot(card, slotType) {
    const slot = SLOTS[slotType];
    const el = card.querySelector(slot.selector);
    if (!el) return;
    el.classList.add("slot-hidden");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reveal-btn";
    btn.dataset.slot = slotType;
    btn.textContent = slot.label;
    btn.title = "Click to reveal";
    btn.addEventListener("click", () => {
      el.classList.remove("slot-hidden");
      btn.remove();
    });
    el.parentNode.insertBefore(btn, el);
  }

  function applyTest() {
    clearTest();
    if (!activeType) return;
    // Always hide the selected test type, plus any extra slots for difficulty.
    const slots = [activeType, ...DIFFICULTY_EXTRA[activeType][difficulty]];
    cards.forEach((card) => slots.forEach((s) => hideSlot(card, s)));
  }

  // ---------- Marks (G / Y / R) ----------
  function renderCardMarks(card, i, type) {
    card.querySelectorAll(".m").forEach((m) => {
      const on = type && state[i][type] === m.dataset.val;
      m.classList.toggle("selected", !!on);
    });
  }

  function renderAllMarks(type) {
    cards.forEach((card, i) => renderCardMarks(card, i, type));
  }

  cards.forEach((card, i) => {
    card.querySelectorAll(".m").forEach((m) => {
      const val = m.classList.contains("g")
        ? "g"
        : m.classList.contains("y")
        ? "y"
        : "r";
      m.dataset.val = val;
      m.setAttribute("role", "button");
      m.setAttribute("tabindex", "0");

      const choose = () => {
        if (!activeType) return; // scoring only while a test type is active
        // Click the same mark again to clear it.
        state[i][activeType] = state[i][activeType] === val ? null : val;
        renderCardMarks(card, i, activeType);
        updateScore();
      };

      m.addEventListener("click", choose);
      m.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          choose();
        }
      });
    });
  });

  // ---------- Scoreboard ----------
  const sbScoreCells = {};
  TYPES.forEach((t) => {
    sbScoreCells[t] = document.querySelector(`.sb-score[data-col="${t}"]`);
  });
  const sbTotalCell = document.querySelector(".sb-total");
  const sbFeedback = document.getElementById("sb-feedback");
  const colCells = document.querySelectorAll(".sb-cell[data-col]");

  // Show 0.5 as "0.5" but 12 as "12" (no trailing ".0").
  function fmt(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  function updateActiveColumn(type) {
    colCells.forEach((c) =>
      c.classList.toggle("is-active", c.dataset.col === type)
    );
  }

  function feedbackText(typesTested, totalMarked, totalPoints) {
    if (totalMarked === 0) {
      return "Pick a Test Type below, then tap G / Y / R on each card to score yourself.";
    }
    const acc = Math.round((totalPoints / totalMarked) * 100);
    if (typesTested < 3) {
      return `Tested ${typesTested} of 3 types · accuracy so far ${acc}%. Test all three types to get your final score.`;
    }
    let verdict;
    if (acc >= 90) verdict = "🌟 Outstanding! You really know your icons.";
    else if (acc >= 75) verdict = "👍 Well done — strong icon recognition.";
    else if (acc >= 60)
      verdict = "🙂 Good job — a little more practice will polish it off.";
    else if (acc >= 40)
      verdict = "📘 Needs improvement — review the ones you missed and retry.";
    else verdict = "🔄 Keep practicing — run through them again and you'll improve fast.";
    return `Final score: ${fmt(totalPoints)} / ${cardCount * 3} · ${acc}%. ${verdict}`;
  }

  function updateScore() {
    let totalPoints = 0;
    let totalMarked = 0;
    let typesTested = 0;

    TYPES.forEach((t) => {
      let pts = 0;
      let marked = 0;
      state.forEach((s) => {
        if (s[t] !== null) {
          pts += POINTS[s[t]];
          marked++;
        }
      });
      if (marked > 0) typesTested++;
      totalPoints += pts;
      totalMarked += marked;
      sbScoreCells[t].innerHTML = `${fmt(pts)} <small>/ ${cardCount}</small>`;
    });

    sbTotalCell.innerHTML = `${fmt(totalPoints)} <small>/ ${cardCount * 3}</small>`;
    sbFeedback.textContent = feedbackText(typesTested, totalMarked, totalPoints);
  }

  // ---------- Test Type toggle ----------
  function setActive(type) {
    activeType = type;
    toggles.forEach((b) => b.classList.toggle("active", b.dataset.type === type));
    document.body.classList.toggle("scoring-active", type !== null);
    applyTest();
    updateActiveColumn(type);
    renderAllMarks(type);
    updateScore();
  }

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const type = toggle.dataset.type;
      setActive(activeType === type ? null : type); // click active to turn off
    });
  });

  // ---------- Difficulty toggle ----------
  function setDifficulty(level) {
    difficulty = level;
    diffToggles.forEach((b) =>
      b.classList.toggle("active", b.dataset.level === level)
    );
    applyTest(); // re-hide slots for the new difficulty if a test is active
  }

  diffToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => setDifficulty(toggle.dataset.level));
  });

  // ---------- Reset ----------
  const resetBtn = document.getElementById("sb-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.forEach((s) => {
        s.icon = s.name = s.desc = null;
      });
      renderAllMarks(activeType);
      updateScore();
    });
  }

  // ---------- Shuffle ----------
  // Fisher-Yates shuffle of an array (returns a new array).
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Reorder the cards inside each tier's grid independently. Card DOM nodes
  // keep their own state and listeners, so scores and any active test survive.
  const shuffleBtn = document.getElementById("shuffle-btn");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      document.querySelectorAll(".grid").forEach((grid) => {
        const items = Array.from(grid.children);
        // Re-append in a new random order; appendChild moves existing nodes.
        shuffled(items).forEach((card) => grid.appendChild(card));
      });
    });
  }

  // ---------- Init ----------
  updateScore();
})();
