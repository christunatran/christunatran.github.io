# 2ndbrain instructions

---

## what this is

`tunapee.online/2ndbrain` is a [Quartz](https://quartz.jzhao.xyz) site built from a folder in Obsidian. It's a separate static site generator that outputs plain HTML, which gets copied into this repo (`christunatran.github.io`) at `2ndbrain/` and deployed the same way the rest of the site is.

**pieces involved:**

| what | where |
|---|---|
| Quartz engine + config | `/Users/tunapee/quartz` (separate repo, not this one) |
| content source | `/Users/tunapee/Documents/Obsidian Vault/tunapee's vault/Second Brain` (an Obsidian folder) |
| published output | `christunatran.github.io/2ndbrain/` (this repo) |
| publish script | `/Users/tunapee/quartz/_dev/publish.sh` |
| one-command alias | `publish-2ndbrain` (defined in `~/.zshrc`) |

**how content flows:** `content/` in the quartz repo is a symlink straight to the `Second Brain` folder in Obsidian — there's no copying or syncing step, editing a note in Obsidian changes what Quartz sees instantly.

**no separate notes repo.** The raw markdown in `Second Brain/` is *not* version-controlled anywhere — Obsidian is the only copy. This was a deliberate choice to avoid managing a third repo; only the *built HTML output* lands in git (in this repo, under `2ndbrain/`).

---

## writing a note

Just write it in Obsidian, inside the `Second Brain` folder. Nothing else to do — it'll show up next time you publish.

The root/landing page of `/2ndbrain` is whatever note is named `index.md` inside `Second Brain/`.

---

## publishing

```bash
publish-2ndbrain "your commit message"
```

Run from anywhere (it's a shell alias). This does, in order:

1. `npx quartz build` in `/Users/tunapee/quartz` — rebuilds static HTML from whatever's currently in `Second Brain/`
2. `rsync -a --delete` copies the output into `christunatran.github.io/2ndbrain/`, deleting anything no longer generated (so deleted/renamed notes disappear from the live site too)
3. `git add -A && git commit && git push` in this repo

Nothing publishes automatically — edits in Obsidian just sit there until you run this command. If the alias isn't available in a shell, either open a new terminal or run `source ~/.zshrc`, or just run the script directly:

```bash
bash /Users/tunapee/quartz/_dev/publish.sh "your commit message"
```

> The publish script commits onto whatever branch is currently checked out in this repo. Make sure you're on the branch you actually want to publish to (see "current status" below).

---

## previewing locally before publishing

From this repo's root:

```bash
npx http-server -p 5500 -e html -c-1
```

Then open **http://127.0.0.1:5500/2ndbrain/**

> **use `-e html`, not VS Code's plain Live Server / `python3 -m http.server`.** Quartz generates extension-less URLs (`/2ndbrain/some-note`, not `/2ndbrain/some-note.html`). GitHub Pages resolves these automatically in production, but a basic static server doesn't — it'll 404. `http-server -e html` replicates GitHub Pages' behavior locally.

If the page looks stale after a rebuild, it's almost always the browser holding a cached `index.html` — hard refresh (Cmd+Shift+R) or use a private window. The CSS/JS bundle filenames are content-hashed, so if you *do* see new asset filenames referenced in the page source but old styling, that's the tell it's a browser cache issue, not a build issue.

---

## current status

The site is built and themed but **not live yet**. Everything so far has been committed to a branch called `quartz` in this repo — `main` (what GitHub Pages actually serves) hasn't been touched.

To go live:

```bash
git checkout main
git merge quartz
git push
```

`tunapee.online/2ndbrain` will be live within about a minute of pushing. After that, stay on `main` (or merge `quartz` into it again) before running `publish-2ndbrain` going forward, otherwise it'll happily publish to whatever branch you're on instead of the live one.

---

## theme

Quartz's colors and fonts are configured in `/Users/tunapee/quartz/quartz.config.yaml`. It's currently set to match this site:

- **body font:** Kosugi
- **header font:** Silkscreen
- **code font:** Courier Prime
- **colors:** monochrome black/white/gray, mapped from this site's `style.css` variables (`--bg`, `--text`, `--link`, `--link-hover`)
- **no dark mode** — this site doesn't have one, so `/2ndbrain` doesn't either. `@quartz-community/darkmode` is disabled and `theme.mode` is forced to `light`, so it always renders the light palette regardless of the visitor's OS setting.
- **page title:** "tunapee's second brain" (`configuration.pageTitle`)

**fonts and colors both have to be set in more than one place**, which isn't obvious and bit us twice:

1. `configuration.theme.typography` / `configuration.theme.colors` — the main theming surface
2. the `@quartz-community/quartz-fonts` plugin's own `options` block, further down under `plugins:`
3. the `@quartz-themes/core` plugin (an "Obsidian community theme" system — ports real Obsidian CSS themes like `tokyo-night`, `default`, etc.)

`quartz-fonts` and `@quartz-themes/core` are both independent theming systems that can silently override `configuration.theme`. In this setup:

- `quartz-fonts` fell back to its own hardcoded font defaults (Schibsted Grotesk / Source Sans Pro / IBM Plex Mono) instead of inheriting from the main theme, and won the CSS cascade. **Fixed** by giving it explicit `header`/`body`/`code` options matching the main theme.
- `@quartz-themes/core` (set to Obsidian's `default` theme) completely overrode the configured colors with its own palette — including a purple accent color that showed up as a purple dot in the graph view. It doesn't read `configuration.theme.colors` at all when enabled. **Fixed** by disabling it (`enabled: false`) so the native color config is the only one in play.

```yaml
- source: "@quartz-community/quartz-fonts"
  enabled: true
  options:
    header: Silkscreen
    body: Kosugi
    code: Courier Prime
...
- source: "@quartz-themes/core"
  enabled: false   # was overriding configuration.theme.colors with its own Obsidian theme palette
...
- source: "@quartz-community/darkmode"
  enabled: false   # this site has no dark mode
```

If colors or fonts look off after a future config change, check both/all three of these places before assuming it's a caching issue — it probably isn't.

### custom.css — the sidebar/graph restyle

Quartz's config only exposes colors and fonts — no way to touch component-level things like border-radius, spacing, or literal copy ("Graph View" → "Graph"). There's no official "custom CSS" hook in this version of Quartz, so we added one:

- `/Users/tunapee/quartz/quartz/static/custom.css` — hand-written overrides. Anything in `quartz/static/` gets copied verbatim into the build output at `static/`.
- `publish.sh` injects `<link rel="stylesheet" href="/2ndbrain/static/custom.css"/>` into every built HTML file's `<head>` right before syncing to this repo (there's no built-in way to get Quartz to add that link tag itself).

What it currently overrides:
- site title / "Explorer" heading — restyled to match this site's actual `h2` rule (9px, lowercase, letter-spaced, thin black border-bottom)
- search box — flat gray fill instead of a bordered pill
- explorer note list — underlined links, more breathing room
- graph view — enclosed in a dashed border box, heading text swapped to "Graph"

If you edit `custom.css`, it takes effect on the next `publish-2ndbrain` (or manually: rebuild, then re-run the `sed` injection command in `publish.sh`, then re-sync — see that script for the exact command).

To change anything else, edit `quartz.config.yaml` (colors/fonts/plugins) or `custom.css` (everything else), then re-run `publish-2ndbrain` (or rebuild + preview locally first — see above).

---

## troubleshooting

**`npx quartz build` fails with "Theme ... was installed but could not be loaded"** — happens once if a theme package (`@quartz-themes/*`) wasn't downloaded yet; Quartz auto-installs it mid-build but can't see the newly-installed files until the process restarts. Just run `npx quartz build` again.

**a note isn't showing up** — check it's actually inside `Second Brain/` (not a parent/sibling folder in the vault) and that you've re-run `publish-2ndbrain` since editing it.
