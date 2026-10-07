const root = document.documentElement;
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionToggle = document.querySelector(".motion-toggle");
const starfield = document.querySelector(".starfield");
const hero = document.querySelector(".hero");
let manuallyPaused = false;
let heroVisible = true;
let pointerFrame = 0;

// A fixed seed keeps the constellation stable between visits.
let seed = 42;
function random() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

const stars = document.createDocumentFragment();
for (let index = 0; index < 48; index += 1) {
  const star = document.createElement("span");
  star.className = index % 7 === 0 ? "star cross" : "star";
  star.style.left = `${5 + random() * 90}%`;
  star.style.top = `${5 + random() * 70}%`;
  star.style.setProperty("--size", `${1 + random() * 1.3}px`);
  star.style.setProperty("--duration", `${3 + random() * 5}s`);
  star.style.setProperty("--delay", `${-random() * 8}s`);
  stars.append(star);
}
starfield.append(stars);

function updateMotion() {
  const paused = manuallyPaused || motionPreference.matches;
  root.classList.toggle(
    "motion-paused",
    paused || document.hidden || !heroVisible,
  );
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionToggle.querySelector("span").textContent = paused
    ? "Motion paused"
    : "Pause motion";
  motionToggle.setAttribute(
    "aria-label",
    motionPreference.matches
      ? "Animations disabled by system preference"
      : paused
        ? "Enable animations"
        : "Pause animations",
  );
  motionToggle.disabled = motionPreference.matches;
  if (paused) {
    root.style.removeProperty("--scene-x");
    root.style.removeProperty("--scene-y");
  }
}

motionToggle.hidden = false;
motionToggle.addEventListener("click", () => {
  manuallyPaused = !manuallyPaused;
  updateMotion();
});
motionPreference.addEventListener("change", updateMotion);
document.addEventListener("visibilitychange", updateMotion);
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    updateMotion();
  }).observe(hero);
}
updateMotion();

// Keep parallax small, pointer-only, and off when motion is paused.
hero.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse" || root.classList.contains("motion-paused"))
    return;
  cancelAnimationFrame(pointerFrame);
  pointerFrame = requestAnimationFrame(() => {
    const bounds = hero.getBoundingClientRect();
    root.style.setProperty(
      "--scene-x",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 7}px`,
    );
    root.style.setProperty(
      "--scene-y",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * 5}px`,
    );
  });
});
hero.addEventListener("pointerleave", () => {
  cancelAnimationFrame(pointerFrame);
  root.style.removeProperty("--scene-x");
  root.style.removeProperty("--scene-y");
});

document.querySelectorAll("[data-project]").forEach((trigger) => {
  const dialog = document.getElementById(`${trigger.dataset.project}-dialog`);
  trigger.addEventListener("click", () => dialog.showModal());
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
});
