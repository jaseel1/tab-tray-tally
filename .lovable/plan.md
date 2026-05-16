## Goal

Today, "Order Editing Settings" (Off / Unlimited / Time Limited + minutes) is a single global setting stored in `admin_settings` and applied to every restaurant. The Super Admin should be able to configure this **per restaurant** instead.

## Approach

Keep the global value as a **default**, and let Super Admin override it on each restaurant. The POS will use the restaurant's own setting if present, otherwise fall back to the global default.

## Database changes

Add two nullable columns on `pos_settings`:
- `order_edit_mode` — text, nullable (values: `off`, `unlimited`, `time_limited`)
- `order_edit_minutes` — integer, nullable

Rewrite `can_edit_order(order_id, account_id)` to:
1. Read the order's `pos_account_id`.
2. Look up `pos_settings.order_edit_mode` / `order_edit_minutes` for that account.
3. If either is NULL, fall back to the global `admin_settings.order_edit_mode` (current behavior).
4. Apply the same off / unlimited / time-window logic as today.

Add a new RPC `update_account_edit_settings(p_account_id, p_mode, p_minutes)` that upserts these columns on `pos_settings` (writes NULL to mean "use global default").

Extend `get_account_full_details` to return the two new fields on `settings`.

## UI changes

**Super Admin → Restaurant details modal (`AccountDetailsModal`)**
Add a new "Order Editing" card with:
- Radio: Use global default / Off / Unlimited / Time limited
- Minutes input when "Time limited" is selected
- Save button calling `update_account_edit_settings`

**Super Admin → existing global `AdminSettingsSection`**
Keep it, but relabel description to clarify it's the **default** used when a restaurant has not set its own value.

**POS side**
No code change required — `can_edit_order` is called the same way; the function now resolves per-account first.

## Files touched

- `supabase/migrations/<new>.sql` — schema + function changes
- `src/components/AccountDetailsModal.tsx` — new per-account Order Editing card
- `src/components/AdminSettingsSection.tsx` — copy tweak ("default for all restaurants")

## Out of scope

- Letting restaurant owners configure this themselves (only Super Admin per current rules).
- Changing the bill/order edit flow logic itself.
