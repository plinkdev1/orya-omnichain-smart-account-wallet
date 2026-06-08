import chalk from 'chalk';
import { ConfigLoader } from '../utils/config-loader.js';

export function listChains(): void {
  const configLoader = new ConfigLoader();
  const chains = configLoader.listChains();

  console.log(chalk.cyan('\n📦 Available Blockchain Chains\n'));

  const byTier: Record<number, typeof chains> = { 1: [], 2: [], 3: [], 4: [] };

  chains.forEach((item) => {
    byTier[item.config.tier].push(item);
  });

  for (const tier of [1, 2, 3, 4]) {
    if (byTier[tier].length > 0) {
      console.log(chalk.yellow(`\n🎯 Tier ${tier}:`));
      byTier[tier].forEach((item) => {
        const langBadge = item.config.language === 'rust' ? '🦀' : '📘';
        console.log(
          chalk.gray(
            `   ${langBadge} ${item.config.name.padEnd(15)} (${item.key.padEnd(12)}) - ${item.config.dirName}`
          )
        );
      });
    }
  }

  console.log(chalk.cyan(`\nTotal: ${chains.length} chains`));
  console.log(chalk.gray(`\n💡 Usage: orya-cli generate-adapter --chain <key>\n`));
}
