/* eslint-disable simple-import-sort/imports */
// Load the advert-type models before the journal barrel, which otherwise
// reads AdvertDepartmentModel before it is initialised (cyclic models).
// Import sorting would move this side-effect import last, hence the disable.
import '../advert-type/models'

import { Op } from 'sequelize'

import { UserRoleEnum } from '@dmr.is/constants'
import { CreateUserDto, UpdateUserDto, UserDto } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import type { AdvertInvolvedPartyModel } from '../journal/models'
import type { UserModel } from './models/user.model'
import type { UserInvolvedPartiesModel } from './models/user-involved-parties.model'
import type { UserRoleModel } from './models/user-role.model'
import { UserService } from './user.service'

const ROLES = {
  admin: { id: 'role-admin', title: UserRoleEnum.Admin },
  editor: { id: 'role-editor', title: UserRoleEnum.Editor },
  user: { id: 'role-user', title: UserRoleEnum.User },
}

type Party = string | { id: string }

describe('UserService authorization', () => {
  let users: Record<string, unknown>
  let userModel: {
    findByPk: jest.Mock
    destroy: jest.Mock
    create: jest.Mock
    findAndCountAll: jest.Mock
  }
  let userInvolvedPartiesModel: { destroy: jest.Mock; bulkCreate: jest.Mock }
  let service: UserService

  const dbUser = (
    id: string,
    role: { id: string; title: UserRoleEnum },
    parties: string[],
  ) => ({
    id,
    nationalId: '0000000000',
    firstName: 'A',
    lastName: 'B',
    displayName: 'A B',
    email: 'a@b.is',
    role,
    involvedParties: parties.map((partyId) => ({ id: partyId })),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    update: jest.fn(),
  })

  // As RoleGuard leaves it: involvedParties are id strings
  const caller = (
    role: { id: string; title: UserRoleEnum },
    parties: Party[],
  ): UserDto => ({ id: 'caller', role, involvedParties: parties }) as never

  beforeEach(() => {
    users = {}
    userModel = {
      findByPk: jest.fn((id: string) => Promise.resolve(users[id] ?? null)),
      destroy: jest.fn(),
      create: jest.fn((values: { roleId: string }) => {
        users.created = dbUser(
          'created',
          Object.values(ROLES).find((role) => role.id === values.roleId) ??
            ROLES.user,
          [],
        )
        return Promise.resolve({ id: 'created' })
      }),
      findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }),
    }
    userInvolvedPartiesModel = {
      destroy: jest.fn(),
      bulkCreate: jest.fn(),
    }
    const userRoleModel = {
      findByPk: jest.fn((id: string) =>
        Promise.resolve(
          Object.values(ROLES).find((role) => role.id === id) ?? null,
        ),
      ),
      findOne: jest.fn().mockResolvedValue(ROLES.user),
    }
    const logger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() }
    const sequelize = {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
      }),
    }

    service = new UserService(
      logger as never,
      userModel as unknown as typeof UserModel,
      userRoleModel as unknown as typeof UserRoleModel,
      {} as typeof AdvertInvolvedPartyModel,
      userInvolvedPartiesModel as unknown as typeof UserInvolvedPartiesModel,
      sequelize as never,
    )
  })

  const update = (target: string, body: Partial<UpdateUserDto>, by: UserDto) =>
    service.updateUser(target, body as UpdateUserDto, by)

  // A refusal, not some other failure: a thrown mock also gives ok === false
  const expectForbidden = (result: ResultWrapper<unknown>) => {
    expect(result.result).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: 403 }),
      }),
    )
  }

  describe('updateUser by an editor', () => {
    const editor = () => caller(ROLES.editor, ['party-a'])

    it('may update an editor in its own party', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update('target', { firstName: 'X' }, editor())
      expect(result.result.ok).toBe(true)
    })

    it('may not hand out the admin role', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update(
        'target',
        { roleId: ROLES.admin.id },
        editor(),
      )
      expectForbidden(result)
      expect(
        (users.target as { update: jest.Mock }).update,
      ).not.toHaveBeenCalled()
    })

    it('may not set an unknown role', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update('target', { roleId: 'role-x' }, editor())
      expectForbidden(result)
    })

    it('may not update an admin account', async () => {
      // In the editor's party, so only the admin-role check can refuse it
      users.target = dbUser('target', ROLES.admin, ['party-a'])
      const result = await update('target', { firstName: 'X' }, editor())
      expectForbidden(result)
      expect(
        (users.target as { update: jest.Mock }).update,
      ).not.toHaveBeenCalled()
    })

    it('may not update an account with no parties', async () => {
      users.target = dbUser('target', ROLES.editor, [])
      const result = await update('target', { firstName: 'X' }, editor())
      expectForbidden(result)
    })

    it('may not update an editor of another party', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-b'])
      const result = await update('target', { firstName: 'X' }, editor())
      expectForbidden(result)
    })

    it('may not assign a party it does not belong to', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update(
        'target',
        { involvedParties: ['party-a', 'party-b'] },
        editor(),
      )
      expectForbidden(result)
      expect(userInvolvedPartiesModel.bulkCreate).not.toHaveBeenCalled()
    })

    it('may not empty an account of its parties', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update('target', { involvedParties: [] }, editor())
      expectForbidden(result)
      expect(userInvolvedPartiesModel.destroy).not.toHaveBeenCalled()
    })
  })

  it('lets an admin hand out the admin role', async () => {
    users.target = dbUser('target', ROLES.editor, [])
    const result = await update(
      'target',
      { roleId: ROLES.admin.id },
      caller(ROLES.admin, []),
    )
    expect(result.result.ok).toBe(true)
  })

  describe('deleteUser by an editor', () => {
    it('may not delete an admin sharing its party', async () => {
      users.target = dbUser('target', ROLES.admin, ['party-a'])
      const result = await service.deleteUser(
        'target',
        caller(ROLES.editor, ['party-a']),
      )
      expectForbidden(result)
      expect(userModel.destroy).not.toHaveBeenCalled()
    })

    it.each([
      [
        'an account also in a party it is not in',
        ROLES.editor,
        ['party-a', 'party-b'],
      ],
      ['an account in another party', ROLES.editor, ['party-b']],
      ['an account with no parties', ROLES.editor, []],
      ['a user-role account in its party', ROLES.user, ['party-a']],
    ])('may not delete %s', async (_, role, parties) => {
      users.target = dbUser('target', role, parties)
      const result = await service.deleteUser(
        'target',
        caller(ROLES.editor, ['party-a']),
      )
      expectForbidden(result)
      expect(userModel.destroy).not.toHaveBeenCalled()
    })

    it('may delete an editor sharing its party', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await service.deleteUser(
        'target',
        caller(ROLES.editor, ['party-a']),
      )
      expect(result.result.ok).toBe(true)
    })
  })

  describe('createUser by an editor', () => {
    const create = (body: Partial<CreateUserDto>, by: UserDto) =>
      service.createUser(
        {
          nationalId: '0000000000',
          firstName: 'A',
          lastName: 'B',
          email: 'a@b.is',
          ...body,
        } as CreateUserDto,
        by,
      )

    it("creates a user-role account in the editor's own parties", async () => {
      const result = await create(
        { roleId: ROLES.editor.id, involvedParties: ['party-b'] },
        caller(ROLES.editor, ['party-a']),
      )
      expect(result.result.ok).toBe(true)
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: ROLES.user.id }),
        expect.anything(),
      )
      expect(userInvolvedPartiesModel.bulkCreate).toHaveBeenCalledWith(
        [{ userId: 'created', involvedPartyId: 'party-a' }],
        expect.anything(),
      )
    })

    it('may not create a user when it has no parties', async () => {
      const result = await create(
        { roleId: ROLES.editor.id },
        caller(ROLES.editor, []),
      )
      expectForbidden(result)
      expect(userModel.create).not.toHaveBeenCalled()
    })
  })

  it("lists only users in the editor's parties, whichever shape they arrive in", async () => {
    await service.getUsersByUserInvolvedParties(
      { page: 1, pageSize: 10 } as never,
      caller(ROLES.editor, ['party-a', { id: 'party-b' }]),
    )
    const [{ include }] = userModel.findAndCountAll.mock.calls[0]
    expect(include[0].where.id[Op.in]).toEqual(['party-a', 'party-b'])
  })
})
