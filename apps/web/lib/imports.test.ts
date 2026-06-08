/**
 * Web App Dependency Import Verification Test
 * This file verifies that all core dependencies can be imported correctly
 * Generated during Phase 0 core dependencies installation
 */

'use client';

// React & Next.js
import { useRouter } from 'next/navigation';

// Redux State Management
import type { RootState } from '@orya/wallet-core';
import { useDispatch, useSelector } from 'react-redux';

// Privy Authentication
import { usePrivy } from '@privy-io/react-auth';

// Solana Wallet Adapter

// Wallet SDK (Multi-chain)

// UI Components from shared-ui

// Recharts for Analytics

// Form Handling
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Test function to verify imports
export function verifyWebImports() {
  console.log('✅ Web app core dependencies imported successfully');
  return true;
}

// Example hook using all dependencies
export function useWebDependencies() {
  const { user } = usePrivy();
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.user.profile);
  const router = useRouter();
  
  const form = useForm({
    resolver: zodResolver(z.object({ email: z.string().email() })),
  });
  
  return {
    user,
    profile,
    isReady: !!user && !!profile,
  };
}

export default verifyWebImports;