// Touch Gesture Practice — detect six core gestures and give instant feedback.
//
// Each gesture card has a shaded practice zone. When the user performs the
// gesture correctly, the card flips to "Done ✓" and the scoreboard counts up.
// Single-pointer gestures use Pointer Events (mouse + touch); the pinch uses
// Touch Events for multi-touch, with a +/- fallback on non-touch devices.
(function () {
  const GESTURES = ["tap", "scroll", "swipe", "hold", "doubletap", "pinch"];
  const TOTAL = GESTURES.length;
  const done = {}; // gesture -> true once completed

  const doneCountEl = document.getElementById("gb-done");
  const feedbackEl = document.getElementById("sb-feedback");

  function card(name) {
    return document.querySelector(`.gesture-card[data-gesture="${name}"]`);
  }

  function feedbackText(n) {
    if (n === 0)
      return "Try each gesture below — the box turns green when you succeed.";
    if (n < TOTAL) return `Nice! ${n} of ${TOTAL} done — keep going.`;
    return "🌟 You've practiced all six gestures. You're ready to go!";
  }

  function updateScore() {
    const n = Object.keys(done).length;
    doneCountEl.textContent = String(n);
    feedbackEl.textContent = feedbackText(n);
  }

  function markDone(name) {
    if (done[name]) return; // count each gesture only once
    done[name] = true;
    const c = card(name);
    if (c) {
      c.classList.add("done");
      const status = c.querySelector("[data-status]");
      if (status) {
        status.textContent = "Done ✓";
        status.classList.add("done");
      }
    }
    updateScore();
  }

  // ---------- Tap ----------
  (function () {
    const target = document.getElementById("tap-target");
    if (!target) return;
    let start = null;
    target.addEventListener("pointerdown", (e) => {
      start = { t: Date.now(), x: e.clientX, y: e.clientY };
    });
    target.addEventListener("pointerup", (e) => {
      if (!start) return;
      const quick = Date.now() - start.t < 500;
      const still =
        Math.abs(e.clientX - start.x) < 10 && Math.abs(e.clientY - start.y) < 10;
      start = null;
      if (quick && still) markDone("tap");
    });
  })();

  // ---------- Scroll ----------
  (function () {
    const zone = document.querySelector('.gz-scroll[data-zone="scroll"]');
    if (!zone) return;
    zone.addEventListener("scroll", () => {
      if (zone.scrollTop + zone.clientHeight >= zone.scrollHeight - 8)
        markDone("scroll");
    });
  })();

  // ---------- Swipe ----------
  (function () {
    const swipe = document.getElementById("swipe-card");
    if (!swipe) return;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    swipe.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      swipe.setPointerCapture(e.pointerId);
      swipe.style.transition = "none";
    });
    swipe.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      swipe.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      swipe.style.transition = "transform 0.3s ease";
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy)) {
        // Fling it off, then settle back to center.
        swipe.style.transform = `translateX(${dx > 0 ? 420 : -420}px) rotate(${
          dx > 0 ? 20 : -20
        }deg)`;
        markDone("swipe");
        setTimeout(() => {
          swipe.style.transition = "none";
          swipe.style.transform = "translateX(0)";
        }, 320);
      } else {
        swipe.style.transform = "translateX(0)"; // snap back
      }
    }
    swipe.addEventListener("pointerup", end);
    swipe.addEventListener("pointercancel", () => {
      dragging = false;
      swipe.style.transition = "transform 0.3s ease";
      swipe.style.transform = "translateX(0)";
    });
  })();

  // ---------- Touch & Hold ----------
  (function () {
    const target = document.getElementById("hold-target");
    if (!target) return;
    const HOLD_MS = 700;
    let timer = null;

    function startHold(e) {
      e.preventDefault();
      target.classList.add("holding"); // CSS transitions the fill to 100%
      timer = setTimeout(() => {
        target.classList.add("held");
        markDone("hold");
      }, HOLD_MS);
    }
    function cancelHold() {
      if (timer) clearTimeout(timer);
      timer = null;
      if (!done["hold"]) target.classList.remove("holding");
    }
    target.addEventListener("pointerdown", startHold);
    target.addEventListener("pointerup", cancelHold);
    target.addEventListener("pointerleave", cancelHold);
    target.addEventListener("pointercancel", cancelHold);
  })();

  // ---------- Double-Tap to Zoom ----------
  (function () {
    const box = document.getElementById("doubletap-box");
    if (!box) return;
    let last = 0;
    box.addEventListener("pointerup", () => {
      const now = Date.now();
      if (now - last < 300) {
        box.classList.toggle("zoomed");
        markDone("doubletap");
        last = 0;
      } else {
        last = now;
      }
    });
  })();

  // ---------- Pinch to Zoom ----------
  (function () {
    const box = document.getElementById("pinch-box");
    const fallback = document.getElementById("pinch-fallback");
    if (!box) return;
    let scale = 1;
    const apply = (s) => {
      scale = Math.max(1, Math.min(2.2, s));
      box.style.transform = `scale(${scale})`;
      if (scale > 1.3) markDone("pinch");
    };

    let startDist = 0;
    const dist = (t) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    box.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          startDist = dist(e.touches);
        }
      },
      { passive: false }
    );
    box.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 2 && startDist > 0) {
          e.preventDefault();
          apply(dist(e.touches) / startDist);
        }
      },
      { passive: false }
    );
    box.addEventListener("touchend", () => {
      startDist = 0;
    });

    // Non-touch devices can't pinch — offer +/- buttons instead.
    if (!("ontouchstart" in window) && fallback) {
      fallback.hidden = false;
      const hint = box.querySelector(".gz-hint");
      if (hint) hint.textContent = "Use + / − to zoom";
      fallback.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-pinch]");
        if (!btn) return;
        apply(scale + (btn.dataset.pinch === "out" ? 0.4 : -0.4));
      });
    }
  })();

  // ---------- Reset ----------
  const resetBtn = document.getElementById("sb-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      GESTURES.forEach((name) => {
        delete done[name];
        const c = card(name);
        if (!c) return;
        c.classList.remove("done");
        const status = c.querySelector("[data-status]");
        if (status) {
          status.textContent = "Try it";
          status.classList.remove("done");
        }
      });
      // Clear each gesture's visual state.
      const scrollZone = document.querySelector(".gz-scroll");
      if (scrollZone) scrollZone.scrollTop = 0;
      const swipe = document.getElementById("swipe-card");
      if (swipe) {
        swipe.style.transition = "none";
        swipe.style.transform = "translateX(0)";
      }
      const hold = document.getElementById("hold-target");
      if (hold) hold.classList.remove("holding", "held");
      const dt = document.getElementById("doubletap-box");
      if (dt) dt.classList.remove("zoomed");
      const pinch = document.getElementById("pinch-box");
      if (pinch) pinch.style.transform = "scale(1)";
      updateScore();
    });
  }

  // ---------- Init ----------
  updateScore();
})();
