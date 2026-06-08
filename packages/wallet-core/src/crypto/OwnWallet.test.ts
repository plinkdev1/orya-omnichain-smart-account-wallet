/**
 * Step 3A Validation Tests
 * Comprehensive tests for OwnWallet key generation, encryption, and signing
 */

import { TransactionBlock } from "@mysten/sui.js";
import { validateMnemonic } from "bip39";
import {
    OwnWallet,
    generateNewWallet
} from "./OwnWallet";

/**
 * Test 1: Key Generation (Deterministic)
 * Verify that same mnemonic always generates same keypair
 */
export async function testDeterministicKeyGeneration() {
  console.log("\n🔑 TEST 1: Deterministic Key Generation");
  console.log("======================================");

  const testMnemonic =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  // Generate first time
  const wallet1 = await OwnWallet.generateKeyPair(testMnemonic);
  const info1 = wallet1.getPublicInfo();

  // Generate second time with same mnemonic
  const wallet2 = await OwnWallet.generateKeyPair(testMnemonic);
  const info2 = wallet2.getPublicInfo();

  const match = info1.address === info2.address && info1.publicKey === info2.publicKey;

  console.log("✓ Generated two wallets from same mnemonic");
  console.log(`  Address 1: ${info1.address}`);
  console.log(`  Address 2: ${info2.address}`);
  console.log(`  Match: ${match ? "✅ PASS" : "❌ FAIL"}`);

  return { passed: match, address: info1.address, publicKey: info1.publicKey };
}

/**
 * Test 2: Mnemonic Generation & Validation
 * Verify mnemonic generation and validation
 */
export async function testMnemonicGeneration() {
  console.log("\n📝 TEST 2: Mnemonic Generation & Validation");
  console.log("===========================================");

  const { wallet, mnemonic } = await generateNewWallet();
  const isValid = validateMnemonic(mnemonic);

  console.log(`✓ Generated 24-word mnemonic`);
  console.log(`  Mnemonic (first 5 words): ${mnemonic.split(" ").slice(0, 5).join(" ")}...`);
  console.log(`  Valid: ${isValid ? "✅ PASS" : "❌ FAIL"}`);

  return { passed: isValid, mnemonic, wallet };
}

/**
 * Test 3: Key Encryption & Decryption
 * Verify encryption/decryption cycle
 */
export async function testKeyEncryption() {
  console.log("\n🔐 TEST 3: Key Encryption & Decryption");
  console.log("======================================");

  const password = "SecurePassword123!";
  const wallet = await OwnWallet.generateKeyPair();
  const originalInfo = wallet.getPublicInfo();

  // Encrypt
  const encrypted = await wallet.encryptPrivateKey(password);
  console.log("✓ Encrypted private key");
  console.log(`  Algorithm: ${encrypted.algorithm}`);
  console.log(`  Salt (hex): ${encrypted.salt.substring(0, 20)}...`);

  // Decrypt
  const decryptedWallet = await OwnWallet.decryptPrivateKey(encrypted, password);
  const decryptedInfo = decryptedWallet.getPublicInfo();

  const match = originalInfo.address === decryptedInfo.address;
  console.log("✓ Decrypted private key");
  console.log(`  Address match: ${match ? "✅ PASS" : "❌ FAIL"}`);

  // Test wrong password
  console.log("\n⚠️  Testing wrong password...");
  try {
    await OwnWallet.decryptPrivateKey(encrypted, "WrongPassword");
    console.log("  ❌ FAIL: Should have thrown error on wrong password");
    return { passed: false, encrypted };
  } catch (error) {
    console.log("  ✅ PASS: Correctly rejected wrong password");
  }

  return { passed: match, encrypted, address: originalInfo.address };
}

/**
 * Test 4: Transaction Signing
 * Verify transaction can be signed correctly
 */
export async function testTransactionSigning() {
  console.log("\n✍️  TEST 4: Transaction Signing");
  console.log("==============================");

  const wallet = await OwnWallet.generateKeyPair();

  // Create a test transaction block
  const tx = new TransactionBlock();
  tx.moveCall({
    target: "0x2::coin::transfer",
    arguments: [tx.object("0x6"), tx.pure.address("0x1234567890abcdef")],
    typeArguments: ["0x2::sui::SUI"],
  });

  // Sign transaction
  const signed = await wallet.signTransaction(tx);

  console.log("✓ Signed transaction block");
  console.log(`  Signature (first 20 chars): ${signed.signature.substring(0, 20)}...`);
  console.log(`  Public Key: ${signed.publicKey.substring(0, 20)}...`);

  const hasSignature = signed.signature && signed.signature.length > 0;
  console.log(`  Signature valid: ${hasSignature ? "✅ PASS" : "❌ FAIL"}`);

  return { passed: hasSignature, signature: signed.signature };
}

/**
 * Test 5: Data Signing & Verification
 * Verify arbitrary data signing and verification
 */
export async function testDataSigning() {
  console.log("\n🔍 TEST 5: Data Signing & Verification");
  console.log("======================================");

  const wallet = await OwnWallet.generateKeyPair();
  const testData = "ORYA Wallet Self-Custody Test";

  // Sign data
  const signature = await wallet.signData(testData);
  const publicInfo = wallet.getPublicInfo();

  console.log("✓ Signed test data");
  console.log(`  Data: "${testData}"`);
  console.log(`  Signature (first 20 chars): ${signature.substring(0, 20)}...`);

  // Verify signature
  const isValid = OwnWallet.verifySignature(publicInfo.publicKey, signature, testData);
  console.log("✓ Verified signature");
  console.log(`  Valid: ${isValid ? "✅ PASS" : "❌ FAIL"}`);

  // Test with wrong data
  const wrongDataValid = OwnWallet.verifySignature(
    publicInfo.publicKey,
    signature,
    "WRONG DATA"
  );
  console.log(`  Rejects wrong data: ${!wrongDataValid ? "✅ PASS" : "❌ FAIL"}`);

  return { passed: isValid && !wrongDataValid, signature, publicKey: publicInfo.publicKey };
}

/**
 * Test 6: Export/Import JSON
 * Verify wallet can be exported and imported as JSON
 */
export async function testJSONExportImport() {
  console.log("\n💾 TEST 6: Export/Import JSON");
  console.log("=============================");

  const password = "TestPassword456!";
  const originalWallet = await OwnWallet.generateKeyPair();
  const originalInfo = originalWallet.getPublicInfo();

  // Export to JSON
  const jsonString = await originalWallet.exportToJSON(password);
  console.log("✓ Exported wallet to JSON");
  console.log(`  JSON size: ${jsonString.length} bytes`);

  // Import from JSON
  const importedWallet = await OwnWallet.importFromJSON(jsonString, password);
  const importedInfo = importedWallet.getPublicInfo();

  const match = originalInfo.address === importedInfo.address;
  console.log("✓ Imported wallet from JSON");
  console.log(`  Address match: ${match ? "✅ PASS" : "❌ FAIL"}`);

  return { passed: match, jsonSize: jsonString.length };
}

/**
 * Test 7: Import from Private Key
 * Verify wallet can be imported from existing private key
 */
export async function testPrivateKeyImport() {
  console.log("\n🔑 TEST 7: Import from Private Key");
  console.log("==================================");

  // Generate a wallet and extract secret
  const originalWallet = await OwnWallet.generateKeyPair();
  const originalInfo = originalWallet.getPublicInfo();
  const secret = await originalWallet.getSecretInfo();

  // Import using private key
  const importedWallet = await OwnWallet.importFromPrivateKey(secret.privateKey);
  const importedInfo = importedWallet.getPublicInfo();

  const match = originalInfo.address === importedInfo.address;
  console.log("✓ Imported wallet from private key");
  console.log(`  Address match: ${match ? "✅ PASS" : "❌ FAIL"}`);

  return { passed: match, address: importedInfo.address };
}

/**
 * Test 8: Wallet Public Info
 * Verify public information is correct and consistent
 */
export async function testPublicInfo() {
  console.log("\n📊 TEST 8: Wallet Public Info");
  console.log("=============================");

  const wallet = await OwnWallet.generateKeyPair();
  const info = wallet.getPublicInfo();

  const hasAddress = info.address && info.address.length > 0;
  const hasPublicKey = info.publicKey && info.publicKey.length > 0;
  const correctNetwork = info.network === "sui";

  console.log("✓ Retrieved public wallet info");
  console.log(`  Address: ${info.address}`);
  console.log(`  Public Key length: ${info.publicKey.length} chars`);
  console.log(`  Network: ${info.network}`);
  console.log(`  All checks pass: ${hasAddress && hasPublicKey && correctNetwork ? "✅ PASS" : "❌ FAIL"}`);

  return { passed: hasAddress && hasPublicKey && correctNetwork, info };
}

/**
 * Main Test Suite Runner
 */
export async function runAllTests() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║          STEP 3A: OWNWALLET VALIDATION SUITE               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results = {
    test1: await testDeterministicKeyGeneration(),
    test2: await testMnemonicGeneration(),
    test3: await testKeyEncryption(),
    test4: await testTransactionSigning(),
    test5: await testDataSigning(),
    test6: await testJSONExportImport(),
    test7: await testPrivateKeyImport(),
    test8: await testPublicInfo(),
  };

  // Summary
  const passed = Object.values(results).filter((r) => r.passed).length;
  const total = Object.keys(results).length;

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    TEST SUMMARY                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nTests Passed: ${passed}/${total}`);
  console.log(`Status: ${passed === total ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);

  return {
    passed,
    total,
    allPassed: passed === total,
    details: results,
  };
}

// Auto-run if executed directly
if (require.main === module) {
  runAllTests()
    .then((summary) => {
      process.exit(summary.allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test suite error:", error);
      process.exit(1);
    });
}