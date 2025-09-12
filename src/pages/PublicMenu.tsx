import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { getThemeById, getThemeCSSVariables } from "@/lib/themes";
import { GridLayout, ListLayout, TableLayout, MasonryLayout } from "@/components/menu-layouts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  AlertCircle,
  Star
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

interface RestaurantSettings {
  restaurant_name: string;
  address?: string;
  phone?: string;
  email?: string;
  fssai_number?: string;
  tax_rate?: number;
  gst_inclusive?: boolean;
}

interface MenuTheme {
  theme_name: string;
  custom_colors?: any;
}

interface PublicMenuData {
  menu_items: MenuItem[];
  settings: RestaurantSettings;
  theme: MenuTheme;
  digital_menu: {
    is_active: boolean;
  };
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [menuData, setMenuData] = useState<PublicMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (slug) {
      loadPublicMenu();
    }
  }, [slug]);

  const loadPublicMenu = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_public_menu', {
        p_slug: slug
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        setError(result.message || 'Menu not found');
        return;
      }

      setMenuData(result.data);
    } catch (error) {
      console.error('Error loading public menu:', error);
      setError('Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply theme styles
  useEffect(() => {
    if (menuData?.theme) {
      const theme = getThemeById(menuData.theme.theme_name);
      if (theme) {
        const cssVariables = getThemeCSSVariables(theme, menuData.theme.custom_colors);
        const root = document.documentElement;
        
        Object.entries(cssVariables).forEach(([property, value]) => {
          root.style.setProperty(property, value as string);
        });
      }
    }

    // Cleanup on unmount
    return () => {
      const root = document.documentElement;
      const menuVars = [
        '--menu-primary', '--menu-secondary', '--menu-background',
        '--menu-surface', '--menu-text', '--menu-text-secondary',
        '--menu-border', '--menu-accent', '--menu-font-heading',
        '--menu-font-body', '--menu-card-padding', '--menu-section-padding',
        '--menu-border-radius', '--menu-shadow-card', '--menu-shadow-button'
      ];
      menuVars.forEach(varName => {
        root.style.removeProperty(varName);
      });
    };
  }, [menuData?.theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Menu Not Found</h1>
          <p className="text-muted-foreground">
            {error || 'The requested menu could not be found or is currently inactive.'}
          </p>
        </div>
      </div>
    );
  }

  const { menu_items, settings } = menuData;
  const currentTheme = getThemeById(menuData.theme?.theme_name || 'modern');

  // Filter and search logic
  const categories = ['All', ...new Set(menu_items.map(item => item.category))];
  
  const filteredItems = menu_items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(0)}`;
  };

  const renderMenuLayout = (items: MenuItem[]) => {
    if (!currentTheme) return null;

    const layoutProps = {
      items,
      theme: currentTheme,
      formatPrice,
      gstInclusive: settings.gst_inclusive,
      taxRate: settings.tax_rate,
    };

    switch (currentTheme.layout) {
      case 'list':
        return <ListLayout {...layoutProps} />;
      case 'table':
        return <TableLayout {...layoutProps} />;
      case 'masonry':
        return <MasonryLayout {...layoutProps} />;
      default:
        return <GridLayout {...layoutProps} />;
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--menu-background)',
        color: 'var(--menu-text)',
        fontFamily: 'var(--menu-font-body)',
      }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--menu-surface)',
          borderColor: 'var(--menu-border)',
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="text-center space-y-2">
            <h1 
              className="text-3xl font-bold"
              style={{
                fontFamily: 'var(--menu-font-heading)',
                color: 'var(--menu-primary)',
              }}
            >
              {settings.restaurant_name}
            </h1>
            
            {/* Restaurant Info */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              {settings.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{settings.phone}</span>
                </div>
              )}
              {settings.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{settings.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mt-6 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    backgroundColor: selectedCategory === category ? 'var(--menu-primary)' : 'transparent',
                    borderColor: 'var(--menu-border)',
                    color: selectedCategory === category ? 'white' : 'var(--menu-text)',
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto px-4 py-8">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => (
              <section key={category}>
                <h2 
                  className="text-2xl font-semibold mb-4"
                  style={{
                    fontFamily: 'var(--menu-font-heading)',
                    color: 'var(--menu-primary)',
                  }}
                >
                  {category}
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Card 
                      key={item.id}
                      className="overflow-hidden"
                      style={{
                        backgroundColor: 'var(--menu-surface)',
                        borderColor: 'var(--menu-border)',
                        boxShadow: 'var(--menu-shadow-card)',
                        borderRadius: 'var(--menu-border-radius)',
                      }}
                    >
                      <CardContent style={{ padding: 'var(--menu-card-padding)' }}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 
                              className="font-semibold text-lg"
                              style={{
                                fontFamily: 'var(--menu-font-heading)',
                                color: 'var(--menu-text)',
                              }}
                            >
                              {item.name}
                            </h3>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <span 
                                className="text-xl font-bold"
                                style={{ color: 'var(--menu-primary)' }}
                              >
                                {formatPrice(item.price)}
                              </span>
                              
                              {settings.gst_inclusive && settings.tax_rate && settings.tax_rate > 0 && (
                                <Badge 
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  Incl. GST
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {item.image && (
                            <div className="ml-4 flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded"
                                style={{ borderRadius: 'var(--menu-border-radius)' }}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="mt-12 border-t py-8"
        style={{
          backgroundColor: 'var(--menu-surface)',
          borderColor: 'var(--menu-border)',
        }}
      >
        <div className="container mx-auto px-4 text-center space-y-4">
          {settings.fssai_number && (
            <p className="text-sm text-muted-foreground">
              FSSAI License: {settings.fssai_number}
            </p>
          )}
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Prices are subject to change without notice</span>
          </div>
          
          {!settings.gst_inclusive && settings.tax_rate && settings.tax_rate > 0 && (
            <p className="text-sm text-muted-foreground">
              * Prices are exclusive of {settings.tax_rate}% GST
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}