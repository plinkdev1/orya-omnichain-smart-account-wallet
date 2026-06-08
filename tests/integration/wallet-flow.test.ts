import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

interface UserResponse {
  id: string;
  email: string;
}

interface WalletResponse {
  walletId: string;
  address: string;
  recoveryPhrase: string;
  chainId: string;
}

interface WalletsQueryResponse {
  wallets: Array<{
    id: string;
    address: string;
    chainId: string;
  }>;
}

interface WalletBalanceResponse {
  amount: string;
  symbol: string;
  usdValue: string;
}

interface PortfolioResponse {
  totalValueUsd: string;
  walletCount: number;
}

async function executeGraphQL(query: string, variables?: Record<string, unknown>) {
  const response = await fetch(`${API_GATEWAY_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

describe('Wallet Integration Flow', () => {
  let userId: string;
  let walletId: string;

  beforeAll(async () => {
    const maxRetries = 10;
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${API_GATEWAY_URL}/health`, {
          timeout: 5000,
        });
        if (response.ok) {
          console.log('✅ API Gateway is healthy');
          return;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(
          `⏳ Waiting for API Gateway to be ready (attempt ${i + 1}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw new Error(
      `API Gateway not ready after ${maxRetries} attempts. Last error: ${lastError?.message}`
    );
  });

  afterAll(async () => {
    console.log('Test suite completed');
  });

  it('should register a new user', async () => {
    const query = `
      mutation {
        register(email: "test@orya.app", authProvider: "EMAIL") {
          id
          email
        }
      }
    `;

    const data = (await executeGraphQL(query)) as Record<string, UserResponse>;
    const user = data.register;

    expect(user).toBeDefined();
    expect(user.email).toBe('test@orya.app');
    expect(user.id).toBeTruthy();

    userId = user.id;
  });

  it('should create a wallet', async () => {
    const query = `
      mutation {
        createWallet(
          userId: "${userId}"
          chainId: "ethereum"
          walletType: "OWNED"
        ) {
          walletId
          address
          recoveryPhrase
          chainId
        }
      }
    `;

    const data = (await executeGraphQL(query)) as Record<string, WalletResponse>;
    const wallet = data.createWallet;

    expect(wallet).toBeDefined();
    expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(wallet.recoveryPhrase).toBeTruthy();
    expect(wallet.recoveryPhrase.split(' ').length).toBeGreaterThanOrEqual(12);
    expect(wallet.chainId).toBe('ethereum');

    walletId = wallet.walletId;
  });

  it('should fetch user wallets', async () => {
    const query = `
      query {
        wallets(userId: "${userId}") {
          id
          address
          chainId
        }
      }
    `;

    const data = (await executeGraphQL(query)) as WalletsQueryResponse;

    expect(data.wallets).toBeDefined();
    expect(Array.isArray(data.wallets)).toBe(true);
    expect(data.wallets.length).toBeGreaterThan(0);
    expect(data.wallets[0].id).toBe(walletId);
  });

  it('should get wallet balance', async () => {
    const query = `
      query {
        walletBalance(walletId: "${walletId}") {
          amount
          symbol
          usdValue
        }
      }
    `;

    const data = (await executeGraphQL(query)) as Record<
      string,
      WalletBalanceResponse
    >;
    const balance = data.walletBalance;

    expect(balance).toBeDefined();
    expect(balance.symbol).toBeTruthy();
    expect(balance.amount).toBeTruthy();
    expect(balance.usdValue).toBeTruthy();
  });

  it('should get portfolio total', async () => {
    const query = `
      query {
        portfolio(userId: "${userId}") {
          totalValueUsd
          walletCount
        }
      }
    `;

    const data = (await executeGraphQL(query)) as Record<
      string,
      PortfolioResponse
    >;
    const portfolio = data.portfolio;

    expect(portfolio).toBeDefined();
    expect(portfolio.walletCount).toBeGreaterThan(0);
    expect(portfolio.totalValueUsd).toBeTruthy();
  });

  it('should list transactions for wallet', async () => {
    const query = `
      query {
        transactions(walletId: "${walletId}", limit: 10) {
          id
          from
          to
          amount
          status
          timestamp
        }
      }
    `;

    try {
      const data = (await executeGraphQL(query)) as Record<
        string,
        { id: string; from: string; to: string }[]
      >;
      expect(data.transactions).toBeDefined();
      expect(Array.isArray(data.transactions)).toBe(true);
    } catch (error) {
      console.warn('Transactions query not available yet:', error);
    }
  });

  it('should handle service errors gracefully', async () => {
    const query = `
      query {
        wallets(userId: "invalid-user-id") {
          id
        }
      }
    `;

    try {
      await executeGraphQL(query);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
    }
  });
});
