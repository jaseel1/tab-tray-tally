# API Reference

This document details all backend API functions available in the Restaurant POS System.

## 🔑 API Credentials

**Supabase URL**: `https://hrogkcqnpjqnjstxdaxo.supabase.co`  
**Supabase Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb2drY3FucGpxbmpzdHhkYXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTIyNDEsImV4cCI6MjA3MjcyODI0MX0.NJ6Ib0e-nqtU8CFgZRWaTilvQqvFxLP0rc70lqdZuf0`

**📱 For Flutter Developers**: See [`docs/mobile/FLUTTER_DEVELOPER_GUIDE.md`](../mobile/FLUTTER_DEVELOPER_GUIDE.md) for complete integration guide.

## Overview

The system uses Supabase RPC (Remote Procedure Call) functions for backend operations. All functions are called via the Supabase client and return JSON responses.

**Important**: All RPC function parameters use the `p_` prefix (e.g., `p_account_id`, `p_mobile_number`).

## Authentication Functions

### pos_login(account_name, password)
Authenticates POS user accounts.

**Parameters:**
- `account_name` (string): POS account username
- `password` (string): Plain text password

**Returns:**
```json
{
  "success": boolean,
  "account_name": string,
  "message": string
}
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('pos_login', {
  account_name: 'cashier01',
  password: 'userpassword'
});
```

**Response Examples:**
```json
// Success
{
  "success": true,
  "account_name": "cashier01",
  "message": "Login successful"
}

// Failure
{
  "success": false,
  "account_name": null,
  "message": "Invalid credentials"
}
```

### admin_login(username, password)
Authenticates administrator accounts.

**Parameters:**
- `username` (string): Admin username
- `password` (string): Plain text password

**Returns:**
```json
{
  "success": boolean,
  "username": string,
  "role": string,
  "message": string
}
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('admin_login', {
  username: 'admin',
  password: 'adminpassword'
});
```

**Response Examples:**
```json
// Success
{
  "success": true,
  "username": "admin",
  "role": "admin",
  "message": "Login successful"
}

// Super Admin Success
{
  "success": true,
  "username": "superadmin",
  "role": "super_admin",
  "message": "Login successful"
}
```

## Data Management Functions

### load_pos_data()
Loads all POS-related data including menu items, settings, and categories.

**Parameters:** None

**Returns:**
```json
{
  "menu_items": Array<MenuItem>,
  "settings": RestaurantSettings,
  "categories": Array<string>
}
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('load_pos_data');
```

**Response Example:**
```json
{
  "menu_items": [
    {
      "id": "uuid-1",
      "name": "Margherita Pizza",
      "price": 12.99,
      "category": "Pizza",
      "image_url": "https://example.com/pizza.jpg",
      "is_available": true
    }
  ],
  "settings": {
    "restaurant_name": "My Restaurant",
    "address": "123 Main St",
    "phone": "+1234567890",
    "gst_rate": 18.00,
    "currency_symbol": "₹"
  },
  "categories": ["Pizza", "Burgers", "Drinks"]
}
```

### save_menu(menu_items)
Saves menu items to the database.

**Parameters:**
- `menu_items` (Array): Array of menu item objects

**MenuItem Interface:**
```typescript
interface MenuItem {
  id?: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  is_available?: boolean;
}
```

**Returns:**
```json
{
  "success": boolean,
  "message": string,
  "count": number
}
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('save_menu', {
  menu_items: [
    {
      name: "New Pizza",
      price: 15.99,
      category: "Pizza",
      image: "base64-image-data"
    }
  ]
});
```

### save_settings(settings)
Saves restaurant settings and configuration.

**Parameters:**
- `settings` (Object): Restaurant settings object

**Settings Interface:**
```typescript
interface RestaurantSettings {
  restaurant_name: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_rate: number;
  currency_symbol: string;
  receipt_footer?: string;
  theme_color?: string;
}
```

**Returns:**
```json
{
  "success": boolean,
  "message": string
}
```

## Order Management Functions

### create_order(order_data)
Creates a new order with items.

**Parameters:**
- `order_data` (Object): Complete order information

**Order Data Interface:**
```typescript
interface OrderData {
  items: Array<{
    menu_item_id?: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  payment_method?: string;
  notes?: string;
}
```

**Returns:**
```json
{
  "success": boolean,
  "order_id": string,
  "order_number": string,
  "message": string
}
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('create_order', {
  order_data: {
    items: [
      {
        menu_item_id: "uuid-1",
        name: "Margherita Pizza",
        price: 12.99,
        quantity: 2
      }
    ],
    subtotal: 25.98,
    gst_amount: 4.68,
    total_amount: 30.66,
    customer_name: "John Doe",
    payment_method: "cash"
  }
});
```

### get_orders(date_range?, limit?)
Retrieves orders with optional filtering.

**Parameters:**
- `date_range` (Object, optional): Date filtering
- `limit` (number, optional): Maximum number of orders to return

**Date Range Interface:**
```typescript
interface DateRange {
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
}
```

**Returns:**
```json
{
  "orders": Array<Order>,
  "total_count": number
}
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('get_orders', {
  date_range: {
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  },
  limit: 100
});
```

## Analytics Functions

### get_daily_analytics(date)
Gets analytics data for a specific date.

**Parameters:**
- `date` (string): Date in YYYY-MM-DD format

**Returns:**
```json
{
  "total_sales": number,
  "order_count": number,
  "average_order_value": number,
  "top_items": Array<{
    "item_name": string,
    "quantity_sold": number,
    "revenue": number
  }>,
  "hourly_sales": Array<{
    "hour": number,
    "sales": number,
    "orders": number
  }>
}
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('get_daily_analytics', {
  date: '2024-01-15'
});
```

### get_monthly_analytics(year, month)
Gets analytics data for a specific month.

**Parameters:**
- `year` (number): Year (e.g., 2024)
- `month` (number): Month (1-12)

**Returns:**
```json
{
  "total_sales": number,
  "order_count": number,
  "daily_breakdown": Array<{
    "date": string,
    "sales": number,
    "orders": number
  }>,
  "category_performance": Array<{
    "category": string,
    "sales": number,
    "percentage": number
  }>
}
```

### get_item_analytics(menu_item_id, date_range)
Gets detailed analytics for a specific menu item.

**Parameters:**
- `menu_item_id` (string): UUID of the menu item
- `date_range` (Object): Date range for analysis

**Returns:**
```json
{
  "total_quantity_sold": number,
  "total_revenue": number,
  "average_daily_sales": number,
  "peak_hours": Array<number>,
  "daily_sales": Array<{
    "date": string,
    "quantity": number,
    "revenue": number
  }>
}
```

## User Management Functions

### get_pos_accounts()
Retrieves all POS accounts (Admin only).

**Parameters:** None

**Returns:**
```json
{
  "accounts": Array<{
    "id": string,
    "account_name": string,
    "created_at": string,
    "is_active": boolean,
    "last_login": string
  }>
}
```

### create_pos_account(account_data)
Creates a new POS account (Admin only).

**Parameters:**
- `account_data` (Object): Account information

**Account Data Interface:**
```typescript
interface AccountData {
  account_name: string;
  password: string;
  is_active?: boolean;
}
```

**Returns:**
```json
{
  "success": boolean,
  "account_id": string,
  "message": string
}
```

### update_pos_account(account_id, updates)
Updates an existing POS account (Admin only).

**Parameters:**
- `account_id` (string): UUID of the account
- `updates` (Object): Fields to update

**Returns:**
```json
{
  "success": boolean,
  "message": string
}
```

### delete_pos_account(account_id)
Deactivates a POS account (Admin only).

**Parameters:**
- `account_id` (string): UUID of the account

**Returns:**
```json
{
  "success": boolean,
  "message": string
}
```

## Utility Functions

### backup_data()
Creates a backup of all system data (Super Admin only).

**Parameters:** None

**Returns:**
```json
{
  "success": boolean,
  "backup_id": string,
  "timestamp": string,
  "size_mb": number
}
```

### validate_menu_item(item_data)
Validates menu item data before saving.

**Parameters:**
- `item_data` (Object): Menu item to validate

**Returns:**
```json
{
  "valid": boolean,
  "errors": Array<string>
}
```

### log_telemetry(event_data)
Logs usage and performance data.

**Parameters:**
- `event_data` (Object): Event information

**Event Data Interface:**
```typescript
interface EventData {
  event_type: string;
  user_id?: string;
  session_id?: string;
  data?: Object;
}
```

**Returns:**
```json
{
  "success": boolean,
  "event_id": string
}
```

## Error Handling

All RPC functions follow a consistent error handling pattern:

### Standard Error Response
```json
{
  "error": {
    "code": string,
    "message": string,
    "details": Object
  }
}
```

### Common Error Codes
- `AUTH_FAILED`: Authentication failure
- `INVALID_INPUT`: Invalid parameters
- `PERMISSION_DENIED`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Data conflict (duplicate entry)
- `SERVER_ERROR`: Internal server error

### Example Error Handling
```typescript
const { data, error } = await supabase.rpc('pos_login', {
  account_name: 'invalid',
  password: 'wrong'
});

if (error) {
  console.error('RPC Error:', error);
  // Handle error based on error.code
} else if (!data.success) {
  console.error('Login failed:', data.message);
  // Handle business logic error
}
```

## Rate Limiting

API calls are subject to rate limiting:
- **Authentication calls**: 10 per minute per IP
- **Data queries**: 100 per minute per user
- **Data modifications**: 50 per minute per user
- **Analytics queries**: 20 per minute per user

## Best Practices

### 1. Error Handling
Always check both `error` and `data.success` fields:
```typescript
const { data, error } = await supabase.rpc('function_name', params);
if (error) {
  // Handle RPC/network errors
} else if (!data.success) {
  // Handle business logic errors
}
```

### 2. Data Validation
Validate data on the client before sending:
```typescript
if (!itemName || price <= 0) {
  throw new Error('Invalid item data');
}
```

### 3. Retry Logic
Implement retry logic for transient failures:
```typescript
const maxRetries = 3;
let attempt = 0;
while (attempt < maxRetries) {
  try {
    const result = await supabase.rpc('function_name', params);
    break;
  } catch (error) {
    attempt++;
    if (attempt === maxRetries) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
  }
}
```

### 4. Batch Operations
Use batch operations when possible:
```typescript
// Instead of multiple calls
items.forEach(item => supabase.rpc('save_item', item));

// Use batch operation
supabase.rpc('save_menu', { menu_items: items });
```

---
*All API functions are secured with Row Level Security (RLS) and require appropriate authentication.*