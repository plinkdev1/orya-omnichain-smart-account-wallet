import { z } from 'zod';

export const ChainConfigSchema = z.object({
  name: z.string().min(1),
  dirName: z.string().regex(/^[a-z0-9-]+$/),
  language: z.enum(['rust', 'typescript']),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  mainDEX: z.string().optional(),
  mainBridge: z.string().optional(),
  rpcProvider: z.string().optional(),
});

export const GeneratorOptionsSchema = z.object({
  chain: z.string().min(1),
  chainConfig: ChainConfigSchema,
  outputPath: z.string().min(1),
});

export function validateChainConfig(config: unknown) {
  return ChainConfigSchema.parse(config);
}

export function validateAdapterPath(pathStr: string): boolean {
  const invalidChars = /[<>:"|?*\x00-\x1f]/g;
  return !invalidChars.test(pathStr) && pathStr.length > 0;
}

export function validateChainName(name: string, existingChains: Set<string>): {
  valid: boolean;
  error?: string;
} {
  if (existingChains.has(name)) {
    return { valid: false, error: `Chain adapter ${name} already exists` };
  }
  return { valid: true };
}
