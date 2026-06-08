/**
 * Step 4 Validation Tests
 * Comprehensive tests for Wallet-Kit and WalletConnect integration
 */

import { generateNewWallet } from "../crypto/OwnWallet";
import {
    OwnWalletBackend,
    SuiWalletKitBackend,
    TransactionRouter,
    initializeTransactionRouter
} from "./TransactionRouter";
import {
    getWalletConnectManager,
    initializeWalletConnectManager
} from "./WalletConnectManager";

/**
 * Test 1: TransactionRouter Initialization
 */
async function testTransactionRouterInit() {
  console.log("\n✓ Test 1: TransactionRouter Initialization");
  
  const router = initializeTransactionRouter();
  
  if (!router || !(router instanceof TransactionRouter)) {
    throw new Error("Failed to initialize router");
  }
  
  const backends = router.getAvailableBackends();
  console.log("  Initialized successfully. Available backends:", backends.length);
}

/**
 * Test 2: OwnWallet Backend Registration
 */
async function testOwnWalletBackendRegistration() {
  console.log("\n✓ Test 2: OwnWallet Backend Registration");
  
  const { wallet } = await generateNewWallet();
  const backend = new OwnWalletBackend(wallet);
  const router = initializeTransactionRouter();
  
  router.registerBackend("own-wallet", backend);
  
  const isAvailable = router.isBackendAvailable("own-wallet");
  if (!isAvailable) {
    throw new Error("OwnWallet backend not available after registration");
  }
  
  console.log("  OwnWallet backend registered and available");
}

/**
 * Test 3: OwnWallet Backend Signing
 */
async function testOwnWalletBackendSigning() {
  console.log("\n✓ Test 3: OwnWallet Backend Signing");
  
  const { wallet } = await generateNewWallet();
  const backend = new OwnWalletBackend(wallet);
  
  // Test data signing
  const dataSignature = await backend.signData("test-data");
  
  if (!dataSignature.signature || !dataSignature.publicKey) {
    throw new Error("Invalid signature response");
  }
  
  console.log("  Data signed successfully");
  console.log("  Public Key:", dataSignature.publicKey.slice(0, 10) + "...");
}

/**
 * Test 4: TransactionRouter Active Backend Switching
 */
async function testTransactionRouterSwitching() {
  console.log("\n✓ Test 4: TransactionRouter Backend Switching");
  
  const router = initializeTransactionRouter();
  const { wallet } = await generateNewWallet();
  const backend = new OwnWalletBackend(wallet);
  
  router.registerBackend("own-wallet", backend);
  const switched = router.setActiveBackend("own-wallet");
  
  if (!switched) {
    throw new Error("Failed to set active backend");
  }
  
  const activeBackend = router.getActiveBackend();
  const activeName = router.getActiveBackendName();
  
  if (activeBackend !== backend || activeName !== "own-wallet") {
    throw new Error("Active backend not set correctly");
  }
  
  console.log("  Backend switching works correctly");
  console.log("  Active backend:", activeName);
}

/**
 * Test 5: SuiWalletKit Backend Adapter
 */
async function testSuiWalletKitBackendAdapter() {
  console.log("\n✓ Test 5: SuiWalletKit Backend Adapter");
  
  // Mock WalletKit adapter
  const mockWallet = {
    connected: true,
    getPublicKey: () => "0x" + "1".repeat(64),
    signTransaction: async () => ({
      signature: "0x" + "2".repeat(128),
      publicKey: "0x" + "1".repeat(64),
    }),
    signData: async () => ({
      signature: "0x" + "3".repeat(128),
      publicKey: "0x" + "1".repeat(64),
    }),
  };
  
  const backend = new SuiWalletKitBackend(mockWallet);
  
  if (!backend.isAvailable()) {
    throw new Error("WalletKit backend not available");
  }
  
  const publicKey = backend.getPublicKey();
  if (!publicKey) {
    throw new Error("Failed to get public key");
  }
  
  console.log("  WalletKit backend adapter works correctly");
  console.log("  Public Key:", publicKey.slice(0, 10) + "...");
}

/**
 * Test 6: WalletConnectManager Initialization
 */
async function testWalletConnectManagerInit() {
  console.log("\n✓ Test 6: WalletConnectManager Initialization");
  
  const config = {
    projectId: "test-project-id",
    name: "ORYA Wallet",
    description: "Test wallet",
    url: "http://localhost:3000",
    icons: ["http://localhost:3000/icon.png"],
  };
  
  const manager = initializeWalletConnectManager(config);
  
  if (!manager) {
    throw new Error("Failed to initialize WalletConnectManager");
  }
  
  console.log("  WalletConnectManager initialized successfully");
}

/**
 * Test 7: WalletConnectManager Global Instance
 */
async function testWalletConnectManagerGlobal() {
  console.log("\n✓ Test 7: WalletConnectManager Global Instance");
  
  const config = {
    projectId: "test-project-id",
    name: "ORYA Wallet",
    description: "Test wallet",
    url: "http://localhost:3000",
    icons: ["http://localhost:3000/icon.png"],
  };
  
  const manager1 = initializeWalletConnectManager(config);
  const manager2 = getWalletConnectManager();
  
  if (manager1 !== manager2) {
    throw new Error("Global instance mismatch");
  }
  
  console.log("  Global WalletConnectManager instance works correctly");
}

/**
 * Test 8: Router Error Handling
 */
async function testRouterErrorHandling() {
  console.log("\n✓ Test 8: Router Error Handling");
  
  const router = initializeTransactionRouter();
  
  try {
    await router.signTransaction(null as any);
    throw new Error("Should have thrown error");
  } catch (err) {
    if ((err as any).message.includes("No wallet backend configured")) {
      console.log("  Error handling works correctly");
    } else {
      throw err;
    }
  }
}

/**
 * Test 9: Backend Availability Checks
 */
async function testBackendAvailabilityChecks() {
  console.log("\n✓ Test 9: Backend Availability Checks");
  
  const router = initializeTransactionRouter();
  const { wallet } = await generateNewWallet();
  const backend = new OwnWalletBackend(wallet);
  
  // Before registration
  if (router.isBackendAvailable("own-wallet")) {
    throw new Error("Backend should not be available");
  }
  
  // After registration
  router.registerBackend("own-wallet", backend);
  if (!router.isBackendAvailable("own-wallet")) {
    throw new Error("Backend should be available");
  }
  
  // Test availability changes
  backend.setAvailability(false);
  if (router.isBackendAvailable("own-wallet")) {
    throw new Error("Backend should not be available after setting availability to false");
  }
  
  console.log("  Backend availability checks work correctly");
}

/**
 * Test 10: Multiple Backend Registration
 */
async function testMultipleBackendRegistration() {
  console.log("\n✓ Test 10: Multiple Backend Registration");
  
  const router = initializeTransactionRouter();
  
  // Register OwnWallet backend
  const { wallet: ownWallet } = await generateNewWallet();
  const ownBackend = new OwnWalletBackend(ownWallet);
  router.registerBackend("own-wallet", ownBackend);
  
  // Register WalletKit backend
  const mockWalletKit = {
    connected: true,
    getPublicKey: () => "0x" + "1".repeat(64),
    signTransaction: async () => ({
      signature: "0x" + "2".repeat(128),
      publicKey: "0x" + "1".repeat(64),
    }),
    signData: async () => ({
      signature: "0x" + "3".repeat(128),
      publicKey: "0x" + "1".repeat(64),
    }),
  };
  const kitBackend = new SuiWalletKitBackend(mockWalletKit);
  router.registerBackend("sui-wallet-kit", kitBackend);
  
  const available = router.getAvailableBackends();
  if (available.length < 2) {
    throw new Error("Multiple backends not registered correctly");
  }
  
  // Test switching between backends
  router.setActiveBackend("own-wallet");
  let activeName = router.getActiveBackendName();
  if (activeName !== "own-wallet") {
    throw new Error("Failed to switch to OwnWallet");
  }
  
  router.setActiveBackend("sui-wallet-kit");
  activeName = router.getActiveBackendName();
  if (activeName !== "sui-wallet-kit") {
    throw new Error("Failed to switch to WalletKit");
  }
  
  console.log("  Multiple backend registration and switching works correctly");
  console.log("  Available backends:", available.join(", "));
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log("================================");
  console.log("Step 4 - Connectivity Tests");
  console.log("================================");
  
  const tests = [
    testTransactionRouterInit,
    testOwnWalletBackendRegistration,
    testOwnWalletBackendSigning,
    testTransactionRouterSwitching,
    testSuiWalletKitBackendAdapter,
    testWalletConnectManagerInit,
    testWalletConnectManagerGlobal,
    testRouterErrorHandling,
    testBackendAvailabilityChecks,
    testMultipleBackendRegistration,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (err) {
      failed++;
      console.error(`  ✗ FAILED: ${(err as any).message}`);
    }
  }
  
  console.log("\n================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("================================\n");
  
  return failed === 0;
}

// Run tests
runAllTests()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error("Test runner error:", error);
    process.exit(1);
  });