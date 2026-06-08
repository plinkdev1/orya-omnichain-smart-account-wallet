import { device, element, by, expect as detoxExpect } from 'detox';

describe('Onboarding Flow - External Wallet Path', () => {
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
  });

  it('should select External Wallet identity', async () => {
    await element(by.id('identity-option-external')).tap();
    
    await element(by.text('External Wallet')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('Connect Phantom, MetaMask, or others'))).toBeVisible();
  });

  it('should display WalletConnect certification info', async () => {
    await detoxExpect(element(by.text('(WalletConnect certified)'))).toBeVisible();
  });

  it('should have Connect Wallet button', async () => {
    const connectButton = element(by.id('connect-external-wallet-button'));
    await detoxExpect(connectButton).toBeVisible();
    await connectButton.tap();
  });

  it('should navigate to WalletConnect screen', async () => {
    await element(by.text('Connect Your Wallet')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('Choose a wallet to connect'))).toBeVisible();
  });

  it('should display available wallet options', async () => {
    await detoxExpect(element(by.id('wallet-option-phantom'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-option-metamask'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-option-coinbase'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-option-trustwallet'))).toBeVisible();
  });

  it('should show WalletConnect modal when selecting wallet', async () => {
    await element(by.id('wallet-option-phantom')).tap();
    
    await element(by.id('walletconnect-modal')).waitForDisplayed({ timeout: 3000 });
    await detoxExpect(element(by.text('Approve connection in your wallet'))).toBeVisible();
  });

  it('should display QR code or deep link options', async () => {
    await detoxExpect(element(by.id('walletconnect-qr-code'))).toBeVisible();
    await detoxExpect(element(by.id('copy-uri-button'))).toBeVisible();
  });

  it('should simulate wallet connection approval', async () => {
    const approveButton = element(by.id('walletconnect-approve'));
    await detoxExpect(approveButton).toBeVisible();
    await approveButton.tap();
    
    await element(by.text('Confirming connection...')).waitForDisplayed({ timeout: 2000 });
  });

  it('should navigate to confirmation screen', async () => {
    await element(by.text('Confirm Connection')).waitForDisplayed({ timeout: 3000 });
    await detoxExpect(element(by.text('Review your wallet details'))).toBeVisible();
  });

  it('should display connected wallet address', async () => {
    await detoxExpect(element(by.id('connected-wallet-address'))).toBeVisible();
    
    const addressElement = element(by.id('connected-wallet-address'));
    await detoxExpect(addressElement).toHaveToggleValue(true);
  });

  it('should display wallet info on confirmation screen', async () => {
    await detoxExpect(element(by.id('wallet-name-display'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-network-display'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-balance-display'))).toBeVisible();
  });

  it('should allow confirming the connection', async () => {
    const confirmButton = element(by.id('confirm-connection-button'));
    await detoxExpect(confirmButton).toBeVisible();
    await confirmButton.tap();
  });

  it('should reach Vault screen with external wallet active', async () => {
    await element(by.id('vault-screen')).waitForDisplayed({ timeout: 3000 });
    
    await detoxExpect(element(by.text('ORŸA Vault'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-address'))).toBeVisible();
  });

  it('should show external wallet as active', async () => {
    await detoxExpect(element(by.id('wallet-type-external'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-custody-external'))).toBeVisible();
  });

  it('should display connected wallet info in vault', async () => {
    await detoxExpect(element(by.id('external-wallet-indicator'))).toBeVisible();
    
    const walletBadge = element(by.id('connected-wallet-badge'));
    await detoxExpect(walletBadge).toBeVisible();
  });

  it('should verify Redux state shows external segment', async () => {
    await detoxExpect(element(by.id('user-segment-indicator-external'))).toBeVisible();
    await detoxExpect(element(by.id('custody-model-external'))).toBeVisible();
  });

  it('should have WalletConnect status indicator', async () => {
    await detoxExpect(element(by.id('walletconnect-status'))).toBeVisible();
  });

  it('should allow disconnecting external wallet', async () => {
    await element(by.id('wallet-settings-button')).tap();
    
    await element(by.id('disconnect-wallet-button')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.id('disconnect-wallet-button'))).toBeVisible();
  });

  it('should display limited capabilities for external wallets', async () => {
    await detoxExpect(element(by.id('external-limited-features-note'))).toBeVisible();
  });
});
