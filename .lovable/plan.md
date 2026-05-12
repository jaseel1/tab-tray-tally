## Move Table Rename to Settings

### Problem
Table rename currently lives inside the billing screen as pencil icons on each `TableGrid` card. Users want this moved to the Settings tab.

### Solution
Add a "Table Names" list inside the existing **Table Management** card in Settings, and remove the rename affordance from `TableGrid`.

### Changes

1. **TableGrid.tsx** — Remove rename UI
   - Remove `onRename` and `canRename` props.
   - Remove the pencil icon button and its wrapper.
   - Keep displaying `label` (fallback to `Table N`) because other parts of the app still rely on it.

2. **Index.tsx — Settings tab** — Add inline table rename list
   - Inside the existing **Table Management** `Card` (around line 1629), below the "Save Tables" button and table count text, add a list of all current tables.
   - Each row shows:
     - Table number + current label
     - A small **Rename** button (or pencil icon) that opens the existing `RenameTableDialog`.
   - Keep reusing the existing `renameDialog` state and `handleRenameTable` function — no new backend needed.

3. **Index.tsx — Billing tab** — Clean up rename wiring
   - Remove `onRename` and `canRename` from the `<TableGrid>` usage in the billing tab (around line 1125).
   - Keep `RenameTableDialog` rendered at the bottom of the component; it will now be triggered only from Settings.

### Result
- Billing screen table cards are cleaner (no pencil icons).
- Owners can rename tables in Settings > Table Management in one consolidated place.
