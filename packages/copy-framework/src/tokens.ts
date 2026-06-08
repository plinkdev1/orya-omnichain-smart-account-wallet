/**
 * Copy Framework Token Definitions
 * Defines all available token keys (names only, no values)
 * Token convention: [page].[section].[element]
 * 
 * Categories:
 * - Navigation (13 menus)
 * - Authentication (Onboarding, Sign In, Wallet Connect)
 * - Global Actions (Reusable buttons/CTAs)
 * - Vault (Portfolio, Assets, Liabilities)
 * - Link (Wallet Management, Cross-chain)
 * - Flow (Transactions, Fiat Bridge, Transfers)
 * - Insights (Analytics, Charts, Market Data)
 * - Settings (Profile, Security, Preferences)
 * - Atrium (Wealth Management Hub + 14 sub-pages)
 * - Status & Errors (Loading, Success, Error messages)
 */

// ============================================================================
// NAVIGATION TOKENS (13 Main Menus)
// ============================================================================

export const NAV_TOKENS = {
  // Main navigation items
  vault: "nav.vault",
  link: "nav.link",
  flow: "nav.flow",
  insights: "nav.insights",
  curio: "nav.curio",
  grove: "nav.grove",
  care: "nav.care",
  nexus: "nav.nexus",
  atrium: "nav.atrium",
  settings: "nav.settings",
  chains: "nav.chains",
  help: "nav.help",
  support: "nav.support",
} as const;

// ============================================================================
// AUTHENTICATION TOKENS
// ============================================================================

export const AUTH_TOKENS = {
  // Sign In / Sign Up
  signIn: "auth.signIn",
  signUp: "auth.signUp",
  signOut: "auth.signOut",
  logout: "auth.logout",
  createAccount: "auth.createAccount",
  haveAccount: "auth.haveAccount",
  noAccount: "auth.noAccount",

  // Wallet Connection
  connectWallet: "auth.connectWallet",
  addWallet: "auth.addWallet",
  removeWallet: "auth.removeWallet",
  disconnectWallet: "auth.disconnectWallet",
  selectWallet: "auth.selectWallet",
  walletConnected: "auth.walletConnected",
  walletDisconnected: "auth.walletDisconnected",

  // Authentication Methods
  biometric: "auth.biometric",
  faceID: "auth.faceID",
  touchID: "auth.touchID",
  password: "auth.password",
  email: "auth.email",
  phone: "auth.phone",

  // Password / PIN
  createPassword: "auth.createPassword",
  enterPassword: "auth.enterPassword",
  confirmPassword: "auth.confirmPassword",
  currentPassword: "auth.currentPassword",
  newPassword: "auth.newPassword",
  passwordMismatch: "auth.passwordMismatch",
  weakPassword: "auth.weakPassword",
  passwordTooShort: "auth.passwordTooShort",

  // Verification
  verifyEmail: "auth.verifyEmail",
  verifyPhone: "auth.verifyPhone",
  emailVerified: "auth.emailVerified",
  phoneVerified: "auth.phoneVerified",
  verificationCode: "auth.verificationCode",
  enterCode: "auth.enterCode",
  resendCode: "auth.resendCode",
  codeExpired: "auth.codeExpired",

  // Two-Factor Authentication
  twoFactor: "auth.twoFactor",
  enable2FA: "auth.enable2FA",
  disable2FA: "auth.disable2FA",
  authenticatorApp: "auth.authenticatorApp",
  backupCodes: "auth.backupCodes",

  // Security & Backup
  backupPhrase: "auth.backupPhrase",
  seedPhrase: "auth.seedPhrase",
  saveSeedPhrase: "auth.saveSeedPhrase",
  confirmSeedPhrase: "auth.confirmSeedPhrase",
  neverShare: "auth.neverShare",
  iHaveSavedMyPhrase: "auth.iHaveSavedMyPhrase",

  // Session
  sessionExpired: "auth.sessionExpired",
  sessionTimeout: "auth.sessionTimeout",
  reAuthRequired: "auth.reAuthRequired",
  loginAgain: "auth.loginAgain",

  // Onboarding Steps
  step1GetStarted: "auth.onboarding.step1",
  step2CreateWallet: "auth.onboarding.step2",
  step3BackupSeed: "auth.onboarding.step3",
  step4SecurePassword: "auth.onboarding.step4",
  step5KYC: "auth.onboarding.step5",
} as const;

// ============================================================================
// GLOBAL ACTIONS (Reusable across app)
// ============================================================================

export const ACTIONS_TOKENS = {
  // Navigation
  back: "actions.back",
  next: "actions.next",
  skip: "actions.skip",
  continue: "actions.continue",
  close: "actions.close",
  done: "actions.done",
  finish: "actions.finish",

  // Transaction Actions
  send: "actions.send",
  receive: "actions.receive",
  swap: "actions.swap",
  buy: "actions.buy",
  sell: "actions.sell",
  bridge: "actions.bridge",
  stake: "actions.stake",
  unstake: "actions.unstake",
  claim: "actions.claim",
  deposit: "actions.deposit",
  withdraw: "actions.withdraw",

  // Wallet Actions
  connect: "actions.connect",
  disconnect: "actions.disconnect",
  import: "actions.import",
  export: "actions.export",
  rename: "actions.rename",

  // Data Actions
  approve: "actions.approve",
  reject: "actions.reject",
  confirm: "actions.confirm",
  cancel: "actions.cancel",
  save: "actions.save",
  delete: "actions.delete",
  edit: "actions.edit",
  update: "actions.update",
  refresh: "actions.refresh",
  reload: "actions.reload",

  // Additional Actions
  copy: "actions.copy",
  paste: "actions.paste",
  share: "actions.share",
  download: "actions.download",
  upload: "actions.upload",
  view: "actions.view",
  viewAll: "actions.viewAll",
  viewDetails: "actions.viewDetails",
  showMore: "actions.showMore",
  showLess: "actions.showLess",
  expand: "actions.expand",
  collapse: "actions.collapse",
} as const;

// ============================================================================
// VAULT TOKENS (Portfolio Overview)
// ============================================================================

export const VAULT_TOKENS = {
  // Overview
  portfolio: "vault.overview.portfolio",
  totalBalance: "vault.overview.totalBalance",
  totalAssets: "vault.overview.totalAssets",
  totalLiabilities: "vault.overview.totalLiabilities",
  netWorth: "vault.overview.netWorth",
  netWorthChange: "vault.overview.netWorthChange",

  // Portfolio Details
  allocations: "vault.allocations.title",
  performance: "vault.performance.title",
  performance24h: "vault.performance.24h",
  performance7d: "vault.performance.7d",
  performance30d: "vault.performance.30d",
  performanceYTD: "vault.performance.ytd",
  performanceAll: "vault.performance.all",

  // Asset Categories
  cryptoAssets: "vault.categories.cryptoAssets",
  stablecoins: "vault.categories.stablecoins",
  defiPositions: "vault.categories.defiPositions",
  nfts: "vault.categories.nfts",
  rwaAssets: "vault.categories.rwaAssets",

  // Actions
  rebalance: "vault.actions.rebalance",
  optimize: "vault.actions.optimize",
  viewHistory: "vault.actions.viewHistory",
  exportReport: "vault.actions.exportReport",
} as const;

// ============================================================================
// LINK TOKENS (Wallet Management & Cross-chain)
// ============================================================================

export const LINK_TOKENS = {
  // Overview
  title: "link.title",
  connectedWallets: "link.overview.connectedWallets",
  availableWallets: "link.overview.availableWallets",
  noWalletsConnected: "link.overview.noWalletsConnected",

  // Connection
  connectNewWallet: "link.connect.title",
  selectWalletType: "link.connect.selectWalletType",
  walletAddress: "link.connect.walletAddress",
  walletName: "link.connect.walletName",
  label: "link.connect.label",
  optionalLabel: "link.connect.optionalLabel",

  // Wallet Details
  lastActive: "link.details.lastActive",
  balance: "link.details.balance",
  networks: "link.details.networks",
  chains: "link.details.chains",
  connectedOn: "link.details.connectedOn",

  // Cross-chain
  availableNetworks: "link.crosschain.availableNetworks",
  selectedNetworks: "link.crosschain.selectedNetworks",
  addNetwork: "link.crosschain.addNetwork",
  removeNetwork: "link.crosschain.removeNetwork",

  // Actions
  editLabel: "link.actions.editLabel",
  changeLabel: "link.actions.changeLabel",
  setPrimary: "link.actions.setPrimary",
  primaryWallet: "link.actions.primaryWallet",
  disconnectWallet: "link.actions.disconnect",
  confirmDisconnect: "link.actions.confirmDisconnect",
} as const;

// ============================================================================
// FLOW TOKENS (Transactions & Transfers)
// ============================================================================

export const FLOW_TOKENS = {
  // Overview
  title: "flow.title",
  transactionHistory: "flow.history.title",
  recentTransactions: "flow.history.recent",
  allTransactions: "flow.history.all",
  noTransactions: "flow.history.noTransactions",

  // Transaction Types
  sent: "flow.types.sent",
  received: "flow.types.received",
  swapped: "flow.types.swapped",
  bridged: "flow.types.bridged",
  staked: "flow.types.staked",
  unstaked: "flow.types.unstaked",
  claimed: "flow.types.claimed",

  // Statuses
  pending: "flow.status.pending",
  completed: "flow.status.completed",
  failed: "flow.status.failed",
  cancelled: "flow.status.cancelled",
  confirming: "flow.status.confirming",

  // Send Flow
  sendStep1SelectAsset: "flow.send.step1.selectAsset",
  sendStep2EnterAmount: "flow.send.step2.enterAmount",
  sendStep2SelectRecipient: "flow.send.step2.selectRecipient",
  sendStep3SelectNetwork: "flow.send.step3.selectNetwork",
  sendStep4ReviewSend: "flow.send.step4.review",
  sendStep4YouSending: "flow.send.step4.youSending",
  sendStep4ToAddress: "flow.send.step4.toAddress",
  sendStep4Network: "flow.send.step4.network",
  sendStep4Fee: "flow.send.step4.fee",
  sendStep4Total: "flow.send.step4.total",

  // Receive Flow
  receiveStep1SelectAsset: "flow.receive.step1.selectAsset",
  receiveStep2ShareAddress: "flow.receive.step2.shareAddress",
  receiveStep3CopyAddress: "flow.receive.step3.copyAddress",
  receiveAddressCopied: "flow.receive.addressCopied",
  receiveYourAddress: "flow.receive.yourAddress",
  receiveSelectNetwork: "flow.receive.selectNetwork",

  // Transaction Details
  viewDetails: "flow.details.viewDetails",
  txHash: "flow.details.txHash",
  blockExplorer: "flow.details.blockExplorer",
  from: "flow.details.from",
  to: "flow.details.to",
  date: "flow.details.date",
  time: "flow.details.time",
  gas: "flow.details.gas",
  gasUsed: "flow.details.gasUsed",
  gasFee: "flow.details.gasFee",
  memo: "flow.details.memo",

  // Fiat Bridge
  fiatBridgeTitle: "flow.fiatBridge.title",
  fiatBridgeStep1SelectProvider: "flow.fiatBridge.step1.selectProvider",
  fiatBridgeStep2EnterAmount: "flow.fiatBridge.step2.enterAmount",
  fiatBridgeStep2SelectCrypto: "flow.fiatBridge.step2.selectCrypto",
  fiatBridgeStep3ReviewOffer: "flow.fiatBridge.step3.reviewOffer",
  fiatBridgeStep4PaymentMethod: "flow.fiatBridge.step4.paymentMethod",
  fiatBridgeRate: "flow.fiatBridge.rate",
  fiatBridgeFee: "flow.fiatBridge.fee",
  fiatBridgeEstimatedTime: "flow.fiatBridge.estimatedTime",

  // Export
  exportCSV: "flow.export.csv",
  exportPDF: "flow.export.pdf",
  exportJSON: "flow.export.json",
} as const;

// ============================================================================
// INSIGHTS TOKENS (Analytics & Market Data)
// ============================================================================

export const INSIGHTS_TOKENS = {
  // Overview
  title: "insights.title",
  analytics: "insights.analytics.title",
  marketData: "insights.market.title",

  // Summary Section
  summaryPortfolioValue: "insights.summary.portfolioValue",
  summaryTotalGain: "insights.summary.totalGain",
  summaryUnrealizedPNL: "insights.summary.unrealizedPNL",
  summaryRealizedPNL: "insights.summary.realizedPNL",
  summaryROI: "insights.summary.roi",

  // Charts & Visualization
  chartAllocation: "insights.charts.allocation",
  chartPerformance: "insights.charts.performance",
  chartComparison: "insights.charts.comparison",
  chartHistorical: "insights.charts.historical",
  chartVolume: "insights.charts.volume",

  // Asset Details
  assetName: "insights.assetDetails.name",
  assetSymbol: "insights.assetDetails.symbol",
  assetPrice: "insights.assetDetails.price",
  assetPriceChange: "insights.assetDetails.priceChange",
  assetPriceChange24h: "insights.assetDetails.priceChange24h",
  assetPriceChange7d: "insights.assetDetails.priceChange7d",
  assetPriceChange30d: "insights.assetDetails.priceChange30d",
  assetMarketCap: "insights.assetDetails.marketCap",
  assetVolume24h: "insights.assetDetails.volume24h",
  assetAllTimeHigh: "insights.assetDetails.allTimeHigh",
  assetAllTimeLow: "insights.assetDetails.allTimeLow",

  // Holdings
  holdingAmount: "insights.holdings.amount",
  holdingValue: "insights.holdings.value",
  holdingCost: "insights.holdings.cost",
  holdingGain: "insights.holdings.gain",
  holdingGainPercent: "insights.holdings.gainPercent",
  holdingAvgCost: "insights.holdings.avgCost",
  holdingAcquiredDate: "insights.holdings.acquiredDate",

  // AI Panel (Premium)
  aiInsights: "insights.ai.insights",
  aiRecommendation: "insights.ai.recommendation",
  aiRiskAnalysis: "insights.ai.riskAnalysis",
  aiTaxOpportunity: "insights.ai.taxOpportunity",

  // Market Alerts
  priceAlert: "insights.alerts.priceAlert",
  setAlert: "insights.alerts.setAlert",
  alertWhen: "insights.alerts.alertWhen",
  reaches: "insights.alerts.reaches",
  above: "insights.alerts.above",
  below: "insights.alerts.below",

  // Filters
  filter24h: "insights.filters.24h",
  filter7d: "insights.filters.7d",
  filter30d: "insights.filters.30d",
  filterYTD: "insights.filters.ytd",
  filterAll: "insights.filters.all",
} as const;

// ============================================================================
// SETTINGS TOKENS (User Preferences & Security)
// ============================================================================

export const SETTINGS_TOKENS = {
  // Main Menu
  title: "settings.title",
  profileSettings: "settings.profile.title",
  securitySettings: "settings.security.title",
  preferenceSettings: "settings.preferences.title",
  notificationSettings: "settings.notifications.title",
  advancedSettings: "settings.advanced.title",

  // Profile
  profileName: "settings.profile.name",
  profileEmail: "settings.profile.email",
  profilePhone: "settings.profile.phone",
  profilePhoto: "settings.profile.photo",
  uploadPhoto: "settings.profile.uploadPhoto",
  changePhoto: "settings.profile.changePhoto",
  removePhoto: "settings.profile.removePhoto",
  kycStatus: "settings.profile.kycStatus",
  kycVerified: "settings.profile.kycVerified",
  kycPending: "settings.profile.kycPending",

  // Security
  password: "settings.security.password",
  changePassword: "settings.security.changePassword",
  currentPassword: "settings.security.currentPassword",
  newPassword: "settings.security.newPassword",
  confirmPassword: "settings.security.confirmPassword",
  twoFactor: "settings.security.twoFactor",
  enableTwoFactor: "settings.security.enableTwoFactor",
  disableTwoFactor: "settings.security.disableTwoFactor",
  twoFactorEnabled: "settings.security.twoFactorEnabled",
  biometric: "settings.security.biometric",
  enableBiometric: "settings.security.enableBiometric",
  disableBiometric: "settings.security.disableBiometric",
  backupCodes: "settings.security.backupCodes",
  downloadBackupCodes: "settings.security.downloadBackupCodes",
  sessionTimeout: "settings.security.sessionTimeout",
  autoLogout: "settings.security.autoLogout",
  activeDevices: "settings.security.activeDevices",
  logOutAllDevices: "settings.security.logOutAllDevices",

  // Preferences
  language: "settings.preferences.language",
  selectLanguage: "settings.preferences.selectLanguage",
  theme: "settings.preferences.theme",
  lightTheme: "settings.preferences.lightTheme",
  darkTheme: "settings.preferences.darkTheme",
  autoTheme: "settings.preferences.autoTheme",
  currency: "settings.preferences.currency",
  selectCurrency: "settings.preferences.selectCurrency",
  timeFormat: "settings.preferences.timeFormat",
  dateFormat: "settings.preferences.dateFormat",

  // Notifications
  notificationsEnabled: "settings.notifications.enabled",
  pushNotifications: "settings.notifications.push",
  emailNotifications: "settings.notifications.email",
  priceAlerts: "settings.notifications.priceAlerts",
  transactionAlerts: "settings.notifications.transactionAlerts",
  securityAlerts: "settings.notifications.securityAlerts",
  marketAlerts: "settings.notifications.marketAlerts",

  // Advanced
  dataPrivacy: "settings.advanced.dataPrivacy",
  exportData: "settings.advanced.exportData",
  deleteAccount: "settings.advanced.deleteAccount",
  dangerZone: "settings.advanced.dangerZone",
  aboutApp: "settings.advanced.aboutApp",
  version: "settings.advanced.version",
  buildNumber: "settings.advanced.buildNumber",

  // General
  logout: "settings.logout",
  confirmLogout: "settings.confirmLogout",
} as const;

// ============================================================================
// ATRIUM TOKENS (Wealth Management Hub - Premium)
// ============================================================================

export const ATRIUM_TOKENS = {
  // Hub Overview
  title: "atrium.title",
  subtitle: "atrium.subtitle",
  wealthManagementHub: "atrium.wealthManagementHub",

  // Main Menu Items (14 Sub-pages)
  assetsManagement: "atrium.assetsManagement",
  defiMonitoring: "atrium.defiMonitoring",
  yieldOptimization: "atrium.yieldOptimization",
  riskAssessment: "atrium.riskAssessment",
  taxPlanning: "atrium.taxPlanning",
  reporting: "atrium.reporting",
  alerts: "atrium.alerts",
  marketAnalysis: "atrium.marketAnalysis",
  rebalancing: "atrium.rebalancing",
  performance: "atrium.performance",
  benchmarking: "atrium.benchmarking",
  goalTracking: "atrium.goalTracking",
  scenarioPlanning: "atrium.scenarioPlanning",
  advisory: "atrium.advisory",

  // Assets Management
  assetsTotal: "atrium.assets.total",
  assetsAllocation: "atrium.assets.allocation",
  assetsDistribution: "atrium.assets.distribution",
  assetsAdd: "atrium.assets.add",
  assetsRemove: "atrium.assets.remove",
  assetsReorder: "atrium.assets.reorder",

  // DeFi Monitoring
  defiPositions: "atrium.defi.positions",
  defiProtocols: "atrium.defi.protocols",
  defiTVL: "atrium.defi.tvl",
  defiAPY: "atrium.defi.apy",
  defiRewards: "atrium.defi.rewards",
  defiClaimRewards: "atrium.defi.claimRewards",

  // Yield Optimization
  yieldStrategies: "atrium.yield.strategies",
  yieldRecommended: "atrium.yield.recommended",
  yieldExpected: "atrium.yield.expected",
  yieldAPY: "atrium.yield.apy",
  yieldCompounding: "atrium.yield.compounding",
  yieldDeposit: "atrium.yield.deposit",

  // Risk Assessment
  riskScore: "atrium.risk.score",
  riskLevel: "atrium.risk.level",
  riskExposure: "atrium.risk.exposure",
  riskConcentration: "atrium.risk.concentration",
  riskRecommendations: "atrium.risk.recommendations",
  riskMetrics: "atrium.risk.metrics",

  // Tax Planning
  taxableEvents: "atrium.tax.taxableEvents",
  realizedGains: "atrium.tax.realizedGains",
  unrealizedGains: "atrium.tax.unrealizedGains",
  estimatedTax: "atrium.tax.estimatedTax",
  harvestingOpportunity: "atrium.tax.harvestingOpportunity",
  taxReport: "atrium.tax.taxReport",

  // Reporting
  reportGenerate: "atrium.reporting.generate",
  reportType: "atrium.reporting.type",
  reportPeriod: "atrium.reporting.period",
  reportFormat: "atrium.reporting.format",
  reportDownload: "atrium.reporting.download",

  // Alerts
  alertCreate: "atrium.alerts.create",
  alertEdit: "atrium.alerts.edit",
  alertDelete: "atrium.alerts.delete",
  alertThreshold: "atrium.alerts.threshold",
  alertFrequency: "atrium.alerts.frequency",

  // Market Analysis
  analysisChart: "atrium.analysis.chart",
  analysisMetrics: "atrium.analysis.metrics",
  analysisTrends: "atrium.analysis.trends",
  analysisComparison: "atrium.analysis.comparison",

  // Rebalancing
  rebalancePortfolio: "atrium.rebalance.portfolio",
  rebalanceTarget: "atrium.rebalance.target",
  rebalanceStrategy: "atrium.rebalance.strategy",
  rebalanceEstimate: "atrium.rebalance.estimate",
  rebalanceExecute: "atrium.rebalance.execute",

  // Performance
  performanceMetrics: "atrium.performance.metrics",
  performanceBenchmark: "atrium.performance.benchmark",
  performanceComparison: "atrium.performance.comparison",
  performanceTimeline: "atrium.performance.timeline",

  // Benchmarking
  benchmarkIndex: "atrium.benchmark.index",
  benchmarkMetrics: "atrium.benchmark.metrics",
  benchmarkVersus: "atrium.benchmark.versus",
  benchmarkOutperformance: "atrium.benchmark.outperformance",

  // Goal Tracking
  goalCreate: "atrium.goals.create",
  goalTarget: "atrium.goals.target",
  goalTimeline: "atrium.goals.timeline",
  goalProgress: "atrium.goals.progress",
  goalOnTrack: "atrium.goals.onTrack",

  // Scenario Planning
  scenarioCreate: "atrium.scenario.create",
  scenarioName: "atrium.scenario.name",
  scenarioParameters: "atrium.scenario.parameters",
  scenarioResult: "atrium.scenario.result",
  scenarioCompare: "atrium.scenario.compare",

  // Advisory (Premium Concierge)
  advisoryConnect: "atrium.advisory.connect",
  advisorySchedule: "atrium.advisory.schedule",
  advisoryChat: "atrium.advisory.chat",
  advisoryCall: "atrium.advisory.call",
  advisoryEmail: "atrium.advisory.email",
} as const;

// ============================================================================
// STATUS & ERROR TOKENS
// ============================================================================

export const STATUS_TOKENS = {
  // Loading States
  loading: "status.loading",
  loadingMore: "status.loadingMore",
  loadingData: "status.loadingData",
  loadingTransaction: "status.loadingTransaction",
  processing: "status.processing",
  processingTransaction: "status.processingTransaction",
  submitting: "status.submitting",

  // Success States
  success: "status.success",
  successTransactionSent: "status.successTransactionSent",
  successTransactionReceived: "status.successTransactionReceived",
  successWalletConnected: "status.successWalletConnected",
  successSaved: "status.successSaved",
  successCopied: "status.successCopied",
  successDownloaded: "status.successDownloaded",

  // Error States
  error: "status.error",
  errorGeneral: "status.errorGeneral",
  errorNetwork: "status.errorNetwork",
  errorTimeout: "status.errorTimeout",
  errorNotFound: "status.errorNotFound",
  errorUnauthorized: "status.errorUnauthorized",
  errorForbidden: "status.errorForbidden",
  errorServerError: "status.errorServerError",
  errorInvalidInput: "status.errorInvalidInput",
  errorValidation: "status.errorValidation",

  // Validation Errors
  required: "errors.required",
  invalid: "errors.invalid",
  invalidEmail: "errors.invalidEmail",
  invalidAddress: "errors.invalidAddress",
  invalidAmount: "errors.invalidAmount",
  insufficientBalance: "errors.insufficientBalance",
  insufficientGas: "errors.insufficientGas",
  minimumAmount: "errors.minimumAmount",
  maximumAmount: "errors.maximumAmount",
  amountTooSmall: "errors.amountTooSmall",
  amountTooLarge: "errors.amountTooLarge",

  // Transaction Errors
  transactionFailed: "errors.transactionFailed",
  transactionRejected: "errors.transactionRejected",
  transactionRevokedByUser: "errors.transactionRevokedByUser",
  transactionExpired: "errors.transactionExpired",
  slippageExceeded: "errors.slippageExceeded",
  priceImpactTooHigh: "errors.priceImpactTooHigh",

  // Wallet Errors
  walletNotConnected: "errors.walletNotConnected",
  walletNotSupported: "errors.walletNotSupported",
  walletNotInstalled: "errors.walletNotInstalled",
  networkNotSupported: "errors.networkNotSupported",
  switchNetwork: "errors.switchNetwork",

  // Empty States
  emptyNoData: "empty.noData",
  emptyNoTransactions: "empty.noTransactions",
  emptyNoAssets: "empty.noAssets",
  emptyNoWallets: "empty.noWallets",
  emptySearchResults: "empty.searchResults",

  // Retry
  retry: "status.retry",
  tryAgain: "status.tryAgain",
  goBack: "status.goBack",
  reportIssue: "status.reportIssue",
} as const;

// ============================================================================
// FLATTEN ALL TOKENS INTO SINGLE OBJECT
// ============================================================================

export const TOKENS = {
  ...NAV_TOKENS,
  ...AUTH_TOKENS,
  ...ACTIONS_TOKENS,
  ...VAULT_TOKENS,
  ...LINK_TOKENS,
  ...FLOW_TOKENS,
  ...INSIGHTS_TOKENS,
  ...SETTINGS_TOKENS,
  ...ATRIUM_TOKENS,
  ...STATUS_TOKENS,
} as const;

/**
 * Token keys type for type-safe token access
 */
export type TokenKey = typeof TOKENS[keyof typeof TOKENS];

/**
 * Utility type to extract token keys by category
 */
export type TokensByCategory = {
  nav: typeof NAV_TOKENS;
  auth: typeof AUTH_TOKENS;
  actions: typeof ACTIONS_TOKENS;
  vault: typeof VAULT_TOKENS;
  link: typeof LINK_TOKENS;
  flow: typeof FLOW_TOKENS;
  insights: typeof INSIGHTS_TOKENS;
  settings: typeof SETTINGS_TOKENS;
  atrium: typeof ATRIUM_TOKENS;
  status: typeof STATUS_TOKENS;
};