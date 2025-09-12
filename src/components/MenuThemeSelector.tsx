import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MENU_THEMES, MenuTheme } from "@/lib/themes";
import { Check } from "lucide-react";

interface MenuThemeSelectorProps {
  selectedTheme?: string;
  onThemeSelect: (themeId: string) => void;
  className?: string;
}

export const MenuThemeSelector: React.FC<MenuThemeSelectorProps> = ({
  selectedTheme,
  onThemeSelect,
  className = '',
}) => {
  const renderThemePreview = (theme: MenuTheme) => (
    <div
      className="w-full h-20 rounded-lg p-3 flex flex-col justify-between"
      style={{
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-xs font-medium"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
          }}
        >
          Menu Item
        </div>
        <div
          className="w-8 h-2 rounded"
          style={{ backgroundColor: theme.colors.primary }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div
          className="text-xs"
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.body,
          }}
        >
          ₹120
        </div>
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: theme.colors.accent }}
        />
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {MENU_THEMES.map((theme) => (
          <Card
            key={theme.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTheme === theme.id
                ? 'ring-2 ring-primary ring-offset-2'
                : 'hover:shadow-md'
            }`}
            onClick={() => onThemeSelect(theme.id)}
          >
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Theme Preview */}
                {renderThemePreview(theme)}
                
                {/* Theme Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{theme.displayName}</h4>
                    {selectedTheme === theme.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  
                  {/* Color Palette */}
                  <div className="flex space-x-1">
                    {[
                      theme.colors.primary,
                      theme.colors.secondary,
                      theme.colors.accent,
                      theme.colors.background,
                    ].map((color, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Theme Details */}
      {selectedTheme && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Selected: {MENU_THEMES.find(t => t.id === selectedTheme)?.displayName}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Font: {MENU_THEMES.find(t => t.id === selectedTheme)?.fonts.heading}
                </p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};