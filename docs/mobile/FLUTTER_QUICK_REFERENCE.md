# Flutter Quick Reference - Restaurant POS System

## 🔑 API Credentials

```dart
const SUPABASE_URL = 'https://hrogkcqnpjqnjstxdaxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb2drY3FucGpxbmpzdHhkYXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTIyNDEsImV4cCI6MjA3MjcyODI0MX0.NJ6Ib0e-nqtU8CFgZRWaTilvQqvFxLP0rc70lqdZuf0';
```

---

## 🚀 Quick Setup

```dart
// Initialize Supabase
await Supabase.initialize(url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY);
final supabase = Supabase.instance.client;
```

---

## 📝 Important Notes

⚠️ **ALL parameters use `p_` prefix**: `p_account_id`, `p_mobile_number`, `p_name`, etc.

⚠️ **JSON arrays** for `p_items`: `[{'name': 'Pizza', 'quantity': 2, 'price': 12.99, 'total': 25.98}]`

⚠️ **Response format**: All functions return `{'success': bool, 'message': string?, ...}`

---

## 🔐 Authentication

### POS Login
```dart
await supabase.rpc('pos_login', params: {
  'p_mobile_number': '+1234567890',
  'p_pin': '1234'
});
// Returns: {success, account_id, restaurant_name, license_valid_until, days_remaining}
```

### Admin Login
```dart
await supabase.rpc('admin_login', params: {
  'p_username': 'admin',
  'p_password': 'password'
});
// Returns: {success, admin_id, username}
```

---

## 🍕 Menu Functions

### List Items
```dart
await supabase.rpc('list_menu_items', params: {
  'p_account_id': accountId
});
```

### Add/Update Item
```dart
await supabase.rpc('upsert_menu_item', params: {
  'p_account_id': accountId,
  'p_name': 'Pizza',
  'p_price': 12.99,
  'p_category': 'Main',
  'p_item_id': null,  // null = new, uuid = update
  'p_image': null     // optional
});
```

### Delete Item
```dart
await supabase.rpc('delete_menu_item', params: {
  'p_account_id': accountId,
  'p_item_id': itemId
});
```

### Get Categories
```dart
await supabase.rpc('get_categories', params: {
  'p_account_id': accountId
});
// Returns: {success, data: ["Pizza", "Drinks", ...]}
```

### Update Categories
```dart
await supabase.rpc('upsert_categories', params: {
  'p_account_id': accountId,
  'p_categories': ['Pizza', 'Burgers', 'Drinks']
});
```

---

## 🛒 Order Functions

### Get Orders
```dart
await supabase.rpc('get_orders', params: {
  'p_account_id': accountId,
  'p_limit': 50  // optional, default 50
});
```

### Create Order
```dart
await supabase.rpc('create_order', params: {
  'p_account_id': accountId,
  'p_order_number': 'ORD001',
  'p_total_amount': 28.48,
  'p_payment_method': 'cash',
  'p_items': [
    {'name': 'Pizza', 'quantity': 2, 'price': 12.99, 'total': 25.98},
    {'name': 'Coke', 'quantity': 1, 'price': 2.50, 'total': 2.50}
  ]
});
// Returns: {success, order_id}
```

---

## 📊 Analytics Functions

### Item Sales
```dart
await supabase.rpc('get_item_sales', params: {
  'p_account_id': accountId,
  'p_days': 30  // optional, default 30
});
// Returns: {success, data: [{item_name, total_quantity, total_revenue, order_count}]}
```

### Account Analytics
```dart
await supabase.rpc('get_account_analytics', params: {
  'p_account_id': accountId,
  'p_days': 30  // optional, default 30
});
// Returns: {success, data: {summary, daily_revenue, top_items}}
```

---

## ⚙️ Settings Functions

### Get Settings
```dart
await supabase.rpc('get_pos_settings', params: {
  'p_account_id': accountId
});
// Returns: {success, data: {restaurant_name, address, phone, tax_rate, ...}}
```

### Update Settings
```dart
await supabase.rpc('upsert_pos_settings', params: {
  'p_account_id': accountId,
  'p_restaurant_name': 'My Restaurant',
  'p_address': '123 Main St',
  'p_phone': '+1234567890',
  'p_email': 'contact@restaurant.com',
  'p_fssai_number': 'FSSAI123',
  'p_tax_rate': 18.0,
  'p_gst_inclusive': true,
  'p_privacy_mode': false
});
```

---

## 🌐 Digital Menu Functions

### Get Public Menu (no auth)
```dart
await supabase.rpc('get_public_menu', params: {
  'p_slug': 'my-restaurant'
});
```

### Initialize Digital Menu
```dart
await supabase.rpc('initialize_digital_menu', params: {
  'p_account_id': accountId,
  'p_restaurant_name': 'My Restaurant'
});
// Returns: {success, slug: "my-restaurant"}
```

### Update Theme
```dart
await supabase.rpc('update_menu_theme', params: {
  'p_account_id': accountId,
  'p_theme_name': 'modern',  // 'modern', 'classic', 'elegant', 'minimal'
  'p_custom_colors': {}      // optional JSON
});
```

---

## 👨‍💼 Admin Functions

### Search Accounts
```dart
await supabase.rpc('search_pos_accounts', params: {
  'p_search_term': 'restaurant',  // optional
  'p_status': 'active',           // optional: 'active', 'disabled', 'all'
  'p_limit': 50,                  // optional
  'p_offset': 0                   // optional
});
```

### Get Account Details
```dart
await supabase.rpc('get_account_full_details', params: {
  'p_account_id': accountId
});
// Returns: {success, data: {account, settings, subscription, telemetry, ...}}
```

### Create Account
```dart
await supabase.rpc('create_pos_account', params: {
  'p_mobile_number': '+1234567890',
  'p_pin': '1234',
  'p_restaurant_name': 'New Restaurant',
  'p_license_duration_days': 365  // optional, default 365
});
// Returns: {success, account_id}
```

### Toggle Account Status
```dart
await supabase.rpc('toggle_pos_account_status', params: {
  'p_account_id': accountId
});
// Returns: {success, new_status: "active" | "disabled"}
```

---

## 🎯 Common Patterns

### Login Flow
```dart
final response = await supabase.rpc('pos_login', params: {...});
if (response['success'] == true) {
  final accountId = response['account_id'];
  // Save accountId, load data
}
```

### Error Handling
```dart
try {
  final response = await supabase.rpc('function_name', params: {...});
  if (response['success'] == true) {
    // Handle success
  } else {
    // Show error: response['message']
  }
} catch (e) {
  // Handle network error
}
```

### Order Number Generation
```dart
final orderNumber = 'ORD${DateTime.now().millisecondsSinceEpoch}';
```

---

## 📋 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {...}  // or array
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔧 Debugging Tips

1. ✅ Check parameter names have `p_` prefix
2. ✅ Verify JSON format for arrays (`p_items`, `p_categories`)
3. ✅ Test in Supabase SQL Editor first
4. ✅ Check response['success'] before accessing data
5. ✅ Handle both success and error cases

---

## 📞 Project Info

- **Supabase Project ID**: `hrogkcqnpjqnjstxdaxo`
- **Backend**: PostgreSQL + RLS
- **Auth**: Custom RPC functions (no Supabase Auth)
- **Real-time**: Supported if needed

---

**For detailed documentation, see: `FLUTTER_DEVELOPER_GUIDE.md`**
