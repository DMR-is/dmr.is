import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { IAWSService } from '@dmr.is/modules'

import { LegacyMigrationTokenModel } from '../../models/legacy-migration-token.model'
import { LegacySubscriberModel } from '../../models/legacy-subscriber.model'
import { SubscriberModel } from '../../models/subscriber.model'
import { LegacyMigrationService } from './legacy-migration.service'
import { ILegacyMigrationService } from './legacy-migration.service.interface'

// Test constants
const TEST_EMAIL = 'legacy@example.com'
const TEST_EMAIL_NO_KT = 'nokennitalal@example.com'
const TEST_NATIONAL_ID = '1234567890'
const OTHER_NATIONAL_ID = '0987654321'
const TEST_TOKEN = 'valid-token-123'
const EXPIRED_TOKEN = 'expired-token-456'
const USED_TOKEN = 'used-token-789'

// Mock DMR User
const createMockDMRUserWithPublicScope = (nationalId: string): DMRUser => {
  return {
    nationalId,
    name: 'Test User',
    fullName: 'Test User',
    scope: ['@dmr.is/lg-public-web'],
    authorization: 'Bearer some-jwt-token',
    client: 'dmr-web-client',
  }
}

// Mock legacy subscriber with kennitala
const createMockLegacySubscriberWithKt = () => ({
  id: 'legacy-1',
  name: 'Test User',
  email: TEST_EMAIL,
  nationalId: TEST_NATIONAL_ID,
  isActive: true,
  passwordHash: null,
  migratedAt: null,
  migratedToSubscriberId: null,
})

// Mock legacy subscriber without kennitala
const createMockLegacySubscriberWithoutKt = () => ({
  id: 'legacy-2',
  name: 'No KT User',
  email: TEST_EMAIL_NO_KT,
  nationalId: null,
  isActive: true,
  passwordHash: null,
  migratedAt: null,
  migratedToSubscriberId: null,
})

// Mock legacy subscriber already migrated
const createMockMigratedLegacySubscriber = () => ({
  id: 'legacy-3',
  name: 'Migrated User',
  email: 'migrated@example.com',
  nationalId: TEST_NATIONAL_ID,
  isActive: true,
  passwordHash: null,
  migratedAt: new Date(),
  migratedToSubscriberId: 'subscriber-1',
})

// Mock valid token
const createMockValidToken = () => ({
  id: 'token-1',
  token: TEST_TOKEN,
  email: TEST_EMAIL_NO_KT,
  targetNationalId: TEST_NATIONAL_ID,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  usedAt: null,
  legacySubscriberId: 'legacy-2',
  isValid: () => true,
  legacySubscriber: createMockLegacySubscriberWithoutKt(),
  save: jest.fn(),
})

// Mock expired token
const createMockExpiredToken = () => ({
  id: 'token-2',
  token: EXPIRED_TOKEN,
  email: TEST_EMAIL_NO_KT,
  targetNationalId: TEST_NATIONAL_ID,
  expiresAt: new Date(Date.now() - 1000), // Expired
  usedAt: null,
  legacySubscriberId: 'legacy-2',
  isValid: () => false,
  legacySubscriber: createMockLegacySubscriberWithoutKt(),
})

// Mock used token
const createMockUsedToken = () => ({
  id: 'token-3',
  token: USED_TOKEN,
  email: TEST_EMAIL_NO_KT,
  targetNationalId: TEST_NATIONAL_ID,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  usedAt: new Date(),
  legacySubscriberId: 'legacy-2',
  isValid: () => false,
  legacySubscriber: createMockLegacySubscriberWithoutKt(),
})

// Mock new subscriber
const createMockNewSubscriber = () => ({
  id: 'subscriber-new',
  nationalId: TEST_NATIONAL_ID,
  isActive: true,
  fromModel: () => ({
    id: 'subscriber-new',
    nationalId: TEST_NATIONAL_ID,
    isActive: true,
  }),
})

describe('LegacyMigrationService', () => {
  let service: ILegacyMigrationService
  let legacySubscriberModel: {
    findOne: jest.Mock
    update: jest.Mock
  }
  let legacyMigrationTokenModel: {
    findOne: jest.Mock
    create: jest.Mock
  }
  let subscriberModel: {
    create: jest.Mock
    findOrCreate: jest.Mock
    findOne: jest.Mock
  }
  let awsService: {
    sendMail: jest.Mock
  }

  beforeEach(async () => {
    // Reset all mocks
    legacySubscriberModel = {
      findOne: jest.fn(),
      update: jest.fn(),
    }

    legacyMigrationTokenModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    }

    subscriberModel = {
      create: jest.fn(),
      findOrCreate: jest.fn(),
      findOne: jest.fn(),
    }

    awsService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ILegacyMigrationService,
          useClass: LegacyMigrationService,
        },
        {
          provide: getModelToken(LegacySubscriberModel),
          useValue: legacySubscriberModel,
        },
        {
          provide: getModelToken(LegacyMigrationTokenModel),
          useValue: legacyMigrationTokenModel,
        },
        {
          provide: getModelToken(SubscriberModel),
          useValue: subscriberModel,
        },
        {
          provide: IAWSService,
          useValue: awsService,
        },
      ],
    }).compile()

    service = module.get<ILegacyMigrationService>(ILegacyMigrationService)
  })

  describe('checkLegacyEmail', () => {
    it('should return emailExists: true and hasKennitala: true when email exists with kennitala', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(
        createMockLegacySubscriberWithKt(),
      )

      const result = await service.checkLegacyEmail(TEST_EMAIL)

      expect(result).toEqual({
        emailExists: true,
        hasKennitala: true,
      })
      expect(legacySubscriberModel.findOne).toHaveBeenCalledWith({
        where: { email: TEST_EMAIL },
      })
    })

    it('should return emailExists: true and hasKennitala: false when email exists without kennitala', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(
        createMockLegacySubscriberWithoutKt(),
      )

      const result = await service.checkLegacyEmail(TEST_EMAIL_NO_KT)

      expect(result).toEqual({
        emailExists: true,
        hasKennitala: false,
      })
    })

    it('should return emailExists: false when email does not exist', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(null)

      const result = await service.checkLegacyEmail('nonexistent@example.com')

      expect(result).toEqual({
        emailExists: false,
        hasKennitala: false,
      })
    })

    it('should handle case-insensitive email lookup', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(
        createMockLegacySubscriberWithKt(),
      )

      await service.checkLegacyEmail('LEGACY@EXAMPLE.COM')

      // Service should normalize email to lowercase
      expect(legacySubscriberModel.findOne).toHaveBeenCalledWith({
        where: { email: 'legacy@example.com' },
      })
    })
  })

  describe('requestMigration', () => {
    it('should throw NotFoundException when email does not exist in legacy system', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(null)

      await expect(
        service.requestMigration('nonexistent@example.com', TEST_NATIONAL_ID),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when legacy user is already migrated', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(
        createMockMigratedLegacySubscriber(),
      )

      await expect(
        service.requestMigration('migrated@example.com', TEST_NATIONAL_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('should create a migration token and send email when legacy user exists', async () => {
      const legacyUser = createMockLegacySubscriberWithoutKt()
      legacySubscriberModel.findOne.mockResolvedValue(legacyUser)
      legacyMigrationTokenModel.create.mockResolvedValue({
        id: 'new-token',
        token: 'generated-token',
      })

      await service.requestMigration(TEST_EMAIL_NO_KT, TEST_NATIONAL_ID)

      // Should create token with correct data
      expect(legacyMigrationTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: TEST_EMAIL_NO_KT,
          targetNationalId: TEST_NATIONAL_ID,
          legacySubscriberId: legacyUser.id,
        }),
      )

      // Token should have 24-hour expiry
      const createCall = legacyMigrationTokenModel.create.mock.calls[0][0]
      const expiresAt = new Date(createCall.expiresAt)
      const now = new Date()
      const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
      expect(hoursDiff).toBeGreaterThan(23)
      expect(hoursDiff).toBeLessThanOrEqual(24)

      // Should send email
      expect(awsService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: TEST_EMAIL_NO_KT,
        }),
      )
    })

    it('should generate a cryptographically secure token', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(
        createMockLegacySubscriberWithoutKt(),
      )
      legacyMigrationTokenModel.create.mockResolvedValue({
        id: 'new-token',
        token: 'generated-token',
      })

      await service.requestMigration(TEST_EMAIL_NO_KT, TEST_NATIONAL_ID)

      const createCall = legacyMigrationTokenModel.create.mock.calls[0][0]
      // Token should be a UUID or at least 32 characters
      expect(createCall.token.length).toBeGreaterThanOrEqual(32)
    })
  })

  describe('completeMigration', () => {
    it('should throw NotFoundException when token does not exist', async () => {
      legacyMigrationTokenModel.findOne.mockResolvedValue(null)

      await expect(
        service.completeMigration(
          'invalid-token',
          createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
        ),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when token is expired', async () => {
      legacyMigrationTokenModel.findOne.mockResolvedValue(
        createMockExpiredToken(),
      )

      await expect(
        service.completeMigration(
          EXPIRED_TOKEN,
          createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
        ),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when token is already used', async () => {
      legacyMigrationTokenModel.findOne.mockResolvedValue(createMockUsedToken())

      await expect(
        service.completeMigration(
          USED_TOKEN,
          createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
        ),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when authenticated nationalId does not match token target', async () => {
      legacyMigrationTokenModel.findOne.mockResolvedValue(
        createMockValidToken(),
      )

      await expect(
        service.completeMigration(
          TEST_TOKEN,
          createMockDMRUserWithPublicScope(OTHER_NATIONAL_ID),
        ),
      ).rejects.toThrow(BadRequestException)
    })

    it('should create new subscriber and mark token as used on successful migration', async () => {
      const mockToken = createMockValidToken()
      legacyMigrationTokenModel.findOne.mockResolvedValue(mockToken)
      subscriberModel.findOrCreate.mockResolvedValue([
        createMockNewSubscriber(),
        true,
      ])
      legacySubscriberModel.update = jest.fn().mockResolvedValue([1])

      const result = await service.completeMigration(
        TEST_TOKEN,
        createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
      )

      // Should create subscriber with legacy user's data
      expect(subscriberModel.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { nationalId: TEST_NATIONAL_ID },
          defaults: expect.objectContaining({
            nationalId: TEST_NATIONAL_ID,
            isActive: true, // Legacy user was active
          }),
        }),
      )

      // Should mark token as used
      expect(mockToken.save).toHaveBeenCalled()

      // Should mark legacy subscriber as migrated
      expect(legacySubscriberModel.update).toHaveBeenCalled()

      // Should return the new subscriber
      expect(result).toEqual({
        id: 'subscriber-new',
        nationalId: TEST_NATIONAL_ID,
        isActive: true,
      })
    })

    it('should preserve legacy user isActive status in new subscriber', async () => {
      const inactiveUser = {
        ...createMockLegacySubscriberWithoutKt(),
        isActive: false,
      }
      const mockToken = {
        ...createMockValidToken(),
        legacySubscriber: inactiveUser,
      }
      legacyMigrationTokenModel.findOne.mockResolvedValue(mockToken)
      subscriberModel.findOrCreate.mockResolvedValue([
        {
          ...createMockNewSubscriber(),
          isActive: false,
          fromModel: () => ({
            id: 'subscriber-new',
            nationalId: TEST_NATIONAL_ID,
            isActive: false,
          }),
        },
        true,
      ])

      const result = await service.completeMigration(
        TEST_TOKEN,
        createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
      )

      expect(subscriberModel.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { nationalId: TEST_NATIONAL_ID },
          defaults: expect.objectContaining({
            nationalId: TEST_NATIONAL_ID,
            isActive: false,
          }),
        }),
      )
      expect(result.isActive).toBe(false)
    })
  })

  describe('autoMigrateByKennitala', () => {
    it('should return null when no legacy user exists with the kennitala', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(null)

      const result = await service.autoMigrateByKennitala(
        createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
      )

      expect(result).toBeNull()
      expect(legacySubscriberModel.findOne).toHaveBeenCalledWith({
        where: { nationalId: TEST_NATIONAL_ID },
      })
    })

    it('should return null when legacy user is already migrated', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(
        createMockMigratedLegacySubscriber(),
      )

      const result = await service.autoMigrateByKennitala(
        createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
      )

      expect(result).toBeNull()
      expect(subscriberModel.create).not.toHaveBeenCalled()
    })

    it('should create new subscriber and mark legacy user as migrated on auto-migration', async () => {
      const legacyUser = createMockLegacySubscriberWithKt()
      legacySubscriberModel.findOne.mockResolvedValue(legacyUser)
      subscriberModel.create.mockResolvedValue(createMockNewSubscriber())
      legacySubscriberModel.update = jest.fn().mockResolvedValue([1])

      const result = await service.autoMigrateByKennitala(
        createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
      )

      // Should create subscriber
      expect(subscriberModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nationalId: TEST_NATIONAL_ID,
          isActive: true,
        }),
      )

      // Should mark legacy user as migrated
      expect(legacySubscriberModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          migratedAt: expect.any(Date),
          migratedToSubscriberId: 'subscriber-new',
        }),
        expect.objectContaining({
          where: { id: legacyUser.id },
        }),
      )

      // Should return new subscriber
      expect(result).toEqual({
        id: 'subscriber-new',
        nationalId: TEST_NATIONAL_ID,
        isActive: true,
      })
    })

    it('should use name from dmr user if available', async () => {
      const legacyUser = {
        ...createMockLegacySubscriberWithKt(),
        name: 'Jón Jónsson',
      }
      legacySubscriberModel.findOne.mockResolvedValue(legacyUser)
      subscriberModel.create.mockResolvedValue(createMockNewSubscriber())

      await service.autoMigrateByKennitala(
        createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
      )

      expect(subscriberModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
        }),
      )
    })

    it('should use name legacy user if not in dmr user', async () => {
      const legacyUser = {
        ...createMockLegacySubscriberWithKt(),
        name: 'Jón Jónsson',
      }
      legacySubscriberModel.findOne.mockResolvedValue(legacyUser)
      subscriberModel.create.mockResolvedValue(createMockNewSubscriber())

      await service.autoMigrateByKennitala({
        ...createMockDMRUserWithPublicScope(TEST_NATIONAL_ID),
        name: '',
        fullName: '',
      })

      expect(subscriberModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jón Jónsson',
        }),
      )
    })
  })

  describe('Token security', () => {
    it('should generate unique tokens for each request', async () => {
      legacySubscriberModel.findOne.mockResolvedValue(
        createMockLegacySubscriberWithoutKt(),
      )
      const tokens: string[] = []
      legacyMigrationTokenModel.create.mockImplementation((data) => {
        tokens.push(data.token)
        return Promise.resolve({ id: 'token', token: data.token })
      })

      // Make multiple requests
      await service.requestMigration(TEST_EMAIL_NO_KT, TEST_NATIONAL_ID)
      await service.requestMigration(TEST_EMAIL_NO_KT, TEST_NATIONAL_ID)
      await service.requestMigration(TEST_EMAIL_NO_KT, TEST_NATIONAL_ID)

      // All tokens should be unique
      const uniqueTokens = new Set(tokens)
      expect(uniqueTokens.size).toBe(tokens.length)
    })
  })
})
