// @ts-nocheck
/**
 * BalanceCard - Mobile (React Native) implementation
 * TODO: Implement in Week 3
 */

import React from 'react';
import { Text, View } from 'react-native';
import { BalanceCardProps } from './BalanceCard.types';

export function BalanceCard(props: BalanceCardProps): any {
  return React.createElement(
    View,
    null,
    React.createElement(Text, null, 'BalanceCard Mobile')
  );
}