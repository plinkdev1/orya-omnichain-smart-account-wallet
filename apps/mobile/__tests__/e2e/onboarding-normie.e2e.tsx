import { device, element, by, expect as detoxExpect } from 'detox';

describe('Onboarding Flow - Normie Path', () => {
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
    await element(by.text('ORŸA')).waitForDisplayed({ timeout: 2000 });
  });

  it('should display Intro screens with progress dots', async () => {
    await element(by.text('Welcome to ORŸA')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('Your gateway to Web3 starts here'))).toBeVisible();
    
    await element(by.id('intro-next-button')).multiTap(5);
    
    await element(by.text('Learn How ORŸA Grows With You')).waitForDisplayed({ timeout: 1000 });
    await detoxExpect(element(by.text('From simple payments to advanced DeFi'))).toBeVisible();
  });

  it('should navigate to Identity selection screen', async () => {
    await element(by.id('intro-get-started-button')).tap();
    
    await element(by.text('How do you want to use this wallet?')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('Choose your path, upgrade anytime'))).toBeVisible();
  });

  it('should select Normie identity and navigate to social login', async () => {
    await element(by.id('identity-option-normie')).tap();
    
    await element(by.text('Sign in to your ORŸA wallet')).waitForDisplayed({ timeout: 2000 });
    await detoxExpect(element(by.text('Fast, secure, and private. Choose your preferred method.'))).toBeVisible();
  });

  it('should display social login buttons and handle Google login', async () => {
    await detoxExpect(element(by.id('social-login-google'))).toBeVisible();
    await detoxExpect(element(by.id('social-login-apple'))).toBeVisible();
    await detoxExpect(element(by.id('social-login-email'))).toBeVisible();
    await detoxExpect(element(by.id('social-login-phone'))).toBeVisible();

    await element(by.id('social-login-google')).multiTap(1);
    
    await element(by.text('Loading...')).waitForDisplayed({ timeout: 1000 });
    await element(by.text('Card Setup')).waitForDisplayed({ timeout: 5000 });
  });

  it('should navigate through card setup screen', async () => {
    await detoxExpect(element(by.text('Add Your Card'))).toBeVisible();
    await detoxExpect(element(by.id('card-form'))).toBeVisible();

    const cardNumberInput = element(by.id('card-number-input'));
    const expiryInput = element(by.id('card-expiry-input'));
    const cvvInput = element(by.id('card-cvv-input'));

    await cardNumberInput.typeText('4532123456789010');
    await expiryInput.typeText('12/25');
    await cvvInput.typeText('123');

    await element(by.id('card-setup-continue')).tap();
  });

  it('should reach Vault screen with custodial features', async () => {
    await element(by.id('vault-screen')).waitForDisplayed({ timeout: 3000 });
    
    await detoxExpect(element(by.text('ORŸA Vault'))).toBeVisible();
    await detoxExpect(element(by.id('wallet-address'))).toBeVisible();
    
    await detoxExpect(element(by.id('send-button'))).toBeVisible();
    await detoxExpect(element(by.id('receive-button'))).toBeVisible();
    
    await detoxExpect(element(by.id('card-widget'))).toBeVisible();
  });

  it('should verify Redux state after onboarding', async () => {
    const vaultScreen = element(by.id('vault-screen'));
    await vaultScreen.waitForDisplayed({ timeout: 3000 });
    
    await detoxExpect(element(by.id('user-segment-indicator-normie'))).toBeVisible();
    await detoxExpect(element(by.id('custody-model-custodial'))).toBeVisible();
  });

  it('should not display advanced DeFi features for Normie segment', async () => {
    await detoxExpect(element(by.id('defi-menu-item'))).not.toBeVisible();
    await detoxExpect(element(by.id('advanced-chart'))).not.toBeVisible();
  });

  it('should display Normie-specific capabilities', async () => {
    await detoxExpect(element(by.id('card-feature'))).toBeVisible();
    await detoxExpect(element(by.id('simple-send'))).toBeVisible();
    await detoxExpect(element(by.id('receive-feature'))).toBeVisible();
  });
});
