## Fix Bill Flow + Restore Popular Items

### 1. Generate Bill → auto-print → Record Payment / Skip

Today, clicking **Generate Bill** opens the `ReceiptPreview` dialog and the user has to click "Print" inside it. Change the flow to:

1. Click **Generate Bill** (or **Generate Bill** on a dine-in table).
2. Order is created server-side with `payment_status = 'pending'` (unchanged).
3. The receipt prints **immediately** (no preview dialog).
   - Reuse `ReceiptPreview`'s print logic by extracting it into a small helper `printReceipt(order, settings)` in `src/lib/print.ts` (renders the receipt into a hidden DOM node, calls `window.print()`, cleans up). Keep `ReceiptPreview` working for the Orders tab "View receipt" use case.
4. Right after `window.print()` returns, open a new lightweight **`PostBillDialog`** with two buttons:
   - **Record Payment** → opens existing `RecordPaymentDialog` for that order.
   - **Skip** → just closes; bill stays under Orders › Pending.
   - Secondary link: **Reprint** (calls `printReceipt` again).
5. Dine-in branch: same — `generateTableBill` prints the consolidated bill, then shows `PostBillDialog`. Table stays "billed/occupied" until payment is recorded (already implemented).

Files:
- `src/lib/print.ts` (new) — extract printing helper.
- `src/components/PostBillDialog.tsx` (new) — small modal with Record Payment / Skip / Reprint.
- `src/pages/Index.tsx` — replace `setReceiptPreview({ isOpen: true, order })` in `generateBill` and `generateTableBill` with `printReceipt(...)` + `setPostBillOrder(order)`. Mount `<PostBillDialog>` and wire its Record Payment button to the existing `recordPaymentDialog` state.
- `src/components/ReceiptPreview.tsx` — keep as-is for Orders tab; refactor its `handlePrint` to call the shared helper.

Update the helper text under the cart from "Customer pays later — record payment from Orders › Pending." to something matching the new flow, e.g. "Bill prints automatically. Record payment now or later from Orders."

### 2. Popular items missing

`PopularItems` is mounted (Index.tsx ~1181) but hides itself when fewer than 3 distinct items exist in the last 30 days, when `searchTerm` is set, or when `privacyMode` is on.

Plan:
- Quickly verify in the running session by logging `top.length` once; if it's `< 3`, lower the threshold to **≥ 1** so even a single popular item shows (current `< 3` cutoff is too strict for new accounts and effectively hides the row).
- Keep the 30-day window and `privacyMode`/`searchTerm` hide rules.
- No DB or RPC changes; pending orders already flow into `orders` state so they count toward popularity immediately.

File: `src/components/PopularItems.tsx` — change `if (... top.length < 3) return null;` to `if (... top.length < 1) return null;` and slice top 6 unchanged.

### 3. Out of scope

- No changes to RPCs, schema, or reports.
- No change to the existing `RecordPaymentDialog` UI.
- "Print preview" stays available from the Orders tab (View receipt).

### Verification

- Parcel: add items → Generate Bill → browser print dialog opens → cancel/print → PostBillDialog appears → Skip leaves order under Pending; Record Payment opens split dialog and flips order to Paid.
- Dine-in: Generate Bill prints, table remains occupied/billed, PostBillDialog appears.
- Popular items strip shows after 1+ ordered item from the last 30 days, hides under search/privacy mode.
