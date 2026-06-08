#!/usr/bin/env node

/**
 * Chain Configuration Validator
 * Validates chain JSON files, RPC endpoints, and explorers
 * Usage: node scripts/validate-chains.js [--check-rpc] [--timeout 5000]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const checkRpc = args.includes('--check-rpc');
const timeoutMatch = args.find((arg) => arg.startsWith('--timeout'));
const timeout = timeoutMatch ? parseInt(timeoutMatch.split('=')[1]) : 5000;

const chainsDir = path.join(__dirname, '../packages/shared-types/chains');
const SCHEMA_VERSION = '1.0.0';

let totalChains = 0;
let validChains = 0;
let invalidChains = 0;
let rpcHealthy = 0;
let rpcUnhealthy = 0;
const errors = [];
const warnings = [];

const requiredFields = ['id', 'name', 'symbol', 'type', 'rpcUrl', 'explorerUrl', 'nativeCurrency', 'isTestnet', 'isEnabled', 'priority', 'status'];
const nativeCurrencyFields = ['name', 'symbol', 'decimals'];
const validTypes = ['sui', 'evm', 'solana', 'bitcoin', 'cosmos', 'ton', 'near', 'tron', 'cardano', 'substrate', 'aptos', 'movement'];
const validStatuses = ['healthy', 'degraded', 'offline'];

function validateChain(chain, fileName) {
  const chainErrors = [];

  requiredFields.forEach((field) => {
    if (!(field in chain)) {
      chainErrors.push(`Missing required field: ${field}`);
    }
  });

  if (chain.nativeCurrency) {
    nativeCurrencyFields.forEach((field) => {
      if (!(field in chain.nativeCurrency)) {
        chainErrors.push(`Missing nativeCurrency field: ${field}`);
      }
    });
  }

  if (chain.type && !validTypes.includes(chain.type)) {
    chainErrors.push(`Invalid chain type: ${chain.type}`);
  }

  if (chain.status && !validStatuses.includes(chain.status)) {
    chainErrors.push(`Invalid status: ${chain.status}`);
  }

  if (chain.priority !== undefined && typeof chain.priority !== 'number') {
    chainErrors.push(`Priority must be a number: ${typeof chain.priority}`);
  }

  if (chain.rpcUrl && !isValidUrl(chain.rpcUrl)) {
    chainErrors.push(`Invalid RPC URL: ${chain.rpcUrl}`);
  }

  if (chain.explorerUrl && !isValidUrl(chain.explorerUrl)) {
    chainErrors.push(`Invalid Explorer URL: ${chain.explorerUrl}`);
  }

  if (chain.nativeCurrency && typeof chain.nativeCurrency.decimals !== 'number') {
    chainErrors.push(`nativeCurrency.decimals must be a number`);
  }

  return chainErrors;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function checkRpcHealth(chain) {
  try {
    const response = await fetch(chain.rpcUrl, {
      method: chain.rpcUrl.includes('ws') ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: !chain.rpcUrl.includes('ws')
        ? JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
          })
        : undefined,
      timeout,
    });

    if (response.ok || response.status === 400) {
      rpcHealthy++;
      return { status: 'ok', latency: Date.now() };
    } else {
      rpcUnhealthy++;
      return { status: 'error', code: response.status };
    }
  } catch (error) {
    rpcUnhealthy++;
    return { status: 'error', error: error.message };
  }
}

async function loadAndValidateChains() {
  try {
    const indexPath = path.join(chainsDir, 'index.json');
    if (!fs.existsSync(indexPath)) {
      errors.push('Missing chains/index.json');
      return;
    }

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

    for (const vmFamily of index.vmFamilies) {
      for (const fileName of vmFamily.files) {
        const filePath = path.join(chainsDir, fileName);

        if (!fs.existsSync(filePath)) {
          errors.push(`Missing file: ${fileName}`);
          continue;
        }

        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!fileContent.chains || !Array.isArray(fileContent.chains)) {
          errors.push(`Invalid structure in ${fileName}: missing or invalid 'chains' array`);
          continue;
        }

        for (const chain of fileContent.chains) {
          totalChains++;
          const validationErrors = validateChain(chain, fileName);

          if (validationErrors.length === 0) {
            validChains++;

            if (checkRpc) {
              process.stdout.write('.');
              await checkRpcHealth(chain);
            }
          } else {
            invalidChains++;
            errors.push({
              chain: chain.id || 'unknown',
              file: fileName,
              errors: validationErrors,
            });
          }
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to load chains: ${error.message}`);
  }
}

function printReport() {
  console.log('\n\n' + '='.repeat(60));
  console.log('CHAIN CONFIGURATION VALIDATION REPORT');
  console.log('='.repeat(60));

  console.log(`\nSummary:`);
  console.log(`  Total Chains:    ${totalChains}`);
  console.log(`  Valid Chains:    ${validChains} ✓`);
  console.log(`  Invalid Chains:  ${invalidChains} ✗`);

  if (checkRpc) {
    console.log(`\nRPC Health Check:`);
    console.log(`  Healthy:   ${rpcHealthy} ✓`);
    console.log(`  Unhealthy: ${rpcUnhealthy} ✗`);
  }

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach((error) => {
      if (typeof error === 'string') {
        console.log(`  ✗ ${error}`);
      } else {
        console.log(`  ✗ Chain: ${error.chain} (${error.file})`);
        error.errors.forEach((err) => {
          console.log(`    - ${err}`);
        });
      }
    });
  }

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((warning) => {
      console.log(`  ⚠ ${warning}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (invalidChains > 0 || (checkRpc && rpcUnhealthy > 0)) {
    console.log('VALIDATION FAILED ✗\n');
    process.exit(1);
  } else {
    console.log('VALIDATION PASSED ✓\n');
    process.exit(0);
  }
}

async function main() {
  console.log('Validating chain configurations...');
  console.log(`RPC Health Check: ${checkRpc ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Timeout: ${timeout}ms\n`);

  await loadAndValidateChains();
  printReport();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
