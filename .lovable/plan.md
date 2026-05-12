## Plan

1. **Stop empty-cart auto-save from reopening released tables**
   - Update the dine-in auto-save guard so it does not call `upsert_table_session` when the active table has no cart items.
   - This prevents `setCart([])` after Release from creating/updating a session again.

2. **Clear selected table before clearing cart during release**
   - Keep the release flow as: close session → clear active table → clear cart → reload tables.
   - Ensure the debounced save effect sees no active table and cannot re-save stale state.

3. **Make table refresh safe after release/payment**
   - Adjust table reload behavior so it does not re-select a table that has just been cleared by the user action.
   - Payment should still free the table and show receipt as already implemented.

## Technical notes

- The current issue is caused by the auto-save effect watching `cart` and `activeTable`; after Release, `setCart([])` can still trigger a debounced `persistTableCart(activeTable.id, [])`, and the backend RPC marks the table `occupied` again.
- Only `src/pages/Index.tsx` needs changes.
- No database changes are required.