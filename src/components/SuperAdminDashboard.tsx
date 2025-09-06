import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Settings, 
  Users, 
  Calendar, 
  IndianRupee,
  ShoppingCart,
  Power,
  PowerOff,
  LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface POSAccount {
  id: string;
  mobile_number: string;
  restaurant_name: string;
  status: string;
  license_valid_until: string;
  license_status: string;
  days_remaining: number;
  total_orders: number;
  total_revenue: number;
  last_active: string;
}

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

export default function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  const [accounts, setAccounts] = useState<POSAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    mobile_number: '',
    pin: '',
    restaurant_name: '',
    license_duration_days: 365
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_pos_accounts');
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase.rpc('create_pos_account', {
        p_mobile_number: newAccount.mobile_number,
        p_pin: newAccount.pin,
        p_restaurant_name: newAccount.restaurant_name,
        p_license_duration_days: newAccount.license_duration_days
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: 'Success',
          description: 'POS account created successfully'
        });
        setShowCreateDialog(false);
        setNewAccount({
          mobile_number: '',
          pin: '',
          restaurant_name: '',
          license_duration_days: 365
        });
        fetchAccounts();
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create account',
        variant: 'destructive'
      });
    }
  };

  const toggleAccountStatus = async (accountId: string) => {
    try {
      const { data, error } = await supabase.rpc('toggle_pos_account_status', {
        p_account_id: accountId
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: 'Success',
          description: `Account ${result.new_status}`
        });
        fetchAccounts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update account status',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'disabled': return 'bg-red-500';
      case 'expired': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getDaysRemainingColor = (days: number) => {
    if (days > 30) return 'text-green-600';
    if (days > 7) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage POS accounts and subscriptions</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Accounts</p>
                  <p className="text-2xl font-bold">{accounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Power className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Accounts</p>
                  <p className="text-2xl font-bold">
                    {accounts.filter(a => a.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">
                    {accounts.reduce((sum, a) => sum + (a.total_orders || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IndianRupee className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ₹{accounts.reduce((sum, a) => sum + Number(a.total_revenue || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">POS Accounts</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New POS Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    value={newAccount.mobile_number}
                    onChange={(e) => setNewAccount({...newAccount, mobile_number: e.target.value})}
                    required
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="pin">8-Digit PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={newAccount.pin}
                    onChange={(e) => setNewAccount({...newAccount, pin: e.target.value})}
                    required
                    maxLength={8}
                    minLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={newAccount.restaurant_name}
                    onChange={(e) => setNewAccount({...newAccount, restaurant_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">License Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newAccount.license_duration_days}
                    onChange={(e) => setNewAccount({...newAccount, license_duration_days: parseInt(e.target.value)})}
                    required
                    min={1}
                  />
                </div>
                <Button type="submit" className="w-full">Create Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.restaurant_name}</TableCell>
                    <TableCell>{account.mobile_number}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(account.status)} text-white`}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={getDaysRemainingColor(account.days_remaining)}>
                          {account.days_remaining} days remaining
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Until {new Date(account.license_valid_until).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{account.total_orders || 0}</TableCell>
                    <TableCell>₹{Number(account.total_revenue || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.last_active ? new Date(account.last_active).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAccountStatus(account.id)}
                      >
                        {account.status === 'active' ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}