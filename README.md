# Vorterlune

A responsive, static HTML website for the independent Vorterlune software studio. The monochrome design pairs the supplied white logo with original moon/vortex and planetary-horizon artwork. Content covers the studio's open-source work, products, experiments, and current Idiom and Notes projects.

## Develop locally

Use Node.js 22 or newer. Tailwind CSS and its CLI are pinned in `package.json`; `package-lock.json` records the complete dependency tree. Follow the [Tailwind CLI workflow](https://tailwindcss.com/docs/installation/tailwind-cli) through these commands:

```sh
npm ci
npm run build
python3 -m http.server 4173
```

Open <http://localhost:4173>. To rebuild styles while editing, run this command in a second terminal:

```sh
npm run dev:css
```

Edit utility classes in `index.html` and theme definitions, artwork layering, or animation rules in `src/styles.css`. Keep full utility class names in source so Tailwind can discover them. Do not hand-edit the generated root `styles.css`.

Before committing, run `npm run build` and include the generated `styles.css` with source changes. CI installs the locked dependencies, rebuilds CSS, and fails when the committed output is stale. The site itself has no JavaScript framework, stylesheet CDN, or runtime package dependency.

For motion changes, install the test browser once with `npx playwright install firefox`, then run `npm test`. The Firefox regression tests measure workspace and editor text at 1× and 2× display scale, check for stalls and jumps in the float and mouse parallax, and verify pause, resume, reduced motion, and offscreen behavior. CI runs the same tests.

## Files and content

- `index.html`: semantic page content, project details, navigation, and search/sharing metadata.
- `src/styles.css`: Tailwind import, shared theme, decorative composition, and motion rules.
- `styles.css`: compiled production stylesheet, committed for GitHub Pages.
- `script.js`: mobile navigation, accessible project dialogs, and motion preferences.
- `assets/`: supplied designer logos, self-hosted fonts, optimized artwork, and sharing imagery.
- `robots.txt` and `sitemap.xml`: crawler access and the canonical page inventory.

Project summaries remain in the initial HTML. The project cards provide detail dialogs because the project repositories are not public. GitHub and connection links point to the Vorterlune organization. Preserve the existing public anchors when changing section names.

## Accessibility and motion

Below 768px, navigation uses a hamburger disclosure with large tap targets. It closes after selecting a link, clicking outside, pressing Escape, or switching to desktop; Escape returns focus to the toggle. Without JavaScript, the navigation links stay visible. A skip link bypasses the header. Native project dialogs support Escape, labeled close controls, and focus return to their opener. Essential descriptions remain readable without opening a dialog.

The mobile hero centers its copy and places the artwork before a full-width Explore Our Work button. The secondary GitHub hero button and studio stats appear from 768px upward; GitHub remains available through navigation and the footer on phones.

The footer motion control pauses animations for the current visit. Animations respect `prefers-reduced-motion` and suspend while the page is hidden or artwork is offscreen. This includes the floating astronaut, interface windows, code and light trail, staggered blinking stars, spinning vortex, orbiting planets, and their counterrotation. Decorative artwork is hidden from assistive technology; meaningful content, headings, logos, and buttons remain separate HTML.

Both windows keep their fixed tilt while floating continuously between pixels. Slightly fuller letter strokes and subtle same-color text shadows keep their text consistent; the shadows scale with display resolution. Mouse parallax eases toward fractional positions over 180ms and returns smoothly when the pointer leaves. Pausing motion, hiding the page, moving the artwork offscreen, or enabling reduced motion cancels that transition immediately. Without JavaScript, the scene stays paused.

Check desktop and mobile layouts, keyboard focus, reduced-motion behavior, and JavaScript-disabled rendering after changing the design. Test at 375px, 768px, 1280px, and 1440px, plus 200% browser zoom. Run mobile and desktop Lighthouse audits to assess accessibility, SEO, and loading performance; deployed field measurements are needed to confirm Core Web Vitals.

## Publish

GitHub Pages continues to publish `main` from the repository root at <https://vorterlune.com/>. The new validation workflow does not change deployment or upload a separate site artifact. Pushing to `main` triggers the existing deployment, so committed production CSS must be current. `CNAME` preserves the custom domain, and `.nojekyll` disables unnecessary Jekyll processing.

After publishing, verify HTTPS, the canonical `www` redirect, the sitemap, and the social-image URL. Hosting and redirect settings remain managed by the existing Pages configuration.

## Search and sharing

The homepage has a descriptive title and meta description, a canonical URL, Open Graph and Twitter metadata, and JSON-LD for the website and studio. The 1200×630 sharing image uses the monochrome artwork, real logo, and headline. Keep structured data, sharing descriptions, and project statuses consistent with visible content; do not add unverified product or audience metrics.

When adding a public page, give it a unique title, description, and canonical URL, link to it from the site, and add its canonical URL to `sitemap.xml`. The sitemap intentionally omits `lastmod` because there is no automated process to maintain it accurately.

To track indexing, verify the domain in [Google Search Console](https://search.google.com/search-console) and submit `https://vorterlune.com/sitemap.xml`. Ownership verification and URL inspection require access to the site's Search Console account and are not performed by changing site files.

## Artwork and fonts

The supplied black-and-white designer logo geometry is preserved. Imagegen created a moon/debris background and separate transparent astronaut and vortex from the supplied astronaut hero reference. All use optimized responsive WebP variants with preserved alpha. Separate textured planets follow CSS orbits lasting 900, 1200, 1500, and 1800 seconds, with counterrotation keeping their lighting direction fixed.

The two decorative interface windows and loose code are real HTML and CSS, floating independently behind the astronaut while the vortex rotates over 260 seconds. Ten stars blink gently at staggered intervals, and an SVG light trail follows the astronaut’s gesture. Typography, branding, links, and buttons remain real HTML. The sharing image retains the earlier static composition. Generation details and exact prompts are recorded in `assets/ARTWORK.md`.

Inter is self-hosted. Font license files are retained in `assets/`.
