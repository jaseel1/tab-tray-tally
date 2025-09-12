export interface MenuTheme {
  id: string;
  name: string;
  displayName: string;
  layout: 'grid' | 'list' | 'table' | 'masonry';
  itemStyle: 'card' | 'minimal' | 'detailed' | 'compact';
  iconSize: 'small' | 'medium' | 'large' | 'xl';
  imageStyle: 'square' | 'rounded' | 'circle' | 'none';
  density: 'comfortable' | 'compact' | 'spacious';
  categoryStyle: 'tabs' | 'sidebar' | 'dropdown' | 'sections';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    card: string;
    section: string;
  };
  borderRadius: string;
  shadows: {
    card: string;
    button: string;
  };
}

export const MENU_THEMES: MenuTheme[] = [
  {
    id: 'modern',
    name: 'modern',
    displayName: 'Modern',
    layout: 'grid',
    itemStyle: 'card',
    iconSize: 'medium',
    imageStyle: 'rounded',
    density: 'comfortable',
    categoryStyle: 'tabs',
    colors: {
      primary: 'hsl(220, 70%, 50%)',
      secondary: 'hsl(220, 60%, 96%)',
      background: 'hsl(0, 0%, 100%)',
      surface: 'hsl(220, 14%, 96%)',
      text: 'hsl(220, 13%, 13%)',
      textSecondary: 'hsl(220, 9%, 46%)',
      border: 'hsl(220, 13%, 91%)',
      accent: 'hsl(220, 70%, 60%)',
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif',
    },
    spacing: {
      card: '1.5rem',
      section: '2rem',
    },
    borderRadius: '0.75rem',
    shadows: {
      card: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      button: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    },
  },
  {
    id: 'classic',
    name: 'classic',
    displayName: 'Classic',
    layout: 'table',
    itemStyle: 'minimal',
    iconSize: 'small',
    imageStyle: 'square',
    density: 'compact',
    categoryStyle: 'sections',
    colors: {
      primary: 'hsl(45, 100%, 35%)',
      secondary: 'hsl(45, 100%, 95%)',
      background: 'hsl(50, 44%, 96%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(30, 25%, 8%)',
      textSecondary: 'hsl(30, 10%, 40%)',
      border: 'hsl(45, 20%, 85%)',
      accent: 'hsl(45, 100%, 45%)',
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Georgia, serif',
    },
    spacing: {
      card: '1.25rem',
      section: '1.75rem',
    },
    borderRadius: '0.5rem',
    shadows: {
      card: '0 2px 8px rgba(0, 0, 0, 0.1)',
      button: '0 1px 3px rgba(0, 0, 0, 0.2)',
    },
  },
  {
    id: 'minimal',
    name: 'minimal',
    displayName: 'Minimal',
    layout: 'list',
    itemStyle: 'compact',
    iconSize: 'small',
    imageStyle: 'none',
    density: 'compact',
    categoryStyle: 'dropdown',
    colors: {
      primary: 'hsl(0, 0%, 9%)',
      secondary: 'hsl(0, 0%, 96%)',
      background: 'hsl(0, 0%, 100%)',
      surface: 'hsl(0, 0%, 99%)',
      text: 'hsl(0, 0%, 9%)',
      textSecondary: 'hsl(0, 0%, 45%)',
      border: 'hsl(0, 0%, 90%)',
      accent: 'hsl(0, 0%, 20%)',
    },
    fonts: {
      heading: 'Helvetica, Arial, sans-serif',
      body: 'Helvetica, Arial, sans-serif',
    },
    spacing: {
      card: '1rem',
      section: '1.5rem',
    },
    borderRadius: '0.25rem',
    shadows: {
      card: '0 1px 3px rgba(0, 0, 0, 0.05)',
      button: '0 1px 2px rgba(0, 0, 0, 0.1)',
    },
  },
  {
    id: 'vintage',
    name: 'vintage',
    displayName: 'Vintage',
    layout: 'grid',
    itemStyle: 'detailed',
    iconSize: 'large',
    imageStyle: 'rounded',
    density: 'spacious',
    categoryStyle: 'sidebar',
    colors: {
      primary: 'hsl(25, 60%, 45%)',
      secondary: 'hsl(25, 60%, 90%)',
      background: 'hsl(40, 40%, 94%)',
      surface: 'hsl(40, 30%, 98%)',
      text: 'hsl(25, 30%, 20%)',
      textSecondary: 'hsl(25, 20%, 45%)',
      border: 'hsl(25, 30%, 80%)',
      accent: 'hsl(5, 70%, 50%)',
    },
    fonts: {
      heading: 'Abril Fatface, cursive',
      body: 'Crimson Text, serif',
    },
    spacing: {
      card: '1.5rem',
      section: '2rem',
    },
    borderRadius: '0.5rem',
    shadows: {
      card: '0 4px 15px rgba(139, 69, 19, 0.15)',
      button: '0 2px 8px rgba(139, 69, 19, 0.2)',
    },
  },
  {
    id: 'professional',
    name: 'professional',
    displayName: 'Professional',
    layout: 'table',
    itemStyle: 'minimal',
    iconSize: 'small',
    imageStyle: 'square',
    density: 'comfortable',
    categoryStyle: 'tabs',
    colors: {
      primary: 'hsl(210, 100%, 35%)',
      secondary: 'hsl(210, 100%, 95%)',
      background: 'hsl(210, 20%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(210, 20%, 15%)',
      textSecondary: 'hsl(210, 15%, 45%)',
      border: 'hsl(210, 15%, 88%)',
      accent: 'hsl(210, 100%, 45%)',
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Roboto, sans-serif',
    },
    spacing: {
      card: '1.25rem',
      section: '1.75rem',
    },
    borderRadius: '0.375rem',
    shadows: {
      card: '0 2px 10px rgba(0, 0, 0, 0.08)',
      button: '0 1px 5px rgba(0, 0, 0, 0.1)',
    },
  },
  {
    id: 'colorful',
    name: 'colorful',
    displayName: 'Colorful',
    layout: 'masonry',
    itemStyle: 'card',
    iconSize: 'large',
    imageStyle: 'rounded',
    density: 'comfortable',
    categoryStyle: 'tabs',
    colors: {
      primary: 'hsl(280, 100%, 60%)',
      secondary: 'hsl(280, 100%, 95%)',
      background: 'hsl(320, 100%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(260, 15%, 15%)',
      textSecondary: 'hsl(260, 10%, 45%)',
      border: 'hsl(280, 30%, 90%)',
      accent: 'hsl(180, 100%, 50%)',
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Poppins, sans-serif',
    },
    spacing: {
      card: '1.5rem',
      section: '2rem',
    },
    borderRadius: '1rem',
    shadows: {
      card: '0 8px 25px rgba(128, 0, 128, 0.15)',
      button: '0 4px 15px rgba(128, 0, 128, 0.2)',
    },
  },
  {
    id: 'elegant',
    name: 'elegant',
    displayName: 'Elegant',
    layout: 'grid',
    itemStyle: 'detailed',
    iconSize: 'medium',
    imageStyle: 'rounded',
    density: 'spacious',
    categoryStyle: 'sections',
    colors: {
      primary: 'hsl(210, 40%, 20%)',
      secondary: 'hsl(210, 40%, 95%)',
      background: 'hsl(210, 30%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(210, 30%, 15%)',
      textSecondary: 'hsl(210, 15%, 50%)',
      border: 'hsl(210, 20%, 85%)',
      accent: 'hsl(35, 80%, 60%)',
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Source Sans Pro, sans-serif',
    },
    spacing: {
      card: '2rem',
      section: '2.5rem',
    },
    borderRadius: '0.5rem',
    shadows: {
      card: '0 4px 20px rgba(0, 0, 0, 0.08)',
      button: '0 2px 10px rgba(0, 0, 0, 0.1)',
    },
  },
  {
    id: 'tech',
    name: 'tech',
    displayName: 'Tech',
    layout: 'list',
    itemStyle: 'compact',
    iconSize: 'small',
    imageStyle: 'square',
    density: 'compact',
    categoryStyle: 'dropdown',
    colors: {
      primary: 'hsl(200, 100%, 50%)',
      secondary: 'hsl(220, 30%, 15%)',
      background: 'hsl(220, 30%, 8%)',
      surface: 'hsl(220, 25%, 12%)',
      text: 'hsl(0, 0%, 95%)',
      textSecondary: 'hsl(0, 0%, 70%)',
      border: 'hsl(220, 20%, 20%)',
      accent: 'hsl(180, 100%, 50%)',
    },
    fonts: {
      heading: 'Orbitron, sans-serif',
      body: 'Roboto, sans-serif',
    },
    spacing: {
      card: '1.5rem',
      section: '2rem',
    },
    borderRadius: '0.5rem',
    shadows: {
      card: '0 4px 20px rgba(0, 191, 255, 0.2)',
      button: '0 2px 10px rgba(0, 191, 255, 0.3)',
    },
  },
  {
    id: 'fun',
    name: 'fun',
    displayName: 'Fun',
    layout: 'masonry',
    itemStyle: 'card',
    iconSize: 'large',
    imageStyle: 'circle',
    density: 'comfortable',
    categoryStyle: 'tabs',
    colors: {
      primary: 'hsl(340, 100%, 50%)',
      secondary: 'hsl(340, 100%, 95%)',
      background: 'hsl(50, 100%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(260, 15%, 15%)',
      textSecondary: 'hsl(260, 10%, 45%)',
      border: 'hsl(340, 30%, 90%)',
      accent: 'hsl(60, 100%, 50%)',
    },
    fonts: {
      heading: 'Comic Neue, cursive',
      body: 'Nunito, sans-serif',
    },
    spacing: {
      card: '1.5rem',
      section: '2rem',
    },
    borderRadius: '1.5rem',
    shadows: {
      card: '0 8px 25px rgba(255, 20, 147, 0.15)',
      button: '0 4px 15px rgba(255, 20, 147, 0.2)',
    },
  },
  {
    id: 'natural',
    name: 'natural',
    displayName: 'Natural',
    layout: 'grid',
    itemStyle: 'card',
    iconSize: 'medium',
    imageStyle: 'rounded',
    density: 'comfortable',
    categoryStyle: 'sections',
    colors: {
      primary: 'hsl(120, 40%, 35%)',
      secondary: 'hsl(120, 40%, 95%)',
      background: 'hsl(60, 30%, 96%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(30, 25%, 15%)',
      textSecondary: 'hsl(30, 15%, 45%)',
      border: 'hsl(120, 20%, 85%)',
      accent: 'hsl(25, 80%, 55%)',
    },
    fonts: {
      heading: 'Merriweather, serif',
      body: 'Open Sans, sans-serif',
    },
    spacing: {
      card: '1.5rem',
      section: '2rem',
    },
    borderRadius: '0.75rem',
    shadows: {
      card: '0 4px 15px rgba(34, 139, 34, 0.1)',
      button: '0 2px 8px rgba(34, 139, 34, 0.15)',
    },
  },
  {
    id: 'cafe',
    name: 'cafe',
    displayName: 'Cafe',
    layout: 'list',
    itemStyle: 'detailed',
    iconSize: 'medium',
    imageStyle: 'circle',
    density: 'comfortable',
    categoryStyle: 'sidebar',
    colors: {
      primary: 'hsl(30, 70%, 45%)',
      secondary: 'hsl(30, 70%, 95%)',
      background: 'hsl(35, 50%, 96%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(25, 30%, 15%)',
      textSecondary: 'hsl(25, 20%, 45%)',
      border: 'hsl(30, 30%, 85%)',
      accent: 'hsl(15, 80%, 55%)',
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Lato, sans-serif',
    },
    spacing: {
      card: '1.5rem',
      section: '2rem',
    },
    borderRadius: '0.75rem',
    shadows: {
      card: '0 4px 15px rgba(139, 69, 19, 0.1)',
      button: '0 2px 8px rgba(139, 69, 19, 0.15)',
    },
  },
  {
    id: 'fine-dining',
    name: 'fine-dining',
    displayName: 'Fine Dining',
    layout: 'table',
    itemStyle: 'detailed',
    iconSize: 'small',
    imageStyle: 'none',
    density: 'spacious',
    categoryStyle: 'sections',
    colors: {
      primary: 'hsl(220, 50%, 15%)',
      secondary: 'hsl(220, 50%, 95%)',
      background: 'hsl(220, 20%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(220, 30%, 10%)',
      textSecondary: 'hsl(220, 20%, 40%)',
      border: 'hsl(220, 20%, 85%)',
      accent: 'hsl(40, 90%, 50%)',
    },
    fonts: {
      heading: 'Cormorant Garamond, serif',
      body: 'Crimson Text, serif',
    },
    spacing: {
      card: '2rem',
      section: '3rem',
    },
    borderRadius: '0.25rem',
    shadows: {
      card: '0 2px 15px rgba(0, 0, 0, 0.05)',
      button: '0 1px 8px rgba(0, 0, 0, 0.1)',
    },
  },
  {
    id: 'fast-food',
    name: 'fast-food',
    displayName: 'Fast Food',
    layout: 'grid',
    itemStyle: 'card',
    iconSize: 'large',
    imageStyle: 'rounded',
    density: 'compact',
    categoryStyle: 'tabs',
    colors: {
      primary: 'hsl(0, 85%, 55%)',
      secondary: 'hsl(0, 85%, 95%)',
      background: 'hsl(50, 100%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(220, 20%, 15%)',
      textSecondary: 'hsl(220, 15%, 45%)',
      border: 'hsl(0, 30%, 85%)',
      accent: 'hsl(45, 100%, 50%)',
    },
    fonts: {
      heading: 'Fredoka One, cursive',
      body: 'Open Sans, sans-serif',
    },
    spacing: {
      card: '1.25rem',
      section: '1.5rem',
    },
    borderRadius: '1rem',
    shadows: {
      card: '0 6px 20px rgba(255, 0, 0, 0.1)',
      button: '0 3px 10px rgba(255, 0, 0, 0.15)',
    },
  },
  {
    id: 'bakery',
    name: 'bakery',
    displayName: 'Bakery',
    layout: 'masonry',
    itemStyle: 'card',
    iconSize: 'large',
    imageStyle: 'rounded',
    density: 'comfortable',
    categoryStyle: 'sections',
    colors: {
      primary: 'hsl(340, 80%, 55%)',
      secondary: 'hsl(340, 80%, 95%)',
      background: 'hsl(50, 60%, 96%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(25, 30%, 15%)',
      textSecondary: 'hsl(25, 20%, 45%)',
      border: 'hsl(340, 30%, 85%)',
      accent: 'hsl(25, 90%, 60%)',
    },
    fonts: {
      heading: 'Dancing Script, cursive',
      body: 'Quicksand, sans-serif',
    },
    spacing: {
      card: '1.5rem',
      section: '2rem',
    },
    borderRadius: '1.25rem',
    shadows: {
      card: '0 8px 25px rgba(255, 20, 147, 0.1)',
      button: '0 4px 15px rgba(255, 20, 147, 0.15)',
    },
  },
  {
    id: 'bistro',
    name: 'bistro',
    displayName: 'Bistro',
    layout: 'list',
    itemStyle: 'detailed',
    iconSize: 'medium',
    imageStyle: 'rounded',
    density: 'comfortable',
    categoryStyle: 'sidebar',
    colors: {
      primary: 'hsl(25, 60%, 40%)',
      secondary: 'hsl(25, 60%, 95%)',
      background: 'hsl(40, 30%, 96%)',
      surface: 'hsl(0, 0%, 100%)',
      text: 'hsl(25, 30%, 15%)',
      textSecondary: 'hsl(25, 20%, 45%)',
      border: 'hsl(25, 25%, 85%)',
      accent: 'hsl(5, 70%, 50%)',
    },
    fonts: {
      heading: 'Libre Baskerville, serif',
      body: 'Source Sans Pro, sans-serif',
    },
    spacing: {
      card: '1.75rem',
      section: '2.25rem',
    },
    borderRadius: '0.5rem',
    shadows: {
      card: '0 4px 15px rgba(139, 69, 19, 0.1)',
      button: '0 2px 8px rgba(139, 69, 19, 0.15)',
    },
  },
];

export const getThemeById = (id: string): MenuTheme | undefined => {
  return MENU_THEMES.find(theme => theme.id === id);
};

export const getThemeCSSVariables = (theme: MenuTheme, customColors?: any) => {
  const colors = { ...theme.colors, ...customColors };
  
  return {
    '--menu-primary': colors.primary,
    '--menu-secondary': colors.secondary,
    '--menu-background': colors.background,
    '--menu-surface': colors.surface,
    '--menu-text': colors.text,
    '--menu-text-secondary': colors.textSecondary,
    '--menu-border': colors.border,
    '--menu-accent': colors.accent,
    '--menu-font-heading': theme.fonts.heading,
    '--menu-font-body': theme.fonts.body,
    '--menu-card-padding': theme.spacing.card,
    '--menu-section-padding': theme.spacing.section,
    '--menu-border-radius': theme.borderRadius,
    '--menu-shadow-card': theme.shadows.card,
    '--menu-shadow-button': theme.shadows.button,
  };
};