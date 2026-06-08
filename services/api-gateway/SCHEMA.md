# GraphQL Schema - API Gateway

## Types

### User
```graphql
type User {
  id: String!
  email: String!
  kycStatus: String!
}
```

### Wallet
```graphql
type Wallet {
  id: String!
  address: String!
  chainId: String!
  walletType: String!
}
```

### Balance
```graphql
type Balance {
  amount: String!
  symbol: String!
  usdValue: String!
}
```

### CreateWalletResponse
```graphql
type CreateWalletResponse {
  walletId: String!
  address: String!
  recoveryPhrase: [String!]
}
```

## Queries

### Query Root

```graphql
type Query {
  health: String!
  user(userId: String!): User!
  wallets(userId: String!): [Wallet!]!
  walletBalance(walletId: String!): Balance!
}
```

### Query Details

**health**
- Returns health status
- No parameters
- Always returns "OK" if service is up

**user(userId: String!)**
- Fetches user by ID
- Calls User Service at `http://localhost:3001/user/{userId}`
- Returns User object

**wallets(userId: String!)**
- Lists all wallets for a user
- Calls Wallet Service at `http://localhost:3010/wallets/{userId}`
- Returns array of Wallet objects

**walletBalance(walletId: String!)**
- Gets balance for specific wallet
- Calls Wallet Service at `http://localhost:3010/balance/{walletId}`
- Returns Balance object

## Mutations

### Mutation Root

```graphql
type Mutation {
  register(email: String!, authProvider: String!): User!
  createWallet(userId: String!, chainId: String!, walletType: String!): CreateWalletResponse!
  signTransaction(walletId: String!, transaction: String!): String!
}
```

### Mutation Details

**register(email: String!, authProvider: String!)**
- Creates new user account
- Calls User Service POST `/register`
- Parameters:
  - email: User email address
  - authProvider: Auth provider (e.g., "firebase", "google")
- Returns: Created User object

**createWallet(userId: String!, chainId: String!, walletType: String!)**
- Creates new wallet for user
- Calls Wallet Service POST `/create`
- Parameters:
  - userId: User ID
  - chainId: Blockchain chain ID (e.g., "sui-mainnet", "ethereum", "bitcoin")
  - walletType: Wallet type (e.g., "mpc", "standard", "hardware")
- Returns: CreateWalletResponse with wallet details and recovery phrase

**signTransaction(walletId: String!, transaction: String!)**
- Signs a transaction
- Calls Wallet Service POST `/sign`
- Parameters:
  - walletId: Wallet ID to sign with
  - transaction: Raw transaction data (hex string)
- Returns: Signed transaction as string

## Error Handling

All resolvers return `Result<T>` which maps to GraphQL Result type.

Errors are automatically converted to GraphQL error format:

```json
{
  "errors": [
    {
      "message": "Failed to fetch user: connection refused"
    }
  ]
}
```

Common error scenarios:
- Service unavailable: "Failed to [operation]: connection refused"
- Invalid JSON response: "Failed to parse [resource]: invalid JSON"
- Network timeout: "Failed to [operation]: request timeout"

## Service Integration Map

| Resolver | Service | Endpoint | Method |
|----------|---------|----------|--------|
| user | User Service (3001) | /user/{id} | GET |
| wallets | Wallet Service (3010) | /wallets/{userId} | GET |
| walletBalance | Wallet Service (3010) | /balance/{walletId} | GET |
| register | User Service (3001) | /register | POST |
| createWallet | Wallet Service (3010) | /create | POST |
| signTransaction | Wallet Service (3010) | /sign | POST |

## Request/Response Examples

### Query: Get User
**Request:**
```graphql
{
  user(userId: "123e4567-e89b-12d3-a456-426614174000") {
    id
    email
    kycStatus
  }
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "kycStatus": "verified"
    }
  }
}
```

### Mutation: Create Wallet
**Request:**
```graphql
mutation {
  createWallet(
    userId: "123e4567-e89b-12d3-a456-426614174000"
    chainId: "sui-mainnet"
    walletType: "mpc"
  ) {
    walletId
    address
    recoveryPhrase
  }
}
```

**Response:**
```json
{
  "data": {
    "createWallet": {
      "walletId": "wallet-123",
      "address": "0x1234567890abcdef",
      "recoveryPhrase": [
        "abandon", "ability", "able", ...
      ]
    }
  }
}
```

## Subscription Support (Future)

Currently using `EmptySubscription`. Future subscriptions could include:
- `balanceUpdated(walletAddress: String!)`
- `transactionStatusChanged(transactionId: String!)`
- `portfolioUpdated(userId: String!)`
