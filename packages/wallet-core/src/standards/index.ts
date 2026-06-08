/**
 * Ethereum Improvement Proposals (EIP) Standards
 * Complete implementation of Ethereum wallet standards
 */

export {
  EIP1193_STANDARD_METHODS,
  EIP1193_ERROR_CODES,
  EIP1193EventEmitter,
  EIP1193ProviderBase,
  EIP1193ProviderError,
  type EIP1193EventMap,
  type EIP1193EventName,
  type EIP1193Provider,
  type EIP1193RequestArguments,
  type EIP1193RpcError,
  type EIP1193BaseProvider,
  type EIP1193Method,
} from './eip1193-provider';

export {
  ETHEREUM_JSON_RPC_METHODS,
  JSON_RPC_ERROR_CODES,
  JSON_RPC_ERROR_MESSAGES,
  JSON_RPC_METHODS_SPEC,
  JSONRPC2RequestBuilder,
  JSONRPC2ResponseBuilder,
  JSONRPC2Validator,
  type JSONRPC2Request,
  type JSONRPC2Response,
  type JSONRPC2Error,
  type JSONRPC2BatchRequest,
  type JSONRPC2BatchResponse,
  type JSONRPCMethodSpec,
} from './eip1474-jsonrpc';

export {
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  EIP155ChainValidator,
  EIP155TransactionValidator,
  EIP155SignatureUtil,
  type EIP155ChainConfig,
  type EthereumChainId,
  type EIP155Transaction,
  type EIP155SignedTransaction,
  type EIP155SignatureData,
} from './eip155-chain-id';

export {
  EIP712_DOMAIN_TYPE_HASH,
  EIP712_STANDARD_TYPES,
  EIP712Util,
  EIP712TypeValidator,
  EIP712DomainSeparator,
  EIP712Common,
  type EIP712TypeProperty,
  type EIP712Types,
  type EIP712Domain,
  type EIP712TypedData,
  type EIP712SignRequest,
  type EIP712Signature,
} from './eip712-typed-data';

export {
  EIP2718TransactionFactory,
  EIP2718TransactionValidator,
  EIP2718TransactionSerializer,
  EIP2718TransactionUtils,
  type EIP2718Transaction,
  type EIP2718Envelope,
  type TransactionType,
  type BaseLegacyTransaction,
  type LegacyTransaction,
  type AccessListItem,
  type AccessListTransaction,
  type FeeMarketTransaction,
  type BlobTransaction,
  type SignedTransaction,
} from './eip2718-transactions';

export {
  AccessListValidator,
  AccessListGasCalculator,
  AccessListBuilder,
  AccessListOptimizer,
  type AccessListItem as AccessListItemEIP2930,
  type AccessList,
  type AccessListTransaction as AccessListTransactionEIP2930,
  type SignedAccessListTransaction,
} from './eip2930-access-lists';

export {
  EIP4337Constants,
  EIP4337_ERROR_CODES,
  UserOperationValidator,
  UserOperationBuilder,
  UserOperationUtils,
  SmartAccountFactory,
  type UserOperation,
  type UserOperationWithMetadata,
  type GasEstimate,
  type UserOperationReceipt,
  type EntryPointConfig,
  type PaymasterConfig,
  type SignatureAggregator,
  type SmartAccountConfig,
  type ExecutionData,
  type ValidatorConfig,
  type BundlerConfig,
} from './eip4337-account-abstraction';

export {
  EIP6963_ANNOUNCEMENT_EVENT,
  EIP6963_REQUEST_EVENT,
  EIP6963StandardAdapter,
  EthereumJSONRPCProvider,
  type EIP6963ProviderInfo,
  type EIP6963ProviderDetail,
} from './eip6963';

export {
  ProviderRegistry,
  type ProviderInfo,
  type RegisteredProvider,
} from './ProviderRegistry';

export {
  SOLANA_WALLET_NAME,
  SOLANA_WALLET_VERSION,
  SolanaStandardAdapter,
  type SolanaAccount,
  type SolanaChainInfo,
  type SolanaSignTransactionInput,
  type SolanaSignTransactionOutput,
  type SolanaSignMessageInput,
  type SolanaSignMessageOutput,
  type SolanaSignAndSendTransactionInput,
  type SolanaSignAndSendTransactionOutput,
  type SolanaWalletCapabilities,
} from './solana-standard';

export {
  COSMOS_WALLET_NAME,
  COSMOS_WALLET_VERSION,
  CosmosStandardAdapter,
  type CosmosAccount,
  type CosmosChainInfo,
  type CosmosSignMessageInput,
  type CosmosSignMessageOutput,
  type CosmosSignTransactionInput,
  type CosmosSignTransactionOutput,
  type CosmosSendTransactionInput,
  type CosmosSendTransactionOutput,
  type CosmosWalletCapabilities,
} from './cosmos-standard';

export {
  TON_WALLET_NAME,
  TON_WALLET_VERSION,
  TonStandardAdapter,
  type TonAccount,
  type TonChainInfo,
  type TonSignMessageInput,
  type TonSignMessageOutput,
  type TonSignTransactionInput,
  type TonSignTransactionOutput,
  type TonSendTransactionInput,
  type TonSendTransactionOutput,
  type TonWalletCapabilities,
} from './ton-standard';

export {
  NEAR_WALLET_NAME,
  NEAR_WALLET_VERSION,
  NearStandardAdapter,
  type NearAccount,
  type NearChainInfo,
  type NearSignMessageInput,
  type NearSignMessageOutput,
  type NearSignTransactionInput,
  type NearSignTransactionOutput,
  type NearSendTransactionInput,
  type NearSendTransactionOutput,
  type NearWalletCapabilities,
} from './near-standard';

export const STANDARDS_VERSION = {
  EIP1193: '1.0',
  EIP1474: '1.0',
  EIP155: '1.0',
  EIP712: '1.0',
  EIP2718: '1.0',
  EIP2930: '1.0',
  EIP4337: '1.0',
  EIP6963: '1.0',
  SOLANA: '1.0',
  COSMOS: '1.0',
  TON: '1.0',
  NEAR: '1.0',
} as const;

export const STANDARDS_METADATA = {
  EIP1193: {
    name: 'Ethereum Provider API',
    description: 'JavaScript provider API for interacting with Ethereum nodes',
    url: 'https://eips.ethereum.org/EIPS/eip-1193',
  },
  EIP1474: {
    name: 'Remote procedure call specification',
    description: 'JSON-RPC 2.0 specification for Ethereum nodes',
    url: 'https://eips.ethereum.org/EIPS/eip-1474',
  },
  EIP155: {
    name: 'Simple replay attack protection',
    description: 'Chain ID specification for transaction signing',
    url: 'https://eips.ethereum.org/EIPS/eip-155',
  },
  EIP712: {
    name: 'Ethereum typed structured data hashing and signing',
    description: 'Encoding scheme for typed, structured data',
    url: 'https://eips.ethereum.org/EIPS/eip-712',
  },
  EIP2718: {
    name: 'Typed Transaction Envelope',
    description: 'Unified structure for all transaction types',
    url: 'https://eips.ethereum.org/EIPS/eip-2718',
  },
  EIP2930: {
    name: 'Optional access lists',
    description: 'Access lists to reduce gas costs',
    url: 'https://eips.ethereum.org/EIPS/eip-2930',
  },
  EIP4337: {
    name: 'Account Abstraction Using Alt Mempool',
    description: 'Smart contracts as user accounts without consensus changes',
    url: 'https://eips.ethereum.org/EIPS/eip-4337',
  },
  EIP6963: {
    name: 'Multi-Injected Provider Discovery',
    description: 'Enables dApps to discover and connect to wallets',
    url: 'https://eips.ethereum.org/EIPS/eip-6963',
  },
} as const;

export {
  TRON_WALLET_NAME,
  TRON_WALLET_VERSION,
  TronStandardAdapter,
  type TronAccount,
  type TronChainInfo,
  type TronSignMessageInput,
  type TronSignMessageOutput,
  type TronSignTransactionInput,
  type TronSignTransactionOutput,
  type TronSendTransactionInput,
  type TronSendTransactionOutput,
  type TronWalletCapabilities,
} from './tron-standard';

export {
  CARDANO_WALLET_NAME,
  CARDANO_WALLET_VERSION,
  CardanoStandardAdapter,
  type CardanoAccount,
  type CardanoChainInfo,
  type CardanoSignMessageInput,
  type CardanoSignMessageOutput,
  type CardanoSignTransactionInput,
  type CardanoSignTransactionOutput,
  type CardanoSendTransactionInput,
  type CardanoSendTransactionOutput,
  type CardanoWalletCapabilities,
} from './cardano-standard';

export {
  SUBSTRATE_WALLET_NAME,
  SUBSTRATE_WALLET_VERSION,
  SubstrateStandardAdapter,
  type SubstrateAccount,
  type SubstrateChainInfo,
  type SubstrateSignMessageInput,
  type SubstrateSignMessageOutput,
  type SubstrateSignTransactionInput,
  type SubstrateSignTransactionOutput,
  type SubstrateSendTransactionInput,
  type SubstrateSendTransactionOutput,
  type SubstrateWalletCapabilities,
} from './substrate-standard';
