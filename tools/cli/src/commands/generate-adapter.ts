import chalk from 'chalk';
import { ConfigLoader } from '../utils/config-loader.js';
import { createGenerator } from '../generators/index.js';
import {
  getAdapterPath,
  getExistingAdapters,
  directoryExists,
} from '../utils/path-utils.js';
import {
  ChainNotFoundError,
  AdapterExistsError,
  ValidationError,
} from '../utils/errors.js';
import { validateChainName } from '../utils/validators.js';

export async function generateAdapter(
  chainKey: string,
  language?: string
): Promise<void> {
  const configLoader = new ConfigLoader();
  const chains = configLoader.getAllChains();
  const existingAdapters = new Set(getExistingAdapters());

  const chainConfig = configLoader.getChain(chainKey);
  if (!chainConfig) {
    throw new ChainNotFoundError(chainKey);
  }

  const targetLanguage = language || chainConfig.language;
  const adapterPath = getAdapterPath(chainConfig.dirName);

  const validation = validateChainName(chainKey, existingAdapters);
  if (!validation.valid) {
    throw new ValidationError(validation.error || 'Invalid chain name');
  }

  if (directoryExists(adapterPath)) {
    throw new AdapterExistsError(adapterPath);
  }

  console.log(chalk.cyan(`\n🏗️  Generating ${chainConfig.name} adapter...\n`));

  const generator = createGenerator(
    targetLanguage as any,
    chainKey,
    chainConfig,
    adapterPath
  );

  const files = generator.generate();
  generator.writeFiles(files);

  console.log(chalk.green(`✅ Successfully generated ${chainConfig.name} adapter!\n`));
  console.log(chalk.gray(`📁 Location: ${adapterPath}`));
  console.log(chalk.gray(`📝 Files generated: ${files.length}`));
  console.log(chalk.gray(`🚀 Next steps:`));
  console.log(chalk.gray(`   1. cd ${chainConfig.dirName}`));
  console.log(chalk.gray(`   2. Review generated files`));
  if (chainConfig.language === 'rust') {
    console.log(chalk.gray(`   3. cargo build`));
    console.log(chalk.gray(`   4. cargo test\n`));
  } else {
    console.log(chalk.gray(`   3. pnpm install`));
    console.log(chalk.gray(`   4. pnpm test\n`));
  }
}
