/**
 * EIP-712: Ethereum typed structured data hashing and signing
 * https://eips.ethereum.org/EIPS/eip-712
 *
 * Specifies encoding scheme for typed, structured data
 * Enables human-readable signing of complex messages
 */

export interface EIP712TypeProperty {
  name: string;
  type: string;
}

export interface EIP712Types {
  [key: string]: EIP712TypeProperty[] | undefined;
}

export interface EIP712Domain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

export interface EIP712TypedData<T extends EIP712Types = EIP712Types> {
  types: T;
  primaryType: string;
  domain: EIP712Domain;
  message: Record<string, unknown>;
}

export interface EIP712SignRequest<T extends EIP712Types = EIP712Types> {
  account: string;
  data: EIP712TypedData<T>;
}

export interface EIP712Signature {
  r: string;
  s: string;
  v: number;
}

export const EIP712_DOMAIN_TYPE_HASH =
  '0x8b73c3c69bb8d9d6f278e6e88675acb3c9bfce6ee457a6535b9d0b0df8ace592';

export const EIP712_STANDARD_TYPES: EIP712Types = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
    { name: 'salt', type: 'bytes32' },
  ],
};

export class EIP712Util {
  static encodeType(primaryType: string, types: EIP712Types): string {
    const dependencies = this.findTypeDependencies(primaryType, types);
    const typeStrings = [primaryType, ...Array.from(dependencies).sort()];

    return typeStrings
      .map((type) => {
        const fields = types[type] || [];
        return `${type}(${fields.map((f) => `${f.type} ${f.name}`).join(',')})`;
      })
      .join('');
  }

  private static findTypeDependencies(
    primaryType: string,
    types: EIP712Types,
    dependencies: Set<string> = new Set()
  ): Set<string> {
    if (dependencies.has(primaryType)) {
      return dependencies;
    }

    const typeDefinition = types[primaryType];
    if (!typeDefinition) {
      return dependencies;
    }

    dependencies.add(primaryType);

    for (const field of typeDefinition) {
      const type = this.getBaseType(field.type);
      if (types[type] && type !== primaryType && !dependencies.has(type)) {
        this.findTypeDependencies(type, types, dependencies);
      }
    }

    return dependencies;
  }

  static getBaseType(type: string): string {
    return type.match(/^\w+/)?.[0] || type;
  }

  static isArrayType(type: string): boolean {
    return type.endsWith(']');
  }

  static getArrayType(type: string): string {
    return type.slice(0, type.lastIndexOf('['));
  }

  static getArrayLength(type: string): number | null {
    const match = type.match(/\[(\d*)\]$/);
    if (!match) return null;
    return match[1] === '' ? null : parseInt(match[1], 10);
  }
}

export class EIP712TypeValidator {
  static isValidType(type: string): boolean {
    const atomicTypes = [
      'bool',
      'int',
      'uint',
      'int8',
      'int16',
      'int32',
      'int64',
      'int128',
      'int256',
      'uint8',
      'uint16',
      'uint32',
      'uint64',
      'uint128',
      'uint256',
      'bytes',
      'bytes1',
      'bytes2',
      'bytes4',
      'bytes8',
      'bytes16',
      'bytes32',
      'address',
      'string',
    ];

    const baseType = EIP712Util.getBaseType(type);

    if (atomicTypes.includes(baseType)) {
      return true;
    }

    if (EIP712Util.isArrayType(type)) {
      return this.isValidType(EIP712Util.getArrayType(type));
    }

    return false;
  }

  static validateDomain(domain: EIP712Domain): void {
    if (domain.chainId !== undefined && typeof domain.chainId !== 'number') {
      throw new Error('Invalid chainId in domain');
    }

    if (domain.verifyingContract !== undefined && !this.isValidAddress(domain.verifyingContract)) {
      throw new Error('Invalid verifyingContract address');
    }

    if (domain.salt !== undefined && !this.isValidBytes32(domain.salt)) {
      throw new Error('Invalid salt value');
    }
  }

  private static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private static isValidBytes32(value: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(value);
  }

  static validateMessage(message: Record<string, unknown>, types: EIP712Types, primaryType: string): void {
    const typeDefinition = types[primaryType];
    if (!typeDefinition) {
      throw new Error(`Type ${primaryType} not found in types`);
    }

    for (const field of typeDefinition) {
      if (!(field.name in message)) {
        throw new Error(`Missing field ${field.name} in message`);
      }
    }
  }
}

export class EIP712DomainSeparator {
  static hash(domain: EIP712Domain): string {
    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
        { name: 'salt', type: 'bytes32' },
      ],
    };

    const domainData = {
      name: domain.name || '',
      version: domain.version || '',
      chainId: domain.chainId || 0,
      verifyingContract: domain.verifyingContract || '0x' + '0'.repeat(40),
      salt: domain.salt || '0x' + '0'.repeat(64),
    };

    return EIP712Util.encodeType('EIP712Domain', types);
  }
}

export class EIP712Common {
  static permitTypedData(
    verifyingContract: string,
    chainId: number,
    owner: string,
    spender: string,
    value: string,
    nonce: number,
    deadline: number
  ): EIP712TypedData {
    return {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      primaryType: 'Permit',
      domain: {
        name: 'PERMIT',
        version: '1',
        chainId,
        verifyingContract,
      },
      message: {
        owner,
        spender,
        value,
        nonce,
        deadline,
      },
    };
  }

  static metaTransactionTypedData(
    chainId: number,
    verifyingContract: string,
    nonce: number,
    from: string,
    functionSignature: string
  ): EIP712TypedData {
    return {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        MetaTransaction: [
          { name: 'nonce', type: 'uint256' },
          { name: 'from', type: 'address' },
          { name: 'functionSignature', type: 'bytes' },
        ],
      },
      primaryType: 'MetaTransaction',
      domain: {
        name: 'Meta Transaction',
        version: '001',
        chainId,
        verifyingContract,
      },
      message: {
        nonce,
        from,
        functionSignature,
      },
    };
  }
}
