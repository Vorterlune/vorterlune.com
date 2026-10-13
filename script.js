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
  if (
    typeof CSS.registerProperty === "function" &&
    CSS.supports("(transform: translateX(round(nearest, 1px, 1px)))")
  ) {
    scene.classList.add("pixel-motion");
    function updateMotionResolution() {
      const pixelRatio = window.devicePixelRatio || 1;
      scene.style.setProperty("--motion-pixel", `${1 / pixelRatio}px`);
      resetParallax();
      // Re-arm when zooming or moving the window to a different display.
      window
        .matchMedia(`(resolution: ${pixelRatio}dppx)`)
        .addEventListener("change", updateMotionResolution, { once: true });
    }
    updateMotionResolution();
  }
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
      const pixelRatio = window.devicePixelRatio || 1;
      // Fractional parent offsets would undo the window's pixel-aligned float.
      scene.style.setProperty(
        "--scene-x",
        `${Math.round(x * 7 * pixelRatio) / pixelRatio}px`,
      );
      scene.style.setProperty(
        "--scene-y",
        `${Math.round(y * 5 * pixelRatio) / pixelRatio}px`,
      );
    });
  });
  pointerArea.addEventListener("pointerleave", resetParallax);
  pointerArea.addEventListener("pointercancel", resetParallax);
}

motionPreference.addEventListener("change", updateMotion);
document.addEventListener("visibilitychange", updateMotion);
updateMotion();

// Keep navigation available without JavaScript; enhance it as a disclosure on mobile.
const siteHeader = document.querySelector(".site-header");
const menuToggle = siteHeader?.querySelector("[data-menu-toggle]");
const primaryNavigation = siteHeader?.querySelector(
  "[data-primary-navigation]",
);

if (siteHeader && menuToggle && primaryNavigation) {
  const desktopNavigation = window.matchMedia("(min-width: 48rem)");

  function setNavigationOpen(open, restoreFocus = false) {
    const isMobile = !desktopNavigation.matches;
    const expanded = isMobile && open;

    // Move focus before collapsing a region that currently contains it.
    if (!expanded) {
      if (
        isMobile &&
        (restoreFocus || primaryNavigation.contains(document.activeElement))
      ) {
        menuToggle.focus({ preventScroll: true });
      } else if (!isMobile && document.activeElement === menuToggle) {
        primaryNavigation
          .querySelector("a[href]")
          ?.focus({ preventScroll: true });
      }
    }

    siteHeader.classList.toggle("menu-open", expanded);
    menuToggle.setAttribute("aria-expanded", String(expanded));
    menuToggle.setAttribute(
      "aria-label",
      expanded ? "Close navigation" : "Open navigation",
    );
  }

  menuToggle.addEventListener("click", () => {
    setNavigationOpen(!siteHeader.classList.contains("menu-open"));
  });
  primaryNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) setNavigationOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteHeader.classList.contains("menu-open")) {
      event.preventDefault();
      setNavigationOpen(false, true);
    }
  });
  document.addEventListener("click", (event) => {
    if (
      siteHeader.classList.contains("menu-open") &&
      !siteHeader.contains(event.target)
    ) {
      setNavigationOpen(false);
    }
  });
  desktopNavigation.addEventListener("change", () => setNavigationOpen(false));

  menuToggle.hidden = false;
  setNavigationOpen(false);
  siteHeader.classList.add("menu-enhanced");
}

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
