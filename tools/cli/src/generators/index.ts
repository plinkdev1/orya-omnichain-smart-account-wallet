import { ChainConfig, Language } from '../types.js';
import { BaseGenerator } from './base-generator.js';
import { RustGenerator } from './rust-generator.js';
import { TypeScriptGenerator } from './typescript-generator.js';

export function createGenerator(
  language: Language,
  chainKey: string,
  config: ChainConfig,
  adapterPath: string
): BaseGenerator {
  switch (language) {
    case 'rust':
      return new RustGenerator(chainKey, config, adapterPath);
    case 'typescript':
      return new TypeScriptGenerator(chainKey, config, adapterPath);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

export { BaseGenerator, RustGenerator, TypeScriptGenerator };
export type { GeneratedFile } from './base-generator.js';
