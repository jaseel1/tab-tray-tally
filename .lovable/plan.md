## Goal

Six focused improvements: custom table names, privacy-aware home, in-line category creation, popular-items section, order filtering, and mobile UX polish.

---

### 1. Custom name per table (cart + bill)

The `pos_tables.label` column already exists. Currently it's auto-set to `"Table 1"`.

- Add an "Edit name" pencil icon on each table card in the dine-in grid.
- Tap → small dialog → input → saves via a new RPC `rename_pos_table(p_account_id, p_table_id, p_label)`.
- Use the custom label everywhere: cart header (replace "Table N"), receipt/bill print, table grid, table picker.
- Fall back to `"Table N"` when label is empty.

Schema: no change (column exists). Adds 1 RPC.

### 2. Hide "Top Selling Items" when privacy mode is ON

In `src/pages/Index.tsx` around line 975, wrap the Top Selling Items card in `{!privacyMode && ( ... )}`. Single conditional render, no other logic.

### 3. Add category inline while creating/editing a menu item

In `MenuManager.tsx` item form:
- Replace the category Select with a Combobox-style control: existing categories list + a "+ Add new category" row at the bottom.
- Selecting "+ Add new category" opens a small inline input → on confirm, the new category is appended to the local categories list and selected.
- The category is persisted alongside the menu item save (existing `upsert_categories` flow already syncs from menu items, plus we'll explicitly call `upsert_categories` with the merged list on save so it appears in the billing screen's category tabs immediately).

### 4. "Popular items" section auto-populated from sales

- Compute on the client from already-loaded `orders` state (no new RPC) — count item frequency from the last 30 days, take top 6.
- Render as a horizontal scroll row labeled "Popular" pinned at the top of the menu list (above category tabs) on the billing screen.
- Hidden when there's no sales history yet (first-run) or fewer than 3 distinct items.
- Tapping a popular chip adds the item to cart, same as a normal menu tile.

### 5. Sort/filter for Orders list

Orders section currently shows a flat list. Add:
- A segmented filter at the top: **All · Dine-in · Parcel · Takeaway**
- A sort dropdown: **Newest · Oldest · Highest amount · Lowest amount**
- Both purely client-side over the already-loaded `orders` array — no backend change.

### 6. Mobile UI polish

Targeted, low-risk changes for ≤414px width:

- **Bottom-nav for primary tabs** (Billing / Orders / Menu / Tables / Settings) instead of the cramped top tab bar on mobile; keep top tabs on desktop.
- **Cart as a slide-up sheet** on mobile (it's currently a side panel that pushes layout). Floating "View cart (3) ₹240" button at the bottom → tap opens full-height sheet.
- **Larger tap targets** on menu tiles and table cards (min-height 64px, 16px gaps).
- **Sticky category tabs** with horizontal scroll on mobile.
- **Order-type toggle** (Dine-in / Parcel) becomes full-width segmented control on mobile.
- Use existing `useIsMobile()` hook; no new deps.

---

## Files touched

- `src/pages/Index.tsx` — privacy hide, popular items, order filters, mobile layout shell, custom-label usage in cart header.
- `src/components/MenuManager.tsx` — inline "Add category" in item form.
- `src/components/TableGrid.tsx` — pencil icon + rename dialog, show custom label.
- `src/components/ReceiptPreview.tsx` — print custom label.
- New: `src/components/RenameTableDialog.tsx`, `src/components/PopularItems.tsx`, `src/components/MobileBottomNav.tsx`, `src/components/MobileCartSheet.tsx`.

## Backend

One migration only: new RPC `rename_pos_table(p_account_id uuid, p_table_id uuid, p_label text)` that updates `pos_tables.label`. No table changes.

Will also update the Flutter API docs page (`/flutter-docs`) to include the new `rename_pos_table` RPC.

## Out of scope

- Server-side popular-items aggregation (keeping it client-side keeps it fast and avoids a DB roundtrip).
- Drag-to-reorder for tables.
- Changes to dine-in payment / billing flow.
