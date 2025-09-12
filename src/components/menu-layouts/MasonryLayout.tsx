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

interface MasonryLayoutProps {
  items: MenuItem[];
  theme: MenuTheme;
  formatPrice: (price: number) => string;
  gstInclusive?: boolean;
  taxRate?: number;
}

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({
  items,
  theme,
  formatPrice,
  gstInclusive,
  taxRate
}) => {
  const getColumns = () => {
    switch (theme.density) {
      case 'compact': return 'columns-2 md:columns-3 lg:columns-4';
      case 'spacious': return 'columns-1 md:columns-2 lg:columns-3';
      default: return 'columns-2 md:columns-3 lg:columns-4';
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

  const getCardHeight = (index: number) => {
    // Vary card heights for masonry effect
    const heights = ['h-32', 'h-40', 'h-36', 'h-44', 'h-38'];
    return heights[index % heights.length];
  };

  return (
    <div className={`${getColumns()} gap-4 [column-fill:_balance] space-y-4`}>
      {items.map((item, index) => (
        <Card 
          key={item.id}
          className={`break-inside-avoid transition-all duration-200 hover:shadow-lg ${
            theme.itemStyle === 'detailed' ? getCardHeight(index) : 'h-auto'
          }`}
          style={{
            backgroundColor: 'var(--menu-surface)',
            borderColor: 'var(--menu-border)',
            boxShadow: 'var(--menu-shadow-card)',
            borderRadius: 'var(--menu-border-radius)',
          }}
        >
          <CardContent style={{ padding: 'var(--menu-card-padding)' }}>
            {item.image && theme.imageStyle !== 'none' && (
              <div className="mb-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className={`w-full h-20 object-cover ${getImageStyle()}`}
                  style={{ borderRadius: 'var(--menu-border-radius)' }}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <h3 
                className="font-semibold text-base leading-tight"
                style={{
                  fontFamily: 'var(--menu-font-heading)',
                  color: 'var(--menu-text)',
                }}
              >
                {item.name}
              </h3>
              
              {theme.itemStyle === 'detailed' && (
                <p 
                  className="text-sm"
                  style={{ color: 'var(--menu-text-secondary)' }}
                >
                  {item.category}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <span 
                  className="text-lg font-bold"
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};