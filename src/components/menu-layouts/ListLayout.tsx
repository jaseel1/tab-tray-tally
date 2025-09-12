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

interface ListLayoutProps {
  items: MenuItem[];
  theme: MenuTheme;
  formatPrice: (price: number) => string;
  gstInclusive?: boolean;
  taxRate?: number;
}

export const ListLayout: React.FC<ListLayoutProps> = ({
  items,
  theme,
  formatPrice,
  gstInclusive,
  taxRate
}) => {
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

  const getPadding = () => {
    switch (theme.density) {
      case 'compact': return 'p-3';
      case 'spacious': return 'p-6';
      default: return 'p-4';
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card 
          key={item.id}
          className="transition-all duration-200 hover:shadow-md"
          style={{
            backgroundColor: 'var(--menu-surface)',
            borderColor: 'var(--menu-border)',
            boxShadow: 'var(--menu-shadow-card)',
            borderRadius: 'var(--menu-border-radius)',
          }}
        >
          <CardContent className={getPadding()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {item.image && theme.imageStyle !== 'none' && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className={`object-cover flex-shrink-0 ${getImageSize()} ${getImageStyle()}`}
                    style={{ borderRadius: 'var(--menu-border-radius)' }}
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-lg truncate"
                    style={{
                      fontFamily: 'var(--menu-font-heading)',
                      color: 'var(--menu-text)',
                    }}
                  >
                    {item.name}
                  </h3>
                  
                  {theme.itemStyle === 'detailed' && (
                    <p 
                      className="text-sm mt-1"
                      style={{ color: 'var(--menu-text-secondary)' }}
                    >
                      Category: {item.category}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3 flex-shrink-0">
                {gstInclusive && taxRate && taxRate > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Incl. GST
                  </Badge>
                )}
                
                <span 
                  className="text-xl font-bold"
                  style={{ color: 'var(--menu-primary)' }}
                >
                  {formatPrice(item.price)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};