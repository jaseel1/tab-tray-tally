## Group Billing Menu Items by Category

### Problem
On the billing screen, menu items render as a single flat 2-column grid. Users want them grouped by category for easier ordering.

### Solution
Group `filteredItems` by `category` and render each category as its own labeled section. Add a sticky category chip bar above the grid for quick scrolling.

### Changes (src/pages/Index.tsx)

1. **Compute grouped items** near the existing `filteredItems` (line 825):
   - Build `itemsByCategory: Record<string, MenuItem[]>` from `filteredItems`.
   - Order keys using the existing `categories` array (canonical order); append any unknown categories alphabetically at the end.

2. **Add a category chip bar** in the existing sticky header (around line 1143, alongside Search + PopularItems):
   - Horizontal scroll row of chips: "All" + each category that has items.
   - State: `activeCategory: string | 'all'`. Tapping a chip scrolls to that section (`scrollIntoView`) and visually highlights it.
   - Hidden when there are 0 or 1 categories with items.

3. **Replace the flat grid** (lines 1178–1207) with sections:
   - For each category in order, render:
     - `<h3>` heading with category name + item count, `id={`cat-${slug}`}` for scroll targets.
     - The existing 2-column card grid for that category's items.
   - Keep the empty-state and "no matches" states unchanged.

4. **Search interaction**: when `searchTerm` is set, still group results by category but auto-collapse empty categories (already handled since we only render categories with items).

### Out of Scope
- No backend changes (categories already exist in `pos_categories`).
- No changes to MenuManager, cart, popular items, or order flow.
- No drag-to-reorder of categories.
