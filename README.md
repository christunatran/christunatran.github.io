# christunatran.github.io

tunapee's personal site. Plain HTML/CSS/JS on GitHub Pages — no framework, no build step. Content is markdown, rendered in the browser with marked.js.

## everyday commands

The `site` alias (in `~/.zshrc` → [_dev/site.sh](_dev/site.sh)) does everything:

```
site blog "post title"                    scaffold a blog post (and open it)
site work "title" "subtitle" "2026.04"    scaffold a works post (and open it)
site preview                              local server at http://localhost:5500
site deploy "commit message"              optimize images + regenerate + push
site images                               shrink oversized images now
```

Full posting details: [_dev/post_instructions.md](_dev/post_instructions.md)

## how it works

- **Pages fetch markdown and render it client-side.** `work/` and `blog-post/` are empty page shells; their JS reads the slug from the URL, fetches the right `.md`, and renders it.
- **Clean URLs** like `/work/froggy-chair` work because GitHub Pages serves `404.html` for unknown paths, and its inline script loads the right page shell in place.
- **`data/blog.json` is generated** from the frontmatter of every file in `blog/` — never edit it by hand (except the `disabled` flag). **`data/works.json` is hand-edited** (one entry per work); its `coverW`/`coverH` fields are stamped automatically.
- **Images optimize themselves on deploy** — `_dev/optimize-images.js` resizes anything over 2000px and recompresses big JPEGs, so you can drop full-size photos straight into an assets folder.

## map

```
index.html            home — masonry feed of works, blog posts, and images (js/home.js)
css/style.css         all styling
js/                   all behavior; components.js injects the nav + side panel on every page
blog/*.md             blog posts (frontmatter on top), images in blog/assets/
works/<slug>/         one folder per work: index.md + assets/
data/                 blog.json (generated), works.json (hand-edited), 75hard-progress.json
work/, blog-post/     page shells that render a single work / blog post
about/, now/, 75/     standalone pages
2ndbrain/             published by the separate quartz repo — don't edit here
ALONE/, doomscroll/,
plasticstool/         standalone web art pieces
_dev/                 scripts + dev docs (not part of the site itself)
404.html              GitHub Pages fallback that powers the clean URLs
```
