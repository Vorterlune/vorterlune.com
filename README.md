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

## Files and content

- `index.html`: semantic page content, project details, navigation, and search/sharing metadata.
- `src/styles.css`: Tailwind import, shared theme, decorative composition, and motion rules.
- `styles.css`: compiled production stylesheet, committed for GitHub Pages.
- `script.js`: accessible project dialogs and motion preferences.
- `assets/`: supplied designer logos, self-hosted fonts, optimized artwork, and sharing imagery.
- `robots.txt` and `sitemap.xml`: crawler access and the canonical page inventory.

Project summaries remain in the initial HTML. The project cards provide detail dialogs because the project repositories are not public. GitHub and connection links point to the Vorterlune organization. Preserve the existing public anchors when changing section names.

## Accessibility and motion

Navigation works with a keyboard and without JavaScript. A skip link bypasses the header. Native project dialogs support Escape, labeled close controls, and focus return to their opener. Essential descriptions remain readable without opening a dialog.

The footer motion control pauses animations for the current visit. Animations respect `prefers-reduced-motion` and suspend while the page is hidden or artwork is offscreen. Decorative artwork is hidden from assistive technology; meaningful content, headings, logos, and buttons remain separate HTML.

Check desktop and mobile layouts, keyboard focus, reduced-motion behavior, and JavaScript-disabled rendering after changing the design. Test at 375px, 768px, 1280px, and 1440px, plus 200% browser zoom. Run mobile and desktop Lighthouse audits to assess accessibility, SEO, and loading performance; deployed field measurements are needed to confirm Core Web Vitals.

## Publish

GitHub Pages continues to publish `main` from the repository root at <https://vorterlune.com/>. The new validation workflow does not change deployment or upload a separate site artifact. Pushing to `main` triggers the existing deployment, so committed production CSS must be current. `CNAME` preserves the custom domain, and `.nojekyll` disables unnecessary Jekyll processing.

After publishing, verify HTTPS, the canonical `www` redirect, the sitemap, and the social-image URL. Hosting and redirect settings remain managed by the existing Pages configuration.

## Search and sharing

The homepage has a descriptive title and meta description, a canonical URL, Open Graph and Twitter metadata, and JSON-LD for the website and studio. The 1200×630 sharing image uses the monochrome artwork, real logo, and headline. Keep structured data, sharing descriptions, and project statuses consistent with visible content; do not add unverified product or audience metrics.

When adding a public page, give it a unique title, description, and canonical URL, link to it from the site, and add its canonical URL to `sitemap.xml`. The sitemap intentionally omits `lastmod` because there is no automated process to maintain it accurately.

To track indexing, verify the domain in [Google Search Console](https://search.google.com/search-console) and submit `https://vorterlune.com/sitemap.xml`. Ownership verification and URL inspection require access to the site's Search Console account and are not performed by changing site files.

## Artwork and fonts

The supplied black-and-white designer logo geometry is preserved. The moon/vortex scene was edited with imagegen from the supplied hero reference; the planetary horizon was generated separately. Both use optimized responsive variants. The hero raster includes the decorative glass-panel surfaces, while all typography, branding, links, and buttons remain real HTML. Generation details are recorded in `assets/ARTWORK.md`.

Inter is self-hosted. Font license files are retained in `assets/`.
