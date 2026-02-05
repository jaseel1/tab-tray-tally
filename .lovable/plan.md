

# Fix: Orders Menu Not Showing in Super Admin

## Problem Identified

The "Orders" tab in the Super Admin dashboard is failing with error "Failed to fetch data" due to a **SQL syntax error** in the `get_account_orders` database function.

### Root Cause

The PostgreSQL function `get_account_orders` has an invalid SQL query. When using `json_agg()` (an aggregate function), all non-aggregated columns must appear in a GROUP BY clause. The current query incorrectly combines an aggregate with an outer ORDER BY clause.

**Broken query structure:**
```text
SELECT json_agg(...) ORDER BY o.created_at DESC   <-- ORDER BY inside aggregate
FROM pos_orders o
ORDER BY o.created_at DESC                        <-- This causes the error!
LIMIT p_limit OFFSET p_offset
```

## Solution

Fix the `get_account_orders` function by using a subquery pattern (similar to the working `get_orders` function). This ensures proper ordering while maintaining aggregate function compatibility.

**Fixed query structure:**
```text
SELECT json_agg(order_row ORDER BY created_at DESC)
FROM (
    SELECT columns...
    FROM pos_orders
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
) order_row
```

## Technical Details

### Database Migration Required

Create a migration to replace the `get_account_orders` function:

```sql
CREATE OR REPLACE FUNCTION public.get_account_orders(
  p_account_id uuid, 
  p_limit integer DEFAULT 100, 
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orders_data json;
  total_count integer;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count
  FROM public.pos_orders o
  WHERE o.pos_account_id = p_account_id;
  
  -- Get orders with items using subquery approach
  SELECT COALESCE(json_agg(order_row ORDER BY order_row.created_at DESC), '[]'::json) 
  INTO orders_data
  FROM (
    SELECT 
      o.id,
      o.order_number,
      o.total_amount,
      o.payment_method,
      o.created_at,
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'item_name', oi.item_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        ), '[]'::json)
        FROM public.pos_order_items oi
        WHERE oi.order_id = o.id
      ) AS items
    FROM public.pos_orders o
    WHERE o.pos_account_id = p_account_id
    ORDER BY o.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) AS order_row;
  
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'orders', orders_data,
      'total_count', total_count,
      'limit', p_limit,
      'offset', p_offset
    )
  );
END;
$$;
```

### Key Changes

| Before (Broken) | After (Fixed) |
|----------------|---------------|
| Direct aggregate with outer ORDER BY | Subquery with inner ORDER BY |
| `ORDER BY o.created_at` outside aggregate | `ORDER BY order_row.created_at` inside aggregate |
| SQL error when executed | Works correctly |

## Implementation Steps

1. **Create database migration** with the fixed function
2. **No frontend changes needed** - the AccountDetailsModal.tsx code is correct

## Expected Outcome

After applying the fix:
- Orders tab will load successfully in Super Admin dashboard
- Orders will be displayed in descending date order
- All order items will be properly nested under each order

