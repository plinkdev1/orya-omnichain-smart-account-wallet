import { prisma } from "./client";

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (order matters due to foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.fiatTransaction.deleteMany();
  await prisma.lendingPosition.deleteMany();
  await prisma.stakingPosition.deleteMany();
  await prisma.transactionIntent.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.nFT.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.protocolMetadata.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.autoSigningConfig.deleteMany();
  await prisma.protocolPreference.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.user.deleteMany();

  console.log("✓ Cleared existing data");

  // Create test users
  const testUser1 = await prisma.user.create({
    data: {
      email: "test1@orya.io",
      privyId: "privy_test_1",
      firebaseUid: "firebase_test_1",
      advancedMode: true,
      kycStatus: "APPROVED",
      kycProvider: "SUMSUB",
    },
  });

  const testUser2 = await prisma.user.create({
    data: {
      email: "test2@orya.io",
      privyId: "privy_test_2",
      firebaseUid: "firebase_test_2",
      advancedMode: false,
      kycStatus: "NONE",
    },
  });

  console.log("✓ Created test users");

  // Create user preferences
  const prefs1 = await prisma.userPreferences.create({
    data: {
      userId: testUser1.id,
      defaultChain: "sui",
      hiddenTokens: [],
      favoriteProtocols: ["sui-aftermath-swap", "sui-cetus-swap"],
    },
  });

  const prefs2 = await prisma.userPreferences.create({
    data: {
      userId: testUser2.id,
      defaultChain: "ethereum",
      hiddenTokens: [],
      favoriteProtocols: [],
    },
  });

  console.log("✓ Created user preferences");

  // Create auto-signing config for advanced user
  await prisma.autoSigningConfig.create({
    data: {
      userPrefId: prefs1.id,
      enabled: true,
      thresholdUSD: 500,
      whitelistedContracts: ["0x1111111254fb6c44bac0bed2854e76f90643097d"],
      expiryHours: 24,
      maxDailyAmountUSD: 50000,
      requireBiometric: true,
    },
  });

  console.log("✓ Created auto-signing config");

  // Create protocol preferences
  await prisma.protocolPreference.create({
    data: {
      userId: testUser1.id,
      chainId: "sui",
      feature: "swap",
      preferredProtocol: "sui-aftermath-swap",
      fallbackProtocols: ["sui-cetus-swap"],
    },
  });

  await prisma.protocolPreference.create({
    data: {
      userId: testUser1.id,
      chainId: "ethereum",
      feature: "swap",
      preferredProtocol: "uniswap-v3",
      fallbackProtocols: ["curve-stable-swap", "1inch"],
    },
  });

  console.log("✓ Created protocol preferences");

  // Create wallets
  const wallet1 = await prisma.wallet.create({
    data: {
      userId: testUser1.id,
      type: "MPC",
      chainType: "sui",
      address: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      publicKey:
        "0xpub_test_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    },
  });

  const wallet2 = await prisma.wallet.create({
    data: {
      userId: testUser1.id,
      type: "CUSTODIAL",
      chainType: "ethereum",
      address: "0x1111111111111111111111111111111111111111",
      publicKey: "0xpub_eth_test_1234567890abcdef1234567890abcdef",
    },
  });

  const wallet3 = await prisma.wallet.create({
    data: {
      userId: testUser2.id,
      type: "SELF_CUSTODY",
      chainType: "solana",
      address: "So11111111111111111111111111111111111111112",
      publicKey: "SolanaPublicKeyTest1234567890",
    },
  });

  console.log("✓ Created wallets");

  // Create balances
  await prisma.balance.create({
    data: {
      walletId: wallet1.id,
      tokenAddress: "0x2::sui::SUI",
      symbol: "SUI",
      decimals: 9,
      amount: "1000000000", // 1 SUI
      amountUSD: 5.25,
    },
  });

  await prisma.balance.create({
    data: {
      walletId: wallet2.id,
      tokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      symbol: "WETH",
      decimals: 18,
      amount: "5000000000000000000", // 5 WETH
      amountUSD: 18500,
    },
  });

  await prisma.balance.create({
    data: {
      walletId: wallet3.id,
      tokenAddress: "EPjFWaLb3odcccccccccccccccccccccccccccccc", // USDC on Solana
      symbol: "USDC",
      decimals: 6,
      amount: "10000000000", // 10000 USDC
      amountUSD: 10000,
    },
  });

  console.log("✓ Created balances");

  // Create protocols
  const suiAftermath = await prisma.protocol.create({
    data: {
      protocolId: "sui-aftermath-swap",
      name: "Aftermath Finance",
      chainId: "sui",
      type: "swap",
      version: "1.0.0",
      logoUrl: "https://logo.aftermath.finance/logo.svg",
      isActive: true,
      isAudited: true,
      auditors: ["Trail of Bits", "OpenZeppelin"],
      tier: "core",
    },
  });

  const suiCetus = await prisma.protocol.create({
    data: {
      protocolId: "sui-cetus-swap",
      name: "Cetus Protocol",
      chainId: "sui",
      type: "swap",
      version: "2.0.0",
      logoUrl: "https://logo.cetus.zone/logo.svg",
      isActive: true,
      isAudited: true,
      auditors: ["OpenZeppelin"],
      tier: "core",
    },
  });

  const uniswapV3 = await prisma.protocol.create({
    data: {
      protocolId: "uniswap-v3",
      name: "Uniswap V3",
      chainId: "ethereum",
      type: "swap",
      version: "3.0.0",
      logoUrl: "https://logo.uniswap.org/logo.svg",
      isActive: true,
      isAudited: true,
      auditors: ["OpenZeppelin", "Trail of Bits"],
      tier: "core",
    },
  });

  console.log("✓ Created protocols");

  // Create protocol metadata
  await prisma.protocolMetadata.create({
    data: {
      protocolId: suiAftermath.protocolId,
      website: "https://aftermath.finance",
      docs: "https://docs.aftermath.finance",
      tvl: 250000000,
      volume24h: 45000000,
      securityRating: 9.5,
      supportedTokens: [
        "0x2::sui::SUI",
        "0xc99b1f5a04e08d43c8f8b86e8e4eb3aa90eb5ad5::usdc::USDC",
      ],
    },
  });

  await prisma.protocolMetadata.create({
    data: {
      protocolId: suiCetus.protocolId,
      website: "https://cetus.zone",
      docs: "https://docs.cetus.zone",
      tvl: 180000000,
      volume24h: 32000000,
      securityRating: 9.2,
      supportedTokens: [
        "0x2::sui::SUI",
        "0xc99b1f5a04e08d43c8f8b86e8e4eb3aa90eb5ad5::usdc::USDC",
      ],
    },
  });

  await prisma.protocolMetadata.create({
    data: {
      protocolId: uniswapV3.protocolId,
      website: "https://uniswap.org",
      docs: "https://docs.uniswap.org",
      tvl: 3500000000,
      volume24h: 1200000000,
      securityRating: 9.8,
      supportedTokens: [
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      ],
    },
  });

  console.log("✓ Created protocol metadata");

  // Create transactions
  await prisma.transaction.create({
    data: {
      userId: testUser1.id,
      walletId: wallet1.id,
      chainId: "sui",
      type: "SWAP",
      status: "CONFIRMED",
      fromAddress: wallet1.address,
      toAddress: wallet1.address,
      amount: "500000000",
      tokenSymbol: "SUI",
      tokenAddress: "0x2::sui::SUI",
      fee: "100000",
      feeUSD: 0.05,
      hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      blockNumber: 1000000,
      protocol: "sui-aftermath-swap",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
    },
  });

  console.log("✓ Created transactions");

  // Create staking positions
  await prisma.stakingPosition.create({
    data: {
      userId: testUser1.id,
      chainId: "sui",
      protocol: "sui-native-staking",
      stakedToken: "0x2::sui::SUI",
      stakedAmount: "1000000000",
      stakedAmountUSD: 5250,
      rewardToken: "0x2::sui::SUI",
      estimatedReward: "50000000",
      apy: 5.2,
      status: "active",
    },
  });

  console.log("✓ Created staking positions");

  // Create lending positions
  await prisma.lendingPosition.create({
    data: {
      userId: testUser1.id,
      chainId: "ethereum",
      protocol: "aave-v3",
      collateralToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      collateralAmount: "5000000000000000000",
      collateralAmountUSD: 18500,
      borrowToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      borrowAmount: "10000000000",
      borrowAmountUSD: 10000,
      healthFactor: 2.5,
      interestRate: 2.1,
    },
  });

  console.log("✓ Created lending positions");

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: testUser1.id,
      type: "TRANSACTION_CONFIRMED",
      title: "Swap Completed",
      message: "Your swap of 0.5 SUI for USDC has been confirmed",
      isRead: false,
    },
  });

  console.log("✓ Created notifications");

  console.log("✅ Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
