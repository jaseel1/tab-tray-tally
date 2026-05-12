## Highlight pending payments + swap Reports/Orders tabs

### 1. Pending payment in red

In `src/pages/Index.tsx` order list rendering (around line 1521–1545):

- Treat both `pending` and `partial` as "payment outstanding" → render in red (destructive).
- `psStyle` (status pill): change non-paid branches to `bg-destructive text-destructive-foreground` (drop the warning/info split).
- `cardClass`: change unpaid border to `border-l-destructive` (was `border-l-warning`), and add a subtle `bg-destructive/5` tint so the whole card reads red at a glance.
- Pending count badge in the filter button (line 1463) gets `text-destructive` when count > 0.
- "Record Payment" action button keeps green (positive action) — only the status indicators turn red.

### 2. Swap Reports and Orders in the top menu

In `src/pages/Index.tsx` `TabsList` (lines 958–983), reorder triggers so the sequence becomes: Home, Bill, **Orders**, Menu, **Reports**, Settings (Orders moves to slot 3, Reports moves to slot 5). No changes to `TabsContent` blocks or routing — only the trigger order changes.

### Files

- `src/pages/Index.tsx` — only.

### Out of scope

No schema, no other tabs' content, no Reports component changes.
