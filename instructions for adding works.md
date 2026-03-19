Updated: nav "works" link in index.html, about.html, and now.html

To add a new work in the future:

Create `works/your-project/` with `index.md` and `assets/`

In `index.md`, reference images as `assets/filename.ext`

Add an entry to `works.json` with slug, title, subtitle, date, and optionally cover

Videos `(.mov/.mp4)` referenced as links in the markdown will 
automatically render as <video> elements on the page.

# HOW TO DEPLOY

```
/Users/tunapee/Coding/website/deploy.sh
```

With commit message:
"/Users/tunapee/Coding/website/deploy.sh "add new blog post"