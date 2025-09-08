# System Architecture

This document outlines the technical architecture of the Restaurant POS System.

## Overview

The system follows a modern client-server architecture with React frontend and Supabase backend, designed for real-time operations with offline fallback capabilities.

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Supabase BaaS  │◄──►│   PostgreSQL    │
│                 │    │                  │    │   Database      │
│  - Components   │    │  - Auth          │    │                 │
│  - State Mgmt   │    │  - RPC Functions │    │  - Tables       │
│  - Local Cache  │    │  - Real-time     │    │  - Functions    │
│  - PDF Gen      │    │  - Storage       │    │  - Triggers     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   ├── MenuManager.tsx     # Menu management interface
│   ├── ReceiptPreview.tsx  # Receipt generation and preview
│   ├── ReportsSection.tsx  # Analytics and reporting
│   ├── POSLoginScreen.tsx  # POS user authentication
│   ├── AdminLoginScreen.tsx # Admin authentication
│   └── SuperAdminDashboard.tsx # Super admin interface
├── pages/
│   ├── Index.tsx          # Main application container
│   └── NotFound.tsx       # 404 error page
├── hooks/
│   └── use-mobile.tsx     # Mobile detection hook
├── lib/
│   ├── utils.ts           # Utility functions
│   └── pdf.ts             # PDF generation utilities
└── integrations/
    └── supabase/          # Supabase client and types
```

### State Management Strategy

#### Local State (React hooks)
- **Component State**: Form inputs, UI toggles, temporary data
- **Cart Management**: Shopping cart items and quantities
- **Navigation State**: Active tabs, dialog visibility

#### Browser Storage
- **localStorage**: Persistent data (settings, cached menu items)
- **sessionStorage**: Session-specific data (current user, temp data)

#### Server State (Supabase)
- **Real-time Sync**: Menu items, orders, settings
- **Authentication**: User sessions and permissions
- **Persistent Storage**: All business data

### Key Design Patterns

#### 1. Container-Presenter Pattern
```tsx
// Container Component (Index.tsx)
const BillingApp = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  
  // Business logic here
  
  return <MenuManager data={data} onUpdate={setData} />;
};

// Presenter Component (MenuManager.tsx)
const MenuManager = ({ data, onUpdate }) => {
  // UI logic only
  return <div>{/* Render UI */}</div>;
};
```

#### 2. Custom Hooks Pattern
```tsx
// Encapsulate complex logic
const useOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  
  const addOrder = useCallback((order) => {
    // Order processing logic
  }, []);
  
  return { orders, addOrder };
};
```

#### 3. Error Boundary Pattern
```tsx
// Graceful error handling
try {
  await processOrder(orderData);
  toast.success("Order processed successfully");
} catch (error) {
  console.error("Order processing failed:", error);
  toast.error("Failed to process order");
}
```

## Backend Architecture (Supabase)

### Database Layer
- **PostgreSQL**: Primary data storage
- **Row Level Security (RLS)**: Data access control
- **Triggers**: Automated data processing
- **Indexes**: Query optimization

### Authentication Layer
- **JWT Tokens**: Stateless authentication
- **Custom Functions**: Role-based access control
- **Session Management**: Automatic token refresh

### API Layer (RPC Functions)
- **pos_login**: POS user authentication
- **admin_login**: Admin user authentication
- **save_settings**: Settings persistence
- **save_menu**: Menu data management
- **create_order**: Order processing
- **get_analytics**: Sales data aggregation

### Real-time Layer
- **WebSocket Connections**: Live data updates
- **Change Streams**: Database change notifications
- **Subscription Management**: Client connection handling

## Data Flow Architecture

### 1. Authentication Flow
```
User Input → Login Component → Supabase Auth → JWT Token → App State
```

### 2. Order Processing Flow
```
Cart Items → Validation → Order Creation → Database Storage → Receipt Generation
```

### 3. Menu Management Flow
```
Admin Input → Form Validation → Local State → Supabase RPC → Database Update → UI Refresh
```

### 4. Reporting Flow
```
Date Range → Analytics Query → Data Processing → Chart Generation → Export Options
```

## Security Architecture

### Frontend Security
- **Input Validation**: Client-side validation with zod schemas
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Same-origin policy enforcement
- **Secure Storage**: Sensitive data encrypted in localStorage

### Backend Security
- **Authentication**: JWT-based authentication
- **Authorization**: Row Level Security (RLS) policies
- **Data Validation**: Server-side validation in RPC functions
- **SQL Injection**: Parameterized queries and RPC functions

### Access Control Matrix
```
Role          | POS Functions | Menu Mgmt | Reports | Settings | User Mgmt
-------------|---------------|-----------|---------|----------|----------
POS User     | ✓             | View Only | Limited | None     | None
Admin        | ✓             | ✓         | ✓       | ✓        | Limited
Super Admin  | ✓             | ✓         | ✓       | ✓        | ✓
```

## Performance Architecture

### Frontend Optimization
- **Code Splitting**: Lazy loading of route components
- **Bundle Optimization**: Tree shaking and minification
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Large list optimization (when needed)

### Backend Optimization
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed queries and efficient joins
- **Caching**: Server-side caching for frequent queries
- **CDN**: Static asset delivery optimization

### Caching Strategy
```
Level 1: Browser Cache (Static Assets)
Level 2: Component State (Active Session Data)
Level 3: localStorage (User Preferences)
Level 4: Supabase Cache (Query Results)
Level 5: Database (Persistent Storage)
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Frontend**: Can be deployed to multiple CDN edges
- **Database Scaling**: Supabase handles automatic scaling
- **Load Balancing**: Built into Supabase infrastructure

### Vertical Scaling
- **Component Optimization**: Efficient rendering patterns
- **Memory Management**: Proper cleanup of subscriptions
- **Database Tuning**: Optimized queries and indexes

## Deployment Architecture

### Development Environment
```
Local Development → Vite Dev Server → Supabase Local → Hot Reload
```

### Production Environment
```
Source Code → Build Process → CDN Deployment → Supabase Production
```

### CI/CD Pipeline
1. **Code Commit**: Git repository push
2. **Build Process**: Vite production build
3. **Testing**: Automated test suite
4. **Deployment**: Automatic deployment to CDN
5. **Health Check**: Post-deployment verification

## Monitoring and Observability

### Frontend Monitoring
- **Error Tracking**: Console error logging
- **Performance Metrics**: Core Web Vitals
- **User Analytics**: Usage pattern tracking
- **Real-time Debugging**: Development tools integration

### Backend Monitoring
- **Database Metrics**: Query performance and resource usage
- **API Monitoring**: RPC function response times
- **Error Logging**: Server-side error tracking
- **Security Monitoring**: Authentication failure tracking

---
*This architecture is designed for reliability, scalability, and maintainability while providing excellent user experience.*