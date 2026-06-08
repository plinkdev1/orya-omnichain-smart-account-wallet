import { device, element, by, expect as detoxExpect } from 'detox';

describe('Upgrade Flow - Normie to Web3', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    await device.sendUserInteraction({ type: 'background' });
  });

  it('should complete normie onboarding flow', async () => {
    await element(by.text('ORŸA')).waitForDisplayed({ timeout: 3000 });
    
    await element(by.text('Welcome to ORŸA')).waitForDisplayed({ timeout: 2000 });
    await element(by.id('intro-next-button')).multiTap(5);
    
    await element(by.id('intro-get-started-button')).tap();
    
    await element(by.text('How do you want to use this wallet?')).waitForDisplayed({ timeout: 2000 });
    await element(by.id('identity-option-normie')).tap();
    
    await element(by.text('Sign in to your ORŸA wallet')).waitForDisplayed({ timeout: 2000 });
    await element(by.id('social-login-google')).multiTap(1);
    
    await element(by.text('Card Setup')).waitForDisplayed({ timeout: 5000 });
    
    const cardNumberInput = element(by.id('card-number-input'));
    const expiryInput = element(by.id('card-expiry-input'));
    const cvvInput = element(by.id('card-cvv-input'));

    await cardNumberInput.typeText('4532123456789010');
    await expiryInput.typeText('12/25');
    await cvvInput.typeText('123');

    await element(by.id('card-setup-continue')).tap();
  });

  it('should reach Vault screen with Normie features', async () => {
    await element(by.id('vault-screen')).waitForDisplayed({ timeout: 3000 });
    
    await detoxExpect(element(by.text('ORŸA Vault'))).toBeVisible();
    await detoxExpect(element(by.id('user-segment-indicator-normie'))).toBeVisible();
    await detoxExpect(element(by.id('custody-model-custodial'))).toBeVisible();
  });

  it('should verify normie segment state before upgrade', async () => {
    const vaultScreen = element(by.id('vault-screen'));
    await detoxExpect(vaultScreen).toBeVisible();
    
    await detoxExpect(element(by.id('card-widget'))).toBeVisible();
    await detoxExpect(element(by.id('defi-menu-item'))).not.toBeVisible();
  });

  it('should display upgrade prompt in settings', async () => {
    await element(by.id('settings-button')).tap();
    
    await element(by.text('Settings')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.id('upgrade-to-web3-card'))).toBeVisible();
  });

  it('should show upgrade benefits', async () => {
    await detoxExpect(element(by.text('Unlock Web3 Features'))).toBeVisible();
    await detoxExpect(element(by.text('Full DeFi Access • NFT Support • Advanced Features'))).toBeVisible();
  });

  it('should have upgrade button', async () => {
    const upgradeButton = element(by.id('upgrade-button'));
    await detoxExpect(upgradeButton).toBeVisible();
    await upgradeButton.tap();
  });

  it('should navigate to upgrade confirmation screen', async () => {
    await element(by.text('Upgrade Your Wallet')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('Add MPC wallet for Web3'))).toBeVisible();
  });

  it('should display upgrade details', async () => {
    await detoxExpect(element(by.text('Keep Your Normie Wallet'))).toBeVisible();
    await detoxExpect(element(by.text('Add a Web3 MPC Wallet'))).toBeVisible();
    await detoxExpect(element(by.text('Manage Both in One App'))).toBeVisible();
  });

  it('should show MPC wallet creation flow', async () => {
    const createMpcButton = element(by.id('create-mpc-wallet-button'));
    await detoxExpect(createMpcButton).toBeVisible();
    await createMpcButton.tap();
  });

  it('should display MPC wallet creation progress', async () => {
    await element(by.id('mpc-creation-progress')).waitForDisplayed({ timeout: 5000 });
    await detoxExpect(element(by.text('Creating MPC wallet...'))).toBeVisible();
  });

  it('should generate recovery phrase for new MPC wallet', async () => {
    await element(by.text('Your Recovery Phrase')).waitForDisplayed({ timeout: 5000 });
    await detoxExpect(element(by.text('Save this phrase securely. Never share it.'))).toBeVisible();
    
    const recoveryPhraseText = element(by.id('recovery-phrase-display'));
    await detoxExpect(recoveryPhraseText).toBeVisible();
  });

  it('should allow copying recovery phrase during upgrade', async () => {
    const copyButton = element(by.id('copy-recovery-phrase-button'));
    await detoxExpect(copyButton).toBeVisible();
    await copyButton.tap();
  });

  it('should require confirmation of new recovery phrase', async () => {
    const confirmButton = element(by.id('recovery-phrase-confirm'));
    await detoxExpect(confirmButton).toBeVisible();
    await confirmButton.tap();

    await element(by.text('Confirm Recovery Phrase')).waitForDisplayed({ timeout: 2000 });
  });

  it('should verify recovery phrase words during upgrade', async () => {
    const word1Input = element(by.id('recovery-word-1-input'));
    const word2Input = element(by.id('recovery-word-2-input'));
    const word3Input = element(by.id('recovery-word-3-input'));

    await detoxExpect(word1Input).toBeVisible();
    await word1Input.typeText('test');
    await word2Input.typeText('phrase');
    await word3Input.typeText('words');

    const submitButton = element(by.id('recovery-verification-submit'));
    await submitButton.tap();
  });

  it('should reload vault with both wallet types', async () => {
    await element(by.id('vault-screen')).waitForDisplayed({ timeout: 3000 });
    
    await detoxExpect(element(by.text('ORŸA Vault'))).toBeVisible();
  });

  it('should display both normie and web3 wallets in wallet list', async () => {
    await element(by.id('wallet-selector')).tap();
    
    await detoxExpect(element(by.id('wallet-option-normie'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-option-web3'))).toBeVisible();
  });

  it('should verify MPC wallet is now active', async () => {
    const web3WalletOption = element(by.id('wallet-option-web3'));
    await web3WalletOption.tap();
    
    await detoxExpect(element(by.id('wallet-type-mpc'))).toBeVisible();
    await detoxExpect(element(by.id('custody-model-self'))).toBeVisible();
  });

  it('should preserve normie wallet after upgrade', async () => {
    await element(by.id('wallet-selector')).tap();
    
    const normieWalletOption = element(by.id('wallet-option-normie'));
    await detoxExpect(normieWalletOption).toBeVisible();
    
    await normieWalletOption.tap();
    await detoxExpect(element(by.id('custody-model-custodial'))).toBeVisible();
  });

  it('should unlock Web3 features after upgrade', async () => {
    await element(by.id('wallet-selector')).tap();
    await element(by.id('wallet-option-web3')).tap();
    
    await detoxExpect(element(by.id('swap-feature'))).toBeVisible();
    await detoxExpect(element(by.id('stake-feature'))).toBeVisible();
    await detoxExpect(element(by.id('nft-gallery'))).toBeVisible();
    await detoxExpect(element(by.id('defi-menu-item'))).toBeVisible();
  });

  it('should show upgraded segment state', async () => {
    await detoxExpect(element(by.id('user-segment-indicator-crypto'))).toBeVisible();
  });

  it('should display both wallets in main vault view', async () => {
    await detoxExpect(element(by.id('normie-wallet-card'))).toBeVisible();
    await detoxExpect(element(by.id('web3-wallet-card'))).toBeVisible();
  });

  it('should allow switching between wallets in vault', async () => {
    const normieCard = element(by.id('normie-wallet-card'));
    const web3Card = element(by.id('web3-wallet-card'));
    
    await normieCard.tap();
    await detoxExpect(element(by.id('card-widget'))).toBeVisible();
    
    await web3Card.tap();
    await detoxExpect(element(by.id('swap-feature'))).toBeVisible();
  });

  it('should preserve all user data after upgrade', async () => {
    const walletAddressElement = element(by.id('wallet-address'));
    await detoxExpect(walletAddressElement).toBeVisible();
  });
});
