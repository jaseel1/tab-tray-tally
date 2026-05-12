## Changes to `src/pages/Index.tsx`

### 1. Auto-free table immediately after payment
In `generateTableBill` (the function called when the user taps Cash / Card / UPI), after `generate_table_bill` succeeds, also call `close_table_session` so the table flips back to `free` in the same action. The receipt preview still opens.

```
generate_table_bill -> close_table_session -> reload tables -> setActiveTable(null) -> show receipt
```

### 2. Remove the "Mark Paid & Free Table" button
Delete the button block (lines ~1076–1080) and the now-unused `handleMarkPaid` function. Payment buttons handle freeing automatically.

### 3. Add "Release table" option for accidental selection
When a table is selected and its status is `occupied` (not yet billed), show a small ghost button next to "Change table":

- Label: **Release table**
- Behavior: confirm dialog → call `close_table_session` (discards the open session's items) → reload tables → clear cart → `setActiveTable(null)`.
- Only shown to owner (hidden for viewer/read-only).
- Hidden when status is `free` (nothing to release) or `billed` (payment already in flight — must complete payment).

### 4. Toast copy updates
- After payment success: "Payment received — {Table N} is now free."
- After release: "{Table N} released."

## Files
- `src/pages/Index.tsx` only. No DB / RPC / migration changes (existing `close_table_session` RPC already does the work).
