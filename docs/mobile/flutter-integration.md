# Flutter Mobile App Integration

This guide explains how to create a Flutter mobile app that integrates with the Restaurant POS System backend for POS Owners and Viewers.

## Overview

The Flutter app provides mobile access to core POS functionality including:
- POS Owner login and management
- Menu management
- Order processing and viewing
- Sales analytics
- Real-time data synchronization

## API Credentials

### Supabase Configuration
```dart
// Supabase URL and API Key
const String supabaseUrl = 'https://hrogkcqnpjqnjstxdaxo.supabase.co';
const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb2drY3FucGpxbmpzdHhkYXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTIyNDEsImV4cCI6MjA3MjcyODI0MX0.NJ6Ib0e-nqtU8CFgZRWaTilvQqvFxLP0rc70lqdZuf0';
```

## Setup Instructions

### 1. Flutter Dependencies

Add these dependencies to your `pubspec.yaml`:

```yaml
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

final supabase = Supabase.instance.client;
```

### 3. Authentication Service

```dart
// lib/services/auth_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final SupabaseClient _supabase = Supabase.instance.client;
  
  // POS Login
  Future<Map<String, dynamic>> posLogin(String mobileNumber, String pin) async {
    try {
      final response = await _supabase.rpc('pos_login', params: {
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
}
```

### 4. Data Models

```dart
// lib/models/menu_item.dart
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
}

// lib/models/order.dart
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
    List<OrderItem> items = itemsList.map((item) => OrderItem.fromJson(item)).toList();
    
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

### 5. API Service

```dart
// lib/services/api_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/menu_item.dart';
import '../models/order.dart';

class ApiService {
  final SupabaseClient _supabase = Supabase.instance.client;
  
  // Get POS Settings
  Future<Map<String, dynamic>> getPosSettings(String accountId) async {
    try {
      final response = await _supabase.rpc('get_pos_settings', params: {
        'p_account_id': accountId,
      });
      return response as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'message': 'Error fetching settings: $e'};
    }
  }
  
  // Get Menu Items
  Future<List<MenuItem>> getMenuItems(String accountId) async {
    try {
      final response = await _supabase.rpc('list_menu_items', params: {
        'p_account_id': accountId,
      });
      
      if (response['success'] == true) {
        List<dynamic> itemsData = response['data'];
        return itemsData.map((item) => MenuItem.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching menu items: $e');
      return [];
    }
  }
  
  // Add/Update Menu Item
  Future<Map<String, dynamic>> upsertMenuItem({
    required String accountId,
    required String name,
    required double price,
    required String category,
    String? itemId,
    String? image,
  }) async {
    try {
      final response = await _supabase.rpc('upsert_menu_item', params: {
        'p_account_id': accountId,
        'p_name': name,
        'p_price': price,
        'p_category': category,
        'p_item_id': itemId,
        'p_image': image,
      });
      return response as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'message': 'Error saving menu item: $e'};
    }
  }
  
  // Delete Menu Item
  Future<Map<String, dynamic>> deleteMenuItem(String accountId, String itemId) async {
    try {
      final response = await _supabase.rpc('delete_menu_item', params: {
        'p_account_id': accountId,
        'p_item_id': itemId,
      });
      return response as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'message': 'Error deleting menu item: $e'};
    }
  }
  
  // Get Orders
  Future<List<Order>> getOrders(String accountId, {int limit = 50}) async {
    try {
      final response = await _supabase.rpc('get_orders', params: {
        'p_account_id': accountId,
        'p_limit': limit,
      });
      
      if (response['success'] == true) {
        List<dynamic> ordersData = response['data'];
        return ordersData.map((order) => Order.fromJson(order)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }
  
  // Create Order
  Future<Map<String, dynamic>> createOrder({
    required String accountId,
    required String orderNumber,
    required double totalAmount,
    required String paymentMethod,
    required List<Map<String, dynamic>> items,
  }) async {
    try {
      final response = await _supabase.rpc('create_order', params: {
        'p_account_id': accountId,
        'p_order_number': orderNumber,
        'p_total_amount': totalAmount,
        'p_payment_method': paymentMethod,
        'p_items': items,
      });
      return response as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'message': 'Error creating order: $e'};
    }
  }
  
  // Get Item Sales Analytics
  Future<List<Map<String, dynamic>>> getItemSales(String accountId, {int days = 30}) async {
    try {
      final response = await _supabase.rpc('get_item_sales', params: {
        'p_account_id': accountId,
        'p_days': days,
      });
      
      if (response['success'] == true) {
        return List<Map<String, dynamic>>.from(response['data']);
      }
      return [];
    } catch (e) {
      print('Error fetching item sales: $e');
      return [];
    }
  }
  
  // Get Categories
  Future<List<String>> getCategories(String accountId) async {
    try {
      final response = await _supabase.rpc('get_categories', params: {
        'p_account_id': accountId,
      });
      
      if (response['success'] == true) {
        return List<String>.from(response['data']);
      }
      return ['General'];
    } catch (e) {
      print('Error fetching categories: $e');
      return ['General'];
    }
  }
  
  // Update Categories
  Future<Map<String, dynamic>> updateCategories(String accountId, List<String> categories) async {
    try {
      final response = await _supabase.rpc('upsert_categories', params: {
        'p_account_id': accountId,
        'p_categories': categories,
      });
      return response as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'message': 'Error updating categories: $e'};
    }
  }
}
```

### 6. State Management Example

```dart
// lib/providers/app_state.dart
import 'package:flutter/material.dart';
import '../models/menu_item.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class AppState extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  // Auth State
  Map<String, dynamic>? _loginData;
  bool _isLoggedIn = false;
  
  // Data State
  List<MenuItem> _menuItems = [];
  List<Order> _orders = [];
  List<String> _categories = ['General'];
  Map<String, dynamic>? _settings;
  
  // Loading States
  bool _isLoading = false;
  bool _isMenuLoading = false;
  bool _isOrdersLoading = false;
  
  // Getters
  Map<String, dynamic>? get loginData => _loginData;
  bool get isLoggedIn => _isLoggedIn;
  List<MenuItem> get menuItems => _menuItems;
  List<Order> get orders => _orders;
  List<String> get categories => _categories;
  Map<String, dynamic>? get settings => _settings;
  bool get isLoading => _isLoading;
  bool get isMenuLoading => _isMenuLoading;
  bool get isOrdersLoading => _isOrdersLoading;
  
  String? get accountId => _loginData?['account_id'];
  String? get restaurantName => _loginData?['restaurant_name'];
  
  // Login
  Future<bool> login(String mobileNumber, String pin) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      // Use AuthService here
      final response = await _apiService._supabase.rpc('pos_login', params: {
        'p_mobile_number': mobileNumber,
        'p_pin': pin,
      });
      
      if (response['success'] == true) {
        _loginData = response;
        _isLoggedIn = true;
        
        // Load initial data
        await loadInitialData();
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
  
  // Load initial data after login
  Future<void> loadInitialData() async {
    if (accountId == null) return;
    
    await Future.wait([
      loadMenuItems(),
      loadOrders(),
      loadCategories(),
      loadSettings(),
    ]);
  }
  
  // Load menu items
  Future<void> loadMenuItems() async {
    if (accountId == null) return;
    
    _isMenuLoading = true;
    notifyListeners();
    
    _menuItems = await _apiService.getMenuItems(accountId!);
    
    _isMenuLoading = false;
    notifyListeners();
  }
  
  // Load orders
  Future<void> loadOrders() async {
    if (accountId == null) return;
    
    _isOrdersLoading = true;
    notifyListeners();
    
    _orders = await _apiService.getOrders(accountId!);
    
    _isOrdersLoading = false;
    notifyListeners();
  }
  
  // Load categories
  Future<void> loadCategories() async {
    if (accountId == null) return;
    
    _categories = await _apiService.getCategories(accountId!);
    notifyListeners();
  }
  
  // Load settings
  Future<void> loadSettings() async {
    if (accountId == null) return;
    
    final response = await _apiService.getPosSettings(accountId!);
    if (response['success'] == true) {
      _settings = response['data'];
      notifyListeners();
    }
  }
  
  // Logout
  void logout() {
    _loginData = null;
    _isLoggedIn = false;
    _menuItems = [];
    _orders = [];
    _categories = ['General'];
    _settings = null;
    notifyListeners();
  }
}
```

### 7. Example Screens

```dart
// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _mobileController = TextEditingController();
  final _pinController = TextEditingController();
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('POS Login')),
      body: Consumer<AppState>(
        builder: (context, appState, child) {
          return Padding(
            padding: EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _mobileController,
                  decoration: InputDecoration(labelText: 'Mobile Number'),
                  keyboardType: TextInputType.phone,
                ),
                TextField(
                  controller: _pinController,
                  decoration: InputDecoration(labelText: 'PIN'),
                  obscureText: true,
                  keyboardType: TextInputType.number,
                ),
                SizedBox(height: 20),
                ElevatedButton(
                  onPressed: appState.isLoading ? null : () async {
                    final success = await appState.login(
                      _mobileController.text,
                      _pinController.text,
                    );
                    
                    if (success) {
                      Navigator.of(context).pushReplacementNamed('/home');
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Login failed')),
                      );
                    }
                  },
                  child: appState.isLoading 
                    ? CircularProgressIndicator() 
                    : Text('Login'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```

## User Roles & Permissions

### POS Owner
- Full menu management (add, edit, delete items)
- Order management and processing
- Sales analytics and reports
- System settings configuration
- Category management

### POS Viewer
- View-only access to:
  - Menu items
  - Order history
  - Basic sales analytics
- Cannot modify data

## Key Features

### Real-time Data
- Orders sync in real-time across devices
- Menu changes reflect immediately
- Live sales analytics

### Offline Support
- Cache menu items locally
- Queue orders when offline
- Sync when connection restored

### Security
- Secure PIN-based authentication
- Account-based data isolation
- Encrypted API communication

## Error Handling

```dart
// Example error handling pattern
try {
  final result = await apiService.getMenuItems(accountId);
  // Handle success
} catch (e) {
  // Log error
  print('API Error: $e');
  
  // Show user-friendly message
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Failed to load menu items')),
  );
}
```

## Testing

### API Testing
Test all RPC functions with sample data:

```dart
// Test POS login
final loginResult = await supabase.rpc('pos_login', params: {
  'p_mobile_number': 'test_number',
  'p_pin': 'test_pin',
});
print('Login result: $loginResult');
```

## Production Considerations

1. **Error Handling**: Implement comprehensive error handling
2. **Offline Support**: Cache critical data locally
3. **Performance**: Implement pagination for large datasets
4. **Security**: Validate all inputs, use secure storage
5. **Testing**: Unit test all API calls and business logic

## Support

For technical support or questions:
- Check the main documentation at `/docs/README.md`
- Review API reference at `/docs/technical/api-reference.md`
- Common issues at `/docs/troubleshooting/common-issues.md`