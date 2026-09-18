import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { UserModel } from './models/user.model'
import { DoeUserRole } from './types/user-role'
import { UserService } from './user.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const ADMIN_ID = '00000000-0000-0000-0000-00000000aaaa'
const EDITOR_ID = '00000000-0000-0000-0000-00000000bbbb'
const OTHER_ADMIN_ID = '00000000-0000-0000-0000-00000000cccc'

const baseUser = (overrides: Partial<UserModel> = {}) =>
  ({
    id: ADMIN_ID,
    nationalId: '0101302399',
    firstName: 'Gervi',
    lastName: 'Maður',
    email: 'gervi@example.is',
    phone: null,
    isActive: true,
    role: DoeUserRole.ADMIN,
    save: jest.fn().mockResolvedValue(undefined),
    fromModel(this: UserModel) {
      return UserModel.fromModel(this)
    },
    ...overrides,
  }) as unknown as UserModel

describe('UserService', () => {
  let service: UserService
  let findOne: jest.Mock
  let findByPkOrThrow: jest.Mock
  let findOneOrThrow: jest.Mock
  let findAll: jest.Mock
  let create: jest.Mock
  let count: jest.Mock

  beforeEach(async () => {
    findOne = jest.fn()
    findByPkOrThrow = jest.fn()
    findOneOrThrow = jest.fn()
    findAll = jest.fn()
    create = jest.fn()
    count = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(UserModel),
          useValue: {
            findOne,
            findByPkOrThrow,
            findOneOrThrow,
            findAll,
            create,
            count,
          },
        },
      ],
    }).compile()

    service = module.get(UserService)
  })

  // ── createUser ───────────────────────────────────────────────

  describe('createUser', () => {
    const input = {
      nationalId: '0101302399',
      firstName: 'Gervi',
      lastName: 'Maður',
      email: 'gervi@example.is',
      role: DoeUserRole.EDITOR,
    }

    it('creates a user when no conflict exists', async () => {
      findOne.mockResolvedValue(null)
      create.mockResolvedValue(baseUser({ role: DoeUserRole.EDITOR }))

      const result = await service.createUser(input)

      expect(create).toHaveBeenCalledWith({
        nationalId: input.nationalId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: null,
        role: input.role,
      })
      expect(result.role).toBe(DoeUserRole.EDITOR)
    })

    it('throws ConflictException when nationalId already exists', async () => {
      findOne.mockResolvedValue(
        baseUser({ nationalId: input.nationalId, email: 'other@example.is' }),
      )

      await expect(service.createUser(input)).rejects.toThrow(ConflictException)
      expect(create).not.toHaveBeenCalled()
    })

    it('throws ConflictException when email already exists', async () => {
      findOne.mockResolvedValue(
        baseUser({ nationalId: '9999999999', email: input.email }),
      )

      await expect(service.createUser(input)).rejects.toThrow(ConflictException)
    })
  })

  // ── updateUser ───────────────────────────────────────────────

  describe('updateUser', () => {
    it('updates allowed fields', async () => {
      const target = baseUser({
        id: EDITOR_ID,
        role: DoeUserRole.EDITOR,
      })
      findByPkOrThrow.mockResolvedValue(target)
      findOne.mockResolvedValue(null)

      await service.updateUser(
        EDITOR_ID,
        { firstName: 'New', lastName: 'Name', email: 'new@example.is' },
        ADMIN_ID,
      )

      expect(target.firstName).toBe('New')
      expect(target.lastName).toBe('Name')
      expect(target.email).toBe('new@example.is')
      expect(target.save).toHaveBeenCalled()
    })

    it('rejects self-demotion', async () => {
      const target = baseUser({ id: ADMIN_ID, role: DoeUserRole.ADMIN })
      findByPkOrThrow.mockResolvedValue(target)

      await expect(
        service.updateUser(
          ADMIN_ID,
          { role: DoeUserRole.EDITOR },
          ADMIN_ID,
        ),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects self-deactivation', async () => {
      const target = baseUser({ id: ADMIN_ID, role: DoeUserRole.ADMIN })
      findByPkOrThrow.mockResolvedValue(target)

      await expect(
        service.updateUser(ADMIN_ID, { isActive: false }, ADMIN_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects demoting the last active admin', async () => {
      const target = baseUser({ id: ADMIN_ID, role: DoeUserRole.ADMIN })
      findByPkOrThrow.mockResolvedValue(target)
      count.mockResolvedValue(0)

      await expect(
        service.updateUser(
          ADMIN_ID,
          { role: DoeUserRole.EDITOR },
          OTHER_ADMIN_ID,
        ),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects deactivating the last active admin', async () => {
      const target = baseUser({ id: ADMIN_ID, role: DoeUserRole.ADMIN })
      findByPkOrThrow.mockResolvedValue(target)
      count.mockResolvedValue(0)

      await expect(
        service.updateUser(ADMIN_ID, { isActive: false }, OTHER_ADMIN_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('allows demoting an admin when another active admin exists', async () => {
      const target = baseUser({ id: ADMIN_ID, role: DoeUserRole.ADMIN })
      findByPkOrThrow.mockResolvedValue(target)
      count.mockResolvedValue(1)

      await service.updateUser(
        ADMIN_ID,
        { role: DoeUserRole.EDITOR },
        OTHER_ADMIN_ID,
      )

      expect(target.role).toBe(DoeUserRole.EDITOR)
      expect(target.save).toHaveBeenCalled()
    })

    it('throws ConflictException when changing to an existing email', async () => {
      const target = baseUser({
        id: EDITOR_ID,
        role: DoeUserRole.EDITOR,
        email: 'old@example.is',
      })
      findByPkOrThrow.mockResolvedValue(target)
      findOne.mockResolvedValue(baseUser({ id: 'someone-else' }))

      await expect(
        service.updateUser(
          EDITOR_ID,
          { email: 'taken@example.is' },
          ADMIN_ID,
        ),
      ).rejects.toThrow(ConflictException)
    })

    it('propagates NotFoundException when target user does not exist', async () => {
      findByPkOrThrow.mockRejectedValue(new NotFoundException())

      await expect(
        service.updateUser(EDITOR_ID, { firstName: 'x' }, ADMIN_ID),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ── softDeleteUser ───────────────────────────────────────────

  describe('softDeleteUser', () => {
    it('sets isActive to false on the target user', async () => {
      const target = baseUser({ id: EDITOR_ID, role: DoeUserRole.EDITOR })
      findByPkOrThrow.mockResolvedValue(target)

      await service.softDeleteUser(EDITOR_ID, ADMIN_ID)

      expect(target.isActive).toBe(false)
      expect(target.save).toHaveBeenCalled()
    })

    it('is idempotent when the user is already inactive', async () => {
      const target = baseUser({
        id: EDITOR_ID,
        role: DoeUserRole.EDITOR,
        isActive: false,
      })
      findByPkOrThrow.mockResolvedValue(target)

      await service.softDeleteUser(EDITOR_ID, ADMIN_ID)

      expect(target.save).not.toHaveBeenCalled()
    })

    it('rejects self-deletion', async () => {
      await expect(service.softDeleteUser(ADMIN_ID, ADMIN_ID)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('rejects deleting the last active admin', async () => {
      const target = baseUser({ id: ADMIN_ID, role: DoeUserRole.ADMIN })
      findByPkOrThrow.mockResolvedValue(target)
      count.mockResolvedValue(0)

      await expect(
        service.softDeleteUser(ADMIN_ID, OTHER_ADMIN_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('allows deleting an admin when another active admin exists', async () => {
      const target = baseUser({ id: ADMIN_ID, role: DoeUserRole.ADMIN })
      findByPkOrThrow.mockResolvedValue(target)
      count.mockResolvedValue(1)

      await service.softDeleteUser(ADMIN_ID, OTHER_ADMIN_ID)

      expect(target.isActive).toBe(false)
      expect(target.save).toHaveBeenCalled()
    })
  })
})
