const root = document.documentElement;
const scene = document.querySelector("[data-motion-scene]");
const motionToggle = document.querySelector("[data-motion-toggle]");
const motionLabel = motionToggle?.querySelector("[data-motion-label]");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let manuallyPaused = false;
let sceneVisible = true;
let pointerFrame = 0;

function resetParallax() {
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  scene?.style.removeProperty("--scene-x");
  scene?.style.removeProperty("--scene-y");
}

function updateMotion() {
  const userPaused = manuallyPaused || motionPreference.matches;
  const paused = userPaused || document.hidden || !sceneVisible;
  root.classList.toggle("motion-paused", paused);

  if (motionToggle) {
    motionToggle.setAttribute("aria-pressed", String(userPaused));
    motionToggle.disabled = motionPreference.matches;
    motionToggle.setAttribute(
      "aria-label",
      motionPreference.matches
        ? "Motion paused by your system preference"
        : "Pause motion",
    );
  }
  if (motionLabel) {
    motionLabel.textContent = motionPreference.matches
      ? "Motion paused"
      : "Pause motion";
  }
  if (paused) resetParallax();
}

if (scene) {
  const pointerArea = scene.closest(".hero") ?? scene;
  if (motionToggle) {
    motionToggle.addEventListener("click", () => {
      manuallyPaused = !manuallyPaused;
      updateMotion();
    });
    motionToggle.hidden = false;
  }

  // Pause the decorative scene while it cannot be seen.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      sceneVisible = entry.isIntersecting;
      updateMotion();
    }).observe(scene);
  }

  pointerArea.addEventListener("pointermove", (event) => {
    if (
      event.pointerType !== "mouse" ||
      root.classList.contains("motion-paused")
    ) {
      return;
    }
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const bounds = pointerArea.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.max(
        -0.5,
        Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5),
      );
      const y = Math.max(
        -0.5,
        Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5),
      );
      scene.style.setProperty("--scene-x", `${x * 7}px`);
      scene.style.setProperty("--scene-y", `${y * 5}px`);
    });
  });
  pointerArea.addEventListener("pointerleave", resetParallax);
  pointerArea.addEventListener("pointercancel", resetParallax);
}

motionPreference.addEventListener("change", updateMotion);
document.addEventListener("visibilitychange", updateMotion);
updateMotion();

// Keep descriptions and links in HTML; only reveal working dialog controls.
const dialogStates = new Map();
document.querySelectorAll("[data-project]").forEach((trigger) => {
  const dialog = document.getElementById(`${trigger.dataset.project}-dialog`);
  if (!dialog || typeof dialog.showModal !== "function") return;

  if (!dialogStates.has(dialog)) {
    const state = { opener: null };
    dialogStates.set(dialog, state);
    dialog.querySelectorAll(".dialog-close").forEach((closeButton) => {
      closeButton.addEventListener("click", () => dialog.close());
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      const outside =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;
      if (outside) dialog.close();
    });
    // Native Escape handling closes the dialog and follows this same focus path.
    dialog.addEventListener("close", () => {
      if (state.opener?.isConnected)
        state.opener.focus({ preventScroll: true });
      state.opener = null;
    });
  }

  trigger.addEventListener("click", () => {
    if (dialog.open) return;
    dialogStates.get(dialog).opener = trigger;
    dialog.showModal();
  });
  trigger.hidden = false;
});

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
