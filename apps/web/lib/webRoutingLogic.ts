/**
 * Web Routing Logic & Navigation Guard
 * Determines which page to show based on authentication and onboarding status
 *
 * Flow:
 * 1. Loading: Show LoadingScreen (handled by AuthGate)
 * 2. Not Authenticated: Redirect to /login
 * 3. Authenticated + Not Onboarded: Redirect to /onboarding
 * 4. Authenticated + Onboarded: Show App (main pages)
 */

export enum WebRoute {
  LOADING = '/loading',
  LOGIN = '/login',
  ONBOARDING = '/onboarding',
  HOME = '/',
  VAULT = '/vault',
  AUTH_ERROR = '/error',
}

export interface WebRoutingState {
  currentRoute: WebRoute;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  error?: string;
}

/**
 * Determine which route to show based on app state
 */
export const determineWebRoute = (
  isLoading: boolean,
  isAuthenticated: boolean,
  onboardingComplete: boolean,
  error?: string
): WebRoute => {
  // Priority 1: Show loading while auth is initializing (handled by AuthGate)
  if (isLoading) {
    return WebRoute.LOADING;
  }

  // Priority 2: Show error screen if auth failed
  if (error && !isAuthenticated) {
    return WebRoute.AUTH_ERROR;
  }

  // Priority 3: Show login if not authenticated
  if (!isAuthenticated) {
    return WebRoute.LOGIN;
  }

  // Priority 4: Show onboarding if authenticated but not onboarded
  if (!onboardingComplete) {
    return WebRoute.ONBOARDING;
  }

  // Priority 5: Show main app (default to vault)
  return WebRoute.HOME;
};

/**
 * Get redirect target based on auth state
 * Use in middleware or route protection components
 */
export const getRedirectTarget = (
  pathname: string,
  isLoading: boolean,
  isAuthenticated: boolean,
  onboardingComplete: boolean,
  error?: string
): string | null => {
  const targetRoute = determineWebRoute(
    isLoading,
    isAuthenticated,
    onboardingComplete,
    error
  );

  // If current pathname matches target, no redirect needed
  if (pathname === targetRoute) {
    return null;
  }

  // Don't redirect if on loading page during initialization
  if (isLoading && pathname === WebRoute.LOADING) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated && pathname !== WebRoute.LOGIN) {
    return WebRoute.LOGIN;
  }

  // If authenticated but not onboarded, and not on onboarding page
  if (
    isAuthenticated &&
    !onboardingComplete &&
    pathname !== WebRoute.ONBOARDING
  ) {
    return WebRoute.ONBOARDING;
  }

  // If fully authenticated, don't let them go back to login/onboarding
  if (
    isAuthenticated &&
    onboardingComplete &&
    (pathname === WebRoute.LOGIN || pathname === WebRoute.ONBOARDING)
  ) {
    return WebRoute.HOME;
  }

  return null;
};

/**
 * Log routing decision (debug)
 */
export const logWebRoutingDecision = (
  pathname: string,
  state: WebRoutingState,
  route: WebRoute
): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[WebRouting] Decision:', {
      pathname,
      state,
      targetRoute: route,
      reasons: {
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
        hasError: !!state.error,
      },
    });
  }
};

/**
 * Protected routes - require authentication
 */
export const PROTECTED_ROUTES = [
  '/vault',
  '/flow',
  '/insights',
  '/curio',
  '/grove',
  '/nexus',
  '/chains',
  '/atrium',
  '/settings',
  '/portfolio',
  '/transactions',
];

/**
 * Onboarding routes - require onboarding completion
 */
export const ONBOARDING_ROUTES = ['/onboarding', '/onboarding/welcome', '/onboarding/auth-method'];

/**
 * Public routes - accessible to everyone
 */
export const PUBLIC_ROUTES = ['/login', '/error', '/landing'];

/**
 * Check if route is protected
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
};

/**
 * Check if route is onboarding route
 */
export const isOnboardingRoute = (pathname: string): boolean => {
  return ONBOARDING_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
};

/**
 * Check if route is public
 */
export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) => pathname === route);
};