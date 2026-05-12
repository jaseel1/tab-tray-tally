# Finish Pending Updates

Backend + foundational components are already done. This plan covers the remaining wiring and UI polish.

## 1. Wire Rename Table Dialog
- In `TableGrid.tsx`, add local state for `renameTarget` and render `<RenameTableDialog>` controlled by the pencil icon click.
- On success, call `rename_pos_table` RPC and refresh tables list.
- Use `label` (fallback "Table N") in: table cards, cart header, table picker dropdown, receipt, and PDF.

## 2. Popular Items Row
- New `src/components/PopularItems.tsx`.
- Compute frequency client-side from `orders` (last 30 days, top 6 by count).
- Render as a horizontal pinned chip row above category tabs on the billing screen.
- Hide when fewer than 3 distinct items exist or when `privacyMode` is on.
- Tapping a chip adds that item to the cart.

## 3. Orders Filter + Sort
- In `ReportsSection.tsx` (orders list area), add:
  - Segmented filter: All / Dine-in / Parcel / Takeaway (uses `order_type`).
  - Sort dropdown: Newest, Oldest, Highest amount, Lowest amount.
- Pure client-side filtering/sorting over loaded `orders`.

## 4. Mobile UI Polish
- New `src/components/MobileBottomNav.tsx`: fixed bottom tab bar (Menu, Tables, Orders, Reports) shown when `useIsMobile()`.
- New `src/components/MobileCartSheet.tsx`: cart becomes a slide-up Sheet with a floating "View Cart (n) — ₹total" button.
- Sticky category tabs under the search bar on mobile.
- Larger tap targets (min h-11) for menu item cards and quantity buttons.
- Full-width segmented order-type toggle on mobile.
- Hide desktop sidebar/cart panel at `< md`.

## Files
- Edit: `src/components/TableGrid.tsx`, `src/pages/Index.tsx`, `src/components/ReportsSection.tsx`, `src/components/ReceiptPreview.tsx`, `src/lib/pdf.ts`
- Create: `src/components/PopularItems.tsx`, `src/components/MobileBottomNav.tsx`, `src/components/MobileCartSheet.tsx`

## Out of Scope
- Server-side popularity aggregation (kept client-side).
- Changes to dine-in payment flow or Flutter docs (already updated).
