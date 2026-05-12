## Finish Bill-First, Pay-Later Flow

Wrap up the remaining wiring from the previous step.

### 1. Mount RecordPaymentDialog in Index.tsx
- Add state: `paymentDialogOrder` (Order | null).
- Wire the existing "Record Payment" button on pending order cards to set this state.
- Render `<RecordPaymentDialog open={...} order={paymentDialogOrder} onClose={...} onPaid={refreshOrders} />` near the other dialogs.
- On success: refetch orders (so status flips to paid/partial), refetch tables (dine-in auto-free), show toast.

### 2. Receipt updates (ReceiptPreview.tsx + lib/pdf.ts)
- If `payment_status !== 'paid'`: render a bold "PAYMENT PENDING" stamp/line in place of the payment-method line, plus "Amount Due: ₹X".
- If `partial`: show "Paid: ₹X / Due: ₹Y" plus a small breakdown of recorded payments (Cash ₹.., UPI ₹..).
- If `paid` with multiple payments: list each method/amount instead of a single "Paid via Cash".
- Keep single-method paid receipts visually identical to today.

### 3. Reports payment split chart
- Update `ReportsSection.tsx` to source the pie chart from `pos_order_payments` (sum amount grouped by method) instead of `pos_orders.payment_method`.
- This naturally handles split payments and ignores pending bills (no payment rows yet).
- Keep the same date-range filter; just swap the query/aggregation.

### 4. Verification
- Generate a bill (parcel) → appears under Pending with badge → Record Payment (split Cash + UPI) → flips to Paid, receipt shows breakdown.
- Dine-in: Generate Bill keeps table occupied/billed → Record Payment frees table.
- Reports pie reflects split methods correctly.

### Out of scope
- Refunds, editing recorded payments, customer-facing payment QR.
