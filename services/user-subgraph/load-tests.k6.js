import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4002';
const USERS_TO_SIMULATE = __ENV.USERS || 50;
const DURATION = __ENV.DURATION || '1m';
const RAMP_UP = __ENV.RAMP_UP || '30s';

const errorRate = new Rate('error_rate');
const successRate = new Rate('success_rate');
const queryDuration = new Trend('query_duration');
const mutationDuration = new Trend('mutation_duration');
const subscriptionDuration = new Trend('subscription_duration');
const userErrors = new Counter('user_errors');
const systemErrors = new Counter('system_errors');
const authTokenGauge = new Gauge('auth_tokens');

export const options = {
  stages: [
    { duration: RAMP_UP, target: USERS_TO_SIMULATE },
    { duration: DURATION, target: USERS_TO_SIMULATE },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'error_rate': ['< 0.1'],
    'success_rate': ['> 0.9'],
    'query_duration': ['p(95) < 500', 'p(99) < 1000'],
    'mutation_duration': ['p(95) < 1000', 'p(99) < 2000'],
    'http_req_duration': ['p(95) < 1000'],
  },
  ext: {
    loadimpact: {
      projectID: 3500000,
      name: 'Orÿa Wallet GraphQL API Load Test',
    },
  },
};

const authTokens = [];
let tokenIndex = 0;

function generateEmail(userId) {
  return `loadtest-user-${userId}-${Date.now()}@example.com`;
}

function getRandomToken() {
  if (authTokens.length === 0) return null;
  return authTokens[Math.floor(Math.random() * authTokens.length)];
}

function graphqlRequest(query, variables = {}, headers = {}) {
  const payload = JSON.stringify({
    query,
    variables,
  });

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  return http.post(`${BASE_URL}/graphql`, payload, {
    headers: defaultHeaders,
    tags: { name: 'GraphQL' },
  });
}

export function setup() {
  console.log('Load test setup starting...');
  const setupAuthTokens = [];

  for (let i = 0; i < Math.min(5, USERS_TO_SIMULATE); i++) {
    const email = generateEmail(i);
    const signupQuery = `
      mutation Signup($email: String!, $password: String!) {
        signup(email: $email, password: $password) {
          accessToken
          refreshToken
          user {
            id
            email
          }
        }
      }
    `;

    const res = graphqlRequest(signupQuery, {
      email,
      password: 'test-password-123',
    });

    const result = res.json('data.signup');
    if (result && result.accessToken) {
      setupAuthTokens.push(result.accessToken);
      console.log(`Successfully authenticated user ${i}`);
    }
  }

  authTokens.push(...setupAuthTokens);
  authTokenGauge.set(authTokens.length);
  console.log(`Setup complete with ${authTokens.length} tokens`);

  return { tokens: setupAuthTokens };
}

export default function (data) {
  const token = getRandomToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  group('Query Tests', () => {
    // Query: Get current user
    group('Query.me', () => {
      const meQuery = `
        query {
          me {
            id
            email
            kycStatus
            advancedMode
            preferences {
              defaultChain
              protocols {
                chainId
                feature
                preferredProtocol
              }
            }
          }
        }
      `;

      const res = graphqlRequest(meQuery, {}, headers);
      const startTime = new Date();
      queryDuration.add(new Date() - startTime);

      check(res, {
        'me query succeeds': (r) => r.status === 200,
        'me query returns user': (r) => {
          const data = r.json('data');
          return data && data.me && data.me.id;
        },
        'me query no errors': (r) => !r.json('errors'),
      });

      if (res.status !== 200 || res.json('errors')) {
        errorRate.add(1);
        userErrors.add(1);
      } else {
        successRate.add(1);
      }
    });

    sleep(0.5);

    // Query: Get specific user (with admin check)
    group('Query.user', () => {
      const userQuery = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            email
            kycStatus
          }
        }
      `;

      const res = graphqlRequest(userQuery, {
        id: 'user-123',
      }, headers);

      queryDuration.add(res.timings.duration);

      check(res, {
        'user query responds': (r) => r.status === 200,
      });

      if (res.status !== 200) {
        errorRate.add(1);
      }
    });

    sleep(0.5);

    // Query: List users (admin only)
    group('Query.users', () => {
      const usersQuery = `
        query ListUsers($first: Int, $after: String) {
          users(pagination: { first: $first, after: $after }) {
            edges {
              node { id email }
              cursor
            }
            pageInfo {
              hasNextPage
              totalCount
            }
          }
        }
      `;

      const res = graphqlRequest(usersQuery, {
        first: 10,
      }, headers);

      queryDuration.add(res.timings.duration);

      check(res, {
        'users query responds': (r) => r.status === 200,
      });
    });

    sleep(0.5);
  });

  group('Mutation Tests', () => {
    // Mutation: Update profile
    group('Mutation.updateProfile', () => {
      if (!token) {
        console.log('Skipping updateProfile - no auth token');
        return;
      }

      const updateQuery = `
        mutation UpdateProfile($input: UpdateProfileInput!) {
          updateProfile(input: $input) {
            id
            email
            advancedMode
            updatedAt
          }
        }
      `;

      const res = graphqlRequest(updateQuery, {
        input: {
          advancedMode: Math.random() > 0.5,
        },
      }, headers);

      mutationDuration.add(res.timings.duration);

      check(res, {
        'updateProfile succeeds': (r) => r.status === 200,
        'updateProfile returns user': (r) => {
          const data = r.json('data');
          return data && data.updateProfile && data.updateProfile.id;
        },
      });

      if (res.status !== 200) {
        errorRate.add(1);
      } else {
        successRate.add(1);
      }
    });

    sleep(0.5);

    // Mutation: Set protocol preference
    group('Mutation.setProtocolPreference', () => {
      if (!token) return;

      const setProtocolQuery = `
        mutation SetProtocol($chainId: String!, $feature: FeatureType!, $protocolId: String!) {
          setProtocolPreference(chainId: $chainId, feature: $feature, protocolId: $protocolId) {
            chainId
            feature
            preferredProtocol
            lastUpdated
          }
        }
      `;

      const chains = ['ethereum', 'sui', 'solana'];
      const features = ['SWAP', 'STAKE', 'LEND', 'BRIDGE'];
      const protocols = {
        ethereum: ['uniswap-v3', 'uniswap-v2'],
        sui: ['cetus', 'aftermath'],
        solana: ['jupiter', 'raydium'],
      };

      const chainId = chains[Math.floor(Math.random() * chains.length)];
      const feature = features[Math.floor(Math.random() * features.length)];
      const chainProtocols = protocols[chainId];
      const protocolId = chainProtocols[Math.floor(Math.random() * chainProtocols.length)];

      const res = graphqlRequest(setProtocolQuery, {
        chainId,
        feature,
        protocolId,
      }, headers);

      mutationDuration.add(res.timings.duration);

      check(res, {
        'setProtocolPreference succeeds': (r) => r.status === 200,
      });

      if (res.status !== 200) {
        errorRate.add(1);
      } else {
        successRate.add(1);
      }
    });

    sleep(0.5);

    // Mutation: Update auto-signing config
    group('Mutation.updateAutoSigningConfig', () => {
      if (!token) return;

      const updateAutoSigningQuery = `
        mutation UpdateAutoSigning($config: AutoSigningConfigInput!) {
          updateAutoSigningConfig(config: $config) {
            id
            preferences {
              autoSigning {
                enabled
                thresholdUSD
              }
            }
          }
        }
      `;

      const res = graphqlRequest(updateAutoSigningQuery, {
        config: {
          enabled: Math.random() > 0.5,
          thresholdUSD: Math.floor(Math.random() * 1000),
          expiryHours: 24,
          maxDailyAmountUSD: 10000,
          requireBiometric: true,
        },
      }, headers);

      mutationDuration.add(res.timings.duration);

      check(res, {
        'updateAutoSigningConfig succeeds': (r) => r.status === 200,
      });
    });

    sleep(0.5);

    // Mutation: Set advanced mode
    group('Mutation.setAdvancedMode', () => {
      if (!token) return;

      const setAdvancedQuery = `
        mutation SetAdvancedMode($enabled: Boolean!) {
          setAdvancedMode(enabled: $enabled) {
            id
            advancedMode
          }
        }
      `;

      const res = graphqlRequest(setAdvancedQuery, {
        enabled: Math.random() > 0.5,
      }, headers);

      mutationDuration.add(res.timings.duration);

      check(res, {
        'setAdvancedMode succeeds': (r) => r.status === 200,
      });
    });

    sleep(0.5);

    // Mutation: KYC initiation
    group('Mutation.initiateKYC', () => {
      if (!token) return;

      const initiateKYCQuery = `
        mutation InitiateKYC($provider: KYCProvider!) {
          initiateKYC(provider: $provider) {
            id
            userId
            provider
            sessionId
            externalUrl
            status
          }
        }
      `;

      const providers = ['SUMSUB', 'PERSONA'];
      const provider = providers[Math.floor(Math.random() * providers.length)];

      const res = graphqlRequest(initiateKYCQuery, {
        provider,
      }, headers);

      mutationDuration.add(res.timings.duration);

      check(res, {
        'initiateKYC succeeds': (r) => r.status === 200,
      });

      if (res.status !== 200) {
        errorRate.add(1);
      }
    });

    sleep(0.5);
  });

  group('Error Handling', () => {
    // Test unauthorized access
    group('Unauthorized Query', () => {
      const meQuery = `query { me { id } }`;

      const res = graphqlRequest(meQuery, {}, {});

      check(res, {
        'unauthorized returns error': (r) => r.status === 200 && r.json('errors'),
      });

      if (!r.json('errors')) {
        systemErrors.add(1);
      }
    });

    sleep(0.5);

    // Test invalid input
    group('Invalid Input', () => {
      const invalidQuery = `
        mutation InvalidSignup {
          signup(email: "invalid-email", password: "") {
            user { id }
          }
        }
      `;

      const res = graphqlRequest(invalidQuery);

      check(res, {
        'invalid input handled': (r) => r.status === 200,
      });
    });

    sleep(0.5);
  });

  group('Performance Tests', () => {
    // Batch queries
    group('Batch Operations', () => {
      const batchQuery = `
        query {
          me { id email }
          users(pagination: { first: 5 }) {
            edges { node { id } }
          }
        }
      `;

      const res = graphqlRequest(batchQuery, {}, headers);

      queryDuration.add(res.timings.duration);

      check(res, {
        'batch query < 1s': (r) => r.timings.duration < 1000,
        'batch query succeeds': (r) => r.status === 200,
      });
    });

    sleep(0.5);

    // Complex nested query
    group('Complex Nested Query', () => {
      const complexQuery = `
        query {
          me {
            id
            email
            preferences {
              defaultChain
              protocols {
                chainId
                feature
                preferredProtocol
                fallbackProtocols
              }
              autoSigning {
                enabled
                thresholdUSD
              }
            }
          }
        }
      `;

      const res = graphqlRequest(complexQuery, {}, headers);

      queryDuration.add(res.timings.duration);

      check(res, {
        'complex query < 500ms': (r) => r.timings.duration < 500,
        'complex query succeeds': (r) => r.status === 200,
      });
    });

    sleep(0.5);
  });

  sleep(1);
}

export function teardown(data) {
  console.log('Load test teardown starting...');

  if (data && data.tokens && data.tokens.length > 0) {
    console.log(`Test completed with ${data.tokens.length} authenticated users`);
  }

  console.log('Load test teardown complete');
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  let summary = '\n=== Load Test Summary ===\n';

  if (data.metrics) {
    Object.keys(data.metrics).forEach((key) => {
      const metric = data.metrics[key];
      summary += `${indent}${key}: ${JSON.stringify(metric.values)}\n`;
    });
  }

  return summary;
}

function htmlReport(data) {
  const timestamp = new Date().toISOString();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orÿa Wallet Load Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .metric { margin: 10px 0; }
        .pass { color: green; }
        .fail { color: red; }
      </style>
    </head>
    <body>
      <h1>Orÿa Wallet GraphQL API - Load Test Report</h1>
      <p><strong>Generated:</strong> ${timestamp}</p>
      <p><strong>Environment:</strong> ${BASE_URL}</p>
      <p><strong>Virtual Users:</strong> ${USERS_TO_SIMULATE}</p>
      <p><strong>Test Duration:</strong> ${DURATION}</p>
      <p><strong>Ramp-up Time:</strong> ${RAMP_UP}</p>
      
      <h2>Key Metrics</h2>
      <div class="metric">
        <strong>Success Rate:</strong> <span id="success-rate">Calculating...</span>
      </div>
      <div class="metric">
        <strong>Error Rate:</strong> <span id="error-rate">Calculating...</span>
      </div>
      <div class="metric">
        <strong>Query Duration (p95):</strong> <span id="query-p95">Calculating...</span>ms
      </div>
      <div class="metric">
        <strong>Mutation Duration (p95):</strong> <span id="mutation-p95">Calculating...</span>ms
      </div>
      
      <h2>Detailed Results</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </body>
    </html>
  `;
}
