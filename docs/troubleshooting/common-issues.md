# Common Issues & Solutions

This guide covers frequently encountered problems and their solutions.

## Authentication Issues

### Login Failed: Invalid Credentials

**Symptoms:**
- "Invalid credentials" message on login
- Unable to access POS or admin interface
- Login form keeps appearing after submission

**Causes & Solutions:**

#### 1. Incorrect Username/Password
- **Check credentials**: Verify typing and case sensitivity
- **Contact admin**: Request password reset if needed
- **Clear browser cache**: Old cached data may interfere

#### 2. Account Deactivated
- **Admin verification**: Check if account is marked as active
- **Database check**: Verify `is_active` field in database
- **Contact super admin**: For account reactivation

#### 3. Database Connection Issues
```sql
-- Verify account exists
SELECT account_name, is_active FROM pos_accounts WHERE account_name = 'your_username';

-- Check admin users
SELECT username, role, is_active FROM admin_users WHERE username = 'your_username';
```

#### 4. Password Hash Issues
```sql
-- Reset password (admin only)
UPDATE pos_accounts 
SET password_hash = '$2a$10$newhashedpassword' 
WHERE account_name = 'username';
```

### Session Expired Errors

**Symptoms:**
- Sudden logout during use
- "Session expired" messages
- Need to login repeatedly

**Solutions:**
1. **Check browser settings**: Ensure cookies are enabled
2. **Clear browser data**: Remove old session data
3. **Check network stability**: Unstable connection may cause session loss
4. **Update browser**: Old browsers may have session handling issues

## Menu Management Issues

### Menu Items Not Displaying

**Symptoms:**
- Empty menu in billing screen
- Items missing after logout/login
- "No menu items found" message

**Root Causes & Fixes:**

#### 1. Items Not Saved to Database
```typescript
// Check if save operation completed
const saveMenu = async () => {
  try {
    const { data, error } = await supabase.rpc('save_menu', {
      menu_items: items
    });
    if (error) throw error;
    console.log('Save successful:', data);
  } catch (error) {
    console.error('Save failed:', error);
  }
};
```

#### 2. Loading Issue
```typescript
// Verify data loading
const loadData = async () => {
  try {
    const { data, error } = await supabase.rpc('load_pos_data');
    if (data) {
      console.log('Loaded items:', data.menu_items?.length);
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};
```

#### 3. Database Query Issues
```sql
-- Check menu items exist
SELECT COUNT(*) FROM pos_menu_items WHERE is_available = true;

-- Check RLS policies
SELECT * FROM pos_menu_items LIMIT 5;
```

### Cannot Edit Menu Items

**Symptoms:**
- Edit button not working
- Form not saving changes
- "Permission denied" errors

**Solutions:**

#### 1. Permission Issues
- **Check user role**: Only admins can edit menu
- **Verify login type**: Use admin login, not POS login
- **Check readOnly prop**: Component may be in view-only mode

#### 2. Form Validation Errors
```typescript
// Add validation logging
const handleSubmit = (data) => {
  console.log('Form data:', data);
  
  // Check required fields
  if (!data.name || !data.price || !data.category) {
    console.error('Missing required fields');
    return;
  }
  
  // Proceed with save
};
```

#### 3. Database Connection
```sql
-- Test write permissions
INSERT INTO pos_menu_items (name, price, category) 
VALUES ('Test Item', 1.00, 'Test');

-- Clean up test
DELETE FROM pos_menu_items WHERE name = 'Test Item';
```

## Order Processing Issues

### Orders Not Processing

**Symptoms:**
- "Process Order" button not working
- Orders not appearing in history
- Receipt not generating

**Troubleshooting Steps:**

#### 1. Check Cart Contents
```typescript
// Verify cart data
console.log('Cart items:', cartItems);
console.log('Total:', totalAmount);

// Validate cart structure
const isValidCart = cartItems.every(item => 
  item.name && item.price > 0 && item.quantity > 0
);
```

#### 2. Network Issues
```typescript
// Check network connectivity
const testConnection = async () => {
  try {
    const response = await fetch('https://httpbin.org/get');
    console.log('Network OK:', response.ok);
  } catch (error) {
    console.error('Network issue:', error);
  }
};
```

#### 3. Database Errors
```sql
-- Check order creation function
SELECT * FROM pos_orders ORDER BY order_date DESC LIMIT 5;

-- Verify order items
SELECT oi.*, o.order_number 
FROM pos_order_items oi 
JOIN pos_orders o ON oi.order_id = o.id 
ORDER BY oi.created_at DESC LIMIT 10;
```

### Receipt Generation Problems

**Symptoms:**
- Blank receipt preview
- Print button not working
- Missing receipt information

**Solutions:**

#### 1. PDF Generation Issues
```typescript
// Test PDF generation
import { generateReceiptPDF } from '@/lib/pdf';

const testPDF = () => {
  try {
    const pdfBlob = generateReceiptPDF(orderData, settings);
    console.log('PDF generated:', pdfBlob.size, 'bytes');
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
};
```

#### 2. Browser Print Issues
- **Allow pop-ups**: Check browser pop-up settings
- **Printer connection**: Verify printer is connected and online
- **Print preview**: Use browser print preview as alternative

#### 3. Missing Settings Data
```sql
-- Verify restaurant settings exist
SELECT * FROM pos_settings;

-- Add default settings if missing
INSERT INTO pos_settings (restaurant_name, gst_rate) 
VALUES ('Restaurant Name', 18.00);
```

## Performance Issues

### Slow Loading Times

**Symptoms:**
- App takes long to load
- Menu items load slowly
- Slow response to user actions

**Optimization Steps:**

#### 1. Network Optimization
```typescript
// Check API response times
const measureApiTime = async () => {
  const start = performance.now();
  await supabase.rpc('load_pos_data');
  const end = performance.now();
  console.log(`API call took ${end - start} milliseconds`);
};
```

#### 2. Browser Performance
- **Clear cache**: Remove old cached data
- **Close tabs**: Reduce browser memory usage
- **Check extensions**: Disable unnecessary browser extensions
- **Update browser**: Use latest browser version

#### 3. Database Optimization
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM pos_menu_items WHERE is_available = true;

-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON pos_menu_items(is_available);
```

### Memory Issues

**Symptoms:**
- Browser becomes unresponsive
- "Out of memory" errors
- System slowdown

**Solutions:**
1. **Refresh page**: Clear current session memory
2. **Restart browser**: Free up all browser memory
3. **Check image sizes**: Large menu item images use memory
4. **Limit data**: Avoid loading too many orders at once

## Data Synchronization Issues

### Data Not Syncing

**Symptoms:**
- Changes not appearing on other devices
- Old data persisting after updates
- Inconsistent data between users

**Troubleshooting:**

#### 1. Check Real-time Connection
```typescript
// Test Supabase real-time
const channel = supabase
  .channel('test-channel')
  .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
    console.log('Change received!', payload);
  })
  .subscribe();
```

#### 2. Manual Sync
```typescript
// Force data reload
const forceSync = async () => {
  // Clear local cache
  localStorage.removeItem('menuItems');
  localStorage.removeItem('settings');
  
  // Reload from server
  await loadServerData();
};
```

#### 3. Check Browser Storage
```typescript
// Inspect stored data
console.log('Local menu:', localStorage.getItem('menuItems'));
console.log('Local settings:', localStorage.getItem('settings'));

// Clear problematic data
localStorage.clear();
sessionStorage.clear();
```

## UI/UX Issues

### Display Problems

**Symptoms:**
- Layout appears broken
- Text overlapping or cut off
- Missing icons or images

**Solutions:**

#### 1. CSS Issues
```bash
# Clear Tailwind cache
rm -rf node_modules/.cache
npm install

# Check for CSS conflicts
# Open browser DevTools > Elements > Styles
```

#### 2. Responsive Design
```css
/* Test different screen sizes */
/* Mobile: 320px - 768px */
/* Tablet: 768px - 1024px */
/* Desktop: 1024px+ */

/* Check viewport meta tag */
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### 3. Image Loading
```typescript
// Handle image load errors
const handleImageError = (e) => {
  e.target.src = '/placeholder-image.png';
  console.warn('Image failed to load:', e.target.src);
};

<img 
  src={item.image} 
  onError={handleImageError}
  alt={item.name}
/>
```

### Navigation Issues

**Symptoms:**
- Tabs not switching
- Back button not working
- Page refreshes unexpectedly

**Solutions:**
1. **Check JavaScript errors**: Open browser console
2. **Clear browser cache**: Force reload with Ctrl+Shift+R
3. **Test in incognito**: Rule out extension interference
4. **Update browser**: Ensure latest version

## Error Messages Reference

### Common Error Codes

#### AUTH_001: Authentication Failed
- **Cause**: Invalid login credentials
- **Solution**: Verify username/password, check account status

#### DB_001: Database Connection Error
- **Cause**: Cannot connect to Supabase
- **Solution**: Check internet, verify Supabase status

#### MENU_001: Menu Load Failed
- **Cause**: Cannot retrieve menu items
- **Solution**: Check database connection, verify RLS policies

#### ORDER_001: Order Processing Failed
- **Cause**: Error creating order
- **Solution**: Validate cart data, check database constraints

#### PRINT_001: Receipt Generation Failed
- **Cause**: PDF generation error
- **Solution**: Check order data completeness, verify settings

### Error Logging

#### Enable Debug Mode
```typescript
// In development environment
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

if (DEBUG) {
  console.log('Debug info:', data);
}
```

#### Capture Error Details
```typescript
const handleError = (error, context) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  console.error('Error captured:', errorInfo);
  
  // Send to logging service if configured
  // logError(errorInfo);
};
```

## Recovery Procedures

### System Recovery

#### 1. Soft Reset
- Refresh browser page
- Clear browser cache
- Logout and login again

#### 2. Hard Reset
- Clear all browser data for the site
- Restart browser
- Check for system updates

#### 3. Data Recovery
```sql
-- Backup current data
CREATE TABLE backup_menu_items AS SELECT * FROM pos_menu_items;
CREATE TABLE backup_orders AS SELECT * FROM pos_orders;

-- Restore from backup if needed
INSERT INTO pos_menu_items SELECT * FROM backup_menu_items;
```

### Emergency Procedures

#### If System is Completely Down
1. **Check Supabase status**: Visit status.supabase.com
2. **Use offline mode**: If available, continue with local data
3. **Manual backup**: Record current orders on paper
4. **Contact support**: Report system outage immediately

#### If Data is Lost
1. **Don't panic**: Most data is backed up automatically
2. **Check recent backups**: Restore from latest backup
3. **Recovery tools**: Use database recovery procedures
4. **Professional help**: Contact technical support

---
*For issues not covered here, contact your system administrator or technical support team.*