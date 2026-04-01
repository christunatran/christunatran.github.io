# how the home page grid works

## overview

All items on the home page — works, blog posts, and static images — are combined into one flat list, sorted newest-first by date, then distributed into two columns.

## step 1: collecting items

Three sources are fetched in parallel:
- `/data/works.json` — work projects
- `/data/blog.json` — blog posts (disabled posts are excluded)
- `STATIC_IMAGES` — hardcoded images in `js/home.js`

## step 2: sorting

All items are sorted newest-first using their `date` field (format: `YYYY.MM.DD` or `YYYY.MM` or `YYYY`). Dates are normalized before comparison so shorter formats sort correctly.

## step 3: column distribution

Items are placed into two flex columns using a **shortest-column-first** algorithm:

- Each card is appended to whichever column is currently shorter
- Ties go to the left column
- This keeps both columns roughly balanced in height

So the first card always goes left, second right, and from there it follows column height rather than strict alternation.

## what this means for reading order

The **first two cards are always newest-left, second-newest-right**. Beyond that, reading order depends on card heights — a tall image can cause the next few cards to stack in the opposite column until heights equalize.

Example with a tall card at position 1:
```
1 (tall)  |  2
          |  3
4         |  5
```

It is not a strict grid. Chronological order is approximate, not guaranteed row-by-row.

## why this approach

| approach | chronological order | no bottom gap | hover expands without overlap |
|---|---|---|---|
| absolute JS masonry (original) | ✗ shortest-col | ✗ fixed positions | ✗ cards overlap |
| CSS grid | ✓ strict | ✗ row height gaps | ✓ |
| strict alternating flex cols | ✓ strict | ✗ unequal col heights | ✓ |
| **shortest-col flex (current)** | **~approximate** | **✓** | **✓** |

The current approach was chosen because balanced columns and clean hover expansion were higher priority than strict row-by-row reading order.

## where to change things

- **Column gap / spacing**: `.posts-col` gap in `css/style.css`
- **Number of columns**: number of `posts-col` divs created in `js/home.js` `buildGrid()`
- **Adding a new static image**: add to `STATIC_IMAGES` array in `js/home.js`
- **Date format**: `normalizeDate()` in `js/home.js`
