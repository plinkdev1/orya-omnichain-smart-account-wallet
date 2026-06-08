export type Language = 'rust' | 'typescript';

export interface ChainConfig {
  name: string;
  dirName: string;
  language: Language;
  tier: 1 | 2 | 3 | 4;
  mainDEX?: string;
  mainBridge?: string;
  rpcProvider?: string;
}

export interface GeneratorOptions {
  chain: string;
  chainConfig: ChainConfig;
  outputPath: string;
}

export interface CLIError extends Error {
  code: string;
}
