/**
 * zkSync Era AA Contracts
 * 
 * Smart contracts for Account Abstraction on zkSync Era:
 * - Custom AA account (M-of-N, ACL modules)
 * - Paymaster (for stablecoin gas payments)
 * - Policy modules (role-based access control)
 * - Factory for account deployment
 */

export interface AAContractConfig {
  name: string;
  path: string;
  description: string;
}

export const AA_CONTRACTS: AAContractConfig[] = [
  {
    name: "AAAccount",
    path: "src/contracts/AAAccount.sol",
    description: "Custom Account Abstraction implementation (M-of-N multisig)",
  },
  {
    name: "ACLModule",
    path: "src/contracts/ACLModule.sol",
    description: "Access Control List module for role-based permissions",
  },
  {
    name: "Paymaster",
    path: "src/contracts/Paymaster.sol",
    description: "Paymaster for paying gas in ERC-20 tokens (stablecoins)",
  },
  {
    name: "AAFactory",
    path: "src/contracts/AAFactory.sol",
    description: "Factory contract for deploying new AA accounts",
  },
];

export const DEPLOY_ORDER = [
  "ACLModule", // Module must deploy first (referenced by AAAccount)
  "Paymaster", // Paymaster can deploy independently
  "AAFactory", // Factory references AAAccount
  "AAAccount", // Account logic (deployed via factory)
];