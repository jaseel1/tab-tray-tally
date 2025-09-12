import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MenuTheme } from "@/lib/themes";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

interface TableLayoutProps {
  items: MenuItem[];
  theme: MenuTheme;
  formatPrice: (price: number) => string;
  gstInclusive?: boolean;
  taxRate?: number;
}

export const TableLayout: React.FC<TableLayoutProps> = ({
  items,
  theme,
  formatPrice,
  gstInclusive,
  taxRate
}) => {
  const getImageSize = () => {
    switch (theme.iconSize) {
      case 'small': return 'w-8 h-8';
      case 'large': return 'w-12 h-12';
      case 'xl': return 'w-16 h-16';
      default: return 'w-10 h-10';
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

  const getTableDensity = () => {
    switch (theme.density) {
      case 'compact': return 'text-sm';
      case 'spacious': return 'text-lg';
      default: return 'text-base';
    }
  };

  return (
    <div 
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--menu-surface)',
        borderColor: 'var(--menu-border)',
        borderRadius: 'var(--menu-border-radius)',
      }}
    >
      <Table className={getTableDensity()}>
        <TableHeader>
          <TableRow style={{ borderBottomColor: 'var(--menu-border)' }}>
            {theme.imageStyle !== 'none' && (
              <TableHead style={{ color: 'var(--menu-text)' }}>Image</TableHead>
            )}
            <TableHead style={{ color: 'var(--menu-text)' }}>Item Name</TableHead>
            {theme.itemStyle === 'detailed' && (
              <TableHead style={{ color: 'var(--menu-text)' }}>Category</TableHead>
            )}
            <TableHead style={{ color: 'var(--menu-text)' }}>Price</TableHead>
            {gstInclusive && taxRate && taxRate > 0 && (
              <TableHead style={{ color: 'var(--menu-text)' }}>Tax</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow 
              key={item.id} 
              className="hover:bg-opacity-50"
              style={{ 
                borderBottomColor: 'var(--menu-border)',
                backgroundColor: 'transparent'
              }}
            >
              {theme.imageStyle !== 'none' && (
                <TableCell>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`object-cover ${getImageSize()} ${getImageStyle()}`}
                    />
                  ) : (
                    <div className={`${getImageSize()} bg-gray-200 ${getImageStyle()}`} />
                  )}
                </TableCell>
              )}
              
              <TableCell 
                className="font-medium"
                style={{
                  color: 'var(--menu-text)',
                  fontFamily: 'var(--menu-font-heading)',
                }}
              >
                {item.name}
              </TableCell>
              
              {theme.itemStyle === 'detailed' && (
                <TableCell style={{ color: 'var(--menu-text-secondary)' }}>
                  {item.category}
                </TableCell>
              )}
              
              <TableCell 
                className="font-bold"
                style={{ color: 'var(--menu-primary)' }}
              >
                {formatPrice(item.price)}
              </TableCell>
              
              {gstInclusive && taxRate && taxRate > 0 && (
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    Incl. GST
                  </Badge>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};