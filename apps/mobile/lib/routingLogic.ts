/**
 * Routing Logic & Navigation Guard
 * Determines which screen to show based on authentication and onboarding status
 *
 * Flow:
 * 1. Loading: Show LoadingScreen
 * 2. Not Authenticated: Show OnboardingStack (login/signup)
 * 3. Authenticated + Not Onboarded: Show OnboardingFlow
 * 4. Authenticated + Onboarded: Show HomeStack (main app)
 */

export enum AppRoute {
  LOADING = 'loading',
  ONBOARDING = 'onboarding',
  LOGIN = 'login',
  HOME = 'home',
  AUTH_ERROR = 'auth-error',
}

export interface RoutingState {
  currentRoute: AppRoute;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  error?: string;
}

/**
 * Determine which route to show based on app state
 */
export const determineRoute = (
  isLoading: boolean,
  isAuthenticated: boolean,
  onboardingComplete: boolean,
  error?: string
): AppRoute => {
  // Priority 1: Show loading while auth is initializing
  if (isLoading) {
    return AppRoute.LOADING;
  }

  // Priority 2: Show error screen if auth failed
  if (error && !isAuthenticated) {
    return AppRoute.AUTH_ERROR;
  }

  // Priority 3: Show onboarding if not authenticated
  if (!isAuthenticated) {
    return AppRoute.ONBOARDING;
  }

  // Priority 4: Show login/signup if onboarding not complete
  if (!onboardingComplete) {
    return AppRoute.LOGIN;
  }

  // Priority 5: Show main app
  return AppRoute.HOME;
};

/**
 * Log routing decision (debug)
 */
export const logRoutingDecision = (
  state: RoutingState,
  route: AppRoute
): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Routing] Decision:', {
      state,
      route,
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
 * Check if user should be redirected
 */
export const shouldRedirect = (
  from: AppRoute,
  to: AppRoute,
  reason: string
): boolean => {
  const isValidRedirect = from !== to;
  if (isValidRedirect && process.env.NODE_ENV === 'development') {
    console.log(`[Routing] Redirect: ${from} → ${to} (${reason})`);
  }
  return isValidRedirect;
};