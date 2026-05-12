## Highlight Orders tab when payments are pending

In `src/pages/Index.tsx` `TabsList` (around lines 967–970), make the Orders tab visually flag pending payments:

- Compute `pendingCount = orders.filter(o => o.paymentStatus !== 'paid').length`.
- When `pendingCount > 0`, render the Orders trigger's `ClipboardList` icon and "Orders" label in `text-destructive`, and overlay a small red dot badge (`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive`) on the icon. Add `relative` to the trigger so the badge positions correctly.
- Active-tab styling (`data-[state=active]`) still wins for selected state; the red treatment only applies when not active or shown subtly behind the active background.

### Files

- `src/pages/Index.tsx` — only the Orders `TabsTrigger`.

### Out of scope

No changes to other tabs, counts inside the Orders screen, or the badge in the filter row (already done).
