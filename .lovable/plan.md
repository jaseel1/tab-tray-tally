## Goal

Allow the user to Release a table that is stuck in `billed` status (bill generated but payment never completed), so it can be returned to `free`. Today, Release only shows for `occupied` tables, leaving billed tables stranded — exactly what happened to Table 2.

## Changes

**File: `src/pages/Index.tsx`**

1. **Show the Release button for billed tables too.**
   - Update the condition at line 1076 from `activeTable.status === 'occupied'` to `(activeTable.status === 'occupied' || activeTable.status === 'billed')` (still gated by `userRole !== 'viewer'`).

2. **Update the confirm copy in `handleReleaseTable`** (line 368) so a billed-table release reads naturally, e.g. "Release {label}? The unpaid bill will be discarded." when status is `billed`, and keep the existing message for `occupied`.

3. **Keep the underlying RPC the same** — `close_table_session` already frees the table and clears `current_session_id`, which works for both `occupied` and `billed` sessions.

## Out of scope

- No DB / RPC / schema changes.
- No change to the payment flow itself (Cash/Card/UPI still auto-frees the table as it does today).
- Not restoring the cart on reopening a billed table (that was option 2/3, not selected).

## Manual verification

- Pick Table 2 (currently `billed`) → "Release table" button appears → click → confirm → toast "Table released" → Table 2 turns `free`.
- An `occupied` table still releases as before.
- Viewer role still does not see the Release button.
