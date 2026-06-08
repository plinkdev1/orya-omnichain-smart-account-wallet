#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { generateAdapter, listChains } from './commands/index.js';
import { ConfigLoader } from './utils/config-loader.js';
import { CLIError } from './utils/errors.js';

const VERSION = '0.1.0';

async function showHelp(): Promise<void> {
  console.log(chalk.cyan(`\n🏗️  ORŸA Wallet CLI - Adapter Scaffolding Tool v${VERSION}\n`));
  console.log(chalk.white('Usage:'));
  console.log(chalk.gray('  orya-cli [command] [options]\n'));
  console.log(chalk.white('Commands:'));
  console.log(chalk.gray('  generate-adapter    Generate a new blockchain adapter'));
  console.log(chalk.gray('  list-chains         List all available chains'));
  console.log(chalk.gray('  interactive         Start interactive mode (default)'));
  console.log(chalk.gray('  --help, -h          Show this help message'));
  console.log(chalk.gray('  --version, -v       Show version\n'));
  console.log(chalk.white('Options:'));
  console.log(chalk.gray('  --chain <name>      Chain identifier (e.g., sui, ethereum)'));
  console.log(chalk.gray('  --language <lang>   Language override (rust, typescript)\n'));
  console.log(chalk.white('Examples:'));
  console.log(chalk.gray('  orya-cli generate-adapter --chain aptos'));
  console.log(chalk.gray('  orya-cli generate-adapter --chain ethereum --language typescript'));
  console.log(chalk.gray('  orya-cli list-chains'));
  console.log(chalk.gray('  orya-cli\n'));
}

async function interactive(): Promise<void> {
  console.log(chalk.cyan('\n🏗️  ORŸA Wallet - Adapter Scaffolding Tool\n'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Generate New Adapter', value: 'generate' },
        { name: 'List Available Chains', value: 'list' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  if (answers.action === 'exit') {
    process.exit(0);
  }

  if (answers.action === 'list') {
    listChains();
    process.exit(0);
  }

  const configLoader = new ConfigLoader();
  const chains = configLoader.listChains();

  const chainAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'chain',
      message: 'Select chain:',
      choices: chains.map((item) => ({
        name: `${item.config.name} (${item.config.language}) - Tier ${item.config.tier}`,
        value: item.key,
      })),
    },
  ]);

  try {
    await generateAdapter(chainAnswers.chain);
  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

function handleError(error: unknown): void {
  if (error instanceof CLIError) {
    console.error(chalk.red(`\n❌ ${error.name}: ${error.message}`));
    if (error.details) {
      console.error(chalk.gray(JSON.stringify(error.details, null, 2)));
    }
  } else if (error instanceof Error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
  } else {
    console.error(chalk.red(`\n❌ Unknown error occurred`));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await interactive();
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'generate-adapter': {
        const chainIndex = args.indexOf('--chain');
        const langIndex = args.indexOf('--language');

        if (chainIndex === -1) {
          console.error(chalk.red('Error: --chain parameter required'));
          await showHelp();
          process.exit(1);
        }

        const chain = args[chainIndex + 1];
        const language = langIndex !== -1 ? args[langIndex + 1] : undefined;

        await generateAdapter(chain, language);
        break;
      }

      case 'list-chains': {
        listChains();
        break;
      }

      case 'interactive': {
        await interactive();
        break;
      }

      case '--help':
      case '-h': {
        await showHelp();
        break;
      }

      case '--version':
      case '-v': {
        console.log(chalk.cyan(`ORŸA CLI v${VERSION}`));
        break;
      }

      default: {
        console.error(chalk.red(`Unknown command: ${command}`));
        await showHelp();
        process.exit(1);
      }
    }
  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

main().catch((error) => {
  handleError(error);
  process.exit(1);
});
