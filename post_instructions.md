# posting instructions

---

## blog post

### 1. scaffold the file

```bash
node _dev/new-blog.js "your post title"
```

This creates `blog/your post title.md` with frontmatter already filled in (title, slug, timestamp).

### 2. write your post

Open the generated file and write below the `---` line in markdown.

```markdown
---
title: your post title
link: your-post-title         ← URL slug, auto-generated, change if needed
published_date: 2026-04-01 14:00
tags: short, self-improvement  ← comma-separated, optional
---

Your writing goes here. **bold**, *italic*, [links](https://url.com) all work.

## section heading

More writing.
```

**tags** — use these to categorize. `short` / `medium` / `long` are common length tags.

**disabled: true** — add this field to hide a post without deleting it.

### 3. add images

Drop image files into `blog/assets/` and reference them in your post:

```markdown
![alt text](assets/my-photo.jpg)
```

Supported: `.jpg` `.png` `.gif` `.avif` `.webp`

### 4. preview locally

First regenerate `blog.json` so Live Server picks up the new post:

```bash
node _dev/generate-blog-json.js
```

Then open `http://127.0.0.1:5500/blog-post/?slug=your-post-title` in your browser.

> The deploy script runs this automatically — you only need to do it manually for local preview.

### 5. deploy

```bash
bash _dev/deploy.sh "new post: your post title"
```

---

## works post

### 1. scaffold the directory

```bash
node _dev/new-work.js "My Work Title" "subtitle" "2026.04"
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

### 4. preview locally

Open `http://127.0.0.1:5500/work/?slug=my-work-title` in your browser.

### 5. deploy

```bash
bash _dev/deploy.sh "new work: my work title"
```

---

## image tips

- **rename files before adding** — no spaces in filenames (use `-` or `_`)
- **convert JPEG 2000 (.jp2) to real JPEG** on mac: `sips -s format jpeg input.jp2 --out output.jpg`
- **convert HEIC to JPG**: `sips -s format jpeg input.HEIC --out output.jpg`
- **avif / webp** work fine and are smaller than jpg for photos

---

## deploy

```bash
bash _dev/deploy.sh "your commit message"
```

This runs automatically:
1. Regenerates `data/blog.json` from all `.md` files in `blog/`
2. Copies all files to the deployed GitHub Pages repo
3. Commits and pushes — live within ~1 minute
