import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import burgerImage from "@/assets/burger.jpg";
import pizzaImage from "@/assets/pizza.jpg";
import pastaImage from "@/assets/pasta.jpg";
import cokeImage from "@/assets/coke.jpg";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

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

const menuItems: MenuItem[] = [
  { id: "1", name: "Classic Burger", price: 120, image: burgerImage, category: "Mains" },
  { id: "2", name: "Margherita Pizza", price: 250, image: pizzaImage, category: "Mains" },
  { id: "3", name: "Creamy Pasta", price: 180, image: pastaImage, category: "Mains" },
  { id: "4", name: "Coca Cola", price: 60, image: cokeImage, category: "Beverages" },
];

export default function BillingApp() {
  const [activeTab, setActiveTab] = useState("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

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
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processOrder = (paymentMethod: string) => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before processing order.",
        variant: "destructive"
      });
      return;
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total: getTotalPrice(),
      paymentMethod,
      timestamp: new Date(),
      status: "Completed"
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
    setCart([]);
    toast({
      title: "Order processed successfully",
      description: `Order #${newOrder.id} has been completed.`,
    });
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sales data for charts
  const salesByPayment = [
    { name: "Cash", value: orders.filter(o => o.paymentMethod === "cash").length, fill: "hsl(var(--primary))" },
    { name: "UPI", value: orders.filter(o => o.paymentMethod === "upi").length, fill: "hsl(var(--success))" },
    { name: "Card", value: orders.filter(o => o.paymentMethod === "card").length, fill: "hsl(var(--info))" },
  ];

  const dailySales = [
    { day: "Mon", sales: 1200 },
    { day: "Tue", sales: 800 },
    { day: "Wed", sales: 1500 },
    { day: "Thu", sales: 900 },
    { day: "Fri", sales: 2100 },
    { day: "Sat", sales: 1800 },
    { day: "Sun", sales: 1400 },
  ];

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
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Restaurant POS</h1>
              <p className="text-muted-foreground">Manage your restaurant operations</p>
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
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card shadow-md rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Today's Orders</p>
                    <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-card shadow-md rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold text-foreground">₹{orders.reduce((sum, order) => sum + order.total, 0)}</p>
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
                    <p className="text-muted-foreground text-sm mb-2">₹{item.price}</p>
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
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-lg text-foreground">Total: ₹{getTotalPrice()}</span>
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
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Sales Reports</h2>
            
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-foreground">Payment Methods</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByPayment}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                      >
                        {salesByPayment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-foreground">Daily Sales</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySales}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sales" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + order.total, 0) / orders.length) : 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Menu Management */}
        <TabsContent value="menu">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Menu Items</h2>
            
            <div className="space-y-3">
              {menuItems.map((item) => (
                <Card key={item.id} className="rounded-2xl shadow-md">
                  <CardContent className="p-4 flex items-center gap-4">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-xl"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-muted-foreground text-sm">{item.category}</p>
                      <p className="font-medium text-primary">₹{item.price}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        {order.timestamp.toLocaleDateString()} {order.timestamp.toLocaleTimeString()}
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
            <h2 className="text-xl font-bold text-foreground mb-4">Settings</h2>
            
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-foreground">Restaurant Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Restaurant Name</label>
                    <Input placeholder="My Restaurant" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Address</label>
                    <Input placeholder="Restaurant Address" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Phone</label>
                    <Input placeholder="+91 12345 67890" className="rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-foreground">Tax Settings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">GST Rate</span>
                    <Select>
                      <SelectTrigger className="w-24 rounded-xl">
                        <SelectValue placeholder="18%" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}