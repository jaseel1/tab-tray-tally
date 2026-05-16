import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrderEditDialog } from '@/components/OrderEditDialog';
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
  Upload,
  ExternalLink,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildMenuCsv, parseMenuCsv, downloadCsv } from '@/lib/menu-csv';

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
  const [orderEditDialog, setOrderEditDialog] = useState<{
    isOpen: boolean;
    order: { id: string; order_number: string; payment_method: string; total_amount: number } | null;
  }>({ isOpen: false, order: null });
  const [deleteOrder, setDeleteOrder] = useState<{ id: string; order_number: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteOrder = async () => {
    if (!deleteOrder) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.rpc('admin_delete_order', {
        p_account_id: accountId,
        p_order_id: deleteOrder.id,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.message || 'Failed to delete order');
      toast({ title: 'Order deleted', description: `${deleteOrder.order_number} removed.` });
      setDeleteOrder(null);
      setOrdersData(null);
      setAnalyticsData(null);
      await Promise.all([fetchOrdersData(), fetchAnalyticsData(), fetchAccountDetails()]);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete order', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

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

                <TableCountSetting accountId={accountId} initial={accountDetails.settings?.table_count || 0} />
                <OrderEditingSetting
                  accountId={accountId}
                  initialMode={accountDetails.settings?.order_edit_mode ?? null}
                  initialMinutes={accountDetails.settings?.order_edit_minutes ?? 30}
                />
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
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">Menu Items ({menuData.menu_items.length})</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Categories: {menuData.categories.length}</Badge>
                    <MenuImportExport
                      accountId={accountId}
                      items={menuData.menu_items}
                      restaurantName={accountDetails?.account?.restaurant_name || 'menu'}
                      onImported={fetchMenuData}
                    />
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
                          <TableHead>Actions</TableHead>
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
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setOrderEditDialog({
                                  isOpen: true,
                                  order: {
                                    id: order.id,
                                    order_number: order.order_number,
                                    payment_method: order.payment_method,
                                    total_amount: parseFloat(order.total_amount)
                                  }
                                })}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
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

      <OrderEditDialog
        open={orderEditDialog.isOpen}
        onOpenChange={(open) => setOrderEditDialog({ isOpen: open, order: orderEditDialog.order })}
        order={orderEditDialog.order}
        accountId={accountId}
        isAdmin={true}
        onSuccess={() => {
          fetchOrdersData();
        }}
      />
    </Dialog>
  );
};

const MenuImportExport: React.FC<{
  accountId: string;
  items: Array<Record<string, any>>;
  restaurantName: string;
  onImported: () => void;
}> = ({ accountId, items, restaurantName, onImported }) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const csv = buildMenuCsv(items);
    const safe = restaurantName.replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'menu';
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`menu_export_${safe}_${date}.csv`, csv);
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const { items: parsed, errors } = parseMenuCsv(text);
      if (parsed.length === 0) {
        toast({ title: 'Import failed', description: errors[0] || 'No valid rows found', variant: 'destructive' });
        return;
      }
      const ok = window.confirm(
        `This will ERASE the current menu and replace it with ${parsed.length} item(s)${
          errors.length ? ` (${errors.length} row(s) skipped)` : ''
        }. Continue?`,
      );
      if (!ok) return;

      const { data, error } = await supabase.rpc('replace_account_menu', {
        p_account_id: accountId,
        p_items: parsed as any,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.message || 'Import failed');
      toast({
        title: 'Menu imported',
        description: `${result.inserted_count} item(s) loaded${errors.length ? `, ${errors.length} skipped` : ''}.`,
      });
      onImported();
    } catch (e: any) {
      toast({ title: 'Import failed', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button size="sm" variant="outline" onClick={handleExport} disabled={busy}>
        <Download className="h-4 w-4 mr-1" /> Export CSV
      </Button>
      <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
        <Upload className="h-4 w-4 mr-1" /> {busy ? 'Importing...' : 'Import CSV'}
      </Button>
    </>
  );
};


const TableCountSetting: React.FC<{ accountId: string; initial: number }> = ({ accountId, initial }) => {
  const [count, setCount] = useState<number>(initial);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setCount(initial); }, [initial]);

  const save = async () => {
    if (count < 0 || count > 10) {
      toast({ title: 'Invalid', description: 'Number of tables must be 0-10', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data } = await supabase.rpc('update_pos_table_count', { p_account_id: accountId, p_count: count });
      const res = data as any;
      if (res?.success) {
        toast({ title: 'Saved', description: `Tables set to ${count}` });
      } else {
        toast({ title: 'Error', description: res?.message || 'Failed to save', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Table Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="text-sm">Number of tables (0–10)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            max={10}
            value={count}
            onChange={(e) => setCount(Math.max(0, Math.min(10, parseInt(e.target.value || '0', 10))))}
          />
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Set 0 to disable dine-in mode. Reducing this number removes higher-numbered free tables.
        </p>
      </CardContent>
    </Card>
  );
};

const OrderEditingSetting: React.FC<{
  accountId: string;
  initialMode: string | null;
  initialMinutes: number;
}> = ({ accountId, initialMode, initialMinutes }) => {
  const [mode, setMode] = useState<string>(initialMode ?? 'default');
  const [minutes, setMinutes] = useState<number>(initialMinutes || 30);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMode(initialMode ?? 'default');
    setMinutes(initialMinutes || 30);
  }, [initialMode, initialMinutes]);

  const save = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('update_account_edit_settings', {
        p_account_id: accountId,
        p_mode: mode === 'default' ? null : mode,
        p_minutes: mode === 'time_limited' ? minutes : null,
      });
      if (error) throw error;
      const res = data as any;
      if (res?.success) {
        toast({ title: 'Saved', description: 'Order editing settings updated' });
      } else {
        toast({ title: 'Error', description: res?.message || 'Failed to save', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Order Editing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="text-sm">Mode</Label>
        <select
          className="w-full border rounded-md h-10 px-2 bg-background"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="default">Use global default</option>
          <option value="off">Off — editing disabled</option>
          <option value="unlimited">Unlimited — always editable</option>
          <option value="time_limited">Time limited</option>
        </select>
        {mode === 'time_limited' && (
          <div>
            <Label className="text-sm">Minutes after creation</Label>
            <Input
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Math.min(1440, parseInt(e.target.value || '30', 10))))}
            />
          </div>
        )}
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        <p className="text-xs text-muted-foreground">
          Overrides the global Order Editing default for this restaurant only.
        </p>
      </CardContent>
    </Card>
  );
};