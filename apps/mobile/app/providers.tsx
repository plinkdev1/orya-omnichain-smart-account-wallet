/**
 * Redux & Provider Setup - Mobile
 * Client-side providers for Redux store and theme context
 * Must be used at the root of the app tree
 */

import { createStore } from '@orya/wallet-core/store';
import { Provider } from 'react-redux';

// Create Redux store once at module load
const store = createStore();

/**
 * Providers Component
 * Wraps the app with necessary context providers
 * 
 * - Redux Provider: Provides access to Redux store for all components
 * - Should be imported and used in the root layout
 * 
 * @param children - React components to wrap with providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

export default Providers;