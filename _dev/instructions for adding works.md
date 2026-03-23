# HOW TO ADD A BLOG POST

1. Create a new `.md` file in `blog/`
   - **Filename:** use only letters, numbers, spaces, and hyphens — no `?`, `!`, `'`, or other special characters (they break URLs)
   - Example: `blog/my new post.md`

2. Add frontmatter at the top of the file:
   ```
   ---
   title: my post title
   link: my-post-slug
   published_date: 2026-03-21 12:00
   tags: short, rant
   ---

   your content here...
   ```
   - `link` → the URL slug (letters and hyphens only, no spaces)
   - `published_date` → format: `YYYY-MM-DD HH:MM`
   - `tags` → comma-separated, can be empty
   - To hide a post without deleting it, add `disabled: true`

3. That's it. When you run `deploy`, `blog.json` is auto-generated from your files.

---

# HOW TO ADD A WORK

1. Create `works/your-slug/` with:
   - `index.md` — content (images referenced as `assets/filename.ext`)
   - `assets/` — folder for images/videos

2. Add an entry to `data/works.json`:
   ```json
   {
     "slug": "your-slug",
     "title": "project title",
     "subtitle": "category",
     "date": "2026.03",
     "cover": "works/your-slug/assets/cover.jpg"
   }
   ```

3. Run `deploy`.

---

# HOW TO DEPLOY

Run this in your terminal:
```
deploy
```

Or with a custom commit message:
```
deploy "add new blog post"
```

The deploy script automatically:
1. Regenerates `data/blog.json` from your markdown files
2. Copies everything to the deploy repo
3. Commits and pushes to GitHub Pages

---

# HOW TO USE THE BLOG WATCHER (optional)

If you want `blog.json` to update live while you're writing (useful for local preview):

```
node _dev/watch-blog.js
```

Leave it running in a terminal tab. Every time you save a `.md` file in `blog/`, it regenerates `blog.json` automatically.
