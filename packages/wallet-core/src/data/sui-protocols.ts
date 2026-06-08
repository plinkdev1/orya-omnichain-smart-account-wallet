import type { Protocol } from '../domain/protocols';

export const SUI_SWAP_PROTOCOLS: Protocol[] = [
  {
    id: 'aftermath-finance',
    name: 'Aftermath Finance',
    logo: '🌊',
    tvl: '$3.5M',
    fee: '0.3%',
    isAudited: true,
    auditors: ['CertiK', 'MoveBit'],
    securityRating: 92,
    type: 'aggregator',
    description: 'SUI aggregator protocol with multi-route optimization',
    chain: 'sui',
    features: ['swap'],
    isPreferred: true,
  },
  {
    id: 'cetus-protocol',
    name: 'Cetus Protocol',
    logo: '🐳',
    tvl: '$7M',
    fee: '0.35%',
    isAudited: true,
    auditors: ['MoveBit', 'OtterSec'],
    securityRating: 90,
    type: 'dex',
    description: 'Direct DEX on SUI with tick-based AMM',
    chain: 'sui',
    features: ['swap'],
  },
];

export const SUI_STAKING_PROTOCOLS: Protocol[] = [
  {
    id: 'sui-native-staking',
    name: 'SUI Native Staking',
    logo: '⚡',
    apy: 4.2,
    tvl: '$250M',
    fee: '2%',
    isAudited: true,
    auditors: ['Mysten Labs'],
    securityRating: 95,
    type: 'staking',
    description: 'Native SUI blockchain staking',
    chain: 'sui',
    features: ['stake'],
  },
];

export const SUI_PROTOCOLS_BY_FEATURE: Record<string, Protocol[]> = {
  swap: SUI_SWAP_PROTOCOLS,
  stake: SUI_STAKING_PROTOCOLS,
};

export const getSUIProtocolsByFeature = (feature: string): Protocol[] => {
  return SUI_PROTOCOLS_BY_FEATURE[feature] || [];
};

export const getSUIProtocolById = (id: string): Protocol | undefined => {
  const all = [...SUI_SWAP_PROTOCOLS, ...SUI_STAKING_PROTOCOLS];
  return all.find(p => p.id === id);
};

export const getDefaultSUIProtocol = (feature: string): Protocol | undefined => {
  const protocols = getSUIProtocolsByFeature(feature);
  return protocols.find(p => p.isPreferred) || protocols[0];
};
