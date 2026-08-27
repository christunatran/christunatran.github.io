#!/usr/bin/env bash
set -euo pipefail

MESSAGE="${1:-update}"

cd "$(dirname "$0")/.."

node _dev/optimize-images.js
node _dev/generate-blog-json.js
node _dev/bump-cache.js

git add -A
git commit -m "$MESSAGE"
git push
