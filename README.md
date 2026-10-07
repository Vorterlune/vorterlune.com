# Vorterlune

A responsive, static HTML website for the Vorterlune software studio.

## Preview locally

Serve the repository with any static server. For example:

```sh
python3 -m http.server 4173
```

Open <http://localhost:4173>. There is no build step or runtime dependency.

## Files

- `index.html`: page content, project details, and metadata.
- `styles.css`: responsive styling, project interface previews, and animations.
- `script.js`: stars, motion preferences, subtle pointer parallax, and accessible project dialogs.
- `assets/`: supplied designer logos, self-hosted fonts, and studio illustrations.
- `robots.txt` and `sitemap.xml`: crawler access and the canonical page inventory.

The project previews are HTML/CSS interpretations of the supplied reference. Project cards open descriptions because the project repositories are not public. The GitHub links point to the Vorterlune organization.

## Publish

GitHub Pages publishes `main` from the repository root at <https://vorterlune.com/>. Pushing to `main` triggers a deployment. `CNAME` preserves the custom domain, and `.nojekyll` disables unnecessary Jekyll processing. HTTPS is enforced, and `www.vorterlune.com` redirects to the canonical domain.

## Search and sharing

The homepage includes a descriptive title and meta description, a canonical URL, Open Graph and Twitter sharing metadata, and JSON-LD for the Vorterlune website and studio. Sharing previews reuse the existing square studio illustration. All descriptions are present in static HTML; no JavaScript is needed to read the studio or project summaries.

When adding a public page, give it a unique title, description, and canonical URL, link to it from the site, and add its canonical URL to `sitemap.xml`. Keep structured data consistent with visible content. The sitemap intentionally omits `lastmod` because there is no automated process to maintain it accurately.

To track indexing, verify the domain in [Google Search Console](https://search.google.com/search-console) and submit `https://vorterlune.com/sitemap.xml`. Site files alone do not verify ownership or submit the sitemap to a Search Console account.

## Accessibility and motion

Navigation and project details work with a keyboard. Native dialogs support Escape and return focus to the project card. A skip link bypasses navigation. The footer provides a motion toggle. Animations respect `prefers-reduced-motion` and pause when the page is hidden or the hero is outside the viewport.

## Artwork

The original designer SVG geometry and colors are preserved, with empty artboard space removed. The hero is an arched night-sky window built with CSS and inline SVG, with twinkling stars, shooting stars, a floating crescent moon, and a distant skyline. Its frame stays still while the sky responds subtly to the pointer. The original studio illustration remains the social sharing image; its generation brief is recorded in `assets/ARTWORK.md`.

The Studio section includes a philosophy panel with a separate night-studio illustration, `assets/studio-philosophy.webp`. It loads lazily, and its heading, copy, and motto remain accessible HTML. Its generation prompt is also recorded in `assets/ARTWORK.md`.

Inter and Caveat are distributed under the SIL Open Font License; their license files are in `assets/`.
