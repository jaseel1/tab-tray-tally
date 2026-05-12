## Table Management

Add dine-in table management with a visual table grid, per-table running orders, and table-aware billing. Super Admin controls table count (max 10).

---

## 1. Database (new migration)

**New table `pos_tables`** (per restaurant)
- `pos_account_id`, `table_number` (1-10), `label`, `status` (`free` | `occupied` | `billed`), `current_session_id` nullable, timestamps
- Unique on (`pos_account_id`, `table_number`)

**New table `pos_table_sessions`** (one open session per occupied/billed table)
- `pos_account_id`, `table_id`, `status` (`open` | `billed` | `closed`), `items` jsonb (cart snapshot: name, qty, price, total, image), `subtotal`, `tax`, `total`, `bill_number` nullable, `billed_at`, timestamps

**Extend `pos_orders`**
- Add `order_type` text default `'takeaway'` (`dine_in` | `takeaway` | `parcel`)
- Add `table_number` integer nullable
- Add `session_id` uuid nullable

**Extend `admin_settings` defaults**
- New per-account setting accessed via existing `pos_settings` row: add column `table_count` int default `0` (0 = tables disabled). Configured by Super Admin per restaurant.

**RPC functions**
- `init_tables(p_account_id, p_count)` — Super Admin: create/trim tables to match count.
- `list_tables(p_account_id)` — returns tables with current session summary (item count, total, opened_at).
- `get_table_session(p_table_id)` — full cart for a table.
- `upsert_table_session(p_table_id, p_items, p_subtotal, p_tax, p_total)` — create/update open session.
- `generate_table_bill(p_session_id, p_payment_method)` — creates `pos_orders` + `pos_order_items` from session, sets table to `billed`, stamps `bill_number`.
- `close_table_session(p_session_id)` — marks paid, frees the table.
- `update_pos_table_count(p_account_id, p_count)` — Super Admin only, validates 0-10.

All RPCs `SECURITY DEFINER` with `SET search_path = public`, returning `json {success, ...}`. Compatible with Flutter app.

---

## 2. Super Admin UI

**`AdminSettingsSection.tsx`** — already exists for global order-edit settings. Keep global section.

**`AccountDetailsModal.tsx`** — add new "Tables" section with:
- Number input "Number of tables" (0-10), Save button → calls `update_pos_table_count`.

---

## 3. POS UI (`src/pages/Index.tsx`)

**Order type selector** at top of POS screen (segmented control):
- `Dine-in` | `Takeaway` | `Parcel` (default Takeaway). Hidden if `table_count = 0` (only Takeaway/Parcel shown).

**Dine-in mode → Tables view**
- New component `TableGrid.tsx`: responsive grid (2-5 cols) of cards.
- Each card shows: table number, status badge (Free=green, Occupied=amber, Billed=blue), item count, running total, time-since-opened.
- Click a free table → opens it as the active cart context.
- Click occupied/billed table → loads its session into cart for editing or payment.

**Cart panel changes**
- Header shows current context: "Table 4" / "Takeaway" / "Parcel".
- Items added/removed auto-save to the table session (debounced) via `upsert_table_session`. Takeaway/Parcel keep current local-cart behavior.
- Bill button:
  - Dine-in: calls `generate_table_bill` → prints receipt → table flips to `Billed` (stays visible until paid).
  - A "Mark Paid" button appears on Billed tables → `close_table_session` → table back to Free.
- Order created in `pos_orders` includes `order_type`, `table_number`, `session_id`.

**Parallel tables**
- Switching between tables loads/saves independently; multiple tables can have open carts simultaneously.

---

## 4. Receipts & history

- `ReceiptPreview.tsx`: show "Table X" or "Takeaway/Parcel" line.
- Orders tab + `AccountDetailsModal` order list: show order type and table number column.

---

## 5. Realtime (optional, included)

Enable realtime on `pos_tables` and `pos_table_sessions` so multiple POS devices/viewers stay in sync.

---

## Files to add / change

- New migration: tables, sessions, RPCs, `pos_orders` columns, `pos_settings.table_count`.
- New: `src/components/TableGrid.tsx`, `src/components/TableManager.tsx` (logic hook).
- Edit: `src/pages/Index.tsx` (order type selector, table flow, cart context).
- Edit: `src/components/AccountDetailsModal.tsx` (table count setting + show table/order_type in history).
- Edit: `src/components/ReceiptPreview.tsx` (table label).
- Edit: `src/components/OrderEditDialog.tsx` (display only, no logic change).

---

## Defaults

| Setting | Default |
|---|---|
| `table_count` per restaurant | 0 (disabled) |
| Max tables | 10 |
| Default order type | Takeaway |
| Billed table auto-free | No (manual "Mark Paid") |
