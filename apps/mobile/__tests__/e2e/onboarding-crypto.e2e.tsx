import { device, element, by, expect as detoxExpect } from 'detox';

describe('Onboarding Flow - Crypto Native Path', () => {
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

  it('should navigate through Splash screen', async () => {
    await element(by.text('ORŸA')).waitForDisplayed({ timeout: 3000 });
    await detoxExpect(element(by.text('Your gateway to Web3'))).toBeVisible();
  });

  it('should navigate through Intro screens', async () => {
    await element(by.text('Welcome to ORŸA')).waitForDisplayed({ timeout: 2000 });
    await element(by.id('intro-next-button')).multiTap(5);
    
    await element(by.text('Learn How ORŸA Grows With You')).waitForDisplayed({ timeout: 1000 });
  });

  it('should navigate to Identity selection screen', async () => {
    await element(by.id('intro-get-started-button')).tap();
    
    await element(by.text('How do you want to use this wallet?')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('Choose your path, upgrade anytime'))).toBeVisible();
  });

  it('should select Crypto Native identity', async () => {
    await element(by.id('identity-option-crypto')).tap();
    
    await element(by.text('Next-gen Web3')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('SUI-native wallet with MPC'))).toBeVisible();
  });

  it('should display crypto-specific screen description', async () => {
    await detoxExpect(element(by.text('(Full DeFi + NFTs)'))).toBeVisible();
  });

  it('should have Create SUI Wallet button', async () => {
    const createButton = element(by.id('create-sui-wallet-button'));
    await detoxExpect(createButton).toBeVisible();
    await createButton.tap();
  });

  it('should navigate to SUI choice screen', async () => {
    await element(by.text('Choose SUI Setup')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('How would you like to set up your SUI wallet?'))).toBeVisible();
  });

  it('should display SUI setup options', async () => {
    await detoxExpect(element(by.id('sui-option-new-wallet'))).toBeVisible();
    await detoxExpect(element(by.id('sui-option-import-mnemonic'))).toBeVisible();
    
    await element(by.id('sui-option-new-wallet')).tap();
  });

  it('should navigate to SUI wallet creation screen', async () => {
    await element(by.text('Create Your SUI Wallet')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('Generating secure wallet...'))).toBeVisible();
  });

  it('should display MPC wallet creation progress', async () => {
    await element(by.id('mpc-creation-progress')).waitForDisplayed({ timeout: 5000 });
    await detoxExpect(element(by.text('Creating MPC wallet with Suiet...'))).toBeVisible();
  });

  it('should display recovery phrase screen', async () => {
    await element(by.text('Your Recovery Phrase')).waitForDisplayed({ timeout: 5000 });
    await detoxExpect(element(by.text('Save this phrase securely. Never share it.'))).toBeVisible();
    
    const recoveryPhraseText = element(by.id('recovery-phrase-display'));
    await detoxExpect(recoveryPhraseText).toBeVisible();
  });

  it('should allow copying recovery phrase', async () => {
    const copyButton = element(by.id('copy-recovery-phrase-button'));
    await detoxExpect(copyButton).toBeVisible();
    await copyButton.tap();
  });

  it('should require confirmation of recovery phrase', async () => {
    const confirmButton = element(by.id('recovery-phrase-confirm'));
    await detoxExpect(confirmButton).toBeVisible();
    await confirmButton.tap();

    await element(by.text('Confirm Recovery Phrase')).waitForDisplayed({ timeout: 2000 });
  });

  it('should verify recovery phrase words', async () => {
    const word1Input = element(by.id('recovery-word-1-input'));
    const word2Input = element(by.id('recovery-word-2-input'));
    const word3Input = element(by.id('recovery-word-3-input'));

    await detoxExpect(word1Input).toBeVisible();
    await detoxExpect(word2Input).toBeVisible();
    await detoxExpect(word3Input).toBeVisible();

    await word1Input.typeText('test');
    await word2Input.typeText('phrase');
    await word3Input.typeText('words');

    const submitButton = element(by.id('recovery-verification-submit'));
    await submitButton.tap();
  });

  it('should reach Vault screen with Web3 features enabled', async () => {
    await element(by.id('vault-screen')).waitForDisplayed({ timeout: 3000 });
    
    await detoxExpect(element(by.text('ORŸA Vault'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-address'))).toBeVisible();
  });

  it('should verify MPC wallet is active in Vault', async () => {
    await detoxExpect(element(by.id('wallet-type-mpc'))).toBeVisible();
    await detoxExpect(element(by.id('blockchain-sui'))).toBeVisible();
  });

  it('should display Web3 capabilities for Crypto segment', async () => {
    await detoxExpect(element(by.id('swap-feature'))).toBeVisible();
    await detoxExpect(element(by.id('stake-feature'))).toBeVisible();
    await detoxExpect(element(by.id('nft-gallery'))).toBeVisible();
  });

  it('should display DeFi menu for crypto native', async () => {
    await detoxExpect(element(by.id('defi-menu-item'))).toBeVisible();
    await detoxExpect(element(by.id('advanced-chart'))).toBeVisible();
  });

  it('should show SUI blockchain in available chains', async () => {
    await element(by.id('chain-selector')).tap();
    
    await detoxExpect(element(by.text('Sui'))).toBeVisible();
    await detoxExpect(element(by.id('chain-option-sui'))).toBeVisible();
  });

  it('should verify Suiet integration is active', async () => {
    await detoxExpect(element(by.id('suiet-indicator'))).toBeVisible();
  });

  it('should verify Redux state shows crypto segment', async () => {
    await detoxExpect(element(by.id('user-segment-indicator-crypto'))).toBeVisible();
    await detoxExpect(element(by.id('custody-model-self'))).toBeVisible();
  });
});
