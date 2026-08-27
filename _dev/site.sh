#!/usr/bin/env bash
#
# site — the whole posting workflow in one short command.
# Wired to the `site` alias in ~/.zshrc.
#
#   site blog "post title"                    scaffold a blog post (and open it)
#   site work "title" "subtitle" "2026.04"    scaffold a works post (and open it)
#   site preview                              local server at http://localhost:5500
#   site deploy "commit message"              optimize images + regenerate + push
#   site images                               shrink oversized images now
#
set -euo pipefail
cd "$(dirname "$0")/.."

# Same slug rule as new-blog.js / new-work.js
slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
}

# Open a file in the editor if we can; otherwise just print where it is
edit() {
  if command -v code >/dev/null 2>&1; then code "$1"; else echo "  → open: $1"; fi
}

cmd="${1:-help}"

case "$cmd" in
  blog)
    title="${2:?usage: site blog \"post title\"}"
    node _dev/new-blog.js "$title"
    edit "blog/$title.md"
    ;;

  work)
    title="${2:?usage: site work \"title\" \"subtitle\" \"2026.04\"}"
    node _dev/new-work.js "$title" "${3:-}" "${4:-}"
    edit "works/$(slugify "$title")/index.md"
    ;;

  preview)
    node _dev/serve.js "${2:-5500}"
    ;;

  deploy)
    bash _dev/deploy.sh "${2:-update}"
    ;;

  images)
    node _dev/optimize-images.js
    ;;

  *)
    cat <<'EOF'
site — posting workflow for christunatran.github.io

  site blog "post title"                    scaffold a blog post (and open it)
  site work "title" "subtitle" "2026.04"    scaffold a works post (and open it)
  site preview                              local server at http://localhost:5500
  site deploy "commit message"              optimize images + regenerate + push
  site images                               shrink oversized images now

full details: _dev/post_instructions.md
EOF
    ;;
esac
