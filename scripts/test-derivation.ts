import { testDerivation } from '../packages/wallet-core/src/utils/derivation';

testDerivation()
  .then(() => {
    console.log('\n✅ Derivation test passed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Derivation test failed:', error);
    process.exit(1);
  });
