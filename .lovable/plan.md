## Bill-First, Pay-Later Workflow with Split Payments

### New flow
1. Cashier adds items → taps **Generate Bill** (single button, no payment yet).
2. Order is created with `payment_status = 'pending'`. Receipt prints/previews immediately for the customer.
3. Bill appears in **Orders → Pending** filter with a count badge.
4. When customer pays, cashier opens the bill and taps **Record Payment** → dialog supports one or multiple methods (Cash + UPI + Card) totaling up to the bill amount.
5. When `amount_paid >= total`, status flips to `paid`; for dine-in the table is auto-freed.

### Database changes (one migration)

Modify `pos_orders`:
- Add `payment_status text NOT NULL DEFAULT 'pending'` (`'pending' | 'partial' | 'paid'`).
- Make `payment_method` nullable (kept for backward compat / Flutter; stores summary like `cash`, `upi`, `card`, or `split`).
- Add `amount_paid numeric NOT NULL DEFAULT 0`.

New table `pos_order_payments`:
- `order_id uuid`, `pos_account_id uuid`, `method text` (cash/upi/card), `amount numeric`, `created_at timestamptz`.
- RLS mirrors `pos_order_items`.

New / updated RPCs (all keep existing param names so Flutter app still compiles):
- `create_order(...)`: if `p_payment_method` is null/empty → create as `pending` with `amount_paid = 0`, **do not** call `update_pos_telemetry` yet. If a method is passed (legacy/Flutter), create as `paid` with one payment row recorded for full amount (preserves current Flutter behavior).
- `generate_table_bill(...)`: now creates a `pending` order, marks table `billed`, but does **not** free the table or update telemetry until payment is recorded.
- New `record_order_payment(p_account_id uuid, p_order_id uuid, p_payments jsonb)`:
  - `p_payments` is array of `{method, amount}`.
  - Inserts payment rows, recomputes `amount_paid`; sets `payment_status = 'paid'` if covered, else `'partial'`.
  - On transition to paid: update `payment_method` summary (single method name or `'split'`), call `update_pos_telemetry`, and if order is `dine_in` close the related session and free the table.
- `get_orders(...)`: also return `payment_status`, `amount_paid`, and `payments` array.

### Frontend changes

**`src/pages/Index.tsx` — Billing tab**
- Replace the 3 payment buttons (Cash/UPI/Card) with a single full-width primary **Generate Bill** button.
- Existing `processOrder` becomes `generateBill`: calls `create_order` with no payment method (or `generate_table_bill` for dine-in), opens receipt preview, clears cart, refreshes orders.
- Receipt preview: when `payment_status !== 'paid'`, show a "PAYMENT PENDING" stamp instead of a payment-method line.

**`src/pages/Index.tsx` — Orders tab**
- Add status filter chips at top: **Pending (n)** | All | Paid. Default to Pending. Pending count badge also shown on the Orders tab trigger.
- Pending order cards highlight with a colored left border + amber badge "Pending ₹X / ₹Y".
- "Record Payment" button on each pending/partial card → opens new `RecordPaymentDialog`.

**New `src/components/RecordPaymentDialog.tsx`**
- Shows bill total, already-paid, remaining.
- Three input rows (Cash / UPI / Card) with quick-fill buttons (e.g. "Remaining" auto-fills the outstanding amount into a method).
- Validates totals; on Save calls `record_order_payment`. Toast on success, refresh orders.

**`src/lib/pdf.ts` & `ReceiptPreview.tsx`**
- Render payments breakdown when present (e.g. "Paid: Cash ₹50 + UPI ₹70"), or "PAYMENT PENDING" when nothing recorded.

### Reports impact
- `ReportsSection.tsx` payment split keeps working: derive splits from `payments` array when present, else fall back to `payment_method`. Pending bills excluded from revenue charts (or shown in a separate "Outstanding" KPI tile — out of scope unless requested).

### Out of scope
- Refunds / payment deletion (admin-only future work).
- Editing payments after marked paid (handled by existing time-window edit dialog separately).
- Customer-facing payment QR.

### Migration safety
- Existing orders backfill: `UPDATE pos_orders SET payment_status='paid', amount_paid = total_amount WHERE payment_method IS NOT NULL;` so legacy data shows up correctly.
- Insert one `pos_order_payments` row per legacy order using the existing `payment_method` so reports keep their splits.
