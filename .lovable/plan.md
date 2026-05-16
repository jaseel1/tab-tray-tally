## Add Delete Order for Super Admin

Add the ability for Super Admins to delete any order from the Account Details modal → Orders tab. Deletion is permanent and also rolls back telemetry (total_orders, total_revenue) so reports stay accurate.

### Database

New RPC `admin_delete_order(p_account_id uuid, p_order_id uuid)`:
- Loads the order; returns failure if not found.
- Captures `total_amount`, `amount_paid`, `payment_status`, `order_type`, `session_id`.
- Deletes from `pos_order_payments`, `pos_order_items`, then `pos_orders`.
- If the order had been counted in telemetry (i.e. `payment_status = 'paid'`), decrement `pos_telemetry.total_orders` by 1 and `total_revenue` by `total_amount` (clamped at 0).
- If `order_type = 'dine_in'` and `session_id` is set: delete the related `pos_table_sessions` row and free its `pos_tables` row (`status = 'free'`, `current_session_id = NULL`) so the table is not stuck.
- Returns `{ success, message }`.

`SECURITY DEFINER`, `SET search_path = public`. No auth check inside — this RPC is only invoked from the Super Admin UI (matches how other admin RPCs in this project work).

### UI — `src/components/AccountDetailsModal.tsx`

In the Orders tab table:
- Add a red "Delete" icon button (`Trash2`) next to the existing Edit button in the Actions cell.
- On click, open an `AlertDialog` confirm: "Delete order {order_number}? This permanently removes it and adjusts revenue totals."
- On confirm, call `supabase.rpc('admin_delete_order', { p_account_id, p_order_id: order.id })`, toast result, then refetch orders + analytics + account summary so the totals update.

### Out of scope
- No POS-side delete (Flutter/owner POS unchanged).
- No soft-delete / audit log — straight delete per request.

### Files
- `supabase/migrations/<new>.sql` — `admin_delete_order` function
- `src/components/AccountDetailsModal.tsx` — Delete button + confirm dialog + refetch
