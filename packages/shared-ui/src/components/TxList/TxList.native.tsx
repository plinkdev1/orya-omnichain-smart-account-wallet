// @ts-nocheck
/**
 * TxList - Mobile (React Native) implementation
 * TODO: Implement in Week 3
 */

import React from 'react';
import { Text, View } from 'react-native';
import { TxListProps } from './TxList.types';

export function TxList(props: TxListProps): any {
  return React.createElement(
    View,
    null,
    React.createElement(Text, null, 'TxList Mobile')
  );
}