module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.detox/'
  ],
  
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.detox/'
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@orya/wallet-core$': '<rootDir>/node_modules/@orya/wallet-core',
    '^@orya/wallet-core/(.*)$': '<rootDir>/node_modules/@orya/wallet-core/$1',
    '^@orya/shared-types$': '<rootDir>/node_modules/@orya/shared-types',
    '^@orya/shared-types/(.*)$': '<rootDir>/node_modules/@orya/shared-types/$1',
    '^@orya/shared-utils$': '<rootDir>/node_modules/@orya/shared-utils',
    '^@orya/shared-utils/(.*)$': '<rootDir>/node_modules/@orya/shared-utils/$1',
  },

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react'
      }
    }
  }
};
