/**
 * Shared Screen Template Component
 * 
 * PROMPT D4: Shared Screen Templates
 * Provides consistent layout and styling for all screens
 * Used by both web and mobile applications
 */

import { ReactNode } from 'react';

export interface ScreenTemplateProps {
  /** Screen title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Screen content */
  children: ReactNode;
  /** Optional action button props */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Optional custom header */
  header?: ReactNode;
  /** Optional custom footer */
  footer?: ReactNode;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Base screen template used across all screens
 * Provides consistent layout, styling, and behavior
 * 
 * @example
 * // Web usage
 * function VaultPage() {
 *   return (
 *     <ScreenTemplate
 *       title="Vault"
 *       action={{ label: 'Connect Wallet', onClick: () => {} }}
 *     >
 *       <WalletList />
 *     </ScreenTemplate>
 *   );
 * }
 * 
 * @example
 * // Mobile usage
 * function VaultScreen() {
 *   return (
 *     <ScreenTemplate
 *       title="Vault"
 *       action={{ label: 'Connect Wallet', onClick: () => {} }}
 *     >
 *       <WalletList />
 *     </ScreenTemplate>
 *   );
 * }
 */
export function ScreenTemplate({
  title,
  subtitle,
  children,
  action,
  loading,
  error,
  header,
  footer,
  testID,
}: ScreenTemplateProps) {
  return (
    <div
      data-testid={testID || `screen-${title.toLowerCase()}`}
      className="screen-template flex flex-col h-full"
    >
      {/* Header Section */}
      {header ? (
        <div className="screen-header">{header}</div>
      ) : (
        <div className="screen-header px-4 py-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{subtitle}</p>
              )}
            </div>
            {action && (
              <button
                onClick={action.onClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Loading...' : action.label}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !children ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      ) : (
        /* Main Content */
        <div className="flex-1 overflow-auto px-4 py-6">{children}</div>
      )}

      {/* Footer Section */}
      {footer && <div className="screen-footer border-t border-gray-200 dark:border-gray-800 p-4">{footer}</div>}
    </div>
  );
}

/**
 * Mobile-specific screen template for React Native
 * Uses React Native components instead of HTML
 */
export interface MobileScreenTemplateProps extends Omit<ScreenTemplateProps, 'testID'> {
  /** React Native testID */
  testID?: string;
}

// Mobile implementation would use react-native components
// This is a placeholder for future mobile-specific version
export function MobileScreenTemplate(props: MobileScreenTemplateProps) {
  // Phase 2: Implement react-native version using View, ScrollView, etc.
  console.log('[shared-ui] Mobile screen template used for:', props.title);
  return null;
}