import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Menu as MenuIcon, 
  ShoppingCart, 
  BarChart3, 
  Palette,
  Calendar,
  IndianRupee,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  Package,
  Clock,
  Download,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccountDetailsModalProps {
  accountId: string;
  accountName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AccountDetails {
  account: any;
  settings: any;
  subscription: any;
  telemetry: any;
  digital_menu: any;
  active_theme: any;
}

interface MenuData {
  menu_items: any[];
  categories: string[];
}

interface OrdersData {
  orders: any[];
  total_count: number;
}

interface AnalyticsData {
  summary: {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    unique_items_sold: number;
  };
  daily_revenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  top_items: Array<{
    item_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  accountId,
  accountName,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const { toast } = useToast();

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_account_full_details', {
        p_account_id: accountId
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (result.success) {
        setAccountDetails(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch account details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_account_menu', {
        p_account_id: accountId
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (result.success) {
        setMenuData(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch menu data',
        variant: 'destructive'
      });
    }
  };

  const fetchOrdersData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_account_orders', {
        p_account_id: accountId,
        p_limit: 50
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (result.success) {
        setOrdersData(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch orders data',
        variant: 'destructive'
      });
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_account_analytics', {
        p_account_id: accountId,
        p_days: 30
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (result.success) {
        setAnalyticsData(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (isOpen && accountId) {
      fetchAccountDetails();
    }
  }, [isOpen, accountId]);

  useEffect(() => {
    if (activeTab === 'menu' && !menuData) {
      fetchMenuData();
    } else if (activeTab === 'orders' && !ordersData) {
      fetchOrdersData();
    } else if (activeTab === 'analytics' && !analyticsData) {
      fetchAnalyticsData();
    }
  }, [activeTab]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'disabled': return 'bg-red-500';
      case 'expired': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {accountName} - Account Details
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <MenuIcon className="h-4 w-4" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="digital-menu" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Digital Menu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div>Loading...</div>
            ) : accountDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Restaurant Name:</span>
                      <span>{accountDetails.account?.restaurant_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Mobile Number:</span>
                      <span>{accountDetails.account?.mobile_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge className={`${getStatusColor(accountDetails.account?.status)} text-white`}>
                        {accountDetails.account?.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(accountDetails.account?.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Restaurant Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Restaurant Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {accountDetails.settings ? (
                      <>
                        <div className="flex items-start justify-between">
                          <span className="font-medium">Address:</span>
                          <span className="text-right">{accountDetails.settings.address || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Phone:</span>
                          <span>{accountDetails.settings.phone || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{accountDetails.settings.email || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">FSSAI:</span>
                          <span>{accountDetails.settings.fssai_number || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Tax Rate:</span>
                          <span>{accountDetails.settings.tax_rate || 0}%</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No settings configured</p>
                    )}
                  </CardContent>
                </Card>

                {/* Subscription Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {accountDetails.subscription ? (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium">Valid Until:</span>
                          <span>{formatDate(accountDetails.subscription.valid_until)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Days Remaining:</span>
                          <span className="font-bold text-orange-600">
                            {Math.max(0, Math.ceil((new Date(accountDetails.subscription.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
                          <Badge variant="secondary">{accountDetails.subscription.status}</Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No active subscription</p>
                    )}
                  </CardContent>
                </Card>

                {/* Business Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Business Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {accountDetails.telemetry ? (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Orders:</span>
                          <span className="font-bold">{accountDetails.telemetry.total_orders || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Revenue:</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(accountDetails.telemetry.total_revenue || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Last Active:</span>
                          <span>{accountDetails.telemetry.last_active ? formatDate(accountDetails.telemetry.last_active) : 'Never'}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No activity data</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertDescription>Failed to load account details</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            {menuData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Menu Items ({menuData.menu_items.length})</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Categories: {menuData.categories.length}</Badge>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menuData.menu_items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(item.price)}</TableCell>
                            <TableCell>
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(item.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div>Loading menu data...</div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {ordersData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recent Orders</h3>
                  <Badge variant="outline">Total: {ordersData.total_count}</Badge>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Payment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordersData.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {order.items.map((item: any, index: number) => (
                                  <div key={index}>
                                    {item.item_name} x{item.quantity}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{order.payment_method}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div>Loading orders data...</div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analyticsData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Orders (30d)</p>
                          <p className="text-2xl font-bold">{analyticsData.summary.total_orders}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue (30d)</p>
                          <p className="text-2xl font-bold">{formatCurrency(analyticsData.summary.total_revenue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Order</p>
                          <p className="text-2xl font-bold">{formatCurrency(analyticsData.summary.average_order_value)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Items Sold</p>
                          <p className="text-2xl font-bold">{analyticsData.summary.unique_items_sold}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Quantity Sold</TableHead>
                          <TableHead>Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsData.top_items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.item_name}</TableCell>
                            <TableCell>{item.quantity_sold}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(item.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div>Loading analytics data...</div>
            )}
          </TabsContent>

          <TabsContent value="digital-menu" className="space-y-4">
            {accountDetails?.digital_menu ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Digital Menu Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={accountDetails.digital_menu.is_active ? "default" : "secondary"}>
                        {accountDetails.digital_menu.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Public URL:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {accountDetails.digital_menu.public_url_slug}
                        </code>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">QR Code:</span>
                      <Badge variant={accountDetails.digital_menu.qr_code_generated ? "default" : "secondary"}>
                        {accountDetails.digital_menu.qr_code_generated ? 'Generated' : 'Not Generated'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {accountDetails.active_theme && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Active Theme
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Theme Name:</span>
                        <Badge variant="outline">{accountDetails.active_theme.theme_name}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Custom Colors:</span>
                        <span>{Object.keys(accountDetails.active_theme.custom_colors || {}).length > 0 ? 'Yes' : 'No'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>Digital menu not configured for this account</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};