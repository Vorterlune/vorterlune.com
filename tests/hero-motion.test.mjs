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
      const file = pathname === "/styles.css" && process.env.MOTION_TEST_CSS
        ? path.resolve(process.env.MOTION_TEST_CSS)
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

function glyphContrast(image, rectangle, clip) {
  const scale = image.width / clip.width;
  const left = Math.max(0, Math.floor((rectangle.x - clip.x - 2) * scale));
  const top = Math.max(0, Math.floor((rectangle.y - clip.y - 2) * scale));
  const right = Math.min(image.width, Math.ceil((rectangle.right - clip.x + 2) * scale));
  const bottom = Math.min(image.height, Math.ceil((rectangle.bottom - clip.y + 2) * scale));
  const pixels = [];
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
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
          // Parent parallax must not reintroduce fractional-pixel shimmer.
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
