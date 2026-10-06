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
- `assets/`: supplied designer logos, self-hosted fonts, and the hero illustration.

The project previews are HTML/CSS interpretations of the supplied reference. Project cards open descriptions because the project repositories are not public. The GitHub links point to the Vorterlune organization.

## Publish

GitHub Pages can serve `main` from the repository root. `.nojekyll` disables unnecessary Jekyll processing. All asset paths are relative so the site works at both a repository URL and a custom domain. No custom domain or DNS changes are made by this implementation.

## Accessibility and motion

Navigation and project details work with a keyboard. Native dialogs support Escape and return focus to the project card. A skip link bypasses navigation. The footer provides a motion toggle. Animations respect `prefers-reduced-motion` and pause when the page is hidden or the hero is outside the viewport.

## Artwork

The original designer SVG geometry and colors are preserved, with empty artboard space removed. The hero illustration was created with the built-in image-generation tool and encoded as WebP for delivery. The generation brief is recorded in `assets/ARTWORK.md`.

Inter and Caveat are distributed under the SIL Open Font License; their license files are in `assets/`.
