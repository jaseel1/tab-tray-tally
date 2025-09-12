import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuTheme } from "@/lib/themes";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

interface GridLayoutProps {
  items: MenuItem[];
  theme: MenuTheme;
  formatPrice: (price: number) => string;
  gstInclusive?: boolean;
  taxRate?: number;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  items,
  theme,
  formatPrice,
  gstInclusive,
  taxRate
}) => {
  const getGridCols = () => {
    switch (theme.density) {
      case 'compact': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 'spacious': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getImageSize = () => {
    switch (theme.iconSize) {
      case 'small': return 'w-12 h-12';
      case 'large': return 'w-20 h-20';
      case 'xl': return 'w-24 h-24';
      default: return 'w-16 h-16';
    }
  };

  const getImageStyle = () => {
    switch (theme.imageStyle) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-none';
      case 'none': return 'hidden';
      default: return 'rounded';
    }
  };

  return (
    <div className={`grid gap-4 ${getGridCols()}`}>
      {items.map((item) => (
        <Card 
          key={item.id}
          className="overflow-hidden transition-all duration-200 hover:shadow-lg"
          style={{
            backgroundColor: 'var(--menu-surface)',
            borderColor: 'var(--menu-border)',
            boxShadow: 'var(--menu-shadow-card)',
            borderRadius: 'var(--menu-border-radius)',
          }}
        >
          <CardContent style={{ padding: 'var(--menu-card-padding)' }}>
            {theme.itemStyle === 'detailed' && item.image && (
              <div className="mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className={`w-full h-32 object-cover ${getImageStyle()}`}
                  style={{ borderRadius: 'var(--menu-border-radius)' }}
                />
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 
                  className="font-semibold text-lg mb-2"
                  style={{
                    fontFamily: 'var(--menu-font-heading)',
                    color: 'var(--menu-text)',
                  }}
                >
                  {item.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span 
                    className="text-xl font-bold"
                    style={{ color: 'var(--menu-primary)' }}
                  >
                    {formatPrice(item.price)}
                  </span>
                  
                  {gstInclusive && taxRate && taxRate > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Incl. GST
                    </Badge>
                  )}
                </div>
              </div>
              
              {theme.itemStyle !== 'detailed' && item.image && theme.imageStyle !== 'none' && (
                <div className="ml-4 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className={`object-cover ${getImageSize()} ${getImageStyle()}`}
                    style={{ borderRadius: 'var(--menu-border-radius)' }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};