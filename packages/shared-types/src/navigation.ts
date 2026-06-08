/**
 * Unified Navigation & Screen Map
 * 
 * PROMPT D1: Define Unified Screen Map
 * Provides screen ID map for both web and mobile platforms
 * Each screen has a unique ID, name, and metadata
 */

export type ScreenId =
  | 'onboarding'
  | 'login'
  | 'home'
  | 'vault'
  | 'portfolio'
  | 'transactions'
  | 'settings'
  | 'profile'
  | 'security'
  | 'notifications';

export interface ScreenMetadata {
  /** Unique screen identifier */
  id: ScreenId;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Is this screen protected (requires authentication) */
  protected: boolean;
  /** Display in navigation menu */
  inMenu: boolean;
  /** Icon name for navigation */
  icon?: string;
}

/**
 * Unified screen definitions
 * Used by both web (Next.js) and mobile (Expo Router)
 */
export const SCREEN_MAP: Record<ScreenId, ScreenMetadata> = {
  onboarding: {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Initial user onboarding flow',
    protected: false,
    inMenu: false,
    icon: undefined,
  },
  login: {
    id: 'login',
    name: 'Login',
    description: 'User authentication',
    protected: false,
    inMenu: false,
    icon: undefined,
  },
  home: {
    id: 'home',
    name: 'Home',
    description: 'Home dashboard',
    protected: true,
    inMenu: true,
    icon: 'home',
  },
  vault: {
    id: 'vault',
    name: 'Vault',
    description: 'Portfolio overview and account management',
    protected: true,
    inMenu: true,
    icon: 'lock',
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Detailed portfolio analytics',
    protected: true,
    inMenu: true,
    icon: 'chart',
  },
  transactions: {
    id: 'transactions',
    name: 'Transactions',
    description: 'Transaction history and details',
    protected: true,
    inMenu: true,
    icon: 'arrow-up-down',
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    description: 'Application settings',
    protected: true,
    inMenu: true,
    icon: 'settings',
  },
  profile: {
    id: 'profile',
    name: 'Profile',
    description: 'User profile management',
    protected: true,
    inMenu: false,
    icon: 'user',
  },
  security: {
    id: 'security',
    name: 'Security',
    description: 'Security and privacy settings',
    protected: true,
    inMenu: false,
    icon: 'shield',
  },
  notifications: {
    id: 'notifications',
    name: 'Notifications',
    description: 'Notification preferences',
    protected: true,
    inMenu: false,
    icon: 'bell',
  },
};

/**
 * Get all public (non-protected) screens
 */
export function getPublicScreens(): ScreenMetadata[] {
  return Object.values(SCREEN_MAP).filter((s) => !s.protected);
}

/**
 * Get all protected (authenticated) screens
 */
export function getProtectedScreens(): ScreenMetadata[] {
  return Object.values(SCREEN_MAP).filter((s) => s.protected);
}

/**
 * Get all screens that appear in main navigation menu
 */
export function getMenuScreens(): ScreenMetadata[] {
  return Object.values(SCREEN_MAP).filter((s) => s.inMenu);
}

/**
 * Navigation route mapping for different platforms
 */
export interface NavigationConfig {
  web: {
    basePath: string;
    screenPath: (screenId: ScreenId) => string;
  };
  mobile: {
    basePath: string;
    screenPath: (screenId: ScreenId) => string;
  };
}

export const NAVIGATION_CONFIG: NavigationConfig = {
  web: {
    basePath: '/',
    screenPath: (screenId: ScreenId) => `/${screenId}`,
  },
  mobile: {
    basePath: '/',
    screenPath: (screenId: ScreenId) => `/${screenId}`,
  },
};