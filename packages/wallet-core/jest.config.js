export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@reown/appkit$': '<rootDir>/src/connectivity/reown/__mocks__/appkit.ts',
    '^@reown/appkit-networks/evm$': '<rootDir>/src/connectivity/reown/__mocks__/appkit-networks-evm.ts',
    '^@reown/appkit-networks/solana$': '<rootDir>/src/connectivity/reown/__mocks__/appkit-networks-solana.ts',
    '^@mysten/sui\\.js$': '<rootDir>/src/connectivity/reown/__mocks__/mysten-sui-js.ts'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};