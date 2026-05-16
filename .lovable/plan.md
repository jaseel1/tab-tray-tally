## Menu Import/Export (Super Admin)

Add CSV import/export in the Account Details modal. Import wipes the restaurant's existing menu items + categories and replaces them from the file.

### CSV format
`Category,Name,Price,Description,Image,Dietary,Popular`

### Database
Migration to add three columns on `pos_menu_items`:
- `description` text, nullable
- `dietary` text, nullable (values like `veg` / `non-veg` / `none`)
- `popular` boolean, default false

New RPC `replace_account_menu(p_account_id uuid, p_items jsonb)`:
- Deletes all rows in `pos_menu_items` and `pos_categories` for that account
- Inserts categories from distinct `category` values
- Inserts each item (name, price, category, image, description, dietary, popular)
- Returns `{ success, inserted_count }`

Export uses the existing `list_menu_items` RPC (will include the new columns automatically).

### UI — `AccountDetailsModal.tsx`
Add a "Menu Import / Export" card with two buttons:
- **Export CSV** — fetches items, builds CSV with the header above, downloads `menu_export_<account>_<date>.csv`
- **Import CSV** — file picker → parse CSV → show confirm dialog ("This will erase the current menu and replace it with N items") → call `replace_account_menu` → toast result

Client-side CSV parse handles quoted fields, commas inside quotes, and `true/false` booleans. Skip blank rows. Validate that Name and Price exist; surface row-level errors in toast.

### Out of scope
- No changes to POS-side menu UI or Flutter app (new columns are nullable, backward compatible).
- No bulk image upload — image column stays a URL string.

### Files
- `supabase/migrations/<new>.sql` — add columns + `replace_account_menu` RPC
- `src/components/AccountDetailsModal.tsx` — add import/export card + CSV helpers (or extract to `src/lib/menu-csv.ts`)
