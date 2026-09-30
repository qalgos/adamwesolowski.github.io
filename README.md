# adamwesolowski.github.io

Personal academic website of Adam Wesołowski — quantum algorithms, quantum complexity and quantum topological data analysis.

Live at **https://qalgos.github.io/adamwesolowski.github.io/**

The hero shows a live Vietoris–Rips complex of a drifting point cloud. Visitors can add a vertex with the pointer and change the scale ε; the panel reports β₀, edge and triangle counts and the Euler characteristic of the 2-skeleton.

## Structure

```
.
├── index.html            # all page content
├── 404.html              # standalone "page not found"
├── assets/
│   ├── css/style.css     # design tokens at the top (:root)
│   ├── js/complex.js     # the live simplicial complex in the hero
│   ├── js/main.js        # nav, section highlighting, paper filters, copy email
│   └── favicon.svg
└── README.md
```

No build step, no dependencies. Plain HTML, CSS and JavaScript; the page is fully readable with JavaScript disabled.

## Deploying on GitHub Pages

1. Replace the old `index.html` and `style.css` in the repository with these files (the old root `style.css` can be deleted; the new one lives in `assets/css/`).
2. Commit and push to the default branch.
3. In **Settings → Pages**, make sure the source is *Deploy from a branch*, branch `main` (or `master`), folder `/ (root)`.

All paths in `index.html` are relative, so the site works both at a project URL (`qalgos.github.io/adamwesolowski.github.io/`) and on a custom domain. If you move the site, update the absolute URLs in `404.html` and the `og:url` / JSON-LD block in `index.html`.

## Editing content

**Add a paper.** Copy a `<li class="pub">` block inside the right year group in `index.html`. Set `data-tags` to one or more of `topology`, `graphs`, `complexity`, `ml` so the filters pick it up. New year? Copy a whole `<div class="pub-group">`.

```html
<li class="pub" data-tags="topology complexity">
  <h3 class="pub__title"><a href="https://arxiv.org/abs/XXXX.XXXXX">Paper title</a></h3>
  <p class="pub__authors">Co-Author, <strong>Adam Wesołowski</strong></p>
  <p class="pub__venue">Venue or status</p>
  <p class="pub__links"><a href="https://arxiv.org/abs/XXXX.XXXXX">arXiv</a><a href="https://scirate.com/arxiv/XXXX.XXXXX">SciRate</a></p>
</li>
```

**Add a talk.** Copy a `<li>` in the `.talks` list. Older items go inside the "Show earlier events" `<details>` block.

**Add a filter topic.** Add a `<button class="chip" data-filter="newtag">` in `.filters` and use `newtag` in the papers' `data-tags`.

**Add a CV.** Put `CV.pdf` in `assets/` and add a link, e.g. in the contact links: `<li><a href="assets/CV.pdf">CV (PDF)</a></li>`.

**Change colours or fonts.** Everything is in the `:root` block at the top of `assets/css/style.css`.

## Accessibility and performance

- Keyboard navigable with visible focus, skip link, and a labelled mobile menu.
- The animation pauses off-screen and in background tabs, has a pause button, and is static for visitors who prefer reduced motion.
- Two web fonts (STIX Two Text, Hanken Grotesk) from Google Fonts; no other external requests.

## Licence

Content © Adam Wesołowski. Code may be reused with attribution.
