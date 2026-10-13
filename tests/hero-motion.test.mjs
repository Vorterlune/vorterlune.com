import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { firefox } from "playwright";
import { PNG } from "pngjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
const workspace = ".scene-card--workspace";
const cards = ".scene-card--workspace, .scene-card--editor";
const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
let server;
let browser;
let origin;
let firefoxDataRoot;

before(async () => {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const requested = path.resolve(repository, `.${pathname === "/" ? "/index.html" : pathname}`);
      if (!requested.startsWith(repository)) {
        response.writeHead(403).end();
        return;
      }
      const override = pathname === "/styles.css" ? process.env.MOTION_TEST_CSS
        : pathname === "/script.js" ? process.env.MOTION_TEST_SCRIPT : undefined;
      const file = override
        ? path.resolve(override)
        : requested;
      const contents = await readFile(file);
      response.writeHead(200, { "Content-Type": mimeTypes[path.extname(file)] ?? "application/octet-stream" });
      response.end(contents);
    } catch {
      response.writeHead(404).end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  origin = `http://127.0.0.1:${server.address().port}`;

  // On macOS, isolate Firefox's app-data root as well as its temporary profile.
  // This avoids accessing the user's OS-protected Firefox application data.
  if (process.platform === "darwin") {
    firefoxDataRoot = await mkdtemp(path.join(tmpdir(), "vorterlune-firefox-"));
    await mkdir(path.join(firefoxDataRoot, "Library", "Application Support"), { recursive: true });
    await mkdir(path.join(firefoxDataRoot, "Library", "Caches"), { recursive: true });
  }
  browser = await firefox.launch({
    headless: true,
    ...(firefoxDataRoot ? { env: { ...process.env, CFFIXED_USER_HOME: firefoxDataRoot } } : {}),
  });
}, { timeout: 60_000 });

after(async () => {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (firefoxDataRoot) {
    await rm(firefoxDataRoot, { recursive: true, force: true }).catch((error) => {
      // macOS can protect directories created by CoreFoundation, even in tmp.
      // Leave those for OS cleanup instead of changing their access controls.
      if (!["EACCES", "EPERM"].includes(error.code)) throw error;
    });
  }
});

async function openPage(deviceScaleFactor) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor,
  });
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

function glyphContrast(image, rectangle, clip, padding = 2, polygon) {
  const scale = image.width / clip.width;
  const left = Math.max(0, Math.floor((rectangle.x - clip.x - padding) * scale));
  const top = Math.max(0, Math.floor((rectangle.y - clip.y - padding) * scale));
  const right = Math.min(image.width, Math.ceil((rectangle.right - clip.x + padding) * scale));
  const bottom = Math.min(image.height, Math.ceil((rectangle.bottom - clip.y + padding) * scale));
  const pixels = [];
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (polygon) {
        const point = { x: clip.x + (x + 0.5) / scale, y: clip.y + (y + 0.5) / scale };
        const sides = polygon.map((start, index) => {
          const end = polygon[(index + 1) % polygon.length];
          return (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
        });
        if (sides.some((side) => side < 0) && sides.some((side) => side > 0)) continue;
      }
      const offset = (y * image.width + x) * 4;
      pixels.push(Math.round(
        image.data[offset] * 0.299 + image.data[offset + 1] * 0.587 + image.data[offset + 2] * 0.114,
      ));
    }
  }
  assert.ok(pixels.length, "Text must remain inside the captured workspace");
  pixels.sort((a, b) => a - b);
  const background = pixels[Math.floor(pixels.length / 10)];
  return pixels.reduce((sum, pixel) => sum + Math.max(0, pixel - background) ** 2, 0);
}

function tiltedGlyphContrast(image, quad, clip) {
  const horizontalLength = Math.hypot(quad[1].x - quad[0].x, quad[1].y - quad[0].y);
  const verticalLength = Math.hypot(quad[3].x - quad[0].x, quad[3].y - quad[0].y);
  const horizontal = { x: (quad[1].x - quad[0].x) / horizontalLength, y: (quad[1].y - quad[0].y) / horizontalLength };
  const vertical = { x: (quad[3].x - quad[0].x) / verticalLength, y: (quad[3].y - quad[0].y) / verticalLength };
  // Pad along the text's own axes. Axis-aligned boxes around long tilted lines
  // include adjacent rows and falsely count their partial glyphs as shimmer.
  const polygon = quad.map((point, index) => ({
    x: point.x + horizontal.x * (index === 1 || index === 2 ? 1 : -1) + vertical.x * (index > 1 ? 1 : -1),
    y: point.y + horizontal.y * (index === 1 || index === 2 ? 1 : -1) + vertical.y * (index > 1 ? 1 : -1),
  }));
  const rectangle = {
    x: Math.min(...polygon.map((point) => point.x)), y: Math.min(...polygon.map((point) => point.y)),
    right: Math.max(...polygon.map((point) => point.x)), bottom: Math.max(...polygon.map((point) => point.y)),
  };
  return glyphContrast(image, rectangle, clip, 0, polygon);
}

test("workspace text keeps consistent contrast throughout a moving cycle", { timeout: 120_000 }, async (t) => {
  for (const dpr of [1, 2]) {
    const page = await openPage(dpr);
    try {
      await page.evaluate(() => {
        document.getAnimations().forEach((animation) => {
          animation.pause();
          animation.currentTime = 0;
        });
      });
      // Isolate glyph rendering from moving artwork shining through the glass.
      await page.addStyleTag({ content: `
        .hero-composition > :not(${workspace}) { visibility: hidden }
        ${workspace} .scene-card-surface { background: #080808 }
        ${workspace} .scene-card-surface::before { display: none }
      ` });
      const { clip, duration } = await page.locator(workspace).evaluate((card) => {
        const bounds = card.getBoundingClientRect();
        return {
          clip: { x: Math.floor(bounds.x - 50), y: Math.floor(bounds.y - 50), width: Math.ceil(bounds.width + 100), height: Math.ceil(bounds.height + 100) },
          duration: card.getAnimations()[0]?.effect.getTiming().duration,
        };
      });
      assert.ok(Number.isFinite(duration) && duration > 0, "Workspace must have floating motion");
      const samples = new Map();
      const positions = [];
      for (let frame = 0; frame < 48; frame++) {
        if (frame < 40) {
          await page.locator(workspace).evaluate((card, time) => {
            card.getAnimations()[0].currentTime = time;
          }, frame * duration / 39);
        } else {
          // Parent parallax must keep text contrast stable, too.
          await page.mouse.move(100 + (frame - 40) * 160, frame % 2 ? 600 : 200);
        }
        await settle(page);
        const { position, labels } = await page.locator(workspace).evaluate((card) => {
          const bounds = card.getBoundingClientRect();
          return {
            position: { x: bounds.x, y: bounds.y },
            labels: [...card.querySelectorAll(".workspace-item, .workspace-content p, .workspace-content > div")].map((row) => {
              const text = [...row.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
              const range = document.createRange();
              range.selectNodeContents(text);
              return { text: text.textContent.trim(), rectangle: range.getBoundingClientRect().toJSON() };
            }),
          };
        });
        assert.equal(labels.length, 11, "Measure every sidebar label, heading, and content row");
        if (frame < 40) positions.push(position);
        const image = PNG.sync.read(await page.screenshot({ clip }));
        labels.forEach((label, index) => {
          const key = `${index}: ${label.text}`;
          if (!samples.has(key)) samples.set(key, []);
          samples.get(key).push(glyphContrast(image, label.rectangle, clip));
        });
      }
      const displacement = Math.max(...positions.map((position) => Math.hypot(position.x - positions[0].x, position.y - positions[0].y)));
      assert.ok(displacement > 2, `Workspace must visibly move at DPR ${dpr}; measured ${displacement.toFixed(2)}px`);
      const variations = [...samples].map(([label, values]) => {
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        assert.ok(mean > 0, `${label} must remain visible`);
        return { label, variation: (Math.max(...values) - Math.min(...values)) / mean };
      });
      const worst = Math.max(...variations.map(({ variation }) => variation));
      t.diagnostic(`Firefox DPR ${dpr}: worst text contrast variation ${(worst * 100).toFixed(1)}% across a full cycle`);
      assert.deepEqual(
        variations.filter(({ variation }) => variation >= 0.1).map(({ label, variation }) => `${label}: ${(variation * 100).toFixed(1)}%`),
        [],
        `Workspace text contrast must vary by less than 10% at DPR ${dpr}`,
      );
    } finally {
      await page.close();
    }
  }
});

test("workspace floating motion advances smoothly between display frames", { timeout: 30_000 }, async (t) => {
  for (const dpr of [1, 2]) {
    const page = await openPage(dpr);
    try {
      await page.evaluate(() => {
        document.getAnimations().forEach((animation) => {
          animation.pause();
          animation.currentTime = 0;
        });
      });
      const timing = await page.locator(workspace).evaluate((card) => {
        const animation = card.getAnimations()[0];
        if (!animation) return null;
        const { duration, delay } = animation.effect.getTiming();
        return { duration, delay };
      });
      assert.ok(timing && Number.isFinite(timing.duration) && timing.duration > 0, "Workspace must float");

      // Sample a second around the middle of the upward journey, where a gentle
      // float advances by less than a physical pixel each 60 Hz display frame.
      const center = ((timing.duration / 4 + timing.delay) % timing.duration + timing.duration) % timing.duration;
      const positions = await page.locator(workspace).evaluate(async (card, center) => {
        const animation = card.getAnimations()[0];
        const surface = card.querySelector(".scene-card-surface");
        const positions = [];
        for (let frame = 0; frame <= 60; frame++) {
          animation.currentTime = center - 500 + frame * (1000 / 60);
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const bounds = surface.getBoundingClientRect();
          positions.push({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 });
        }
        return positions;
      }, center);

      const steps = positions.slice(1).map((position, index) => (
        Math.hypot(position.x - positions[index].x, position.y - positions[index].y) * dpr
      ));
      const travel = Math.hypot(positions.at(-1).x - positions[0].x, positions.at(-1).y - positions[0].y) * dpr;
      assert.ok(travel > 1, `Workspace must visibly travel through the sampled interval at DPR ${dpr}`);
      const averageStep = travel / steps.length;
      assert.ok(averageStep < 1, "The interval must exercise movement smaller than one physical pixel per frame");
      const stalledFraction = steps.filter((step) => step < 0.0001).length / steps.length;
      const largestStep = Math.max(...steps);
      t.diagnostic(`Firefox DPR ${dpr}: ${(stalledFraction * 100).toFixed(1)}% stalled frames; largest movement ${(largestStep / averageStep).toFixed(1)}× the average frame`);
      assert.ok(
        stalledFraction <= 0.1,
        `Workspace motion must advance continuously at DPR ${dpr}; ${(stalledFraction * 100).toFixed(1)}% of frames were stationary`,
      );
      assert.ok(
        largestStep <= averageStep * 3,
        `Workspace motion must avoid sudden jumps at DPR ${dpr}; largest step ${largestStep.toFixed(3)} physical pixels versus average ${averageStep.toFixed(3)}`,
      );
    } finally {
      await page.close();
    }
  }
});

async function cardPositions(page) {
  return page.locator(cards).evaluateAll((elements) => elements.map((element) => {
    const bounds = element.getBoundingClientRect();
    return { x: bounds.x, y: bounds.y };
  }));
}

test("pause and reduced motion stop both windows, and resume restores motion", { timeout: 30_000 }, async () => {
  const page = await openPage(2);
  try {
    const toggle = page.locator("[data-motion-toggle]");
    // The control is in the footer; avoid scrolling the hero offscreen here.
    await toggle.evaluate((button) => button.click());
    await settle(page);
    assert.equal(await toggle.getAttribute("aria-pressed"), "true");
    const paused = await cardPositions(page);
    assert.equal(paused.length, 2);
    await page.waitForTimeout(350);
    assert.deepEqual(await cardPositions(page), paused, "Pause must stop both windows");

    await toggle.evaluate((button) => button.click());
    assert.equal(await toggle.getAttribute("aria-pressed"), "false");
    const resumed = await cardPositions(page);
    const moved = [false, false];
    for (let attempt = 0; attempt < 20 && !moved.every(Boolean); attempt++) {
      await page.waitForTimeout(100);
      (await cardPositions(page)).forEach((position, index) => {
        moved[index] ||= position.x !== resumed[index].x || position.y !== resumed[index].y;
      });
    }
    assert.deepEqual(moved, [true, true], "Resume must move both windows");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await settle(page);
    assert.equal(await toggle.isDisabled(), true);
    const reduced = await cardPositions(page);
    await page.waitForTimeout(350);
    assert.deepEqual(await cardPositions(page), reduced, "Reduced motion must stop both windows");
  } finally {
    await page.close();
  }
});

async function scenePosition(page) {
  return page.locator("[data-motion-scene]").evaluate((scene) => {
    const bounds = scene.getBoundingClientRect();
    return { x: bounds.x + scrollX, y: bounds.y + scrollY };
  });
}

async function settleParallax(page) {
  await page.locator("[data-motion-scene]").evaluate(async (scene) => {
    let previous;
    let stable = 0;
    const deadline = performance.now() + 2000;
    while (performance.now() < deadline) {
      await new Promise(requestAnimationFrame);
      const bounds = scene.getBoundingClientRect();
      const position = { x: bounds.x + scrollX, y: bounds.y + scrollY };
      stable = previous && Math.hypot(position.x - previous.x, position.y - previous.y) < 0.002 ? stable + 1 : 0;
      if (stable >= 4) return;
      previous = position;
    }
    throw new Error("Pointer parallax did not settle");
  });
}

async function sampleParallaxTransition(page, holdAt) {
  const result = await page.evaluate(async (holdAt) => {
    const scene = document.querySelector("[data-motion-scene]");
    let transition;
    for (let frame = 0; frame < 6; frame++) {
      transition = scene.getAnimations().find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "transform");
      if (transition) break;
      await new Promise(requestAnimationFrame);
    }
    if (!transition) return null;
    transition.pause();
    const duration = transition.effect.getTiming().duration;
    const positions = [];
    for (let frame = 0; frame < (holdAt === undefined ? 21 : 1); frame++) {
      transition.currentTime = duration * (holdAt ?? frame / 20);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const bounds = scene.getBoundingClientRect();
      positions.push({ x: bounds.x + scrollX, y: bounds.y + scrollY });
    }
    return { duration, positions };
  }, holdAt);
  assert.ok(result && result.duration > 0, "Real pointer events must animate the scene's transform rather than teleport it");
  return result.positions;
}

function assertSmoothParallax(positions, dpr, label, t) {
  const steps = positions.slice(1).map((position, index) => (
    Math.hypot(position.x - positions[index].x, position.y - positions[index].y) * dpr
  ));
  const travel = steps.reduce((sum, step) => sum + step, 0);
  assert.ok(travel > 0.75, `${label} must visibly move the scene at DPR ${dpr}`);
  const movingSteps = steps.filter((step) => step > 0.0001).length;
  const largestFraction = Math.max(...steps) / travel;
  let covered = 0;
  const activeSteps = steps.filter((step) => {
    covered += step;
    return covered > travel * 0.05 && covered < travel * 0.85;
  });
  const stalledFraction = activeSteps.filter((step) => step < 0.0001).length / Math.max(1, activeSteps.length);
  t.diagnostic(`Firefox DPR ${dpr} ${label}: ${movingSteps} intermediate movements; largest jump ${(largestFraction * 100).toFixed(1)}% of travel`);
  assert.ok(movingSteps >= 5, `${label} must interpolate through several positions at DPR ${dpr}; measured ${movingSteps} movements`);
  assert.ok(largestFraction < 0.45, `${label} must not teleport at DPR ${dpr}; one frame covered ${(largestFraction * 100).toFixed(1)}% of the path`);
  assert.ok(stalledFraction <= 0.2, `${label} must not advance in discrete steps at DPR ${dpr}; ${(stalledFraction * 100).toFixed(1)}% of active frames stalled`);
}

test("pointer parallax follows, retargets, and returns smoothly without drifting when stopped", { timeout: 45_000 }, async (t) => {
  for (const dpr of [1, 2]) {
    const page = await openPage(dpr);
    try {
      const hero = await page.locator(".hero").boundingBox();
      const first = { x: hero.x + hero.width * 0.9, y: hero.y + hero.height * 0.75 };
      const second = { x: hero.x + hero.width * 0.12, y: hero.y + hero.height * 0.22 };
      const rest = await scenePosition(page);
      const assertAtRest = async (reason) => {
        const position = await scenePosition(page);
        assert.ok(Math.hypot(position.x - rest.x, position.y - rest.y) * dpr < 0.1, `${reason} must reset parallax to its resting position`);
      };

      await page.mouse.move(first.x, first.y);
      assertSmoothParallax(await sampleParallaxTransition(page), dpr, "pointer entry", t);

      await page.mouse.move(second.x, second.y);
      const [retargetStart] = await sampleParallaxTransition(page, 0.4);
      await page.mouse.move(first.x, first.y);
      const retargeted = await sampleParallaxTransition(page);
      assert.ok(Math.hypot(retargeted[0].x - retargetStart.x, retargeted[0].y - retargetStart.y) * dpr < 0.1, "Retargeting must continue from the current visible position");
      assertSmoothParallax(retargeted, dpr, "pointer retarget", t);

      await page.mouse.move(5, 5);
      assertSmoothParallax(await sampleParallaxTransition(page), dpr, "pointer exit", t);
      await assertAtRest("Pointer exit");

      // Queue a pointer frame and pause in the same task, before that frame runs.
      await page.evaluate(({ x, y }) => {
        document.querySelector(".hero").dispatchEvent(new PointerEvent("pointermove", {
          bubbles: true, pointerType: "mouse", clientX: x, clientY: y,
        }));
        document.querySelector("[data-motion-toggle]").click();
      }, first);
      await settle(page);
      await assertAtRest("Pause before a queued pointer frame");
      await page.waitForTimeout(100);
      await assertAtRest("Cancelled pointer frame after pause");
      await page.locator("[data-motion-toggle]").evaluate((button) => button.click());

      await page.mouse.move(first.x, first.y);
      await page.waitForTimeout(40);
      await page.locator("[data-motion-toggle]").evaluate((button) => button.click());
      await settle(page);
      await assertAtRest("Pause");
      await page.mouse.move(second.x, second.y);
      await page.waitForTimeout(300);
      await assertAtRest("Pointer movement while paused");

      await page.locator("[data-motion-toggle]").evaluate((button) => button.click());
      await page.mouse.move(first.x, first.y);
      await page.waitForTimeout(40);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await settle(page);
      await assertAtRest("Reduced motion");
      await page.mouse.move(second.x, second.y);
      await page.waitForTimeout(300);
      await assertAtRest("Pointer movement with reduced motion");

      await page.emulateMedia({ reducedMotion: "no-preference" });
      await settle(page);
      await page.mouse.move(first.x, first.y);
      await page.waitForTimeout(40);
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      await page.waitForTimeout(100);
      await assertAtRest("Offscreen scene");
      await page.waitForTimeout(300);
      await assertAtRest("Offscreen scene after pending frames");
    } finally {
      await page.close();
    }
  }
});

test("editor text keeps consistent contrast during pointer parallax", { timeout: 120_000 }, async (t) => {
  for (const dpr of [1, 2]) {
    const page = await openPage(dpr);
    try {
      await page.evaluate(() => document.getAnimations().forEach((animation) => {
        animation.pause();
        animation.currentTime = 0;
      }));
      await page.addStyleTag({ content: `
        .hero-composition > :not(.scene-card--editor) { visibility: hidden }
        .scene-card--editor .scene-card-surface { background: #080808 }
        .scene-card--editor .scene-card-surface::before { display: none }
      ` });
      const hero = await page.locator(".hero").boundingBox();
      const clip = await page.locator(".scene-card--editor").evaluate((card) => {
        const bounds = card.getBoundingClientRect();
        return { x: Math.floor(bounds.x - 50), y: Math.floor(bounds.y - 50), width: Math.ceil(bounds.width + 100), height: Math.ceil(bounds.height + 100) };
      });
      const samples = new Map();
      const beforeMarkers = PNG.sync.read(await page.screenshot({ clip }));
      const geometry = await page.locator(".scene-card--editor").evaluate((card) => {
        const rows = [...card.querySelectorAll(".card-window-bar span, .card-window-bar b, .editor-line-numbers, .editor-code, .editor-code > span:first-child")];
        const nodes = rows.flatMap((row) => [...row.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
        const rectangles = () => nodes.map((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getBoundingClientRect().toJSON();
        });
        const before = rectangles();
        nodes.forEach((node) => {
          const sample = document.createElement("motion-sample");
          sample.dataset.label = node.textContent.trim();
          sample.style.position = "relative";
          node.replaceWith(sample);
          sample.append(node);
          for (const corner of ["left:0;top:0", "right:0;top:0", "right:0;bottom:0", "left:0;bottom:0"]) {
            const probe = document.createElement("motion-corner");
            probe.style.cssText = `position:absolute;width:0;height:0;pointer-events:none;${corner}`;
            sample.append(probe);
          }
        });
        return { before, after: rectangles() };
      });
      await settle(page);
      const afterMarkers = PNG.sync.read(await page.screenshot({ clip }));
      assert.deepEqual(geometry.after, geometry.before, "Measurement markers must preserve text layout");
      assert.equal(Buffer.compare(afterMarkers.data, beforeMarkers.data), 0, "Measurement markers must preserve the editor's rendered pixels");
      for (let frame = 0; frame < 25; frame++) {
        const phase = frame / 24;
        await page.mouse.move(hero.x + hero.width * (0.08 + phase * 0.84), hero.y + hero.height * (0.15 + phase * 0.7));
        await settle(page);
        // Hold native transitions at the rendered intermediate pose so bounds
        // and screenshot refer to the same pixels; real pointer events start them.
        const transitions = await page.evaluate(() => {
          const transitions = document.getAnimations().filter((animation) => animation instanceof CSSTransition);
          transitions.forEach((animation) => animation.pause());
          return transitions.length;
        });
        if (transitions) await settle(page);
        else await settleParallax(page);
        const labels = await page.locator(".scene-card--editor motion-sample").evaluateAll((elements) => elements.map((element) => {
          // Zero-size corner probes expose the transformed inline box without
          // relying on the experimental getBoxQuads browser API.
          const quad = [...element.children].map((corner) => {
            const bounds = corner.getBoundingClientRect();
            return { x: bounds.x, y: bounds.y };
          });
          return { text: element.dataset.label, quad };
        }));
        assert.equal(labels.length, 18, "Measure the editor title, control, line numbers, and every code line");
        const image = PNG.sync.read(await page.screenshot({ clip }));
        labels.forEach(({ text, quad }) => {
          if (!samples.has(text)) samples.set(text, []);
          samples.get(text).push(tiltedGlyphContrast(image, quad, clip));
        });
      }
      const variations = [...samples].map(([label, values]) => {
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        assert.ok(mean > 0, `${label} must remain visible`);
        return { label, variation: (Math.max(...values) - Math.min(...values)) / mean };
      });
      t.diagnostic(`Firefox DPR ${dpr}: worst editor pointer-motion contrast variation ${(Math.max(...variations.map(({ variation }) => variation)) * 100).toFixed(1)}%`);
      assert.deepEqual(
        variations.filter(({ variation }) => variation >= 0.1).map(({ label, variation }) => `${label}: ${(variation * 100).toFixed(1)}%`),
        [],
        `Editor text contrast must vary by less than 10% during pointer movement at DPR ${dpr}`,
      );
    } finally {
      await page.close();
    }
  }
});
