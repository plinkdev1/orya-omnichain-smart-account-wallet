export class CLIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CLIError';
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ChainNotFoundError extends CLIError {
  constructor(chainName: string) {
    super(
      'CHAIN_NOT_FOUND',
      `Chain '${chainName}' not found in configuration`,
      { chainName }
    );
  }
}

export class InvalidPathError extends CLIError {
  constructor(path: string, reason: string) {
    super('INVALID_PATH', `Invalid path: ${reason}`, { path, reason });
  }
}

export class AdapterExistsError extends CLIError {
  constructor(adapterPath: string) {
    super(
      'ADAPTER_EXISTS',
      `Adapter already exists at ${adapterPath}`,
      { adapterPath }
    );
  }
}

export class TemplateError extends CLIError {
  constructor(templateName: string, reason: string) {
    super('TEMPLATE_ERROR', `Template error for '${templateName}': ${reason}`, {
      templateName,
      reason,
    });
  }
}

export class ValidationError extends CLIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
  }
}
