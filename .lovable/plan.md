## Goal
Keep only **Dine-in (Tables)** and **Parcel** as order types. Let the restaurant owner set the number of tables from the POS Settings tab. Fix the confusing "no items" experience on the billing screen.

---

## 1. Remove Takeaway

**`src/pages/Index.tsx`**
- Remove the **Takeaway** button from the order-type segmented control on the Bill screen.
- Narrow `orderType` state to `'dine_in' | 'parcel'`.
- Default `orderType`:
  - `dine_in` when `tableCount > 0`
  - `parcel` when `tableCount === 0`
- After completing an order, reset to the same default (no more `setOrderType('takeaway')`).
- Order creation still sends the literal `order_type` to the DB; legacy `takeaway` rows in history remain readable.

**Labels**
- Receipt and order history show **"Dine-in · Table N"** or **"Parcel"**. Unknown legacy values fall back to capitalized text (so old "takeaway" orders still display).

No DB migration needed — `create_order` already accepts any `p_order_type` string.

---

## 2. Owner-managed table count in POS Settings

**`src/pages/Index.tsx` — Settings tab**
- Add a new **"Table Management"** card (owner only, hidden for viewer):
  - Number input **"Number of tables (0–10)"**
  - **Save** button → calls existing `update_pos_table_count(p_account_id, p_count)` RPC
  - Helper text: *"Set 0 to disable dine-in. Maximum 10 tables."*
- Local `tableCount` state already exists; load initial value from `get_pos_settings` (`table_count` column) on login.
- After save: re-run `loadTables()` and re-apply default `orderType` rule.

The Super Admin control in `AccountDetailsModal.tsx` stays as-is — both places can edit it.

---

## 3. Fix "no items found" on billing screen

- Remove the noisy toast that pops on every login when menu is empty.
- Replace with an **inline empty state** in the items grid:
  - If `menuItems.length === 0`: *"No menu items yet."* + button **"Go to Menu"** (switches to Menu tab).
  - If Dine-in selected but no `activeTable`: *"Select a table to start ordering."* placeholder where the items grid would be.
- Quick verification during build: confirm `list_menu_items` returns the rows the user has in DB for the logged-in `account_id`. If it returns rows but UI still shows empty, log the response and inspect (likely a stale `account_id` after re-login).

---

## 4. Files to change

- `src/pages/Index.tsx` — order type buttons & defaults, Settings "Table Management" card, billing-screen empty states, label updates.
- `src/components/ReceiptPreview.tsx` — confirm/adjust order-type label rendering.

No database migrations required.

---

## Defaults

| Setting | Default |
|---|---|
| Order types available | Dine-in (if tables > 0), Parcel |
| Default `orderType` | Dine-in when tables > 0, else Parcel |
| Owner table count input | 0–10, default 0 |
