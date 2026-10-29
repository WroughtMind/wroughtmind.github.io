# Project exhibit sources

Copied on 2026-10-30 from the projects' own public website and render assets.

## Webi

Source repository: https://github.com/WroughtMind/weibei

| Website asset | Source path |
| --- | --- |
| `webi/wake.webp`, `webi/wake-still.webp` | `website/assets/webi/motion-39.webp`, `motion-39-thumb.webp` |
| `webi/read.webp`, `webi/read-still.webp` | `website/assets/webi/motion-41.webp`, `motion-41-thumb.webp` |
| `webi/play.webp`, `webi/play-still.webp` | `website/assets/webi/motion-40.webp`, `motion-40-thumb.webp` |

Names and character description follow the English `data-en` text in `website/webi.html` (the English page is emitted by `website/seo/build.py`). The animated images are the website's Wake, Read/Chat/Note, and Orbit scenes. Still frames are used when the device requests reduced motion.

## Creditia

Source repository: https://github.com/WroughtMind/creditia

The unchanged `creditia/*.png` assets come from `packages/render/gallery/` with the same filenames. These bundled samples visibly identify Weibei and include a historical export snapshot (1,755 commits); they are presented as “Weibei · sample exports”, never as current repository metrics. The current `src/gallery.ts` defaults to the fictional `fixtures/catnap.json`, but that is not the identity printed in these existing images, so they are not labelled catnap.

| Asset | Artwork |
| --- | --- |
| `mosaic-neon.png` | File mosaic, Neon style |
| `roll-poster.png` | Film credits, Poster style |
| `receipt-editorial-folio.png` | Effort receipt, Editorial folio |
| `tier-gala.png` | Contribution ranking, Gala style |

## Marks

- `weibei-mark.svg`: `WroughtMind/weibei/Docs/brand/weibei-mark.svg`.
- `creditia-mark.svg`: `WroughtMind/creditia/packages/render/assets/creditia/logo-color.svg`, used in the project switcher.
- `creditia-ink.svg`: `WroughtMind/creditia/packages/render/assets/creditia/logo.svg`, the official monochrome mark used on the flag.

The flag composites these unchanged vector sources into the existing material, then refracts the entire image. Dark mode changes neutral ink to warm white while preserving Weibei's red accent.
