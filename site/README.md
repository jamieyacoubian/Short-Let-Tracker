# Jamie Yacoubian — personal website

A standalone, fully static one-page site for Jamie's independent due diligence
preparation practice. It has no relationship to the Short-Let-Tracker app in
the rest of this repository — it just lives in this branch/repo because that's
where the work was requested. There is no build step: it's plain HTML, CSS and
a small vanilla JS file for the mobile menu.

## Preview locally

```bash
cd site
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Any static host works (Netlify, Vercel, GitHub Pages, S3 + CloudFront, etc.) —
just upload the contents of this folder. Nothing needs to be built or
compiled.

## Before going live

- Replace `jamieyacoubian.com` in `index.html` (the canonical link, Open
  Graph tags and the structured-data script) with the real domain.
- Sanity-check the three fee-schedule figures (`#fees` section — currently
  £1,950 / £3,450 / £5,250) and each tier's turnaround estimate against
  real engagements once a few have run. They were modelled against a
  monthly revenue target, not billed history — see chat for the maths.
- Update the LinkedIn/email links if either ever changes.

## Files

- `index.html` — all page content and metadata
- `styles.css` — the full design system (palette, type, layout)
- `script.js` — mobile navigation toggle only; the rest of the page needs
  no JavaScript
- `assets/portrait.jpg` / `assets/portrait-540.jpg` — the cropped and
  tonally corrected portrait (face, expression, suit and proportions
  unaltered; background/exposure only)
- `favicon.svg` — a simple "JY" monogram
