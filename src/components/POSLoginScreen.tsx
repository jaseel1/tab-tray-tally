import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface POSLoginScreenProps {
  onLoginSuccess: (accountData: any) => void;
}

export default function POSLoginScreen({ onLoginSuccess }: POSLoginScreenProps) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('pos_login', {
        p_mobile_number: mobileNumber,
        p_pin: pin
      });

      if (rpcError) {
        throw new Error('Login failed');
      }

      const result = data as any;
      
      if (result.success) {
        onLoginSuccess(result);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">POS Login</CardTitle>
          <p className="text-muted-foreground">Enter your mobile number and PIN</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">8-Digit PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 8-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10"
                  required
                  maxLength={8}
                  minLength={8}
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login to POS
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}