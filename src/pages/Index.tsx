import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Home, 
  Receipt, 
  BarChart3, 
  Menu, 
  ClipboardList, 
  Settings, 
  Plus, 
  Minus,
  ShoppingCart,
  CreditCard,
  Trash2,
  Search,
  Printer,
  Download,
  Calendar,
  FileText,
  Shield,
  LogOut,
  Save,
  TrendingUp,
  Store,
  Mail,
  Phone,
  MapPin,
  Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MenuManager, MenuItem } from "@/components/MenuManager";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import ReportsSection from "@/components/ReportsSection";
import { generateDailySalesPDF, generateMonthlySalesPDF, RestaurantSettings } from "@/lib/pdf";
import POSLoginScreen from "@/components/POSLoginScreen";
import AdminLoginScreen from "@/components/AdminLoginScreen";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";
import { supabase } from "@/integrations/supabase/client";

import burgerImage from "@/assets/burger.jpg";
import pizzaImage from "@/assets/pizza.jpg";
import pastaImage from "@/assets/pasta.jpg";
import cokeImage from "@/assets/coke.jpg";

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  timestamp: Date;
  status: string;
}

interface EnhancedRestaurantSettings extends RestaurantSettings {
  fssaiNumber?: string;
  gstInclusive?: boolean;
}

interface ItemSalesData {
  item_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

const defaultMenuItems: MenuItem[] = [
  { id: "1", name: "Classic Burger", price: 120, image: burgerImage, category: "Mains" },
  { id: "2", name: "Margherita Pizza", price: 250, image: pizzaImage, category: "Mains" },
  { id: "3", name: "Creamy Pasta", price: 180, image: pastaImage, category: "Mains" },
  { id: "4", name: "Coca Cola", price: 60, image: cokeImage, category: "Beverages" },
];

const defaultSettings: EnhancedRestaurantSettings = {
  name: "My Restaurant",
  address: "123 Restaurant Street, City",
  phone: "+91 12345 67890",
  email: "info@myrestaurant.com",
  taxRate: 0,
  fssaiNumber: "",
  gstInclusive: false
};

export default function BillingApp() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [posAccountData, setPosAccountData] = useState<any>(null);
  
  // Existing states
  const [activeTab, setActiveTab] = useState("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<EnhancedRestaurantSettings>(defaultSettings);
  const [searchTerm, setSearchTerm] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<{ isOpen: boolean; order: Order | null }>({
    isOpen: false,
    order: null
  });
  const [categories, setCategories] = useState<string[]>(['General']);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [itemSalesData, setItemSalesData] = useState<ItemSalesData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const { toast } = useToast();

  // Load data from server when account changes
  useEffect(() => {
    if (!posAccountData?.account_id) return;
    loadServerData();
  }, [posAccountData]);

  const loadServerData = async () => {
    if (!posAccountData?.account_id) return;
    
    setIsLoadingData(true);
    try {
      // Load settings
      const { data: settingsData, error: settingsError } = await supabase.rpc('get_pos_settings', {
        p_account_id: posAccountData.account_id
      });

      const settingsResult = settingsData as any;
      if (settingsResult?.success && settingsResult.data) {
        setSettings({
          name: settingsResult.data.restaurant_name,
          address: settingsResult.data.address || "",
          phone: settingsResult.data.phone || "",
          email: settingsResult.data.email || "",
          taxRate: settingsResult.data.tax_rate || 0,
          fssaiNumber: settingsResult.data.fssai_number || "",
          gstInclusive: settingsResult.data.gst_inclusive || false
        });
        setPrivacyMode(settingsResult.data.privacy_mode || false);
      } else {
        // Use default settings with account name
        setSettings({
          ...defaultSettings,
          name: posAccountData.restaurant_name
        });
      }

      // Load menu items
      const { data: menuData, error: menuError } = await supabase.rpc('list_menu_items', {
        p_account_id: posAccountData.account_id
      });

      const menuResult = menuData as any;
      if (menuResult?.success) {
        const serverItems = menuResult.data || [];
        setMenuItems(serverItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          category: item.category,
          image: item.image || ""
        })));
      } else {
        setMenuItems([]);
      }

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase.rpc('get_categories', {
        p_account_id: posAccountData.account_id
      });

      const categoriesResult = categoriesData as any;
      if (categoriesResult?.success) {
        setCategories(categoriesResult.data || ['General']);
      }

      // Load item sales analytics
      await loadItemSalesData();

      // Load orders
      const { data: ordersData } = await supabase.rpc('get_orders', {
        p_account_id: posAccountData.account_id
      });

      const ordersResult = ordersData as any;
      if (ordersResult?.success) {
        const serverOrders = ordersResult.data || [];
        setOrders(serverOrders.map((order: any) => ({
          id: order.order_number,
          items: order.items.map((item: any) => ({
            id: `${order.id}-${item.item_name}`, // Generate ID for cart items
            name: item.item_name,
            price: parseFloat(item.unit_price),
            quantity: item.quantity,
            category: "", // Not stored in order items
            image: ""
          })),
          total: parseFloat(order.total_amount),
          paymentMethod: order.payment_method,
          timestamp: new Date(order.created_at),
          status: "Completed"
        })));
      }

    } catch (error) {
      console.error('Error loading server data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load data from server. Using local data.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadItemSalesData = async () => {
    if (!posAccountData?.account_id) return;
    
    try {
      const { data: salesData } = await supabase.rpc('get_item_sales', {
        p_account_id: posAccountData.account_id,
        p_days: 30
      });

      const salesResult = salesData as any;
      if (salesResult?.success) {
        setItemSalesData(salesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const saveSettingsToServer = async () => {
    if (!posAccountData?.account_id || isSavingSettings) return;
    
    setIsSavingSettings(true);
    try {
      const { data, error } = await supabase.rpc('upsert_pos_settings', {
        p_account_id: posAccountData.account_id,
        p_restaurant_name: settings.name,
        p_address: settings.address,
        p_phone: settings.phone,
        p_email: settings.email,
        p_fssai_number: settings.fssaiNumber,
        p_tax_rate: settings.taxRate,
        p_gst_inclusive: settings.gstInclusive,
        p_privacy_mode: privacyMode
      });

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Settings saved",
          description: "Settings have been saved to server successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save settings to server.",
        variant: "destructive"
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveMenuToServer = async () => {
    if (!posAccountData?.account_id || isSavingMenu) return;
    
    setIsSavingMenu(true);
    try {
      // Save categories first
      await supabase.rpc('upsert_categories', {
        p_account_id: posAccountData.account_id,
        p_categories: categories
      });

      // Save each menu item and update with returned IDs
      const updatedItems = [];
      for (const item of menuItems) {
        const { data } = await supabase.rpc('upsert_menu_item', {
          p_account_id: posAccountData.account_id,
          p_name: item.name,
          p_price: item.price,
          p_category: item.category,
          p_item_id: item.id && item.id.length > 10 ? item.id : null, // Only pass valid UUIDs
          p_image: item.image
        });

        const result = data as any;
        if (result?.success) {
          updatedItems.push({ ...item, id: result.id });
        } else {
          updatedItems.push(item);
        }
      }
      
      // Update local state with server IDs
      setMenuItems(updatedItems);

      toast({
        title: "Menu saved",
        description: "Menu items have been saved to server successfully.",
      });
    } catch (error) {
      console.error('Error saving menu:', error);
      toast({
        title: "Error saving menu",
        description: "Failed to save menu to server.",
        variant: "destructive"
      });
    } finally {
      setIsSavingMenu(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    toast({
      title: "Item added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevCart.filter(cartItem => cartItem.id !== itemId);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    if (settings.gstInclusive || settings.taxRate === 0) {
      return subtotal;
    }
    
    // GST is extra
    const gstAmount = (subtotal * settings.taxRate) / 100;
    return subtotal + gstAmount;
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getGSTAmount = () => {
    if (settings.taxRate === 0) return 0;
    
    const subtotal = getSubtotal();
    
    if (settings.gstInclusive) {
      // Calculate GST from inclusive price
      return (subtotal * settings.taxRate) / (100 + settings.taxRate);
    } else {
      // Calculate GST as extra
      return (subtotal * settings.taxRate) / 100;
    }
  };

  const processOrder = async (paymentMethod: string) => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before processing order.",
        variant: "destructive"
      });
      return;
    }

    const orderTotal = getTotalPrice();
    const orderNumber = `ORD-${Date.now()}`;
    
    const newOrder: Order = {
      id: orderNumber,
      items: [...cart],
      total: orderTotal,
      paymentMethod,
      timestamp: new Date(),
      status: "Completed"
    };

    // Save to local state immediately
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    setCart([]);
    
    setReceiptPreview({ isOpen: true, order: newOrder });
    
    // Save to server
    if (posAccountData?.account_id) {
      try {
        const orderItems = cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        }));

        const { data } = await supabase.rpc('create_order', {
          p_account_id: posAccountData.account_id,
          p_order_number: orderNumber,
          p_total_amount: orderTotal,
          p_payment_method: paymentMethod,
          p_items: orderItems // Pass as array, not string
        });

        const orderResult = data as any;
        if (orderResult?.success) {
          // Refresh analytics data
          await loadItemSalesData();
        }
      } catch (error) {
        console.error('Error saving order to server:', error);
      }
    }
    
    toast({
      title: "Order processed successfully",
      description: `Order ${orderNumber} has been completed.`,
    });
  };

  const handleSettingsChange = (field: keyof EnhancedRestaurantSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoriesChange = (newCategories: string[]) => {
    setCategories(newCategories);
  };

  const generateDailyReport = (date?: Date) => {
    const targetDate = date || new Date();
    const pdf = generateDailySalesPDF(orders, targetDate, settings);
    pdf.save(`daily-report-${targetDate.toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Report Generated",
      description: "Daily sales report has been downloaded.",
    });
  };

  const generateMonthlyReport = (month?: number, year?: number) => {
    const now = new Date();
    const targetMonth = month ?? now.getMonth();
    const targetYear = year ?? now.getFullYear();
    const pdf = generateMonthlySalesPDF(orders, targetMonth, targetYear, settings);
    pdf.save(`monthly-report-${targetYear}-${String(targetMonth + 1).padStart(2, '0')}.pdf`);
    
    toast({
      title: "Report Generated", 
      description: "Monthly sales report has been downloaded.",
    });
  };

  const today = new Date();
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate.toDateString() === today.toDateString();
  });

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= weekStart && orderDate <= today;
  });
  const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= monthStart && orderDate <= today;
  });
  const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Authentication handlers
  const handlePOSLogin = (accountData: any) => {
    setIsLoggedIn(true);
    setPosAccountData(accountData);
    // Clear existing data first
    setOrders([]);
    setMenuItems([]);
    setCategories(['General']);
    setPrivacyMode(false);
    setSettings({
      name: accountData.restaurant_name,
      address: "",
      phone: "",
      email: "",
      taxRate: 0,
      fssaiNumber: "",
      gstInclusive: false
    });
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setPosAccountData(null);
    setShowAdminLogin(false);
    // Clear all state data
    setOrders([]);
    setMenuItems([]);
    setCategories(['General']);
    setPrivacyMode(false);
    setSettings(defaultSettings);
    setCart([]);
    setItemSalesData([]);
  };

  const getDaysRemaining = () => {
    if (!posAccountData?.license_valid_until) return 0;
    const validUntil = new Date(posAccountData.license_valid_until);
    const today = new Date();
    const diffTime = validUntil.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Show admin dashboard if admin is logged in
  if (isAdmin) {
    return <SuperAdminDashboard onLogout={handleLogout} />;
  }

  // Show admin login screen
  if (showAdminLogin) {
    return (
      <AdminLoginScreen 
        onLoginSuccess={handleAdminLogin}
        onBackToPOS={() => setShowAdminLogin(false)}
      />
    );
  }

  // Show POS login screen if not logged in
  if (!isLoggedIn) {
    return (
      <div className="relative">
        <POSLoginScreen onLoginSuccess={handlePOSLogin} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdminLogin(true)}
          className="absolute top-4 right-4 text-xs"
        >
          <Shield className="mr-1 h-3 w-3" />
          Admin
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface p-4 max-w-md mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 gap-1 bg-card shadow-lg rounded-2xl p-2 mb-4">
          <TabsTrigger value="home" className="flex flex-col items-center p-2 rounded-xl">
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </TabsTrigger>
          <TabsTrigger value="bill" className="flex flex-col items-center p-2 rounded-xl">
            <Receipt size={20} />
            <span className="text-xs mt-1">Bill</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex flex-col items-center p-2 rounded-xl">
            <BarChart3 size={20} />
            <span className="text-xs mt-1">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex flex-col items-center p-2 rounded-xl">
            <Menu size={20} />
            <span className="text-xs mt-1">Menu</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex flex-col items-center p-2 rounded-xl">
            <ClipboardList size={20} />
            <span className="text-xs mt-1">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex flex-col items-center p-2 rounded-xl">
            <Settings size={20} />
            <span className="text-xs mt-1">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Home Dashboard */}
        <TabsContent value="home">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Restaurant POS</h1>
                <p className="text-muted-foreground">Manage your restaurant operations</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Privacy</span>
                <Switch
                  checked={privacyMode}
                  onCheckedChange={setPrivacyMode}
                />
              </div>
            </div>
            
            <div className="grid gap-4">
              <Card 
                className="bg-gradient-primary shadow-lg rounded-2xl cursor-pointer hover:shadow-xl transition-shadow" 
                onClick={() => setActiveTab("bill")}
              >
                <CardContent className="p-6 text-center">
                  <Receipt className="mx-auto mb-3 text-primary-foreground" size={24} />
                  <p className="text-lg font-semibold text-primary-foreground">New Bill</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-accent shadow-lg rounded-2xl cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setActiveTab("reports")}
              >
                <CardContent className="p-6 text-center">
                  <BarChart3 className="mx-auto mb-3 text-primary-foreground" size={24} />
                  <p className="text-lg font-semibold text-primary-foreground">Reports</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-secondary shadow-lg rounded-2xl cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setActiveTab("menu")}
              >
                <CardContent className="p-6 text-center">
                  <Menu className="mx-auto mb-3 text-primary-foreground" size={24} />
                  <p className="text-lg font-semibold text-primary-foreground">Menu Management</p>
                </CardContent>
              </Card>

              {/* Item-wise Analytics Dashboard */}
              {itemSalesData.length > 0 && (
                <Card className="bg-card shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-foreground">
                      <TrendingUp className="mr-2" size={20} />
                      Top Selling Items (30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {itemSalesData.slice(0, 5).map((item, index) => (
                        <div key={item.item_name} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-foreground">{item.item_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.total_quantity} sold • {item.order_count} orders
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">₹{item.total_revenue}</p>
                            <Badge variant={index < 3 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card shadow-md rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Today's Orders</p>
                    <p className="text-2xl font-bold text-foreground">{todayOrders.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-card shadow-md rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {privacyMode ? "****" : `₹${orders.reduce((sum, order) => sum + order.total, 0)}`}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card shadow-md rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Weekly Sales</p>
                    <p className="text-2xl font-bold text-foreground">
                      {privacyMode ? "****" : `₹${weekRevenue.toFixed(2)}`}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card shadow-md rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Monthly Sales</p>
                    <p className="text-2xl font-bold text-foreground">
                      {privacyMode ? "****" : `₹${monthRevenue.toFixed(2)}`}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Billing Screen */}
        <TabsContent value="bill">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-2xl border-border"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="rounded-2xl overflow-hidden shadow-md">
                  <CardContent className="p-3">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-24 object-cover rounded-xl mb-2"
                    />
                    <h3 className="font-semibold text-sm mb-1 text-foreground">{item.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      ₹{item.price}
                      {settings.gstInclusive && settings.taxRate > 0 && (
                        <span className="text-xs ml-1">(incl. GST)</span>
                      )}
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => addToCart(item)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                    >
                      <Plus size={16} className="mr-1" />
                      Add
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <Card className="rounded-2xl shadow-lg bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg flex items-center text-foreground">
                      <ShoppingCart className="mr-2" size={20} />
                      Cart
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearCart}
                      className="rounded-xl"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded-xl">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{item.name}</p>
                          <p className="text-muted-foreground text-xs">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 rounded-full p-0"
                          >
                            <Minus size={12} />
                          </Button>
                          <span className="font-medium text-foreground w-6 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item)}
                            className="h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-foreground">Subtotal:</span>
                        <span className="text-foreground">₹{getSubtotal().toFixed(2)}</span>
                      </div>
                      {settings.taxRate > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            GST ({settings.taxRate}%{settings.gstInclusive ? " incl." : " extra"}):
                          </span>
                          <span className="text-muted-foreground">₹{getGSTAmount().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-bold text-lg text-foreground">Total:</span>
                        <span className="font-bold text-lg text-foreground">₹{getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        onClick={() => processOrder("cash")}
                        className="bg-success hover:bg-success/90 text-success-foreground rounded-xl"
                      >
                        Cash
                      </Button>
                      <Button 
                        onClick={() => processOrder("upi")}
                        className="bg-info hover:bg-info/90 text-info-foreground rounded-xl"
                      >
                        UPI
                      </Button>
                      <Button 
                        onClick={() => processOrder("card")}
                        className="bg-warning hover:bg-warning/90 text-warning-foreground rounded-xl"
                      >
                        Card
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Reports Screen */}
        <TabsContent value="reports">
          <ReportsSection 
            orders={orders} 
            settings={settings} 
            generateDailyReport={generateDailyReport}
            generateMonthlyReport={generateMonthlyReport}
          />
        </TabsContent>

        {/* Menu Management */}
        <TabsContent value="menu">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Menu Management</h2>
            <MenuManager 
              items={menuItems} 
              onItemsChange={setMenuItems}
              categories={categories}
              onCategoriesChange={handleCategoriesChange}
            />
            <div className="flex justify-end">
              <Button 
                onClick={saveMenuToServer}
                disabled={isSavingMenu || isLoadingData}
                size="sm"
                className="rounded-xl"
              >
                <Save className="mr-2 h-3 w-3" />
                {isSavingMenu ? "Saving..." : "Save Menu"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Orders History */}
        <TabsContent value="orders">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Order History</h2>
            
            {orders.length === 0 ? (
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-8 text-center">
                  <ClipboardList className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">No orders yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="rounded-2xl shadow-md">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-foreground">Order #{order.id}</h3>
                        <span className="text-sm bg-success text-success-foreground px-2 py-1 rounded-full">
                          {order.status}
                        </span>
                      </div>
                      
                       <div className="text-sm text-muted-foreground mb-2 flex justify-between items-center">
                         <span>{new Date(order.timestamp).toLocaleDateString()} {new Date(order.timestamp).toLocaleTimeString()}</span>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => setReceiptPreview({ isOpen: true, order })}
                           className="rounded-xl"
                         >
                           <Receipt size={14} className="mr-1" />
                           Print
                         </Button>
                       </div>
                      
                      <div className="space-y-1 mb-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-foreground">{item.name} x{item.quantity}</span>
                            <span className="text-foreground">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-semibold text-foreground">Total: ₹{order.total}</span>
                        <span className="text-sm text-muted-foreground capitalize">{order.paymentMethod}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Settings</h2>
              <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
            
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-foreground">
                    <Store className="mr-2 h-5 w-5" />
                    Restaurant Information
                  </CardTitle>
                  <Button 
                    onClick={saveSettingsToServer}
                    disabled={isSavingSettings || isLoadingData}
                    size="sm"
                    className="rounded-xl"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingSettings ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Restaurant Name</Label>
                  <Input 
                    value={settings.name}
                    onChange={(e) => handleSettingsChange('name', e.target.value)}
                    placeholder="My Restaurant" 
                    className="rounded-xl" 
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="mr-1 h-3 w-3" />
                    Address
                  </Label>
                  <Input 
                    value={settings.address}
                    onChange={(e) => handleSettingsChange('address', e.target.value)}
                    placeholder="Restaurant Address" 
                    className="rounded-xl" 
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center">
                    <Phone className="mr-1 h-3 w-3" />
                    Phone
                  </Label>
                  <Input 
                    value={settings.phone}
                    onChange={(e) => handleSettingsChange('phone', e.target.value)}
                    placeholder="+91 12345 67890" 
                    className="rounded-xl" 
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center">
                    <Mail className="mr-1 h-3 w-3" />
                    Email
                  </Label>
                  <Input 
                    value={settings.email}
                    onChange={(e) => handleSettingsChange('email', e.target.value)}
                    placeholder="info@restaurant.com" 
                    className="rounded-xl" 
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center">
                    <Hash className="mr-1 h-3 w-3" />
                    FSSAI Number (Optional)
                  </Label>
                  <Input 
                    value={settings.fssaiNumber || ""}
                    onChange={(e) => handleSettingsChange('fssaiNumber', e.target.value)}
                    placeholder="Enter FSSAI license number" 
                    className="rounded-xl" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* License Information */}
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-foreground flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  License Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Account</Label>
                    <div className="p-3 bg-muted rounded-xl">
                      <p className="font-medium">{posAccountData?.restaurant_name}</p>
                      <p className="text-sm text-muted-foreground">Mobile: {posAccountData?.mobile_number}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">License Status</Label>
                    <div className="p-3 bg-muted rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Valid Until</span>
                        <span className="font-medium">
                          {new Date(posAccountData?.license_valid_until).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Expires in</span>
                        <Badge variant={getDaysRemaining() > 30 ? "default" : getDaysRemaining() > 7 ? "secondary" : "destructive"}>
                          {getDaysRemaining()} days
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-foreground">GST Settings</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-foreground">GST Rate (%)</Label>
                    <Select
                      value={settings.taxRate?.toString() || "0"}
                      onValueChange={(value) => handleSettingsChange('taxRate', parseFloat(value))}
                    >
                      <SelectTrigger className="w-24 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-foreground">Price Includes GST</Label>
                      <p className="text-xs text-muted-foreground">
                        {settings.taxRate === 0 
                          ? "Enable GST rate to configure this option"
                          : settings.gstInclusive 
                            ? "GST is included in item prices" 
                            : "GST will be added extra"
                        }
                      </p>
                    </div>
                    <Switch
                      checked={settings.gstInclusive || false}
                      disabled={settings.taxRate === 0}
                      onCheckedChange={(value) => handleSettingsChange('gstInclusive', value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-foreground">Print Settings</h3>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Receipts are optimized for 58mm thermal printers
                  </p>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => {
                      // Test print functionality
                      const testOrder: Order = {
                        id: "TEST",
                        items: [{ id: "1", name: "Test Item", price: 10, quantity: 1, image: "", category: "Test" }],
                        total: 10,
                        paymentMethod: "cash",
                        timestamp: new Date(),
                        status: "Test"
                      };
                      setReceiptPreview({ isOpen: true, order: testOrder });
                    }}
                  >
                    <Printer className="mr-2" size={16} />
                    Test Print Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {receiptPreview.isOpen && receiptPreview.order && (
        <ReceiptPreview
          order={receiptPreview.order}
          settings={settings}
          isOpen={receiptPreview.isOpen}
          onClose={() => setReceiptPreview({ isOpen: false, order: null })}
        />
      )}
    </div>
  );
}
