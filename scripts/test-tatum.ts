import { createTatumWallet } from '../packages/wallet-core/src/services/tatum';
import { encryptPrivateKey, decryptPrivateKey } from '../packages/wallet-core/src/utils/encryption';

async function testTatumIntegration() {
  console.log('🚀 Starting Tatum Multi-Chain SDK Integration Tests\n');

  const chains = ['ethereum', 'polygon', 'solana'];

  for (const chain of chains) {
    try {
      console.log(`\n📝 Testing ${chain.toUpperCase()} wallet creation...`);

      const wallet = await createTatumWallet(chain);

      console.log(`✅ ${chain.toUpperCase()} wallet created successfully!`);
      console.log(`   Address: ${wallet.address}`);
      console.log(`   Chain ID: ${wallet.chainId}`);
      console.log(`   Mnemonic words: ${wallet.mnemonic.length}`);

      console.log(`\n🔐 Testing encryption for ${chain.toUpperCase()}...`);

      const encryptedKey = encryptPrivateKey(wallet.privateKey);
      console.log(`✅ Private key encrypted successfully`);
      console.log(`   Encrypted length: ${encryptedKey.length} characters`);

      const decryptedKey = decryptPrivateKey(encryptedKey);

      if (decryptedKey === wallet.privateKey) {
        console.log(`✅ Private key decrypted correctly`);
      } else {
        console.error(`❌ Decryption mismatch for ${chain}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(
        `❌ Error testing ${chain}: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  console.log('\n\n✨ All tests passed! Tatum integration is working correctly.\n');
}

testTatumIntegration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
