import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MenuThemeSelector } from "./MenuThemeSelector";
import { generateQRCode, downloadQRCode, downloadSVG, generateQRCodeSVG } from "@/lib/qr-generator";
import { generateDigitalMenuPDF } from "@/lib/pdf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Download, 
  ExternalLink, 
  QrCode, 
  Printer, 
  Eye,
  Loader2,
  RefreshCw
} from "lucide-react";

interface DigitalMenuSettingsProps {
  accountId: string;
  restaurantName: string;
  onClose?: () => void;
}

interface DigitalMenuData {
  digital_menu: {
    id: string;
    pos_account_id: string;
    public_url_slug: string;
    is_active: boolean;
    qr_code_generated: boolean;
    last_generated_at: string | null;
  } | null;
  active_theme: {
    theme_name: string;
    custom_colors: any;
  } | null;
}

export const DigitalMenuSettings: React.FC<DigitalMenuSettingsProps> = ({
  accountId,
  restaurantName,
  onClose,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [digitalMenuData, setDigitalMenuData] = useState<DigitalMenuData | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const publicUrl = digitalMenuData?.digital_menu 
    ? `${window.location.origin}/menu/${digitalMenuData.digital_menu.public_url_slug}`
    : '';

  useEffect(() => {
    loadDigitalMenuSettings();
  }, [accountId]);

  const loadDigitalMenuSettings = async () => {
    try {
      setIsLoading(true);
      
      // Initialize digital menu if not exists
      const { data: initData, error: initError } = await supabase.rpc(
        'initialize_digital_menu',
        { 
          p_account_id: accountId, 
          p_restaurant_name: restaurantName 
        }
      );

      if (initError) {
        console.error('Error initializing digital menu:', initError);
      }

      // Get digital menu settings
      const { data, error } = await supabase.rpc(
        'get_digital_menu_settings',
        { p_account_id: accountId }
      );

      if (error) throw error;

      setDigitalMenuData((data as any).data);
    } catch (error) {
      console.error('Error loading digital menu settings:', error);
      toast({
        title: "Error",
        description: "Failed to load digital menu settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (themeId: string) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase.rpc('update_menu_theme', {
        p_account_id: accountId,
        p_theme_name: themeId,
      });

      if (error) throw error;

      await loadDigitalMenuSettings();
      toast({
        title: "Success",
        description: "Theme updated successfully",
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: "Error",
        description: "Failed to update theme",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('pos_digital_menus')
        .update({ is_active: isActive })
        .eq('pos_account_id', accountId);

      if (error) throw error;

      await loadDigitalMenuSettings();
      toast({
        title: "Success",
        description: `Digital menu ${isActive ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling menu status:', error);
      toast({
        title: "Error",
        description: "Failed to update menu status",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateQR = async () => {
    if (!publicUrl) return;
    
    try {
      setIsGeneratingQR(true);
      const qrDataURL = await generateQRCode(publicUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
      });
      setQrCodeDataURL(qrDataURL);
      
      // Update QR generation status
      await supabase
        .from('pos_digital_menus')
        .update({ 
          qr_code_generated: true,
          last_generated_at: new Date().toISOString()
        })
        .eq('pos_account_id', accountId);
        
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const downloadQR = async (format: 'png' | 'svg') => {
    if (!publicUrl) return;
    
    try {
      const filename = `${restaurantName.toLowerCase().replace(/\s+/g, '-')}-menu-qr.${format}`;
      
      if (format === 'png') {
        if (!qrCodeDataURL) {
          await generateQR();
        }
        downloadQRCode(qrCodeDataURL, filename);
      } else {
        const svgString = await generateQRCodeSVG(publicUrl, {
          width: 300,
          margin: 2,
        });
        downloadSVG(svgString, filename);
      }
      
      toast({
        title: "Success",
        description: `QR code downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: "Copied!",
      description: "Public menu URL copied to clipboard",
    });
  };

  const openPublicMenu = () => {
    window.open(publicUrl, '_blank');
  };

  const downloadMenuPDF = async () => {
    try {
      // Get menu items and settings for PDF generation
      const { data: menuData, error: menuError } = await supabase.rpc('list_menu_items', {
        p_account_id: accountId
      });

      const { data: settingsData, error: settingsError } = await supabase.rpc('get_pos_settings', {
        p_account_id: accountId
      });

      if (menuError || settingsError) {
        throw new Error('Failed to fetch data for PDF generation');
      }

      const menuItems = (menuData as any).data || [];
      const restaurantSettings = (settingsData as any).data || {};

      // Generate PDF
      const pdf = generateDigitalMenuPDF(
        menuItems,
        restaurantSettings,
        digitalMenuData?.active_theme
      );

      // Download PDF
      const filename = `${restaurantName.toLowerCase().replace(/\s+/g, '-')}-menu.pdf`;
      pdf.save(filename);

      toast({
        title: "Success",
        description: "Menu PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading menu PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download menu PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Digital Menu Status
            <Badge variant={digitalMenuData?.digital_menu?.is_active ? "default" : "secondary"}>
              {digitalMenuData?.digital_menu?.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="menu-active">Enable Public Menu</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to view your menu online
              </p>
            </div>
            <Switch
              id="menu-active"
              checked={digitalMenuData?.digital_menu?.is_active || false}
              onCheckedChange={handleToggleActive}
              disabled={isSaving}
            />
          </div>

          {digitalMenuData?.digital_menu?.is_active && (
            <>
              <Separator />
              
              {/* Public URL */}
              <div className="space-y-2">
                <Label>Public Menu URL</Label>
                <div className="flex space-x-2">
                  <Input
                    value={publicUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPublicUrl}
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={openPublicMenu}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="space-y-4">
                <Label>QR Code</Label>
                
                <div className="flex items-center space-x-4">
                  {qrCodeDataURL ? (
                    <div className="flex-shrink-0">
                      <img 
                        src={qrCodeDataURL} 
                        alt="Menu QR Code" 
                        className="w-24 h-24 border rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 border rounded border-dashed flex items-center justify-center bg-muted">
                      <QrCode className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={generateQR}
                      disabled={isGeneratingQR}
                    >
                      {isGeneratingQR ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Generate QR
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadQR('png')}
                        disabled={!qrCodeDataURL}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PNG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadQR('svg')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        SVG
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print Menu */}
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Download Menu</Label>
                  <p className="text-sm text-muted-foreground">
                    Download a printable version of your menu
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={downloadMenuPDF}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Theme Selection */}
      {digitalMenuData?.digital_menu?.is_active && (
        <Card>
          <CardHeader>
            <CardTitle>Menu Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <MenuThemeSelector
              selectedTheme={digitalMenuData?.active_theme?.theme_name || 'modern'}
              onThemeSelect={handleThemeChange}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};