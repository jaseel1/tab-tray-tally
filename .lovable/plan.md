## Fix "Failed to fetch order details" in Super Admin → Orders

### Root cause
`get_account_orders` RPC returns Postgres error `42803: column "o.created_at" must appear in the GROUP BY clause`. The query mixes an outer `ORDER BY o.created_at DESC LIMIT/OFFSET` on the same SELECT that aggregates with `json_agg(... ORDER BY o.created_at DESC)` — invalid without a GROUP BY. This breaks the Orders tab for every account, not just Pravasi Bakery.

### Fix
Rewrite `public.get_account_orders(p_account_id, p_limit, p_offset)` via migration:

- Select the page of orders in a subquery (with `ORDER BY created_at DESC LIMIT/OFFSET`), then `json_agg` the result.
- Preserve ordering inside `json_agg` using `ORDER BY sub.created_at DESC`.
- Keep `SECURITY DEFINER`, set `search_path = public`.
- Return the same `{ success, data: { orders, total_count, limit, offset } }` shape so the UI is unchanged.

No UI changes.

### Files
- `supabase/migrations/<new>.sql` — `CREATE OR REPLACE FUNCTION public.get_account_orders(...)`
