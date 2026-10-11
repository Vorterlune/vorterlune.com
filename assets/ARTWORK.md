# Monochrome space artwork

The monochrome scenes were generated with the built-in imagegen tool for the Vorterlune redesign. The current hero separates the moon background, transparent flowing vortex, and three independently floating HTML/CSS glass panels. Imagegen edited the earlier reference composition into isolated image layers; panel surfaces, typography, and branding are now separate HTML/CSS. The horizon contains no text, branding, or interface imagery. Outputs were visually inspected and resized with Lanczos. The current hero layers are encoded as WebP at quality 86; the horizon uses quality 84. No third-party stock artwork is used.

## Current assets

| Asset                     | Dimensions      | Purpose                          |
| ------------------------- | --------------- | -------------------------------- |
| `hero-moon-768.webp`      | 768 × 768       | Small moon background            |
| `hero-moon-1200.webp`     | 1200 × 1200     | Medium moon background           |
| `hero-moon-1600.webp`     | 1600 × 1600     | Large moon background            |
| `hero-vortex-640.webp`    | 640 × 640       | Small transparent vortex         |
| `hero-vortex-1000.webp`   | 1000 × 1000     | Large transparent vortex         |
| `space-horizon-768.webp`  | 768 × 256       | Small horizon                    |
| `space-horizon-1280.webp` | 1280 × 427      | Medium horizon                   |
| `space-horizon-1920.webp` | 1920 × 640      | Large horizon                    |
| `logo-white.png`          | 869 × 202       | Original supplied white wordmark |
| `favicon.svg`             | 64 × 64 viewBox | Original white symbol on black   |
| `organization-logo.png`   | 512 × 512       | Original black symbol on white   |
| `social-preview.jpg`      | 1200 × 630      | Social sharing image             |

Both current hero layer sources are 1254 × 1254 (verified from the saved PNGs; the generation previews displayed 1280 square), and the horizon source is 2172 × 724. Each responsive family preserves its source aspect ratio, subject only to whole-pixel rounding. The 1600px moon variant is upscaled from the original. The earlier integrated composition remains in `hero-reference-768.webp`, `hero-reference-1200.webp`, and `hero-reference-1600.webp` and is still used in the social sharing image. The previous 1536 × 1024 hero remains in `space-hero-640.webp`, `space-hero-1024.webp`, and `space-hero-1600.webp` as prior-iteration assets.

The moon outputs are opaque RGB WebPs of 22,494, 42,578, and 56,686 bytes respectively. The vortex outputs are RGBA WebPs of 132,898 and 301,994 bytes respectively. The vortex source's alpha range is 0–253, with 484,774 fully transparent pixels and 1,087,742 translucent pixels. After each resize, the encoded WebP's decoded alpha channel was verified byte-for-byte against the resized PNG alpha. Encoding preserves the genuine transparency and fading wisps; no background removal or artwork editing was performed with Pillow.

`logo-white.png` is an unmodified copy of the user's `Final/PNG Files (Transparent Background)/Logo-H43.png`. The favicon uses the unchanged path geometry from `Final/Icon size/SVG Files (Transparent Background)/Logo H44.svg`, scaled with margins on a black background. The organization logo uses the unchanged path geometry from `Logo H46.svg`, rendered on a white square with 64px margins.

The social image retains the earlier generated integrated hero, the real white wordmark, and the self-hosted Inter font. Its headline is “Thoughtful software, built with intent.”; text and branding are not generated. Pillow was used only for deterministic resizing, encoding, and this requested composition; macOS `sips` rendered the organization SVG.

## Current moon background: production prompt

Tool: built-in imagegen, opaque output. Edit target: the prior integrated hero source recorded below.

Saved source: `/Users/tianpok/.codex/generated_images/01a12bb5-5409-7df3-9e80-e51d78e43c52/exec-5d5ff220-c8cc-427a-b358-f835fb468b23.png` (1254 × 1254, RGB).

Use case: precise-object-edit. Asset: clean background layer for this exact animated monochrome website hero. EDIT the supplied composition, keep square format, black background and EXACT placement, scale, texture and lighting of the huge cratered crescent moon, the fine far-outer orbital lines, sparse stars, and the three small orbiting satellites. Remove ALL three rectangular glass cards/panels including their borders, highlights, window dots, and tiny crescent moons attached to the cards. ALSO remove the central silver spiral/vortex completely, including the broad bright curving strands which swirl into it: that entire right-side central region must be deep empty black space for a separate animated vortex layer. Keep the large cratered moon on the left, reconstruct only its currently occluded lower-left continuation naturally; the moon's shadowed right side stays pitch black blending into space. Keep the outermost thin circular orbital paths around the scene but remove ALL inner spiral flowing vortex trails. No letters, UI, logos, cards, disks, new planets or new decorative elements. Preserve the original framing, with crescent stretching from about x14%-64%, y9%-72% and empty dark central/right space. The resulting image should look like the original with cards and vortex cleanly erased, not a reimagined composition.

## Current isolated vortex: production prompt

Tool: built-in imagegen, transparent background enabled. Supporting reference: the prior integrated hero source recorded below.

Saved source: `/Users/tianpok/.codex/generated_images/01a12bb5-5409-7df3-9e80-e51d78e43c52/exec-f9382dc2-04cc-4565-a156-fba5e05f6f0c.png` (1254 × 1254, RGBA).

Use case: background-extraction. Asset: isolated animated vortex texture for an elegant monochrome website. Supporting reference is the attached silver curled vortex scene. Extract/recreate ONLY the beautiful flowing silver spiral/vortex as a single centered standalone layer with a genuinely transparent background. This is a fluid curled nautilus-like whirlpool of very fine smoky silver-white luminous strands, flowing inward to a tiny black spiral core; brightest thick arc on the upper/right, delicate faint strands below/left. Preserve the attached vortex aesthetic: organic curling asymmetric wisps, polished silver, deep smoky black between ribbons. Not a concentric circle, not an accretion-disk black hole, no galaxy starfield. Put the tiny spiral core exactly in the CENTER of the square canvas (50%,50%) so it can rotate gently with CSS. The full spiral should occupy about 90% of the image with wispy fading edges and transparent corners, circular overall envelope. Remove ALL cards, rectangular borders, glass panels, planets, moons, orbit lines, stars, text and logos from the source. No moon. No panels. Just the finely detailed silver vortex on transparency. A high-quality photorealistic cinematic 3D texture, pure grayscale only.

## Prior integrated hero reference edit

Tool: built-in imagegen. Input role: edit target, supplied by the user as the desired hero design. Reference: `/var/folders/_9/pn95p16944d7s7mn2t16l17c0000gn/T/codex-clipboard-2c8702d2-a44a-4647-8a5e-366a26a3b560.png`.

Saved source: `/Users/tianpok/.codex/generated_images/01a12bb5-5409-7df3-9e80-e51d78e43c52/exec-71abafff-2250-4b92-94a8-a9f3ddd3f2bb.png` (1254 × 1254).

Edit brief: extract and closely reproduce the reference's right-hand decorative composition on a square black canvas: the large cratered moon, flowing silver spiral, fine orbital trails, small moons, and three overlapping dark glass panels. Remove all typography, logos, browser chrome, and left-hand website UI. Preserve the blank decorative panel surfaces so real text and the supplied logo can be positioned separately in HTML.

The responsive family is a deterministic resize and WebP encoding of that saved output. The 1200 × 630 social image uses the same new scene, the supplied white wordmark, and real Inter text composited separately with Pillow; no typography or branding is generated.

## Prior hero iteration: generation prompt

Use case: stylized-concept. Asset type: high-end software studio website hero background, original raster artwork. Create a cinematic monochrome space composition in a 3:2 landscape canvas, approximately 1536x1024. Entirely black, white, and neutral grayscale. On the upper-left of the central composition, a large highly detailed cratered crescent moon with a thin bright sunlit rim; from its shadowed right edge a luminous swirling black-hole vortex arcs into the right-center of the frame, rendered with realistic subtle silver light trails and deep dark core. Delicate orbital ellipses, two tiny rocky moons, and a few sparse pinprick stars surround it. Premium science-fiction editorial realism with tactile crater detail, dramatic chiaroscuro, thin restrained glow, immense black negative space. Composition must be self-contained with planet and vortex fully inside the canvas: leave 10% pure black margin on all sides and fade all orbital trails smoothly into pure black edges. The artwork will sit to the right of real website text, so keep the leftmost quarter predominantly black. No text, no typography, no logo, no cards, no panels, no UI, no website screenshot, no browser frame, no colorful accents, no watermarks.

## Horizon generation prompt

Use case: stylized-concept. Asset type: wide cinematic website closing section background, original raster artwork. Create a refined monochrome planetary horizon seen from very low orbit, in a panoramic 3:1 landscape canvas, approximately 1920x640. Entirely black, white and neutral gray. A majestic gentle arc of a dark planet spans the full width; the arc peaks around one-third from the top at center and slopes toward the lower side edges. An extremely thin luminous silver atmosphere catches the light, with subtle realistic grayscale landforms, rugged craters and cloud wisps below it. Upper third is pure black empty space with very few tiny stars. Planet surface occupies the center and lower part, with deep shadow and smooth fade into pure black along the lower edge so real white text can be placed in front. Quiet, photorealistic, dramatic yet restrained; high detail around the rim, softly diminishing into black. No text, no typography, no logos, no watermarks, no UI, no buildings, no colorful accents, no sunrise disk, no bright sun.

---

# Legacy artwork provenance

The following assets belong to the previous design and are retained for provenance.

# Hero illustration

Asset: `studio-night.webp`. Generated once with the built-in image-generation tool, then encoded as WebP.

## Generation prompt

Use case: illustration-story
Asset type: original website hero artwork, one square illustration
Primary request: A cozy late-night solo programmer seen from behind, seated at a wooden desk in the lower center-right of the scene. The programmer has dark wavy hair and wears a navy sweater. A tall dark blue arched window dominates the upper and right portions of the scene, showing a luminous crescent moon, deep midnight blue starry sky, and a distant city with warm lit windows.
Scene details: Plants frame the window. An amber desk lamp casts warm light on a widescreen monitor displaying tiny abstract code lines, a notebook or tablet, and a mug. The far left interior is white or very pale lavender.
Style/medium: Highly polished, finely detailed painterly digital anime/editorial illustration, with the warmth and thoughtful atmosphere of modern cozy anime study scenes. Rich deep cobalt and navy colors, amber light, delicately painted botanical leaves and wooden desk textures.
Composition/framing: Square canvas, intended to fill the right 55 percent of a white website hero. Place the programmer low and slightly right of center. Keep the leftmost 15 percent airy and pale, mostly light wall, so the image can fade naturally into a white background. Let the lower edge soften into pale light. The arched window is the main silhouette; keep a large clear open region of dark sky in the upper-right for subtle animation overlays. Clear readable composition with an intimate room, not a crowded scene.
Lighting/mood: Warm and thoughtful, peaceful late-night creative focus, subtle blue moonlight against amber desk light.
Constraints: Exactly one original artwork. No logos, watermarks, website text, headings, captions, UI frames, or border. Abstract code marks may appear only on the monitor.

# Studio philosophy illustration

Asset: `studio-philosophy.webp` (1536 × 1024). Generated with the built-in image-generation tool, then encoded as WebP at quality 84. The user's supplied philosophy-panel screenshot guided the mood and composition; the panel's text and layout are HTML and CSS.

## Generation prompt

Use case: illustration-story. Asset type: original background artwork for a software studio philosophy panel on a website. Generate one wide landscape image, approximately 1536x1024. A quiet, empty contemporary home studio at night, seen from inside. A slim open laptop with a nearly dark screen sits on a dark wooden desk in the lower right-center, with a ceramic cup and a very subtle warm desk light. Tall rectangular windows on the right look onto a distant city skyline with a few warm lit windows, deep midnight blue sky and sparse tiny stars. A faint plant silhouette frames the far right. No people. Highly polished painterly editorial illustration, restrained cinematic lighting, charcoal black interiors, inky navy and muted indigo, soft warm light reflecting on the desk. Composition: the LEFTMOST 35 percent is calm, almost-black negative space (#101519), with the studio desk and windows on the RIGHTMOST 65 percent. Keep the upper right window area atmospheric and uncluttered. The desk and laptop must be visible near 70 percent across and 68 percent down, not cut off at the bottom. No arch, no large moon, no bright objects on left. The image should feel thoughtful, quiet, elegant, and grounded, similar to a premium independent software studio's night-work photograph but with subtle painted texture. Full-bleed image. No letters, words, text, typography, logos, watermarks, interface, rounded border, or website mockup. All webpage text will be added separately in HTML.
