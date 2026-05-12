## Redesign Record Payment Dialog

Make the common case (single payment method) one-tap, hide split UI behind an opt-in, and show table number for dine-in bills.

### New flow

1. Header shows bill number, order type, and table label (e.g. `Bill #A12 · Dine-in · Table 5`).
2. Totals strip (Total / Paid / Due) stays at top.
3. Default view — three large method buttons in a row: **UPI**, **Cash**, **Card** (UPI first since it's most common). Tapping one auto-fills the full Due into that method and immediately shows a single confirm button **"Mark ₹X paid via UPI"**. No amount inputs visible.
4. Below the method buttons: a small text link **"Split across methods"** that toggles the split view.
5. Split view (only when toggled): the existing per-method amount inputs with "Due" buttons, running total, and **Save Payment** action. A back link returns to the simple view.
6. Cancel always visible.

### Table number

- Extend `PendingOrderInfo` with optional `order_type` and `table_label` (or `table_number`).
- Populate from `order.orderType` and `order.tableNumber` / table label at both call sites in `src/pages/Index.tsx` (Orders tab button + PostBillDialog handoff).
- Render in the dialog header subtitle.

### Files

- `src/components/RecordPaymentDialog.tsx` — redesign UI: add `mode` state (`"quick" | "split"`), default `"quick"`; render method picker → single confirm button; keep existing split UI under the toggle; show table/order-type in header.
- `src/pages/Index.tsx` — pass `order_type` and table label into both `setRecordPaymentDialog({ order: … })` calls.

### Out of scope

No schema, RPC, or reports changes. Quick mode just calls the same `record_order_payment` RPC with one entry equal to Due.
