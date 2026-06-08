# Adapter Implementation Checklist

**Adapter Name:** [Adapter Name]  
**Language:** [TypeScript/Rust]  
**Blockchain:** [Blockchain Name]  
**Status:** [Planning/Development/Testing/Production]  
**Start Date:** [YYYY-MM-DD]  
**Target Completion:** [YYYY-MM-DD]

## Pre-Implementation

- [ ] Read main [Adapters README](../../adapters/README.md)
- [ ] Review existing adapter implementations (similar language/chain)
- [ ] Understand common interface requirements
- [ ] Set up development environment
- [ ] Review blockchain documentation
- [ ] Identify required dependencies
- [ ] Create JIRA ticket with epic link
- [ ] Get design/architecture approval

## Project Setup

### Repository Structure

- [ ] Create adapter directory: `adapters/[name]-adapter/`
- [ ] Create `src/` directory
- [ ] Create `tests/` directory (unit and integration)
- [ ] Create `.env.example` file
- [ ] Create `package.json` (TypeScript) or `Cargo.toml` (Rust)
- [ ] Create `tsconfig.json` (TypeScript only)
- [ ] Create `.gitignore`
- [ ] Create initial `README.md` from template

### Dependencies

#### TypeScript

- [ ] Add viem or ethers.js (if EVM)
- [ ] Add zod for validation
- [ ] Add axios for HTTP requests
- [ ] Add vitest for testing
- [ ] Add @types/node
- [ ] Add eslint and prettier config
- [ ] Add TypeScript 5.x+

#### Rust

- [ ] Add tokio (async runtime)
- [ ] Add serde + serde_json (serialization)
- [ ] Add thiserror (error handling)
- [ ] Add reqwest (HTTP client)
- [ ] Add tracing (logging)
- [ ] Add appropriate blockchain SDK ([chain]-sdk)

## Core Implementation

### Module Structure

- [ ] Create `config.ts`/`config.rs` with configuration management
- [ ] Create `error.ts`/`error.rs` with custom error types
- [ ] Create `types.ts`/`types.rs` or `models/` with core types
- [ ] Create `client.ts`/`client.rs` with main adapter class
- [ ] Create `index.ts`/`lib.rs` as entry point with exports
- [ ] Create `.env.example` with required variables

### Configuration

- [ ] Implement Config struct/interface with:
  - [ ] RPC URL
  - [ ] Chain ID
  - [ ] API keys (if needed)
  - [ ] Network selection (mainnet/testnet/devnet)
  - [ ] Optional parameters (timeout, retry count, etc.)

- [ ] Implement validation using zod (TS) or serde (Rust)
- [ ] Load configuration from environment variables
- [ ] Provide defaults where appropriate
- [ ] Document all environment variables in `.env.example`

### Error Handling

- [ ] Define custom Error enum/class
- [ ] Implement error variants for:
  - [ ] RPC connection errors
  - [ ] Invalid address format
  - [ ] Insufficient balance
  - [ ] Transaction failures
  - [ ] Network errors
  - [ ] Rate limiting
  - [ ] Invalid configuration

- [ ] Implement error display/formatting
- [ ] Add error conversion traits (From/Into)
- [ ] Add detailed error messages for debugging

### Core Features

#### Balance Queries

- [ ] Implement `getBalance(address)` method
- [ ] Support multiple token types (native + ERC20/etc)
- [ ] Return balance in correct decimal format
- [ ] Handle invalid address formats
- [ ] Add error handling for RPC failures
- [ ] Implement retry logic for failed requests
- [ ] Add rate limiting awareness

#### Transaction Sending

- [ ] Implement `sendTransaction(tx)` method
- [ ] Validate transaction parameters:
  - [ ] Recipient address format
  - [ ] Value (amount) format
  - [ ] Gas parameters (if applicable)
  - [ ] Data encoding
  
- [ ] Implement transaction signing
- [ ] Broadcast signed transaction
- [ ] Return transaction hash
- [ ] Implement error handling for failures
- [ ] Add request validation

#### Transaction Status

- [ ] Implement `getTransactionStatus(hash)` method
- [ ] Support status states: Pending, Confirmed, Failed
- [ ] Include block number when confirmed
- [ ] Handle tx not found gracefully
- [ ] Cache results appropriately

#### Additional Features (if applicable)

- [ ] Implement specific protocol integrations
- [ ] Add DEX/swap support
- [ ] Add lending protocol support
- [ ] Add event listening/indexing
- [ ] Add batch operations
- [ ] Add gas estimation

## Testing

### Unit Tests

- [ ] Create test files in `tests/unit/` or `src/` (Rust)
- [ ] Test configuration validation
- [ ] Test error handling:
  - [ ] Invalid configuration
  - [ ] Invalid address formats
  - [ ] Network errors
  - [ ] RPC failures

- [ ] Test core methods with mocks:
  - [ ] Balance queries
  - [ ] Transaction sending
  - [ ] Status checking

- [ ] Test type conversions and formatting
- [ ] Test edge cases (zero balance, max values, etc.)
- [ ] Achieve 80%+ code coverage

### Integration Tests

- [ ] Create test files in `tests/integration/`
- [ ] Test against testnet RPC:
  - [ ] Testnet balance queries
  - [ ] Testnet transactions (use test tokens)
  - [ ] Testnet transaction status

- [ ] Test chain detection
- [ ] Test error handling in real scenarios
- [ ] Test rate limiting behavior
- [ ] Test concurrent requests

### Test Execution

- [ ] `pnpm test` passes (TypeScript)
- [ ] `cargo test` passes (Rust)
- [ ] `pnpm test:watch` works (TypeScript)
- [ ] Coverage reports generated
- [ ] All integration tests pass

## Documentation

### README

- [ ] Replace template placeholders
- [ ] Add features list with status
- [ ] Add quick start examples
- [ ] Add supported chains/networks table
- [ ] Add configuration documentation
- [ ] Add testing instructions
- [ ] Add troubleshooting section
- [ ] Add links to relevant documentation

### Code Documentation

#### TypeScript

- [ ] Add JSDoc comments to exported functions
- [ ] Document type definitions
- [ ] Add inline comments for complex logic
- [ ] Document error scenarios

#### Rust

- [ ] Add doc comments to public items
- [ ] Add examples in doc comments
- [ ] Document module structure
- [ ] Add # Errors sections
- [ ] Add # Panics sections where applicable

### Configuration Documentation

- [ ] Document `.env.example` variables:
  - [ ] Purpose of each variable
  - [ ] Expected format/values
  - [ ] Default values (if applicable)
  - [ ] Example values

## Quality Assurance

### Code Quality

- [ ] Run linter without warnings:
  - [ ] `pnpm lint` (TypeScript)
  - [ ] `cargo clippy` (Rust)

- [ ] Run formatter:
  - [ ] `pnpm format` (TypeScript)
  - [ ] `cargo fmt` (Rust)

- [ ] Type checking passes:
  - [ ] `pnpm type-check` (TypeScript)
  - [ ] Rust compilation with no warnings

- [ ] Remove console logs and debug statements
- [ ] Remove commented-out code
- [ ] Verify no secrets in code

### Performance

- [ ] Measure transaction sending performance
- [ ] Measure balance query performance
- [ ] Add caching where appropriate
- [ ] Profile hot paths
- [ ] Verify memory usage is reasonable
- [ ] Test with concurrent requests

### Security

- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all parameters
- [ ] Safe error messages (no sensitive data)
- [ ] Rate limiting implementation
- [ ] Secure HTTP/HTTPS usage
- [ ] Audit third-party dependencies
- [ ] Document security considerations

## Integration

### Build Process

- [ ] Adapter builds without warnings:
  - [ ] `pnpm build` (TypeScript)
  - [ ] `cargo build` (Rust)
  - [ ] `pnpm build --release` (TypeScript)
  - [ ] `cargo build --release` (Rust)

- [ ] Build artifacts are correct size
- [ ] Distribution files include needed files

### API Gateway Integration

- [ ] GraphQL resolvers created (if applicable)
- [ ] Adapter exported from appropriate module
- [ ] Gateway tests updated
- [ ] Schema documentation updated

### CI/CD

- [ ] GitHub Actions workflow configured
- [ ] Tests run on every commit
- [ ] Lint checks run on every commit
- [ ] Build succeeds on every commit
- [ ] Coverage reports generated
- [ ] Deployment workflow configured

## Deployment Preparation

### Pre-Production

- [ ] All tests passing (100%)
- [ ] Code review completed
- [ ] Documentation reviewed and complete
- [ ] Security review completed
- [ ] Performance tested
- [ ] Testnet validation complete

### Production Readiness

- [ ] Deployment guide written
- [ ] Rollback procedure documented
- [ ] Monitoring configured:
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring
  - [ ] Log aggregation
  - [ ] Alerting rules

- [ ] Runbooks created for common issues
- [ ] Incident response plan in place
- [ ] Change log entry added

## Final Checklist

### Before Release

- [ ] Code review approved
- [ ] Tests passing (100%)
- [ ] Documentation complete
- [ ] README updated with all information
- [ ] No breaking changes to public API
- [ ] Version bumped appropriately
- [ ] Git tags created
- [ ] Release notes prepared

### After Release

- [ ] Merged to main branch
- [ ] Deployed to production
- [ ] Monitoring active
- [ ] Notified stakeholders
- [ ] Created GitHub release
- [ ] Updated roadmap/project board

## Notes

Add implementation notes, blockers, or additional context here:

---

## Sign-Off

- **Developer:** [Name] on [Date]
- **Code Reviewer:** [Name] on [Date]
- **QA:** [Name] on [Date]
- **Product:** [Name] on [Date]

## References

- [Adapters README](../../adapters/README.md)
- [Blockchain Documentation]
- [SDK Documentation]
- [ORŸA Architecture](../../docs/architecture/)
- [Related Tickets/Issues]
