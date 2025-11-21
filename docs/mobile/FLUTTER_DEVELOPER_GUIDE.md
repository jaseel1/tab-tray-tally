# Flutter Developer Guide - Restaurant POS System

## 🚀 Quick Start

This guide provides everything you need to build a Flutter mobile app that integrates with the Restaurant POS System backend.

## 📋 Table of Contents

1. [API Credentials](#api-credentials)
2. [Setup Instructions](#setup-instructions)
3. [Authentication](#authentication)
4. [Complete RPC Function Reference](#complete-rpc-function-reference)
5. [Data Models](#data-models)
6. [Common Use Cases](#common-use-cases)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## 🔑 API Credentials

### Supabase Configuration

```dart
// Add these to your Flutter app configuration
const String SUPABASE_URL = 'https://hrogkcqnpjqnjstxdaxo.supabase.co';
const String SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb2drY3FucGpxbmpzdHhkYXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTIyNDEsImV4cCI6MjA3MjcyODI0MX0.NJ6Ib0e-nqtU8CFgZRWaTilvQqvFxLP0rc70lqdZuf0';
```

**Important Notes:**
- ✅ These keys are safe for client-side use (public anon keys)
- ✅ Row-Level Security (RLS) policies protect your data
- ✅ No need to store these keys securely - they're designed for public use
- ⚠️ Never expose service_role keys in client apps

---

## 🛠️ Setup Instructions

### 1. Add Dependencies

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.5.6
  shared_preferences: ^2.2.2
  http: ^1.1.0
  json_annotation: ^4.8.1
  intl: ^0.19.0

dev_dependencies:
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
```

### 2. Initialize Supabase

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://hrogkcqnpjqnjstxdaxo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb2drY3FucGpxbmpzdHhkYXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTIyNDEsImV4cCI6MjA3MjcyODI0MX0.NJ6Ib0e-nqtU8CFgZRWaTilvQqvFxLP0rc70lqdZuf0',
  );
  
  runApp(MyApp());
}

// Global Supabase client
final supabase = Supabase.instance.client;
```

---

## 🔐 Authentication

### POS Login

```dart
Future<Map<String, dynamic>> posLogin(String mobileNumber, String pin) async {
  try {
    final response = await supabase.rpc('pos_login', params: {
      'p_mobile_number': mobileNumber,
      'p_pin': pin,
    });
    
    return response as Map<String, dynamic>;
  } catch (e) {
    return {
      'success': false,
      'message': 'Network error: ${e.toString()}'
    };
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "account_id": "uuid-string",
  "restaurant_name": "My Restaurant",
  "mobile_number": "+1234567890",
  "license_valid_until": "2025-12-31",
  "days_remaining": 365
}
```

### Admin Login

```dart
Future<Map<String, dynamic>> adminLogin(String username, String password) async {
  try {
    final response = await supabase.rpc('admin_login', params: {
      'p_username': username,
      'p_password': password,
    });
    
    return response as Map<String, dynamic>;
  } catch (e) {
    return {
      'success': false,
      'message': 'Network error: ${e.toString()}'
    };
  }
}
```

---

## 📚 Complete RPC Function Reference

### 🔍 Important: Parameter Naming Convention

**ALL RPC functions use `p_` prefix for parameters!**

Example: `p_account_id`, `p_mobile_number`, `p_name`, etc.

### Authentication Functions

#### 1. `pos_login`
Authenticate POS account with mobile number and PIN.

```dart
final result = await supabase.rpc('pos_login', params: {
  'p_mobile_number': String,  // Mobile number
  'p_pin': String,            // 4-6 digit PIN
});
```

**Returns:**
```json
{
  "success": true,
  "account_id": "uuid",
  "restaurant_name": "string",
  "mobile_number": "string",
  "license_valid_until": "date",
  "days_remaining": number
}
```

#### 2. `admin_login`
Authenticate administrator account.

```dart
final result = await supabase.rpc('admin_login', params: {
  'p_username': String,
  'p_password': String,
});
```

---

### Settings Management Functions

#### 3. `get_pos_settings`
Retrieve restaurant settings for an account.

```dart
final result = await supabase.rpc('get_pos_settings', params: {
  'p_account_id': String,  // UUID of the account
});
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "restaurant_name": "string",
    "address": "string",
    "phone": "string",
    "email": "string",
    "fssai_number": "string",
    "tax_rate": number,
    "gst_inclusive": boolean,
    "privacy_mode": boolean
  }
}
```

#### 4. `upsert_pos_settings`
Create or update restaurant settings.

```dart
final result = await supabase.rpc('upsert_pos_settings', params: {
  'p_account_id': String,
  'p_restaurant_name': String,
  'p_address': String?,         // Optional
  'p_phone': String?,           // Optional
  'p_email': String?,           // Optional
  'p_fssai_number': String?,    // Optional
  'p_tax_rate': double?,        // Optional, default 0
  'p_gst_inclusive': bool?,     // Optional, default false
  'p_privacy_mode': bool?,      // Optional, default false
});
```

---

### Menu Management Functions

#### 5. `list_menu_items`
Get all menu items for an account.

```dart
final result = await supabase.rpc('list_menu_items', params: {
  'p_account_id': String,
});
```

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "price": number,
      "category": "string",
      "image": "string | null",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### 6. `upsert_menu_item`
Create new or update existing menu item.

```dart
// Create new item
final result = await supabase.rpc('upsert_menu_item', params: {
  'p_account_id': String,
  'p_name': String,
  'p_price': double,
  'p_category': String,
  'p_item_id': null,           // null for new item
  'p_image': String?,          // Optional base64 or URL
});

// Update existing item
final result = await supabase.rpc('upsert_menu_item', params: {
  'p_account_id': String,
  'p_name': String,
  'p_price': double,
  'p_category': String,
  'p_item_id': String,         // UUID of existing item
  'p_image': String?,
});
```

**Returns:**
```json
{
  "success": true,
  "id": "uuid"
}
```

#### 7. `delete_menu_item`
Delete a menu item.

```dart
final result = await supabase.rpc('delete_menu_item', params: {
  'p_account_id': String,
  'p_item_id': String,
});
```

#### 8. `get_account_menu`
Get complete menu with items and categories.

```dart
final result = await supabase.rpc('get_account_menu', params: {
  'p_account_id': String,
});
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "menu_items": [...],
    "categories": ["Category1", "Category2"]
  }
}
```

#### 9. `get_categories`
Get all categories for an account.

```dart
final result = await supabase.rpc('get_categories', params: {
  'p_account_id': String,
});
```

**Returns:**
```json
{
  "success": true,
  "data": ["Category1", "Category2", "Category3"]
}
```

#### 10. `upsert_categories`
Replace all categories with new list.

```dart
final result = await supabase.rpc('upsert_categories', params: {
  'p_account_id': String,
  'p_categories': List<String>,  // Array of category names
});
```

**Example:**
```dart
final result = await supabase.rpc('upsert_categories', params: {
  'p_account_id': accountId,
  'p_categories': ['Pizza', 'Burgers', 'Drinks', 'Desserts'],
});
```

---

### Order Management Functions

#### 11. `get_orders`
Get recent orders (default 50).

```dart
final result = await supabase.rpc('get_orders', params: {
  'p_account_id': String,
  'p_limit': int?,  // Optional, default 50
});
```

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "string",
      "total_amount": number,
      "payment_method": "string",
      "created_at": "timestamp",
      "items": [
        {
          "item_name": "string",
          "quantity": number,
          "unit_price": number,
          "total_price": number
        }
      ]
    }
  ]
}
```

#### 12. `get_account_orders`
Get orders with pagination.

```dart
final result = await supabase.rpc('get_account_orders', params: {
  'p_account_id': String,
  'p_limit': int?,   // Optional, default 100
  'p_offset': int?,  // Optional, default 0
});
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "total_count": number,
    "limit": number,
    "offset": number
  }
}
```

#### 13. `create_order`
Create a new order with items.

```dart
final result = await supabase.rpc('create_order', params: {
  'p_account_id': String,
  'p_order_number': String,
  'p_total_amount': double,
  'p_payment_method': String,  // 'cash', 'card', 'upi', etc.
  'p_items': List<Map<String, dynamic>>,  // JSON array
});
```

**Items Format:**
```dart
final items = [
  {
    'name': 'Pizza Margherita',
    'quantity': 2,
    'price': 12.99,
    'total': 25.98
  },
  {
    'name': 'Coca Cola',
    'quantity': 1,
    'price': 2.50,
    'total': 2.50
  }
];
```

**Complete Example:**
```dart
final orderNumber = 'ORD${DateTime.now().millisecondsSinceEpoch}';
final result = await supabase.rpc('create_order', params: {
  'p_account_id': accountId,
  'p_order_number': orderNumber,
  'p_total_amount': 28.48,
  'p_payment_method': 'cash',
  'p_items': [
    {
      'name': 'Pizza Margherita',
      'quantity': 2,
      'price': 12.99,
      'total': 25.98
    },
    {
      'name': 'Coca Cola',
      'quantity': 1,
      'price': 2.50,
      'total': 2.50
    }
  ],
});
```

---

### Analytics Functions

#### 14. `get_item_sales`
Get sales data for all items.

```dart
final result = await supabase.rpc('get_item_sales', params: {
  'p_account_id': String,
  'p_days': int?,  // Optional, default 30
});
```

**Returns:**
```json
{
  "success": true,
  "data": [
    {
      "item_name": "string",
      "total_quantity": number,
      "total_revenue": number,
      "order_count": number
    }
  ]
}
```

#### 15. `get_account_analytics`
Get comprehensive analytics for an account.

```dart
final result = await supabase.rpc('get_account_analytics', params: {
  'p_account_id': String,
  'p_days': int?,  // Optional, default 30
});
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_orders": number,
      "total_revenue": number,
      "average_order_value": number,
      "unique_items_sold": number
    },
    "daily_revenue": [
      {
        "date": "YYYY-MM-DD",
        "revenue": number,
        "orders": number
      }
    ],
    "top_items": [
      {
        "item_name": "string",
        "quantity_sold": number,
        "revenue": number
      }
    ]
  }
}
```

---

### Digital Menu Functions (Public Access)

#### 16. `get_public_menu`
Get public menu by slug (no authentication required).

```dart
final result = await supabase.rpc('get_public_menu', params: {
  'p_slug': String,  // URL slug like 'my-restaurant'
});
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "menu_items": [...],
    "settings": {...},
    "theme": {...},
    "digital_menu": {...}
  }
}
```

#### 17. `initialize_digital_menu`
Initialize digital menu for an account.

```dart
final result = await supabase.rpc('initialize_digital_menu', params: {
  'p_account_id': String,
  'p_restaurant_name': String,
});
```

**Returns:**
```json
{
  "success": true,
  "slug": "restaurant-name"
}
```

#### 18. `get_digital_menu_settings`
Get digital menu configuration.

```dart
final result = await supabase.rpc('get_digital_menu_settings', params: {
  'p_account_id': String,
});
```

#### 19. `update_menu_theme`
Update digital menu theme.

```dart
final result = await supabase.rpc('update_menu_theme', params: {
  'p_account_id': String,
  'p_theme_name': String,  // 'modern', 'classic', 'elegant', 'minimal'
  'p_custom_colors': Map<String, dynamic>?,  // Optional JSON
});
```

---

### Super Admin Functions

#### 20. `search_pos_accounts`
Search and filter POS accounts (Admin only).

```dart
final result = await supabase.rpc('search_pos_accounts', params: {
  'p_search_term': String?,  // Optional, searches name/mobile
  'p_status': String?,       // Optional, 'active', 'disabled', 'all'
  'p_limit': int?,           // Optional, default 50
  'p_offset': int?,          // Optional, default 0
});
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "accounts": [...],
    "total_count": number,
    "limit": number,
    "offset": number
  }
}
```

#### 21. `get_account_full_details`
Get complete account information (Admin only).

```dart
final result = await supabase.rpc('get_account_full_details', params: {
  'p_account_id': String,
});
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "account": {...},
    "settings": {...},
    "subscription": {...},
    "telemetry": {...},
    "digital_menu": {...},
    "active_theme": {...}
  }
}
```

#### 22. `create_pos_account`
Create new POS account (Admin only).

```dart
final result = await supabase.rpc('create_pos_account', params: {
  'p_mobile_number': String,
  'p_pin': String,
  'p_restaurant_name': String,
  'p_license_duration_days': int?,  // Optional, default 365
});
```

**Returns:**
```json
{
  "success": true,
  "account_id": "uuid"
}
```

#### 23. `toggle_pos_account_status`
Toggle account active/disabled status (Admin only).

```dart
final result = await supabase.rpc('toggle_pos_account_status', params: {
  'p_account_id': String,
});
```

**Returns:**
```json
{
  "success": true,
  "new_status": "active" | "disabled"
}
```

---

## 📊 Data Models

### MenuItem Model

```dart
class MenuItem {
  final String id;
  final String name;
  final double price;
  final String category;
  final String? image;
  final DateTime createdAt;
  final DateTime updatedAt;

  MenuItem({
    required this.id,
    required this.name,
    required this.price,
    required this.category,
    this.image,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'],
      name: json['name'],
      price: double.parse(json['price'].toString()),
      category: json['category'],
      image: json['image'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'category': category,
      'image': image,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
```

### Order Model

```dart
class Order {
  final String id;
  final String orderNumber;
  final double totalAmount;
  final String paymentMethod;
  final DateTime createdAt;
  final List<OrderItem> items;

  Order({
    required this.id,
    required this.orderNumber,
    required this.totalAmount,
    required this.paymentMethod,
    required this.createdAt,
    required this.items,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    var itemsList = json['items'] as List;
    List<OrderItem> items = itemsList.map((item) => 
      OrderItem.fromJson(item)
    ).toList();
    
    return Order(
      id: json['id'],
      orderNumber: json['order_number'],
      totalAmount: double.parse(json['total_amount'].toString()),
      paymentMethod: json['payment_method'],
      createdAt: DateTime.parse(json['created_at']),
      items: items,
    );
  }
}

class OrderItem {
  final String itemName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  OrderItem({
    required this.itemName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      itemName: json['item_name'],
      quantity: json['quantity'],
      unitPrice: double.parse(json['unit_price'].toString()),
      totalPrice: double.parse(json['total_price'].toString()),
    );
  }
}
```

---

## 💡 Common Use Cases

### Use Case 1: Complete Login Flow

```dart
Future<bool> performLogin(String mobile, String pin) async {
  try {
    final response = await supabase.rpc('pos_login', params: {
      'p_mobile_number': mobile,
      'p_pin': pin,
    });
    
    if (response['success'] == true) {
      // Save account ID for future requests
      final accountId = response['account_id'];
      await saveAccountId(accountId);
      
      // Load initial data
      await loadMenuItems(accountId);
      await loadSettings(accountId);
      
      return true;
    } else {
      showError(response['message']);
      return false;
    }
  } catch (e) {
    showError('Network error: $e');
    return false;
  }
}
```

### Use Case 2: Menu Management

```dart
// Load menu items
Future<List<MenuItem>> loadMenuItems(String accountId) async {
  final response = await supabase.rpc('list_menu_items', params: {
    'p_account_id': accountId,
  });
  
  if (response['success'] == true) {
    List<dynamic> data = response['data'];
    return data.map((item) => MenuItem.fromJson(item)).toList();
  }
  return [];
}

// Add new item
Future<bool> addMenuItem(String accountId, String name, 
    double price, String category) async {
  final response = await supabase.rpc('upsert_menu_item', params: {
    'p_account_id': accountId,
    'p_name': name,
    'p_price': price,
    'p_category': category,
    'p_item_id': null,
  });
  
  return response['success'] == true;
}

// Update item
Future<bool> updateMenuItem(String accountId, String itemId,
    String name, double price, String category) async {
  final response = await supabase.rpc('upsert_menu_item', params: {
    'p_account_id': accountId,
    'p_name': name,
    'p_price': price,
    'p_category': category,
    'p_item_id': itemId,
  });
  
  return response['success'] == true;
}
```

### Use Case 3: Creating Orders

```dart
Future<bool> createNewOrder(String accountId, List<CartItem> cartItems, 
    String paymentMethod) async {
  // Calculate totals
  double total = 0;
  final items = cartItems.map((item) {
    final itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    return {
      'name': item.name,
      'quantity': item.quantity,
      'price': item.price,
      'total': itemTotal,
    };
  }).toList();
  
  // Generate order number
  final orderNumber = 'ORD${DateTime.now().millisecondsSinceEpoch}';
  
  // Create order
  final response = await supabase.rpc('create_order', params: {
    'p_account_id': accountId,
    'p_order_number': orderNumber,
    'p_total_amount': total,
    'p_payment_method': paymentMethod,
    'p_items': items,
  });
  
  return response['success'] == true;
}
```

### Use Case 4: Analytics Dashboard

```dart
Future<AnalyticsData> loadAnalytics(String accountId, int days) async {
  final response = await supabase.rpc('get_account_analytics', params: {
    'p_account_id': accountId,
    'p_days': days,
  });
  
  if (response['success'] == true) {
    final data = response['data'];
    return AnalyticsData(
      totalOrders: data['summary']['total_orders'],
      totalRevenue: data['summary']['total_revenue'],
      avgOrderValue: data['summary']['average_order_value'],
      dailyRevenue: List.from(data['daily_revenue']),
      topItems: List.from(data['top_items']),
    );
  }
  
  throw Exception('Failed to load analytics');
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description here"
}
```

### Error Handling Pattern

```dart
Future<Map<String, dynamic>> callRPC(
    String functionName, Map<String, dynamic> params) async {
  try {
    final response = await supabase.rpc(functionName, params: params);
    return response as Map<String, dynamic>;
  } on PostgrestException catch (e) {
    // Supabase/Postgres specific error
    return {
      'success': false,
      'message': 'Database error: ${e.message}',
      'code': e.code,
    };
  } catch (e) {
    // General network or other errors
    return {
      'success': false,
      'message': 'Network error: ${e.toString()}',
    };
  }
}
```

### Common Error Scenarios

1. **Invalid Credentials**
   ```json
   {
     "success": false,
     "message": "Invalid credentials or account disabled"
   }
   ```

2. **License Expired**
   ```json
   {
     "success": false,
     "message": "License expired or not found"
   }
   ```

3. **Permission Denied**
   ```json
   {
     "success": false,
     "message": "Account not found or no permission"
   }
   ```

4. **Network Errors**
   - Check internet connectivity
   - Implement retry logic with exponential backoff
   - Show user-friendly error messages

---

## ✅ Best Practices

### 1. Authentication State Management

```dart
class AuthService {
  String? _accountId;
  String? _restaurantName;
  
  bool get isAuthenticated => _accountId != null;
  
  Future<void> loadStoredAuth() async {
    final prefs = await SharedPreferences.getInstance();
    _accountId = prefs.getString('account_id');
    _restaurantName = prefs.getString('restaurant_name');
  }
  
  Future<void> saveAuth(Map<String, dynamic> loginData) async {
    _accountId = loginData['account_id'];
    _restaurantName = loginData['restaurant_name'];
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('account_id', _accountId!);
    await prefs.setString('restaurant_name', _restaurantName!);
  }
  
  Future<void> clearAuth() async {
    _accountId = null;
    _restaurantName = null;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('account_id');
    await prefs.remove('restaurant_name');
  }
}
```

### 2. Data Caching Strategy

```dart
class CacheService {
  static const CACHE_DURATION = Duration(minutes: 5);
  
  Map<String, CachedData> _cache = {};
  
  Future<T?> getOrFetch<T>(
    String key,
    Future<T> Function() fetchFunction,
  ) async {
    final cached = _cache[key];
    
    if (cached != null && 
        DateTime.now().difference(cached.timestamp) < CACHE_DURATION) {
      return cached.data as T;
    }
    
    final data = await fetchFunction();
    _cache[key] = CachedData(data: data, timestamp: DateTime.now());
    return data;
  }
  
  void invalidate(String key) {
    _cache.remove(key);
  }
  
  void invalidateAll() {
    _cache.clear();
  }
}
```

### 3. Offline Support

```dart
class OfflineOrderQueue {
  final List<Map<String, dynamic>> _pendingOrders = [];
  
  Future<void> addOrder(Map<String, dynamic> orderData) async {
    _pendingOrders.add(orderData);
    await _saveToStorage();
  }
  
  Future<void> syncPendingOrders(String accountId) async {
    if (_pendingOrders.isEmpty) return;
    
    for (var orderData in List.from(_pendingOrders)) {
      try {
        final result = await supabase.rpc('create_order', params: orderData);
        
        if (result['success'] == true) {
          _pendingOrders.remove(orderData);
          await _saveToStorage();
        }
      } catch (e) {
        print('Failed to sync order: $e');
        break; // Stop on first failure
      }
    }
  }
  
  Future<void> _saveToStorage() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('pending_orders', jsonEncode(_pendingOrders));
  }
}
```

### 4. Loading States

```dart
class LoadingState {
  bool isLoading = false;
  String? error;
  
  Future<T?> withLoading<T>(Future<T> Function() action) async {
    isLoading = true;
    error = null;
    notifyListeners();
    
    try {
      final result = await action();
      isLoading = false;
      notifyListeners();
      return result;
    } catch (e) {
      isLoading = false;
      error = e.toString();
      notifyListeners();
      return null;
    }
  }
}
```

### 5. Retry Logic

```dart
Future<T> retryOperation<T>(
  Future<T> Function() operation, {
  int maxAttempts = 3,
  Duration delay = const Duration(seconds: 2),
}) async {
  int attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      return await operation();
    } catch (e) {
      attempts++;
      
      if (attempts >= maxAttempts) {
        rethrow;
      }
      
      await Future.delayed(delay * attempts); // Exponential backoff
    }
  }
  
  throw Exception('Max retry attempts reached');
}
```

---

## 📞 Support & Resources

- **Backend API**: Supabase PostgreSQL with RLS
- **Real-time**: Supported via Supabase Realtime
- **File Storage**: Available via Supabase Storage (if needed)

### Need Help?

1. Check function signatures carefully - all use `p_` prefix
2. Verify JSON format for complex parameters
3. Check RLS policies if getting permission errors
4. Test with Supabase dashboard SQL editor first

---

## 🎯 Summary Checklist

- ✅ API credentials configured
- ✅ Supabase client initialized
- ✅ Authentication flow implemented
- ✅ RPC function calls with correct parameter names (`p_` prefix)
- ✅ JSON formatting for complex parameters (items arrays, etc.)
- ✅ Error handling for all API calls
- ✅ Data caching strategy
- ✅ Offline support (optional)
- ✅ Loading states and user feedback

---

**Last Updated**: 2025-01-13  
**Backend Version**: v1.0  
**Supabase Project**: hrogkcqnpjqnjstxdaxo
