import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resolvers } from './resolvers';
import { GraphQLContext, KYCStatus, FeatureType, KYCProvider } from './types';
import logger from './utils/logger';

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  userPreferences: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  protocolPreference: {
    upsert: vi.fn(),
  },
  autoSigningConfig: {
    update: vi.fn(),
    create: vi.fn(),
  },
};

const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
};

const mockDataLoaders = {
  userById: {
    load: vi.fn(),
  },
  userByEmail: {
    load: vi.fn(),
  },
  userPreferences: {
    load: vi.fn(),
  },
};

const mockPubSub = {
  asyncIterator: vi.fn(),
};

const createMockContext = (user = null): Partial<GraphQLContext> => ({
  user,
  userId: user?.id,
  prisma: mockPrisma as any,
  redis: mockRedis as any,
  dataloaders: mockDataLoaders as any,
  pubSub: mockPubSub as any,
  logger,
  req: { headers: {} },
});

describe('User Resolvers - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Tests', () => {
    describe('Query.me', () => {
      it('should return current user when authenticated', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          privyId: 'privy-1',
          firebaseUid: 'firebase-1',
          kycStatus: KYCStatus.NONE,
          advancedMode: false,
          preferences: { protocols: [], autoSigning: { enabled: false } },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Query.me(null, {}, context as any);
        expect(result).toEqual(mockUser);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          include: expect.any(Object),
        });
      });

      it('should throw error when not authenticated', async () => {
        const context = createMockContext(null);
        context.userId = undefined;

        await expect(resolvers.Query.me(null, {}, context as any)).rejects.toThrow();
      });

      it('should use dataloader for user lookup', async () => {
        const mockUser = {
          id: 'user-2',
          email: 'user2@example.com',
        };

        mockDataLoaders.userById.load.mockResolvedValue(mockUser);

        const context = createMockContext(null);
        context.userId = undefined;

        const result = await resolvers.Query.user(null, { id: 'user-2' }, context as any);
        expect(result).toEqual(mockUser);
      });
    });

    describe('Query.users (Admin listing)', () => {
      it('should return paginated users when admin', async () => {
        const mockUsers = [
          { id: 'user-1', email: 'user1@example.com', kycStatus: KYCStatus.APPROVED },
          { id: 'user-2', email: 'user2@example.com', kycStatus: KYCStatus.APPROVED },
        ];

        mockPrisma.user.count.mockResolvedValue(2);
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);

        const adminUser = { id: 'admin-1', email: 'admin@orya.io' };
        const context = createMockContext(adminUser);

        const result = await resolvers.Query.users(
          null,
          { pagination: { first: 10 } },
          context as any
        );

        expect(result.edges).toHaveLength(2);
        expect(result.pageInfo.totalCount).toBe(2);
        expect(result.totalCount).toBe(2);
      });

      it('should filter users by KYC status', async () => {
        const mockUsers = [
          { id: 'user-1', email: 'user1@example.com', kycStatus: KYCStatus.APPROVED },
        ];

        mockPrisma.user.count.mockResolvedValue(1);
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);

        const adminUser = { id: 'admin-1', email: 'admin@orya.io' };
        const context = createMockContext(adminUser);

        const result = await resolvers.Query.users(
          null,
          { filter: { kycStatus: KYCStatus.APPROVED }, pagination: { first: 10 } },
          context as any
        );

        expect(result.edges).toHaveLength(1);
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ kycStatus: KYCStatus.APPROVED }),
          })
        );
      });

      it('should throw error if not admin', async () => {
        const regularUser = { id: 'user-1', email: 'user@example.com' };
        const context = createMockContext(regularUser);

        await expect(
          resolvers.Query.users(null, { pagination: { first: 10 } }, context as any)
        ).rejects.toThrow();
      });

      it('should support search filter', async () => {
        mockPrisma.user.count.mockResolvedValue(1);
        mockPrisma.user.findMany.mockResolvedValue([]);

        const adminUser = { id: 'admin-1', email: 'admin@orya.io' };
        const context = createMockContext(adminUser);

        await resolvers.Query.users(
          null,
          { filter: { search: 'test' }, pagination: { first: 10 } },
          context as any
        );

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({ email: expect.any(Object) }),
                expect.objectContaining({ privyId: expect.any(Object) }),
              ]),
            }),
          })
        );
      });
    });
  });

  describe('Mutation Tests', () => {
    describe('Mutation.signup', () => {
      it('should create a new user with default preferences', async () => {
        const newUser = {
          id: 'user-1',
          email: 'newuser@example.com',
          privyId: expect.stringContaining('privy_'),
          firebaseUid: expect.stringContaining('firebase_'),
          kycStatus: KYCStatus.NONE,
          advancedMode: false,
          preferences: {
            defaultChain: 'sui',
            autoSigning: {
              enabled: false,
              thresholdUSD: 100,
              expiryHours: 24,
              maxDailyAmountUSD: 10000,
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue(newUser);
        mockRedis.setex.mockResolvedValue('OK');

        const context = createMockContext(null);

        const result = await resolvers.Mutation.signup(
          null,
          { email: 'newuser@example.com', password: 'password123' },
          context as any
        );

        expect(result.user).toEqual(newUser);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.expiresIn).toBe(86400);
        expect(mockPrisma.user.create).toHaveBeenCalled();
        expect(mockRedis.setex).toHaveBeenCalledWith(
          expect.stringContaining('user:'),
          300,
          expect.any(String)
        );
      });

      it('should throw error if user already exists', async () => {
        const existingUser = {
          id: 'user-1',
          email: 'existing@example.com',
        };

        mockPrisma.user.findUnique.mockResolvedValue(existingUser);

        const context = createMockContext(null);

        await expect(
          resolvers.Mutation.signup(
            null,
            { email: 'existing@example.com', password: 'password123' },
            context as any
          )
        ).rejects.toThrow('User already exists');
      });
    });

    describe('Mutation.login', () => {
      it('should login user with correct password', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          privyId: 'privy-1',
          firebaseUid: 'firebase-1',
          kycStatus: KYCStatus.NONE,
          passwordHash: '$2b$10$hashedpassword',
          preferences: { autoSigning: { enabled: false } },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockRedis.setex.mockResolvedValue('OK');
        vi.mock('./utils/crypto', () => ({
          verifyPassword: vi.fn().mockResolvedValue(true),
        }));

        const context = createMockContext(null);

        const result = await resolvers.Mutation.login(
          null,
          { email: 'test@example.com', password: 'password123' },
          context as any
        );

        expect(result.user).toEqual(mockUser);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      });

      it('should throw error for non-existent user', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const context = createMockContext(null);

        await expect(
          resolvers.Mutation.login(
            null,
            { email: 'nonexistent@example.com', password: 'password123' },
            context as any
          )
        ).rejects.toThrow('User not found');
      });

      it('should throw error for invalid password', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          passwordHash: '$2b$10$hashedpassword',
          preferences: {},
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        vi.mock('./utils/crypto', () => ({
          verifyPassword: vi.fn().mockResolvedValue(false),
        }));

        const context = createMockContext(null);

        await expect(
          resolvers.Mutation.login(
            null,
            { email: 'test@example.com', password: 'wrongpassword' },
            context as any
          )
        ).rejects.toThrow('Invalid credentials');
      });
    });

    describe('Mutation.refreshToken', () => {
      it('should refresh access token', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          preferences: { autoSigning: { enabled: false } },
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        vi.mock('./middleware/auth', () => ({
          verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'user-1' }),
        }));

        const context = createMockContext(null);

        const result = await resolvers.Mutation.refreshToken(
          null,
          { refreshToken: 'valid-refresh-token' },
          context as any
        );

        expect(result.user).toEqual(mockUser);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      });

      it('should throw error for invalid refresh token', async () => {
        vi.mock('./middleware/auth', () => ({
          verifyRefreshToken: vi.fn().mockReturnValue(null),
        }));

        const context = createMockContext(null);

        await expect(
          resolvers.Mutation.refreshToken(
            null,
            { refreshToken: 'invalid-token' },
            context as any
          )
        ).rejects.toThrow('Invalid refresh token');
      });
    });

    describe('Mutation.updateProfile', () => {
      it('should update user profile and invalidate cache', async () => {
        const updatedUser = {
          id: 'user-1',
          email: 'newemail@example.com',
          advancedMode: true,
          preferences: { autoSigning: { enabled: false } },
        };

        mockPrisma.user.update.mockResolvedValue(updatedUser);
        mockRedis.del.mockResolvedValue(1);

        const mockUser = { id: 'user-1', email: 'test@example.com' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.updateProfile(
          null,
          { input: { email: 'newemail@example.com', advancedMode: true } },
          context as any
        );

        expect(result.email).toBe('newemail@example.com');
        expect(result.advancedMode).toBe(true);
        expect(mockRedis.del).toHaveBeenCalledWith('user:user-1');
      });

      it('should throw error if not authenticated', async () => {
        const context = createMockContext(null);
        context.userId = undefined;

        await expect(
          resolvers.Mutation.updateProfile(
            null,
            { input: { email: 'new@example.com' } },
            context as any
          )
        ).rejects.toThrow();
      });
    });

    describe('Mutation.updatePreferences', () => {
      it('should update user preferences', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          preferences: {
            defaultChain: 'ethereum',
            hiddenTokens: ['token1'],
            favoriteProtocols: ['uniswap-v3'],
            autoSigning: { enabled: false },
          },
        };

        mockPrisma.userPreferences.update.mockResolvedValue({
          defaultChain: 'ethereum',
          hiddenTokens: ['token1'],
          favoriteProtocols: ['uniswap-v3'],
          autoSigning: { enabled: false },
        });
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockRedis.del.mockResolvedValue(1);

        const context = createMockContext({ id: 'user-1' });
        context.userId = 'user-1';

        const result = await resolvers.Mutation.updatePreferences(
          null,
          {
            input: {
              defaultChain: 'ethereum',
              hiddenTokens: ['token1'],
              favoriteProtocols: ['uniswap-v3'],
            },
          },
          context as any
        );

        expect(result).toBeDefined();
        expect(mockPrisma.userPreferences.update).toHaveBeenCalled();
      });
    });

    describe('Mutation.setAdvancedMode', () => {
      it('should enable advanced mode', async () => {
        const updatedUser = {
          id: 'user-1',
          email: 'test@example.com',
          advancedMode: true,
          preferences: { autoSigning: { enabled: false } },
        };

        mockPrisma.user.update.mockResolvedValue(updatedUser);
        mockRedis.del.mockResolvedValue(1);

        const mockUser = { id: 'user-1', email: 'test@example.com' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.setAdvancedMode(
          null,
          { enabled: true },
          context as any
        );

        expect(result.advancedMode).toBe(true);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          data: { advancedMode: true },
          include: expect.any(Object),
        });
        expect(mockRedis.del).toHaveBeenCalledWith('user:user-1');
      });

      it('should disable advanced mode', async () => {
        const updatedUser = {
          id: 'user-1',
          email: 'test@example.com',
          advancedMode: false,
          preferences: { autoSigning: { enabled: false } },
        };

        mockPrisma.user.update.mockResolvedValue(updatedUser);
        mockRedis.del.mockResolvedValue(1);

        const mockUser = { id: 'user-1', email: 'test@example.com' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.setAdvancedMode(
          null,
          { enabled: false },
          context as any
        );

        expect(result.advancedMode).toBe(false);
      });
    });

    describe('Mutation.setProtocolPreference', () => {
      it('should create protocol preference', async () => {
        const preference = {
          userId: 'user-1',
          chainId: 'ethereum',
          feature: FeatureType.SWAP,
          preferredProtocol: 'uniswap-v3',
          fallbackProtocols: ['uniswap-v2'],
          lastUpdated: new Date(),
        };

        mockPrisma.protocolPreference.upsert.mockResolvedValue(preference);
        mockRedis.del.mockResolvedValue(1);

        const mockUser = { id: 'user-1', email: 'test@example.com' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.setProtocolPreference(
          null,
          {
            chainId: 'ethereum',
            feature: FeatureType.SWAP,
            protocolId: 'uniswap-v3',
            fallbacks: ['uniswap-v2'],
          },
          context as any
        );

        expect(result.preferredProtocol).toBe('uniswap-v3');
        expect(result.fallbackProtocols).toEqual(['uniswap-v2']);
        expect(mockPrisma.protocolPreference.upsert).toHaveBeenCalled();
      });

      it('should update existing protocol preference', async () => {
        const preference = {
          userId: 'user-1',
          chainId: 'ethereum',
          feature: FeatureType.STAKE,
          preferredProtocol: 'lido',
          fallbackProtocols: ['rocket-pool'],
          lastUpdated: new Date(),
        };

        mockPrisma.protocolPreference.upsert.mockResolvedValue(preference);
        mockRedis.del.mockResolvedValue(1);

        const mockUser = { id: 'user-1', email: 'test@example.com' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.setProtocolPreference(
          null,
          {
            chainId: 'ethereum',
            feature: FeatureType.STAKE,
            protocolId: 'lido',
            fallbacks: ['rocket-pool'],
          },
          context as any
        );

        expect(result.preferredProtocol).toBe('lido');
      });

      it('should support multiple chains and features', async () => {
        const suiPreference = {
          chainId: 'sui',
          feature: FeatureType.SWAP,
          preferredProtocol: 'cetus',
          fallbackProtocols: ['aftermath'],
          lastUpdated: new Date(),
        };

        mockPrisma.protocolPreference.upsert.mockResolvedValue(suiPreference);
        mockRedis.del.mockResolvedValue(1);

        const mockUser = { id: 'user-1' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.setProtocolPreference(
          null,
          {
            chainId: 'sui',
            feature: FeatureType.SWAP,
            protocolId: 'cetus',
            fallbacks: ['aftermath'],
          },
          context as any
        );

        expect(result.chainId).toBe('sui');
      });
    });

    describe('Mutation.updateAutoSigningConfig', () => {
      it('should create auto-signing config', async () => {
        const mockPrefs = {
          id: 'prefs-1',
          userId: 'user-1',
          autoSigning: null,
        };

        const updatedConfig = {
          id: 'config-1',
          enabled: true,
          thresholdUSD: 500,
          expiryHours: 48,
          maxDailyAmountUSD: 5000,
          requireBiometric: true,
          whitelistedContracts: ['0x123'],
        };

        const updatedUser = {
          id: 'user-1',
          email: 'test@example.com',
          preferences: {
            autoSigning: updatedConfig,
          },
        };

        mockPrisma.userPreferences.findUnique.mockResolvedValue(mockPrefs);
        mockPrisma.autoSigningConfig.create.mockResolvedValue(updatedConfig);
        mockPrisma.user.findUnique.mockResolvedValue(updatedUser);
        mockRedis.del.mockResolvedValue(1);

        const mockUser = { id: 'user-1' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.updateAutoSigningConfig(
          null,
          {
            config: {
              enabled: true,
              thresholdUSD: 500,
              expiryHours: 48,
              maxDailyAmountUSD: 5000,
              requireBiometric: true,
              whitelistedContracts: ['0x123'],
            },
          },
          context as any
        );

        expect(result.preferences.autoSigning).toBeDefined();
        expect(mockPrisma.autoSigningConfig.create).toHaveBeenCalled();
      });

      it('should update existing auto-signing config', async () => {
        const mockPrefs = {
          id: 'prefs-1',
          userId: 'user-1',
          autoSigning: { id: 'config-1' },
        };

        const updatedConfig = {
          id: 'config-1',
          enabled: false,
          thresholdUSD: 1000,
          expiryHours: 24,
          maxDailyAmountUSD: 10000,
        };

        const updatedUser = {
          id: 'user-1',
          preferences: { autoSigning: updatedConfig },
        };

        mockPrisma.userPreferences.findUnique.mockResolvedValue(mockPrefs);
        mockPrisma.autoSigningConfig.update.mockResolvedValue(updatedConfig);
        mockPrisma.user.findUnique.mockResolvedValue(updatedUser);
        mockRedis.del.mockResolvedValue(1);

        const mockUser = { id: 'user-1' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.updateAutoSigningConfig(
          null,
          {
            config: {
              enabled: false,
              thresholdUSD: 1000,
              expiryHours: 24,
              maxDailyAmountUSD: 10000,
              requireBiometric: false,
            },
          },
          context as any
        );

        expect(result).toBeDefined();
        expect(mockPrisma.autoSigningConfig.update).toHaveBeenCalled();
      });

      it('should throw error if preferences not found', async () => {
        mockPrisma.userPreferences.findUnique.mockResolvedValue(null);

        const mockUser = { id: 'user-1' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        await expect(
          resolvers.Mutation.updateAutoSigningConfig(
            null,
            { config: { enabled: true, thresholdUSD: 500 } },
            context as any
          )
        ).rejects.toThrow('User preferences not found');
      });
    });

    describe('Mutation.initiateKYC', () => {
      it('should initiate KYC session with Sumsub', async () => {
        const mockUser = { id: 'user-1' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const result = await resolvers.Mutation.initiateKYC(
          null,
          { provider: KYCProvider.SUMSUB },
          context as any
        );

        expect(result.userId).toBe('user-1');
        expect(result.provider).toBe(KYCProvider.SUMSUB);
        expect(result.sessionId).toBeDefined();
        expect(result.externalUrl).toBeDefined();
        expect(result.status).toBe('PENDING');
        expect(result.expiresAt).toBeInstanceOf(Date);
      });

      it('should initiate KYC session with Persona', async () => {
        const mockUser = { id: 'user-2' };
        const context = createMockContext(mockUser);
        context.userId = 'user-2';

        const result = await resolvers.Mutation.initiateKYC(
          null,
          { provider: KYCProvider.PERSONA },
          context as any
        );

        expect(result.provider).toBe(KYCProvider.PERSONA);
        expect(result.sessionId).toBeDefined();
      });

      it('should throw error if not authenticated', async () => {
        const context = createMockContext(null);
        context.userId = undefined;

        await expect(
          resolvers.Mutation.initiateKYC(
            null,
            { provider: KYCProvider.SUMSUB },
            context as any
          )
        ).rejects.toThrow();
      });
    });

    describe('Mutation.submitKYCDocuments', () => {
      it('should submit KYC documents', async () => {
        const mockUser = { id: 'user-1' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const documents = [
          { filename: 'passport.pdf' },
          { filename: 'proof-of-address.pdf' },
        ];

        const result = await resolvers.Mutation.submitKYCDocuments(
          null,
          { sessionId: 'kyc_123', documents },
          context as any
        );

        expect(result.sessionId).toBe('kyc_123');
        expect(result.status).toBe('SUBMITTED');
        expect(result.documents).toHaveLength(2);
        expect(result.submittedAt).toBeInstanceOf(Date);
      });

      it('should handle documents without filename property', async () => {
        const mockUser = { id: 'user-1' };
        const context = createMockContext(mockUser);
        context.userId = 'user-1';

        const documents = ['doc1', 'doc2'];

        const result = await resolvers.Mutation.submitKYCDocuments(
          null,
          { sessionId: 'kyc_124', documents: documents as any },
          context as any
        );

        expect(result.documents).toEqual(['doc1', 'doc2']);
      });
    });
  });

  describe('Subscription Tests', () => {
    describe('Subscription.userUpdated', () => {
      it('should subscribe to user updates', () => {
        mockPubSub.asyncIterator.mockReturnValue(['update-event']);

        const context = createMockContext(null);
        context.pubSub = mockPubSub as any;

        const result = resolvers.Subscription.userUpdated.subscribe(
          null,
          { userId: 'user-1' },
          context as any
        );

        expect(result).toBeDefined();
        expect(mockPubSub.asyncIterator).toHaveBeenCalledWith(['USER_UPDATED_user-1']);
      });

      it('should handle missing pubSub', () => {
        const context = createMockContext(null);
        context.pubSub = undefined;

        const result = resolvers.Subscription.userUpdated.subscribe(
          null,
          { userId: 'user-1' },
          context as any
        );

        expect(result).toEqual([]);
      });
    });

    describe('Subscription.kycStatusChanged', () => {
      it('should subscribe to KYC status changes', () => {
        mockPubSub.asyncIterator.mockReturnValue(['status-change']);

        const context = createMockContext(null);
        context.pubSub = mockPubSub as any;

        const result = resolvers.Subscription.kycStatusChanged.subscribe(
          null,
          { userId: 'user-1' },
          context as any
        );

        expect(result).toBeDefined();
        expect(mockPubSub.asyncIterator).toHaveBeenCalledWith(['KYC_STATUS_user-1']);
      });
    });
  });

  describe('Field Resolvers', () => {
    describe('User.preferences', () => {
      it('should return cached preferences if available', async () => {
        const mockPrefs = {
          protocols: [],
          autoSigning: { enabled: false },
        };

        const user = {
          id: 'user-1',
          preferences: mockPrefs,
        };

        const context = createMockContext(null);

        const result = await resolvers.User.preferences(user as any, {}, context as any);

        expect(result).toEqual(mockPrefs);
        expect(mockDataLoaders.userPreferences.load).not.toHaveBeenCalled();
      });

      it('should use dataloader if preferences not cached', async () => {
        const mockPrefs = {
          protocols: [],
          autoSigning: { enabled: false },
        };

        mockDataLoaders.userPreferences.load.mockResolvedValue(mockPrefs);

        const user = {
          id: 'user-1',
          preferences: undefined,
        };

        const context = createMockContext(null);

        const result = await resolvers.User.preferences(user as any, {}, context as any);

        expect(result).toEqual(mockPrefs);
        expect(mockDataLoaders.userPreferences.load).toHaveBeenCalledWith('user-1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const mockUser = { id: 'user-1' };
      const context = createMockContext(mockUser);
      context.userId = 'user-1';

      await expect(resolvers.Query.me(null, {}, context as any)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'));

      const newUser = {
        id: 'user-1',
        email: 'test@example.com',
        preferences: { autoSigning: { enabled: false } },
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);

      const context = createMockContext(null);

      await expect(
        resolvers.Mutation.signup(
          null,
          { email: 'test@example.com', password: 'password123' },
          context as any
        )
      ).rejects.toThrow('Redis connection failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user list', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const adminUser = { id: 'admin-1', email: 'admin@orya.io' };
      const context = createMockContext(adminUser);

      const result = await resolvers.Query.users(
        null,
        { pagination: { first: 10 } },
        context as any
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should handle null input values', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        advancedMode: false,
        preferences: { autoSigning: { enabled: false } },
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockRedis.del.mockResolvedValue(1);

      const context = createMockContext(mockUser);
      context.userId = 'user-1';

      const result = await resolvers.Mutation.updateProfile(
        null,
        { input: {} },
        context as any
      );

      expect(result).toBeDefined();
    });

    it('should handle large pagination offsets', async () => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const adminUser = { id: 'admin-1', email: 'admin@orya.io' };
      const context = createMockContext(adminUser);

      const result = await resolvers.Query.users(
        null,
        { pagination: { first: 10, after: 'cursor-at-end' } },
        context as any
      );

      expect(result).toBeDefined();
    });
  });
});
