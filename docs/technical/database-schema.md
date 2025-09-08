# Database Schema Documentation

This document details the complete database structure for the Restaurant POS System.

## Schema Overview

The database uses PostgreSQL with Row Level Security (RLS) enabled for secure multi-tenant architecture.

## Core Tables

### pos_accounts
Stores POS user account information.

```sql
CREATE TABLE pos_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

**Columns:**
- `id`: Unique identifier for the account
- `account_name`: Login username for POS users
- `password_hash`: Hashed password (never store plain text)
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp
- `is_active`: Account status flag

**Indexes:**
- Primary key on `id`
- Unique index on `account_name`

### admin_users
Stores administrator account information.

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE
);
```

**Columns:**
- `id`: Unique identifier for the admin
- `username`: Login username for admin users
- `password_hash`: Hashed password
- `role`: User role ('admin' or 'super_admin')
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp
- `is_active`: Account status flag
- `last_login`: Last successful login timestamp

### pos_menu_items
Stores all menu items with categories and pricing.

```sql
CREATE TABLE pos_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier for the menu item
- `name`: Display name of the item
- `price`: Item price (with 2 decimal places)
- `category`: Category classification
- `image_url`: Optional image URL
- `is_available`: Availability status
- `sort_order`: Display order within category
- `created_at`: Item creation timestamp
- `updated_at`: Last modification timestamp

**Indexes:**
- Primary key on `id`
- Index on `category` for fast category filtering
- Index on `is_available` for active items query

### pos_categories
Stores menu categories for organization.

```sql
CREATE TABLE pos_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier for the category
- `name`: Category name
- `sort_order`: Display order
- `is_active`: Category status
- `created_at`: Creation timestamp

### pos_orders
Stores completed orders with customer and payment information.

```sql
CREATE TABLE pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT, -- POS account that created the order
  customer_name TEXT,
  customer_phone TEXT,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT
);
```

**Columns:**
- `id`: Unique identifier for the order
- `order_number`: Human-readable order number
- `subtotal`: Pre-tax total
- `gst_amount`: GST/tax amount
- `total_amount`: Final total including tax
- `order_date`: Order timestamp
- `created_by`: POS user who created the order
- `customer_name`: Optional customer name
- `customer_phone`: Optional customer phone
- `payment_method`: Payment type
- `status`: Order status
- `notes`: Additional order notes

**Indexes:**
- Primary key on `id`
- Unique index on `order_number`
- Index on `order_date` for date-based queries
- Index on `created_by` for user-specific queries

### pos_order_items
Stores individual items within each order.

```sql
CREATE TABLE pos_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES pos_menu_items(id),
  item_name TEXT NOT NULL, -- Snapshot of item name at time of order
  item_price DECIMAL(10,2) NOT NULL, -- Snapshot of price at time of order
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total DECIMAL(10,2) NOT NULL, -- quantity * item_price
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier for the order item
- `order_id`: Reference to parent order
- `menu_item_id`: Reference to menu item (nullable for historical data)
- `item_name`: Item name snapshot
- `item_price`: Price snapshot
- `quantity`: Number of items ordered
- `line_total`: Total for this line item
- `created_at`: Creation timestamp

**Indexes:**
- Primary key on `id`
- Foreign key index on `order_id`
- Index on `menu_item_id` for item sales analysis

### pos_settings
Stores system configuration and settings.

```sql
CREATE TABLE pos_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL DEFAULT 'Restaurant',
  address TEXT,
  phone TEXT,
  email TEXT,
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  currency_symbol TEXT DEFAULT '₹',
  receipt_footer TEXT,
  theme_color TEXT DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier
- `restaurant_name`: Business name
- `address`: Business address
- `phone`: Business phone number
- `email`: Business email
- `gst_rate`: Tax rate percentage
- `currency_symbol`: Currency display symbol
- `receipt_footer`: Custom receipt footer text
- `theme_color`: UI theme color
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

### pos_subscriptions
Tracks subscription and billing information.

```sql
CREATE TABLE pos_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  max_pos_accounts INTEGER DEFAULT 1,
  max_menu_items INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier
- `plan_name`: Subscription plan name
- `max_pos_accounts`: Maximum POS user accounts
- `max_menu_items`: Maximum menu items allowed
- `features`: JSON object of enabled features
- `start_date`: Subscription start date
- `end_date`: Subscription end date
- `is_active`: Subscription status
- `created_at`: Creation timestamp

### pos_telemetry
Stores usage analytics and telemetry data.

```sql
CREATE TABLE pos_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id TEXT,
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

**Columns:**
- `id`: Unique identifier
- `event_type`: Type of event (login, order, etc.)
- `event_data`: JSON payload with event details
- `user_id`: User who triggered the event
- `session_id`: Session identifier
- `timestamp`: Event timestamp
- `ip_address`: Client IP address
- `user_agent`: Client browser information

## Row Level Security (RLS) Policies

### pos_accounts
```sql
-- Users can only access their own account data
CREATE POLICY "Users can view own account" ON pos_accounts
  FOR SELECT USING (account_name = current_user);

-- Admins can view all accounts
CREATE POLICY "Admins can view all accounts" ON pos_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE username = current_user AND is_active = true
    )
  );
```

### pos_menu_items
```sql
-- Everyone can read menu items
CREATE POLICY "Anyone can view menu items" ON pos_menu_items
  FOR SELECT USING (true);

-- Only admins can modify menu items
CREATE POLICY "Admins can modify menu items" ON pos_menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE username = current_user AND is_active = true
    )
  );
```

### pos_orders
```sql
-- POS users can create orders
CREATE POLICY "POS users can create orders" ON pos_orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pos_accounts 
      WHERE account_name = current_user AND is_active = true
    )
  );

-- Users can view orders they created or admins can view all
CREATE POLICY "Users can view relevant orders" ON pos_orders
  FOR SELECT USING (
    created_by = current_user OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE username = current_user AND is_active = true
    )
  );
```

## Database Functions

### update_updated_at_column()
Trigger function to automatically update the `updated_at` column.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### generate_order_number()
Generates sequential order numbers.

```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    order_num TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM pos_orders
    WHERE order_number LIKE 'ORD%';
    
    order_num := 'ORD' || LPAD(next_number::TEXT, 6, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### Automatic Timestamp Updates
```sql
-- pos_accounts
CREATE TRIGGER update_pos_accounts_updated_at
    BEFORE UPDATE ON pos_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- admin_users
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- pos_menu_items
CREATE TRIGGER update_pos_menu_items_updated_at
    BEFORE UPDATE ON pos_menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- pos_settings
CREATE TRIGGER update_pos_settings_updated_at
    BEFORE UPDATE ON pos_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Order Number Generation
```sql
CREATE TRIGGER set_order_number
    BEFORE INSERT ON pos_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();
```

## Indexes for Performance

### Query Optimization Indexes
```sql
-- Fast menu item lookups by category
CREATE INDEX idx_menu_items_category ON pos_menu_items(category);
CREATE INDEX idx_menu_items_available ON pos_menu_items(is_available);

-- Order date range queries
CREATE INDEX idx_orders_date ON pos_orders(order_date);
CREATE INDEX idx_orders_created_by ON pos_orders(created_by);

-- Order items for sales analysis
CREATE INDEX idx_order_items_order_id ON pos_order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON pos_order_items(menu_item_id);

-- Telemetry for analytics
CREATE INDEX idx_telemetry_event_type ON pos_telemetry(event_type);
CREATE INDEX idx_telemetry_timestamp ON pos_telemetry(timestamp);
```

## Data Relationships

```
pos_accounts (1) ──── (many) pos_orders
admin_users (1) ──── (many) pos_orders (created_by)
pos_orders (1) ──── (many) pos_order_items
pos_menu_items (1) ──── (many) pos_order_items
pos_categories (1) ──── (many) pos_menu_items (category)
```

## Data Integrity Constraints

### Check Constraints
```sql
-- Ensure positive prices
ALTER TABLE pos_menu_items ADD CONSTRAINT check_positive_price 
  CHECK (price > 0);

-- Ensure positive quantities
ALTER TABLE pos_order_items ADD CONSTRAINT check_positive_quantity 
  CHECK (quantity > 0);

-- Ensure valid GST rate
ALTER TABLE pos_settings ADD CONSTRAINT check_valid_gst_rate 
  CHECK (gst_rate >= 0 AND gst_rate <= 100);
```

### Foreign Key Constraints
```sql
-- Order items must reference valid orders
ALTER TABLE pos_order_items ADD CONSTRAINT fk_order_items_order
  FOREIGN KEY (order_id) REFERENCES pos_orders(id) ON DELETE CASCADE;

-- Order items can reference menu items (nullable for historical data)
ALTER TABLE pos_order_items ADD CONSTRAINT fk_order_items_menu_item
  FOREIGN KEY (menu_item_id) REFERENCES pos_menu_items(id) ON DELETE SET NULL;
```

---
*This schema is designed for data integrity, performance, and scalability while maintaining audit trails and historical data.*