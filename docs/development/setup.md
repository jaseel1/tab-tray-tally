# Development Setup Guide

This guide will help you set up a local development environment for the Restaurant POS System.

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Modern Browser** (Chrome, Firefox, Safari, Edge)
- **Code Editor** (VS Code recommended)

### Recommended Tools
- **VS Code Extensions**:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint
- **Browser Extensions**:
  - React Developer Tools
  - Redux DevTools (if using Redux)

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd restaurant-pos-system
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Settings
VITE_ENV=development
VITE_DEBUG=true

# Optional: Custom API URLs
VITE_API_BASE_URL=https://your-api.com
```

### 4. Supabase Setup
1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Database Setup**:
   - Run the migration scripts (see Database Setup section)
   - Set up Row Level Security policies
   - Create initial admin user

3. **Configure Local Environment**:
   - Update `.env` with your Supabase credentials
   - Test connection with a simple query

## Development Workflow

### Starting the Development Server
```bash
# Start Vite dev server
npm run dev

# Or with yarn
yarn dev
```

The application will be available at `http://localhost:5173` (or next available port).

### Development Scripts
```json
{
  "dev": "vite",                    // Start development server
  "build": "tsc && vite build",     // Build for production
  "preview": "vite preview",        // Preview production build
  "lint": "eslint . --ext ts,tsx",  // Run ESLint
  "lint:fix": "eslint . --ext ts,tsx --fix", // Fix linting issues
  "type-check": "tsc --noEmit"      // Type check without building
}
```

## Project Structure Deep Dive

### Source Code Organization
```
src/
├── components/               # React components
│   ├── ui/                  # Reusable UI components (shadcn/ui)
│   │   ├── button.tsx       # Button component with variants
│   │   ├── card.tsx         # Card layouts
│   │   ├── dialog.tsx       # Modal dialogs
│   │   └── ...              # Other UI primitives
│   ├── MenuManager.tsx      # Menu item management
│   ├── ReceiptPreview.tsx   # Receipt display and printing
│   ├── ReportsSection.tsx   # Analytics and reporting
│   └── ...                  # Feature-specific components
├── pages/                   # Page components
│   ├── Index.tsx            # Main POS application
│   └── NotFound.tsx         # 404 error page
├── hooks/                   # Custom React hooks
│   ├── use-mobile.tsx       # Mobile device detection
│   └── use-toast.ts         # Toast notifications
├── lib/                     # Utility libraries
│   ├── utils.ts             # General utilities
│   └── pdf.ts               # PDF generation helpers
├── integrations/            # External service integrations
│   └── supabase/            # Supabase configuration
│       ├── client.ts        # Supabase client setup
│       └── types.ts         # Database type definitions
├── assets/                  # Static assets
│   ├── pizza.jpg            # Menu item images
│   └── ...                  # Other images
├── index.css                # Global styles and CSS variables
└── main.tsx                 # Application entry point
```

### Configuration Files
```
├── tailwind.config.ts       # Tailwind CSS configuration
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables
```

## Database Setup

### 1. Migration Scripts
Run these SQL scripts in your Supabase SQL editor:

```sql
-- Create tables (see database-schema.md for complete scripts)
-- Run in order:
-- 1. Create tables
-- 2. Set up RLS policies
-- 3. Create functions and triggers
-- 4. Insert initial data
```

### 2. Initial Data Setup
```sql
-- Create initial admin user
INSERT INTO admin_users (username, password_hash, role)
VALUES ('admin', '$2a$10$...', 'admin');

-- Create default POS account
INSERT INTO pos_accounts (account_name, password_hash)
VALUES ('cashier01', '$2a$10$...');

-- Add sample menu items
INSERT INTO pos_menu_items (name, price, category)
VALUES 
  ('Margherita Pizza', 12.99, 'Pizza'),
  ('Cheeseburger', 8.99, 'Burgers'),
  ('Coca Cola', 2.99, 'Drinks');

-- Configure default settings
INSERT INTO pos_settings (restaurant_name, gst_rate)
VALUES ('Development Restaurant', 18.00);
```

### 3. Environment-Specific Setup
**Development:**
- Use test data and sample menu items
- Enable debug logging
- Disable email notifications

**Staging:**
- Mirror production data structure
- Use staging Supabase project
- Enable limited logging

**Production:**
- Use production Supabase project
- Enable all security features
- Configure monitoring and backups

## Development Best Practices

### Code Style Guidelines

#### TypeScript
```typescript
// Use explicit types for props
interface MenuItemProps {
  item: MenuItem;
  onEdit: (id: string) => void;
  readOnly?: boolean;
}

// Use proper error handling
try {
  const result = await saveMenuItem(item);
  toast.success("Item saved successfully");
} catch (error) {
  console.error("Save failed:", error);
  toast.error("Failed to save item");
}
```

#### React Components
```tsx
// Use functional components with hooks
const MenuManager: React.FC<MenuManagerProps> = ({ 
  items, 
  onItemsChange, 
  readOnly = false 
}) => {
  // Group related state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use useCallback for event handlers
  const handleSubmit = useCallback(async (data: FormData) => {
    // Implementation
  }, [dependencies]);
  
  return (
    // JSX implementation
  );
};
```

#### CSS and Styling
```tsx
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 border-b">
  <h2 className="text-lg font-semibold">Menu Items</h2>
  <Button variant="outline" size="sm">
    Add Item
  </Button>
</div>

// Use CSS custom properties for theming
// In index.css:
:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
}

// In components:
<div className="bg-primary text-primary-foreground" />
```

### Component Development Guidelines

#### 1. Component Structure
```tsx
// Import order: React, third-party, local
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Props interface
interface ComponentProps {
  // Props definition
}

// Component implementation
const Component: React.FC<ComponentProps> = (props) => {
  // Hooks
  // Event handlers
  // Render logic
};

// Export
export default Component;
```

#### 2. State Management
```tsx
// Group related state
const [formData, setFormData] = useState({
  name: '',
  price: 0,
  category: ''
});

// Use reducers for complex state
const [state, dispatch] = useReducer(reducer, initialState);

// Extract custom hooks for reusable logic
const useMenuItems = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  // Logic here
  return { items, addItem, removeItem, updateItem };
};
```

#### 3. Error Handling
```tsx
// Component-level error boundaries
const ComponentWithErrorBoundary = () => {
  const [error, setError] = useState<string | null>(null);
  
  if (error) {
    return <ErrorFallback error={error} onRetry={() => setError(null)} />;
  }
  
  // Normal component render
};

// Async operation error handling
const handleAsyncOperation = async () => {
  try {
    setLoading(true);
    await operation();
    toast.success("Operation successful");
  } catch (error) {
    console.error("Operation failed:", error);
    toast.error("Operation failed");
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Testing Setup

#### Unit Testing with Vitest
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

#### Test Structure
```typescript
// Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Component from './Component';

test('should render component correctly', () => {
  render(<Component />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});

test('should handle user interaction', async () => {
  const mockHandler = vi.fn();
  render(<Component onAction={mockHandler} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(mockHandler).toHaveBeenCalled();
});
```

#### E2E Testing with Playwright
```bash
npm install -D @playwright/test
```

```typescript
// e2e/pos-operations.spec.ts
import { test, expect } from '@playwright/test';

test('should process order successfully', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="billing-tab"]');
  await page.click('[data-testid="menu-item-pizza"]');
  await page.click('[data-testid="process-order"]');
  
  await expect(page.locator('[data-testid="receipt-preview"]')).toBeVisible();
});
```

## Debugging and Development Tools

### Browser DevTools
- **React DevTools**: Inspect component hierarchy and state
- **Network Tab**: Monitor API calls and responses
- **Console**: Check for errors and debug logging
- **Application Tab**: Inspect localStorage and sessionStorage

### VS Code Configuration
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Environment Variables
```env
# Debug mode
VITE_DEBUG=true

# API endpoints
VITE_API_URL=http://localhost:3000/api

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_OFFLINE_MODE=false
```

## Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

### Code Splitting
```tsx
// Lazy load components
const ReportsSection = lazy(() => import('./ReportsSection'));

// Use Suspense for loading states
<Suspense fallback={<Loading />}>
  <ReportsSection />
</Suspense>
```

### Optimization Techniques
- Use `React.memo` for expensive components
- Implement virtual scrolling for large lists
- Optimize images with proper formats and sizes
- Use service workers for caching

## Common Development Issues

### TypeScript Errors
```bash
# Check types without building
npm run type-check

# Common fixes:
# 1. Update @types packages
# 2. Add proper type annotations
# 3. Use type assertions carefully
```

### Tailwind CSS Issues
```bash
# Rebuild Tailwind cache
rm -rf node_modules/.cache
npm install

# Check Tailwind configuration
npx tailwindcss-cli@latest init --full
```

### Supabase Connection Issues
```typescript
// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('pos_settings').select('*').limit(1);
    console.log('Connection test:', { data, error });
  } catch (err) {
    console.error('Connection failed:', err);
  }
};
```

---
*This setup guide ensures a smooth development experience with proper tooling and best practices.*