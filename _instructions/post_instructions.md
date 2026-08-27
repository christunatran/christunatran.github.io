# posting instructions

All commands below are the `site` alias (defined in `~/.zshrc`, runs `_dev/site.sh`). Run `site` with no arguments for a cheat sheet.

---

## blog post

### 1. scaffold the file

```bash
site blog "your post title"
```

This creates `blog/your post title.md` with frontmatter already filled in (title, slug, timestamp) and opens it in VSCode.

### 2. write your post

Open the generated file and write below the `---` line in markdown.

```markdown
---
title: your post title
link: your-post-title         ← URL slug, auto-generated, change if needed
published_date: 2026-04-01 14:00
tags: short, self-improvement  ← comma-separated, optional
temperature: personal          ← who this is appropriate for, see below
---

Your writing goes here. **bold**, *italic*, [links](https://url.com) all work.

## section heading

More writing.
```

**tags** — use these to categorize. `short` / `medium` / `long` are common length tags.

**temperature** — relative appropriateness of the post's content:
- `employable` — fine for an employer/portfolio reader (e.g. "fidget camp recap")
- `personal` — fine for friends and family (e.g. "sf is not a great place to be a woman")
- `shit-talk` — talking shit, spilling tea (e.g. "a vietnamese saying")

**disabled: true** — add this field to hide a post without deleting it.

### 3. add images

Drop image files into `blog/assets/` and reference them in your post:

```markdown
![alt text](assets/my-photo.jpg)
```

Supported: `.jpg` `.png` `.gif` `.avif` `.webp`

### 4. preview locally

```bash
site preview
```

Then open `http://localhost:5500/blog-post/your-post-title`. The preview server regenerates `blog.json` automatically every time you save a file in `blog/`, so just refresh the browser as you write.

### 5. deploy

```bash
site deploy "new post: your post title"
```

---

## works post

### 1. scaffold the directory

```bash
site work "My Work Title" "subtitle" "2026.04"
```

- **subtitle** — category label shown under the title (e.g. `"physical computing"`, `"event organizing"`, `"fun"`)
- **date** — format `YYYY.MM` or `YYYY.MM.DD`

This creates:
```
works/my-work-title/
  index.md        ← write your post here
  assets/         ← drop images here
data/works.json   ← entry automatically added
```

### 2. add your cover image

Drop the cover image into `works/my-work-title/assets/`. Then open `data/works.json` and update the `cover` field to match the actual filename:

```json
{
  "slug": "my-work-title",
  "title": "My Work Title",
  "subtitle": "subtitle",
  "date": "2026.04",
  "cover": "works/my-work-title/assets/your-actual-cover.jpg"
}
```

### 3. write your post

Open `works/my-work-title/index.md` and write in markdown. The `# Title` heading at the top is the page title.

```markdown
# My Work Title

Description of the work, context, links, etc.

![main image](assets/main.jpg)

![another image](assets/another.jpg)
```

**Two images side by side** — place them on consecutive lines (no blank line between):

```markdown
![left](assets/left.jpg)
![right](assets/right.jpg)
```

**Images NOT side by side** — separate with a `&nbsp;` paragraph:

```markdown
![first](assets/first.jpg)

&nbsp;

![second](assets/second.jpg)
```

**Embed a YouTube video** — paste the full URL on its own line:

```markdown
https://www.youtube.com/watch?v=VIDEO_ID
```

**Embed a video file** — drop `.mp4` or `.mov` into assets and reference normally:

```markdown
![](assets/demo.mp4)
```

**GIF-style looping video** — name the file `something-loop.mp4` and it autoplays muted on a loop with no controls (use this instead of big GIFs — an mp4 is ~50x smaller). Convert a gif with:

```bash
ffmpeg -i input.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 26 output-loop.mp4
```

A `-loop.mp4` also works as the `cover` in `data/works.json` — it shows as a silent loop on the home and works pages.

### 4. preview locally

```bash
site preview
```

Then open `http://localhost:5500/work/my-work-title`.

### 5. deploy

```bash
site deploy "new work: my work title"
```

---

## image tips

- **drop in full-size photos, don't worry about size** — deploy automatically resizes anything over 2000px and recompresses big JPEGs (`_dev/optimize-images.js`; run it any time with `site images`)
- **rename files before adding** — no spaces in filenames (use `-` or `_`)
- **convert JPEG 2000 (.jp2) to real JPEG** on mac: `sips -s format jpeg input.jp2 --out output.jpg`
- **convert HEIC to JPG**: `sips -s format jpeg input.HEIC --out output.jpg`
- **avoid big GIFs** — use a `-loop.mp4` instead (see works section above)

---

## deploy

```bash
site deploy "your commit message"
```

This runs automatically:
1. Shrinks any oversized images and stamps cover dimensions into `data/works.json`
2. Regenerates `data/blog.json` from all `.md` files in `blog/`
3. Bumps the `?v=` cache-buster on css/js references
4. Commits and pushes — live within ~1 minute
