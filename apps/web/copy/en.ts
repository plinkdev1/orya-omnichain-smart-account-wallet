/**
 * Web Copy Dictionary (English - Standard Tier)
 * Web-optimized microcopy with full labels for desktop screens
 */

export const copyEN = {
  // ========================================================================
  // NAVIGATION (13 Main Menus)
  // ========================================================================
  nav: {
    home: "Home",
    vault: "Vault",
    link: "Link",
    flow: "Flow",
    insights: "Insights",
    curio: "Curio",
    grove: "Grove",
    care: "Care",
    nexus: "Nexus",
    atrium: "Atrium",
    settings: "Settings",
    chains: "Chains",
    help: "Help",
    support: "Support",
    portfolio: "Portfolio",
    transactions: "Transactions",
  },

  // ========================================================================
  // AUTHENTICATION
  // ========================================================================
  auth: {
    // Welcome & Login
    welcome: "Welcome",
    welcomeBack: "Welcome back to ORŸA Wallet",
    pleaseLogin: "Please log in to continue",
    
    // Sign In / Sign Up
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    logout: "Log Out",
    createAccount: "Create Account",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",

    // Wallet Connection
    connectWallet: "Connect Wallet",
    addWallet: "Add Wallet",
    removeWallet: "Remove Wallet",
    disconnectWallet: "Disconnect Wallet",
    selectWallet: "Select a Wallet",
    walletConnected: "Wallet Connected",
    walletDisconnected: "Wallet Disconnected",

    // Authentication Methods
    biometric: "Biometric Authentication",
    faceID: "Face ID",
    touchID: "Touch ID",
    password: "Password",
    email: "Email Address",
    phone: "Phone Number",

    // Password / PIN
    createPassword: "Create Password",
    enterPassword: "Enter Password",
    confirmPassword: "Confirm Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    passwordMismatch: "Passwords do not match",
    weakPassword: "Password is too weak",
    passwordTooShort: "Password must be at least 8 characters",

    // Verification
    verifyEmail: "Verify Email",
    verifyPhone: "Verify Phone Number",
    emailVerified: "Email Verified",
    phoneVerified: "Phone Number Verified",
    verificationCode: "Verification Code",
    enterCode: "Enter the code we sent you",
    resendCode: "Resend Code",
    codeExpired: "Verification code has expired",

    // Two-Factor Authentication
    twoFactor: "Two-Factor Authentication",
    enable2FA: "Enable Two-Factor Authentication",
    disable2FA: "Disable Two-Factor Authentication",
    authenticatorApp: "Authenticator App",
    backupCodes: "Backup Codes",

    // Security & Backup
    backupPhrase: "Backup Phrase",
    seedPhrase: "Seed Phrase",
    saveSeedPhrase: "Save Your Seed Phrase",
    confirmSeedPhrase: "Confirm Your Seed Phrase",
    neverShare: "Never share your seed phrase with anyone",
    iHaveSavedMyPhrase: "I have saved my seed phrase",

    // Session
    sessionExpired: "Your session has expired",
    sessionTimeout: "Session timeout",
    reAuthRequired: "Re-authentication required",
    loginAgain: "Please log in again",

    // Onboarding Steps
    onboarding: {
      step1: "Get Started",
      step2: "Create Your Wallet",
      step3: "Back Up Your Seed Phrase",
      step4: "Secure Your Account",
      step5: "Complete Verification",
    },
  },

  // ========================================================================
  // GLOBAL ACTIONS
  // ========================================================================
  actions: {
    // Navigation
    back: "Back",
    next: "Next",
    skip: "Skip",
    continue: "Continue",
    close: "Close",
    done: "Done",
    finish: "Finish",
    goToLogin: "Go to Login",
    goToSettings: "Go to Settings",

    // Transaction Actions
    send: "Send",
    receive: "Receive",
    swap: "Swap",
    buy: "Buy",
    sell: "Sell",
    bridge: "Bridge",
    stake: "Stake",
    unstake: "Unstake",
    claim: "Claim",
    deposit: "Deposit",
    withdraw: "Withdraw",

    // Wallet Actions
    connect: "Connect",
    disconnect: "Disconnect",
    import: "Import",
    export: "Export",
    rename: "Rename",

    // Data Actions
    approve: "Approve",
    reject: "Reject",
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    update: "Update",
    refresh: "Refresh",
    reload: "Reload",

    // Additional Actions
    copy: "Copy",
    paste: "Paste",
    share: "Share",
    download: "Download",
    upload: "Upload",
    view: "View",
    viewAll: "View All",
    viewDetails: "View Details",
    showMore: "Show More",
    showLess: "Show Less",
    expand: "Expand",
    collapse: "Collapse",
    
    // Vault-specific
    openVault: "Open Vault",
    viewPortfolio: "View Portfolio",
    viewTransactions: "View Transactions",
    filter: "Filter",
    viewAllChains: "View All Chains",
  },

  // ========================================================================
  // HOME PAGE
  // ========================================================================
  home: {
    discover: "Discover",
    exploreDApps: "Explore dApps",
    deals: "Exclusive deals",
    offers: "Offers",
    assets: "Assets",
    tokens: "Browse tokens",
    campaigns: "Campaigns",
    promo: "Active promotions",
    vaultDescription: "Portfolio overview and wallet management",
    portfolioDescription: "Detailed analytics and insights",
    transactionsDescription: "Transaction history and details",
    settingsDescription: "Manage your preferences",
  },

  // ========================================================================
  // VAULT (Portfolio Overview)
  // ========================================================================
  vault: {
    overview: {
      portfolio: "Portfolio",
      totalBalance: "Total Balance",
      totalAssets: "Total Assets",
      totalLiabilities: "Total Liabilities",
      netWorth: "Net Worth",
      netWorthChange: "Net Worth Change",
    },

    allocations: {
      title: "Asset Allocation",
    },

    performance: {
      title: "Performance",
      "24h": "24h Change",
      "7d": "7 Day Change",
      "30d": "30 Day Change",
      ytd: "Year-to-Date",
      all: "All Time",
    },

    categories: {
      cryptoAssets: "Crypto Assets",
      stablecoins: "Stablecoins",
      defiPositions: "DeFi Positions",
      nfts: "NFTs",
      rwaAssets: "Real-World Assets",
    },

    search: {
      assets: "Search assets...",
    },

    filters: {
      allAssets: "All Assets",
      favorites: "Favorites",
      layer1: "Layer 1",
      layer2: "Layer 2",
    },

    assets: "Assets",
    recentActivity: "Recent Activity",

    actions: {
      rebalance: "Rebalance Portfolio",
      optimize: "Optimize Returns",
      viewHistory: "View History",
      exportReport: "Export Report",
    },
  },

  // ========================================================================
  // LINK (Wallet Management & Cross-chain)
  // ========================================================================
  link: {
    title: "Link",

    overview: {
      connectedWallets: "Connected Wallets",
      availableWallets: "Available Wallets",
      noWalletsConnected: "No wallets connected yet",
    },

    connect: {
      title: "Connect New Wallet",
      selectWalletType: "Select Wallet Type",
      walletAddress: "Wallet Address",
      walletName: "Wallet Name",
      label: "Label",
      optionalLabel: "Label (Optional)",
    },

    details: {
      lastActive: "Last Active",
      balance: "Balance",
      networks: "Networks",
      chains: "Chains",
      connectedOn: "Connected On",
    },

    crosschain: {
      availableNetworks: "Available Networks",
      selectedNetworks: "Selected Networks",
      addNetwork: "Add Network",
      removeNetwork: "Remove Network",
    },

    actions: {
      editLabel: "Edit Label",
      changeLabel: "Change Label",
      setPrimary: "Set as Primary",
      primaryWallet: "Primary Wallet",
      disconnect: "Disconnect Wallet",
      confirmDisconnect: "Are you sure you want to disconnect this wallet?",
    },
  },

  // ========================================================================
  // FLOW (Transactions & Transfers)
  // ========================================================================
  flow: {
    title: "Flow",

    history: {
      title: "Transaction History",
      recent: "Recent Transactions",
      all: "All Transactions",
      noTransactions: "No transactions yet",
    },

    types: {
      sent: "Sent",
      received: "Received",
      swapped: "Swapped",
      bridged: "Bridged",
      staked: "Staked",
      unstaked: "Unstaked",
      claimed: "Claimed",
    },

    status: {
      pending: "Pending",
      completed: "Completed",
      failed: "Failed",
      cancelled: "Cancelled",
      confirming: "Confirming",
    },

    send: {
      step1: {
        selectAsset: "Select Asset to Send",
      },
      step2: {
        enterAmount: "Enter Amount",
        selectRecipient: "Select Recipient",
      },
      step3: {
        selectNetwork: "Select Network",
      },
      step4: {
        review: "Review Transaction",
        youSending: "You're Sending",
        toAddress: "To Address",
        network: "Network",
        fee: "Transaction Fee",
        total: "Total Amount",
      },
    },

    receive: {
      step1: {
        selectAsset: "Select Asset to Receive",
      },
      step2: {
        shareAddress: "Share Your Address",
      },
      step3: {
        copyAddress: "Copy Your Address",
      },
      addressCopied: "Address copied to clipboard",
      yourAddress: "Your Address",
      selectNetwork: "Select Network",
    },

    details: {
      viewDetails: "View Details",
      txHash: "Transaction Hash",
      blockExplorer: "View on Block Explorer",
      from: "From",
      to: "To",
      date: "Date",
      time: "Time",
      gas: "Gas",
      gasUsed: "Gas Used",
      gasFee: "Gas Fee",
      memo: "Memo",
    },

    fiatBridge: {
      title: "Buy Crypto",
      step1: {
        selectProvider: "Select Payment Provider",
      },
      step2: {
        enterAmount: "Enter Amount",
        selectCrypto: "Select Cryptocurrency",
      },
      step3: {
        reviewOffer: "Review Offer",
      },
      step4: {
        paymentMethod: "Select Payment Method",
      },
      rate: "Exchange Rate",
      fee: "Service Fee",
      estimatedTime: "Estimated Time",
    },

    export: {
      csv: "Export as CSV",
      pdf: "Export as PDF",
      json: "Export as JSON",
    },
  },

  // ========================================================================
  // INSIGHTS (Analytics & Market Data)
  // ========================================================================
  insights: {
    title: "Insights",

    analytics: {
      title: "Analytics",
    },

    market: {
      title: "Market Data",
    },

    summary: {
      portfolioValue: "Portfolio Value",
      totalGain: "Total Gain",
      unrealizedPNL: "Unrealized P&L",
      realizedPNL: "Realized P&L",
      roi: "Return on Investment",
    },

    charts: {
      allocation: "Asset Allocation",
      performance: "Performance",
      comparison: "Comparison",
      historical: "Historical Data",
      volume: "Trading Volume",
    },

    assetDetails: {
      name: "Asset Name",
      symbol: "Symbol",
      price: "Current Price",
      priceChange: "Price Change",
      priceChange24h: "24h Change",
      priceChange7d: "7d Change",
      priceChange30d: "30d Change",
      marketCap: "Market Cap",
      volume24h: "24h Volume",
      allTimeHigh: "All-Time High",
      allTimeLow: "All-Time Low",
    },

    holdings: {
      amount: "Amount",
      value: "Current Value",
      cost: "Cost Basis",
      gain: "Gain/Loss",
      gainPercent: "Gain/Loss %",
      avgCost: "Average Cost",
      acquiredDate: "Acquired Date",
    },

    ai: {
      insights: "AI Insights",
      recommendation: "AI Recommendation",
      riskAnalysis: "Risk Analysis",
      taxOpportunity: "Tax Saving Opportunity",
    },

    alerts: {
      priceAlert: "Price Alert",
      setAlert: "Set Price Alert",
      alertWhen: "Alert when",
      reaches: "reaches",
      above: "above",
      below: "below",
    },

    filters: {
      "24h": "24 Hours",
      "7d": "7 Days",
      "30d": "30 Days",
      ytd: "Year-to-Date",
      all: "All Time",
    },
  },

  // ========================================================================
  // SETTINGS
  // ========================================================================
  settings: {
    title: "Settings",

    profile: {
      title: "Profile Settings",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      photo: "Profile Photo",
      uploadPhoto: "Upload Photo",
      changePhoto: "Change Photo",
      removePhoto: "Remove Photo",
      kycStatus: "Verification Status",
      kycVerified: "Verified",
      kycPending: "Pending",
    },

    security: {
      title: "Security Settings",
      password: "Password",
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      twoFactor: "Two-Factor Authentication",
      enableTwoFactor: "Enable 2FA",
      disableTwoFactor: "Disable 2FA",
      twoFactorEnabled: "Two-Factor Authentication Enabled",
      biometric: "Biometric Authentication",
      enableBiometric: "Enable Biometric Login",
      disableBiometric: "Disable Biometric Login",
      backupCodes: "Backup Codes",
      downloadBackupCodes: "Download Backup Codes",
      sessionTimeout: "Session Timeout",
      autoLogout: "Auto-logout after inactivity",
      activeDevices: "Active Devices",
      logOutAllDevices: "Log Out All Devices",
    },

    preferences: {
      title: "Preferences",
      language: "Language",
      selectLanguage: "Select Language",
      theme: "Theme",
      lightTheme: "Light",
      darkTheme: "Dark",
      autoTheme: "Auto (System)",
      currency: "Display Currency",
      selectCurrency: "Select Currency",
      timeFormat: "Time Format",
      dateFormat: "Date Format",
    },

    notifications: {
      title: "Notifications",
      enabled: "Enable Notifications",
      push: "Push Notifications",
      email: "Email Notifications",
      priceAlerts: "Price Alerts",
      transactionAlerts: "Transaction Alerts",
      securityAlerts: "Security Alerts",
      marketAlerts: "Market Alerts",
    },

    advanced: {
      title: "Advanced Settings",
      dataPrivacy: "Data & Privacy",
      exportData: "Export My Data",
      deleteAccount: "Delete Account",
      dangerZone: "Danger Zone",
      aboutApp: "About the App",
      version: "Version",
      buildNumber: "Build Number",
    },

    logout: "Log Out",
    confirmLogout: "Are you sure you want to log out?",
  },

  // ========================================================================
  // ATRIUM (Wealth Management Hub)
  // ========================================================================
  atrium: {
    title: "Atrium",
    subtitle: "Wealth Management",
    wealthManagementHub: "Wealth Management Hub",

    // 14 Sub-pages
    assetsManagement: "Assets Management",
    defiMonitoring: "DeFi Monitoring",
    yieldOptimization: "Yield Optimization",
    riskAssessment: "Risk Assessment",
    taxPlanning: "Tax Planning",
    reporting: "Reporting",
    alerts: "Alerts",
    marketAnalysis: "Market Analysis",
    rebalancing: "Rebalancing",
    performance: "Performance",
    benchmarking: "Benchmarking",
    goalTracking: "Goal Tracking",
    scenarioPlanning: "Scenario Planning",
    advisory: "Financial Advisory",

    assets: {
      total: "Total Assets",
      allocation: "Allocation",
      distribution: "Distribution",
      add: "Add Asset",
      remove: "Remove Asset",
      reorder: "Reorder Assets",
    },

    defi: {
      positions: "Active Positions",
      protocols: "Protocols",
      tvl: "Total Value Locked",
      apy: "Annual Percentage Yield",
      rewards: "Rewards",
      claimRewards: "Claim Rewards",
    },

    yield: {
      strategies: "Yield Strategies",
      recommended: "Recommended for You",
      expected: "Expected Yield",
      apy: "APY",
      compounding: "Auto-Compounding",
      deposit: "Deposit to Strategy",
    },

    risk: {
      score: "Risk Score",
      level: "Risk Level",
      exposure: "Risk Exposure",
      concentration: "Concentration Risk",
      recommendations: "Recommendations",
      metrics: "Risk Metrics",
    },

    tax: {
      taxableEvents: "Taxable Events",
      realizedGains: "Realized Gains",
      unrealizedGains: "Unrealized Gains",
      estimatedTax: "Estimated Tax",
      harvestingOpportunity: "Tax-Loss Harvesting Opportunity",
      taxReport: "Generate Tax Report",
    },

    reporting: {
      generate: "Generate Report",
      type: "Report Type",
      period: "Period",
      format: "Format",
      download: "Download Report",
    },

    alerts: {
      create: "Create Alert",
      edit: "Edit Alert",
      delete: "Delete Alert",
      threshold: "Alert Threshold",
      frequency: "Notification Frequency",
    },

    analysis: {
      chart: "Analysis Chart",
      metrics: "Key Metrics",
      trends: "Trends",
      comparison: "Comparison",
    },

    rebalance: {
      portfolio: "Rebalance Portfolio",
      target: "Target Allocation",
      strategy: "Rebalancing Strategy",
      estimate: "Estimate Changes",
      execute: "Execute Rebalancing",
    },

    performance: {
      metrics: "Performance Metrics",
      benchmark: "Benchmark",
      comparison: "Comparison",
      timeline: "Performance Timeline",
    },

    benchmark: {
      index: "Benchmark Index",
      metrics: "Metrics",
      versus: "vs. Benchmark",
      outperformance: "Outperformance",
    },

    goals: {
      create: "Create Goal",
      target: "Target Amount",
      timeline: "Target Date",
      progress: "Progress",
      onTrack: "On Track",
    },

    scenario: {
      create: "Create Scenario",
      name: "Scenario Name",
      parameters: "Parameters",
      result: "Result",
      compare: "Compare Scenarios",
    },

    advisory: {
      connect: "Connect with Advisor",
      schedule: "Schedule a Call",
      chat: "Chat with Advisor",
      call: "Video Call",
      email: "Email Support",
    },
  },

  // ========================================================================
  // STATUS & ERRORS
  // ========================================================================
  status: {
    loading: "Loading...",
    loadingMore: "Loading more...",
    loadingData: "Loading data...",
    loadingTransaction: "Processing transaction...",
    processing: "Processing...",
    processingTransaction: "Processing your transaction...",
    submitting: "Submitting...",

    success: "Success!",
    successTransactionSent: "Transaction sent successfully",
    successTransactionReceived: "Transaction received",
    successWalletConnected: "Wallet connected successfully",
    successSaved: "Saved successfully",
    successCopied: "Copied to clipboard",
    successDownloaded: "Downloaded successfully",

    error: "Error",
    errorGeneral: "An error occurred",
    errorNetwork: "Network error",
    errorTimeout: "Request timeout",
    errorNotFound: "Not found",
    errorUnauthorized: "Unauthorized",
    errorForbidden: "Forbidden",
    errorServerError: "Server error",
    errorInvalidInput: "Invalid input",
    errorValidation: "Validation error",

    retry: "Retry",
    tryAgain: "Try Again",
    goBack: "Go Back",
    reportIssue: "Report Issue",
  },

  errors: {
    required: "This field is required",
    invalid: "Invalid input",
    invalidEmail: "Please enter a valid email address",
    invalidAddress: "Invalid wallet address",
    invalidAmount: "Invalid amount",
    insufficientBalance: "Insufficient balance",
    insufficientGas: "Insufficient gas for transaction",
    minimumAmount: "Below minimum amount",
    maximumAmount: "Exceeds maximum amount",
    amountTooSmall: "Amount is too small",
    amountTooLarge: "Amount is too large",

    transactionFailed: "Transaction failed",
    transactionRejected: "Transaction was rejected",
    transactionRevokedByUser: "Transaction cancelled by user",
    transactionExpired: "Transaction has expired",
    slippageExceeded: "Slippage exceeded tolerance",
    priceImpactTooHigh: "Price impact is too high",

    walletNotConnected: "Wallet not connected",
    walletNotSupported: "Wallet not supported",
    walletNotInstalled: "Wallet not installed",
    networkNotSupported: "Network not supported",
    switchNetwork: "Please switch to a supported network",
  },

  empty: {
    noData: "No data available",
    noTransactions: "No transactions yet",
    noAssets: "No assets",
    noWallets: "No wallets connected",
    searchResults: "No results found",
  },
};

export type CopyKeyWeb = keyof typeof copyEN;
