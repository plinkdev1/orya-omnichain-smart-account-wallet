# CLI Scaffolding Tool - Design Document

## Overview

The ORŸA CLI Scaffolding Tool is an enterprise-grade code generation system for creating blockchain adapter scaffolds across 30+ chains with support for multiple programming languages.

## Design Improvements from Original Specification

### 1. **Modular Architecture**

**Original**: Single monolithic `main.ts` file (~600 lines)  
**Improved**: Separated into focused modules:

```
src/
├── main.ts               # CLI entry point (compact)
├── commands/             # Command handlers
├── generators/           # Template generators
└── utils/                # Reusable utilities
```

**Benefits**:
- Each module has a single responsibility
- Easier to test and maintain
- Simpler to extend with new commands
- Better error isolation

### 2. **External Configuration (YAML)**

**Original**: Hardcoded chain registry in TypeScript  
**Improved**: `config/chains.yaml` configuration file

**Why**:
- Non-engineers can update chain list
- Supports version control and diffs
- Easy to validate and merge
- Runtime-configurable without rebuild

### 3. **Type-Safe Validation**

**Original**: No validation layer  
**Improved**: Zod schema validation with descriptive errors

```typescript
const ChainConfigSchema = z.object({
  name: z.string().min(1),
  dirName: z.string().regex(/^[a-z0-9-]+$/),
  language: z.enum(['rust', 'typescript']),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  // ... more fields
});
```

**Benefits**:
- Catch configuration errors early
- Better error messages
- Type inference improvements

### 4. **Extensible Generator System**

**Original**: Separate generation methods for each language  
**Improved**: Factory pattern with base class

```typescript
// Factory creates appropriate generator
const generator = createGenerator(language, chainKey, config, path);

// Each generator extends BaseGenerator
class RustGenerator extends BaseGenerator { ... }
class TypeScriptGenerator extends BaseGenerator { ... }
```

**Benefits**:
- Add new languages without modifying core
- Consistent interface across generators
- Reduced code duplication
- Template logic reuse

### 5. **Custom Error Types**

**Original**: Generic Error throws  
**Improved**: Hierarchical error classes with codes

```typescript
class CLIError extends Error { code: string; }
class ChainNotFoundError extends CLIError { }
class AdapterExistsError extends CLIError { }
class ValidationError extends CLIError { }
```

**Benefits**:
- Programmatic error handling
- Better error messages for users
- Error context preserved
- Machine-readable error codes

### 6. **Comprehensive Utilities**

**Original**: Utility functions scattered  
**Improved**: Organized utility modules

```
utils/
├── config-loader.ts    # YAML configuration
├── validators.ts       # Zod schemas
├── errors.ts          # Error types
├── path-utils.ts      # File operations
└── index.ts           # Public API
```

**Each handles**:
- Config loading with caching
- Multi-layer validation
- Cross-platform path handling
- Proper error propagation

### 7. **Enhanced Template System**

**Original**: Hardcoded template strings in generators  
**Improved**: Structured template generation with interpolation

```typescript
private generateCargoToml(): string {
  return `[package]
name = "${this.config.dirName}"
// ... template with variables
`;
}

protected interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => 
    vars[key] || match
  );
}
```

**Benefits**:
- Cleaner template code
- Easy variable substitution
- Supports dynamic content generation
- Ready for external templates if needed

### 8. **Rich CLI Experience**

**Original**: Basic colored output  
**Improved**: Structured, user-friendly interface

- Clear command categorization (Tier 1, 2, 3, 4)
- Progress indicators
- Helpful next-step guidance
- Comprehensive help and examples
- Interactive mode with guided prompts

### 9. **Generated File Structure**

**Rust Adapter** generates:
- `Cargo.toml` - Properly configured with all common dependencies
- `src/lib.rs` - Module root with version constant
- `src/types.rs` - Common types (Address, Amount, Transaction)
- `src/error.rs` - Error enum with thiserror derive
- `src/client.rs` - Basic RPC client with health check
- `src/account.rs` - Account structure and balance method
- `src/transaction.rs` - TransactionBuilder with fluent API
- `src/dex/mod.rs` - DEX client stub for protocol integration
- `tests/integration.rs` - Integration test examples
- `.env.example` - Configuration template
- `README.md` - Complete documentation

**TypeScript Adapter** generates:
- `package.json` - Properly configured with tsup and vitest
- `tsconfig.json` - Strict TypeScript configuration
- `src/index.ts` - Main export file
- `src/types.ts` - TypeScript interfaces
- `src/error.ts` - Custom error classes
- `src/client.ts` - Axios-based HTTP client
- `src/account.ts` - Account class
- `src/transaction.ts` - TransactionBuilder
- `src/config.ts` - Configuration and constants
- `tests/client.test.ts` - Vitest unit tests
- `.env.example` - Environment template
- `README.md` - Complete documentation

### 10. **Developer Experience**

**Improvements**:
- Full TypeScript with strict mode
- Comprehensive test coverage
- ESLint and prettier configuration
- Vitest setup for testing
- Type checking validation
- Clean build output

## Architecture Decisions

### 1. ES Modules
- Using ESM (`"type": "module"` in package.json)
- Modern JavaScript standard
- Better tree-shaking
- Native import/export syntax

### 2. Configuration Loading with Caching
```typescript
class ConfigLoader {
  private chainsCache: Record<string, ChainConfig> | null = null;
  
  loadChains(): Record<string, ChainConfig> {
    if (this.chainsCache) return this.chainsCache;
    // ... load from YAML and cache
  }
}
```

### 3. Path Utilities
- Cross-platform path handling
- Automatic directory creation
- Existence checks and validation
- Recursive operations

### 4. Generator Base Class Pattern
- Shared utility methods (`interpolate`, `toPascalCase`, `toKebabCase`)
- Consistent file writing
- Template variable management
- Extensible for new languages

## Testing Strategy

### Unit Tests
- Validator tests (Zod schemas)
- Configuration loading tests
- Error type tests
- Path utility tests

### Integration Tests
- Full adapter generation
- File verification
- Configuration validation

### E2E Tests
- Command-line invocation
- Interactive mode flow
- Help and version output

## Future Enhancements

1. **Template Files** - External template system
   ```
   templates/rust/src/lib.rs.template
   templates/typescript/src/client.ts.template
   ```

2. **Plugins** - Custom generator plugins
   ```typescript
   interface GeneratorPlugin {
     generate(config: ChainConfig): GeneratedFile[];
   }
   ```

3. **Migrations** - Upgrading existing adapters
   ```bash
   orya-cli migrate-adapter <name> --version 2.0
   ```

4. **Adapter Registry** - Publishing and discovering adapters
   ```bash
   orya-cli publish-adapter
   orya-cli search-adapters --language rust --tier 1
   ```

5. **Custom Hooks** - Post-generation scripts
   ```yaml
   chains:
     aptos:
       onGenerate: "scripts/setup-aptos.sh"
   ```

## Security Considerations

1. **Path Validation** - No directory traversal
2. **Input Sanitization** - Chain names validated
3. **File Permissions** - Proper umask for created files
4. **No Secrets** - Templates never contain credentials
5. **Safe Overwrite** - Fails if directory exists

## Performance

- **Lazy Loading** - Configuration cached after first load
- **Parallel Generation** - Files written independently
- **Minimal Dependencies** - Only essential packages (chalk, inquirer, zod, js-yaml)
- **Fast CLI** - ~500ms startup time target

## Maintenance

- **Configuration** - Update `config/chains.yaml` for new chains
- **Templates** - Modify generator methods for template changes
- **Validation** - Update Zod schemas for configuration changes
- **Documentation** - Keep README and DESIGN updated

## Conclusion

The redesigned CLI scaffolding tool provides:
- ✅ **Professional architecture** - Modular and maintainable
- ✅ **Developer experience** - Rich feedback and guidance
- ✅ **Extensibility** - Easy to add chains and languages
- ✅ **Type safety** - Full TypeScript with validation
- ✅ **Production readiness** - Error handling and testing
- ✅ **Documentation** - Generated adapters include complete docs
