

# Order Editing with Payment Method Change

## Overview

Add the ability to edit orders and change payment methods within a configurable time window. The Super Admin can control this feature globally with three modes:
- **Off**: No order editing allowed
- **Unlimited**: Orders can be edited anytime  
- **Time-Limited**: Orders can only be edited within X minutes (configurable)

---

## Feature Breakdown

### What Users Will Experience

**POS Users (Restaurant Staff):**
- See an "Edit" button on recent orders (if within the edit window)
- Can change the payment method (Cash, UPI, Card)
- Orders outside the time window show as "locked"

**Super Admin:**
- New settings section to configure order editing mode
- Options: Off, Unlimited, or Time-Limited (with customizable minutes)
- Default: 30 minutes

---

## Technical Implementation

### 1. Database Changes

**New Table: `admin_settings`**
Stores global super admin configuration settings.

```text
admin_settings
├── id (uuid, primary key)
├── setting_key (text, unique) - e.g., "order_edit_mode"
├── setting_value (text) - e.g., "time_limited"
├── setting_metadata (jsonb) - e.g., {"minutes": 30}
├── created_at (timestamp)
└── updated_at (timestamp)
```

**New Column on `pos_orders`:**
- `updated_at` (timestamp) - Track when order was last modified

### 2. New Database Functions

**`get_admin_settings()`**
- Returns all admin settings for the Super Admin dashboard

**`upsert_admin_setting(p_key, p_value, p_metadata)`**
- Creates or updates an admin setting

**`update_order_payment_method(p_order_id, p_payment_method, p_account_id)`**
- Updates the payment method for an order
- Validates edit is allowed based on admin settings
- Returns success/failure with appropriate message

**`can_edit_order(p_order_id, p_account_id)`**
- Checks if an order can be edited based on:
  - Order age vs configured time limit
  - Current edit mode setting

### 3. Frontend Changes

**Super Admin Dashboard (`SuperAdminDashboard.tsx`)**
- New "Settings" card or section
- Radio buttons for edit mode: Off / Unlimited / Time-Limited
- Number input for minutes (visible only when Time-Limited selected)
- Save button to persist settings

**POS Orders Tab (`Index.tsx`)**
- Add Edit button to each order card
- Show edit button only if `can_edit_order` returns true
- Edit dialog with payment method selector
- Visual indicator for locked orders (greyed out, lock icon)

**Super Admin Orders View (`AccountDetailsModal.tsx`)**
- Display payment method with edit capability (Super Admin always has edit access)
- Show edit history/timestamp

---

## Database Schema Diagram

```text
┌─────────────────────────┐
│     admin_settings      │
├─────────────────────────┤
│ id (uuid)               │
│ setting_key (text)      │ ← "order_edit_mode"
│ setting_value (text)    │ ← "off" | "unlimited" | "time_limited"
│ setting_metadata (jsonb)│ ← {"minutes": 30}
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌─────────────────────────┐
│       pos_orders        │
├─────────────────────────┤
│ ... existing columns ...│
│ updated_at (timestamp)  │ ← NEW: Track modifications
└─────────────────────────┘
```

---

## Implementation Steps

1. **Database Migration**
   - Create `admin_settings` table
   - Add `updated_at` column to `pos_orders`
   - Insert default order edit setting (time_limited, 30 minutes)
   - Create helper functions for settings and order editing

2. **Super Admin Settings UI**
   - Add new Settings section in SuperAdminDashboard
   - Implement settings fetch and save functionality
   - Add form for order edit mode configuration

3. **POS Order Edit Feature**
   - Add edit button to orders in Index.tsx
   - Create edit dialog component
   - Implement edit logic with time validation
   - Add visual feedback for editable vs locked orders

4. **Super Admin Order View**
   - Add edit capability to AccountDetailsModal orders tab
   - Super Admin bypasses time restrictions

---

## Default Configuration

| Setting | Default Value |
|---------|---------------|
| Order Edit Mode | Time-Limited |
| Edit Window | 30 minutes |

---

## Security Considerations

- RLS policies ensure POS accounts can only edit their own orders
- Time validation happens server-side to prevent manipulation
- Super Admin has unrestricted edit access
- All edits are tracked via `updated_at` timestamp

