// Test Type toggle: pick which part of each card is hidden behind a
// "reveal" button so you can quiz yourself. Click a toggle again to turn it
// off and show everything.
(function () {
  // Maps each test type to the element it hides inside a card and the label
  // shown on the reveal button that replaces it.
  const SLOTS = {
    icon: { selector: ".card-top svg", label: "Icon" },
    name: { selector: ".label", label: "Icon Name" },
    desc: { selector: ".desc", label: "Icon Description" },
  };

  const toggles = document.querySelectorAll(".test-toggle");
  let activeType = null;

  // Remove any reveal buttons and un-hide every slot.
  function clearTest() {
    document.querySelectorAll(".reveal-btn").forEach((btn) => btn.remove());
    document
      .querySelectorAll(".slot-hidden")
      .forEach((el) => el.classList.remove("slot-hidden"));
  }

  // Hide the chosen slot on every card and drop a reveal button in its place.
  function applyTest(type) {
    clearTest();
    const slot = SLOTS[type];
    document.querySelectorAll(".card").forEach((card) => {
      const el = card.querySelector(slot.selector);
      if (!el) return;

      el.classList.add("slot-hidden");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "reveal-btn";
      btn.dataset.slot = type;
      btn.textContent = slot.label;
      btn.title = "Click to reveal";
      btn.addEventListener("click", () => {
        el.classList.remove("slot-hidden");
        btn.remove();
      });

      el.parentNode.insertBefore(btn, el);
    });
  }

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const type = toggle.dataset.type;

      if (activeType === type) {
        // Clicking the active toggle turns testing off.
        activeType = null;
        toggle.classList.remove("active");
        clearTest();
      } else {
        activeType = type;
        toggles.forEach((b) => b.classList.toggle("active", b === toggle));
        applyTest(type);
      }
    });
  });
})();
